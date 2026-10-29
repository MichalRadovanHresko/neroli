import Stat from "./Stat";
import { getDisplayName } from "../../lib/profileHelpers";
import { Link } from "react-router-dom";
import settingsIcon from "../../assets/icons/settings.svg";
import heroImage from "../../assets/images/background-image.jpg";
import { getDefaultAvatar } from "../../lib/avatars";

// Show the profile identity, settings menu, and summary counts.
const ProfileHeader = ({
  comments,
  handleSignOut,
  menuOpen,
  openEdit,
  openTab,
  ownRecipes,
  saved,
  setMenuOpen,
  signingOut,
  user,
}) => (
  <header className="relative h-97 overflow-hidden bg-[#D8D1C1] text-[#F7F5F0]">
    <img
      className="absolute inset-0 size-full object-cover"
      src={heroImage}
      alt=""
    />
    <div className="absolute inset-0 bg-[#D8D1C1]/45" />
    <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(234,227,214,1)_0%,rgba(234,227,214,0.6)_50%,rgba(234,227,214,0)_100%)]" />

    {/* Open account actions from the settings control. */}
    <div className="absolute right-6 top-14.5 z-10">
      <button
        className="grid size-10 place-items-center rounded-full bg-[#F7F5F0] text-[#221B04]"
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="Settings"
        aria-expanded={menuOpen}
      >
        <img className="size-5" src={settingsIcon} alt="" />
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-12 min-w-40 rounded-2xl bg-[#F7F5F0] p-2 text-base text-[#221B04] shadow-[0_6px_18px_rgba(34,27,4,0.15)]">
          <button
            className="w-full rounded-xl px-3 py-2 text-left"
            type="button"
            onClick={openEdit}
          >
            Edit profile
          </button>
          <Link
            className="block w-full rounded-xl px-3 py-2 text-left"
            to="/onboarding?edit=1"
          >
            Preferences
          </Link>
          <button
            className="w-full rounded-xl px-3 py-2 text-left disabled:opacity-60"
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      )}
    </div>

    {/* Center the user avatar and display name in the header. */}
    <div className="absolute inset-x-0 top-16.5 flex flex-col items-center">
      <div className="relative">
        <img
          className="size-34 rounded-full border-[3px] border-white bg-[#D8D1C1] object-cover"
          src={user?.user_metadata?.avatar_url || getDefaultAvatar(user)}
          alt="Profile picture"
        />
      </div>
      <h1 className="mt-4 rounded-2xl bg-white px-10 py-2 text-lg text-[#696555]">
        {getDisplayName(user)}
      </h1>
    </div>

    {/* Let each count jump directly to its matching profile tab. */}
    <div className="absolute inset-x-5 bottom-6 grid grid-cols-3 gap-4 rounded-[28px] bg-[#F7F5F0]/95 px-6 py-4 text-[#221B04] shadow-[0_2px_10px_rgba(34,27,4,0.1)]">
      <Stat
        value={saved.length}
        label="Saved"
        onClick={() => openTab("saved")}
      />
      <Stat
        value={comments.length}
        label="Comments"
        onClick={() => openTab("comments")}
      />
      <Stat
        value={ownRecipes.length}
        label="Recipes"
        onClick={() => openTab("activity")}
      />
    </div>
  </header>
);

export default ProfileHeader;
