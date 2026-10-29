// Edit the ordered instructions that explain how to make the recipe.
import { LuMinus, LuPlus } from "react-icons/lu";

const StepsEditor = ({ setSteps, steps }) => (
  <section className="mt-14" id="steps-section">
    {/* The first step is required; later steps can be added or removed. */}
    <h2 className="text-xl font-normal">Recipe steps</h2>
    <div className="mt-6 rounded-[28px] bg-[#F4F2EE] p-3.5">
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li className="rounded-[20px] bg-[#EAE3D6] p-3.5" key={index}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold">Step {index + 1}</span>
              <span className="flex items-center gap-2">
                <span className="rounded-full bg-[#D6D0C0] px-2.5 py-0.5 text-[11px] font-medium text-[#696555]">
                  {index === 0 ? "Required" : "Optional"}
                </span>
                {steps.length > 1 && (
                  <button
                    className="grid size-5 place-items-center rounded-full bg-[#9B8461] text-white"
                    type="button"
                    aria-label={`Remove step ${index + 1}`}
                    onClick={() =>
                      setSteps((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <LuMinus className="size-3" aria-hidden="true" />
                  </button>
                )}
              </span>
            </div>
            <textarea
              className="mt-2 min-h-12 w-full resize-y bg-transparent text-sm outline-none placeholder:text-[#B9B4A5]"
              value={step}
              onChange={(event) =>
                setSteps((current) =>
                  current.map((item, i) =>
                    i === index ? event.target.value : item,
                  ),
                )
              }
              placeholder={
                index === 0
                  ? "Describe the first step of your recipe..."
                  : "Add the next action..."
              }
              aria-label={`Step ${index + 1}`}
              required={index === 0}
            />
          </li>
        ))}
      </ol>
      <button
        className="mt-3 flex h-11 w-full items-center justify-center gap-3 rounded-full bg-[#4B4631] text-xs text-[#A8A28B]"
        type="button"
        onClick={() => setSteps((current) => [...current, ""])}
      >
        Add step <LuPlus className="size-4" aria-hidden="true" />
      </button>
    </div>
  </section>
);

export default StepsEditor;
