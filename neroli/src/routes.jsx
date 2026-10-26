import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import RequireAuth from "./components/RequireAuth";
import Add from "./pages/Add";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Premium from "./pages/Premium";
import Profile from "./pages/Profile";
import RecipeDetail from "./pages/RecipeDetail";
import Explore from "./pages/Explore";
import ExploreAll from "./pages/ExploreAll";
import ScentDetail from "./pages/ScentDetail";
import Shop from "./pages/Shop";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="signup" element={<Navigate to="/signin" replace />} />
      <Route path="signin" element={<Auth />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="scents" element={<Explore />} />
          <Route path="explore/all" element={<ExploreAll />} />
          <Route path="scents/:id" element={<ScentDetail />} />
          <Route path="recipes/:id" element={<RecipeDetail />} />
          <Route path="add" element={<Add />} />
          <Route path="recipes/:id/edit" element={<Add />} />
          <Route path="shop" element={<Shop />} />
          <Route path="profile" element={<Profile />} />
          <Route path="premium" element={<Premium />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
