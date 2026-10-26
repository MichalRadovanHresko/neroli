import { useLocation, useNavigate } from "react-router-dom";
import { AddIcon, HomeIcon, ProfileIcon, ScentsIcon, ShopIcon } from "./Icons";

const BottomNav = () => {
  const TABS = [
    { id: "home", path: "/", label: "Home", Icon: HomeIcon },
    { id: "scents", path: "/scents", label: "Explore", Icon: ScentsIcon },
    { id: "add", path: "/add", label: "Add", Icon: AddIcon },
    { id: "shop", path: "/shop", label: "Shop", Icon: ShopIcon },
    { id: "profile", path: "/profile", label: "Profile", Icon: ProfileIcon },
  ];
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const found = TABS.findIndex(
    (t) =>
      t.path === pathname ||
      (t.id === "scents" &&
        (pathname.startsWith(`${t.path}/`) ||
          pathname.startsWith("/recipes/") ||
          pathname.startsWith("/explore/"))),
  );
  const index = Math.max(found, 0);
  const tab = TABS[index].id;
  return (
    <nav aria-label="Main navigation" className="bottom-nav">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => navigate(t.path)}
          type="button"
          aria-current={tab === t.id ? "page" : undefined}
          className="bottom-nav__item"
        >
          <span
            className={`bottom-nav__icon${t.id === "add" ? " bottom-nav__add-icon" : ""}`}
          >
            <t.Icon />
          </span>
          <span className="bottom-nav__label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
