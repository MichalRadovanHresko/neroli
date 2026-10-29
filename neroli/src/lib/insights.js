import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import supabase from "./supabase";

// Build scent insights from the user’s preferences and recipe activity.

// Map onboarding answers to scent families used for recommendations.
const LIKE_FAMILY = {
  Floral: "floral",
  "Fresh & citrusy": "citrus",
  "Sweet & gourmand": "gourmand",
  "Woody & earthy": "woody",
  "Clean & soapy": "fresh",
  "Spicy & warm": "spicy",
};

// Track scent families the user prefers to avoid.
const AVOID_FAMILY = {
  "Very sweet scents": "gourmand",
  "Strong floral scents": "floral",
  "Smoky or leathery scents": "leather",
};

// Provide display names and short descriptions for each scent family.
export const FAMILY_STYLE = {
  gourmand: { title: "Sweet & Gourmand", line: "a sweet tooth" },
  woody: { title: "Warm & Woody", line: "warmth" },
  floral: { title: "Soft & Floral", line: "flowers" },
  citrus: { title: "Fresh & Citrusy", line: "freshness" },
  fresh: { title: "Clean & Fresh", line: "a clean slate" },
  fruity: { title: "Bright & Fruity", line: "juicy brightness" },
  spicy: { title: "Warm & Spicy", line: "a little spice" },
  leather: { title: "Dark & Leathery", line: "depth" },
  green: { title: "Green & Herbal", line: "green things" },
};

// Normalize labels so scent names can be compared consistently.
const normalize = (value) => value?.trim().toLowerCase() ?? "";

// Find which known families are present in a scent family label.
const familiesOf = (scent) =>
  Object.keys(FAMILY_STYLE).filter((key) =>
    normalize(scent?.scent_family).includes(key),
  );

// Builds the scent profile from saved/own recipes and onboarding answers
export const useScentInsights = () => {
  const { session } = useAuth();
  const user = session?.user;
  const userId = user?.id;
  const preferences = user?.user_metadata?.preferences;
  const [scents, setScents] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [ownCount, setOwnCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load the user’s owned and saved recipes alongside the scent catalogue.
  useEffect(() => {
    if (!userId) return;
    let isCurrent = true;

    const load = async () => {
      const columns = "id, name, image_url, ingredients, created_at";
      const [scentResult, ownResult, savedResult] = await Promise.all([
        supabase.from("scents").select("id, name, image_url, scent_family"),
        supabase.from("recipes").select(columns).eq("user_id", userId),
        supabase.from("recipe_saves").select("recipe_id").eq("user_id", userId),
      ]);
      const ownIds = new Set((ownResult.data ?? []).map((row) => row.id));
      const savedIds = (savedResult.data ?? [])
        .map((row) => row.recipe_id)
        .filter((id) => !ownIds.has(id));
      const [normal, premium] = savedIds.length
        ? await Promise.all([
            supabase.from("recipes").select(columns).in("id", savedIds),
            supabase.from("premium_recipes").select(columns).in("id", savedIds),
          ])
        : [{ data: [] }, { data: [] }];

      if (!isCurrent) return;
      setScents(scentResult.data ?? []);
      setOwnCount((ownResult.data ?? []).length);
      setRecipes([
        ...(ownResult.data ?? []).map((row) => ({ ...row, own: true })),
        ...(normal.data ?? []),
        ...(premium.data ?? []).map((row) => ({ ...row, isPremium: true })),
      ]);
      setLoading(false);
    };

    void load();
    return () => {
      isCurrent = false;
    };
  }, [userId]);

  // Score scent families and ingredients to build the user’s profile.
  const insights = useMemo(() => {
    const scentByName = new Map(
      scents.map((scent) => [normalize(scent.name), scent]),
    );
    const findScent = (name) => {
      const wanted = normalize(name);
      return (
        scentByName.get(wanted) ??
        scents.find((scent) => normalize(scent.name).includes(wanted)) ??
        null
      );
    };

    // Translate preferences into family and note signals for scoring.
    const likedFamilies = (preferences?.likes ?? [])
      .map((like) => LIKE_FAMILY[like])
      .filter(Boolean);
    const avoidedFamilies = (preferences?.avoids ?? [])
      .map((avoid) => AVOID_FAMILY[avoid])
      .filter(Boolean);
    const likedNotes = (preferences?.notes ?? []).map(normalize);

    // Count ingredients and accumulate family scores from recipe activity.
    const noteCounts = new Map();
    const familyScores = new Map();
    const addFamily = (family, points) =>
      familyScores.set(family, (familyScores.get(family) ?? 0) + points);

    likedFamilies.forEach((family) => addFamily(family, 1.5));

    recipes.forEach((recipe) => {
      (recipe.ingredients ?? []).forEach((ingredient) => {
        const scent = findScent(ingredient.name);
        const key = scent?.name ?? ingredient.name;
        const entry = noteCounts.get(key) ?? { name: key, count: 0, scent };
        entry.count += recipe.own ? 2 : 1;
        noteCounts.set(key, entry);
        familiesOf(scent).forEach((family) =>
          addFamily(family, recipe.own ? 2 : 1),
        );
      });
    });

    likedNotes.forEach((note) => {
      const scent = findScent(note);
      familiesOf(scent).forEach((family) => addFamily(family, 1));
    });

    // Rank the most-used notes and calculate their share of recipe ingredients.
    const totalNotes = [...noteCounts.values()].reduce(
      (sum, entry) => sum + entry.count,
      0,
    );
    const topNotes = [...noteCounts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((entry) => ({
        ...entry,
        percent: totalNotes ? Math.round((entry.count / totalNotes) * 100) : 0,
      }));

    const [topFamily] =
      [...familyScores.entries()]
        .filter(([family]) => !avoidedFamilies.includes(family))
        .sort((a, b) => b[1] - a[1])[0] ?? [];

    // Give each owned recipe a score based on the user’s preferences.
    const scoreRecipe = (recipe) =>
      (recipe.ingredients ?? []).reduce((sum, ingredient) => {
        const scent = findScent(ingredient.name);
        const families = familiesOf(scent);
        let points = 0;
        if (families.some((family) => likedFamilies.includes(family)))
          points += 1;
        if (families.some((family) => avoidedFamilies.includes(family)))
          points -= 1;
        if (likedNotes.includes(normalize(ingredient.name))) points += 2;
        return sum + points;
      }, 0) + (recipe.own ? 1 : 0);

    // Select the strongest owned recipes and choose representative images.
    const topCreations = recipes
      .filter((recipe) => recipe.own)
      .sort((a, b) => scoreRecipe(b) - scoreRecipe(a))
      .slice(0, 3)
      .map((recipe) => ({
        ...recipe,
        image:
          recipe.image_url ||
          (recipe.ingredients ?? [])
            .map((ingredient) => findScent(ingredient.name)?.image_url)
            .find(Boolean) ||
          null,
      }));

    // Pick a hero image that matches the highest-scoring family when possible.
    const heroScent =
      scents.find(
        (scent) => scent.image_url && familiesOf(scent).includes(topFamily),
      ) ??
      topNotes[0]?.scent ??
      null;

    return { topNotes, topFamily, topCreations, heroScent };
  }, [recipes, scents, preferences]);

  return { ...insights, ownCount, loading };
};
