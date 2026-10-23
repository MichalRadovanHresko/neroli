import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LuSettings } from "react-icons/lu";
import { useAuth } from "../context/AuthContext.js";
import supabase from "../lib/supabase";
import { useScents } from "../lib/scents";

const TABS = [
  { id: "saved", label: "Saved" },
  { id: "mine", label: "My recipes" },
  { id: "activity", label: "Activity" },
];

const getDisplayName = (user) =>
  user?.user_metadata?.full_name ||
  user?.user_metadata?.name ||
  user?.email?.split("@")[0] ||
  "";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "";

const Stat = ({ value, label }) => (
  <div className="text-center">
    <p className="text-xl">{value}</p>
    <p className="mt-1 text-sm">{label}</p>
  </div>
);

const RecipeRow = ({ recipe, image, caption }) => (
  <Link
    className="flex items-center gap-4 rounded-2xl bg-[#F7F5F0] p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04]"
    to={`/recipes/${recipe.id}`}
  >
    <span className="block size-24 shrink-0 overflow-hidden rounded-xl bg-[#D6D2C6]">
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
      <span className="mt-2 block text-xs text-[#696555]">{caption}</span>
    </span>
  </Link>
);

const Profile = () => {
  const { session, signOut } = useAuth();
  const user = session?.user;
  const userId = user?.id;
  const { resolveIngredient } = useScents();
  const [tab, setTab] = useState("saved");
  const [saved, setSaved] = useState([]);
  const [ownRecipes, setOwnRecipes] = useState([]);
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let isCurrent = true;

    const load = async () => {
      const [savedResult, ownResult, commentResult] = await Promise.all([
        supabase
          .from("recipe_saves")
          .select(
            "created_at, recipe:recipes (id, name, image_url, ingredients)",
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("recipes")
          .select("id, name, image_url, ingredients, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("recipe_comments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);

      if (!isCurrent) return;
      const firstError =
        savedResult.error || ownResult.error || commentResult.error;
      if (firstError) setError(firstError.message);
      setSaved((savedResult.data ?? []).filter((row) => row.recipe));
      setOwnRecipes(ownResult.data ?? []);
      setCommentCount(commentResult.count ?? 0);
      setLoading(false);
    };

    void load();
    return () => {
      isCurrent = false;
    };
  }, [userId]);

  const handleSignOut = async () => {
    setError("");
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setError("Could not sign out. Please try again.");
      setSigningOut(false);
    }
  };

  const getImage = (recipe) =>
    recipe.image_url ||
    (recipe.ingredients ?? [])
      .map(resolveIngredient)
      .find((ingredient) => ingredient.image_url)?.image_url ||
    null;

  const activity = [
    ...saved.map((row) => ({
      key: `save-${row.recipe.id}`,
      label: "Saved",
      recipe: row.recipe,
      date: row.created_at,
    })),
    ...ownRecipes.map((recipe) => ({
      key: `own-${recipe.id}`,
      label: "Created",
      recipe,
      date: recipe.created_at,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const ingredientNames = (recipe) =>
    (recipe.ingredients ?? []).map((ingredient) => ingredient.name).join(" ");

  return (
    <main className="min-h-screen bg-[#EAE3D6] px-5 pb-36 pt-6 text-[#221B04]">
      <div className="mx-auto max-w-3xl">
        <div className="relative flex justify-end">
          <button
            className="grid size-10 place-items-center"
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Settings"
            aria-expanded={menuOpen}
          >
            <LuSettings className="size-7" aria-hidden="true" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-11 z-10 min-w-40 rounded-2xl bg-[#F7F5F0] p-2 shadow-[0_6px_18px_rgba(34,27,4,0.15)]">
              <button
                className="w-full rounded-xl px-3 py-2 text-left text-sm disabled:opacity-60"
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          )}
        </div>

        <div className="-mt-4 flex flex-col items-center">
          <div
            className="size-34 rounded-full bg-[#221B04]"
            role="img"
            aria-label="Profile picture"
          />
          <h1 className="mt-7 text-xl">{getDisplayName(user)}</h1>
        </div>

        <div className="mx-auto mt-6 grid max-w-xs grid-cols-3 gap-4">
          <Stat value={saved.length} label="Saved" />
          <Stat value={commentCount} label="Comments" />
          <Stat value={ownRecipes.length} label="Recipes" />
        </div>

        <div
          className="mt-8 grid grid-cols-3 gap-2"
          role="tablist"
          aria-label="Profile sections"
        >
          {TABS.map((item) => (
            <button
              className={`h-10 rounded-full text-sm ${
                tab === item.id ? "bg-[#D6D2C6]" : ""
              }`}
              type="button"
              role="tab"
              key={item.id}
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-5 text-sm text-red-800" role="alert">
            {error}
          </p>
        )}
        {loading && !error && (
          <p className="mt-6 text-sm text-[#221B04]/70">Loading...</p>
        )}

        {!loading && tab === "saved" && (
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
        )}

        {!loading && tab === "mine" && (
          <>
            <ul className="mt-6 space-y-3">
              {ownRecipes.map((recipe) => (
                <li key={recipe.id}>
                  <RecipeRow
                    recipe={recipe}
                    image={getImage(recipe)}
                    caption={ingredientNames(recipe)}
                  />
                </li>
              ))}
            </ul>
            {ownRecipes.length === 0 && (
              <p className="mt-6 text-sm text-[#221B04]/70">
                You haven’t created any recipes yet.{" "}
                <Link className="underline" to="/add">
                  Create one
                </Link>
              </p>
            )}
          </>
        )}

        {!loading && tab === "activity" && (
          <ul className="mt-6 space-y-3">
            {activity.map((item) => (
              <li key={item.key}>
                <RecipeRow
                  recipe={item.recipe}
                  image={getImage(item.recipe)}
                  caption={`${item.label} · ${formatDate(item.date)}`}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
};

export default Profile;
