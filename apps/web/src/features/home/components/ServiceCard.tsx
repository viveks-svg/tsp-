import { cn } from "@/lib/cn";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: string;
  index?: number;
}

export default function ServiceCard({
  title,
  description,
}: ServiceCardProps) {
  return (
    <div
      className={cn(
        "group bg-white/95 backdrop-blur-sm rounded-2xl p-6",
        "shadow-[0_4px_20px_rgba(0,0,0,0.04)]",
        "card-premium",
        "border border-[#F0ECE4] text-center"
      )}
    >
      {/* Icon circle */}
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:border-gold/40 transition-all duration-400">
        <svg className="w-6 h-6 text-gold" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C12 2 8 6 8 10C8 12.21 9.79 14 12 14C14.21 14 16 12.21 16 10C16 6 12 2 12 2ZM12 12.5C10.62 12.5 9.5 11.38 9.5 10C9.5 7.85 11 5.27 12 3.77C13 5.27 14.5 7.85 14.5 10C14.5 11.38 13.38 12.5 12 12.5Z" />
          <path d="M5.5 10C5.5 10 3 12.5 3 15C3 16.66 4.34 18 6 18C7.66 18 9 16.66 9 15C9 12.5 5.5 10 5.5 10Z" opacity="0.6" />
          <path d="M18.5 10C18.5 10 15 12.5 15 15C15 16.66 16.34 18 18 18C19.66 18 21 16.66 21 15C21 12.5 18.5 10 18.5 10Z" opacity="0.6" />
          <path d="M12 14C12 14 8.5 17 8.5 20C8.5 21.38 9.62 22.5 11 22.5C11.55 22.5 12 22.05 12 21.5C12 22.05 12.45 22.5 13 22.5C14.38 22.5 15.5 21.38 15.5 20C15.5 17 12 14 12 14Z" opacity="0.4" />
        </svg>
      </div>

      {/* Title */}
      <h3 className="font-heading text-lg font-bold text-[#1A1A1A] mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-[#6B6B6B] text-sm leading-relaxed mb-5">
        {description}
      </p>

      {/* Gradient line instead of hard gold line */}
      <div className="gradient-line-gold mx-auto my-3"></div>

      {/* View more link */}
      <span className="inline-flex items-center text-sm font-semibold text-[#071B8D] group-hover:text-gold transition-colors duration-300 cursor-pointer uppercase tracking-[0.1em]">
        View More
        <svg
          className="w-4 h-4 ml-1.5 group-hover:translate-x-1.5 transition-transform duration-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </span>
    </div>
  );
}
