import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LuArrowLeft } from "react-icons/lu";
import supabase from "../lib/supabase";
import { useScents } from "../lib/scents";
import { useAuth } from "../context/AuthContext.js";

const RECIPE_TABS = [
  { type: "premium", label: "Neroli+", title: "Exclusive recipes" },
  { type: "community", label: "Community", title: "Community recipes" },
  { type: "mine", label: "My recipes", title: "My recipes" },
];

const COLUMNS =
  "id, name, image_url, short_description, badges, profile_tags, ingredients, created_at";

const matches = (values, text) =>
  !text ||
  values.filter(Boolean).some((value) => value.toLowerCase().includes(text));

const recipeValues = (recipe) => [
  recipe.name,
  recipe.short_description,
  ...(recipe.badges ?? []),
  ...(recipe.profile_tags ?? []),
  ...(recipe.ingredients ?? []).map((ingredient) => ingredient.name),
];

const ExploreAll = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { resolveIngredient } = useScents();
  const type = searchParams.get("type") ?? "premium";
  const favoritesOnly = searchParams.get("favorites") === "1";
  const searchText = (searchParams.get("q") ?? "").trim().toLowerCase();
  const [items, setItems] = useState([]);
  const [loadedKey, setLoadedKey] = useState("");
  const [error, setError] = useState("");
  const requestKey = `${type}:${userId ?? ""}:${favoritesOnly}`;
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let isCurrent = true;

    const load = async () => {
      let request;
      if (type === "scents" && favoritesOnly) {
        const { data: favorites } = userId
          ? await supabase
              .from("scent_favorites")
              .select("scent_id")
              .eq("user_id", userId)
          : { data: [] };
        request = supabase
          .from("scents")
          .select("id, name, image_url, scent_family, short_description")
          .in(
            "id",
            (favorites ?? []).map((favorite) => favorite.scent_id),
          )
          .order("name");
      } else if (type === "scents") {
        request = supabase
          .from("scents")
          .select("id, name, image_url, scent_family, short_description")
          .order("name");
      } else if (type === "premium") {
        request = supabase
          .from("premium_recipes")
          .select(COLUMNS)
          .order("created_at", { ascending: false });
      } else if (type === "mine") {
        request = userId
          ? supabase
              .from("recipes")
              .select(COLUMNS)
              .eq("user_id", userId)
              .eq("is_premade", false)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [], error: null });
      } else {
        request = supabase
          .from("recipes")
          .select(COLUMNS)
          .or("is_premade.eq.true,is_public.eq.true")
          .order("created_at", { ascending: false });
      }

      const { data, error: queryError } = await request;
      if (!isCurrent) return;
      setError(queryError?.message ?? "");
      setItems(data ?? []);
      setLoadedKey(requestKey);
    };

    void load();
    return () => {
      isCurrent = false;
    };
  }, [type, userId, requestKey, favoritesOnly]);

  const isScents = type === "scents";
  const activeTab = RECIPE_TABS.find((tab) => tab.type === type);
  const title = isScents
    ? favoritesOnly
      ? "Favourite scents"
      : "Scents"
    : (activeTab?.title ?? "Recipes");

  const visible = items.filter((item) =>
    matches(
      isScents
        ? [item.name, item.scent_family, item.short_description]
        : recipeValues(item),
      searchText,
    ),
  );

  const getRow = (item) => {
    if (isScents) {
      return {
        to: `/scents/${item.id}`,
        image: item.image_url,
        caption: item.scent_family,
        tags: item.short_description,
      };
    }
    const image =
      item.image_url ||
      (item.ingredients ?? [])
        .map(resolveIngredient)
        .find((ingredient) => ingredient.image_url)?.image_url;
    return {
      to: `/recipes/${item.id}${type === "premium" ? "?premium=1" : ""}`,
      image,
      caption:
        type === "premium"
          ? "NÉROLI+"
          : type === "mine"
            ? "My recipe"
            : "Community",
      tags: (item.profile_tags ?? []).join(" · "),
    };
  };

  const tabLink = (tab) =>
    `/explore/all?type=${tab}${searchText ? `&q=${encodeURIComponent(searchText)}` : ""}`;

  return (
    <main className="min-h-screen bg-[#EAE3D6] px-6 pb-8 pt-4 text-[#221B04]">
      <button
        className="grid size-10 place-items-center rounded-full bg-white"
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        <LuArrowLeft className="size-5" aria-hidden="true" />
      </button>

      <h1 className="mt-4 font-serif text-[32px] leading-tight">{title}</h1>

      {!isScents && (
        <div className="mt-6 flex gap-3 overflow-x-auto">
          {RECIPE_TABS.map((tab) => (
            <Link
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm ${
                tab.type === type
                  ? "bg-[#221B04] text-[#EAE3D6]"
                  : "bg-[#DDD6C8] text-[#8d897a]"
              }`}
              key={tab.type}
              to={tabLink(tab.type)}
              replace
              aria-current={tab.type === type ? "page" : undefined}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      )}

      {loading && <p className="mt-8 text-sm text-[#221B04]/70">Loading...</p>}
      {error && (
        <p className="mt-8 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && visible.length === 0 && (
        <p className="mt-8 text-sm text-[#221B04]/70">Nothing found.</p>
      )}

      <ul className="mt-6 space-y-4">
        {!loading &&
          visible.map((item) => {
            const row = getRow(item);
            return (
              <li key={item.id}>
                <Link
                  className="flex items-center gap-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04]"
                  to={row.to}
                >
                  <div className="h-29 w-26.5 shrink-0 overflow-hidden rounded-[20px] bg-[#D6D2C6]">
                    {row.image && (
                      <img
                        className="size-full object-cover"
                        src={row.image}
                        alt=""
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-base">{item.name}</h2>
                    {row.caption && (
                      <p className="mt-2 text-[13px] text-[#8d897a]">
                        {row.caption}
                      </p>
                    )}
                    {row.tags && (
                      <p className="mt-2 line-clamp-1 text-[13px] text-[#8d897a]">
                        {row.tags}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
      </ul>
    </main>
  );
};

export default ExploreAll;
