import { createContext, useContext } from "react";

// Share signed-in user state and account actions across the component tree.

export const AuthContext = createContext(null);

// Read authentication state and explain when the provider is missing.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthContextProvider");
  }
  return context;
};
