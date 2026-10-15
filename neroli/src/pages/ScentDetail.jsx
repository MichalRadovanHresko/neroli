import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LuArrowLeft } from "react-icons/lu";
import FavoriteButton from "../components/FavoriteButton";
import { useAuth } from "../context/AuthContext.js";
import supabase from "../lib/supabase";

const ScentDetail = () => {
  const { id } = useParams();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [scent, setScent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoritePending, setFavoritePending] = useState(false);
  const [favoriteError, setFavoriteError] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    setLoading(true);
    setError(null);
    supabase
      .from("scents")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error: queryError }) => {
        if (!isCurrent) return;
        setScent(data);
        setError(queryError?.message ?? null);
        setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [id]);

  useEffect(() => {
    let isCurrent = true;

    const loadFavorite = async () => {
      if (!userId) return;

      const { data, error: queryError } = await supabase
        .from("scent_favorites")
        .select("scent_id")
        .eq("user_id", userId)
        .eq("scent_id", id)
        .maybeSingle();

      if (!isCurrent) return;
      setIsFavorite(Boolean(data));
      setFavoriteError(queryError?.message ?? null);
    };

    void loadFavorite();
    return () => {
      isCurrent = false;
    };
  }, [id, userId]);

  const toggleFavorite = async () => {
    if (!userId || !scent || favoritePending) return;

    setFavoritePending(true);
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

    if (result.error) setFavoriteError(result.error.message);
    else setIsFavorite((current) => !current);
    setFavoritePending(false);
  };

  return (
    <main className="min-h-screen bg-[#D8D1C1] px-6 pb-32 pt-8 text-[#221B04] sm:px-10">
      <Link
        className="mb-6 inline-flex items-center gap-2 text-sm"
        to="/scents"
        aria-label="Back to scents"
      >
        <LuArrowLeft className="size-4" aria-hidden="true" />
        Scents
      </Link>

      {loading && <p className="text-sm text-[#221B04]/70">Loading scent...</p>}
      {error && <p className="text-sm text-red-800">{error}</p>}
      {!loading && !error && !scent && (
        <p className="text-sm text-[#221B04]/70">Scent not found.</p>
      )}

      {scent && (
        <article className="mx-auto max-w-4xl">
          {scent.image_url && (
            <img
              className="max-h-[70vh] w-full rounded-2xl object-cover"
              src={scent.image_url}
              alt={scent.name}
            />
          )}
          <div className="py-7 sm:py-9">
            <p className="text-sm text-[#221B04]/70">{scent.scent_family}</p>
            <div className="mt-2 flex items-start justify-between gap-4">
              <h1 className="font-serif text-4xl sm:text-5xl">{scent.name}</h1>
              <FavoriteButton
                name={scent.name}
                isFavorite={isFavorite}
                disabled={favoritePending || Boolean(favoriteError)}
                onClick={toggleFavorite}
              />
            </div>
            {favoriteError && (
              <p className="mt-3 text-sm text-red-800" role="alert">
                Favorites unavailable: {favoriteError}
              </p>
            )}
            {scent.short_description && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#221B04]/80">
                {scent.short_description}
              </p>
            )}
            <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-[#221B04]/15 pt-6 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-[#221B04]/60">Note</dt>
                <dd className="mt-1 text-sm">{scent.note_type}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#221B04]/60">Intensity</dt>
                <dd className="mt-1 text-sm">{scent.intensity}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#221B04]/60">Size</dt>
                <dd className="mt-1 text-sm">{scent.size} ml</dd>
              </div>
              <div>
                <dt className="text-xs text-[#221B04]/60">Price</dt>
                <dd className="mt-1 text-sm">{scent.price} kr</dd>
              </div>
            </dl>
          </div>
        </article>
      )}
    </main>
  );
};

export default ScentDetail;
