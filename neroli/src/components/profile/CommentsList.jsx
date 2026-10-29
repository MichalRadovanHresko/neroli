import { formatDate } from "../../lib/profileHelpers";
import { Link } from "react-router-dom";

// List the user’s comments and link each one to its recipe.
const CommentsList = ({ comments }) => (
  <ul className="mt-6 space-y-3">
    {comments.length === 0 && (
      <li className="text-sm text-[#221B04]/70">You haven't commented yet.</li>
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
);

export default CommentsList;
