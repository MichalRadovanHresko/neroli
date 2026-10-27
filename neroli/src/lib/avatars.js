const modules = import.meta.glob("../assets/images/avatars/*.png", {
  eager: true,
  import: "default",
});

const ICONS = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => [
    path.split("/").pop().replace(".png", ""),
    url,
  ]),
);
const KEYS = Object.keys(ICONS).sort();

export const randomIconKey = () =>
  KEYS[Math.floor(Math.random() * KEYS.length)];

// Accounts without a saved icon get a stable one derived from their id.
export const getDefaultAvatar = (user) => {
  const saved = user?.user_metadata?.default_icon;
  if (ICONS[saved]) return ICONS[saved];
  const hash = [...(user?.id ?? "")].reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );
  return ICONS[KEYS[hash % KEYS.length]];
};

const hashKey = (id = "") =>
  KEYS[
    [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % KEYS.length
  ];

export const getUserIconKey = (user) =>
  ICONS[user?.user_metadata?.default_icon]
    ? user.user_metadata.default_icon
    : hashKey(user?.id);

// Value stored with a comment: the custom photo URL, or "icon:<key>".
export const getAvatarToStore = (user) =>
  user?.user_metadata?.avatar_url || `icon:${getUserIconKey(user)}`;

export const resolveAvatar = (stored, userId) => {
  if (stored?.startsWith("icon:") && ICONS[stored.slice(5)])
    return ICONS[stored.slice(5)];
  if (stored && !stored.startsWith("icon:")) return stored;
  return ICONS[hashKey(userId)];
};
