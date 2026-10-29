// Browse shop products and safe purchase links, with searchable categories.
import { useEffect, useState } from "react";
import { LuSearch } from "react-icons/lu";

import scentImage from "../assets/images/scent.jpg";
import { PRODUCTS } from "../lib/shopProducts";
import supabase from "../lib/supabase";

// Product categories shown in the shop filter.
const CATEGORIES = [
  "All",
  "Essential oils",
  "Tools & Accessories",
  "Fragrance",
];

// Reject unsafe product links and provide a search link when none is set.
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

// Load available scent products and filter them for the shop display.
const Shop = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [scents, setScents] = useState([]);
  const [scentsLoading, setScentsLoading] = useState(true);
  const [scentsError, setScentsError] = useState(null);

  // Fetch the scent products used in the essential oils category.
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

  // Build filtered product lists for the selected category and search text.
  const query = searchQuery.trim().toLowerCase();
  const matches = (product) => product.name.toLowerCase().includes(query);
  const showOils =
    activeCategory === "All" || activeCategory === "Essential oils";
  const showEquipment =
    activeCategory === "All" || activeCategory === "Tools & Accessories";
  const equipmentProducts = showEquipment ? PRODUCTS.filter(matches) : [];
  const oilProducts = showOils
    ? scents
        .map((scent) => ({
          id: scent.id,
          name: scent.name,
          image: scentImage,
          purchaseUrl: scent.purchase_url,
        }))
        .filter(matches)
    : [];
  const hasAny = equipmentProducts.length > 0 || oilProducts.length > 0;
  const isKnownCategory = showOils || showEquipment;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-8 pt-14 sm:px-10">
      {/* Search and category controls shape the shop results below. */}
      <h1 className="font-serif text-[32px] uppercase leading-tight">Shop</h1>
      <div className="mt-6 space-y-5">
        <div className="relative flex items-center gap-3">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-full bg-[#F4F2EE] px-4 text-[#9c9889] shadow-[0_3px_12px_rgba(34,27,4,0.16)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#766d51]">
            <LuSearch className="size-6 shrink-0" aria-hidden="true" />
            <span className="sr-only">Search shop products</span>
            <input
              className="min-w-0 flex-1 bg-transparent text-xs text-[#221b04] outline-none placeholder:text-[#9c9889] sm:text-sm"
              type="search"
              placeholder="Search notes, recipes, ingredients..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
        </div>

        <div
          aria-label="Shop categories"
          className="-mx-5 overflow-x-auto px-5 sm:-mx-10 sm:px-10"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="flex w-max gap-2">
            {CATEGORIES.map((category) => {
              const isActive = category === activeCategory;

              return (
                <button
                  key={category}
                  className={`min-h-8 rounded-full px-4 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#766d51] ${
                    isActive ? "bg-[#d2cab5]" : "bg-[#F4F2EE]"
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

        {/* Tools are displayed as product cards with validated purchase links. */}
        {equipmentProducts.length > 0 && activeCategory === "All" && (
          <h2 className="text-xl font-normal">Tools &amp; Accessories</h2>
        )}
        {equipmentProducts.length > 0 && (
          <ul className="grid grid-cols-2 gap-4" aria-label="Shop products">
            {equipmentProducts.map((product, index) => {
              const purchaseUrl = getPurchaseUrl(product);
              const isWide = index % 3 === 0;
              const buyButtonClass =
                "flex h-11 w-full items-center justify-center rounded-full bg-[#696555] text-sm text-[#D8D1C1] shadow-[0_3px_4px_rgba(34,27,4,0.3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04]";

              return (
                <li
                  className={isWide ? "col-span-2" : "col-span-1"}
                  key={product.id ?? product.name}
                >
                  <article
                    className={`h-full overflow-hidden rounded-[28px] bg-white p-3 ${
                      isWide
                        ? "grid grid-cols-[42%_1fr] items-center gap-4"
                        : "flex flex-col gap-3"
                    }`}
                  >
                    <div
                      className={`grid place-items-center ${isWide ? "h-40" : "h-28"}`}
                    >
                      <img
                        className="size-full object-contain"
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                      />
                    </div>
                    <div
                      className={`flex min-w-0 flex-col ${
                        isWide ? "gap-3" : "flex-1 justify-between gap-4 px-1"
                      }`}
                    >
                      <div className="min-w-0">
                        <h2 className="font-serif text-base uppercase leading-tight">
                          {product.name}
                        </h2>
                        <p className="mt-1 text-xs text-[#716b58]">
                          {purchaseUrl
                            ? "Buy in online store"
                            : "Store link coming soon"}
                        </p>
                      </div>
                      {purchaseUrl ? (
                        <a
                          className={buyButtonClass}
                          href={purchaseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Buy ${product.name} online`}
                        >
                          Buy Now
                        </a>
                      ) : (
                        <span
                          className={`${buyButtonClass} opacity-50`}
                          aria-disabled="true"
                        >
                          Buy Now
                        </span>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}

        {/* Load or list essential oils after the equipment cards. */}
        {showOils && scentsLoading ? (
          <p className="rounded-3xl bg-white/45 px-5 py-8 text-center text-sm text-[#716b58]">
            Loading essential oils...
          </p>
        ) : showOils && scentsError ? (
          <p
            className="rounded-3xl bg-white/45 px-5 py-8 text-center text-sm text-red-800"
            role="alert"
          >
            Could not load essential oils: {scentsError}
          </p>
        ) : (
          oilProducts.length > 0 && (
            <>
              {activeCategory === "All" && (
                <h2 className="pt-4 text-xl font-normal">Essential oils</h2>
              )}
              <ul className="space-y-4" aria-label="Essential oils">
                {oilProducts.map((product) => {
                  const purchaseUrl = getPurchaseUrl(product);
                  const buttonClass =
                    "flex h-10 w-full items-center justify-center rounded-full bg-[#696555] text-xs text-[#D8D1C1] shadow-[0_3px_4px_rgba(34,27,4,0.3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#221B04]";

                  return (
                    <li key={product.id}>
                      <article className="flex gap-4 rounded-[28px] bg-white p-3 shadow-[0_4px_14px_rgba(34,27,4,0.08)]">
                        <div className="size-36 shrink-0 overflow-hidden rounded-[20px] bg-[#ECEAE6]">
                          <img
                            className="size-full object-cover"
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                          />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                          <div className="min-w-0">
                            <h2 className="truncate font-serif text-base uppercase leading-tight">
                              {product.name}
                            </h2>
                            <p className="mt-2 text-base text-[#696555]">
                              {purchaseUrl
                                ? "Buy in online store"
                                : "Store link coming soon"}
                            </p>
                          </div>
                          {purchaseUrl ? (
                            <a
                              className={buttonClass}
                              href={purchaseUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Buy ${product.name} online`}
                            >
                              Buy Now
                            </a>
                          ) : (
                            <span
                              className={`${buttonClass} opacity-50`}
                              aria-disabled="true"
                            >
                              Buy Now
                            </span>
                          )}
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            </>
          )
        )}

        {/* Explain when a category has no matching or available products. */}
        {!hasAny && !(showOils && (scentsLoading || scentsError)) && (
          <p className="rounded-3xl bg-white/45 px-5 py-8 text-center text-sm text-[#716b58]">
            {isKnownCategory
              ? "No products match your search."
              : `Products in ${activeCategory} are coming soon.`}
          </p>
        )}
      </div>
    </main>
  );
};

export default Shop;
