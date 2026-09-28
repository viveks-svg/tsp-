import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders article Markdown in the house style. Raw HTML in the source is not
 * rendered (react-markdown's default), so an article can't inject scripts.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="font-inter text-[17px] leading-[1.8] text-ink-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2 className="mt-12 mb-4 font-playfair text-3xl font-semibold text-ink">{children}</h2>,
          h2: ({ children }) => <h2 className="mt-12 mb-4 font-playfair text-[28px] leading-tight font-semibold text-ink">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-9 mb-3 font-playfair text-[22px] font-semibold text-ink">{children}</h3>,
          h4: ({ children }) => <h4 className="mt-8 mb-2 font-cinzel text-[13px] font-semibold tracking-[0.2em] text-bronze uppercase">{children}</h4>,
          p: ({ children }) => <p className="my-5">{children}</p>,
          a: ({ href, children }) => {
            const external = !!href && /^https?:\/\//.test(href);
            return (
              <a
                href={href}
                {...(external && { target: "_blank", rel: "noopener noreferrer" })}
                className="font-medium text-regal underline decoration-champagne/60 underline-offset-4 hover:decoration-champagne"
              >
                {children}
              </a>
            );
          },
          ul: ({ children }) => <ul className="my-5 list-disc space-y-2 pl-6 marker:text-champagne">{children}</ul>,
          ol: ({ children }) => <ol className="my-5 list-decimal space-y-2 pl-6 marker:text-bronze">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="my-8 border-l-2 border-champagne bg-parchment/60 py-3 pr-4 pl-6 font-playfair text-[20px] leading-relaxed text-ink italic">
              {children}
            </blockquote>
          ),
          hr: () => <div aria-hidden className="my-10 h-px bg-gradient-to-r from-transparent via-champagne/60 to-transparent" />,
          img: ({ src, alt }) =>
            typeof src === "string" && /^(https:\/\/|\/)/.test(src) ? (
              // Authors paste image links from anywhere, so a plain <img> rather than next/image.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={alt ?? ""} loading="lazy" className="my-8 w-full rounded-2xl border border-hairline" />
            ) : null,
          strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
          code: ({ children }) => <code className="rounded bg-parchment px-1.5 py-0.5 text-[15px] text-ink">{children}</code>,
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto">
              <table className="w-full border-collapse text-[15px]">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border-b border-hairline px-3 py-2 text-left font-semibold text-ink">{children}</th>,
          td: ({ children }) => <td className="border-b border-hairline px-3 py-2">{children}</td>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
