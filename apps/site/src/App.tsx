import { Box } from "@chakra-ui/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { BrandCursor } from "@/components/BrandCursor";
import { Header } from "@/sections/Header";
import { Footer } from "@/sections/Footer";
import { LandingPage } from "@/pages/LandingPage";
import { PrivacyPolicy } from "@/pages/PrivacyPolicy";
import { TermsOfUse } from "@/pages/TermsOfUse";

export const App = () => (
  <BrowserRouter>
    <Box>
      <BrandCursor />
      <Header />
      <Box as="main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacidade" element={<PrivacyPolicy />} />
          <Route path="/termos" element={<TermsOfUse />} />
        </Routes>
      </Box>
      <Footer />
    </Box>
  </BrowserRouter>
);
