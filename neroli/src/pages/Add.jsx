import defaultCoverImage from "../assets/images/perfume.jpg";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  LuArrowLeft,
  LuHeart,
  LuLock,
  LuMinus,
  LuPlus,
  LuSearch,
  LuX,
} from "react-icons/lu";
import { useAuth } from "../context/AuthContext.js";
import supabase from "../lib/supabase";
import { PRODUCTS } from "../lib/shopProducts";

const shuffle = (items) => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
};

const MAX_MEDIA_BYTES = 50 * 1024 * 1024;
const MAX_MEDIA_FILES = 6;

const profileFields = [
  { id: "sweet", label: "Sweet" },
  { id: "warm", label: "Warm" },
  { id: "fresh", label: "Fresh" },
  { id: "intensity", label: "Intensity" },
];

const DEFAULT_COVER = `${import.meta.env.BASE_URL}perfume.jpg`;

const initialProfile = {
  sweet: 70,
  warm: 70,
  fresh: 70,
  intensity: 70,
};

const getUpdatedAt = () => new Date().toISOString();

const Add = () => {
  const { session, isPremium } = useAuth();
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
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [generated, setGenerated] = useState(null);
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState([]);
  const [pairIds, setPairIds] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
  const [coverUrl, setCoverUrl] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const coverInput = useRef(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [pairPool, setPairPool] = useState([]);
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
      setPairPool(shuffle(data ?? []));
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
      .from("scent_favorites")
      .select("scent_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data, error: favError }) => {
        if (isCurrent && !favError)
          setFavoriteIds((data ?? []).map((row) => row.scent_id));
      });
    return () => {
      isCurrent = false;
    };
  }, [userId]);

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
      setIsPublic(data.is_public === true);
      setCoverUrl(data.image_url ?? null);
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

  const pairSuggestions = pairPool
    .filter((scent) => !selectedIds.includes(scent.id))
    .slice(0, 3);

  const shownPairs = (
    pairIds.length > 0
      ? pairIds.map((id) => scents.find((scent) => scent.id === id))
      : pairSuggestions
  )
    .filter(Boolean)
    .slice(0, 3);

  const availableScents = scents
    .filter(
      (scent) =>
        !selectedIds.includes(scent.id) &&
        scent.name.toLowerCase().includes(search.trim().toLowerCase()),
    )
    .sort(
      (a, b) =>
        Number(favoriteIds.includes(b.id)) - Number(favoriteIds.includes(a.id)),
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

  const coverPreview = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : null),
    [coverFile],
  );
  useEffect(
    () => () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    },
    [coverPreview],
  );
  const shownCover = coverPreview || coverUrl || defaultCoverImage;

  const pickCover = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Cover must be a photo.");
      return;
    }
    if (file.size > MAX_MEDIA_BYTES) {
      setError("Cover photo is larger than 50 MB.");
      return;
    }
    setError("");
    setCoverFile(file);
  };

  const hasEquipment = (name) =>
    equipment.some((item) => item.toLowerCase() === name.toLowerCase());

  const toggleEquipment = (name) =>
    setEquipment((current) =>
      current.some((item) => item.toLowerCase() === name.toLowerCase())
        ? current.filter((item) => item.toLowerCase() !== name.toLowerCase())
        : [...current, name],
    );

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
      let imageUrl = coverUrl || DEFAULT_COVER;
      if (coverFile) {
        const safeName = coverFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${userId}/covers/${crypto.randomUUID()}-${safeName}`;
        const coverUpload = await supabase.storage
          .from("recipe-media")
          .upload(path, coverFile, { contentType: coverFile.type });
        if (coverUpload.error) throw coverUpload.error;
        imageUrl = supabase.storage.from("recipe-media").getPublicUrl(path)
          .data.publicUrl;
      }

      const recipeData = {
        image_url: imageUrl,
        user_id: userId,
        name: recipeName.trim() || "Recipe draft",
        short_description: subtitle.trim() || null,
        profile,
        notes: notes.trim(),
        is_public: isPublic,
        ...(isPremium
          ? { pairs_with: shownPairs.map((scent) => scent.id) }
          : {}),
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

  const generateRecipe = async () => {
    if (generating) return;
    setGenerating(true);
    setGenerateError("");
    setMessage("");
    const { data, error: invokeError } = await supabase.functions.invoke(
      "generate-recipe",
      { body: { scentIds: selectedIds, idea: recipeName.trim() } },
    );
    setGenerating(false);
    const recipe = data?.recipe;
    if (invokeError || !recipe) {
      let detail = data?.error || invokeError?.message;
      if (invokeError?.context?.text) {
        const raw = await invokeError.context.text().catch(() => "");
        try {
          detail = JSON.parse(raw).error || raw || detail;
        } catch {
          detail = raw || detail;
        }
      }
      setGenerateError(detail || "Could not generate a recipe.");
      return;
    }
    if (typeof recipe !== "object" || !recipe.scentIds?.length) {
      setGenerateError(
        `Unexpected response from generate-recipe: ${JSON.stringify(data).slice(0, 300)}`,
      );
      return;
    }
    setGenerated(recipe);
  };

  const applyGenerated = () => {
    if (!generated) return;
    if (generated.name) setRecipeName(generated.name);
    setSubtitle(generated.subtitle ?? "");
    setNotes(generated.description ?? "");
    setSelectedIds(generated.scentIds ?? []);
    setProfile({ ...initialProfile, ...generated.profile });
    setSteps(generated.steps?.length ? generated.steps : [""]);
    setGenerated(null);
  };

  const confirmLeave = () => {
    if (
      window.confirm(
        "Are you sure you want to leave? Unsaved changes will be lost.",
      )
    ) {
      if (editId) navigate(-1);
      else navigate("/");
    }
  };

  return (
    <main className="min-h-screen bg-[#EAE3D6] px-6 pb-32 pt-5 text-[#221B04] sm:px-10">
      <form className="mx-auto max-w-3xl" onSubmit={saveRecipe}>
        <div className="flex items-center justify-between">
          <button
            className="grid size-10 place-items-center rounded-full bg-white"
            type="button"
            onClick={confirmLeave}
            aria-label="Back"
          >
            <LuArrowLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            className="grid h-10 place-items-center rounded-full bg-white px-5 text-sm disabled:opacity-60"
            type="submit"
            disabled={saving || loadingRecipe}
          >
            {saving ? "Saving..." : loadingRecipe ? "Loading..." : "Save"}
          </button>
        </div>

        <section className="mt-7">
          <p className="font-serif text-4xl leading-none text-[#696555]">
            {String(savedRecipeId ? recipeCount : recipeCount + 1).padStart(
              2,
              "0",
            )}
          </p>
          <label className="mt-2 block">
            <span className="sr-only">Recipe name</span>
            <input
              className="w-full bg-transparent font-sans text-xl outline-none placeholder:text-[#696555]"
              value={recipeName}
              onChange={(event) => setRecipeName(event.target.value)}
              aria-label="Recipe name"
              placeholder="Recipe draft"
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

        <section className="mt-8">
          <h2 className="text-xl font-normal">About the recipe</h2>
          <textarea
            className="mt-5 min-h-32 w-full resize-y rounded-[28px] bg-[#F4F2EE] px-6 py-5 text-sm text-[#221B04] outline-none placeholder:text-[#B9B4A5] focus-visible:ring-2 focus-visible:ring-[#696555]"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Describe your recipe, its inspiration, or what makes it special..."
            aria-label="About the recipe"
          />
        </section>

        <section className="mt-6" aria-label="Recipe ingredients">
          {loadingScents && (
            <p className="text-sm text-[#696555]">Loading scents...</p>
          )}
          <div className="grid grid-cols-3 gap-4 sm:max-w-md sm:gap-6">
            {selectedScents.map((scent) => (
              <div className="min-w-0" key={scent.id}>
                <div className="relative aspect-square">
                  <div className="size-full overflow-hidden rounded-[20px] bg-[#F4F2EE]">
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
            className="flex h-10 w-full items-center justify-center gap-3 rounded-full bg-[#4B4631] text-xs text-[#A8A28B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04]"
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
                    {favoriteIds.includes(scent.id) && (
                      <LuHeart
                        className="size-4 shrink-0 fill-current"
                        aria-label="Favorite"
                      />
                    )}
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

        <section className="mt-14">
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

        <section className="mt-14" id="steps-section">
          <h2 className="text-xl font-normal">Recipe steps</h2>
          <div className="mt-6 rounded-[28px] bg-[#F4F2EE] p-3.5">
            <ol className="space-y-3">
              {steps.map((step, index) => (
                <li className="rounded-[20px] bg-[#EAE3D6] p-3.5" key={index}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold">
                      Step {index + 1}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="rounded-full bg-[#D6D0C0] px-2.5 py-0.5 text-[11px] font-medium text-[#696555]">
                        {index === 0 ? "Required" : "Optional"}
                      </span>
                      {steps.length > 1 && (
                        <button
                          className="grid size-5 place-items-center rounded-full bg-[#9B8461] text-white"
                          type="button"
                          aria-label={`Remove step ${index + 1}`}
                          onClick={() =>
                            setSteps((current) =>
                              current.filter((_, i) => i !== index),
                            )
                          }
                        >
                          <LuMinus className="size-3" aria-hidden="true" />
                        </button>
                      )}
                    </span>
                  </div>
                  <textarea
                    className="mt-2 min-h-12 w-full resize-y bg-transparent text-sm outline-none placeholder:text-[#B9B4A5]"
                    value={step}
                    onChange={(event) =>
                      setSteps((current) =>
                        current.map((item, i) =>
                          i === index ? event.target.value : item,
                        ),
                      )
                    }
                    placeholder={
                      index === 0
                        ? "Describe the first step of your recipe..."
                        : "Add the next action..."
                    }
                    aria-label={`Step ${index + 1}`}
                    required={index === 0}
                  />
                </li>
              ))}
            </ol>
            <button
              className="mt-3 flex h-11 w-full items-center justify-center gap-3 rounded-full bg-[#4B4631] text-xs text-[#A8A28B]"
              type="button"
              onClick={() => setSteps((current) => [...current, ""])}
            >
              Add step <LuPlus className="size-4" aria-hidden="true" />
            </button>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-xl font-normal">Pairs well with</h2>
          {isPremium ? (
            <div className="mt-6 rounded-3xl bg-[#F4F2EE] p-3.5">
              <span className="inline-block rounded-full bg-[#E2CFA3] px-3 py-1 text-xs font-semibold">
                Neroli+
              </span>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {shownPairs.map((scent) => (
                  <div
                    className="flex flex-col items-center gap-2 text-sm text-[#696555]"
                    key={scent.id}
                  >
                    <span className="block aspect-square w-full overflow-hidden rounded-3xl bg-[#EAE3D6]">
                      {scent.image_url && (
                        <img
                          className="size-full object-cover"
                          src={scent.image_url}
                          alt=""
                        />
                      )}
                    </span>
                    <span className="line-clamp-1">{scent.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Link
              className="mt-6 block rounded-3xl bg-[#F4F2EE] p-3.5"
              to="/premium"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[#E2CFA3] px-3 py-1 text-xs font-semibold">
                  Neroli+
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-[#D6D0C0] px-3 py-1 text-xs text-[#696555]">
                  <LuLock className="size-3.5" aria-hidden="true" />
                  Locked
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold">Pairs well with</p>
              <p className="mt-2 text-xs text-[#696555]">
                Unlock premium pairing suggestions with Neroli+.
              </p>
            </Link>
          )}
        </section>

        <section className="mt-14">
          <h2 className="text-xl font-normal">Equipment used</h2>
          <div className="mt-6 rounded-[28px] bg-[#F4F2EE] p-3.5">
            {!equipmentOpen && equipment.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {equipment.map((name) => (
                  <span
                    className="inline-flex items-center gap-2 rounded-full bg-[#EAE3D6] py-1.5 pl-3.5 pr-2 text-xs"
                    key={name}
                  >
                    {name}
                    <button
                      className="grid size-4 place-items-center rounded-full bg-[#696555]/15"
                      type="button"
                      aria-label={`Remove ${name}`}
                      onClick={() => toggleEquipment(name)}
                    >
                      <LuX className="size-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <button
              className="flex h-11 w-full items-center justify-center gap-3 rounded-full bg-[#4B4631] text-xs text-[#A8A28B]"
              type="button"
              onClick={() => setEquipmentOpen((open) => !open)}
              aria-expanded={equipmentOpen}
            >
              {equipmentOpen ? "Done" : "Add equipment"}
              {equipmentOpen ? (
                <LuX className="size-4" aria-hidden="true" />
              ) : (
                <LuPlus className="size-4" aria-hidden="true" />
              )}
            </button>
            {equipmentOpen && (
              <div className="mt-3">
                <div className="flex flex-col items-start gap-2">
                  {[
                    ...PRODUCTS,
                    ...equipment
                      .filter(
                        (name) =>
                          !PRODUCTS.some(
                            (product) =>
                              product.name.toLowerCase() === name.toLowerCase(),
                          ),
                      )
                      .map((name) => ({ name })),
                  ].map((product) => {
                    const active = hasEquipment(product.name);
                    return (
                      <button
                        className={`flex items-center gap-3 rounded-full py-1 pl-1 pr-5 text-sm ${
                          active
                            ? "bg-[#4B4631] text-[#E8E2D6]"
                            : "bg-[#EAE3D6]"
                        } ${product.image ? "" : "pl-5"}`}
                        type="button"
                        key={product.name}
                        aria-pressed={active}
                        onClick={() => toggleEquipment(product.name)}
                      >
                        {product.image && (
                          <img
                            className="size-9 rounded-full bg-white object-cover"
                            src={product.image}
                            alt=""
                          />
                        )}
                        {product.name}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    className="h-10 min-w-0 flex-1 rounded-full bg-[#EAE3D6] px-4 text-sm outline-none placeholder:text-[#B9B4A5] focus-visible:ring-2 focus-visible:ring-[#696555]"
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
                    className="grid size-10 place-items-center rounded-full bg-[#4B4631] text-[#A8A28B]"
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
              </div>
            )}
          </div>
        </section>

        <section className="mt-14">
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
                      <img
                        className="size-full object-cover"
                        src={item.url}
                        alt=""
                      />
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
          <button
            className="mt-6 flex h-31 w-full flex-col items-center justify-center gap-3 rounded-[28px] bg-[#F4F2EE] text-[11px] text-[#B9B4A5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={
              mediaItems.length + existingMedia.length >= MAX_MEDIA_FILES
            }
          >
            <span className="grid size-10 place-items-center rounded-full bg-white text-[#8B826B]">
              <LuPlus className="size-5" aria-hidden="true" />
            </span>
            Add photo/video
          </button>
        </section>

        <section className="mt-14">
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

        <section className="mt-14">
          <h2 className="text-xl font-normal">Recipe visibility</h2>
          <div
            className="mt-5 space-y-2 rounded-[28px] bg-[#F4F2EE] p-3"
            role="radiogroup"
            aria-label="Recipe visibility"
          >
            {[
              {
                value: false,
                label: "Private",
                text: "Only you can see this recipe.",
              },
              {
                value: true,
                label: "Public",
                text: "Anyone can discover and view this recipe.",
              },
            ].map((option) => (
              <button
                className="flex w-full items-center gap-3 rounded-[20px] bg-[#E8E2D6] p-4 text-left"
                type="button"
                role="radio"
                aria-checked={isPublic === option.value}
                key={option.label}
                onClick={() => setIsPublic(option.value)}
              >
                <span className="grid size-5 shrink-0 place-items-center rounded-full border-2 border-[#696555]">
                  {isPublic === option.value && (
                    <span className="size-2.5 rounded-full bg-[#696555]" />
                  )}
                </span>
                <span>
                  <span className="block text-sm font-semibold">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-[#696555]">
                    {option.text}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[28px] bg-[#F4F2EE] p-5">
          <h2 className="text-xl font-normal">Generate recipe</h2>
          <p className="mt-1 text-xs text-[#696555]">
            {isPremium
              ? "Pick some ingredients first, or let Néroli choose them for you."
              : "Let Néroli build a draft for you with NÉROLI+."}
          </p>
          {isPremium ? (
            <button
              className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-[#696555] text-sm text-[#F4F2EE] shadow-[0_3px_4px_rgba(0,0,0,0.25)] disabled:opacity-60"
              type="button"
              onClick={generateRecipe}
              disabled={generating}
            >
              {generating ? "Generating..." : "Generate a recipe"}
            </button>
          ) : (
            <Link
              className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-[#696555] text-sm text-[#F4F2EE] shadow-[0_3px_4px_rgba(0,0,0,0.25)]"
              to="/premium"
            >
              Unlock with NÉROLI+
            </Link>
          )}
          {generateError && (
            <p className="mt-3 text-xs text-red-800" role="alert">
              {generateError}
            </p>
          )}
          {generated && (
            <div className="mt-4 rounded-2xl bg-white p-4">
              <p className="text-base">{generated.name}</p>
              {generated.subtitle && (
                <p className="text-xs text-[#696555]">{generated.subtitle}</p>
              )}
              <p className="mt-2 text-xs text-[#4E4934]">
                {generated.description}
              </p>
              <p className="mt-2 text-xs text-[#696555]">
                {(generated.scentIds ?? [])
                  .map((id) => scents.find((scent) => scent.id === id)?.name)
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  className="h-11 flex-1 rounded-full bg-[#696555] text-sm text-[#F4F2EE]"
                  type="button"
                  onClick={applyGenerated}
                >
                  Use this recipe
                </button>
                <button
                  className="h-11 flex-1 rounded-full bg-[#EAE3D6] text-sm"
                  type="button"
                  onClick={() => setGenerated(null)}
                >
                  Discard
                </button>
              </div>
            </div>
          )}
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

        <div className="mt-12 space-y-3 px-3">
          <button
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#D6CFBC] text-sm font-medium disabled:opacity-60"
            type="submit"
            disabled={saving || loadingRecipe}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#221B04] text-sm font-medium text-white"
            type="button"
            onClick={() => (editId ? navigate(-1) : navigate("/"))}
          >
            Discard
          </button>
        </div>
      </form>
    </main>
  );
};

export default Add;
