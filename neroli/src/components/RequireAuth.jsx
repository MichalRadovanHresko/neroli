import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";

const RequireAuth = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#D8D1C1] text-sm text-[#221B04]/70">
        Restoring your session...
      </main>
    );
  }

  return session ? <Outlet /> : <Navigate to="/signin" replace />;
};

export default RequireAuth;
