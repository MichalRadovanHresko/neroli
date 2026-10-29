import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { LuArrowLeft } from "react-icons/lu";
import { useAuth } from "../context/AuthContext.js";
import { getAvatarToStore } from "../lib/avatars";
import supabase from "../lib/supabase";
import { useScents } from "../lib/scents";
import Card from "../components/recipe/Card";
import ItemGrid from "../components/recipe/ItemGrid";
import { resolveEquipment } from "../lib/shopProducts";
import RecipeHero from "../components/recipe/RecipeHero";
import VisibilityCard from "../components/recipe/VisibilityCard";
import PremiumInsightCard from "../components/recipe/PremiumInsightCard";
import ScentProfileCard from "../components/recipe/ScentProfileCard";
import StepsCard from "../components/recipe/StepsCard";
import PairsCard from "../components/recipe/PairsCard";
import MediaCard from "../components/recipe/MediaCard";
import CommentsCard from "../components/recipe/CommentsCard";
import OwnerActions from "../components/recipe/OwnerActions";

// Load a recipe and coordinate its save, comment, and owner actions.
const RecipeDetail = () => {
  // Read the recipe identifier and premium-view flag from the current URL.
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isPremium = searchParams.get("premium") === "1";
  const navigate = useNavigate();
  // Track comment, deletion, saving, and recipe-loading states for the page.
  const [userComments, setUserComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentFormOpen, setCommentFormOpen] = useState(false);
  const [commentPending, setCommentPending] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const { resolveIngredient, scents } = useScents();
  const { session, isPremium: hasPremium } = useAuth();
  const userId = session?.user?.id;
  const [isSaved, setIsSaved] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check whether the signed-in user has saved this recipe.
  useEffect(() => {
    if (!userId) return;
    let isCurrent = true;

    supabase
      .from("recipe_saves")
      .select("recipe_id")
      .eq("user_id", userId)
      .eq("recipe_id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (isCurrent) setIsSaved(Boolean(data));
      });

    return () => {
      isCurrent = false;
    };
  }, [id, userId]);

  // Add or remove the recipe from the user’s saved list.
  const toggleSave = async () => {
    if (!userId || savePending) return;
    setSavePending(true);
    const result = isSaved
      ? await supabase
          .from("recipe_saves")
          .delete()
          .eq("user_id", userId)
          .eq("recipe_id", id)
      : await supabase
          .from("recipe_saves")
          .insert({ user_id: userId, recipe_id: id });
    if (!result.error) setIsSaved(!isSaved);
    setSavePending(false);
  };

  // Fetch either the community recipe or its premium equivalent.
  useEffect(() => {
    let isCurrent = true;

    const loadRecipe = async () => {
      const { data, error: queryError } = await supabase
        .from(isPremium ? "premium_recipes" : "recipes")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!isCurrent) return;
      if (queryError) setError(queryError.message);
      else if (!data) setError("Recipe not found.");
      else setRecipe(data);
      setLoading(false);
    };

    void loadRecipe();
    return () => {
      isCurrent = false;
    };
  }, [id, isPremium]);

  // Reuse the same back control in loading, error, and recipe views.
  const backButton = (
    <button
      className="absolute left-4 top-5 z-10 grid size-10 place-items-center rounded-full bg-[#F7F5F0] text-black"
      type="button"
      onClick={() => navigate(-1)}
      aria-label="Go back"
    >
      <LuArrowLeft className="size-5" aria-hidden="true" />
    </button>
  );

  // Load existing comments and ignore results after the page changes.
  useEffect(() => {
    let isCurrent = true;
    supabase
      .from("recipe_comments")
      .select("*")
      .eq("recipe_id", id)
      .order("created_at", { ascending: false })
      .then(({ data, error: loadError }) => {
        if (!isCurrent) return;
        if (loadError) setCommentError(loadError.message);
        else setUserComments(data ?? []);
      });
    return () => {
      isCurrent = false;
    };
  }, [id]);

  // Validate and post a comment, with a fallback for older database schemas.
  const submitComment = async (event) => {
    event.preventDefault();
    const body = commentText.trim();
    if (!body || !userId || commentPending) return;
    setCommentPending(true);
    setCommentError("");
    const user = session.user;
    const authorName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Anonymous";
    const row = {
      recipe_id: id,
      user_id: userId,
      author_name: authorName,
      body,
    };
    const insertComment = (values) =>
      supabase.from("recipe_comments").insert(values).select("*").single();
    let { data, error: insertError } = await insertComment({
      ...row,
      author_avatar: getAvatarToStore(user),
    });
    if (insertError?.message?.includes("author_avatar")) {
      ({ data, error: insertError } = await insertComment(row));
    }
    if (insertError) setCommentError(insertError.message);
    else {
      setUserComments((current) => [data, ...current]);
      setCommentText("");
      setCommentFormOpen(false);
    }
    setCommentPending(false);
  };

  // Remove only the current user’s comment and update the list immediately.
  const deleteComment = async (commentId) => {
    const { error: removeError } = await supabase
      .from("recipe_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId);
    if (removeError) setCommentError(removeError.message);
    else
      setUserComments((current) =>
        current.filter((comment) => comment.id !== commentId),
      );
  };

  // Handle loading and lookup failures before rendering recipe content.
  if (loading || error || !recipe) {
    return (
      <main className="relative min-h-screen bg-[#EAE3D6] px-6 pt-24 text-[#221B04]">
        {backButton}
        {loading && <p className="text-sm">Loading recipe...</p>}
        {error && (
          <p className="text-sm text-red-800" role="alert">
            {error}
          </p>
        )}
      </main>
    );
  }

  // Preview premium recipe details but require membership to read the recipe.
  if (isPremium && !hasPremium) {
    return (
      <main className="relative min-h-screen bg-[#EAE3D6] px-6 pt-24 text-[#221B04]">
        {backButton}
        <div className="mx-auto mt-10 max-w-sm rounded-3xl bg-[#F4F2EE] p-6 text-center">
          <span className="inline-block rounded-full bg-[#E2CFA3] px-3 py-1 text-xs font-semibold">
            NÉROLI+
          </span>
          <h1 className="mt-4 font-serif text-2xl">{recipe.name}</h1>
          <p className="mt-3 text-sm text-[#696555]">
            This is a premium recipe. Get NÉROLI+ to read it.
          </p>
          <Link
            className="mt-6 flex h-11 items-center justify-center rounded-full bg-[#696555] text-sm text-[#D8D1C1]"
            to="/premium"
          >
            Get NÉROLI+
          </Link>
        </div>
      </main>
    );
  }

  // Only the creator of a non-premade community recipe can manage it.
  const isOwner = !isPremium && !recipe.is_premade && recipe.user_id === userId;

  // Confirm deletion before removing the recipe and returning to the library.
  const deleteRecipe = async () => {
    if (!window.confirm("Delete this recipe? This cannot be undone.")) return;
    setDeleting(true);
    setDeleteError("");
    const { error: removeError } = await supabase
      .from("recipes")
      .delete()
      .eq("id", recipe.id)
      .eq("user_id", userId);
    if (removeError) {
      setDeleteError(removeError.message);
      setDeleting(false);
      return;
    }
    navigate("/scents", { replace: true });
  };

  // Resolve related recipe data into the shape used by display components.
  const ingredients = (recipe.ingredients ?? []).map(resolveIngredient);
  const equipment = (recipe.equipment ?? []).map(resolveEquipment);
  const pairedScents = (recipe.pairs_with ?? [])
    .map((id) => scents.find((scent) => scent.id === id))
    .filter(Boolean);
  const media = recipe.media ?? [];
  const steps = [...(recipe.steps ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );
  const comments = [...userComments, ...(recipe.comments ?? [])];
  const profile = recipe.profile ?? {};
  const heroImage =
    recipe.image_url ||
    ingredients.find((ingredient) => ingredient.image_url)?.image_url;

  // Render recipe details as reusable cards beneath the hero image.
  return (
    <main className="min-h-screen bg-[#EAE3D6] pb-18 text-[#221B04]">
      <RecipeHero
        backButton={backButton}
        heroImage={heroImage}
        isOwner={isOwner}
        isPremium={isPremium}
        isSaved={isSaved}
        recipe={recipe}
        savePending={savePending}
        toggleSave={toggleSave}
      />

      {/* Show ownership, premium notes, and recipe content where applicable. */}
      <div className="mx-auto max-w-3xl space-y-4 px-5 pt-5">
        {isOwner && <VisibilityCard recipe={recipe} />}
        {isPremium && <PremiumInsightCard />}
        {!isPremium && !isOwner && !recipe.is_premade && (
          <section className="rounded-3xl border border-[#D6D2C6] bg-[#F4F2EE] p-5">
            <h2 className="text-base font-semibold">Community recipe</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#696555]">
              This recipe was posted by another user and has not been reviewed.
              Review the ingredients, equipment, and steps carefully before
              making it, and use it at your own risk.
            </p>
          </section>
        )}
        {(isPremium || (isOwner && hasPremium)) && (
          <ScentProfileCard profile={profile} recipe={recipe} />
        )}

        {recipe.about && (
          <Card title="About this recipe">
            <p className="mt-3 text-sm leading-relaxed text-[#696555]">
              {recipe.about}
            </p>
          </Card>
        )}

        {ingredients.length > 0 && (
          <Card title="Ingredients">
            <ItemGrid items={ingredients} />
          </Card>
        )}

        {equipment.length > 0 && (
          <Card title="Equipment">
            <ItemGrid items={equipment} />
          </Card>
        )}

        {steps.length > 0 && <StepsCard steps={steps} />}

        {!recipe.is_premade && recipe.notes && (
          <Card title="Notes">
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[#696555]">
              {recipe.notes}
            </p>
          </Card>
        )}

        {pairedScents.length > 0 && <PairsCard pairedScents={pairedScents} />}

        {media.length > 0 && <MediaCard media={media} />}

        {/* Keep comment entry and moderation in their dedicated card. */}
        <CommentsCard
          commentError={commentError}
          commentFormOpen={commentFormOpen}
          commentPending={commentPending}
          commentText={commentText}
          comments={comments}
          deleteComment={deleteComment}
          isOwner={isOwner}
          session={session}
          setCommentFormOpen={setCommentFormOpen}
          setCommentText={setCommentText}
          submitComment={submitComment}
          userId={userId}
        />

        {isOwner && (
          <OwnerActions
            deleteError={deleteError}
            deleteRecipe={deleteRecipe}
            deleting={deleting}
            recipe={recipe}
          />
        )}
      </div>
    </main>
  );
};

export default RecipeDetail;
