import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LuFlower } from "react-icons/lu";
import { useAuth } from "../context/AuthContext.js";
import supabase from "../lib/supabase";
import { getDisplayName } from "../lib/profileHelpers";
import { useScents } from "../lib/scents";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileMenu from "../components/profile/ProfileMenu";
import SavedList from "../components/profile/SavedList";
import CommentsList from "../components/profile/CommentsList";
import ActivityList from "../components/profile/ActivityList";
import EditProfileDialog from "../components/profile/EditProfileDialog";

// Display the signed-in user’s saved, commented, and created recipes.
// Keep profile sections in one place so the tab bar stays consistent.
const TABS = [
  { id: "saved", label: "Saved" },
  { id: "comments", label: "Comments" },
  { id: "activity", label: "My recipes" },
];

// Load and display the signed-in user’s saved, commented, and created recipes.
const Profile = () => {
  const { session, signOut, isPremium } = useAuth();
  const user = session?.user;
  const userId = user?.id;
  const { resolveIngredient } = useScents();
  // Track which profile list is open and scroll its tabs into view on demand.
  const [tab, setTab] = useState("saved");
  const tabsRef = useRef(null);
  // Switch profile sections and bring the tab controls into view.
  const openTab = (id) => {
    setTab(id);
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  // Keep the profile data and dialog state together for this screen.
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
  // Create a preview URL for a selected avatar and release it when replaced.
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

  // Load saved recipes, the user’s own recipes, and their comments in parallel.
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

  // Reset the edit form to the current account details before opening it.
  const openEdit = () => {
    setMenuOpen(false);
    setError("");
    setDraftName(getDisplayName(user));
    setDraftFile(null);
    setRemoveAvatar(false);
    setEditOpen(true);
  };

  // Avoid closing the dialog while a profile update is in progress.
  const closeEdit = () => {
    if (saving) return;
    setEditOpen(false);
  };

  // Accept image files only and clear the native input for future selections.
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

  // Upload a new avatar if needed, then save the profile metadata.
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

  // Sign out while showing a useful error if the request fails.
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

  // Prefer a recipe image, then fall back to its first pictured ingredient.
  const getImage = (recipe) =>
    recipe.image_url ||
    (recipe.ingredients ?? [])
      .map(resolveIngredient)
      .find((ingredient) => ingredient.image_url)?.image_url ||
    null;

  // Build a compact text summary for each recipe row.
  const ingredientNames = (recipe) =>
    (recipe.ingredients ?? []).map((ingredient) => ingredient.name).join(" ");

  // Render the profile header, section tabs, lists, and edit dialog.
  return (
    <main className="min-h-screen bg-[#EAE3D6] pb-56 text-[#221B04]">
      <div className="mx-auto max-w-3xl">
        <ProfileHeader
          comments={comments}
          handleSignOut={handleSignOut}
          menuOpen={menuOpen}
          openEdit={openEdit}
          openTab={openTab}
          ownRecipes={ownRecipes}
          saved={saved}
          setMenuOpen={setMenuOpen}
          signingOut={signingOut}
          user={user}
        />

        {/* Provide account shortcuts and the profile section selector. */}
        <div className="px-4 pt-5">
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-[#E2CFA3] px-3 py-1.5 text-xs font-semibold"
            to="/premium"
          >
            <LuFlower className="size-4" aria-hidden="true" />
            {isPremium ? "Neroli+ · Premium member" : "Get Neroli+"}
          </Link>

          <ProfileMenu isPremium={isPremium} />

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

          {/* Render only the selected list after profile data is ready. */}
          {!loading && tab === "saved" && (
            <SavedList
              getImage={getImage}
              ingredientNames={ingredientNames}
              saved={saved}
            />
          )}

          {!loading && tab === "comments" && (
            <CommentsList comments={comments} />
          )}

          {!loading && tab === "activity" && (
            <ActivityList getImage={getImage} ownRecipes={ownRecipes} />
          )}
        </div>
      </div>
      {/* Keep the edit form in a modal so it does not replace the profile. */}
      {editOpen && (
        <EditProfileDialog
          avatarInput={avatarInput}
          closeEdit={closeEdit}
          draftFile={draftFile}
          draftName={draftName}
          draftPreview={draftPreview}
          error={error}
          handlePickAvatar={handlePickAvatar}
          handleSaveProfile={handleSaveProfile}
          removeAvatar={removeAvatar}
          saving={saving}
          setDraftFile={setDraftFile}
          setDraftName={setDraftName}
          setRemoveAvatar={setRemoveAvatar}
          user={user}
        />
      )}
    </main>
  );
};

export default Profile;
