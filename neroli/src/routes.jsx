import { Route, Routes } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import Add from "./pages/Add";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Scents from "./pages/Scents";
import Shop from "./pages/Shop";

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<BottomNav />}>
        <Route index element={<Home />} />
        <Route path="scents" element={<Scents />} />
        <Route path="add" element={<Add />} />
        <Route path="shop" element={<Shop />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
