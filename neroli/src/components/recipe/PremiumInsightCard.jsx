// Explain why the app recommends this curated premium recipe.
const PremiumInsightCard = () => (
  <section className="rounded-3xl bg-[#F4F2EE] p-5 shadow-[0_2px_8px_rgba(34,27,4,0.06)]">
    <div className="flex items-center gap-3">
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#221B04] font-serif text-[8px] uppercase text-[#E2CFA3]">
        Néroli
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold">Neroli suggestion</h2>
        <p className="text-xs text-[#C9B98A]">Posted by the app</p>
      </div>
      <span className="shrink-0 rounded-full bg-[#E2CFA3] px-3 py-1 text-xs font-semibold">
        Safe to use
      </span>
    </div>
    <p className="mt-4 text-sm leading-relaxed text-[#696555]">
      This recipe is an official Neroli suggestion posted by the app. It is
      intended to be a safe, everyday fragrance option and is presented here as
      a curated suggestion from the app.
    </p>
  </section>
);

export default PremiumInsightCard;
