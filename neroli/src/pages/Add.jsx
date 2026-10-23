import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  LuArrowLeft,
  LuMinus,
  LuPlus,
  LuSearch,
  LuX,
} from "react-icons/lu";
import { useAuth } from "../context/AuthContext.js";
import supabase from "../lib/supabase";
import { PRODUCTS } from "../lib/shopProducts";

const MAX_MEDIA_BYTES = 50 * 1024 * 1024;
const MAX_MEDIA_FILES = 6;

const profileFields = [
  { id: "sweet", label: "Sweet" },
  { id: "warm", label: "Warm" },
  { id: "fresh", label: "Fresh" },
  { id: "intensity", label: "Intensity" },
];

const initialProfile = {
  sweet: 70,
  warm: 70,
  fresh: 70,
  intensity: 70,
};

const getUpdatedAt = () => new Date().toISOString();

const Add = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const userId = session?.user?.id;
  const [scents, setScents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [recipeName, setRecipeName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [notes, setNotes] = useState("");
  const [steps, setSteps] = useState([""]);
  const [equipment, setEquipment] = useState([]);
  const [customEquipment, setCustomEquipment] = useState("");
  const [profile, setProfile] = useState(initialProfile);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loadingScents, setLoadingScents] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedRecipeId, setSavedRecipeId] = useState(editId ?? null);
  const [existingMedia, setExistingMedia] = useState([]);
  const [loadingRecipe, setLoadingRecipe] = useState(Boolean(editId));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [recipeCount, setRecipeCount] = useState(0);
  const [pairIds, setPairIds] = useState([]);
  const [pairPickerOpen, setPairPickerOpen] = useState(false);
  const [pairSearch, setPairSearch] = useState("");
  const [mediaItems, setMediaItems] = useState([]);
  const fileInputRef = useRef(null);
  const mediaItemsRef = useRef(mediaItems);

  useEffect(() => {
    mediaItemsRef.current = mediaItems;
  }, [mediaItems]);

  useEffect(
    () => () => {
      mediaItemsRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    },
    [],
  );

  const addFiles = (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    setError("");

    const accepted = [];
    for (const file of files) {
      const isMedia =
        file.type.startsWith("image/") || file.type.startsWith("video/");
      if (!isMedia) {
        setError(`"${file.name}" is not a photo or video.`);
        continue;
      }
      if (file.size > MAX_MEDIA_BYTES) {
        setError(`"${file.name}" is larger than 50 MB.`);
        continue;
      }
      accepted.push({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        isVideo: file.type.startsWith("video/"),
      });
    }

    const room = MAX_MEDIA_FILES - mediaItems.length - existingMedia.length;
    if (accepted.length > room) {
      setError(`You can add up to ${MAX_MEDIA_FILES} files.`);
      accepted.slice(room).forEach((item) => URL.revokeObjectURL(item.url));
    }
    setMediaItems((current) => [...current, ...accepted.slice(0, room)]);
  };

  const removeMedia = (id) => {
    setMediaItems((current) => {
      const removed = current.find((item) => item.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return current.filter((item) => item.id !== id);
    });
  };

  useEffect(() => {
    let isCurrent = true;

    const loadScents = async () => {
      const { data, error: queryError } = await supabase
        .from("scents")
        .select("id, name, image_url, scent_family, short_description")
        .order("id", { ascending: true });

      if (!isCurrent) return;
      if (queryError) {
        setError(queryError.message);
        setLoadingScents(false);
        return;
      }

      setScents(data ?? []);
      setLoadingScents(false);
    };

    void loadScents();
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    let isCurrent = true;
    supabase
      .from("recipes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .then(({ count }) => {
        if (isCurrent) setRecipeCount(count ?? 0);
      });
    return () => {
      isCurrent = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!editId || !userId || loadingScents) return;
    let isCurrent = true;

    const loadRecipe = async () => {
      const { data, error: loadError } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", editId)
        .eq("user_id", userId)
        .eq("is_premade", false)
        .maybeSingle();

      if (!isCurrent) return;
      if (loadError || !data) {
        setError(loadError?.message ?? "Recipe not found.");
        setLoadingRecipe(false);
        return;
      }

      const byName = new Map(
        scents.map((scent) => [scent.name.toLowerCase(), scent.id]),
      );
      setRecipeName(data.name ?? "");
      setSubtitle(data.short_description ?? "");
      setNotes(data.notes ?? "");
      setProfile({ ...initialProfile, ...(data.profile ?? {}) });
      setSelectedIds(
        (data.ingredients ?? [])
          .map((item) => item.scent_id ?? byName.get(item.name?.toLowerCase()))
          .filter((value) => value != null),
      );
      setPairIds(data.pairs_with ?? []);
      setEquipment((data.equipment ?? []).map((item) => item.name));
      const savedSteps = (data.steps ?? []).map((step) => step.text);
      setSteps(savedSteps.length > 0 ? savedSteps : [""]);
      setExistingMedia(data.media ?? []);
      setLoadingRecipe(false);
    };

    void loadRecipe();
    return () => {
      isCurrent = false;
    };
  }, [editId, userId, loadingScents, scents]);

  const selectedScents = selectedIds
    .map((id) => scents.find((scent) => scent.id === id))
    .filter(Boolean);

  const availableScents = scents.filter(
    (scent) =>
      !selectedIds.includes(scent.id) &&
      scent.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const pairedScents = pairIds
    .map((id) => scents.find((scent) => scent.id === id))
    .filter(Boolean);

  const availablePairs = scents.filter(
    (scent) =>
      !pairIds.includes(scent.id) &&
      scent.name.toLowerCase().includes(pairSearch.trim().toLowerCase()),
  );

  const addEquipment = (name) => {
    const clean = name.trim();
    if (!clean) return;
    setEquipment((current) =>
      current.some((item) => item.toLowerCase() === clean.toLowerCase())
        ? current
        : [...current, clean],
    );
  };

  const saveRecipe = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const cleanSteps = steps.map((step) => step.trim()).filter(Boolean);
    if (cleanSteps.length === 0) {
      setError("Step by step is required. Describe how to make your recipe.");
      document
        .getElementById("steps-section")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSaving(true);

    try {
      const recipeData = {
        user_id: userId,
        name: recipeName.trim() || "Recipe draft",
        short_description: subtitle.trim() || null,
        profile,
        notes: notes.trim(),
        pairs_with: pairIds,
        equipment: equipment.map((name) => ({ name })),
        steps: cleanSteps.map((text, index) => ({
          position: index + 1,
          text,
        })),
        ingredients: selectedScents.map((scent) => ({
          name: scent.name,
          image_url: scent.image_url ?? null,
          scent_id: scent.id,
        })),
        updated_at: getUpdatedAt(),
      };

      const recipeResult = savedRecipeId
        ? await supabase
            .from("recipes")
            .update(recipeData)
            .eq("id", savedRecipeId)
            .eq("user_id", userId)
            .select("id")
            .single()
        : await supabase
            .from("recipes")
            .insert(recipeData)
            .select("id")
            .single();

      if (recipeResult.error) throw recipeResult.error;
      const recipeId = recipeResult.data.id;

      const deleteResult = await supabase
        .from("recipe_ingredients")
        .delete()
        .eq("recipe_id", recipeId);
      if (deleteResult.error) throw deleteResult.error;

      if (selectedScents.length > 0) {
        const ingredientResult = await supabase
          .from("recipe_ingredients")
          .insert(
            selectedScents.map((scent, position) => ({
              recipe_id: recipeId,
              scent_id: scent.id,
              position,
            })),
          );
        if (ingredientResult.error) throw ingredientResult.error;
      }

      setSavedRecipeId(recipeId);

      if (mediaItems.length > 0 || editId) {
        const uploaded = [];
        for (const item of mediaItems) {
          const safeName = item.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `${userId}/${recipeId}/${crypto.randomUUID()}-${safeName}`;
          const uploadResult = await supabase.storage
            .from("recipe-media")
            .upload(path, item.file, { contentType: item.file.type });
          if (uploadResult.error) throw uploadResult.error;

          const { data: urlData } = supabase.storage
            .from("recipe-media")
            .getPublicUrl(path);
          uploaded.push({
            url: urlData.publicUrl,
            type: item.isVideo ? "video" : "image",
          });
        }

        const allMedia = [...existingMedia, ...uploaded];
        const mediaResult = await supabase
          .from("recipes")
          .update({
            media: allMedia,
            image_url:
              allMedia.find((entry) => entry.type === "image")?.url ?? null,
          })
          .eq("id", recipeId)
          .eq("user_id", userId);
        if (mediaResult.error) throw mediaResult.error;
      }

      if (editId) navigate(-1);
      else navigate(`/recipes/${recipeId}`, { replace: true });
    } catch (saveError) {
      setError(saveError.message || "Could not save recipe.");
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#D8D1C1] px-6 pb-32 pt-5 text-[#221B04] sm:px-10">
      <form className="mx-auto max-w-3xl" onSubmit={saveRecipe}>
        <div className="flex items-center justify-between">
          {editId ? (
            <button
              className="grid size-10 place-items-center"
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Back"
            >
              <LuArrowLeft className="size-5" aria-hidden="true" />
            </button>
          ) : (
            <Link
              className="grid size-10 place-items-center"
              to="/"
              aria-label="Back to home"
            >
              <LuArrowLeft className="size-5" aria-hidden="true" />
            </Link>
          )}
          <button className="px-2 py-2 text-sm" type="submit" disabled={saving || loadingRecipe}>
            {saving ? "Saving..." : loadingRecipe ? "Loading..." : "Save"}
          </button>
        </div>

        <section className="mt-7">
          <p className="font-serif text-4xl leading-none text-[#696555]">
            {String(savedRecipeId ? recipeCount : recipeCount + 1).padStart(2, "0")}
          </p>
          <label className="mt-2 block">
            <span className="sr-only">Recipe name</span>
            <input
              className="w-full bg-transparent font-sans text-xl outline-none placeholder:text-[#696555]"
              value={recipeName}
              onChange={(event) => setRecipeName(event.target.value)}
              aria-label="Recipe name"
              placeholder="Add title"
              maxLength={80}
              required
            />
          </label>
          <label className="mt-1 block">
            <span className="sr-only">Recipe subtitle</span>
            <input
              className="w-full bg-transparent text-sm text-[#696555] outline-none placeholder:text-[#696555]"
              value={subtitle}
              onChange={(event) => setSubtitle(event.target.value)}
              aria-label="Recipe subtitle"
              placeholder="Add subtitle"
              maxLength={120}
            />
          </label>
        </section>

        <section className="mt-6" aria-label="Recipe ingredients">
          {loadingScents && (
            <p className="text-sm text-[#696555]">Loading scents...</p>
          )}
          <div className="grid grid-cols-3 gap-4 sm:max-w-md sm:gap-6">
            {selectedScents.map((scent) => (
              <div className="min-w-0" key={scent.id}>
                <div className="relative aspect-square">
                  <div className="size-full overflow-hidden rounded-[20px] bg-[#D6D2C6]">
                    {scent.image_url && (
                      <img
                        className="size-full object-cover"
                        src={scent.image_url}
                        alt={scent.name}
                      />
                    )}
                  </div>
                  <button
                    className="absolute -right-1 -top-1 z-10 grid size-8 place-items-center rounded-full bg-[#9B8461] text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04]"
                    type="button"
                    aria-label={`Remove ${scent.name}`}
                    onClick={() =>
                      setSelectedIds((current) =>
                        current.filter((id) => id !== scent.id),
                      )
                    }
                  >
                    <LuMinus className="size-3" aria-hidden="true" />
                  </button>
                </div>
                <p className="mt-2 truncate text-center text-xs text-[#696555]">
                  {scent.name}
                </p>
              </div>
            ))}
          </div>
          {!loadingScents && scents.length === 0 && (
            <p className="text-sm text-[#696555]">No scents available.</p>
          )}
        </section>

        <section className="mt-9">
          <button
            className="flex h-10 w-full items-center justify-center gap-3 rounded-[23.603px] bg-[#696555] text-xs text-[#D8D1C1] shadow-[0_3.147px_3.147px_0_rgba(0,0,0,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04]"
            type="button"
            onClick={() => setPickerOpen((current) => !current)}
            aria-expanded={pickerOpen}
          >
            Add ingredient <LuPlus className="size-4" aria-hidden="true" />
          </button>
          {pickerOpen && (
            <div className="mt-3 rounded-2xl bg-[#F4F2EE] p-3">
              <label className="flex h-10 items-center gap-2 rounded-full bg-white px-3">
                <LuSearch
                  className="size-4 shrink-0 text-[#696555]"
                  aria-hidden="true"
                />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search scents"
                  aria-label="Search scents to add"
                />
              </label>
              <div className="mt-2 max-h-56 overflow-y-auto">
                {availableScents.map((scent) => (
                  <button
                    className="flex w-full items-center gap-3 px-2 py-2 text-left"
                    type="button"
                    key={scent.id}
                    onClick={() => {
                      setSelectedIds((current) => [...current, scent.id]);
                      setSearch("");
                      setPickerOpen(false);
                    }}
                  >
                    <span className="size-10 shrink-0 overflow-hidden rounded-xl bg-[#D6D2C6]">
                      {scent.image_url && (
                        <img
                          className="size-full object-cover"
                          src={scent.image_url}
                          alt=""
                          loading="lazy"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {scent.name}
                    </span>
                    <LuPlus className="size-4 shrink-0" aria-hidden="true" />
                  </button>
                ))}
                {availableScents.length === 0 && (
                  <p className="px-2 py-3 text-sm text-[#696555]">
                    No matching scents.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="mt-16">
          <h2 className="font-serif text-2xl">Fragrance profile</h2>
          <div className="mt-5 space-y-4">
            {profileFields.map((field) => (
              <label
                className="grid grid-cols-[56px_minmax(0,1fr)_42px] items-center gap-3 text-xs text-[#696555]"
                key={field.id}
              >
                <span>{field.label}</span>
                <input
                  className="h-1 w-full cursor-pointer accent-[#221B04]"
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

        <section className="mt-16">
          <h2 className="font-serif text-2xl">Notes</h2>
          <textarea
            className="mt-5 min-h-32 w-full resize-y rounded-[28px] bg-[#F4F2EE] px-6 py-5 text-sm text-[#221B04] outline-none focus-visible:ring-2 focus-visible:ring-[#696555]"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add notes on your process, your inspiration, thoughts or adjustments..."
            aria-label="Recipe notes"
          />
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">Equipment</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {PRODUCTS.map((product) => {
              const active = equipment.some(
                (item) => item.toLowerCase() === product.name.toLowerCase(),
              );
              return (
                <button
                  className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-xs ${
                    active ? "bg-[#696555] text-white" : "bg-[#F4F2EE]"
                  }`}
                  type="button"
                  key={product.name}
                  aria-pressed={active}
                  onClick={() =>
                    active
                      ? setEquipment((current) =>
                          current.filter(
                            (item) =>
                              item.toLowerCase() !== product.name.toLowerCase(),
                          ),
                        )
                      : addEquipment(product.name)
                  }
                >
                  <img
                    className="size-7 rounded-full object-cover"
                    src={product.image}
                    alt=""
                  />
                  {product.name}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex gap-2">
            <input
              className="h-10 min-w-0 flex-1 rounded-full bg-[#F4F2EE] px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#696555]"
              value={customEquipment}
              onChange={(event) => setCustomEquipment(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addEquipment(customEquipment);
                  setCustomEquipment("");
                }
              }}
              placeholder="Or type your own equipment"
              aria-label="Custom equipment name"
            />
            <button
              className="grid size-10 place-items-center rounded-[23.603px] bg-[#696555] text-[#D8D1C1] shadow-[0_3.147px_3.147px_0_rgba(0,0,0,0.25)]"
              type="button"
              aria-label="Add equipment"
              onClick={() => {
                addEquipment(customEquipment);
                setCustomEquipment("");
              }}
            >
              <LuPlus className="size-4" aria-hidden="true" />
            </button>
          </div>
          {equipment
            .filter(
              (name) =>
                !PRODUCTS.some(
                  (product) => product.name.toLowerCase() === name.toLowerCase(),
                ),
            )
            .map((name) => (
              <span
                className="mr-2 mt-3 inline-flex items-center gap-2 rounded-full bg-[#696555] py-1 pl-4 pr-2 text-xs text-white"
                key={name}
              >
                {name}
                <button
                  className="grid size-5 place-items-center rounded-full bg-white/20"
                  type="button"
                  aria-label={`Remove ${name}`}
                  onClick={() =>
                    setEquipment((current) =>
                      current.filter((item) => item !== name),
                    )
                  }
                >
                  <LuX className="size-3" aria-hidden="true" />
                </button>
              </span>
            ))}
        </section>

        <section className="mt-12" id="steps-section">
          <h2 className="font-serif text-2xl">
            Step by step <span className="text-base text-[#696555]">*</span>
          </h2>
          <ol className="mt-5 space-y-3">
            {steps.map((step, index) => (
              <li className="flex items-start gap-3" key={index}>
                <span className="mt-3 grid size-6 shrink-0 place-items-center rounded-full bg-[#696555] text-xs text-white">
                  {index + 1}
                </span>
                <textarea
                  className="min-h-16 min-w-0 flex-1 resize-y rounded-[20px] bg-[#F4F2EE] px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#696555]"
                  value={step}
                  onChange={(event) =>
                    setSteps((current) =>
                      current.map((item, i) =>
                        i === index ? event.target.value : item,
                      ),
                    )
                  }
                  placeholder={`Step ${index + 1}`}
                  aria-label={`Step ${index + 1}`}
                  required={index === 0}
                />
                {steps.length > 1 && (
                  <button
                    className="mt-3 grid size-6 shrink-0 place-items-center rounded-full bg-[#9B8461] text-white"
                    type="button"
                    aria-label={`Remove step ${index + 1}`}
                    onClick={() =>
                      setSteps((current) => current.filter((_, i) => i !== index))
                    }
                  >
                    <LuMinus className="size-3" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ol>
          <button
            className="mt-5 flex h-10 w-full items-center justify-center gap-3 rounded-[23.603px] bg-[#696555] text-xs text-[#D8D1C1] shadow-[0_3.147px_3.147px_0_rgba(0,0,0,0.25)]"
            type="button"
            onClick={() => setSteps((current) => [...current, ""])}
          >
            Add step <LuPlus className="size-4" aria-hidden="true" />
          </button>
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">Pairs well with</h2>
          <div className="mt-6 grid grid-cols-3 gap-4 sm:max-w-md sm:gap-6">
            {pairedScents.map((scent) => (
              <div className="min-w-0" key={scent.id}>
                <div className="relative aspect-square">
                  <div className="size-full overflow-hidden rounded-[20px] bg-[#D6D2C6]">
                    {scent.image_url && (
                      <img
                        className="size-full object-cover"
                        src={scent.image_url}
                        alt={scent.name}
                      />
                    )}
                  </div>
                  <button
                    className="absolute -right-1 -top-1 z-10 grid size-8 place-items-center rounded-full bg-[#9B8461] text-white shadow-sm"
                    type="button"
                    aria-label={`Remove ${scent.name} pairing`}
                    onClick={() =>
                      setPairIds((current) =>
                        current.filter((id) => id !== scent.id),
                      )
                    }
                  >
                    <LuMinus className="size-3" aria-hidden="true" />
                  </button>
                </div>
                <p className="mt-2 truncate text-center text-xs text-[#696555]">
                  {scent.name}
                </p>
              </div>
            ))}
            {pairedScents.length === 0 &&
              [0, 1, 2].map((slot) => (
                <div
                  className="aspect-square rounded-[20px] bg-[#D6D2C6]"
                  key={slot}
                  aria-hidden="true"
                />
              ))}
          </div>
          <button
            className="mt-6 flex h-10 w-full items-center justify-center gap-3 rounded-[23.603px] bg-[#696555] text-xs text-[#D8D1C1] shadow-[0_3.147px_3.147px_0_rgba(0,0,0,0.25)]"
            type="button"
            onClick={() => setPairPickerOpen((current) => !current)}
            aria-expanded={pairPickerOpen}
          >
            Add pairing <LuPlus className="size-4" aria-hidden="true" />
          </button>
          {pairPickerOpen && (
            <div className="mt-3 rounded-2xl bg-[#F4F2EE] p-3">
              <label className="flex h-10 items-center gap-2 rounded-full bg-white px-3">
                <LuSearch
                  className="size-4 shrink-0 text-[#696555]"
                  aria-hidden="true"
                />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  value={pairSearch}
                  onChange={(event) => setPairSearch(event.target.value)}
                  placeholder="Search scents"
                  aria-label="Search scents to pair"
                />
              </label>
              <div className="mt-2 max-h-56 overflow-y-auto">
                {availablePairs.map((scent) => (
                  <button
                    className="flex w-full items-center gap-3 px-2 py-2 text-left"
                    type="button"
                    key={scent.id}
                    onClick={() => {
                      setPairIds((current) => [...current, scent.id]);
                      setPairSearch("");
                      setPairPickerOpen(false);
                    }}
                  >
                    <span className="size-10 shrink-0 overflow-hidden rounded-xl bg-[#D6D2C6]">
                      {scent.image_url && (
                        <img
                          className="size-full object-cover"
                          src={scent.image_url}
                          alt=""
                          loading="lazy"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {scent.name}
                    </span>
                    <LuPlus className="size-4 shrink-0" aria-hidden="true" />
                  </button>
                ))}
                {availablePairs.length === 0 && (
                  <p className="px-2 py-3 text-sm text-[#696555]">
                    No matching scents.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="mt-16">
          <h2 className="font-serif text-2xl">Media</h2>
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
                      <video className="size-full object-cover" src={item.url} muted playsInline />
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
                        muted
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
          <button
            className="mx-auto mt-6 flex h-31 w-full max-w-78 flex-col items-center justify-center gap-3 rounded-[28px] bg-[#F4F2EE] text-xs text-[#696555] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04] disabled:cursor-not-allowed disabled:opacity-60"
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

        {error && (
          <p className="mt-5 text-sm text-red-800" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="mt-5 text-sm text-[#4E4934]" role="status">
            {message}
          </p>
        )}
      </form>
    </main>
  );
};

export default Add;
