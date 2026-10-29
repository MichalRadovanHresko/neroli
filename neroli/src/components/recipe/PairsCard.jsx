import { Link } from "react-router-dom";
import Card from "./Card";

// Link the scents that pair well with the current recipe.
const PairsCard = ({ pairedScents }) => (
  <Card title="Pairs well with">
    <div className="mt-4 grid grid-cols-3 gap-4">
      {pairedScents.map((scent) => (
        <Link className="min-w-0" key={scent.id} to={`/scents/${scent.id}`}>
          <div className="aspect-square overflow-hidden rounded-[20px] bg-[#D6D2C6]">
            {scent.image_url && (
              <img
                className="size-full object-cover"
                src={scent.image_url}
                alt={scent.name}
              />
            )}
          </div>
          <p className="mt-2 truncate text-center text-xs text-[#696555]">
            {scent.name}
          </p>
        </Link>
      ))}
    </div>
  </Card>
);

export default PairsCard;
