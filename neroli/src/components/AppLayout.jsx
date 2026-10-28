import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import Header from "./Header";

const AppLayout = () => {
  const { pathname } = useLocation();

  const hideHeader =
    pathname.startsWith("/profile") ||
    pathname === "/shop" ||
    pathname === "/favorites" ||
    pathname === "/notifications" ||
    pathname.startsWith("/scents/");

  return (
    <div className="min-h-screen pb-28">
      {!hideHeader && <Header />}
      <div className={pathname === "/" || hideHeader ? "" : "pt-22"}>
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
