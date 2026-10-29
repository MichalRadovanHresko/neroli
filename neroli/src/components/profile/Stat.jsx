// Display a profile count as either a button or a read-only value.
const Stat = ({ value, label, onClick }) => {
  // Share the count markup between the clickable and static versions.
  const content = (
    <>
      <p className="text-xl">{value}</p>
      <p className="mt-1 text-sm">{label}</p>
    </>
  );
  return onClick ? (
    <button className="text-center" type="button" onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className="text-center">{content}</div>
  );
};

export default Stat;
