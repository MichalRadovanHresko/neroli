import { Link } from "react-router-dom";

// Feature the user’s latest favorite scent and link to the favorites page.
const FavoritesSection = ({ favoriteScent, navigate }) => (
  <section className="mb-17 sm:mb-19">
    <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
      <div>
        <h2 className="font-sans text-xl font-normal leading-tight sm:text-2xl">
          Your recent favorites
        </h2>
      </div>
      <button
        className="inline-flex shrink-0 items-center gap-1 border-b border-[#221B04]/55 pb-1 text-[11px]"
        type="button"
        onClick={() => navigate("/favorites")}
      >
        See all
      </button>
    </div>
    {/* Keep the whole favorite card linked to the favorites page. */}
    <Link
      className="block overflow-hidden rounded-[22px] bg-[#F4F2EE] text-left"
      to="/favorites"
      aria-label="View all favorite scents"
    >
      <img
        src={favoriteScent.image_url}
        alt={`${favoriteScent.name} scent`}
        className="aspect-[1.4] w-full bg-[#696555] object-cover object-center sm:aspect-[2]"
      />
      <span className="block px-6 pb-5 pt-5">
        <span className="line-clamp-2 block font-serif text-lg uppercase leading-tight tracking-wide">
          {favoriteScent.name}
        </span>
        <span className="mt-1.5 line-clamp-1 block text-sm text-[#696555]">
          {favoriteScent.short_description || favoriteScent.scent_family}
        </span>
        <span className="mt-4 block text-xs text-[#696555]">
          View favorite scents
        </span>
      </span>
    </Link>
  </section>
);

export default FavoritesSection;
