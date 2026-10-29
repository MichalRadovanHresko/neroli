import { Link } from "react-router-dom";

// Provide the recipe owner with edit and delete controls.
const OwnerActions = ({ deleteError, deleteRecipe, deleting, recipe }) => (
  <div className="mt-10 space-y-3 px-3">
    <Link
      className="flex h-12 w-full items-center justify-center rounded-[23.603px] bg-[#D6CFBC] text-sm font-medium shadow-[0_3.147px_3.147px_0_rgba(0,0,0,0.1)]"
      to={`/recipes/${recipe.id}/edit`}
    >
      Edit recipe
    </Link>
    {deleteError && (
      <p className="text-sm text-red-800" role="alert">
        {deleteError}
      </p>
    )}
    <button
      className="flex h-12 w-full items-center justify-center rounded-[23.603px] bg-[#221B04] text-sm font-medium text-white shadow-[0_3.147px_3.147px_0_rgba(0,0,0,0.25)] disabled:opacity-60"
      type="button"
      onClick={deleteRecipe}
      disabled={deleting}
    >
      {deleting ? "Deleting..." : "Delete"}
    </button>
  </div>
);

export default OwnerActions;
