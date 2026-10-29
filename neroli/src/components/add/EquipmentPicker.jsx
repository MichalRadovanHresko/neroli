// Choose suggested equipment or add a custom item to the recipe.
import { LuPlus, LuX } from "react-icons/lu";
import { PRODUCTS } from "../../lib/shopProducts";

const EquipmentPicker = ({
  addEquipment,
  customEquipment,
  equipment,
  equipmentOpen,
  hasEquipment,
  setCustomEquipment,
  setEquipmentOpen,
  toggleEquipment,
}) => (
  <section className="mt-14">
    {/* Selected equipment stays visible while the picker is closed. */}
    <h2 className="text-xl font-normal">Equipment used</h2>
    <div className="mt-6 rounded-[28px] bg-[#F4F2EE] p-3.5">
      {!equipmentOpen && equipment.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {equipment.map((name) => (
            <span
              className="inline-flex items-center gap-2 rounded-full bg-[#EAE3D6] py-1.5 pl-3.5 pr-2 text-xs"
              key={name}
            >
              {name}
              <button
                className="grid size-4 place-items-center rounded-full bg-[#696555]/15"
                type="button"
                aria-label={`Remove ${name}`}
                onClick={() => toggleEquipment(name)}
              >
                <LuX className="size-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
      <button
        className="flex h-11 w-full items-center justify-center gap-3 rounded-full bg-[#4B4631] text-xs text-[#A8A28B]"
        type="button"
        onClick={() => setEquipmentOpen((open) => !open)}
        aria-expanded={equipmentOpen}
      >
        {equipmentOpen ? "Done" : "Add equipment"}
        {equipmentOpen ? (
          <LuX className="size-4" aria-hidden="true" />
        ) : (
          <LuPlus className="size-4" aria-hidden="true" />
        )}
      </button>
      {/* Show suggested and custom equipment options while editing. */}
      {equipmentOpen && (
        <div className="mt-3">
          <div className="flex flex-col items-start gap-2">
            {[
              ...PRODUCTS,
              ...equipment
                .filter(
                  (name) =>
                    !PRODUCTS.some(
                      (product) =>
                        product.name.toLowerCase() === name.toLowerCase(),
                    ),
                )
                .map((name) => ({ name })),
            ].map((product) => {
              const active = hasEquipment(product.name);
              return (
                <button
                  className={`flex items-center gap-3 rounded-full py-1 pl-1 pr-5 text-sm ${
                    active ? "bg-[#4B4631] text-[#E8E2D6]" : "bg-[#EAE3D6]"
                  } ${product.image ? "" : "pl-5"}`}
                  type="button"
                  key={product.name}
                  aria-pressed={active}
                  onClick={() => toggleEquipment(product.name)}
                >
                  {product.image && (
                    <img
                      className="size-9 rounded-full bg-white object-cover"
                      src={product.image}
                      alt=""
                    />
                  )}
                  {product.name}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              className="h-10 min-w-0 flex-1 rounded-full bg-[#EAE3D6] px-4 text-sm outline-none placeholder:text-[#B9B4A5] focus-visible:ring-2 focus-visible:ring-[#696555]"
              value={customEquipment}
              onChange={(event) => setCustomEquipment(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addEquipment(customEquipment);
                  setCustomEquipment("");
                }
              }}
              placeholder="Or type your own equipment"
              aria-label="Custom equipment name"
            />
            <button
              className="grid size-10 place-items-center rounded-full bg-[#4B4631] text-[#A8A28B]"
              type="button"
              aria-label="Add equipment"
              onClick={() => {
                addEquipment(customEquipment);
                setCustomEquipment("");
              }}
            >
              <LuPlus className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  </section>
);

export default EquipmentPicker;
