import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";

const RequireAuth = () => {
  const { session, loading, needsOnboarding } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#D8D1C1] text-sm text-[#221B04]/70">
        Restoring your session...
      </main>
    );
  }

  if (session && needsOnboarding && pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return session ? <Outlet /> : <Navigate to="/signin" replace />;
};

export default RequireAuth;
