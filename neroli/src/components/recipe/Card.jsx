// Provide a consistent titled container for recipe details.
const Card = ({ title, action, children }) => (
  <section className="rounded-3xl bg-[#D6CFBC] p-5 shadow-[0_2px_8px_rgba(34,27,4,0.06)]">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xl font-normal">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

export default Card;
