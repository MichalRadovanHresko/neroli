// Format common user details for profile headings and account views.
export const getDisplayName = (user) =>
  user?.user_metadata?.full_name ||
  user?.user_metadata?.name ||
  user?.email?.split("@")[0] ||
  "";

// Show a saved date in the visitor’s local date format.
export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "";
