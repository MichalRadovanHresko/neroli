import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LuArrowLeft, LuChevronDown, LuSearch } from "react-icons/lu";
import supabase from "../lib/supabase";
import { useScents } from "../lib/scents";
import { useAuth } from "../context/AuthContext.js";

const FILTERS = ["All", "Floral", "Woody", "Fresh", "Oriental"];

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "name", label: "Name A-Z" },
];

const getIngredientNames = (recipe) =>
  (recipe.ingredients ?? []).map((ingredient) => ingredient.name);

const getRecipeImage = (recipe, resolveIngredient) =>
  recipe.image_url ||
  (recipe.ingredients ?? [])
    .map(resolveIngredient)
    .find((ingredient) => ingredient.image_url)?.image_url ||
  null;

const matchesText = (recipe, text) =>
  [
    recipe.name,
    recipe.short_description,
    ...(recipe.badges ?? []),
    ...(recipe.profile_tags ?? []),
    ...getIngredientNames(recipe),
  ]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(text));

const RecipeRow = ({ recipe, image }) => (
  <Link
    className="flex items-center gap-4 rounded-2xl bg-[#F7F5F0] p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04]"
    to={`/recipes/${recipe.id}`}
  >
    <div className="size-24 shrink-0 overflow-hidden rounded-xl bg-[#D6D2C6]">
      {image && (
        <img
          className="size-full object-cover"
          src={image}
          alt=""
          loading="lazy"
        />
      )}
    </div>
    <div className="min-w-0">
      <h3 className="truncate text-sm font-semibold">{recipe.name}</h3>
      <p className="mt-2 text-xs text-[#696555]">
        {getIngredientNames(recipe).join(" ")}
      </p>
    </div>
  </Link>
);

const Explore = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { resolveIngredient } = useScents();
  const [searchParams] = useSearchParams();
  const [recipes, setRecipes] = useState([]);
  const [myRecipes, setMyRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("newest");
  const [scents, setScents] = useState([]);

  useEffect(() => {
    let isCurrent = true;

    supabase
      .from("scents")
      .select("id, name, image_url, scent_family, short_description")
      .order("name", { ascending: true })
      .then(({ data, error: scentsError }) => {
        if (isCurrent && !scentsError) setScents(data ?? []);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;

    const loadRecipes = async () => {
      const columns =
        "id, name, image_url, short_description, badges, profile_tags, ingredients, created_at";
      const [premadeResult, mineResult] = await Promise.all([
        supabase
          .from("recipes")
          .select(columns)
          .eq("is_premade", true)
          .order("created_at", { ascending: false }),
        userId
          ? supabase
              .from("recipes")
              .select(columns)
              .eq("user_id", userId)
              .eq("is_premade", false)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (!isCurrent) return;
      const queryError = premadeResult.error || mineResult.error;
      if (queryError) setError(queryError.message);
      else {
        setRecipes(premadeResult.data ?? []);
        setMyRecipes(mineResult.data ?? []);
      }
      setLoading(false);
    };

    void loadRecipes();
    return () => {
      isCurrent = false;
    };
  }, [userId]);

  const featured = recipes[0];
  const searchText = query.trim().toLowerCase();

  const matchesFilters = (recipe) =>
    (filter === "All" || matchesText(recipe, filter.toLowerCase())) &&
    (!searchText || matchesText(recipe, searchText));

  const visibleRecipes = recipes
    .filter(matchesFilters)
    .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : 0));
  const visibleMyRecipes = myRecipes.filter(matchesFilters);

  const matchesScent = (scent, text) =>
    [scent.name, scent.scent_family, scent.short_description]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(text));
  const visibleScents = scents.filter(
    (scent) =>
      (filter === "All" || matchesScent(scent, filter.toLowerCase())) &&
      (!searchText || matchesScent(scent, searchText)),
  );

  const featuredImage = featured && getRecipeImage(featured, resolveIngredient);

  return (
    <main className="min-h-screen bg-[#EAE3D6] px-4 pb-36 pt-5 text-[#221B04] sm:px-10">
      <div className="mx-auto max-w-3xl">
        <header className="grid grid-cols-[40px_1fr_40px] items-center">
          <button
            className="grid size-10 place-items-center rounded-full bg-[#F7F5F0]"
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <LuArrowLeft className="size-5" aria-hidden="true" />
          </button>
          <h1 className="text-center text-base font-medium">Explore</h1>
          <span aria-hidden="true" />
        </header>

        <label className="mt-5 flex h-11 items-center gap-3 rounded-full bg-[#F7F5F0] px-4 shadow-[0_2px_8px_rgba(34,27,4,0.08)]">
          <LuSearch
            className="size-5 shrink-0 text-[#8d897a]"
            aria-hidden="true"
          />
          <input
            className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[#9c9889]"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notes, recipes, ingredients..."
            aria-label="Search recipes"
          />
        </label>

        <div
          className="-mx-4 mt-4 overflow-x-auto px-4 sm:-mx-10 sm:px-10"
          style={{ scrollbarWidth: "none" }}
          aria-label="Recipe filters"
        >
          <div className="flex w-max gap-2">
            {FILTERS.map((item) => (
              <button
                className={`min-h-8 rounded-full px-4 text-xs ${
                  filter === item ? "bg-[#D6D2C6]" : "bg-[#F7F5F0]"
                }`}
                type="button"
                key={item}
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <p className="mt-8 text-sm text-[#221B04]/70">Loading recipes...</p>
        )}
        {error && (
          <p className="mt-8 text-sm text-red-800" role="alert">
            Could not load recipes: {error}
          </p>
        )}

        {!loading && !error && featured && (
          <section className="mt-6" aria-label="Neroli's selection">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-medium">Neroli’s selection</h2>
              <button
                className="border-b border-[#221B04] text-xs"
                type="button"
                onClick={() => {
                  setFilter("All");
                  setQuery("");
                }}
              >
                See all
              </button>
            </div>
            <Link
              className="relative mt-4 block aspect-[0.9] w-full overflow-hidden rounded-[28px] bg-[#696555] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04]"
              to={`/recipes/${featured.id}`}
            >
              {featuredImage && (
                <img
                  className="absolute inset-0 size-full object-cover"
                  src={featuredImage}
                  alt=""
                />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(34,27,4,0.55)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
                <div className="min-w-0">
                  <h3 className="font-serif text-3xl uppercase leading-tight">
                    {featured.name}
                  </h3>
                  <p className="mt-1 text-sm">
                    {getIngredientNames(featured).join(", ")}
                  </p>
                </div>
                <span
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-white/25 backdrop-blur-md"
                  aria-hidden="true"
                >
                  <LuChevronDown className="size-5" />
                </span>
              </div>
            </Link>
          </section>
        )}

        {!loading && !error && userId && (
          <section className="mt-10" aria-label="My recipes">
            <h2 className="text-lg font-medium">My recipes</h2>
            {visibleMyRecipes.length === 0 ? (
              <p className="mt-4 text-sm text-[#221B04]/70">
                {myRecipes.length === 0
                  ? "You have no recipes yet. Create one in Add."
                  : "None of your recipes match."}
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {visibleMyRecipes.map((recipe) => (
                  <li key={recipe.id}>
                    <RecipeRow
                      recipe={recipe}
                      image={getRecipeImage(recipe, resolveIngredient)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {!loading && !error && (
          <section className="mt-10" aria-label="All recipes">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-medium">All recipes</h2>
              <label className="relative flex items-center gap-1 text-xs">
                <span className="sr-only">Sort recipes</span>
                <select
                  className="cursor-pointer appearance-none bg-transparent pr-5 underline outline-none"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  {SORTS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <LuChevronDown
                  className="pointer-events-none absolute right-0 size-4"
                  aria-hidden="true"
                />
              </label>
            </div>

            {visibleRecipes.length === 0 ? (
              <p className="mt-6 text-sm text-[#221B04]/70">
                No recipes found.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {visibleRecipes.map((recipe) => (
                  <li key={recipe.id}>
                    <RecipeRow
                      recipe={recipe}
                      image={getRecipeImage(recipe, resolveIngredient)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {visibleScents.length > 0 && (
          <section className="mt-10" aria-label="Scents">
            <h2 className="text-lg font-medium">Scents</h2>
            <ul className="mt-4 grid grid-cols-3 gap-x-3 gap-y-4">
              {visibleScents.map((scent) => (
                <li className="min-w-0" key={scent.id}>
                  <Link
                    className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04]"
                    to={`/scents/${scent.id}`}
                  >
                    <div className="aspect-square overflow-hidden rounded-[18px] bg-[#D6D2C6]">
                      {scent.image_url && (
                        <img
                          className="size-full object-cover"
                          src={scent.image_url}
                          alt=""
                          loading="lazy"
                        />
                      )}
                    </div>
                    <p className="mt-2 truncate text-center text-xs">
                      {scent.name}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
};

export default Explore;
