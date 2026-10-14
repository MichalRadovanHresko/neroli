import { useState } from "react";
import { AddIcon, HomeIcon, ProfileIcon, ScentsIcon, ShopIcon } from "./Icons";

const BottomNav = () => {
  const TABS = [
    { id: "home", label: "Home", Icon: HomeIcon },
    { id: "scents", label: "Scents", Icon: ScentsIcon },
    { id: "add", label: "Add", Icon: AddIcon },
    { id: "shop", label: "Shop", Icon: ShopIcon },
    { id: "profile", label: "Profile", Icon: ProfileIcon },
  ];
  const [tab, setTab] = useState("home");
  const [pressed, setPressed] = useState(false);
  const index = TABS.findIndex((t) => t.id === tab);
  return (
    <div className="min-h-screen pb-28">
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

      <nav className="liquid-glass fixed bottom-4 left-1/2 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-full p-2">
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
            onClick={() => setTab(t.id)}
            onPointerDown={() => setPressed(true)}
            onPointerUp={() => setPressed(false)}
            onPointerLeave={() => setPressed(false)}
            className={`relative flex flex-1 flex-col items-center gap-1 rounded-full px-2 py-2 text-xs transition-colors ${
              tab === t.id ? "font-semibold text-black" : "text-black/60"
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center">
              <t.Icon />
            </span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default BottomNav;
