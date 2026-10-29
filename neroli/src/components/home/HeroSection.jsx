import heroImage from "../../assets/images/background-image.jpg";

// Introduce fragrance creation and provide the main create action.
const HeroSection = ({ navigate }) => (
  <section className="relative min-h-125 overflow-hidden bg-[#D6D2C6] px-6 sm:min-h-165 sm:px-10 lg:min-h-175 lg:px-[max(4rem,calc((100vw-1180px)/2))]">
    <img
      className="absolute inset-0 h-full w-full object-cover object-[52%_center]"
      src={heroImage}
      alt="Background-image"
      fetchPriority="high"
    />
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(216,209,193,1)_0%,rgba(216,209,193,0.92)_35%,rgba(216,209,193,0.7)_60%,rgba(216,209,193,0.4)_80%,rgba(216,209,193,0.15)_100%)]" />
    {/* Keep the headline and create button above the background image. */}
    <div className="relative z-10 mt-34 max-w-142.5 sm:mt-44 lg:mt-48" id="top">
      <h1 className="max-w-135 font-serif text-[32px] font-medium leading-[.95]">
        Create something personal
      </h1>
      <p className="mt-5 max-w-75 text-[12px] leading-relaxed text-[#221B04]/80 sm:max-w-95 sm:text-sm">
        Explore notes, discover combinations and build your next fragrance.
      </p>
      <button
        className="mt-6 inline-flex min-h-12 min-w-53.5 items-center justify-center gap-6 rounded-[23.603px] bg-[#696555] px-8 text-xs text-[#D8D1C1] shadow-[0_3.147px_3.147px_0_rgba(0,0,0,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04]"
        type="button"
        onClick={() => navigate("/add")}
      >
        <span className="text-xl font-light leading-none">+</span>
        <span>Create fragrance</span>
      </button>
    </div>
  </section>
);

export default HeroSection;
