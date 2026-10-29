// Capture a short description of the recipe and its inspiration.
const AboutField = ({ notes, setNotes }) => (
  <section className="mt-8">
    {/* Let the author describe the recipe in their own words. */}
    <h2 className="text-xl font-normal">About the recipe</h2>
    <textarea
      className="mt-5 min-h-32 w-full resize-y rounded-[28px] bg-[#F4F2EE] px-6 py-5 text-sm text-[#221B04] outline-none placeholder:text-[#B9B4A5] focus-visible:ring-2 focus-visible:ring-[#696555]"
      value={notes}
      onChange={(event) => setNotes(event.target.value)}
      placeholder="Describe your recipe, its inspiration, or what makes it special..."
      aria-label="About the recipe"
    />
  </section>
);

export default AboutField;
