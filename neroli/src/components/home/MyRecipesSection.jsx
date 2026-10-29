import { Link } from "react-router-dom";
import { LuArrowUpRight } from "react-icons/lu";

// Help users resume their latest blend or start a recipe.
// Turn an edit timestamp into a short, readable label.
const formatEdited = (value) => {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (Number.isNaN(days) || days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
};

// Help users resume their latest blend or start a recipe.
const MyRecipesSection = ({
  continueTiles,
  latestIngredients,
  latestRecipe,
  navigate,
}) => (
  <section className="mb-18 sm:mb-19.5">
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-sans text-xl font-normal leading-tight sm:text-2xl">
          {latestRecipe ? "Your recipes" : "Continue your recipe"}
        </h2>
      </div>
      {latestRecipe && (
        <Link
          className="inline-flex shrink-0 items-center gap-1 border-b border-[#221B04]/55 pb-1 text-[11px]"
          to="/explore/all?type=mine"
        >
          See all <LuArrowUpRight className="size-3" aria-hidden="true" />
        </Link>
      )}
    </div>
    <article className="rounded-3xl bg-[#F4F2EE] px-5 py-6 sm:px-10 sm:py-8">
      <div className="flex items-center justify-between gap-3 text-[9px] text-[#221B04]/70">
        <span>01</span>
        <span>{latestRecipe ? "Latest" : "Tone"}</span>
      </div>
      <h3 className="mt-4 text-center text-xl font-normal sm:text-2xl">
        {latestRecipe ? latestRecipe.name : "Warm & Sweet"}
      </h3>
      {/* Show the recipe’s ingredients as links to their details. */}
      <div
        className="mx-auto my-4 grid max-w-105 grid-cols-3 gap-3 sm:my-5 sm:gap-4"
        aria-label="Recipe ingredients"
      >
        {continueTiles.map((tile) => (
          <Link
            className="relative aspect-[1.15] overflow-hidden rounded-[14px] bg-[#D8D1C1] focus-visible:outline-2 focus-visible:outline-offset-2"
            key={tile.key}
            to={tile.to}
            aria-label={`More info about ${tile.name}`}
          >
            {tile.image_url && (
              <img
                className="absolute inset-0 size-full object-cover"
                src={tile.image_url}
                alt={tile.name}
                loading="lazy"
              />
            )}
          </Link>
        ))}
      </div>
      <p className="mb-5 text-center text-xs text-[#221B04]">
        {latestRecipe
          ? `${latestIngredients.length} ingredient${latestIngredients.length === 1 ? "" : "s"} · Last edited ${formatEdited(latestRecipe.updated_at)}`
          : "3 ingredients · Last edited today"}
      </p>
      <button
        className="flex h-11 w-full items-center justify-center rounded-[23.603px] bg-[#696555] text-xs text-[#D8D1C1] shadow-[0_3.147px_3.147px_0_rgba(0,0,0,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04]"
        type="button"
        onClick={() =>
          navigate(latestRecipe ? `/recipes/${latestRecipe.id}` : "/add")
        }
      >
        {latestRecipe ? "Continue recipe" : "Create recipe"}
      </button>
    </article>
  </section>
);

export default MyRecipesSection;
