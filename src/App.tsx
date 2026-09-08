import { useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import AnnouncementBar from "./components/AnnouncementBar";
import FeaturedNews from "./components/FeaturedNews";
import SchoolAbout from "./components/SchoolAbout";
import Campuses from "./components/Campuses";
import QuickLinks from "./components/QuickLinks";
import Footer from "./components/Footer";

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-warm-white">
      <Header mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <main>
        <Hero />
        <AnnouncementBar />
        <FeaturedNews />
        <SchoolAbout />
        <Campuses />
        <QuickLinks />
      </main>
      <Footer />
    </div>
  );
}
