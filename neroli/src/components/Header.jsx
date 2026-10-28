import { Link } from "react-router-dom";
import { LuBell } from "react-icons/lu";
import { ProfileIcon } from "./Icons";

const Header = () => (
  <header className="relative z-40 -mb-22 flex h-22 items-center justify-between bg-transparent px-6 text-[#221B04] sm:px-10 lg:px-[max(4rem,calc((100vw-1180px)/2))]">
    <Link
      className="font-serif text-[30px] leading-none no-underline sm:text-[34px]"
      to="/"
      aria-label="Neroli home"
    >
      NÉROLI
    </Link>
    <div className="flex items-center gap-1">
      <Link
        className="grid size-11 place-items-center rounded-full"
        to="/notifications"
        aria-label="Notifications"
      >
        <LuBell className="size-5" aria-hidden="true" />
      </Link>
      <Link
        className="grid size-11 place-items-center rounded-full"
        to="/profile"
        aria-label="Profile"
      >
        <ProfileIcon />
      </Link>
    </div>
  </header>
);

export default Header;
