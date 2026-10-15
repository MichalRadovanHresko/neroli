import { useState } from "react";
import { useAuth } from "../context/AuthContext.js";

const Profile = () => {
  const { session, signOut } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setError("");
    setLoading(true);
    try {
      await signOut();
    } catch {
      setError("Could not sign out. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#D8D1C1] px-6 pb-32 pt-10 text-[#221B04] sm:px-10">
      <h1 className="font-serif text-4xl">Profile</h1>
      <p className="mt-4 text-sm text-[#221B04]/70">{session?.user.email}</p>
      <button
        className="mt-8 min-h-11 rounded-full bg-[#696555] px-6 text-sm text-[#EAE4D9] disabled:opacity-60"
        type="button"
        onClick={handleSignOut}
        disabled={loading}
      >
        {loading ? "Signing out..." : "Sign out"}
      </button>
      {error && (
        <p className="mt-4 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
    </main>
  );
};

export default Profile;
