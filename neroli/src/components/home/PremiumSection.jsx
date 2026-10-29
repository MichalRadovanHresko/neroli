import { Link } from "react-router-dom";
import { LuBookOpen, LuLink2 } from "react-icons/lu";

// Preview premium tools and link to the membership information page.
const PremiumSection = () => (
  <section className="mb-14">
    <p className="text-[10px] uppercase tracking-wide text-[#696555]">
      The private atelier
    </p>
    <h2 className="mt-3 font-serif text-[32px] font-medium leading-[.95]">
      A deeper fragrance experience.
    </h2>
    <p className="mt-3 text-sm text-[#221B04]/80">
      Unlock exclusive recipes, smart suggestions and personal insights.
    </p>
    {/* Summarize two premium benefits before the membership link. */}
    <div className="mt-5 grid grid-cols-2 gap-3">
      <div className="rounded-2xl bg-[#F4F2EE] p-4">
        <LuBookOpen className="size-5" aria-hidden="true" />
        <h3 className="mt-3 text-sm font-semibold">Exclusive recipes</h3>
        <p className="mt-1 text-xs text-[#696555]">
          Curated blends from perfumers and our community.
        </p>
      </div>
      <div className="rounded-2xl bg-[#F4F2EE] p-4">
        <LuLink2 className="size-5" aria-hidden="true" />
        <h3 className="mt-3 text-sm font-semibold">Smart pairings</h3>
        <p className="mt-1 text-xs text-[#696555]">
          Discover which notes go best together.
        </p>
      </div>
    </div>
    <Link
      className="mt-4 flex h-11 w-full items-center justify-center rounded-[23.603px] bg-[#E5CCA1] text-sm font-medium shadow-[0_3.147px_3.147px_0_rgba(0,0,0,0.15)]"
      to="/premium"
    >
      Get NÉROLI+
    </Link>
  </section>
);

export default PremiumSection;
