// Display scent details, related scents, recipes, and favorite controls.
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LuArrowUpRight, LuChevronLeft } from "react-icons/lu";
import FavoriteButton from "../components/FavoriteButton";
import { useAuth } from "../context/AuthContext.js";
import supabase from "../lib/supabase";

// Convert scent labels into positions for the detail-page meters.
const INTENSITY = { Light: 35, Medium: 60, Strong: 85 };
const NOTE = { Top: 35, Middle: 60, Base: 85 };
const FRESH_FAMILIES = ["citrus", "fresh", "green", "aquatic", "herbal"];
const WARM_FAMILIES = ["gourmand", "woody", "spicy", "leather", "tobacco"];

// Estimate freshness from the scent family for the visual scent card.
const freshness = (family = "") => {
  const text = family.toLowerCase();
  if (FRESH_FAMILIES.some((key) => text.includes(key))) return 85;
  if (WARM_FAMILIES.some((key) => text.includes(key))) return 30;
  return 55;
};

// Render one labeled meter used by the scent profile card.
const Meter = ({ label, value }) => (
  <div className="flex items-center gap-4 text-sm text-[#696555]">
    <span className="w-20 shrink-0">{label}</span>
    <span className="relative h-px flex-1 bg-[#221B04]/40">
      <span
        className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#221B04]"
        style={{ left: `${value}%` }}
      />
    </span>
    <span className="w-10 text-right">{value}%</span>
  </div>
);

// Link to a row of scents that share a family or pair well together.
const ScentRow = ({ title, items }) =>
  items.length > 0 && (
    <section className="mt-10">
      <h2 className="text-xl font-normal">{title}</h2>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {items.map((item) => (
          <Link
            className="flex min-w-0 flex-col items-center gap-2 text-sm"
            to={`/scents/${item.id}`}
            key={item.id}
          >
            <span className="block aspect-square w-full overflow-hidden rounded-[20px] bg-[#D6D2C6]">
              {item.image_url && (
                <img
                  className="size-full object-cover"
                  src={item.image_url}
                  alt=""
                  loading="lazy"
                />
              )}
            </span>
            <span className="max-w-full truncate">{item.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );

// Fetch the selected scent and build its related content.
const ScentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [scent, setScent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoritePending, setFavoritePending] = useState(false);
  const [favoriteError, setFavoriteError] = useState(null);
  const [allScents, setAllScents] = useState([]);
  const [featured, setFeatured] = useState([]);

  // Load other scents for family matches and recipe image fallbacks.
  useEffect(() => {
    let isCurrent = true;
    supabase
      .from("scents")
      .select("id, name, image_url, scent_family")
      .order("name")
      .then(({ data }) => {
        if (isCurrent) setAllScents(data ?? []);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  // Find public recipes that use this scent for the featured section.
  useEffect(() => {
    if (!scent) return;
    let isCurrent = true;
    const name = scent.name.toLowerCase();
    Promise.all([
      supabase
        .from("premium_recipes")
        .select("id, name, image_url, ingredients"),
      supabase
        .from("recipes")
        .select("id, name, image_url, ingredients")
        .or("is_premade.eq.true,is_public.eq.true"),
    ]).then(([premium, community]) => {
      if (!isCurrent) return;
      const all = [
        ...(premium.data ?? []).map((item) => ({ ...item, premium: true })),
        ...(community.data ?? []),
      ];
      const uses = (recipe) =>
        (recipe.ingredients ?? []).some(
          (ingredient) => ingredient.name?.toLowerCase() === name,
        );
      const matching = all.filter(uses);
      setFeatured((matching.length > 0 ? matching : all).slice(0, 2));
    });
    return () => {
      isCurrent = false;
    };
  }, [scent]);

  // Fetch details whenever the route points to a different scent.
  useEffect(() => {
    let isCurrent = true;

    setLoading(true);
    setError(null);
    supabase
      .from("scents")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error: queryError }) => {
        if (!isCurrent) return;
        setScent(data);
        setError(queryError?.message ?? null);
        setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [id]);

  // Check whether the signed-in user has saved this scent.
  useEffect(() => {
    let isCurrent = true;

    const loadFavorite = async () => {
      if (!userId) return;

      const { data, error: queryError } = await supabase
        .from("scent_favorites")
        .select("scent_id")
        .eq("user_id", userId)
        .eq("scent_id", id)
        .maybeSingle();

      if (!isCurrent) return;
      setIsFavorite(Boolean(data));
      setFavoriteError(queryError?.message ?? null);
    };

    void loadFavorite();
    return () => {
      isCurrent = false;
    };
  }, [id, userId]);

  // Add or remove this scent from the signed-in user’s favorites.
  const toggleFavorite = async () => {
    if (!userId || !scent || favoritePending) return;

    setFavoritePending(true);
    setFavoriteError(null);

    const result = isFavorite
      ? await supabase
          .from("scent_favorites")
          .delete()
          .eq("user_id", userId)
          .eq("scent_id", scent.id)
      : await supabase
          .from("scent_favorites")
          .insert({ user_id: userId, scent_id: scent.id });

    if (result.error) setFavoriteError(result.error.message);
    else setIsFavorite((current) => !current);
    setFavoritePending(false);
  };

  // Prepare related scent groups, labels, and profile values for display.
  const families = (scent?.scent_family ?? "")
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);
  const mainFamily = families[0]?.toLowerCase();
  const others = allScents.filter((item) => item.id !== scent?.id);
  const commonIn = others
    .filter(
      (item) =>
        mainFamily && item.scent_family?.toLowerCase().includes(mainFamily),
    )
    .slice(0, 3);
  const pairs = others
    .filter(
      (item) =>
        !commonIn.includes(item) &&
        item.image_url &&
        !item.scent_family?.toLowerCase().includes(mainFamily ?? "\0"),
    )
    .slice((scent?.id ?? 0) % 7, ((scent?.id ?? 0) % 7) + 3);
  const tags = [...families, scent?.note_type, scent?.intensity].filter(
    Boolean,
  );

  return (
    <main className="min-h-screen bg-[#EAE3D6] pb-8 text-[#221B04]">
      {loading && (
        <p className="px-6 pt-8 text-sm text-[#221B04]/70">Loading scent...</p>
      )}
      {error && <p className="px-6 pt-8 text-sm text-red-800">{error}</p>}
      {!loading && !error && !scent && (
        <p className="px-6 pt-8 text-sm text-[#221B04]/70">Scent not found.</p>
      )}

      {/* Render the full detail card only after the scent record is available. */}
      {scent && (
        <article className="mx-auto max-w-3xl">
          <div className="relative h-[62vh] max-h-140 min-h-95 bg-[#D6D2C6]">
            {scent.image_url && (
              <img
                className="size-full object-cover"
                src={scent.image_url}
                alt={scent.name}
              />
            )}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[linear-gradient(180deg,rgba(0,0,0,0.9)_0%,rgba(0,0,0,0.5)_45%,rgba(0,0,0,0)_100%)]" />
            <button
              className="absolute left-4 top-5 grid size-10 place-items-center rounded-full bg-white text-[#221B04]"
              type="button"
              onClick={() =>
                window.history.length > 1 ? navigate(-1) : navigate("/scents")
              }
              aria-label="Back"
            >
              <LuChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <div className="absolute right-4 top-5">
              <FavoriteButton
                name={scent.name}
                isFavorite={isFavorite}
                disabled={favoritePending || Boolean(favoriteError)}
                onClick={toggleFavorite}
              />
            </div>
          </div>

          <div className="relative -mt-8 rounded-t-4xl bg-[#EAE3D6] px-6 pt-8">
            <h1 className="font-serif text-4xl uppercase">{scent.name}</h1>
            <p className="mt-2 text-sm">
              {scent.scent_family}
              {scent.note_type ? ` · ${scent.note_type} note` : ""}
            </p>
            {favoriteError && (
              <p className="mt-3 text-sm text-red-800" role="alert">
                Favorites unavailable: {favoriteError}
              </p>
            )}
            {scent.short_description && (
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#696555]">
                {scent.short_description}
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  className="rounded-full bg-[#F7F5F0] px-5 py-2 text-xs"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Visualize scent characteristics and show related content. */}
            <section className="mt-10">
              <h2 className="text-xl font-normal">Scent card</h2>
              <div className="mt-4 space-y-4">
                <Meter
                  label="Intensity"
                  value={INTENSITY[scent.intensity] ?? 60}
                />
                <Meter label="Note" value={NOTE[scent.note_type] ?? 60} />
                <Meter label="Fresh" value={freshness(scent.scent_family)} />
              </div>
            </section>

            <ScentRow title="Common in" items={commonIn} />
            <ScentRow title="Pairs well with" items={pairs} />

            {/* Link to recipes that feature this scent. */}
            {featured.length > 0 && (
              <section className="mt-10">
                <div className="flex items-end justify-between">
                  <h2 className="text-xl font-normal">Featured recipes</h2>
                  <Link
                    className="border-b border-[#221B04]/55 pb-0.5 text-xs"
                    to="/explore/all?type=premium"
                  >
                    See all
                  </Link>
                </div>
                <div className="mt-4 space-y-4">
                  {featured.map((recipe) => (
                    <Link
                      className="flex h-44 overflow-hidden rounded-[28px] bg-[#D6D2C6]"
                      to={`/recipes/${recipe.id}${recipe.premium ? "?premium=1" : ""}`}
                      key={`${recipe.premium ? "p" : "r"}${recipe.id}`}
                    >
                      <span className="block w-2/5 shrink-0 bg-[#C9C3B3]">
                        <img
                          className="size-full object-cover"
                          src={
                            recipe.image_url ||
                            others.find((item) =>
                              (recipe.ingredients ?? []).some(
                                (ingredient) =>
                                  ingredient.name?.toLowerCase() ===
                                  item.name.toLowerCase(),
                              ),
                            )?.image_url ||
                            scent.image_url
                          }
                          alt=""
                          loading="lazy"
                        />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col justify-between p-4">
                        <span>
                          <span className="block font-serif text-lg uppercase text-[#221B04]">
                            {recipe.name}
                          </span>
                          <span className="mt-1 block text-xs text-[#696555]">
                            {(recipe.ingredients ?? [])
                              .slice(0, 3)
                              .map((ingredient) => ingredient.name)
                              .join(", ")}
                          </span>
                        </span>
                        <span className="grid size-9 place-items-center self-end rounded-full bg-[#F7F5F0]">
                          <LuArrowUpRight
                            className="size-4"
                            aria-hidden="true"
                          />
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </article>
      )}
    </main>
  );
};

export default ScentDetail;
