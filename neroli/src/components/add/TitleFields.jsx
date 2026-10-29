// Enter the recipe title and subtitle and show its list number.
const TitleFields = ({
  recipeCount,
  recipeName,
  savedRecipeId,
  setRecipeName,
  setSubtitle,
  subtitle,
}) => (
  <section className="mt-7">
    {/* The title fields update the recipe draft as the author types. */}
    <p className="font-serif text-4xl leading-none text-[#696555]">
      {String(savedRecipeId ? recipeCount : recipeCount + 1).padStart(2, "0")}
    </p>
    <label className="mt-2 block">
      <span className="sr-only">Recipe name</span>
      <input
        className="w-full bg-transparent font-sans text-xl outline-none placeholder:text-[#696555]"
        value={recipeName}
        onChange={(event) => setRecipeName(event.target.value)}
        aria-label="Recipe name"
        placeholder="Recipe draft"
        maxLength={80}
        required
      />
    </label>
    <label className="mt-1 block">
      <span className="sr-only">Recipe subtitle</span>
      <input
        className="w-full bg-transparent text-sm text-[#696555] outline-none placeholder:text-[#696555]"
        value={subtitle}
        onChange={(event) => setSubtitle(event.target.value)}
        aria-label="Recipe subtitle"
        placeholder="Add subtitle"
        maxLength={120}
      />
    </label>
  </section>
);

export default TitleFields;
