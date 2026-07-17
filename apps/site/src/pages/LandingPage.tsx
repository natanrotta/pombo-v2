import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Hero } from "@/sections/Hero";
import { Problem } from "@/sections/Problem";
import { Modules } from "@/sections/Modules";
import { Trust } from "@/sections/Trust";
import { Pricing } from "@/sections/Pricing";

export const LandingPage = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    // Wait one frame so the section is mounted before scrolling
    const id = hash.replace("#", "");
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [hash]);

  return (
    <>
      <Hero />
      <Problem />
      <Modules />
      <Trust />
      <Pricing />
    </>
  );
};
