import Card from "./Card";

// Show descriptive tags and measured scent traits for a recipe.
// Define the scent traits shown on premium recipe profiles.
const PREMIUM_PROFILE_FIELDS = [
  { id: "sweet", label: "Sweet" },
  { id: "warm", label: "Warm" },
  { id: "intensity", label: "Intensity" },
  { id: "note", label: "Note" },
  { id: "fresh", label: "Fresh" },
];

// Show descriptive tags and measured scent traits for a recipe.
const ScentProfileCard = ({ profile, recipe }) => (
  <Card title="Scent profile">
    {/* Tags give a quick text summary before the scent trait ratings. */}
    <div className="mt-4 flex flex-wrap gap-2">
      {(recipe.profile_tags ?? []).map((tag) => (
        <span
          className="rounded-full bg-[#F7F5F0] px-4 py-1.5 text-xs"
          key={tag}
        >
          {tag}
        </span>
      ))}
    </div>
    <div className="mt-4 space-y-3">
      {PREMIUM_PROFILE_FIELDS.filter(
        (field) => typeof profile[field.id] === "number",
      ).map((field) => (
        <div
          className="grid grid-cols-[56px_minmax(0,1fr)_42px] items-center gap-3 text-xs text-[#696555]"
          key={field.id}
        >
          <span>{field.label}</span>
          <span
            className="relative h-px w-full bg-[#221B04]/40"
            role="img"
            aria-label={`${field.label} ${profile[field.id]}%`}
          >
            <span
              className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#221B04]"
              style={{ left: `${profile[field.id]}%` }}
            />
          </span>
          <span className="text-right">{profile[field.id]}%</span>
        </div>
      ))}
    </div>
  </Card>
);

export default ScentProfileCard;
