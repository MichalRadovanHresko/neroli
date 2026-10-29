import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";

// Gate protected pages until the user is signed in and onboarded.

const RequireAuth = () => {
  const { session, loading, needsOnboarding } = useAuth();
  const { pathname } = useLocation();

  // Wait for session restoration before deciding which page to show.
  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#D8D1C1] text-sm text-[#221B04]/70">
        Restoring your session...
      </main>
    );
  }

  // Send new users through onboarding before they enter the main app.
  if (session && needsOnboarding && pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // Render protected routes for signed-in users and redirect everyone else.
  return session ? <Outlet /> : <Navigate to="/signin" replace />;
};

export default RequireAuth;
