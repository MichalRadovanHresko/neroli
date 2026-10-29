import amberImage from "../../assets/images/notes/amber.jpg";
import citrusImage from "../../assets/images/notes/citrus.jpg";
import floralImage from "../../assets/images/notes/floral.jpg";
import fruityImage from "../../assets/images/notes/fruity.jpg";
import spicyImage from "../../assets/images/notes/spicy.jpg";
import tropicalImage from "../../assets/images/notes/tropical.jpg";
import { Link } from "react-router-dom";
import { LuArrowUpRight } from "react-icons/lu";

// Let visitors browse the scent library by a broad fragrance family.
// Connect each family to its image and matching library search term.
const noteFamilies = [
  { name: "Fruity", image: fruityImage, familyKey: "fruity" },
  { name: "Citrus", image: citrusImage, familyKey: "citrus" },
  { name: "Spicy", image: spicyImage, familyKey: "spicy" },
  { name: "Tropical", image: tropicalImage, familyKey: "tropical" },
  {
    name: "Amber",
    search: "Gourmand",
    image: amberImage,
    familyKey: "gourmand",
  },
  { name: "Floral", image: floralImage, familyKey: "floral" },
];

// Let visitors browse the scent library by a broad fragrance family.
const ExploreByNote = () => (
  <section className="mb-17 sm:mb-19">
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-sans text-xl font-normal leading-tight sm:text-2xl">
          Explore by note
        </h2>
      </div>
      <Link
        className="inline-flex shrink-0 items-center gap-1 border-b border-[#221B04]/55 pb-1 text-[11px]"
        to="/scents"
      >
        See all <LuArrowUpRight className="size-3" aria-hidden="true" />
      </Link>
    </div>
    {/* Use the family tiles to open a matching scent search. */}
    <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-6 sm:gap-x-5 sm:gap-y-6">
      {noteFamilies.map((family) => (
        <Link
          className="flex min-w-0 flex-col items-center gap-2 text-xs sm:text-[13px]"
          key={family.name}
          to={`/scents?q=${encodeURIComponent(family.search ?? family.name)}`}
        >
          <img
            className="aspect-square w-full rounded-[17px] object-cover sm:rounded-[20px]"
            src={family.image}
            alt=""
            loading="lazy"
          />
          <span>{family.name}</span>
        </Link>
      ))}
    </div>
  </section>
);

export default ExploreByNote;
