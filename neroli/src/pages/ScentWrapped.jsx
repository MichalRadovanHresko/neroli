import { Navigate } from "react-router-dom";
import { FAMILY_STYLE, useScentInsights } from "../lib/insights";
import { useAuth } from "../context/AuthContext.js";
import BackButton from "../components/BackButton";

// Present premium members with a personalized annual scent summary.
// Draw the small decorative bars on the annual scent summary.
const Bars = () => (
  <div className="flex items-end gap-1.5" aria-hidden="true">
    {[28, 40, 32, 20].map((height) => (
      <span
        className="w-2.5 rounded-sm bg-[#E2CFA3]"
        style={{ height }}
        key={height}
      />
    ))}
  </div>
);

// Load and present the user’s annual scent insight data.
const ScentWrapped = () => {
  const { isPremium } = useAuth();
  const { topNotes, topFamily, heroScent, ownCount, loading } =
    useScentInsights();

  // Send non-members to the premium page before showing personal insights.
  if (!isPremium) return <Navigate to="/premium" replace />;

  // Use a discovery message if no leading scent family has been identified.
  const style = FAMILY_STYLE[topFamily] ?? {
    title: "Still discovering",
    line: "discovery",
  };
  const topNote = topNotes[0];

  // Render the family summary, top note, and number of created blends.
  return (
    <main className="min-h-screen bg-[#EAE3D6] px-6 pb-32 pt-14.5 text-[#221B04]">
      <div className="mx-auto max-w-md">
        <div className="relative flex h-10 items-center justify-center">
          <BackButton className="absolute left-0" />
          <p className="text-xs uppercase tracking-wide text-[#696555]">
            Scent Wrapped 2026
          </p>
        </div>

        {/* Show a loading message until the personalized recap is available. */}
        {loading ? (
          <p className="mt-10 text-center text-sm text-[#696555]">Loading...</p>
        ) : (
          <>
            {/* Summarize the leading family before the detailed statistics. */}
            <h1 className="mt-6 text-center font-serif text-[40px] leading-[1.1]">
              You have a thing for {style.line}.
            </h1>

            <div className="mt-5 h-44 overflow-hidden rounded-4xl bg-[#D6D2C6]">
              {heroScent?.image_url && (
                <img
                  className="size-full object-cover"
                  src={heroScent.image_url}
                  alt=""
                />
              )}
            </div>

            <p className="mt-5 text-center text-sm">
              Your signature scent family
            </p>
            <h2 className="mt-3 text-center font-serif text-[32px]">
              {style.title}
            </h2>
            <p className="mt-3 text-center text-sm text-[#696555]">
              The notes you kept coming back to.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-[#F4F2EE] p-4">
                <p className="text-sm text-[#696555]">Top note</p>
                <p className="mt-2 text-[15px] font-medium">
                  {topNote?.name ?? "—"}
                </p>
                <div className="mt-3 aspect-square overflow-hidden rounded-2xl bg-[#EAE3D6]">
                  {topNote?.scent?.image_url && (
                    <img
                      className="size-full object-cover"
                      src={topNote.scent.image_url}
                      alt=""
                    />
                  )}
                </div>
              </div>
              <div className="flex flex-col rounded-3xl bg-[#F4F2EE] p-4">
                <p className="text-sm text-[#696555]">Most created</p>
                <p className="mt-3 font-serif text-[56px] leading-none text-[#696555]">
                  {ownCount}
                </p>
                <p className="mt-3 text-sm text-[#696555]">
                  unique blend{ownCount === 1 ? "" : "s"}
                </p>
                <div className="mt-auto pt-4">
                  <Bars />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default ScentWrapped;
