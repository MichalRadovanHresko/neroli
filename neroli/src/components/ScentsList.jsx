import { useEffect, useState } from "react";
import RecipeCard from "./RecipeCard";
import supabase from "../lib/supabase";

const ScentsList = () => {
  const [scents, setScents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase
      .from("scents")
      .select("*")
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setScents(data);
      });
  }, []);

  return (
    <>
      {error && <p>{error}</p>}
      <ul className="mt-4 space-y-4">
        {scents.map((s) => (
          <li key={s.id}>
            <RecipeCard {...s} />
          </li>
        ))}
      </ul>
    </>
  );
};

export default ScentsList;
