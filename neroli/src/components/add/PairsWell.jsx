// Show premium scent pairings or explain how to unlock them.
import { LuLock } from "react-icons/lu";
import { Link } from "react-router-dom";

const PairsWell = ({ isPremium, shownPairs }) => (
  <section className="mt-14">
    {/* Premium users see pairings; others can follow the upgrade link. */}
    <h2 className="text-xl font-normal">Pairs well with</h2>
    {isPremium ? (
      <div className="mt-6 rounded-3xl bg-[#F4F2EE] p-3.5">
        <span className="inline-block rounded-full bg-[#E2CFA3] px-3 py-1 text-xs font-semibold">
          Neroli+
        </span>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {shownPairs.map((scent) => (
            <div
              className="flex flex-col items-center gap-2 text-sm text-[#696555]"
              key={scent.id}
            >
              <span className="block aspect-square w-full overflow-hidden rounded-3xl bg-[#EAE3D6]">
                {scent.image_url && (
                  <img
                    className="size-full object-cover"
                    src={scent.image_url}
                    alt=""
                  />
                )}
              </span>
              <span className="line-clamp-1">{scent.name}</span>
            </div>
          ))}
        </div>
      </div>
    ) : (
      <Link className="mt-6 block rounded-3xl bg-[#F4F2EE] p-3.5" to="/premium">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-[#E2CFA3] px-3 py-1 text-xs font-semibold">
            Neroli+
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-[#D6D0C0] px-3 py-1 text-xs text-[#696555]">
            <LuLock className="size-3.5" aria-hidden="true" />
            Locked
          </span>
        </div>
        <p className="mt-4 text-sm font-semibold">Pairs well with</p>
        <p className="mt-2 text-xs text-[#696555]">
          Unlock premium pairing suggestions with Neroli+.
        </p>
      </Link>
    )}
  </section>
);

export default PairsWell;
