// Build and save a recipe from selected scents, steps, and optional media.
import defaultCoverImage from "../assets/images/perfume.jpg";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LuArrowLeft } from "react-icons/lu";
import { useAuth } from "../context/AuthContext.js";
import supabase from "../lib/supabase";
import { MAX_MEDIA_BYTES, MAX_MEDIA_FILES } from "../lib/recipeForm";

import TitleFields from "../components/add/TitleFields";
import AboutField from "../components/add/AboutField";
import SelectedIngredients from "../components/add/SelectedIngredients";
import IngredientPicker from "../components/add/IngredientPicker";
import ProfileSliders from "../components/add/ProfileSliders";
import StepsEditor from "../components/add/StepsEditor";
import PairsWell from "../components/add/PairsWell";
import EquipmentPicker from "../components/add/EquipmentPicker";
import MediaUploader from "../components/add/MediaUploader";
import CoverPhoto from "../components/add/CoverPhoto";
import VisibilityToggle from "../components/add/VisibilityToggle";
import GenerateCard from "../components/add/GenerateCard";

// Randomize a copied list so suggestions do not change the original scent data.
const shuffle = (items) => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
};

const DEFAULT_COVER = `${import.meta.env.BASE_URL}perfume.jpg`;

const initialProfile = {
  sweet: 70,
  warm: 70,
  fresh: 70,
  intensity: 70,
};

// Use one timestamp format for recipe creation and later edits.
const getUpdatedAt = () => new Date().toISOString();

// Keep the draft form state here and pass focused values to each form section.
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

  // Keep the latest media list available to cleanup when the page unmounts.
  useEffect(() => {
    mediaItemsRef.current = mediaItems;
  }, [mediaItems]);

  // Release temporary browser URLs so removed or closed drafts do not leak memory.
  useEffect(
    () => () => {
      mediaItemsRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    },
    [],
  );

  // Validate selected files and create temporary URLs for their previews.
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

  // Remove a new upload and release its temporary preview URL.
  const removeMedia = (id) => {
    setMediaItems((current) => {
      const removed = current.find((item) => item.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return current.filter((item) => item.id !== id);
    });
  };

  // Load scent options once so the recipe builder can populate its pickers.
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

  // Prioritize the signed-in user’s favorites in the ingredient picker.
  // Show the user’s recipe number when creating a new draft.
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

  // Restore an owned recipe after its scent choices are available.
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

  // Convert saved ids into scent records used by the form and database payload.
  const selectedScents = selectedIds
    .map((id) => scents.find((scent) => scent.id === id))
    .filter(Boolean);

  // Suggest scents that are not already among the recipe ingredients.
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

  // Add custom equipment only when the name is non-empty and not already listed.
  const addEquipment = (name) => {
    const clean = name.trim();
    if (!clean) return;
    setEquipment((current) =>
      current.some((item) => item.toLowerCase() === clean.toLowerCase())
        ? current
        : [...current, clean],
    );
  };

  // Create and clean up the local preview URL for a newly chosen cover.
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

  // Accept only image files that fit the same size limit as recipe media.
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

  // Compare equipment names without treating different letter case as distinct.
  const hasEquipment = (name) =>
    equipment.some((item) => item.toLowerCase() === name.toLowerCase());

  const toggleEquipment = (name) =>
    setEquipment((current) =>
      current.some((item) => item.toLowerCase() === name.toLowerCase())
        ? current.filter((item) => item.toLowerCase() !== name.toLowerCase())
        : [...current, name],
    );

  // Save the recipe and synchronize its ingredients and uploaded media.
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

      // Store a normalized recipe record before updating its related media.
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

  // Ask the server for a draft based on the current ingredient choices.
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

  // Copy the generated draft into editable fields for the user to review.
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

  // Confirm before leaving so an unsaved draft is not discarded by accident.
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
        {/* Page controls let the user leave the form or save the current draft. */}
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

        {/* Collect the recipe name, subtitle, and short description. */}
        <TitleFields
          recipeCount={recipeCount}
          recipeName={recipeName}
          savedRecipeId={savedRecipeId}
          setRecipeName={setRecipeName}
          setSubtitle={setSubtitle}
          subtitle={subtitle}
        />

        <AboutField notes={notes} setNotes={setNotes} />

        {/* Manage the scent list and the profile and preparation details. */}
        <SelectedIngredients
          loadingScents={loadingScents}
          scents={scents}
          selectedScents={selectedScents}
          setSelectedIds={setSelectedIds}
        />

        <IngredientPicker
          availableScents={availableScents}
          favoriteIds={favoriteIds}
          pickerOpen={pickerOpen}
          search={search}
          setPickerOpen={setPickerOpen}
          setSearch={setSearch}
          setSelectedIds={setSelectedIds}
        />

        <ProfileSliders profile={profile} setProfile={setProfile} />

        <StepsEditor setSteps={setSteps} steps={steps} />

        {/* Premium pairing and optional recipe extras. */}
        <PairsWell isPremium={isPremium} shownPairs={shownPairs} />

        <EquipmentPicker
          addEquipment={addEquipment}
          customEquipment={customEquipment}
          equipment={equipment}
          equipmentOpen={equipmentOpen}
          hasEquipment={hasEquipment}
          setCustomEquipment={setCustomEquipment}
          setEquipmentOpen={setEquipmentOpen}
          toggleEquipment={toggleEquipment}
        />

        <MediaUploader
          addFiles={addFiles}
          existingMedia={existingMedia}
          fileInputRef={fileInputRef}
          mediaItems={mediaItems}
          removeMedia={removeMedia}
          setExistingMedia={setExistingMedia}
        />

        <CoverPhoto
          coverInput={coverInput}
          pickCover={pickCover}
          shownCover={shownCover}
        />

        {/* Choose who can discover the recipe and optionally generate a draft. */}
        <VisibilityToggle isPublic={isPublic} setIsPublic={setIsPublic} />

        <GenerateCard
          applyGenerated={applyGenerated}
          generateError={generateError}
          generateRecipe={generateRecipe}
          generated={generated}
          generating={generating}
          isPremium={isPremium}
          scents={scents}
          setGenerated={setGenerated}
        />

        {/* Show save feedback and provide final save or discard actions. */}
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
