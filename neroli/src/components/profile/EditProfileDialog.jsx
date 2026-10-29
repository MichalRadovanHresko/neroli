import { getDefaultAvatar } from "../../lib/avatars";

// Let users update their nickname and profile picture.
const EditProfileDialog = ({
  avatarInput,
  closeEdit,
  draftFile,
  draftName,
  draftPreview,
  error,
  handlePickAvatar,
  handleSaveProfile,
  removeAvatar,
  saving,
  setDraftFile,
  setDraftName,
  setRemoveAvatar,
  user,
}) => (
  <div
    className="fixed inset-0 z-100 flex items-end justify-center bg-[#221B04]/50"
    role="dialog"
    aria-modal="true"
    aria-label="Edit profile"
    onClick={closeEdit}
  >
    <div
      className="w-full max-w-md rounded-t-[30px] bg-[#EAE3D6] px-6 pb-8 pt-6"
      onClick={(event) => event.stopPropagation()}
    >
      <h2 className="text-center font-serif text-2xl">Edit profile</h2>
      {/* Preview the selected avatar and provide photo controls. */}
      <div className="mt-5 flex flex-col items-center">
        <img
          className="size-28 rounded-full border-[3px] border-white bg-[#D8D1C1] object-cover"
          src={
            draftPreview ||
            (removeAvatar ? null : user?.user_metadata?.avatar_url) ||
            getDefaultAvatar(user)
          }
          alt="Profile picture preview"
        />
        <input
          ref={avatarInput}
          className="hidden"
          type="file"
          accept="image/*"
          onChange={handlePickAvatar}
        />
        <div className="mt-4 flex gap-3">
          <button
            className="rounded-full bg-[#D6D2C6] px-4 py-2 text-xs"
            type="button"
            onClick={() => avatarInput.current?.click()}
          >
            Choose photo
          </button>
          {(draftFile || user?.user_metadata?.avatar_url) && !removeAvatar && (
            <button
              className="rounded-full bg-[#F7F5F0] px-4 py-2 text-xs"
              type="button"
              onClick={() => {
                setDraftFile(null);
                setRemoveAvatar(Boolean(user?.user_metadata?.avatar_url));
              }}
            >
              Remove photo
            </button>
          )}
        </div>
      </div>
      {/* Edit the display name and show any validation or save errors. */}
      <label className="mt-6 block text-xs text-[#696555]" htmlFor="nickname">
        Nickname
      </label>
      <input
        id="nickname"
        className="mt-1 h-12 w-full rounded-full bg-[#F7F5F0] px-5 text-sm outline-none focus-visible:outline-2 focus-visible:outline-[#696555]"
        value={draftName}
        maxLength={30}
        onChange={(event) => setDraftName(event.target.value)}
      />
      {error && (
        <p className="mt-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          className="h-11 rounded-full bg-[#F7F5F0] text-sm"
          type="button"
          onClick={closeEdit}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          className="h-11 rounded-full bg-[#696555] text-sm text-[#D8D1C1] disabled:opacity-60"
          type="button"
          onClick={handleSaveProfile}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  </div>
);

export default EditProfileDialog;
