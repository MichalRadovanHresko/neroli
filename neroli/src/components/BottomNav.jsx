import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AddIcon, HomeIcon, ProfileIcon, ScentsIcon, ShopIcon } from "./Icons";

const BottomNav = () => {
  const TABS = [
    { id: "home", path: "/", label: "Home", Icon: HomeIcon },
    { id: "scents", path: "/scents", label: "Scents", Icon: ScentsIcon },
    { id: "add", path: "/add", label: "Add", Icon: AddIcon },
    { id: "shop", path: "/shop", label: "Shop", Icon: ShopIcon },
    { id: "profile", path: "/profile", label: "Profile", Icon: ProfileIcon },
  ];
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [pressed, setPressed] = useState(false);
  const found = TABS.findIndex(
    (t) =>
      t.path === pathname ||
      (t.id === "scents" && pathname.startsWith(`${t.path}/`)),
  );
  const index = Math.max(found, 0);
  const tab = TABS[index].id;
  return (
    <>
      <svg className="hidden" aria-hidden="true">
        <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008 0.008"
            numOctaves="2"
            seed="92"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurred"
            scale="70"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <nav
        aria-label="Main navigation"
        className="liquid-glass fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-full p-2"
      >
        <span
          aria-hidden="true"
          className="liquid-glass-active pointer-events-none absolute inset-y-2 left-2 rounded-full"
          style={{
            width: `calc((100% - 1rem) / ${TABS.length})`,
            transform: `translateX(${index * 100}%) scale(${pressed ? 1.15 : 1})`,
            transition: "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => navigate(t.path)}
            onPointerDown={() => setPressed(true)}
            onPointerUp={() => setPressed(false)}
            onPointerLeave={() => setPressed(false)}
            type="button"
            aria-current={tab === t.id ? "page" : undefined}
            className={`relative z-10 flex flex-1 flex-col items-center gap-1 rounded-full px-2 py-2 text-xs transition-colors ${
              tab === t.id
                ? "font-semibold text-black"
                : "text-black/60"
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center">
              <t.Icon />
            </span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
};

export default BottomNav;
