import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  LuArrowLeft,
  LuGlobe,
  LuHeart,
  LuInfo,
  LuPlus,
  LuSquarePen,
  LuUser,
} from "react-icons/lu";
import { useAuth } from "../context/AuthContext.js";
import { getAvatarToStore, resolveAvatar } from "../lib/avatars";
import supabase from "../lib/supabase";
import { useScents } from "../lib/scents";
import { resolveEquipment } from "../lib/shopProducts";

const PREMIUM_PROFILE_FIELDS = [
  { id: "sweet", label: "Sweet" },
  { id: "warm", label: "Warm" },
  { id: "intensity", label: "Intensity" },
  { id: "note", label: "Note" },
  { id: "fresh", label: "Fresh" },
];

const formatCommentDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString();
};

const ItemGrid = ({ items }) => (
  <div className="mt-4 grid grid-cols-3 gap-x-3 gap-y-4">
    {items.map((item, index) => {
      const tile = (
        <>
          <div className="aspect-square overflow-hidden rounded-[18px] bg-[#C9BFA9]">
            {item.image_url && (
              <img
                className="size-full object-cover"
                src={item.image_url}
                alt=""
                loading="lazy"
              />
            )}
          </div>
          <p className="mt-2 text-xs text-[#221B04]">{item.name}</p>
        </>
      );
      return (
        <div className="min-w-0 text-center" key={`${item.name}-${index}`}>
          {item.scent_id ? (
            <Link to={`/scents/${item.scent_id}`} className="block">
              {tile}
            </Link>
          ) : (
            tile
          )}
        </div>
      );
    })}
  </div>
);

const Card = ({ title, action, children }) => (
  <section className="rounded-3xl bg-[#D6CFBC] p-5 shadow-[0_2px_8px_rgba(34,27,4,0.06)]">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xl font-normal">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

const RecipeDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isPremium = searchParams.get("premium") === "1";
  const navigate = useNavigate();
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

  const isOwner = !isPremium && !recipe.is_premade && recipe.user_id === userId;

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

  return (
    <main className="min-h-screen bg-[#EAE3D6] pb-[calc(var(--spacing)*18)] text-[#221B04]">
      <header className="relative flex min-h-95 flex-col justify-end overflow-hidden bg-[#696555] px-5 pb-6 text-white">
        {heroImage && (
          <img
            className="absolute inset-0 size-full object-cover"
            src={heroImage}
            alt=""
            fetchPriority="high"
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(34,27,4,0)_0%,rgba(34,27,4,0.45)_100%)]" />
        {backButton}
        {isOwner ? (
          <Link
            className="absolute right-4 top-5 z-10 grid size-10 place-items-center rounded-full bg-[#F7F5F0] text-black"
            to={`/recipes/${recipe.id}/edit`}
            aria-label="Edit recipe"
          >
            <LuSquarePen className="size-5" aria-hidden="true" />
          </Link>
        ) : (
          <button
            className="absolute right-4 top-5 z-10 grid size-10 place-items-center rounded-full bg-[#F7F5F0] text-black disabled:opacity-60"
            type="button"
            onClick={toggleSave}
            disabled={savePending}
            aria-pressed={isSaved}
            aria-label={isSaved ? "Remove from saved" : "Save recipe"}
          >
            <LuHeart
              className={`size-5 ${isSaved ? "text-[#696555]" : ""}`}
              fill={isSaved ? "currentColor" : "none"}
              aria-hidden="true"
            />
          </button>
        )}
        <div className="relative">
          <div className="flex flex-wrap gap-2">
            {[
              isPremium ? "Premium" : "Community",
              ...(recipe.badges ?? []).filter(
                (badge) =>
                  !["premium", "community"].includes(badge.toLowerCase()),
              ),
            ].map((badge) => (
              <span
                className="rounded-full bg-[#F7F5F0] px-3 py-1 text-xs text-[#221B04]"
                key={badge}
              >
                {badge}
              </span>
            ))}
          </div>
          <h1 className="mt-3 font-serif text-3xl uppercase leading-tight">
            {recipe.name}
          </h1>
          {recipe.short_description && (
            <p className="mt-2 max-w-md text-sm leading-snug text-white/90">
              {recipe.short_description}
            </p>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-4 px-5 pt-5">
        {isOwner && (
          <Card title="Recipe visibility">
            <div className="flex items-start justify-between gap-3">
              <p className="mt-1 text-xs text-[#696555]">
                This is your published
                <br />
                visibility status.
              </p>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#F7F5F0] px-3 py-1.5 text-xs font-semibold">
                {recipe.is_public ? (
                  <LuGlobe className="size-4" aria-hidden="true" />
                ) : (
                  <LuUser className="size-4" aria-hidden="true" />
                )}
                {recipe.is_public ? "Public" : "Private"}
              </span>
            </div>
            <ul className="mt-3 space-y-3">
              {(recipe.is_public
                ? [
                    "Everyone can see this recipe.",
                    "It can appear in Explore and community feeds.",
                    "You can change this later in Edit recipe.",
                  ]
                : [
                    "Only you can see this recipe.",
                    "It will not appear in Explore or community feeds.",
                    "You can change this later in Edit recipe.",
                  ]
              ).map((line) => (
                <li className="flex items-center gap-3 text-sm" key={line}>
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#696555] text-white">
                    <LuInfo className="size-3.5" aria-hidden="true" />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </Card>
        )}
        {isPremium && (
          <section className="rounded-3xl bg-[#F4F2EE] p-5 shadow-[0_2px_8px_rgba(34,27,4,0.06)]">
            <div className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#221B04] font-serif text-[8px] uppercase text-[#E2CFA3]">
                Néroli
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold">Neroli suggestion</h2>
                <p className="text-xs text-[#C9B98A]">Posted by the app</p>
              </div>
              <span className="shrink-0 rounded-full bg-[#E2CFA3] px-3 py-1 text-xs font-semibold">
                Safe to use
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#696555]">
              This recipe is an official Neroli suggestion posted by the app. It
              is intended to be a safe, everyday fragrance option and is
              presented here as a curated suggestion from the app.
            </p>
          </section>
        )}
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
          <Card title="Scent profile">
            <div className="mt-4 flex flex-wrap gap-2">
              {(recipe.profile_tags ?? []).map((tag) => (
                <span
                  className="rounded-full bg-[#F7F5F0] px-4 py-1.5 text-xs"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              {PREMIUM_PROFILE_FIELDS.filter(
                (field) => typeof profile[field.id] === "number",
              ).map((field) => (
                <div
                  className="grid grid-cols-[56px_minmax(0,1fr)_42px] items-center gap-3 text-xs text-[#696555]"
                  key={field.id}
                >
                  <span>{field.label}</span>
                  <span
                    className="relative h-px w-full bg-[#221B04]/40"
                    role="img"
                    aria-label={`${field.label} ${profile[field.id]}%`}
                  >
                    <span
                      className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#221B04]"
                      style={{ left: `${profile[field.id]}%` }}
                    />
                  </span>
                  <span className="text-right">{profile[field.id]}%</span>
                </div>
              ))}
            </div>
          </Card>
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

        {steps.length > 0 && (
          <Card title="Step by step">
            <ol className="mt-4 space-y-4">
              {steps.map((step, index) => (
                <li className="flex gap-3" key={step.position ?? index}>
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#696555] text-xs text-white">
                    {step.position ?? index + 1}
                  </span>
                  <p className="text-sm leading-snug text-[#696555]">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {!recipe.is_premade && recipe.notes && (
          <Card title="Notes">
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[#696555]">
              {recipe.notes}
            </p>
          </Card>
        )}

        {pairedScents.length > 0 && (
          <Card title="Pairs well with">
            <div className="mt-4 grid grid-cols-3 gap-4">
              {pairedScents.map((scent) => (
                <Link
                  className="min-w-0"
                  key={scent.id}
                  to={`/scents/${scent.id}`}
                >
                  <div className="aspect-square overflow-hidden rounded-[20px] bg-[#D6D2C6]">
                    {scent.image_url && (
                      <img
                        className="size-full object-cover"
                        src={scent.image_url}
                        alt={scent.name}
                      />
                    )}
                  </div>
                  <p className="mt-2 truncate text-center text-xs text-[#696555]">
                    {scent.name}
                  </p>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {media.length > 0 && (
          <Card title="Media">
            <div className="mt-4 grid grid-cols-2 gap-3">
              {media.map((item) =>
                item.type === "video" ? (
                  <video
                    className="col-span-2 aspect-video w-full rounded-[20px] bg-black object-contain"
                    src={item.url}
                    controls
                    playsInline
                    preload="auto"
                    key={item.url}
                  />
                ) : (
                  <img
                    className="aspect-square w-full rounded-[20px] object-cover"
                    src={item.url}
                    alt=""
                    key={item.url}
                  />
                ),
              )}
            </div>
          </Card>
        )}

        <Card
          title="Comments"
          action={
            !isOwner && (
              <button
                className="grid size-10 place-items-center rounded-full bg-white"
                type="button"
                onClick={() => setCommentFormOpen((open) => !open)}
                aria-expanded={commentFormOpen}
                aria-label="Add a comment"
              >
                <LuPlus
                  className={`size-5 transition-transform ${commentFormOpen ? "rotate-45" : ""}`}
                  aria-hidden="true"
                />
              </button>
            )
          }
        >
          {commentFormOpen && !isOwner && (
            <form className="mt-4 flex gap-2" onSubmit={submitComment}>
              <input
                className="h-11 min-w-0 flex-1 rounded-full bg-[#F4F2EE] px-4 text-sm outline-none placeholder:text-[#9c9889] focus-visible:ring-2 focus-visible:ring-[#696555]"
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Write a comment..."
                aria-label="Write a comment"
                maxLength={500}
              />
              <button
                className="h-11 rounded-full bg-[#221B04] px-5 text-sm text-white disabled:opacity-50"
                type="submit"
                disabled={commentPending || !commentText.trim()}
              >
                Post
              </button>
            </form>
          )}
          {commentError && (
            <p className="mt-3 text-sm text-red-800" role="alert">
              {commentError}
            </p>
          )}
          {comments.length === 0 ? (
            <p className="mt-4 text-sm text-[#696555]">
              No comments yet. Be the first.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {comments.map((comment, index) => (
                <li
                  className="rounded-2xl bg-[#F4F2EE] p-4"
                  key={comment.id ?? `${comment.author_name}-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      className="size-10 shrink-0 rounded-full bg-[#D6D2C6] object-cover"
                      src={resolveAvatar(
                        comment.user_id && comment.user_id === userId
                          ? getAvatarToStore(session.user)
                          : comment.author_avatar,
                        comment.user_id ?? comment.author_name,
                      )}
                      alt=""
                    />
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {comment.author_name}
                    </p>
                    <p className="shrink-0 text-xs text-[#696555]">
                      {formatCommentDate(comment.created_at)}
                    </p>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-snug text-[#696555]">
                    {comment.body}
                  </p>
                  {comment.user_id && comment.user_id === userId && (
                    <button
                      className="mt-2 text-xs text-red-800 underline"
                      type="button"
                      onClick={() => deleteComment(comment.id)}
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {isOwner && (
          <div className="mt-10 space-y-3 px-3">
            <Link
              className="flex h-12 w-full items-center justify-center rounded-[23.603px] bg-[#D6CFBC] text-sm font-medium shadow-[0_3.147px_3.147px_0_rgba(0,0,0,0.1)]"
              to={`/recipes/${recipe.id}/edit`}
            >
              Edit recipe
            </Link>
            {deleteError && (
              <p className="text-sm text-red-800" role="alert">
                {deleteError}
              </p>
            )}
            <button
              className="flex h-12 w-full items-center justify-center rounded-[23.603px] bg-[#221B04] text-sm font-medium text-white shadow-[0_3.147px_3.147px_0_rgba(0,0,0,0.25)] disabled:opacity-60"
              type="button"
              onClick={deleteRecipe}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default RecipeDetail;
