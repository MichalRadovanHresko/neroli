import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LuArrowLeft,
  LuBookmark,
  LuHeart,
  LuMegaphone,
  LuMessageCircle,
  LuUser,
} from "react-icons/lu";
import { resolveAvatar } from "../lib/avatars";

// Display recent activity grouped by date and filtered by type.
// Keep the available filters together for the filter buttons.
const FILTERS = ["All", "Activity", "Comments"];
const DAY = 24 * 60 * 60 * 1000;
const ago = (ms) => new Date(Date.now() - ms).toISOString();
const MIN = 60 * 1000;
const HOUR = 60 * MIN;

// Provide sample activity rows for the notifications feed.
const PREMADE = [
  {
    id: "p1",
    kind: "save",
    name: "Elena",
    action: "saved your recipe",
    recipeName: "Warm Skin",
    date: ago(5 * MIN),
  },
  {
    id: "p3",
    kind: "comment",
    name: "Sofia",
    action: "commented on your recipe",
    quote: "“Such a unique blend!”",
    recipeName: "Citrus Dream",
    date: ago(28 * MIN),
  },
  {
    id: "p13",
    kind: "news",
    name: "NÉROLI",
    action: "Your weekly scent digest is ready.",
    quote: "This week’s top scents and blends.",
    date: ago(HOUR),
    to: "/explore/all?type=scents",
  },
  {
    id: "p4",
    kind: "like",
    name: "Noah",
    action: "liked your recipe",
    recipeName: "Cedar Nights",
    date: ago(2 * HOUR),
  },
  {
    id: "p5",
    kind: "follow",
    name: "Daniel",
    action: "started following you",
    date: ago(26 * HOUR),
  },
  {
    id: "p6",
    kind: "save",
    name: "Lena",
    action: "saved your recipe",
    recipeName: "After Hours",
    date: ago(28 * HOUR),
  },
  {
    id: "p7",
    kind: "like",
    name: "Mia",
    action: "liked your recipe",
    recipeName: "Velvet Rain",
    date: ago(30 * HOUR),
  },
  {
    id: "p8",
    kind: "comment",
    name: "Adam",
    action: "commented on your recipe",
    quote: "“Smells amazing on skin.”",
    recipeName: "Warm Skin",
    date: ago(34 * HOUR),
  },
  {
    id: "p9",
    kind: "news",
    name: "NÉROLI",
    action: "New curated recipes are out now.",
    quote: "Explore this week’s selection.",
    date: ago(2 * DAY),
    to: "/explore/all?type=premium",
  },
  {
    id: "p10",
    kind: "news",
    name: "NÉROLI",
    action: "Tip: blend top, heart and base notes.",
    quote: "Read the perfume making guide.",
    date: ago(4 * DAY),
    to: "/",
  },
  {
    id: "p11",
    kind: "follow",
    name: "Emma",
    action: "started following you",
    date: ago(5 * DAY),
  },
  {
    id: "p12",
    kind: "news",
    name: "NÉROLI",
    action: "New scents were added to the library.",
    quote: "Discover them now.",
    date: ago(7 * DAY),
    to: "/explore/all?type=scents",
  },
];

// Format a notification timestamp as a compact relative time.
const timeAgo = (value) => {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d`;
};

// Place each notification into its day-based heading.
const groupOf = (value) => {
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const time = new Date(value).getTime();
  if (time >= startOfToday) return "Today";
  if (time >= startOfToday - DAY) return "Yesterday";
  return "Earlier";
};

// Match each notification type to the icon shown on its avatar.
const BADGES = {
  save: LuBookmark,
  comment: LuMessageCircle,
  like: LuHeart,
  follow: LuUser,
  news: LuMegaphone,
};

// Prepare feed rows for the selected filter and date groups.
const Notifications = () => {
  const navigate = useNavigate();
  // Prepare display avatars, apply the selected filter, and group by date.
  const [filter, setFilter] = useState("All");

  const premade = PREMADE.map((item) => ({
    ...item,
    avatar: resolveAvatar(null, item.name),
    recipe: item.recipeName ? { name: item.recipeName } : undefined,
  }));

  const all = premade.sort((a, b) => new Date(b.date) - new Date(a.date));
  const visible = all.filter((item) => {
    if (filter === "Activity") return item.kind !== "comment";
    if (filter === "Comments") return item.kind === "comment";
    return true;
  });

  const groups = ["Today", "Yesterday", "Earlier"]
    .map((label) => ({
      label,
      rows: visible.filter((item) => groupOf(item.date) === label),
    }))
    .filter((group) => group.rows.length > 0);

  // Render the feed header, filters, grouped activity, and empty state.
  return (
    <main className="min-h-screen bg-[#EAE3D6] px-6 pb-8 pt-10 text-[#221B04]">
      <div className="relative flex items-center justify-center">
        <button
          className="absolute left-0 grid size-10 place-items-center rounded-full bg-white"
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <LuArrowLeft className="size-6" aria-hidden="true" />
        </button>
        <h1 className="font-serif text-[30px] leading-tight">Notifications</h1>
      </div>

      {/* Let people narrow the feed to activity or comments. */}
      <div className="mt-6 flex gap-3 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((name) => (
          <button
            className={`shrink-0 rounded-full px-5 py-2.5 text-sm ${
              name === filter
                ? "bg-[#221B04] text-[#EAE3D6]"
                : "bg-[#DDD6C8] text-[#696555]"
            }`}
            key={name}
            type="button"
            onClick={() => setFilter(name)}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Each non-empty date group gets its own heading and list. */}
      {groups.map((group) => (
        <section className="mt-7" key={group.label}>
          <h2 className="text-xs uppercase tracking-[0.15em] text-[#696555]">
            {group.label}
          </h2>
          <ul className="mt-3 space-y-2.5">
            {group.rows.map((item) => {
              const Badge = BADGES[item.kind];
              const to =
                item.to ??
                (item.recipe?.id ? `/recipes/${item.recipe.id}` : "/profile");
              return (
                <li key={item.id}>
                  <Link
                    className="flex items-center gap-3 rounded-2xl bg-[#F4F2EE] p-3"
                    to={to}
                  >
                    <span className="relative shrink-0">
                      {item.kind === "news" ? (
                        <span className="grid size-13 place-items-center rounded-full bg-[#696555] font-serif text-[9px] text-[#EAE3D6]">
                          NÉROLI
                        </span>
                      ) : (
                        <img
                          className="size-13 rounded-full bg-[#D6D2C6] object-cover"
                          src={item.avatar}
                          alt=""
                        />
                      )}
                      <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border-2 border-[#F4F2EE] bg-[#4B4631] text-[#F4F2EE]">
                        <Badge className="size-3" aria-hidden="true" />
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm">
                          <strong className="font-semibold">{item.name}</strong>{" "}
                          {item.action}
                        </span>
                        <span className="shrink-0 text-[11px] text-[#696555]">
                          {timeAgo(item.date)}
                        </span>
                      </span>
                      {item.quote && (
                        <span className="mt-0.5 block truncate text-xs text-[#696555]">
                          {item.quote}
                        </span>
                      )}
                      {item.recipe && (
                        <span className="block truncate text-xs text-[#696555]">
                          {item.recipe.name}
                        </span>
                      )}
                    </span>
                    {item.recipe?.image_url && (
                      <img
                        className="size-13 shrink-0 rounded-lg object-cover"
                        src={item.recipe.image_url}
                        alt=""
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {visible.length === 0 && (
        <p className="mt-8 text-sm text-[#696555]">Nothing here yet.</p>
      )}
    </main>
  );
};

export default Notifications;
