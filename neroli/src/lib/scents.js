import { useEffect, useState } from "react";
import supabase from "./supabase";

// Resolve recipe ingredient names against the shared scent catalogue.

// Keep one in-memory catalogue so screens can reuse the same scent request.
let cachedScents = null;
let pendingRequest = null;

// Reuse cached or in-flight data before requesting the scent catalogue.
const loadScents = () => {
  if (cachedScents) return Promise.resolve(cachedScents);
  pendingRequest ??= supabase
    .from("scents")
    .select("id, name, image_url")
    .then(({ data, error }) => {
      pendingRequest = null;
      if (error) return [];
      cachedScents = data ?? [];
      return cachedScents;
    });
  return pendingRequest;
};

// Make scent-name comparisons case- and whitespace-insensitive.
const normalize = (value) => value?.trim().toLowerCase() ?? "";

// Match full names first, then allow partial ingredient labels.
const findScent = (scents, name) => {
  const wanted = normalize(name);
  if (!wanted) return null;
  return (
    scents.find((scent) => normalize(scent.name) === wanted) ??
    scents.find((scent) => normalize(scent.name).startsWith(wanted)) ??
    scents.find((scent) => normalize(scent.name).includes(wanted)) ??
    null
  );
};

// Fills in image_url and scent id of recipe ingredients from the scents table
export const useScents = () => {
  const [scents, setScents] = useState(cachedScents ?? []);

  // Ignore late results after the component using this hook unmounts.
  useEffect(() => {
    let isCurrent = true;
    void loadScents().then((data) => {
      if (isCurrent) setScents(data);
    });
    return () => {
      isCurrent = false;
    };
  }, []);

  // Attach catalogue ids and images while keeping any existing ingredient image.
  const resolveIngredient = (ingredient) => {
    const scent = findScent(scents, ingredient.name);
    return {
      ...ingredient,
      scent_id: scent?.id ?? null,
      image_url: scent?.image_url || ingredient.image_url || null,
    };
  };

  return { scents, resolveIngredient };
};
