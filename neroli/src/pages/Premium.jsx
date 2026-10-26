import { Link } from "react-router-dom";
import {
  LuChevronLeft,
  LuFlaskConical,
  LuLightbulb,
  LuMessagesSquare,
  LuChartNoAxesColumn,
} from "react-icons/lu";
import premiumBackground from "../assets/images/premium-background.jpg";

const FEATURES = [
  {
    icon: LuFlaskConical,
    title: "Exclusive recipes",
    text: "Curated blends from perfumers and our community.",
  },
  {
    icon: LuMessagesSquare,
    title: "Smart pairings",
    text: "Discover which notes go best together.",
  },
  {
    icon: LuChartNoAxesColumn,
    title: "Scent Wrapped",
    text: "Your annual fragrance story.",
  },
  {
    icon: LuLightbulb,
    title: "Advanced creation tools",
    text: "More guidance and inspiration for your recipes.",
  },
];

const Premium = () => (
  <main className="fixed inset-0 z-50 overflow-y-auto bg-[#1A150B] text-[#E5D9BE]">
    <div className="relative mx-auto min-h-[1040px] w-full max-w-[402px]">
      <img
        className="absolute inset-x-0 top-0 h-[596px] w-full object-cover"
        src={premiumBackground}
        alt=""
      />
      <div className="absolute inset-x-0 top-0 h-[596px] bg-[linear-gradient(180deg,rgba(26,21,11,0)_55%,rgba(26,21,11,0.85)_100%),linear-gradient(90deg,rgba(26,21,11,0.92)_0%,rgba(26,21,11,0.8)_55%,rgba(26,21,11,0.1)_100%)]" />

      <div className="relative px-8 pt-[55px] pb-24">
        <Link
          className="grid size-10 place-items-center rounded-full bg-[#E5D9BE] text-[#221B04]"
          to="/"
          aria-label="Back"
        >
          <LuChevronLeft className="size-5" aria-hidden="true" />
        </Link>

        <p className="mt-[34px] font-serif text-[32px] leading-[44px]">
          NÉROLI+
        </p>
        <p className="mt-[34px] text-[13px] uppercase leading-5">
          The private atelier
        </p>
        <h1 className="mt-4 font-serif text-[40px] leading-[45px]">
          A deeper fragrance experience.
        </h1>
        <p className="mt-6 text-base leading-6">
          Unlock exclusive recipes, smart suggestions and personal insights.
        </p>

        <button
          className="mt-[26px] flex h-[52px] w-full items-center justify-center rounded-full bg-[#E0D2B4] text-[15px] font-medium text-[#221B04]"
          type="button"
        >
          Get NÉROLI+
        </button>

        <ul className="mt-[26px]">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li
              className="flex h-[100px] gap-[30px] border-t border-[#E5D9BE]/20 pt-[14px]"
              key={title}
            >
              <Icon
                className="mt-1 size-9 shrink-0 stroke-[1.2]"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-[17px] leading-6">{title}</h2>
                <p className="mt-1 text-[15px] leading-[22px] text-[#E5D9BE]/80">
                  {text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </main>
);

export default Premium;
