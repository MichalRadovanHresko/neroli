import { LuGlobe, LuInfo, LuUser } from "react-icons/lu";
import Card from "./Card";

// Explain whether a recipe is public or visible only to its owner.
const VisibilityCard = ({ recipe }) => (
  <Card title="Recipe visibility">
    <div className="flex items-start justify-between gap-3">
      <p className="mt-1 text-xs text-[#696555]">
        This is your published
        <br />
        visibility status.
      </p>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#F7F5F0] px-3 py-1.5 text-xs font-semibold">
        {recipe.is_public ? (
          <LuGlobe className="size-4" aria-hidden="true" />
        ) : (
          <LuUser className="size-4" aria-hidden="true" />
        )}
        {recipe.is_public ? "Public" : "Private"}
      </span>
    </div>
    {/* Explain what the selected visibility setting means. */}
    <ul className="mt-3 space-y-3">
      {(recipe.is_public
        ? [
            "Everyone can see this recipe.",
            "It can appear in Explore and community feeds.",
            "You can change this later in Edit recipe.",
          ]
        : [
            "Only you can see this recipe.",
            "It will not appear in Explore or community feeds.",
            "You can change this later in Edit recipe.",
          ]
      ).map((line) => (
        <li className="flex items-center gap-3 text-sm" key={line}>
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#696555] text-white">
            <LuInfo className="size-3.5" aria-hidden="true" />
          </span>
          {line}
        </li>
      ))}
    </ul>
  </Card>
);

export default VisibilityCard;
