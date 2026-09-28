import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { BlogDto } from "./blogs.dto";

const DEFAULT_BYLINE = "Time Space & Planets";

const slugify = (title: string) =>
  title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 100)
    .replace(/^-+|-+$/g, "") || "article";

/** About 200 words a minute, at least one. */
const readMinutes = (markdown: string) => Math.max(1, Math.round(markdown.split(/\s+/).filter(Boolean).length / 200));

/** A plain-text summary when no excerpt was written. */
const autoExcerpt = (markdown: string) => {
  const text = markdown
    .split("\n")
    .filter((line) => !line.trim().startsWith("|")) // tables read badly as prose
    .join("\n")
    .replace(/<[^>]*>/g, "")
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)]\((?:[^()]|\([^)]*\))*\)/g, "$1")
    .replace(/[#>*_`~|]|^\s*-\s|(?<=\s)-(?=\s)/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 200 ? `${text.slice(0, 197).trimEnd()}…` : text;
};

const LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  category: true,
  coverImageUrl: true,
  byline: true,
  published: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

type Row = Prisma.BlogGetPayload<{ select: typeof LIST_SELECT }>;

const summary = ({ content, ...b }: Row) => ({
  ...b,
  excerpt: b.excerpt || autoExcerpt(content),
  byline: b.byline || DEFAULT_BYLINE,
  readMinutes: readMinutes(content),
});

@Injectable()
export class BlogsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Public ────────────────────────────────────────────────────────────────

  async listPublished() {
    const rows = await this.prisma.blog.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      select: LIST_SELECT,
      take: 200,
    });
    return rows.map(summary);
  }

  async getPublished(slug: string) {
    const row = await this.prisma.blog.findFirst({ where: { slug, published: true }, select: LIST_SELECT });
    if (!row) throw new NotFoundException("Article not found.");
    return { ...summary(row), content: row.content };
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  async listAll() {
    const rows = await this.prisma.blog.findMany({
      orderBy: { updatedAt: "desc" },
      select: { ...LIST_SELECT, author: { select: { name: true } } },
    });
    return rows.map(({ author, ...r }) => ({ ...summary(r), authorName: author.name }));
  }

  async get(id: string) {
    const row = await this.prisma.blog.findUnique({ where: { id }, select: LIST_SELECT });
    if (!row) throw new NotFoundException("Article not found.");
    return { ...summary(row), excerpt: row.excerpt, byline: row.byline, content: row.content };
  }

  async create(authorId: string, dto: BlogDto) {
    const slug = await this.freeSlug(dto.slug || slugify(dto.title));
    const created = await this.prisma.blog.create({
      data: {
        ...this.fields(dto),
        slug,
        authorId,
        published: !!dto.published,
        publishedAt: dto.published ? new Date() : null,
      },
    });
    return this.get(created.id);
  }

  async update(id: string, dto: BlogDto) {
    const current = await this.prisma.blog.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Article not found.");
    const slug = dto.slug && dto.slug !== current.slug ? await this.freeSlug(dto.slug, id) : current.slug;
    await this.prisma.blog.update({
      where: { id },
      data: {
        ...this.fields(dto),
        slug,
        ...(dto.published !== undefined && {
          published: dto.published,
          // Keep the original publication date when an article is edited or re-published.
          publishedAt: dto.published ? (current.publishedAt ?? new Date()) : current.publishedAt,
        }),
      },
    });
    return this.get(id);
  }

  async remove(id: string) {
    const { count } = await this.prisma.blog.deleteMany({ where: { id } });
    if (!count) throw new NotFoundException("Article not found.");
    return { success: true };
  }

  private fields(dto: BlogDto) {
    return {
      title: dto.title.trim(),
      excerpt: dto.excerpt?.trim() || null,
      content: dto.content,
      category: dto.category,
      coverImageUrl: dto.coverImageUrl?.trim() || null,
      byline: dto.byline?.trim() || null,
    };
  }

  /** The requested address, or it with -2, -3… if another article has it. */
  private async freeSlug(wanted: string, exceptId?: string) {
    for (let n = 1; n < 50; n++) {
      const candidate = n === 1 ? wanted : `${wanted}-${n}`;
      const taken = await this.prisma.blog.findFirst({ where: { slug: candidate, ...(exceptId && { id: { not: exceptId } }) }, select: { id: true } });
      if (!taken) return candidate;
    }
    throw new ConflictException("Choose a different web address for this article.");
  }
}
