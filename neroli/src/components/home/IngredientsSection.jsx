import { Link } from "react-router-dom";

// Show a small set of suggested scents and a link to the full library.
const IngredientsSection = ({ ingredientScents }) => (
  <section className="mb-17 sm:mb-19">
    <div className="rounded-3xl bg-[#F4F2EE] px-5 py-6 shadow-[0_3px_12px_rgba(34,27,4,0.08)] sm:px-10 sm:py-8">
      <h2 className="font-sans text-lg font-normal leading-tight sm:text-xl">
        More favourite scents
      </h2>
      {/* Link each image to its scent details. */}
      <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-4">
        {ingredientScents.map((scent) => (
          <Link
            className="block aspect-square overflow-hidden rounded-[20px] bg-[#D6D2C6]"
            key={scent.id}
            to={`/scents/${scent.id}`}
            aria-label={`More info about ${scent.name}`}
          >
            <img
              className="size-full object-cover"
              src={scent.image_url}
              alt={scent.name}
              loading="lazy"
            />
          </Link>
        ))}
      </div>
      <Link
        className="mt-6 flex h-11 w-full items-center justify-center rounded-[23.603px] bg-[#696555] text-xs text-[#D8D1C1] shadow-[0_3.147px_3.147px_0_rgba(0,0,0,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04]"
        to="/scents"
      >
        Explore Library
      </Link>
    </div>
  </section>
);

export default IngredientsSection;
