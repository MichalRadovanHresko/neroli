import { Link } from "react-router-dom";

// Display recipe ingredients or equipment as a grid of item tiles.
const ItemGrid = ({ items }) => (
  <div className="mt-4 grid grid-cols-3 gap-x-3 gap-y-4">
    {items.map((item, index) => {
      // Reuse the same tile whether or not an item has a scent link.
      const tile = (
        <>
          <div className="aspect-square overflow-hidden rounded-[18px] bg-[#C9BFA9]">
            {item.image_url && (
              <img
                className="size-full object-cover"
                src={item.image_url}
                alt=""
                loading="lazy"
              />
            )}
          </div>
          <p className="mt-2 text-xs text-[#221B04]">{item.name}</p>
        </>
      );
      return (
        <div className="min-w-0 text-center" key={`${item.name}-${index}`}>
          {item.scent_id ? (
            <Link to={`/scents/${item.scent_id}`} className="block">
              {tile}
            </Link>
          ) : (
            tile
          )}
        </div>
      );
    })}
  </div>
);

export default ItemGrid;
