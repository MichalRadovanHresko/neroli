import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuArrowRight,
  LuBookmark,
  LuFlaskConical,
  LuHeart,
} from "react-icons/lu";
import BackButton from "../components/BackButton";
import supabase from "../lib/supabase";
import { useAuth } from "../context/AuthContext.js";

const normalize = (value) => value?.trim().toLowerCase() ?? "";

const countIn = (recipes, scent) =>
  recipes.filter((recipe) =>
    (recipe.ingredients ?? []).some(
      (ingredient) => normalize(ingredient.name) === normalize(scent.name),
    ),
  ).length;

const FavoriteScents = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [favorites, setFavorites] = useState([]);
  const [own, setOwn] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let isCurrent = true;

    const load = async () => {
      const columns = "id, ingredients";
      const [favoriteResult, ownResult, savedResult] = await Promise.all([
        supabase
          .from("scent_favorites")
          .select("scent_id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase.from("recipes").select(columns).eq("user_id", userId),
        supabase.from("recipe_saves").select("recipe_id").eq("user_id", userId),
      ]);
      const scentIds = (favoriteResult.data ?? []).map((row) => row.scent_id);
      const savedIds = (savedResult.data ?? []).map((row) => row.recipe_id);

      const [scentResult, normal, premium] = await Promise.all([
        scentIds.length
          ? supabase
              .from("scents")
              .select("id, name, image_url, scent_family, short_description")
              .in("id", scentIds)
          : { data: [] },
        savedIds.length
          ? supabase.from("recipes").select(columns).in("id", savedIds)
          : { data: [] },
        savedIds.length
          ? supabase.from("premium_recipes").select(columns).in("id", savedIds)
          : { data: [] },
      ]);

      if (!isCurrent) return;
      const byId = new Map((scentResult.data ?? []).map((s) => [s.id, s]));
      setFavorites(scentIds.map((id) => byId.get(id)).filter(Boolean));
      setOwn(ownResult.data ?? []);
      setSaved([...(normal.data ?? []), ...(premium.data ?? [])]);
      setLoading(false);
    };

    void load();
    return () => {
      isCurrent = false;
    };
  }, [userId]);

  const stats = useMemo(() => {
    const rows = favorites.map((scent) => {
      const used = countIn(own, scent);
      const inSaved = countIn(saved, scent);
      return { scent, used, inSaved, score: used * 2 + inSaved + 1 };
    });
    const signature = [...rows].sort((a, b) => b.score - a.score)[0];
    const totalUsed = rows.reduce((sum, row) => sum + row.used, 0);
    const totalSaved = rows.reduce((sum, row) => sum + row.inSaved, 0);
    const total = totalUsed + totalSaved + rows.length || 1;
    const percent = (value) => Math.round((value / total) * 100);
    return {
      rows,
      signature,
      bars: [
        {
          icon: LuFlaskConical,
          label: "Used in your recipes",
          value: percent(totalUsed),
        },
        {
          icon: LuBookmark,
          label: "In recipes you saved",
          value: percent(totalSaved),
        },
        {
          icon: LuHeart,
          label: "Marked as favourite",
          value: percent(rows.length),
        },
      ],
    };
  }, [favorites, own, saved]);

  const { signature } = stats;
  const caption = (row) =>
    row.used
      ? `Used in ${row.used} recipe${row.used === 1 ? "" : "s"}`
      : row.inSaved
        ? `Saved in ${row.inSaved} recipe${row.inSaved === 1 ? "" : "s"}`
        : "Favourite";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#EDE6DA_0%,#E4DAC8_100%)] px-5 pb-8 pt-4 text-[#221B04]">
      <div className="relative flex items-center justify-center">
        <BackButton className="absolute left-0 bg-transparent" />
        <Link className="font-serif text-2xl" to="/">
          NÉROLI
        </Link>
      </div>

      <h1 className="mt-6 font-serif text-[34px] leading-tight">
        Your favorite scents
      </h1>
      <p className="mt-2 max-w-72 text-sm leading-snug text-[#696555]">
        The notes you explore, save and use the most in your creations.
      </p>

      {loading && <p className="mt-8 text-sm text-[#696555]">Loading...</p>}

      {!loading && !signature && (
        <p className="mt-8 rounded-3xl bg-[#F4F2EE] p-5 text-sm text-[#696555]">
          You have no favourite scents yet. Tap the heart on a scent to see it
          here.
        </p>
      )}

      {signature && (
        <>
          <section className="relative mt-6 flex min-h-44 overflow-hidden rounded-[28px] bg-[#D9C8AC]">
            <div className="relative z-10 flex flex-col justify-center p-5">
              <p className="text-[10px] uppercase tracking-wide text-[#696555]">
                Your signature note
              </p>
              <h2 className="mt-2 font-serif text-[34px] leading-none">
                {signature.scent.name}
              </h2>
              <p className="mt-2 max-w-40 text-xs">
                {signature.scent.short_description ||
                  signature.scent.scent_family}
              </p>
              <Link
                className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-[#221B04]/40 px-4 py-2 text-xs"
                to={`/scents/${signature.scent.id}`}
              >
                Explore note{" "}
                <LuArrowRight className="size-3" aria-hidden="true" />
              </Link>
            </div>
            {signature.scent.image_url && (
              <img
                className="absolute inset-y-0 right-0 h-full w-1/2 object-cover mask-[linear-gradient(90deg,transparent,#000_45%)]"
                src={signature.scent.image_url}
                alt=""
              />
            )}
          </section>

          <section className="mt-7">
            <h2 className="font-serif text-2xl">Your top notes</h2>
            <ul className="-mx-5 mt-4 flex gap-3 overflow-x-auto px-5 scrollbar-none [&::-webkit-scrollbar]:hidden">
              {stats.rows.map((row) => (
                <li className="w-23 shrink-0" key={row.scent.id}>
                  <Link to={`/scents/${row.scent.id}`}>
                    <img
                      className="size-23 rounded-[20px] bg-[#D6D2C6] object-cover"
                      src={row.scent.image_url}
                      alt=""
                      loading="lazy"
                    />
                    <p className="mt-2 truncate text-xs font-semibold">
                      {row.scent.name}
                    </p>
                    <p className="truncate text-[10px] text-[#696555]">
                      {caption(row)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-7 rounded-3xl bg-[#F4F2EE]/80 p-5">
            <h2 className="font-serif text-xl">How you discovered them</h2>
            <ul className="mt-4 space-y-3">
              {stats.bars.map((bar) => (
                <li className="flex items-center gap-3" key={bar.label}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#EAE3D6]">
                    <bar.icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between text-xs">
                      <span>{bar.label}</span>
                      <span>{bar.value}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-[#DDD6C8]">
                      <div
                        className="h-full rounded-full bg-[#221B04]"
                        style={{ width: `${bar.value}%` }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <Link
            className="mt-5 flex items-center gap-4 rounded-3xl bg-[#F4F2EE]/80 p-4"
            to={`/explore/all?type=community&q=${encodeURIComponent(signature.scent.name)}`}
          >
            <span className="relative h-20 w-24 shrink-0">
              {stats.rows.slice(0, 2).map((row, index) => (
                <img
                  className={`absolute size-14 rounded-2xl object-cover ${index === 0 ? "left-0 top-0" : "bottom-0 right-0 border-2 border-[#F4F2EE]"}`}
                  key={row.scent.id}
                  src={row.scent.image_url}
                  alt=""
                />
              ))}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-serif text-lg leading-tight">
                Inspired by your favorites
              </span>
              <span className="mt-1 block text-xs text-[#696555]">
                Recipe suggestions based on the notes you love.
              </span>
            </span>
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#221B04] text-white">
              <LuArrowRight className="size-5" aria-hidden="true" />
            </span>
          </Link>
        </>
      )}
    </main>
  );
};

export default FavoriteScents;
