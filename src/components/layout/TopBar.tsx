/**
 * TOP BAR COMPONENT
 * 
 * Fixed top bar that spans full width
 * Contains Scorpion logo, branding, the nine-page top nav, and theme toggle
 * Clicking the logo/text takes you back to home page
 * Theme toggle is positioned in the top right corner
 *
 * The desktop nav appears at xl (1280), not lg. Eight labels plus the
 * branding, the music toggle and the theme toggle do not fit in a 64px bar
 * at 1024: the wordmark wrapped to three lines and broke out of the bar.
 * Below xl the slide-in panel carries the same rows.
 *
 * Mobile Navigation:
 * - Shows hamburger/X menu button on mobile (hidden on desktop)
 * - Button positioned to left of Scorpion Design System branding
 * - Hamburger (☰) when closed, X when open
 * - The nav rows themselves live in the MobileNav slide-in panel (Layout)
 */

import { Link } from "react-router-dom";
import { ASSETS } from "@/lib/assets";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { TopNav } from "./TopNav";

interface TopBarProps {
  // Indicates if mobile menu is currently open
  isMobileMenuOpen: boolean;
  // Function to toggle the mobile menu open/closed
  toggleMobileMenu: () => void;
  // Indicates if music player is currently open/visible
  isMusicPlayerOpen: boolean;
  // Function to open the music player
  openMusicPlayer: () => void;
  // Function to close the music player
  closeMusicPlayer: () => void;
}

export function TopBar({ isMobileMenuOpen, toggleMobileMenu, isMusicPlayerOpen, openMusicPlayer, closeMusicPlayer }: TopBarProps) {
  return (
    <header 
      className="fixed top-0 left-0 right-0 h-16 bg-[var(--surface-container)] border-b border-solid border-[var(--border-hairline)]"
      style={{ zIndex: 'var(--z-index-sticky)' }}
    >
      {/* Flex container: mobile menu button + branding on left, theme toggle on right */}
      <div className="h-full pl-4 xl:pl-7 pr-6 flex items-center justify-between gap-3">
        {/* Left side: Mobile menu button + Clickable Scorpion Design System branding */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button - Only visible below xl, where the top nav appears */}
          <button
            onClick={toggleMobileMenu}
            className="xl:hidden p-2 plate-round hover:bg-[var(--surface-muted)] hover:text-[var(--accent)] transition-colors [transition-duration:var(--duration-fast)] focus:outline-none focus-visible:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-primary)]"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {/* Show X icon when menu is open, hamburger icon when closed */}
            {isMobileMenuOpen ? (
              // X icon (close)
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              // Hamburger icon (menu)
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>

          {/* Clickable Scorpion Design System branding - links to home */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {/* Scorpion Logo - dark in light mode, light in dark mode */}
            <img 
              src={ASSETS.scorpionHeroV2} 
              alt="Scorpion Design System" 
              className="w-8 h-8 object-contain dark:invert"
            />
            
            {/* Branding Text */}
            {/* Portfolio convention: weight 400, emphasis carried by the accent */}
            <h1 className="text-lg font-mono text-[var(--accent)] whitespace-nowrap">Scorpion Design System</h1>
          </Link>
        </div>

        {/* Right side: page nav + music player toggle + theme toggle */}
        {/* Hidden below xl, where MobileNav takes over */}
        <div className="hidden xl:flex items-center gap-2">
          {/* Eight-page top navigation (desktop rendering) */}
          <TopNav />

          {/* Music Player Toggle Button - Opens music player when clicked */}
          {/* Disabled when music player is already open */}
          <Button
            onClick={isMusicPlayerOpen ? closeMusicPlayer : openMusicPlayer}
            variant="outline"
            size="sm"
            className={isMusicPlayerOpen ? "bg-secondary-200 dark:bg-secondary-700" : ""}
            aria-label={isMusicPlayerOpen ? "Close music player" : "Open music player"}
          >
            <span className="font-mono" aria-hidden="true">♫</span>
          </Button>

          {/* Theme toggle button */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

