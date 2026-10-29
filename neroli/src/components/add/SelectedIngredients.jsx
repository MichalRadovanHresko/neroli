// Show chosen scent ingredients and allow each one to be removed.
import { LuMinus } from "react-icons/lu";

const SelectedIngredients = ({
  loadingScents,
  scents,
  selectedScents,
  setSelectedIds,
}) => (
  <section className="mt-6" aria-label="Recipe ingredients">
    {/* Display loading state, selected scents, and an empty catalog notice. */}
    {loadingScents && (
      <p className="text-sm text-[#696555]">Loading scents...</p>
    )}
    <div className="grid grid-cols-3 gap-4 sm:max-w-md sm:gap-6">
      {selectedScents.map((scent) => (
        <div className="min-w-0" key={scent.id}>
          <div className="relative aspect-square">
            <div className="size-full overflow-hidden rounded-[20px] bg-[#F4F2EE]">
              {scent.image_url && (
                <img
                  className="size-full object-cover"
                  src={scent.image_url}
                  alt={scent.name}
                />
              )}
            </div>
            <button
              className="absolute -right-1 -top-1 z-10 grid size-8 place-items-center rounded-full bg-[#9B8461] text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04]"
              type="button"
              aria-label={`Remove ${scent.name}`}
              onClick={() =>
                setSelectedIds((current) =>
                  current.filter((id) => id !== scent.id),
                )
              }
            >
              <LuMinus className="size-3" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-2 truncate text-center text-xs text-[#696555]">
            {scent.name}
          </p>
        </div>
      ))}
    </div>
    {!loadingScents && scents.length === 0 && (
      <p className="text-sm text-[#696555]">No scents available.</p>
    )}
  </section>
);

export default SelectedIngredients;
