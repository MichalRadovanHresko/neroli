import { Link } from "react-router-dom";
import { LuLock } from "react-icons/lu";

// Link to a profile feature and route locked features to the premium offer.
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

export default FeatureCard;
