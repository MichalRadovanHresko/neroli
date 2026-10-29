import Card from "./Card";

// Present recipe instructions in their intended order.
const StepsCard = ({ steps }) => (
  <Card title="Step by step">
    <ol className="mt-4 space-y-4">
      {steps.map((step, index) => (
        <li className="flex gap-3" key={step.position ?? index}>
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#696555] text-xs text-white">
            {step.position ?? index + 1}
          </span>
          <p className="text-sm leading-snug text-[#696555]">{step.text}</p>
        </li>
      ))}
    </ol>
  </Card>
);

export default StepsCard;
