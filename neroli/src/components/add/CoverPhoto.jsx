// Preview and choose the image used as the recipe cover.
import defaultCoverImage from "../../assets/images/perfume.jpg";
const CoverPhoto = ({ coverInput, pickCover, shownCover }) => (
  <section className="mt-14">
    {/* Show the current cover and open the hidden file picker on request. */}
    <h2 className="text-xl font-normal">Cover photo</h2>
    <p className="mt-3 text-xs text-[#696555]">
      Shown as the preview of your recipe.
    </p>
    <input
      ref={coverInput}
      className="sr-only"
      type="file"
      accept="image/*"
      onChange={pickCover}
      aria-label="Choose cover photo"
      tabIndex={-1}
    />
    <div className="mt-5 flex items-center gap-4">
      <img
        className="size-24 rounded-[20px] bg-[#D6D2C6] object-cover"
        src={shownCover}
        onError={(event) => {
          if (!event.currentTarget.src.endsWith(defaultCoverImage)) {
            event.currentTarget.src = defaultCoverImage;
          }
        }}
        alt="Cover preview"
      />
      <div className="flex flex-col items-start gap-2">
        <button
          className="rounded-full bg-[#4B4631] px-5 py-2 text-xs text-[#E8E2D6]"
          type="button"
          onClick={() => coverInput.current?.click()}
        >
          Choose from device
        </button>
      </div>
    </div>
  </section>
);

export default CoverPhoto;
