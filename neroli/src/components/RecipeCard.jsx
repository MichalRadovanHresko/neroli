export default function RecipeCard({
  image_url,
  name,
  intensity,
  size,
  scent_family,
  note_type,
  price,
  short_description,
}) {
  return (
    <article className="overflow-hidden rounded-2xl bg-[#D6D2C6] text-[#221B04]">
      {image_url && (
        <img
          className="aspect-[1.35] w-full object-cover"
          src={image_url}
          alt=""
          loading="lazy"
        />
      )}
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-scent text-2xl leading-tight">{name}</h2>
          <span className="shrink-0 text-sm">{price} kr</span>
        </div>
        <p className="text-sm text-[#221B04]/75">
          {scent_family}, {note_type}
        </p>
        <p className="text-sm text-[#221B04]/75">{short_description}</p>
        <p className="text-xs text-[#221B04]/60">
          {intensity}, {size} ml
        </p>
      </div>
    </article>
  );
}
