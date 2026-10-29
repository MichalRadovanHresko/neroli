// Generate an editable recipe draft or link to the premium upgrade.
import { Link } from "react-router-dom";

const GenerateCard = ({
  applyGenerated,
  generateError,
  generateRecipe,
  generated,
  generating,
  isPremium,
  scents,
  setGenerated,
}) => (
  <section className="mt-10 rounded-[28px] bg-[#F4F2EE] p-5">
    {/* Premium users can generate a draft; others see the upgrade link. */}
    <h2 className="text-xl font-normal">Generate recipe</h2>
    <p className="mt-1 text-xs text-[#696555]">
      {isPremium
        ? "Pick some ingredients first, or let Néroli choose them for you."
        : "Let Néroli build a draft for you with NÉROLI+."}
    </p>
    {isPremium ? (
      <button
        className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-[#696555] text-sm text-[#F4F2EE] shadow-[0_3px_4px_rgba(0,0,0,0.25)] disabled:opacity-60"
        type="button"
        onClick={generateRecipe}
        disabled={generating}
      >
        {generating ? "Generating..." : "Generate a recipe"}
      </button>
    ) : (
      <Link
        className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-[#696555] text-sm text-[#F4F2EE] shadow-[0_3px_4px_rgba(0,0,0,0.25)]"
        to="/premium"
      >
        Unlock with NÉROLI+
      </Link>
    )}
    {generateError && (
      <p className="mt-3 text-xs text-red-800" role="alert">
        {generateError}
      </p>
    )}
    {/* Let the user review a generated draft before applying or discarding it. */}
    {generated && (
      <div className="mt-4 rounded-2xl bg-white p-4">
        <p className="text-base">{generated.name}</p>
        {generated.subtitle && (
          <p className="text-xs text-[#696555]">{generated.subtitle}</p>
        )}
        <p className="mt-2 text-xs text-[#4E4934]">{generated.description}</p>
        <p className="mt-2 text-xs text-[#696555]">
          {(generated.scentIds ?? [])
            .map((id) => scents.find((scent) => scent.id === id)?.name)
            .filter(Boolean)
            .join(" · ")}
        </p>
        <div className="mt-4 flex gap-3">
          <button
            className="h-11 flex-1 rounded-full bg-[#696555] text-sm text-[#F4F2EE]"
            type="button"
            onClick={applyGenerated}
          >
            Use this recipe
          </button>
          <button
            className="h-11 flex-1 rounded-full bg-[#EAE3D6] text-sm"
            type="button"
            onClick={() => setGenerated(null)}
          >
            Discard
          </button>
        </div>
      </div>
    )}
  </section>
);

export default GenerateCard;
