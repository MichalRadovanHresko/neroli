import { useNavigate } from "react-router-dom";
import { LuChevronLeft } from "react-icons/lu";

// Return to the previous browser-history entry when pressed.

const BackButton = ({ className = "" }) => {
  const navigate = useNavigate();
  // Keep the button reusable by allowing callers to add styling.
  // Render a button that navigates to the previous route.
  return (
    <button
      className={`grid size-10 place-items-center rounded-full bg-white text-[#221B04] ${className}`}
      type="button"
      onClick={() => navigate(-1)}
      aria-label="Back"
    >
      <LuChevronLeft className="size-5" aria-hidden="true" />
    </button>
  );
};

export default BackButton;
