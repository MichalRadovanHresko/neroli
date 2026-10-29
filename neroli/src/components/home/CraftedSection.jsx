import { Link } from "react-router-dom";
import { LuArrowUpRight } from "react-icons/lu";

// Feature a selected scent and link visitors to the scent library.
const CraftedSection = ({ craftedScent, navigate }) => (
  <section className="mb-12">
    {/* Keep the section heading and the library shortcut together. */}
    <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
      <div>
        <h2 className="font-sans text-xl font-normal leading-tight sm:text-2xl">
          Crafted with intention
        </h2>
      </div>
      <button
        className="inline-flex shrink-0 items-center gap-1 border-b border-[#221B04]/55 pb-1 text-[11px]"
        type="button"
        onClick={() => navigate("/shop")}
      >
        See all <LuArrowUpRight className="size-3" aria-hidden="true" />
      </button>
    </div>
    {/* Link the full card to the featured scent, or show a loading state. */}
    <Link
      className="block overflow-hidden rounded-[22px] bg-[#F4F2EE] text-left"
      to={craftedScent ? `/scents/${craftedScent.id}` : "/scents"}
      aria-label={
        craftedScent
          ? `Explore ${craftedScent.name}`
          : "Loading a crafted scent"
      }
      aria-busy={!craftedScent}
    >
      <span className="relative block aspect-[1.1] w-full overflow-hidden bg-[#D6D2C6] sm:aspect-[1.6]">
        {craftedScent ? (
          <img
            src={craftedScent.image_url}
            alt={`${craftedScent.name} scent`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-xs text-[#221B04]/70">
            Loading a scent...
          </span>
        )}
      </span>
      {craftedScent && (
        <span className="flex items-center gap-4 px-6 pb-6 pt-5">
          <span className="min-w-0 flex-1">
            <span className="line-clamp-2 block font-serif text-[28px] uppercase leading-tight tracking-wide">
              {craftedScent.name}
            </span>
            <span className="mt-2 line-clamp-2 block text-sm leading-snug">
              {craftedScent.short_description || craftedScent.scent_family}
            </span>
          </span>
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#EAE3D6]">
            <LuArrowUpRight className="size-4" aria-hidden="true" />
          </span>
        </span>
      )}
    </Link>
  </section>
);

export default CraftedSection;
