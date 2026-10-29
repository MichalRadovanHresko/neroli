import { Link } from "react-router-dom";
import { LuHeart, LuSquarePen } from "react-icons/lu";

// Show a recipe’s main image, title, labels, and primary actions.
const RecipeHero = ({
  backButton,
  heroImage,
  isOwner,
  isPremium,
  isSaved,
  recipe,
  savePending,
  toggleSave,
}) => (
  <header className="relative flex min-h-95 flex-col justify-end overflow-hidden bg-[#696555] px-5 pb-6 text-white">
    {heroImage && (
      <img
        className="absolute inset-0 size-full object-cover"
        src={heroImage}
        alt=""
        fetchPriority="high"
      />
    )}
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(34,27,4,0)_0%,rgba(34,27,4,0.45)_100%)]" />
    {backButton}
    {/* Owners can edit; other visitors can save the recipe instead. */}
    {isOwner ? (
      <Link
        className="absolute right-4 top-5 z-10 grid size-10 place-items-center rounded-full bg-[#F7F5F0] text-black"
        to={`/recipes/${recipe.id}/edit`}
        aria-label="Edit recipe"
      >
        <LuSquarePen className="size-5" aria-hidden="true" />
      </Link>
    ) : (
      <button
        className="absolute right-4 top-5 z-10 grid size-10 place-items-center rounded-full bg-[#F7F5F0] text-black disabled:opacity-60"
        type="button"
        onClick={toggleSave}
        disabled={savePending}
        aria-pressed={isSaved}
        aria-label={isSaved ? "Remove from saved" : "Save recipe"}
      >
        <LuHeart
          className={`size-5 ${isSaved ? "text-[#696555]" : ""}`}
          fill={isSaved ? "currentColor" : "none"}
          aria-hidden="true"
        />
      </button>
    )}
    {/* Display recipe categories and the main title over the image. */}
    <div className="relative">
      <div className="flex flex-wrap gap-2">
        {[
          isPremium ? "Premium" : "Community",
          ...(recipe.badges ?? []).filter(
            (badge) => !["premium", "community"].includes(badge.toLowerCase()),
          ),
        ].map((badge) => (
          <span
            className="rounded-full bg-[#F7F5F0] px-3 py-1 text-xs text-[#221B04]"
            key={badge}
          >
            {badge}
          </span>
        ))}
      </div>
      <h1 className="mt-3 font-serif text-3xl uppercase leading-tight">
        {recipe.name}
      </h1>
      {recipe.short_description && (
        <p className="mt-2 max-w-md text-sm leading-snug text-white/90">
          {recipe.short_description}
        </p>
      )}
    </div>
  </header>
);

export default RecipeHero;
