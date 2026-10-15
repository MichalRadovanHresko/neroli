import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import Header from "./Header";

const AppLayout = () => {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen pb-28">
      <Header />
      <div className={pathname === "/" ? "" : "pt-22"}>
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
};

export default AppLayout;