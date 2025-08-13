import Footer from "./Footer";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <>
      <Navbar />
      <main className="p-4">
         <Outlet />
      </main>
      <Footer/>
    </>
  );
};

export default Layout;