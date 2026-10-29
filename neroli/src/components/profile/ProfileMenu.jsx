import FeatureCard from "./FeatureCard";
import { LuGift, LuUser } from "react-icons/lu";

// Group premium profile features into a compact menu.
const ProfileMenu = ({ isPremium }) => (
  <div className="mt-4 space-y-3">
    <FeatureCard
      icon={LuGift}
      to="/profile/wrapped"
      locked={!isPremium}
      title="Scent Wrapped 2026"
      text="Your annual scent story"
    />
    <FeatureCard
      icon={LuUser}
      to="/profile/scent-profile"
      locked={!isPremium}
      title="Scent Profile"
      text="Your scent preferences & matches"
    />
  </div>
);

export default ProfileMenu;
