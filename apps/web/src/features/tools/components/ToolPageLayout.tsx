import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface RelatedTool {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  categoryLabel: string;
}

interface ToolPageLayoutProps {
  title: string;
  description: string;
  categoryLabel: string;
  categoryHref: string;
  breadcrumbItems: BreadcrumbItem[];
  seoContent?: ReactNode;
  relatedTools?: RelatedTool[];
  structuredSchema?: Record<string, any>;
  children: ReactNode;
}

export default function ToolPageLayout({
  title,
  description,
  categoryLabel,
  categoryHref,
  breadcrumbItems,
  seoContent,
  relatedTools = [],
  structuredSchema,
  children,
}: ToolPageLayoutProps) {
  return (
    <div className="min-h-screen bg-cream pt-[125px] pb-8 lg:pt-[140px] lg:pb-12">
      {structuredSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredSchema) }}
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs font-poppins text-muted mb-6 overflow-x-auto whitespace-nowrap pb-2">
          <Link href="/" className="hover:text-navy transition-colors">
            Home
          </Link>
          {breadcrumbItems.map((item, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted/60" />
              {item.href ? (
                <Link href={item.href} className="hover:text-navy transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-dark font-medium truncate max-w-[200px]">{item.label}</span>
              )}
            </div>
          ))}
        </nav>

        {/* Page Header */}
        <header className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cream-dark border border-gold/20 rounded-full text-xs font-semibold text-gold mb-3 font-poppins">
            {categoryLabel}
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-dark mb-4">
            {title}
          </h1>
          <p className="font-body text-paragraph text-sm md:text-base max-w-3xl leading-relaxed">
            {description}
          </p>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              {children}
            </div>

            {/* Educational / SEO Content */}
            {seoContent && (
              <div className="bg-card rounded-2xl p-6 border border-border shadow-card prose prose-sm max-w-none">
                {seoContent}
              </div>
            )}
          </div>

          {/* Sidebar */}
          {relatedTools.length > 0 && (
            <aside className="space-y-6">
              <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
                <h3 className="font-heading text-lg font-bold text-dark border-b border-border pb-3 mb-4">
                  Related Calculators
                </h3>
                <div className="space-y-4">
                  {relatedTools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={tool.href}
                      className="block p-3.5 rounded-xl border border-transparent hover:border-border hover:bg-cream/50 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl shrink-0 p-1.5 bg-cream border border-border rounded-lg group-hover:bg-white transition-colors">
                          {tool.icon}
                        </span>
                        <div>
                          <span className="block text-sm font-semibold text-dark group-hover:text-navy transition-colors font-poppins">
                            {tool.title}
                          </span>
                          <span className="block text-xs text-muted leading-relaxed mt-1 line-clamp-2">
                            {tool.description}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
