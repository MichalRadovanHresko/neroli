import { Link, Navigate } from "react-router-dom";
import { LuEllipsis } from "react-icons/lu";
import { useScentInsights } from "../lib/insights";
import { useAuth } from "../context/AuthContext.js";
import BackButton from "../components/BackButton";

// Show premium members their most-used notes and favorite creations.
// Show a cropped scent image, leaving an empty placeholder when unavailable.
const Thumb = ({ src, className }) => (
  <span className={`block shrink-0 overflow-hidden bg-[#D6D2C6] ${className}`}>
    {src && <img className="size-full object-cover" src={src} alt="" />}
  </span>
);

// Organize the ranked notes and favorite recipe creations.
const ScentProfile = () => {
  const { isPremium } = useAuth();
  const { topNotes, topCreations, loading } = useScentInsights();

  // Send non-members to the premium page before showing personal insights.
  if (!isPremium) return <Navigate to="/premium" replace />;

  // Separate note statistics from the ranked list of recipe creations.
  return (
    <main className="min-h-screen bg-[#EAE3D6] px-5 pb-32 pt-14.5 text-[#221B04]">
      <div className="mx-auto max-w-md">
        <div className="relative flex h-10 items-center justify-center">
          <BackButton className="absolute left-0" />
          <h1 className="font-serif text-xl">Your scent profile</h1>
        </div>

        {/* Keep the profile layout hidden until the insights finish loading. */}
        {loading ? (
          <p className="mt-10 text-center text-sm text-[#696555]">Loading...</p>
        ) : (
          <>
            {/* Rank notes by how often they appear in the user’s activity. */}
            <section className="mt-6 rounded-3xl bg-[#F4F2EE] p-5">
              <h2 className="font-serif text-xl">Most used notes</h2>
              {topNotes.length === 0 ? (
                <p className="mt-4 text-sm text-[#696555]">
                  Save or create recipes to see your favourite notes.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {topNotes.map((note) => (
                    <li className="flex items-center gap-5" key={note.name}>
                      <Thumb
                        src={note.scent?.image_url}
                        className="size-20 rounded-2xl"
                      />
                      <span className="flex-1 text-sm text-[#696555]">
                        {note.name}
                      </span>
                      <span className="pr-1 text-sm text-[#696555]">
                        {note.percent}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Link the top recipe creations in their ranking order. */}
            <section className="mt-4 rounded-3xl bg-[#F4F2EE] p-5">
              <h2 className="font-serif text-xl">Your top creations</h2>
              {topCreations.length === 0 ? (
                <p className="mt-4 text-sm text-[#696555]">
                  Nothing here yet. Create or save a recipe first.
                </p>
              ) : (
                <ol className="mt-4 space-y-4">
                  {topCreations.map((recipe, index) => (
                    <li key={recipe.id}>
                      <Link
                        className="flex items-center gap-4"
                        to={`/recipes/${recipe.id}${recipe.isPremium ? "?premium=1" : ""}`}
                      >
                        <span className="w-5 font-serif text-2xl">
                          {index + 1}
                        </span>
                        <Thumb
                          src={recipe.image}
                          className="size-14 rounded-xl"
                        />
                        <span className="flex-1 text-sm">{recipe.name}</span>
                        <LuEllipsis className="size-5" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default ScentProfile;
