
import { SignupModal } from "../customers/cta-booking-button";

export const BottomCTA = () => {
  return (
    <section className="bg-transparent text-white">
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold">Ready for Effortless Turnovers?</h2>
        <p className="mt-2 mb-6 text-lg text-gray-300">
          Get your no-obligation quote in under 60 seconds.
        </p>
        <SignupModal />
      </div>
    </section>
  );
};
