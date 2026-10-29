import { LuPlus } from "react-icons/lu";
import { getAvatarToStore, resolveAvatar } from "../../lib/avatars";
import Card from "./Card";

// Display a recipe discussion and allow visitors to contribute.
// Show recent comment dates with familiar day labels.
const formatCommentDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString();
};

// Display recipe comments and allow signed-in visitors to contribute.
const CommentsCard = ({
  commentError,
  commentFormOpen,
  commentPending,
  commentText,
  comments,
  deleteComment,
  isOwner,
  session,
  setCommentFormOpen,
  setCommentText,
  submitComment,
  userId,
}) => (
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
    {/* Show the comment form only when it has been opened. */}
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
    {/* Explain an empty discussion or list the existing comments. */}
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
);

export default CommentsCard;
