// Choose whether the saved recipe is private or visible to everyone.
const VisibilityToggle = ({ isPublic, setIsPublic }) => (
  <section className="mt-14">
    {/* Present visibility choices as an accessible radio group. */}
    <h2 className="text-xl font-normal">Recipe visibility</h2>
    <div
      className="mt-5 space-y-2 rounded-[28px] bg-[#F4F2EE] p-3"
      role="radiogroup"
      aria-label="Recipe visibility"
    >
      {[
        {
          value: false,
          label: "Private",
          text: "Only you can see this recipe.",
        },
        {
          value: true,
          label: "Public",
          text: "Anyone can discover and view this recipe.",
        },
      ].map((option) => (
        <button
          className="flex w-full items-center gap-3 rounded-[20px] bg-[#E8E2D6] p-4 text-left"
          type="button"
          role="radio"
          aria-checked={isPublic === option.value}
          key={option.label}
          onClick={() => setIsPublic(option.value)}
        >
          <span className="grid size-5 shrink-0 place-items-center rounded-full border-2 border-[#696555]">
            {isPublic === option.value && (
              <span className="size-2.5 rounded-full bg-[#696555]" />
            )}
          </span>
          <span>
            <span className="block text-sm font-semibold">{option.label}</span>
            <span className="mt-0.5 block text-xs text-[#696555]">
              {option.text}
            </span>
          </span>
        </button>
      ))}
    </div>
  </section>
);

export default VisibilityToggle;
