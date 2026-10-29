import { Link } from "react-router-dom";

// Reuse a linked recipe preview across the profile lists.
const RecipeRow = ({ recipe, image, caption }) => (
  <Link
    className="flex items-center gap-4 rounded-2xl bg-[#F7F5F0] p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04]"
    to={`/recipes/${recipe.id}${recipe.isPremium ? "?premium=1" : ""}`}
  >
    <span className="block size-24 shrink-0 overflow-hidden rounded-xl bg-[#D6D2C6]">
      {image && (
        <img
          className="size-full object-cover"
          src={image}
          alt=""
          loading="lazy"
        />
      )}
    </span>
    <span className="min-w-0">
      <span className="block truncate text-sm font-semibold">
        {recipe.name}
      </span>
      <span className="mt-2 block text-xs text-[#696555]">{caption}</span>
    </span>
  </Link>
);

export default RecipeRow;
