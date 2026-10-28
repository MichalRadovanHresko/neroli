import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LuArrowUpRight,
  LuBookOpen,
  LuCheck,
  LuFlower,
  LuLink2,
  LuShieldCheck,
  LuX,
} from "react-icons/lu";
import heroImage from "../assets/images/background-image.jpg";
import { useAuth } from "../context/AuthContext.js";
import amberImage from "../assets/images/notes/amber.jpg";
import citrusImage from "../assets/images/notes/citrus.jpg";
import floralImage from "../assets/images/notes/floral.jpg";
import fruityImage from "../assets/images/notes/fruity.jpg";
import spicyImage from "../assets/images/notes/spicy.jpg";
import tropicalImage from "../assets/images/notes/tropical.jpg";
import supabase from "../lib/supabase";
import { useScents } from "../lib/scents";

const noteFamilies = [
  { name: "Fruity", image: fruityImage, familyKey: "fruity" },
  { name: "Citrus", image: citrusImage, familyKey: "citrus" },
  { name: "Spicy", image: spicyImage, familyKey: "spicy" },
  { name: "Tropical", image: tropicalImage, familyKey: "tropical" },
  {
    name: "Amber",
    search: "Gourmand",
    image: amberImage,
    familyKey: "gourmand",
  },
  { name: "Floral", image: floralImage, familyKey: "floral" },
];

const guideSteps = [
  {
    title: "Safety first",
    text: "Never apply undiluted fragrance materials. Use cosmetic-grade supplies, avoid flames with alcohol, and check ingredient restrictions and allergens before blending.",
    bullets: [
      "Choose skin-safe perfumery materials and a suitable perfume base.",
      "Dilute only within the supplier's material-specific dilution/IFRA limits.",
      "Do not use candle fragrance oils or rubbing alcohol.",
      "A patch test does not establish safety; it only helps you notice immediate irritation.",
    ],
  },
  {
    title: "Gather clean glass vessels",
    text: "Use clean glass pipettes, a precise scale, labels, and a small trial vessel for every blend.",
  },
  {
    title: "Choose a scent direction",
    text: "Start with a direction such as citrus, floral, or amber. Perfume is built in three layers: top notes for the opening, heart notes for the middle, and base notes for the dry down.",
    bullets: [
      "Top notes: the first impression; bright, quick-to-evaporate notes such as citrus.",
      "Heart notes: the character of the blend; florals, herbs and spices that emerge as the opening fades.",
      "Base notes: the foundation; woods, resins and musks that linger the longest.",
    ],
  },
  {
    title: "Build a small trial accord",
    text: "Start with 1-5 ingredients and keep the total weight small. Measure every ingredient, and record each addition immediately.",
    bullets: [
      "Choose a perfume base such as ethanol, jojoba, or fractionated coconut oil.",
      "Keep the first trial small so you can refine it without wasting materials.",
      "Record every ingredient, weight, and supplier so you can reproduce the blend later.",
    ],
  },
  {
    title: "Rest, label, and evaluate",
    text: "Seal the trial, label it, and let it rest on blotters, then adjust one ingredient at a time.",
    bullets: [
      "Rest the trial for at least 24 hours before you judge the character.",
      "Evaluate on blotters first. Only consider skin use after the blend is within the supplier's dilution limits and allergens are checked.",
      "Adjust one ingredient at a time so you can see what changed.",
    ],
  },
  {
    title: "Bottle and document",
    text: "Once the scent is stable, bottle the final recipe and keep the formula, supplier notes, and batch details for future reproduction.",
    bullets: [
      "Keep a record of every ingredient, weight, supplier, and batch date.",
      "Store the final bottle away from heat, light, and children.",
      "If you share the recipe, include the supplier's safety notes and any allergens.",
    ],
  },
];

const formatEdited = (value) => {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (Number.isNaN(days) || days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
};

const Home = () => {
  const navigate = useNavigate();
  const { resolveIngredient } = useScents();
  const { session, isPremium } = useAuth();
  const [promoOpen, setPromoOpen] = useState(
    () => !sessionStorage.getItem("neroli-plus-promo"),
  );
  const closePromo = () => {
    sessionStorage.setItem("neroli-plus-promo", "1");
    setPromoOpen(false);
  };
  const userId = session?.user?.id;
  const [favoriteScent, setFavoriteScent] = useState(null);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [recipeScents, setRecipeScents] = useState([]);
  const [ingredientScents, setIngredientScents] = useState([]);
  const [craftedScent, setCraftedScent] = useState(null);
  const [myRecipes, setMyRecipes] = useState([]);

  const latestRecipe = myRecipes[0] ?? null;
  const latestIngredients = (latestRecipe?.ingredients ?? []).map(
    resolveIngredient,
  );
  const continueTiles = latestRecipe
    ? latestIngredients.slice(0, 3).map((ingredient, index) => ({
        key: `${ingredient.name}-${index}`,
        name: ingredient.name,
        image_url: ingredient.image_url,
        to: ingredient.scent_id
          ? `/scents/${ingredient.scent_id}`
          : `/recipes/${latestRecipe.id}`,
      }))
    : recipeScents.map((scent) => ({
        key: scent.id,
        name: scent.name,
        image_url: scent.image_url,
        to: `/scents/${scent.id}`,
      }));

  useEffect(() => {
    let isCurrent = true;

    supabase
      .from("scents")
      .select("id, name, image_url, scent_family, short_description")
      .not("image_url", "is", null)
      .neq("image_url", "")
      .then(({ data, error }) => {
        if (!isCurrent || error || !data?.length) return;
        const shuffledScents = data.filter((scent) => scent.image_url?.trim());
        for (
          let currentIndex = shuffledScents.length - 1;
          currentIndex > 0;
          currentIndex -= 1
        ) {
          const randomIndex = Math.floor(Math.random() * (currentIndex + 1));
          [shuffledScents[currentIndex], shuffledScents[randomIndex]] = [
            shuffledScents[randomIndex],
            shuffledScents[currentIndex],
          ];
        }
        setRecipeScents(shuffledScents.slice(0, 3));
        setCraftedScent(shuffledScents[3] ?? shuffledScents[0]);
        setIngredientScents(
          ["Clove", "Wild Berries", "Apricot"]
            .map((name) =>
              shuffledScents.find(
                (scent) => scent.name.toLowerCase() === name.toLowerCase(),
              ),
            )
            .filter(Boolean),
        );
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    let isCurrent = true;

    supabase
      .from("recipes")
      .select("id, name, image_url, short_description, ingredients, updated_at")
      .eq("user_id", userId)
      .eq("is_premade", false)
      .order("updated_at", { ascending: false })
      .limit(3)
      .then(({ data, error }) => {
        if (isCurrent && !error) setMyRecipes(data ?? []);
      });

    return () => {
      isCurrent = false;
    };
  }, [userId]);

  useEffect(() => {
    let isCurrent = true;

    const loadFavoriteScent = async () => {
      if (!userId) return;

      const { data: favorite, error: favoriteError } = await supabase
        .from("scent_favorites")
        .select("scent_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!isCurrent) return;
      if (favoriteError || !favorite) {
        setFavoriteScent(null);
        setFavoritesLoading(false);
        return;
      }

      const { data: scent, error: scentError } = await supabase
        .from("scents")
        .select("id, name, image_url, scent_family, short_description")
        .eq("id", favorite.scent_id)
        .maybeSingle();

      if (!isCurrent) return;
      setFavoriteScent(scentError ? null : scent);
      setFavoritesLoading(false);
    };

    void loadFavoriteScent();
    return () => {
      isCurrent = false;
    };
  }, [userId]);

  return (
    <main className="overflow-hidden bg-[#EAE3D6] text-[#221B04]">
      {promoOpen && !isPremium && (
        <div
          className="fixed inset-0 z-100 grid place-items-center bg-black/40 px-6"
          role="dialog"
          aria-modal="true"
          aria-label="Get Neroli+"
        >
          <div className="relative w-full max-w-sm rounded-[28px] bg-[#F7F5F0] p-6 text-center">
            <button
              className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-[#EAE3D6]"
              type="button"
              onClick={closePromo}
              aria-label="Close"
            >
              <LuX className="size-4" aria-hidden="true" />
            </button>
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#E2CFA3]">
              <LuFlower className="size-7" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-serif text-2xl">Get NÉROLI+</h2>
            <p className="mt-2 text-sm text-[#696555]">
              Unlock premium recipes, Scent Wrapped, your Scent Profile and more
              tools for creating your own perfumes.
            </p>
            <Link
              className="mt-5 block rounded-full bg-[#696555] py-3 text-sm text-white"
              to="/premium"
              onClick={closePromo}
            >
              Discover NÉROLI+
            </Link>
            <button
              className="mt-3 text-xs text-[#696555] underline underline-offset-2"
              type="button"
              onClick={closePromo}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
      <section className="relative min-h-125 overflow-hidden bg-[#D6D2C6] px-6 sm:min-h-165 sm:px-10 lg:min-h-175 lg:px-[max(4rem,calc((100vw-1180px)/2))]">
        <img
          className="absolute inset-0 h-full w-full object-cover object-[52%_center]"
          src={heroImage}
          alt="Background-image"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(216,209,193,1)_0%,rgba(216,209,193,0.92)_35%,rgba(216,209,193,0.7)_60%,rgba(216,209,193,0.4)_80%,rgba(216,209,193,0.15)_100%)]" />
        <div
          className="relative z-10 mt-34 max-w-142.5 sm:mt-44 lg:mt-48"
          id="top"
        >
          <h1 className="max-w-135 font-serif text-[32px] font-medium leading-[.95]">
            Create something personal
          </h1>
          <p className="mt-5 max-w-75 text-[12px] leading-relaxed text-[#221B04]/80 sm:max-w-95 sm:text-sm">
            Explore notes, discover combinations and build your next fragrance.
          </p>
          <button
            className="mt-6 inline-flex min-h-12 min-w-53.5 items-center justify-center gap-6 rounded-[23.603px] bg-[#696555] px-8 text-xs text-[#D8D1C1] shadow-[0_3.147px_3.147px_0_rgba(0,0,0,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04]"
            type="button"
            onClick={() => navigate("/add")}
          >
            <span className="text-xl font-light leading-none">+</span>
            <span>Create fragrance</span>
          </button>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-9 max-w-7xl rounded-t-[30px] bg-[#EAE3D6] px-5.5 pb-5 pt-8.5 sm:rounded-t-[36px] sm:px-10 sm:pb-36 sm:pt-10 lg:px-[10%]">
        {!favoritesLoading && favoriteScent && (
          <section className="mb-17 sm:mb-19">
            <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
              <div>
                <h2 className="font-sans text-xl font-normal leading-tight sm:text-2xl">
                  Your recent favorites
                </h2>
              </div>
              <button
                className="inline-flex shrink-0 items-center gap-1 border-b border-[#221B04]/55 pb-1 text-[11px]"
                type="button"
                onClick={() => navigate("/favorites")}
              >
                See all <LuArrowUpRight className="size-3" aria-hidden="true" />
              </button>
            </div>
            <Link
              className="block overflow-hidden rounded-[22px] bg-[#F4F2EE] text-left"
              to={`/scents/${favoriteScent.id}`}
              aria-label={`Open favorite scent ${favoriteScent.name}`}
            >
              <img
                src={favoriteScent.image_url}
                alt={`${favoriteScent.name} scent`}
                className="aspect-[1.4] w-full bg-[#696555] object-cover object-center sm:aspect-[2]"
              />
              <span className="block px-6 pb-5 pt-5">
                <span className="line-clamp-2 block font-serif text-lg uppercase leading-tight tracking-wide">
                  {favoriteScent.name}
                </span>
                <span className="mt-1.5 line-clamp-1 block text-sm text-[#696555]">
                  {favoriteScent.short_description ||
                    favoriteScent.scent_family}
                </span>
                <span className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-[#696555]">Explore note</span>
                  <span className="grid size-10 place-items-center rounded-full bg-[#EAE3D6]">
                    <LuArrowUpRight className="size-4" aria-hidden="true" />
                  </span>
                </span>
              </span>
            </Link>
          </section>
        )}
        {ingredientScents.length > 0 && (
          <section className="mb-17 sm:mb-19">
            <div className="rounded-3xl bg-[#F4F2EE] px-5 py-6 shadow-[0_3px_12px_rgba(34,27,4,0.08)] sm:px-10 sm:py-8">
              <h2 className="font-sans text-lg font-normal leading-tight sm:text-xl">
                More favourite scents
              </h2>
              <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-4">
                {ingredientScents.map((scent) => (
                  <Link
                    className="block aspect-square overflow-hidden rounded-[20px] bg-[#D6D2C6]"
                    key={scent.id}
                    to={`/scents/${scent.id}`}
                    aria-label={`More info about ${scent.name}`}
                  >
                    <img
                      className="size-full object-cover"
                      src={scent.image_url}
                      alt={scent.name}
                      loading="lazy"
                    />
                  </Link>
                ))}
              </div>
              <Link
                className="mt-6 flex h-11 w-full items-center justify-center rounded-[23.603px] bg-[#696555] text-xs text-[#D8D1C1] shadow-[0_3.147px_3.147px_0_rgba(0,0,0,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04]"
                to="/scents"
              >
                Explore Library
              </Link>
            </div>
          </section>
        )}
        <section className="mb-17 sm:mb-19">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-sans text-xl font-normal leading-tight sm:text-2xl">
                Explore by note
              </h2>
            </div>
            <Link
              className="inline-flex shrink-0 items-center gap-1 border-b border-[#221B04]/55 pb-1 text-[11px]"
              to="/scents"
            >
              See all <LuArrowUpRight className="size-3" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-6 sm:gap-x-5 sm:gap-y-6">
            {noteFamilies.map((family) => (
              <Link
                className="flex min-w-0 flex-col items-center gap-2 text-xs sm:text-[13px]"
                key={family.name}
                to={`/scents?q=${encodeURIComponent(family.search ?? family.name)}`}
              >
                <img
                  className="aspect-square w-full rounded-[17px] object-cover sm:rounded-[20px]"
                  src={family.image}
                  alt=""
                  loading="lazy"
                />
                <span>{family.name}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-18 sm:mb-19.5">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-sans text-xl font-normal leading-tight sm:text-2xl">
                {latestRecipe ? "Your recipes" : "Continue your recipe"}
              </h2>
            </div>
            {latestRecipe && (
              <Link
                className="inline-flex shrink-0 items-center gap-1 border-b border-[#221B04]/55 pb-1 text-[11px]"
                to="/scents"
              >
                See all <LuArrowUpRight className="size-3" aria-hidden="true" />
              </Link>
            )}
          </div>
          {latestRecipe && (
            <ul className="mb-5 space-y-3">
              {myRecipes.map((recipe) => {
                const recipeIngredients = (recipe.ingredients ?? []).map(
                  resolveIngredient,
                );
                const image =
                  recipe.image_url ||
                  recipeIngredients.find((ingredient) => ingredient.image_url)
                    ?.image_url;
                return (
                  <li key={recipe.id}>
                    <Link
                      className="flex items-center gap-4 rounded-2xl bg-[#F4F2EE] p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04]"
                      to={`/recipes/${recipe.id}`}
                    >
                      <span className="block size-20 shrink-0 overflow-hidden rounded-xl bg-[#D6D2C6]">
                        {image && (
                          <img
                            className="size-full object-cover"
                            src={image}
                            alt=""
                            loading="lazy"
                          />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {recipe.name}
                        </span>
                        <span className="mt-1 block truncate text-xs text-[#696555]">
                          {recipeIngredients
                            .map((ingredient) => ingredient.name)
                            .join(", ") || "No ingredients yet"}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <article className="rounded-3xl bg-[#F4F2EE] px-5 py-6 sm:px-10 sm:py-8">
            <div className="flex items-center justify-between gap-3 text-[9px] text-[#221B04]/70">
              <span>01</span>
              <span>{latestRecipe ? "Latest" : "Tone"}</span>
            </div>
            <h3 className="mt-4 text-center text-xl font-normal sm:text-2xl">
              {latestRecipe ? latestRecipe.name : "Warm & Sweet"}
            </h3>
            <div
              className="mx-auto my-4 grid max-w-105 grid-cols-3 gap-3 sm:my-5 sm:gap-4"
              aria-label="Recipe ingredients"
            >
              {continueTiles.map((tile) => (
                <Link
                  className="relative aspect-[1.15] overflow-hidden rounded-[14px] bg-[#D8D1C1] focus-visible:outline-2 focus-visible:outline-offset-2"
                  key={tile.key}
                  to={tile.to}
                  aria-label={`More info about ${tile.name}`}
                >
                  {tile.image_url && (
                    <img
                      className="absolute inset-0 size-full object-cover"
                      src={tile.image_url}
                      alt={tile.name}
                      loading="lazy"
                    />
                  )}
                </Link>
              ))}
            </div>
            <p className="mb-5 text-center text-xs text-[#221B04]">
              {latestRecipe
                ? `${latestIngredients.length} ingredient${latestIngredients.length === 1 ? "" : "s"} · Last edited ${formatEdited(latestRecipe.updated_at)}`
                : "3 ingredients · Last edited today"}
            </p>
            <button
              className="flex h-11 w-full items-center justify-center rounded-[23.603px] bg-[#696555] text-xs text-[#D8D1C1] shadow-[0_3.147px_3.147px_0_rgba(0,0,0,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04]"
              type="button"
              onClick={() =>
                navigate(latestRecipe ? `/recipes/${latestRecipe.id}` : "/add")
              }
            >
              {latestRecipe ? "Continue recipe" : "Create recipe"}
            </button>
          </article>
        </section>

        <section className="mb-14">
          <p className="text-[10px] uppercase tracking-wide text-[#696555]">
            The private atelier
          </p>
          <h2 className="mt-3 font-serif text-[32px] font-medium leading-[.95]">
            A deeper fragrance experience.
          </h2>
          <p className="mt-3 text-sm text-[#221B04]/80">
            Unlock exclusive recipes, smart suggestions and personal insights.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#F4F2EE] p-4">
              <LuBookOpen className="size-5" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-semibold">Exclusive recipes</h3>
              <p className="mt-1 text-xs text-[#696555]">
                Curated blends from perfumers and our community.
              </p>
            </div>
            <div className="rounded-2xl bg-[#F4F2EE] p-4">
              <LuLink2 className="size-5" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-semibold">Smart pairings</h3>
              <p className="mt-1 text-xs text-[#696555]">
                Discover which notes go best together.
              </p>
            </div>
          </div>
          <Link
            className="mt-4 flex h-11 w-full items-center justify-center rounded-[23.603px] bg-[#E5CCA1] text-sm font-medium shadow-[0_3.147px_3.147px_0_rgba(0,0,0,0.15)]"
            to="/premium"
          >
            Get NÉROLI+
          </Link>
        </section>

        <section className="mb-12">
          <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
            <div>
              <h2 className="font-sans text-xl font-normal leading-tight sm:text-2xl">
                Crafted with intention
              </h2>
            </div>
            <button
              className="inline-flex shrink-0 items-center gap-1 border-b border-[#221B04]/55 pb-1 text-[11px]"
              type="button"
              onClick={() => navigate("/shop")}
            >
              See all <LuArrowUpRight className="size-3" aria-hidden="true" />
            </button>
          </div>
          <Link
            className="block overflow-hidden rounded-[22px] bg-[#F4F2EE] text-left"
            to={craftedScent ? `/scents/${craftedScent.id}` : "/scents"}
            aria-label={
              craftedScent
                ? `Explore ${craftedScent.name}`
                : "Loading a crafted scent"
            }
            aria-busy={!craftedScent}
          >
            <span className="relative block aspect-[1.1] w-full overflow-hidden bg-[#D6D2C6] sm:aspect-[1.6]">
              {craftedScent ? (
                <img
                  src={craftedScent.image_url}
                  alt={`${craftedScent.name} scent`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
              ) : (
                <span className="absolute inset-0 grid place-items-center text-xs text-[#221B04]/70">
                  Loading a scent...
                </span>
              )}
            </span>
            {craftedScent && (
              <span className="flex items-center gap-4 px-6 pb-6 pt-5">
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 block font-serif text-[28px] uppercase leading-tight tracking-wide">
                    {craftedScent.name}
                  </span>
                  <span className="mt-2 line-clamp-2 block text-sm leading-snug">
                    {craftedScent.short_description ||
                      craftedScent.scent_family}
                  </span>
                </span>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#EAE3D6]">
                  <LuArrowUpRight className="size-4" aria-hidden="true" />
                </span>
              </span>
            )}
          </Link>
        </section>

        <section className="mb-12">
          <p className="text-[10px] uppercase tracking-wide text-[#696555]">
            The private atelier
          </p>
          <h2 className="mt-3 font-serif text-[32px] font-medium leading-[.95]">
            Make your own perfume
          </h2>
          <p className="mt-3 text-sm text-[#221B04]/80">
            A beginner-friendly guide to choosing notes, measuring safely, and
            refining a fragrance you can wear.
          </p>
          <ol className="mt-6 space-y-3">
            {guideSteps.map((step, index) => (
              <li className="rounded-3xl bg-[#F4F2EE] p-5" key={step.title}>
                <div className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#D6D2C6] text-xs">
                    {index === 0 ? (
                      <LuShieldCheck className="size-4" aria-hidden="true" />
                    ) : (
                      String(index).padStart(2, "0")
                    )}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">{step.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#696555]">
                      {step.text}
                    </p>
                  </div>
                </div>
                {step.bullets && (
                  <ul className="mt-4 space-y-2">
                    {step.bullets.map((bullet) => (
                      <li className="flex items-start gap-2" key={bullet}>
                        <LuCheck
                          className="mt-0.5 size-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="text-xs leading-relaxed text-[#696555]">
                          {bullet}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
};

export default Home;
