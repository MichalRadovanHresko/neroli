import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import RequireAuth from "./components/RequireAuth";
import Add from "./pages/Add";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Explore from "./pages/Explore";
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
          <Route path="scents/:id" element={<ScentDetail />} />
          <Route path="add" element={<Add />} />
          <Route path="shop" element={<Shop />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
