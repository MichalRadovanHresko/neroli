// List scents with favorite filters and buttons for saving favorites.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import FavoriteButton from "./FavoriteButton";
import RecipeCard from "./RecipeCard";
import supabase from "../lib/supabase";

// Fetch scent data and keep favorite changes in sync with Supabase.
const ScentsList = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [scents, setScents] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  const [error, setError] = useState(null);
  const [favoriteError, setFavoriteError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState(null);
  const [filter, setFilter] = useState("all");

  // Load scents and the current user’s favorites together.
  useEffect(() => {
    let isCurrent = true;

    const loadScents = async () => {
      const [scentResult, favoriteResult] = await Promise.all([
        supabase.from("scents").select("*").order("id", { ascending: true }),
        supabase
          .from("scent_favorites")
          .select("scent_id")
          .eq("user_id", userId),
      ]);

      if (!isCurrent) return;

      if (scentResult.error) setError(scentResult.error.message);
      else setScents(scentResult.data ?? []);

      if (favoriteResult.error) {
        setFavoriteError(favoriteResult.error.message);
      } else {
        setFavoriteIds(
          new Set(
            (favoriteResult.data ?? []).map((favorite) => favorite.scent_id),
          ),
        );
      }

      setLoading(false);
    };

    void loadScents();
    return () => {
      isCurrent = false;
    };
  }, [userId]);

  // Persist a favorite change and update the local list after success.
  const toggleFavorite = async (scent) => {
    if (!userId || pendingId !== null) return;

    const isFavorite = favoriteIds.has(scent.id);
    setPendingId(scent.id);
    setFavoriteError(null);

    const result = isFavorite
      ? await supabase
          .from("scent_favorites")
          .delete()
          .eq("user_id", userId)
          .eq("scent_id", scent.id)
      : await supabase
          .from("scent_favorites")
          .insert({ user_id: userId, scent_id: scent.id });

    if (result.error) {
      setFavoriteError(result.error.message);
    } else {
      setFavoriteIds((current) => {
        const next = new Set(current);
        if (isFavorite) next.delete(scent.id);
        else next.add(scent.id);
        return next;
      });
    }

    setPendingId(null);
  };

  // Apply the selected all-or-favorites filter to the scent list.
  const visibleScents =
    filter === "favorites"
      ? scents.filter((scent) => favoriteIds.has(scent.id))
      : scents;

  return (
    <>
      {/* Report loading errors before showing the filter and scent cards. */}
      {error && <p>{error}</p>}
      {favoriteError && (
        <p className="mt-4 text-sm text-red-800" role="alert">
          Favorites unavailable: {favoriteError}
        </p>
      )}
      {loading && (
        <p className="mt-6 text-sm text-[#221B04]/70">Loading scents...</p>
      )}
      {!loading && !error && scents.length === 0 && (
        <p className="mt-6 text-sm text-[#221B04]/70">No scents found.</p>
      )}
      {!loading && !error && (
        <div className="mt-6">
          <div
            className="inline-flex rounded-full bg-[#D6D2C6] p-1"
            role="group"
            aria-label="Filter scents"
          >
            <button
              className={`rounded-full px-4 py-2 text-sm ${filter === "all" ? "bg-[#F4F2EE]" : "text-[#221B04]/65"}`}
              type="button"
              aria-pressed={filter === "all"}
              onClick={() => setFilter("all")}
            >
              All scents
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm ${filter === "favorites" ? "bg-[#F4F2EE]" : "text-[#221B04]/65"}`}
              type="button"
              aria-pressed={filter === "favorites"}
              onClick={() => setFilter("favorites")}
            >
              Favorites ({favoriteIds.size})
            </button>
          </div>
          {filter === "favorites" && visibleScents.length === 0 && (
            <p className="mt-6 text-sm text-[#221B04]/70">
              No favorites yet. Tap a heart on a scent to save it here.
            </p>
          )}
          {/* Each scent card links to details and exposes its favorite action. */}
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleScents.map((scent) => {
              const isFavorite = favoriteIds.has(scent.id);
              return (
                <li className="relative" key={scent.id}>
                  <Link
                    className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2"
                    to={`/scents/${scent.id}`}
                    aria-label={`More info about ${scent.name}`}
                  >
                    <RecipeCard {...scent} />
                  </Link>
                  <span className="absolute right-3 top-3 z-10">
                    <FavoriteButton
                      name={scent.name}
                      isFavorite={isFavorite}
                      disabled={pendingId !== null || Boolean(favoriteError)}
                      onClick={() => toggleFavorite(scent)}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
};

export default ScentsList;
