import Image from "next/image";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream relative overflow-hidden">
      
      {/* Background glow effect for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/5 via-cream to-cream" />

      <div className="text-center relative z-10 flex flex-col items-center">
        <div className="relative w-48 h-48 md:w-64 md:h-64 mb-8">
          <Image 
            src="/images/cosmic-wheel.png" 
            alt="Aligning cosmic energies..." 
            fill 
            className="object-contain animate-spin-clockwise-60 filter drop-shadow-[0_0_20px_rgba(246,160,0,0.3)]"
            priority
          />
        </div>
        
        <h2 className="font-heading text-2xl font-bold text-dark mb-2 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-navy via-navy to-gold">
          Consulting the Stars
        </h2>
        <p className="text-paragraph text-sm font-medium tracking-wider uppercase opacity-75 animate-pulse">
          Aligning energies...
        </p>
      </div>
    </div>
  );
}
