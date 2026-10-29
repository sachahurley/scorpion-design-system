/**
 * TOP NAVIGATION
 *
 * The site's eight-page navigation on the DS plate language, replacing the
 * old documentation sidebar. Two renderings share one NAV_ITEMS source:
 *
 * - TopNav: horizontal plate rows inside the TopBar (desktop, xl+)
 * - MobileNav: the slide-in panel below the TopBar (below xl), keeping the
 *   old sidebar's overlay + translate animation and its mobile-only
 *   music player / theme toggle controls
 *
 * Rows use the plate recipe: quiet secondary text idle, surface.muted fill
 * with accent text on hover, and the active route holds that filled state
 * (color plus fill, never a weight change). Focus is an inset ring because
 * the plate clip swallows outside outlines.
 */

import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/** The eight pages, in nav order: home, the two long-form pages, the two
 *  demos, then the three pages about the system itself. */
const NAV_ITEMS: { to: string; label: string }[] = [
  { to: "/", label: "Home" },
  { to: "/essay", label: "Essay" },
  { to: "/case-study", label: "Case Study" },
  { to: "/demos/music-player", label: "Music Player" },
  { to: "/demos/screens", label: "Screens" },
  { to: "/skills", label: "Skills" },
  { to: "/specs", label: "Specs" },
  { to: "/harness", label: "Harness" },
];

/**
 * A single nav row on the plate recipe. Focus uses the inset ring
 * (box-shadow) because the plate clip swallows outside outlines.
 */
function NavRow({
  to,
  active,
  onNavigate,
  children,
}: {
  to: string;
  active: boolean;
  onNavigate?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`
        flex items-center gap-3 px-3 py-2 plate-round font-mono text-sm whitespace-nowrap
        transition-colors [transition-duration:var(--duration-fast)]
        focus:outline-none focus-visible:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-primary)]
        ${
          active
            ? "bg-[var(--surface-muted)] text-[var(--accent)]"
            : "text-secondary-800 dark:text-secondary-500 hover:bg-[var(--surface-muted)] hover:text-[var(--accent)]"
        }
      `}
    >
      {children}
    </Link>
  );
}

/**
 * TopNav Component
 *
 * Desktop navigation: the eight plate rows in a horizontal run, rendered
 * inside the TopBar (hidden below xl, where MobileNav takes over).
 */
export function TopNav() {
  const location = useLocation();

  return (
    <nav aria-label="Site" className="hidden xl:flex items-center gap-1">
      {NAV_ITEMS.map((item) => (
        <NavRow key={item.to} to={item.to} active={location.pathname === item.to}>
          {item.label}
        </NavRow>
      ))}
    </nav>
  );
}

export interface MobileNavProps {
  // Mobile menu open state (panel slides in below xl)
  isMobileMenuOpen: boolean;
  // Closes the mobile menu after a nav click
  closeMobileMenu: () => void;
  // Music player controls (mobile block only; desktop lives in TopBar)
  isMusicPlayerOpen: boolean;
  openMusicPlayer: () => void;
  closeMusicPlayer: () => void;
}

/**
 * MobileNav Component
 *
 * The mobile menu: a full-width panel that slides in from the left below
 * the TopBar (same overlay + translate recipe as the old sidebar), holding
 * the eight nav rows plus the mobile-only music player and theme controls.
 */
export function MobileNav({
  isMobileMenuOpen,
  closeMobileMenu,
  isMusicPlayerOpen,
  openMusicPlayer,
  closeMusicPlayer,
}: MobileNavProps) {
  const location = useLocation();

  return (
    <>
      {/* Dark overlay - closes the menu on click */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 xl:hidden top-16"
          style={{ zIndex: 'var(--z-index-overlay)' }}
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Menu panel: container surface, slides in under the TopBar */}
      <div
        className={`
          xl:hidden w-full bg-[var(--surface-container)] fixed left-0 top-16
          border-b border-solid border-[var(--border-hairline)]
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ zIndex: 'var(--z-index-modal)' }}
      >
        <nav aria-label="Site" className="px-6 py-6">
          {/* Mobile-only controls: music player + theme toggle */}
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[var(--border-hairline)]">
            <Button
              onClick={isMusicPlayerOpen ? closeMusicPlayer : openMusicPlayer}
              variant="outline"
              size="sm"
              className={isMusicPlayerOpen ? "bg-secondary-200 dark:bg-secondary-700" : ""}
              aria-label={isMusicPlayerOpen ? "Close music player" : "Open music player"}
            >
              <span className="font-mono" aria-hidden="true">♫</span>
            </Button>
            <ThemeToggle />
          </div>

          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavRow
                key={item.to}
                to={item.to}
                active={location.pathname === item.to}
                onNavigate={closeMobileMenu}
              >
                {item.label}
              </NavRow>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}
