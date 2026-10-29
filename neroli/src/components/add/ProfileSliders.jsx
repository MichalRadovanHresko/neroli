// Keep the fragrance profile sliders consistent across four scent traits.
const profileFields = [
  { id: "sweet", label: "Sweet" },
  { id: "warm", label: "Warm" },
  { id: "fresh", label: "Fresh" },
  { id: "intensity", label: "Intensity" },
];

const ProfileSliders = ({ profile, setProfile }) => (
  <section className="mt-14">
    {/* Adjust each profile value with a labeled range input. */}
    <h2 className="text-xl font-normal">Fragrance profile</h2>
    <div className="mt-5 space-y-4">
      {profileFields.map((field) => (
        <label
          className="grid grid-cols-[56px_minmax(0,1fr)_42px] items-center gap-3 text-xs text-[#696555]"
          key={field.id}
        >
          <span>{field.label}</span>
          <input
            className="profile-slider w-full cursor-pointer"
            type="range"
            min="0"
            max="100"
            value={profile[field.id]}
            onChange={(event) =>
              setProfile((current) => ({
                ...current,
                [field.id]: Number(event.target.value),
              }))
            }
            aria-label={field.label}
          />
          <span className="text-right">{profile[field.id]}%</span>
        </label>
      ))}
    </div>
  </section>
);

export default ProfileSliders;
