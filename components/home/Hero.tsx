
import { BottomCTA } from "./BottomCTA";

export const Hero = () => {
  return (
    <section className="relative h-screen md:h-[70vh] flex items-center justify-center text-white text-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1611222566360-ef1f0a8c6451?q=80&w=2070&auto=format&fit=crop')",
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
      </div>
      <div className="relative z-10 p-4">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Five-Star Cleans. Zero Effort.
        </h1>
        <p className="mt-4 mb-6 text-lg md:text-xl max-w-3xl mx-auto text-gray-200">
          The automated turnover service for vacation rental hosts who demand
          perfection. Sync your calendar and we&apos;ll handle the rest.
        </p>
        <BottomCTA />
      </div>
    </section>
  );
}
