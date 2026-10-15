import { Route, Routes } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import RequireAuth from "./components/RequireAuth";
import Add from "./pages/Add";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Scents from "./pages/Scents";
import ScentDetail from "./pages/ScentDetail";
import Shop from "./pages/Shop";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="signup" element={<Auth mode="signup" />} />
      <Route path="signin" element={<Auth mode="signin" />} />
      <Route element={<RequireAuth />}>
        <Route element={<BottomNav />}>
          <Route index element={<Home />} />
          <Route path="scents" element={<Scents />} />
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
