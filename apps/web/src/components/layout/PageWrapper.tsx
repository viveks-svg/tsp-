import { cn } from "@/lib/cn";

interface PageWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export default function PageWrapper({
  children,
  title,
  description,
  className,
}: PageWrapperProps) {
  return (
    <section
      className={cn("min-h-screen bg-cream pt-[125px] pb-12 lg:pt-[140px] lg:pb-16", className)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(title || description) && (
          <header className="mb-8 lg:mb-10 text-center max-w-2xl mx-auto">
            {title && (
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-dark mb-3">
                {title}
              </h1>
            )}
            {description && (
              <p className="font-body text-paragraph text-sm md:text-base leading-relaxed">
                {description}
              </p>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
