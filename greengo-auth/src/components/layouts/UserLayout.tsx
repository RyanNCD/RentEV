// File: src/components/layouts/UserLayout.tsx
import { Outlet } from "react-router-dom";
// Import 2 component ông đã có
import Navbar from "../Navbar"; 
import Footer from "../landing/Footer"; 

export default function UserLayout() {
  return (
    <>
      {/* Navbar của ông */}
      <Navbar /> 
      
      {/* Nội dung các trang con (Home, About...) sẽ render ở đây */}
      <main>
        <Outlet />
      </main>
      
      {/* Footer của ông */}
      <Footer />
    </>
  );
}