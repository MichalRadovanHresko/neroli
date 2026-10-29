import RecipeRow from "./RecipeRow";

// Show each saved recipe with its image and ingredient summary.
const SavedList = ({ getImage, ingredientNames, saved }) => (
  <ul className="mt-6 space-y-3">
    {saved.map((row) => (
      <li key={row.recipe.id}>
        <RecipeRow
          recipe={row.recipe}
          image={getImage(row.recipe)}
          caption={ingredientNames(row.recipe)}
        />
      </li>
    ))}
  </ul>
);

export default SavedList;
