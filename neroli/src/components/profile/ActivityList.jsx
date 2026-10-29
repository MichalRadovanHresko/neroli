import RecipeRow from "./RecipeRow";
import { formatDate } from "../../lib/profileHelpers";

// List recipes created by the profile owner.
const ActivityList = ({ getImage, ownRecipes }) => (
  <ul className="mt-6 space-y-3">
    {ownRecipes.length === 0 && (
      <li className="text-sm text-[#221B04]/70">
        You haven't created any recipes yet.
      </li>
    )}
    {ownRecipes.map((recipe) => (
      <li key={recipe.id}>
        <RecipeRow
          recipe={recipe}
          image={getImage(recipe)}
          caption={`Created · ${formatDate(recipe.created_at)}`}
        />
      </li>
    ))}
  </ul>
);

export default ActivityList;
