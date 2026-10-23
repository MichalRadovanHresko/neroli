import { useEffect, useState } from "react";
import { LuArrowUpRight, LuSearch, LuSlidersHorizontal } from "react-icons/lu";

import { PRODUCTS } from "../lib/shopProducts";
import supabase from "../lib/supabase";

const CATEGORIES = [
  "All",
  "Essential oils",
  "Tools & Accessories",
  "Fragrance",
];

const getPurchaseUrl = (product) => {
  if (product.purchaseUrl === undefined) {
    return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(product.name)}`;
  }
  if (!product.purchaseUrl) return null;

  try {
    const url = new URL(product.purchaseUrl);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : null;
  } catch {
    return null;
  }
};

const Shop = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [scents, setScents] = useState([]);
  const [scentsLoading, setScentsLoading] = useState(true);
  const [scentsError, setScentsError] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    const loadScents = async () => {
      const { data, error } = await supabase
        .from("scents")
        .select("id, name, purchase_url")
        .order("id", { ascending: true });

      if (!isCurrent) return;
      if (error) setScentsError(error.message);
      else setScents(data ?? []);
      setScentsLoading(false);
    };

    void loadScents();
    return () => {
      isCurrent = false;
    };
  }, []);

  const categoryProducts =
    activeCategory === "Essential oils"
      ? scents.map((scent) => ({
          id: scent.id,
          name: scent.name,
          image: scentImage,
          purchaseUrl: scent.purchase_url,
        }))
      : activeCategory === "All" || activeCategory === "Tools & Accessories"
        ? PRODUCTS
        : [];
  const visibleProducts = categoryProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  const hasProducts = categoryProducts.length > 0;
  const isScentsCategory = activeCategory === "Essential oils";

  return (
    <main className="mx-auto w-full max-w-5xl px-6 pb-8 sm:px-10">
      <div className="space-y-7">
        <div className="relative">
          <label className="flex h-11 items-center gap-3 rounded-full bg-white/75 px-4 text-[#9c9889] shadow-[0_3px_12px_rgba(34,27,4,0.16)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#766d51]">
            <LuSearch className="size-6 shrink-0" aria-hidden="true" />
            <span className="sr-only">Search shop products</span>
            <input
              className="min-w-0 flex-1 bg-transparent text-xs text-[#221b04] outline-none placeholder:text-[#9c9889] sm:text-sm"
              type="search"
              placeholder="Search notes, recipes, ingredients..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <span
              className="grid size-8 shrink-0 place-items-center"
              aria-hidden="true"
            >
              <LuSlidersHorizontal className="size-5" aria-hidden="true" />
            </span>
          </label>
        </div>

        <div
          aria-label="Shop categories"
          className="-mx-6 overflow-x-auto px-6 sm:-mx-10 sm:px-10"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="flex w-max gap-2">
            {CATEGORIES.map((category) => {
              const isActive = category === activeCategory;

              return (
                <button
                  key={category}
                  className={`min-h-8 rounded-full px-4 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#766d51] ${
                    isActive ? "bg-[#d2cab5]" : "bg-white/65"
                  }`}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {isScentsCategory && scentsLoading ? (
          <p className="rounded-3xl bg-white/45 px-5 py-8 text-center text-sm text-[#716b58]">
            Loading essential oils...
          </p>
        ) : isScentsCategory && scentsError ? (
          <p
            className="rounded-3xl bg-white/45 px-5 py-8 text-center text-sm text-red-800"
            role="alert"
          >
            Could not load essential oils: {scentsError}
          </p>
        ) : hasProducts && visibleProducts.length > 0 ? (
          <ul className="space-y-8 sm:space-y-6" aria-label="Shop products">
            {visibleProducts.map((product) => {
              const purchaseUrl = getPurchaseUrl(product);

              return (
                <li key={product.id ?? product.name}>
                  <article className="grid min-h-38.5 grid-cols-[34%_1fr] overflow-hidden rounded-[28px] bg-[#d8d1c1] shadow-[0_3px_4px_rgba(34,27,4,0.2)] sm:min-h-44">
                    <div className="grid min-w-0 place-items-center bg-white p-3 sm:p-5">
                      <img
                        className="max-h-31.5 w-full object-contain sm:max-h-36"
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                      />
                    </div>
                    <div className="flex min-w-0 flex-col items-start justify-between gap-2 py-4.5 pl-4.5 pr-9 sm:pl-6 sm:pr-10">
                      <div className="min-w-0">
                        <h2 className="font-serif text-[15px] leading-tight uppercase sm:text-lg">
                          {product.name}
                        </h2>
                        <p className="mt-2 text-xs text-[#716b58] sm:text-sm">
                          {purchaseUrl
                            ? "Buy in online store"
                            : "Store link coming soon"}
                        </p>
                      </div>
                      {purchaseUrl ? (
                        <a
                          className="grid size-8 shrink-0 self-end place-items-center rounded-full bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#766d51]"
                          href={purchaseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Buy ${product.name} online`}
                        >
                          <LuArrowUpRight
                            className="size-5"
                            aria-hidden="true"
                          />
                        </a>
                      ) : (
                        <span
                          className="grid size-8 shrink-0 self-end place-items-center rounded-full bg-white/60 text-[#716b58]"
                          aria-hidden="true"
                        >
                          <LuArrowUpRight className="size-5" />
                        </span>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-3xl bg-white/45 px-5 py-8 text-center text-sm text-[#716b58]">
            {hasProducts
              ? "No products match your search."
              : `Products in ${activeCategory} are coming soon.`}
          </p>
        )}
      </div>
    </main>
  );
};

export default Shop;
