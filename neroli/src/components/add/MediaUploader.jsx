// Preview attached media and let authors add or remove photos and videos.
import { MAX_MEDIA_FILES } from "../../lib/recipeForm";
import { LuPlus, LuX } from "react-icons/lu";

const MediaUploader = ({
  addFiles,
  existingMedia,
  fileInputRef,
  mediaItems,
  removeMedia,
  setExistingMedia,
}) => (
  <section className="mt-14">
    {/* Existing uploads and new local files have separate removal controls. */}
    <h2 className="text-xl font-normal">Media</h2>
    <input
      ref={fileInputRef}
      className="sr-only"
      type="file"
      accept="image/*,video/*"
      multiple
      onChange={addFiles}
      aria-label="Add photos or videos"
      tabIndex={-1}
    />
    {existingMedia.length > 0 && (
      <div className="mt-6 grid grid-cols-3 gap-4 sm:max-w-md sm:gap-6">
        {existingMedia.map((item) => (
          <div className="relative aspect-square" key={item.url}>
            <div className="size-full overflow-hidden rounded-[20px] bg-[#D6D2C6]">
              {item.type === "video" ? (
                <video
                  className="size-full object-cover"
                  src={item.url}
                  controls
                  playsInline
                />
              ) : (
                <img className="size-full object-cover" src={item.url} alt="" />
              )}
            </div>
            <button
              className="absolute -right-1 -top-1 z-10 grid size-8 place-items-center rounded-full bg-[#9B8461] text-white shadow-sm"
              type="button"
              aria-label="Remove media"
              onClick={() =>
                setExistingMedia((current) =>
                  current.filter((entry) => entry.url !== item.url),
                )
              }
            >
              <LuX className="size-3" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    )}
    {mediaItems.length > 0 && (
      <div className="mt-6 grid grid-cols-3 gap-4 sm:max-w-md sm:gap-6">
        {mediaItems.map((item) => (
          <div className="relative aspect-square" key={item.id}>
            <div className="size-full overflow-hidden rounded-[20px] bg-[#D6D2C6]">
              {item.isVideo ? (
                <video
                  className="size-full object-cover"
                  src={item.url}
                  controls
                  playsInline
                />
              ) : (
                <img
                  className="size-full object-cover"
                  src={item.url}
                  alt={item.file.name}
                />
              )}
            </div>
            <button
              className="absolute -right-1 -top-1 z-10 grid size-8 place-items-center rounded-full bg-[#9B8461] text-white shadow-sm"
              type="button"
              aria-label={`Remove ${item.file.name}`}
              onClick={() => removeMedia(item.id)}
            >
              <LuX className="size-3" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    )}
    {/* Disable the picker when the recipe reaches its media limit. */}
    <button
      className="mt-6 flex h-31 w-full flex-col items-center justify-center gap-3 rounded-[28px] bg-[#F4F2EE] text-[11px] text-[#B9B4A5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04] disabled:cursor-not-allowed disabled:opacity-60"
      type="button"
      onClick={() => fileInputRef.current?.click()}
      disabled={mediaItems.length + existingMedia.length >= MAX_MEDIA_FILES}
    >
      <span className="grid size-10 place-items-center rounded-full bg-white text-[#8B826B]">
        <LuPlus className="size-5" aria-hidden="true" />
      </span>
      Add photo/video
    </button>
  </section>
);

export default MediaUploader;
