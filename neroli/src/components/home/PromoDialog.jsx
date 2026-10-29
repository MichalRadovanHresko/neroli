import { Link } from "react-router-dom";
import { LuFlower, LuX } from "react-icons/lu";

// Introduce premium features in a dismissible dialog.
const PromoDialog = ({ closePromo }) => (
  <div
    className="fixed inset-0 z-100 grid place-items-center bg-black/40 px-6"
    role="dialog"
    aria-modal="true"
    aria-label="Get Neroli+"
  >
    {/* Keep the close button, offer, and next-step links in one dialog. */}
    <div className="relative w-full max-w-sm rounded-[28px] bg-[#F7F5F0] p-6 text-center">
      <button
        className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-[#EAE3D6]"
        type="button"
        onClick={closePromo}
        aria-label="Close"
      >
        <LuX className="size-4" aria-hidden="true" />
      </button>
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#E2CFA3]">
        <LuFlower className="size-7" aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-serif text-2xl">Get NÉROLI+</h2>
      <p className="mt-2 text-sm text-[#696555]">
        Unlock premium recipes, Scent Wrapped, your Scent Profile and more tools
        for creating your own perfumes.
      </p>
      <Link
        className="mt-5 block rounded-full bg-[#696555] py-3 text-sm text-white"
        to="/premium"
        onClick={closePromo}
      >
        Discover NÉROLI+
      </Link>
      <button
        className="mt-3 text-xs text-[#696555] underline underline-offset-2"
        type="button"
        onClick={closePromo}
      >
        Maybe later
      </button>
    </div>
  </div>
);

export default PromoDialog;
