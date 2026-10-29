import { LuCheck, LuShieldCheck } from "react-icons/lu";

// Explain the basic workflow for making a perfume blend.
// Break the guidance into clear, ordered steps.
const guideSteps = [
  {
    title: "Safety first",
    text: "Never apply undiluted fragrance materials. Use cosmetic-grade supplies, avoid flames with alcohol, and check ingredient restrictions and allergens before blending.",
    bullets: [
      "Choose skin-safe perfumery materials and a suitable perfume base.",
      "Dilute only within the supplier's material-specific dilution/IFRA limits.",
      "Do not use candle fragrance oils or rubbing alcohol.",
      "A patch test does not establish safety; it only helps you notice immediate irritation.",
    ],
  },
  {
    title: "Gather clean glass vessels",
    text: "Use clean glass pipettes, a precise scale, labels, and a small trial vessel for every blend.",
  },
  {
    title: "Choose a scent direction",
    text: "Start with a direction such as citrus, floral, or amber. Perfume is built in three layers: top notes for the opening, heart notes for the middle, and base notes for the dry down.",
    bullets: [
      "Top notes: the first impression; bright, quick-to-evaporate notes such as citrus.",
      "Heart notes: the character of the blend; florals, herbs and spices that emerge as the opening fades.",
      "Base notes: the foundation; woods, resins and musks that linger the longest.",
    ],
  },
  {
    title: "Build a small trial accord",
    text: "Start with 1-5 ingredients and keep the total weight small. Measure every ingredient, and record each addition immediately.",
    bullets: [
      "Choose a perfume base such as ethanol, jojoba, or fractionated coconut oil.",
      "Keep the first trial small so you can refine it without wasting materials.",
      "Record every ingredient, weight, and supplier so you can reproduce the blend later.",
    ],
  },
  {
    title: "Rest, label, and evaluate",
    text: "Seal the trial, label it, and let it rest on blotters, then adjust one ingredient at a time.",
    bullets: [
      "Rest the trial for at least 24 hours before you judge the character.",
      "Evaluate on blotters first. Only consider skin use after the blend is within the supplier's dilution limits and allergens are checked.",
      "Adjust one ingredient at a time so you can see what changed.",
    ],
  },
  {
    title: "Bottle and document",
    text: "Once the scent is stable, bottle the final recipe and keep the formula, supplier notes, and batch details for future reproduction.",
    bullets: [
      "Keep a record of every ingredient, weight, supplier, and batch date.",
      "Store the final bottle away from heat, light, and children.",
      "If you share the recipe, include the supplier's safety notes and any allergens.",
    ],
  },
];

// Explain the basic workflow for making a perfume blend.
const GuideSection = () => (
  <section className="mb-12">
    <p className="text-[10px] uppercase tracking-wide text-[#696555]">
      The private atelier
    </p>
    <h2 className="mt-3 font-serif text-[32px] font-medium leading-[.95]">
      Make your own perfume
    </h2>
    <p className="mt-3 text-sm text-[#221B04]/80">
      A beginner-friendly guide to choosing notes, measuring safely, and
      refining a fragrance you can wear.
    </p>
    {/* Each card pairs one step with any extra safety or technique tips. */}
    <ol className="mt-6 space-y-3">
      {guideSteps.map((step, index) => (
        <li className="rounded-3xl bg-[#F4F2EE] p-5" key={step.title}>
          <div className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#D6D2C6] text-xs">
              {index === 0 ? (
                <LuShieldCheck className="size-4" aria-hidden="true" />
              ) : (
                String(index).padStart(2, "0")
              )}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold">{step.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#696555]">
                {step.text}
              </p>
            </div>
          </div>
          {step.bullets && (
            <ul className="mt-4 space-y-2">
              {step.bullets.map((bullet) => (
                <li className="flex items-start gap-2" key={bullet}>
                  <LuCheck
                    className="mt-0.5 size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-xs leading-relaxed text-[#696555]">
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  </section>
);

export default GuideSection;
