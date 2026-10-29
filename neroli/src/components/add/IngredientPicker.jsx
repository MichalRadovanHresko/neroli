// Search available scents and add one to the recipe ingredients.
import { LuHeart, LuPlus, LuSearch } from "react-icons/lu";

const IngredientPicker = ({
  availableScents,
  favoriteIds,
  pickerOpen,

  search,
  setPickerOpen,
  setSearch,
  setSelectedIds,
}) => (
  <section className="mt-9">
    {/* Open a searchable list of scents that are not already selected. */}
    <button
      className="flex h-10 w-full items-center justify-center gap-3 rounded-full bg-[#4B4631] text-xs text-[#A8A28B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04]"
      type="button"
      onClick={() => setPickerOpen((current) => !current)}
      aria-expanded={pickerOpen}
    >
      Add ingredient <LuPlus className="size-4" aria-hidden="true" />
    </button>
    {pickerOpen && (
      <div className="mt-3 rounded-2xl bg-[#F4F2EE] p-3">
        <label className="flex h-10 items-center gap-2 rounded-full bg-white px-3">
          <LuSearch
            className="size-4 shrink-0 text-[#696555]"
            aria-hidden="true"
          />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search scents"
            aria-label="Search scents to add"
          />
        </label>
        {/* Favorite scents are marked so they are easy to spot. */}
        <div className="mt-2 max-h-56 overflow-y-auto">
          {availableScents.map((scent) => (
            <button
              className="flex w-full items-center gap-3 px-2 py-2 text-left"
              type="button"
              key={scent.id}
              onClick={() => {
                setSelectedIds((current) => [...current, scent.id]);
                setSearch("");
                setPickerOpen(false);
              }}
            >
              <span className="size-10 shrink-0 overflow-hidden rounded-xl bg-[#D6D2C6]">
                {scent.image_url && (
                  <img
                    className="size-full object-cover"
                    src={scent.image_url}
                    alt=""
                    loading="lazy"
                  />
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">
                {scent.name}
              </span>
              {favoriteIds.includes(scent.id) && (
                <LuHeart
                  className="size-4 shrink-0 fill-current"
                  aria-label="Favorite"
                />
              )}
              <LuPlus className="size-4 shrink-0" aria-hidden="true" />
            </button>
          ))}
          {availableScents.length === 0 && (
            <p className="px-2 py-3 text-sm text-[#696555]">
              No matching scents.
            </p>
          )}
        </div>
      </div>
    )}
  </section>
);

export default IngredientPicker;
