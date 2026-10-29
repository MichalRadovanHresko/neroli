import { Link } from "react-router-dom";
import { LuArrowRight } from "react-icons/lu";
import backgroundImage from "../assets/images/404.jpg";

// Show a friendly recovery page when a route does not exist.
const NotFound = () => (
  <main className="fixed inset-0 z-40 overflow-hidden bg-[#EAE3D6] text-[#221B04]">
    <img
      className="absolute inset-0 size-full object-cover object-[52%_center]"
      src={backgroundImage}
      alt=""
    />

    {/* Center the error message and give visitors a route back home. */}
    <div className="relative flex h-full flex-col items-center justify-center px-6 pb-24 text-center">
      <h1 className="font-serif text-[120px] leading-none text-[#4B4631] sm:text-[160px]">
        404
      </h1>
      <p className="mt-8 font-serif text-[28px] leading-tight">
        Scent not found.
      </p>
      <p className="mt-6 max-w-64 text-sm leading-snug text-[#696555]">
        The page you’re looking for doesn’t exist or has been moved.
      </p>
      <Link
        className="mt-10 inline-flex h-13 w-full max-w-64 items-center justify-center gap-2 rounded-full bg-[#696555] text-sm text-[#F4F2EE] shadow-[0_3px_4px_rgba(0,0,0,0.25)]"
        to="/"
      >
        Back to Home
        <LuArrowRight className="size-3.5" aria-hidden="true" />
      </Link>
    </div>
  </main>
);

export default NotFound;
