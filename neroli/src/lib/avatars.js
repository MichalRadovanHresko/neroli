// Load the available avatar images so profiles can use bundled icons.
const modules = import.meta.glob("../assets/images/avatars/*.png", {
  eager: true,
  import: "default",
});

// Index images by filename so profile metadata can refer to an icon key.
const ICONS = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => [
    path.split("/").pop().replace(".png", ""),
    url,
  ]),
);
const KEYS = Object.keys(ICONS).sort();

// Choose a bundled icon for a new account.
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

// Derive a repeatable icon choice when an account has no saved selection.
const hashKey = (id = "") =>
  KEYS[
    [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % KEYS.length
  ];

// Prefer the saved icon key, falling back to the account-based choice.
export const getUserIconKey = (user) =>
  ICONS[user?.user_metadata?.default_icon]
    ? user.user_metadata.default_icon
    : hashKey(user?.id);

// Value stored with a comment: the custom photo URL, or "icon:<key>".
export const getAvatarToStore = (user) =>
  user?.user_metadata?.avatar_url || `icon:${getUserIconKey(user)}`;

// Turn stored icon references into images while preserving custom photo URLs.
export const resolveAvatar = (stored, userId) => {
  if (stored?.startsWith("icon:") && ICONS[stored.slice(5)])
    return ICONS[stored.slice(5)];
  if (stored && !stored.startsWith("icon:")) return stored;
  return ICONS[hashKey(userId)];
};
