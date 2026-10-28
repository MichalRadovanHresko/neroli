import { useNavigate } from "react-router-dom";
import { LuChevronLeft } from "react-icons/lu";

const BackButton = ({ className = "" }) => {
  const navigate = useNavigate();
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
