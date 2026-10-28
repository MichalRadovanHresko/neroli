import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LuArrowLeft, LuChevronDown, LuSearch } from "react-icons/lu";
import supabase from "../lib/supabase";
import { useScents } from "../lib/scents";
import { useAuth } from "../context/AuthContext.js";

const FILTERS = ["All", "Floral", "Woody", "Fresh", "Oriental"];

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

const ListRow = ({ to, image, title, subtitle, dark = false }) => (
  <Link
    className={`flex items-center gap-4 rounded-[20px] p-2.5 shadow-[0_2px_6px_rgba(34,27,4,0.06)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04] ${
      dark ? "bg-[#D6D0C0]" : "bg-[#F7F5F0]"
    }`}
    to={to}
  >
    <div className="size-24 shrink-0 overflow-hidden rounded-2xl bg-[#D6D2C6]">
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
      <h3 className="truncate text-[15px] font-semibold">{title}</h3>
      <p className="mt-2 line-clamp-2 text-xs text-[#696555]">{subtitle}</p>
    </div>
  </Link>
);

const SectionHeading = ({ title, action }) => (
  <div className="flex items-baseline justify-between gap-4">
    <h2 className="text-xl font-medium">{title}</h2>
    {action}
  </div>
);

const SeeAll = ({ type, query }) => (
  <Link
    className="shrink-0 border-b border-[#221B04] text-xs"
    to={`/explore/all?type=${type}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
  >
    See all
  </Link>
);

const PREVIEW_COUNT = 3;

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
  const [scents, setScents] = useState([]);
  const [premiumRecipes, setPremiumRecipes] = useState([]);

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
      const [premadeResult, mineResult, premiumResult] = await Promise.all([
        supabase
          .from("recipes")
          .select(columns)
          .or("is_premade.eq.true,is_public.eq.true")
          .order("created_at", { ascending: false }),
        userId
          ? supabase
              .from("recipes")
              .select(columns)
              .eq("user_id", userId)
              .eq("is_premade", false)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from("premium_recipes")
          .select(columns)
          .order("created_at", { ascending: false }),
      ]);

      if (!isCurrent) return;
      const queryError = premadeResult.error || mineResult.error;
      if (queryError) setError(queryError.message);
      else {
        setRecipes(premadeResult.data ?? []);
        setMyRecipes(mineResult.data ?? []);
        setPremiumRecipes(
          premiumResult.error ? [] : (premiumResult.data ?? []),
        );
      }
      setLoading(false);
    };

    void loadRecipes();
    return () => {
      isCurrent = false;
    };
  }, [userId]);

  const featured = premiumRecipes[0];
  const searchText = query.trim().toLowerCase();

  const matchesFilters = (recipe) =>
    (filter === "All" || matchesText(recipe, filter.toLowerCase())) &&
    (!searchText || matchesText(recipe, searchText));

  const visibleRecipes = recipes.filter(matchesFilters);
  const visiblePremium = premiumRecipes.filter(matchesFilters);
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
  const shownRecipes = visibleRecipes.slice(0, PREVIEW_COUNT);
  const shownScents = visibleScents.slice(0, PREVIEW_COUNT);
  const shownPremium = visiblePremium.slice(0, PREVIEW_COUNT);
  const shownMyRecipes = visibleMyRecipes.slice(0, PREVIEW_COUNT);

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
          <span />
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

        {!loading && !error && featured && !searchText && (
          <section className="mt-6" aria-label="Neroli's selection">
            <SectionHeading
              title="Neroli’s Premium selection"
              action={<SeeAll type="premium" />}
            />
            <Link
              className="relative mt-4 block aspect-[0.9] w-full overflow-hidden rounded-[28px] bg-[#696555] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04]"
              to={`/recipes/${featured.id}?premium=1`}
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

        <div className="flex flex-col">
          {!loading && !error && searchText && visiblePremium.length > 0 && (
            <section className="order-0 mt-10" aria-label="Premium recipes">
              <SectionHeading
                title="Premium recipes"
                action={
                  visiblePremium.length > PREVIEW_COUNT && (
                    <SeeAll type="premium" query={searchText} />
                  )
                }
              />
              <ul className="mt-4 space-y-3">
                {shownPremium.map((recipe) => (
                  <li key={recipe.id}>
                    <ListRow
                      to={`/recipes/${recipe.id}?premium=1`}
                      image={getRecipeImage(recipe, resolveIngredient)}
                      title={recipe.name}
                      subtitle={getIngredientNames(recipe).join(" ")}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!loading &&
            !error &&
            userId &&
            (searchText ? visibleMyRecipes.length > 0 : true) && (
              <section
                className={`mt-10 ${searchText ? "order-2" : "order-0"}`}
                aria-label="My recipes"
              >
                <SectionHeading
                  title="My recipes"
                  action={<SeeAll type="mine" query={searchText} />}
                />
                {visibleMyRecipes.length === 0 ? (
                  <p className="mt-4 text-sm text-[#221B04]/70">
                    {myRecipes.length === 0
                      ? "You have no recipes yet. Create one in Add."
                      : "None of your recipes match."}
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {shownMyRecipes.map((recipe) => (
                      <li key={recipe.id}>
                        <ListRow
                          to={`/recipes/${recipe.id}`}
                          image={getRecipeImage(recipe, resolveIngredient)}
                          title={recipe.name}
                          subtitle={getIngredientNames(recipe).join(" ")}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

          {!loading && !error && (
            <section
              className={`mt-12 ${"order-1"}`}
              aria-label="Community recipes"
            >
              <SectionHeading
                title="Community recipes"
                action={<SeeAll type="community" query={searchText} />}
              />

              {visibleRecipes.length === 0 ? (
                <p className="mt-6 text-sm text-[#221B04]/70">
                  No recipes found.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {shownRecipes.map((recipe) => (
                    <li key={recipe.id}>
                      <ListRow
                        to={`/recipes/${recipe.id}`}
                        image={getRecipeImage(recipe, resolveIngredient)}
                        title={recipe.name}
                        subtitle={getIngredientNames(recipe).join(" ")}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {visibleScents.length > 0 && (
            <section className="order-3 mt-12" aria-label="Explore scents">
              <SectionHeading
                title="Explore scents"
                action={
                  visibleScents.length > PREVIEW_COUNT && (
                    <SeeAll type="scents" query={searchText} />
                  )
                }
              />
              <ul className="mt-4 space-y-3">
                {shownScents.map((scent) => (
                  <li key={scent.id}>
                    <ListRow
                      dark
                      to={`/scents/${scent.id}`}
                      image={scent.image_url}
                      title={scent.name}
                      subtitle={scent.short_description || scent.scent_family}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </main>
  );
};

export default Explore;
