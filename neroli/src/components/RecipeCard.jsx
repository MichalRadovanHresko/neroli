// Display scent images and key details in a reusable recipe card.
export default function RecipeCard({
  image_url,
  name,
  intensity,
  scent_family,
  note_type,
  short_description,
}) {
  return (
    <article className="overflow-hidden rounded-2xl bg-[#D6D2C6] text-[#221B04]">
      {/* Show the image only when one is available, then display scent details. */}
      {image_url && (
        <img
          className="aspect-[1.35] w-full object-cover"
          src={image_url}
          alt=""
          loading="lazy"
        />
      )}
      {/* Show scent metadata and description beneath the optional image. */}
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-scent text-2xl leading-tight">{name}</h2>
        </div>
        <p className="text-sm text-[#221B04]/75">
          {scent_family}, {note_type}
        </p>
        <p className="text-sm text-[#221B04]/75">{short_description}</p>
        <p className="text-xs text-[#221B04]/60">{intensity}</p>
      </div>
    </article>
  );
}
