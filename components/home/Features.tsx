import React from "react";
import { FeatureCard } from "./FeatureCard";
import { CalendarDaysIcon, DollarSign, SparklesIcon, ShieldCheckIcon } from "lucide-react";

export const Features = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">
            The CleanNami Difference
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<CalendarDaysIcon className="h-8 w-8 text-white" />}
            title="Seamless Automation"
            description="Set up your property once. Every booking is automatically scheduled with all your preferences integrated."
          />
          <FeatureCard
            icon={<DollarSign />}
            title="Transparent Pricing"
            description="No hidden fees. See the exact flat-rate price upfront, and it stays the same for every single turnover."
          />
          <FeatureCard
            icon={<SparklesIcon />}
            title="Turnkey Turnovers"
            description="We don’t just clean—we stage beds, restock essentials, and prepare your property for a five-star guest impression."
          />
          <FeatureCard
            icon={<ShieldCheckIcon />}
            title="Guaranteed Reliability"
            description="With GPS-verified cleaners and a tiered backup system, your turnovers get done on time, every time. Period."
          />
        </div>
      </div>
    </section>
  );
};
