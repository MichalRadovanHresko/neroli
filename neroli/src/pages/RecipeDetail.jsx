import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { LuArrowLeft, LuPencil, LuTrash2 } from "react-icons/lu";
import { useAuth } from "../context/AuthContext.js";
import supabase from "../lib/supabase";
import { useScents } from "../lib/scents";
import { resolveEquipment } from "../lib/shopProducts";

function SaveIcon({ filled }) {
  const common = {
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    stroke: "black",
  };
  return (
    <svg
      className="size-5"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        {...common}
        fill={filled ? "black" : "none"}
        d="M13.3334 7.49157V16.9582C13.3334 18.1666 12.4667 18.6749 11.4084 18.0916L8.13342 16.2666C7.78342 16.0749 7.21675 16.0749 6.86675 16.2666L3.59175 18.0916C2.53341 18.6749 1.66675 18.1666 1.66675 16.9582V7.49157C1.66675 6.06657 2.83341 4.8999 4.25841 4.8999H10.7417C12.1667 4.8999 13.3334 6.06657 13.3334 7.49157Z"
      />
      <path
        {...common}
        fill={filled ? "black" : "none"}
        d="M18.3334 4.25829V13.725C18.3334 14.9333 17.4667 15.4416 16.4084 14.8583L13.3334 13.1416V7.49163C13.3334 6.06663 12.1667 4.89996 10.7417 4.89996H6.66675V4.25829C6.66675 2.83329 7.83341 1.66663 9.25841 1.66663H15.7417C17.1667 1.66663 18.3334 2.83329 18.3334 4.25829Z"
      />
    </svg>
  );
}

const PREMIUM_PROFILE_FIELDS = [
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

const Card = ({ title, children }) => (
  <section className="rounded-3xl bg-[#D6CFBC] p-5">
    <h2 className="text-xl font-medium">{title}</h2>
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
  const [commentPending, setCommentPending] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const { resolveIngredient, scents } = useScents();
  const { session } = useAuth();
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
      .select("id, user_id, author_name, body, created_at")
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
    const { data, error: insertError } = await supabase
      .from("recipe_comments")
      .insert({ recipe_id: id, user_id: userId, author_name: authorName, body })
      .select("id, user_id, author_name, body, created_at")
      .single();
    if (insertError) setCommentError(insertError.message);
    else {
      setUserComments((current) => [data, ...current]);
      setCommentText("");
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
    <main className="min-h-screen bg-[#EAE3D6] pb-36 text-[#221B04]">
      <header className="relative flex min-h-[380px] flex-col justify-end overflow-hidden bg-[#696555] px-5 pb-6 text-white">
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
        <button
          className="absolute right-4 top-5 z-10 grid size-10 place-items-center rounded-full bg-[#F7F5F0] text-black disabled:opacity-60"
          type="button"
          onClick={toggleSave}
          disabled={savePending}
          aria-pressed={isSaved}
          aria-label={isSaved ? "Remove from saved" : "Save recipe"}
        >
          <SaveIcon filled={isSaved} />
        </button>
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
        {isPremium && (
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
                  <input
                    className="h-1 w-full accent-[#221B04]"
                    type="range"
                    min="0"
                    max="100"
                    value={profile[field.id]}
                    disabled
                    readOnly
                    aria-label={field.label}
                  />
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
                    className="aspect-square w-full rounded-[20px] object-cover"
                    src={item.url}
                    controls
                    playsInline
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

        <Card title="Comments">
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
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-semibold">
                      {comment.author_name}
                    </p>
                    <p className="text-xs text-[#696555]">
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
          <div className="mt-8 space-y-3">
            <Link
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#221B04] text-sm text-white"
              to={`/recipes/${recipe.id}/edit`}
            >
              <LuPencil className="size-4" aria-hidden="true" />
              Edit recipe
            </Link>
            {deleteError && (
              <p className="mb-3 text-sm text-red-800" role="alert">
                {deleteError}
              </p>
            )}
            <button
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#F7F5F0] text-sm text-red-800 disabled:opacity-60"
              type="button"
              onClick={deleteRecipe}
              disabled={deleting}
            >
              <LuTrash2 className="size-4" aria-hidden="true" />
              {deleting ? "Deleting..." : "Delete recipe"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default RecipeDetail;
