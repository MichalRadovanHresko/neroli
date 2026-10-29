import { LuHeart } from "react-icons/lu";

// Let users toggle a scent or recipe in their favorites.

const FavoriteButton = ({ name, isFavorite, disabled = false, onClick }) => (
  // Keep the accessible label and heart appearance in sync with favorite state.
  <button
    className="grid size-11 place-items-center rounded-full border border-white/70 bg-[#F4F2EE]/95 text-[#221B04] shadow-sm disabled:opacity-60"
    type="button"
    aria-label={`${isFavorite ? "Remove" : "Add"} ${name} ${isFavorite ? "from" : "to"} favorites`}
    aria-pressed={isFavorite}
    disabled={disabled}
    onClick={onClick}
  >
    <LuHeart
      className={`size-5 ${isFavorite ? "text-[#9A403A]" : ""}`}
      fill={isFavorite ? "currentColor" : "none"}
      aria-hidden="true"
    />
  </button>
);

export default FavoriteButton;
