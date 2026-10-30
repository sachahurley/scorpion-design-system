/**
 * LAYOUT COMPONENT
 * 
 * Main layout wrapper with a fixed top bar carrying the nine-page nav
 * Applied to all pages including home
 *
 * Mobile Navigation:
 * - Manages mobile menu state (open/closed)
 * - Passes toggle functions to TopBar and MobileNav
 * - MobileNav panel slides in below the top bar on mobile screens
 * 
 * Scroll Behavior:
 * - Automatically scrolls to top when navigating between pages
 */

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { TopBar } from "./TopBar";
import { MobileNav } from "./TopNav";
import { MusicPlayer } from "@/components/ui/MusicPlayer";
import { LightModeNotice } from "@/components/LightModeNotice";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  // Get current location to detect route changes
  const location = useLocation();
  
  // State to manage mobile menu open/closed
  // false = menu is closed, true = menu is open
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // State to manage music player visibility
  // true = player is visible, false = player is hidden
  // Default: hidden (false) - must be toggled to show
  const [isMusicPlayerOpen, setIsMusicPlayerOpen] = useState(false);
  
  // State to manage music player closing animation
  // true = player is animating out, false = normal state
  const [isMusicPlayerClosing, setIsMusicPlayerClosing] = useState(false);

  // SCROLL TO TOP: Run whenever the route/pathname changes
  // This ensures every new page starts at the top
  useEffect(() => {
    // Disable browser's automatic scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Scroll to top immediately and forcefully
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Also try with requestAnimationFrame to catch any late renders
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  }, [location.pathname]); // Runs every time the pathname changes

  // Function to toggle the mobile menu (open ↔ closed)
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Function to close the mobile menu
  // Called when user clicks on a navigation link
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Function to open the music player
  // Called from TopBar button
  const openMusicPlayer = () => {
    setIsMusicPlayerOpen(true);
  };

  // Function to close the music player
  // Called from music player close button or toggle button
  // Triggers slide-out animation, then removes component
  const closeMusicPlayer = () => {
    setIsMusicPlayerClosing(true);
    // Wait for animation to complete (500ms) before removing component
    setTimeout(() => {
      setIsMusicPlayerOpen(false);
      setIsMusicPlayerClosing(false);
    }, 500);
  };

  return (
    <div className="min-h-screen theme-transition">
      {/* Fixed Top Bar - spans full width */}
      {/* Pass mobile menu state and toggle function to TopBar */}
      <TopBar 
        isMobileMenuOpen={isMobileMenuOpen} 
        toggleMobileMenu={toggleMobileMenu}
        isMusicPlayerOpen={isMusicPlayerOpen}
        openMusicPlayer={openMusicPlayer}
        closeMusicPlayer={closeMusicPlayer}
      />

      {/* Mobile menu - slide-in panel with the nine nav rows */}
      {/* Pass mobile menu state, close function, and music player controls to MobileNav */}
      <MobileNav
        isMobileMenuOpen={isMobileMenuOpen}
        closeMobileMenu={closeMobileMenu}
        isMusicPlayerOpen={isMusicPlayerOpen}
        openMusicPlayer={openMusicPlayer}
        closeMusicPlayer={closeMusicPlayer}
      />

      {/* Main Content Area - full width, scrolls under top bar */}
      <main className="pt-16">
        <div className="min-h-screen bg-[var(--surface-page)]">
          {children}
        </div>
      </main>

      {/* Music Player - Fixed bottom-right corner, visible on all pages */}
      {/* Only rendered when open */}
      {isMusicPlayerOpen && (
        <MusicPlayer onClose={closeMusicPlayer} isClosing={isMusicPlayerClosing} />
      )}

      {/* Dialog shown when the user switches into light mode (under construction) */}
      <LightModeNotice />
    </div>
  );
}

