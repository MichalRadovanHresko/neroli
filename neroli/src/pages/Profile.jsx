import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LuFlower, LuGift, LuLock, LuUser } from "react-icons/lu";
import settingsIcon from "../assets/icons/settings.svg";
import heroImage from "../assets/images/background-image.jpg";
import { getDefaultAvatar } from "../lib/avatars";
import { useAuth } from "../context/AuthContext.js";
import supabase from "../lib/supabase";
import { useScents } from "../lib/scents";

const TABS = [
  { id: "saved", label: "Saved" },
  { id: "comments", label: "Comments" },
  { id: "activity", label: "My recipes" },
];

const getDisplayName = (user) =>
  user?.user_metadata?.full_name ||
  user?.user_metadata?.name ||
  user?.email?.split("@")[0] ||
  "";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "";

const Stat = ({ value, label, onClick }) => {
  const content = (
    <>
      <p className="text-xl">{value}</p>
      <p className="mt-1 text-sm">{label}</p>
    </>
  );
  return onClick ? (
    <button className="text-center" type="button" onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className="text-center">{content}</div>
  );
};

const FeatureCard = ({ icon: Icon, title, text, to, locked }) => (
  <Link
    to={locked ? "/premium" : to}
    className="flex items-center gap-4 rounded-[20px] bg-[#F7F5F0] p-3.5"
  >
    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#EAE3D6]">
      <Icon className="size-5" aria-hidden="true" />
    </span>
    <span className="flex-1">
      <span className="block text-[15px] font-semibold">{title}</span>
      <span className="mt-0.5 block text-xs text-[#696555]">
        {locked ? "Unlock with Neroli+" : text}
      </span>
    </span>
    {locked && (
      <LuLock className="size-5 shrink-0 text-[#696555]" aria-label="Locked" />
    )}
  </Link>
);

const RecipeRow = ({ recipe, image, caption }) => (
  <Link
    className="flex items-center gap-4 rounded-2xl bg-[#F7F5F0] p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04]"
    to={`/recipes/${recipe.id}${recipe.isPremium ? "?premium=1" : ""}`}
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
  const { session, signOut, isPremium } = useAuth();
  const user = session?.user;
  const userId = user?.id;
  const { resolveIngredient } = useScents();
  const [tab, setTab] = useState("saved");
  const tabsRef = useRef(null);
  const openTab = (id) => {
    setTab(id);
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const [saved, setSaved] = useState([]);
  const [ownRecipes, setOwnRecipes] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftFile, setDraftFile] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const avatarInput = useRef(null);
  const draftPreview = useMemo(
    () => (draftFile ? URL.createObjectURL(draftFile) : null),
    [draftFile],
  );
  useEffect(
    () => () => {
      if (draftPreview) URL.revokeObjectURL(draftPreview);
    },
    [draftPreview],
  );

  useEffect(() => {
    if (!userId) return;
    let isCurrent = true;

    const load = async () => {
      const [savedResult, ownResult, commentResult] = await Promise.all([
        supabase
          .from("recipe_saves")
          .select("created_at, recipe_id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("recipes")
          .select("id, name, image_url, ingredients, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("recipe_comments")
          .select("id, recipe_id, body, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);

      if (!isCurrent) return;

      const savedRows = savedResult.data ?? [];
      const commentRows = commentResult.data ?? [];
      const savedIds = [
        ...new Set([
          ...savedRows.map((row) => row.recipe_id),
          ...commentRows.map((row) => row.recipe_id),
        ]),
      ];
      const columns = "id, name, image_url, ingredients";
      const [normalResult, premiumResult] = savedIds.length
        ? await Promise.all([
            supabase.from("recipes").select(columns).in("id", savedIds),
            supabase.from("premium_recipes").select(columns).in("id", savedIds),
          ])
        : [{ data: [] }, { data: [] }];

      if (!isCurrent) return;
      const recipesById = new Map([
        ...(normalResult.data ?? []).map((item) => [item.id, item]),
        ...(premiumResult.data ?? []).map((item) => [
          item.id,
          { ...item, isPremium: true },
        ]),
      ]);
      const savedWithRecipes = savedRows
        .map((row) => ({ ...row, recipe: recipesById.get(row.recipe_id) }))
        .filter((row) => row.recipe);

      const firstError =
        savedResult.error || ownResult.error || commentResult.error;
      if (firstError) setError(firstError.message);
      setSaved(savedWithRecipes);
      setOwnRecipes(ownResult.data ?? []);
      setComments(
        commentRows.map((row) => ({
          ...row,
          recipe: recipesById.get(row.recipe_id),
        })),
      );
      setLoading(false);
    };

    void load();
    return () => {
      isCurrent = false;
    };
  }, [userId]);

  const openEdit = () => {
    setMenuOpen(false);
    setError("");
    setDraftName(getDisplayName(user));
    setDraftFile(null);
    setRemoveAvatar(false);
    setEditOpen(true);
  };

  const closeEdit = () => {
    if (saving) return;
    setEditOpen(false);
  };

  const handlePickAvatar = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError("");
    setDraftFile(file);
    setRemoveAvatar(false);
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    const name = draftName.trim();
    if (!name) {
      setError("Nickname can't be empty.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      const data = { full_name: name, name };
      if (draftFile) {
        const safeName = draftFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${userId}/avatar/${crypto.randomUUID()}-${safeName}`;
        const uploadResult = await supabase.storage
          .from("recipe-media")
          .upload(path, draftFile, { contentType: draftFile.type });
        if (uploadResult.error) throw uploadResult.error;
        data.avatar_url = supabase.storage
          .from("recipe-media")
          .getPublicUrl(path).data.publicUrl;
      } else if (removeAvatar) {
        data.avatar_url = null;
      }

      const { error: updateError } = await supabase.auth.updateUser({ data });
      if (updateError) throw updateError;
      setEditOpen(false);
    } catch {
      setError("Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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

  const ingredientNames = (recipe) =>
    (recipe.ingredients ?? []).map((ingredient) => ingredient.name).join(" ");

  return (
    <main className="min-h-screen bg-[#EAE3D6] pb-56 text-[#221B04]">
      <div className="mx-auto max-w-3xl">
        <header className="relative h-93 overflow-hidden bg-[#D8D1C1] text-[#F7F5F0]">
          <img
            className="absolute inset-0 size-full object-cover"
            src={heroImage}
            alt=""
          />
          <div className="absolute inset-0 bg-[#D8D1C1]/45" />
          <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(234,227,214,1)_0%,rgba(234,227,214,0.6)_50%,rgba(234,227,214,0)_100%)]" />

          <div className="absolute right-6 top-14.5 z-10">
            <button
              className="grid size-10 place-items-center rounded-full bg-[#F7F5F0] text-[#221B04]"
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Settings"
              aria-expanded={menuOpen}
            >
              <img className="size-5" src={settingsIcon} alt="" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 min-w-40 rounded-2xl bg-[#F7F5F0] p-2 text-base text-[#221B04] shadow-[0_6px_18px_rgba(34,27,4,0.15)]">
                <button
                  className="w-full rounded-xl px-3 py-2 text-left"
                  type="button"
                  onClick={openEdit}
                >
                  Edit profile
                </button>
                <Link
                  className="block w-full rounded-xl px-3 py-2 text-left"
                  to="/onboarding?edit=1"
                >
                  Preferences
                </Link>
                <button
                  className="w-full rounded-xl px-3 py-2 text-left disabled:opacity-60"
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  {signingOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            )}
          </div>

          <div className="absolute inset-x-0 top-16.5 flex flex-col items-center">
            <div className="relative">
              <img
                className="size-34 rounded-full border-[3px] border-white bg-[#D8D1C1] object-cover"
                src={user?.user_metadata?.avatar_url || getDefaultAvatar(user)}
                alt="Profile picture"
              />
            </div>
            <h1 className="mt-5 text-xl">{getDisplayName(user)}</h1>
          </div>

          <div className="absolute inset-x-5 bottom-6 grid grid-cols-3 gap-4 rounded-[28px] bg-[#F7F5F0]/95 px-6 py-4 text-[#221B04] shadow-[0_2px_10px_rgba(34,27,4,0.1)]">
            <Stat
              value={saved.length}
              label="Saved"
              onClick={() => openTab("saved")}
            />
            <Stat
              value={comments.length}
              label="Comments"
              onClick={() => openTab("comments")}
            />
            <Stat
              value={ownRecipes.length}
              label="Recipes"
              onClick={() => openTab("activity")}
            />
          </div>
        </header>

        <div className="px-4 pt-5">
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-[#E2CFA3] px-3 py-1.5 text-xs font-semibold"
            to="/premium"
          >
            <LuFlower className="size-4" aria-hidden="true" />
            {isPremium ? "Neroli+ · Premium member" : "Get Neroli+"}
          </Link>

          <div className="mt-4 space-y-3">
            <FeatureCard
              icon={LuGift}
              to="/profile/wrapped"
              locked={!isPremium}
              title="Scent Wrapped 2026"
              text="Your annual scent story"
            />
            <FeatureCard
              icon={LuUser}
              to="/profile/scent-profile"
              locked={!isPremium}
              title="Scent Profile"
              text="Your scent preferences & matches"
            />
          </div>

          <div
            ref={tabsRef}
            className="mt-8 grid scroll-mt-4 grid-cols-3 gap-2"
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

          {!loading && tab === "comments" && (
            <ul className="mt-6 space-y-3">
              {comments.length === 0 && (
                <li className="text-sm text-[#221B04]/70">
                  You haven't commented yet.
                </li>
              )}
              {comments.map((comment) => (
                <li key={comment.id}>
                  <Link
                    className="block rounded-2xl bg-[#F7F5F0] p-4"
                    to={
                      comment.recipe
                        ? `/recipes/${comment.recipe.id}${comment.recipe.isPremium ? "?premium=1" : ""}`
                        : "/explore"
                    }
                  >
                    <span className="block text-sm">{comment.body}</span>
                    <span className="mt-2 block text-xs text-[#696555]">
                      {comment.recipe?.name ?? "Recipe"} ·{" "}
                      {formatDate(comment.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {!loading && tab === "activity" && (
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
          )}
        </div>
      </div>
      {editOpen && (
        <div
          className="fixed inset-0 z-100 flex items-end justify-center bg-[#221B04]/50"
          role="dialog"
          aria-modal="true"
          aria-label="Edit profile"
          onClick={closeEdit}
        >
          <div
            className="w-full max-w-md rounded-t-[30px] bg-[#EAE3D6] px-6 pb-8 pt-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-center font-serif text-2xl">Edit profile</h2>
            <div className="mt-5 flex flex-col items-center">
              <img
                className="size-28 rounded-full border-[3px] border-white bg-[#D8D1C1] object-cover"
                src={
                  draftPreview ||
                  (removeAvatar ? null : user?.user_metadata?.avatar_url) ||
                  getDefaultAvatar(user)
                }
                alt="Profile picture preview"
              />
              <input
                ref={avatarInput}
                className="hidden"
                type="file"
                accept="image/*"
                onChange={handlePickAvatar}
              />
              <div className="mt-4 flex gap-3">
                <button
                  className="rounded-full bg-[#D6D2C6] px-4 py-2 text-xs"
                  type="button"
                  onClick={() => avatarInput.current?.click()}
                >
                  Choose photo
                </button>
                {(draftFile || user?.user_metadata?.avatar_url) &&
                  !removeAvatar && (
                    <button
                      className="rounded-full bg-[#F7F5F0] px-4 py-2 text-xs"
                      type="button"
                      onClick={() => {
                        setDraftFile(null);
                        setRemoveAvatar(
                          Boolean(user?.user_metadata?.avatar_url),
                        );
                      }}
                    >
                      Remove photo
                    </button>
                  )}
              </div>
            </div>
            <label
              className="mt-6 block text-xs text-[#696555]"
              htmlFor="nickname"
            >
              Nickname
            </label>
            <input
              id="nickname"
              className="mt-1 h-12 w-full rounded-full bg-[#F7F5F0] px-5 text-sm outline-none focus-visible:outline-2 focus-visible:outline-[#696555]"
              value={draftName}
              maxLength={30}
              onChange={(event) => setDraftName(event.target.value)}
            />
            {error && (
              <p className="mt-3 text-sm text-red-800" role="alert">
                {error}
              </p>
            )}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                className="h-11 rounded-full bg-[#F7F5F0] text-sm"
                type="button"
                onClick={closeEdit}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="h-11 rounded-full bg-[#696555] text-sm text-[#D8D1C1] disabled:opacity-60"
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Profile;
