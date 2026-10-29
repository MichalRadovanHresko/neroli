import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import Header from "./Header";

// Provide shared page spacing, header, and bottom navigation.

const AppLayout = () => {
  const { pathname } = useLocation();

  // Hide the global header on screens that provide their own top controls.
  const hideHeader =
    pathname.startsWith("/profile") ||
    pathname === "/shop" ||
    pathname === "/favorites" ||
    pathname === "/notifications" ||
    pathname.startsWith("/scents/");

  return (
    <div className="min-h-screen pb-28">
      {/* Show shared navigation around whichever page the router selected. */}
      {!hideHeader && <Header />}
      <div className={pathname === "/" || hideHeader ? "" : "pt-22"}>
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
