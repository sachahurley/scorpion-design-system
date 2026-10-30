/**
 * MAIN APP COMPONENT
 *
 * Sets up routing and theme provider for the entire application.
 * Nine pages, all on the Layout with the top nav: Home, the two
 * long-form pages (Essay, Case Study), the two demos (Music Player,
 * Screens), and the four system pages (Skills, Specs, Harness, Changelog).
 *
 * The old documentation routes (foundation, components, tokens, patterns)
 * redirect: reference docs now live in the deployed Storybook at
 * https://sachahurley.github.io/scorp-ds/
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { Layout } from "@/components/layout/Layout";
import Home from "@/pages/Home";
import Essay from "@/pages/Essay";
import CaseStudyPage from "@/pages/patterns/CaseStudy";
import MusicPlayerPattern from "@/pages/patterns/MusicPlayerPattern";
import Screens from "@/pages/demos/Screens";
import Skills from "@/pages/Skills";
import Harness from "@/pages/Harness";
import Specs from "@/pages/Specs";
import Changelog from "@/pages/Changelog";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename="/scorpion-design-system">
        <Layout>
          <Routes>
            {/* The nine pages */}
            <Route path="/" element={<Home />} />
            <Route path="/essay" element={<Essay />} />
            <Route path="/case-study" element={<CaseStudyPage />} />
            <Route path="/demos/music-player" element={<MusicPlayerPattern />} />
            <Route path="/demos/screens" element={<Screens />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/harness" element={<Harness />} />
            <Route path="/specs" element={<Specs />} />
            <Route path="/changelog" element={<Changelog />} />

            {/* Old pattern pages that kept a home here: redirect to it */}
            <Route path="/patterns/music-player" element={<Navigate to="/demos/music-player" replace />} />
            <Route path="/patterns/case-study" element={<Navigate to="/case-study" replace />} />

            {/* Retired documentation routes (docs live in Storybook now) */}
            <Route path="/foundation/*" element={<Navigate to="/" replace />} />
            <Route path="/components/*" element={<Navigate to="/" replace />} />
            <Route path="/tokens/*" element={<Navigate to="/" replace />} />
            <Route path="/patterns/*" element={<Navigate to="/" replace />} />

            {/* Anything else lands on Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
