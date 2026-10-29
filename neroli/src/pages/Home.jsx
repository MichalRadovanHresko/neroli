import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import supabase from "../lib/supabase";
import { useScents } from "../lib/scents";
import HeroSection from "../components/home/HeroSection";
import FavoritesSection from "../components/home/FavoritesSection";
import ExploreByNote from "../components/home/ExploreByNote";
import MyRecipesSection from "../components/home/MyRecipesSection";
import PremiumSection from "../components/home/PremiumSection";
import CraftedSection from "../components/home/CraftedSection";
import GuideSection from "../components/home/GuideSection";

// Assemble the home page and load personalized scent and recipe highlights.
const Home = () => {
  const navigate = useNavigate();
  const { resolveIngredient } = useScents();
  const { session } = useAuth();
  // Keep the latest user recipes and scent selections for home-page cards.
  const userId = session?.user?.id;
  const [favoriteScent, setFavoriteScent] = useState(null);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [recipeScents, setRecipeScents] = useState([]);
  const [craftedScent, setCraftedScent] = useState(null);
  const [myRecipes, setMyRecipes] = useState([]);

  // Turn the latest recipe into links for its ingredients or scent notes.
  const latestRecipe = myRecipes[0] ?? null;
  const latestIngredients = (latestRecipe?.ingredients ?? []).map(
    resolveIngredient,
  );
  const continueTiles = latestRecipe
    ? latestIngredients.slice(0, 3).map((ingredient, index) => ({
        key: `${ingredient.name}-${index}`,
        name: ingredient.name,
        image_url: ingredient.image_url,
        to: ingredient.scent_id
          ? `/scents/${ingredient.scent_id}`
          : `/recipes/${latestRecipe.id}`,
      }))
    : recipeScents.map((scent) => ({
        key: scent.id,
        name: scent.name,
        image_url: scent.image_url,
        to: `/scents/${scent.id}`,
      }));

  // Load image-ready scents, then shuffle them to vary the featured cards.
  useEffect(() => {
    let isCurrent = true;

    supabase
      .from("scents")
      .select("id, name, image_url, scent_family, short_description")
      .not("image_url", "is", null)
      .neq("image_url", "")
      .then(({ data, error }) => {
        if (!isCurrent || error || !data?.length) return;
        const shuffledScents = data.filter((scent) => scent.image_url?.trim());
        for (
          let currentIndex = shuffledScents.length - 1;
          currentIndex > 0;
          currentIndex -= 1
        ) {
          const randomIndex = Math.floor(Math.random() * (currentIndex + 1));
          [shuffledScents[currentIndex], shuffledScents[randomIndex]] = [
            shuffledScents[randomIndex],
            shuffledScents[currentIndex],
          ];
        }
        setRecipeScents(shuffledScents.slice(0, 3));
        setCraftedScent(shuffledScents[3] ?? shuffledScents[0]);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  // Fetch the signed-in user’s three most recently updated recipes.
  useEffect(() => {
    if (!userId) return;
    let isCurrent = true;

    supabase
      .from("recipes")
      .select("id, name, image_url, short_description, ingredients, updated_at")
      .eq("user_id", userId)
      .eq("is_premade", false)
      .order("updated_at", { ascending: false })
      .limit(3)
      .then(({ data, error }) => {
        if (isCurrent && !error) setMyRecipes(data ?? []);
      });

    return () => {
      isCurrent = false;
    };
  }, [userId]);

  // Find the latest favorite and load its scent details for the home card.
  useEffect(() => {
    let isCurrent = true;

    const loadFavoriteScent = async () => {
      if (!userId) return;

      const { data: favorite, error: favoriteError } = await supabase
        .from("scent_favorites")
        .select("scent_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!isCurrent) return;
      if (favoriteError || !favorite) {
        setFavoriteScent(null);
        setFavoritesLoading(false);
        return;
      }

      const { data: scent, error: scentError } = await supabase
        .from("scents")
        .select("id, name, image_url, scent_family, short_description")
        .eq("id", favorite.scent_id)
        .maybeSingle();

      if (!isCurrent) return;
      setFavoriteScent(scentError ? null : scent);
      setFavoritesLoading(false);
    };

    void loadFavoriteScent();
    return () => {
      isCurrent = false;
    };
  }, [userId]);

  // Render the featured content in separate, reusable sections.
  return (
    <main className="overflow-hidden bg-[#EAE3D6] text-[#221B04]">
      <HeroSection navigate={navigate} />

      {/* Group the personalized collections beneath the hero. */}
      <div className="relative z-10 mx-auto -mt-9 max-w-7xl rounded-t-[30px] bg-[#EAE3D6] px-5.5 pb-5 pt-8.5 sm:rounded-t-[36px] sm:px-10 sm:pb-36 sm:pt-10 lg:px-[10%]">
        {/* Show saved content after the favorite lookup finishes. */}
        {!favoritesLoading && favoriteScent && (
          <FavoritesSection favoriteScent={favoriteScent} navigate={navigate} />
        )}
        <ExploreByNote />

        {/* Continue the user’s latest blend or help them start a new one. */}
        <MyRecipesSection
          continueTiles={continueTiles}
          latestIngredients={latestIngredients}
          latestRecipe={latestRecipe}

          navigate={navigate}
        />

        <PremiumSection />

        <CraftedSection craftedScent={craftedScent} navigate={navigate} />

        <GuideSection />
      </div>
    </main>
  );
};

export default Home;
