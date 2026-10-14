export default function RecipeCard({
  name,
  intensity,
  size,
  scentFamily,
  noteType,
  price,
  shortDescription,
}) {
  return (
    <>
      <p>{name}</p>
      <p>{intensity}</p>
      <p>{size}</p>
      <p>{scentFamily}</p>
      <p>{noteType}</p>
      <p>{price} kr</p>
      <p>{shortDescription}</p>
    </>
  );
}
