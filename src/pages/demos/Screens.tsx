/**
 * SCREENS DEMO PAGE
 *
 * A working mini-app built from the vendored DS components: the
 * SideNavigation pattern as an app shell with three destinations rendered
 * inside the page (component state, not router routes).
 *
 * Destinations:
 * 1. Sign In - Input + Button with live validation (the approach from the
 *    old Cards page: validate on submit, clear a field's error as it's edited)
 * 2. Settings - Switch / Select / Divider rows
 * 3. Profile - Avatar, Badge, Card
 *
 * Everything is self-contained: no new dependencies, no network, no router.
 */

import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Select } from "@/components/ui/Select";
import { Divider } from "@/components/ui/Divider";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { TuiIcon, type TuiIconName } from "@/components/ui/TuiIcon";
import { Panel } from "@/components/docs/Panel";
import { Link } from "@/components/ui/Link";

// The shell's three destinations. Icon names are TuiIcon glyph keys.
type ScreenId = "sign-in" | "settings" | "profile";

const SCREENS: { id: ScreenId; label: string; icon: TuiIconName }[] = [
  { id: "sign-in", label: "Sign In", icon: "Lock" },
  { id: "settings", label: "Settings", icon: "Settings" },
  { id: "profile", label: "Profile", icon: "User" },
];

/**
 * SIGN IN VIEW
 *
 * Interactive sign-in form with the old Cards page's validation approach:
 * validate on submit, surface per-field errors, and clear a field's error
 * as soon as the user edits it again.
 */
function SignInView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [signedIn, setSignedIn] = useState(false);

  // Validation helpers (same rules as the old Cards page)
  const validateEmail = (value: string) => {
    if (!value) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Please enter a valid email";
    return "";
  };

  const validatePassword = (value: string) => {
    if (!value) return "Password is required";
    if (value.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { email?: string; password?: string } = {};

    const emailError = validateEmail(email);
    if (emailError) nextErrors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) nextErrors.password = passwordError;

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      setSignedIn(true);
    }
  };

  const handleSignOut = () => {
    setSignedIn(false);
    setEmail("");
    setPassword("");
    setErrors({});
  };

  // Signed-in state: confirmation card with a way back to the form
  if (signedIn) {
    return (
      <Card
        title="Signed In"
        subtitle="Authentication succeeded (demo only, nothing was sent)"
        footerContent={
          <Button variant="secondary" size="medium" onClick={handleSignOut}>
            Sign Out
          </Button>
        }
      >
        <div className="flex items-center gap-3">
          <Badge variant="success">Active session</Badge>
          <span className="text-sm font-mono text-secondary-800 dark:text-secondary-500">
            {email}
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Sign In"
      subtitle="Enter your credentials to access your account"
      footerContent={
        <div className="flex justify-end">
          <Button variant="primary" size="medium" onClick={handleSignIn}>
            Sign In
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSignIn} className="space-y-4">
        {/* Email field */}
        <div>
          <Input
            id="screens-signin-email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            error={!!errors.email}
            size="medium"
          />
          {errors.email && (
            <p className="mt-1 text-xs font-mono text-error-600 dark:text-error-500">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password field with visibility toggle */}
        <div>
          <div className="relative">
            <Input
              id="screens-signin-password"
              type={showPassword ? "text" : "password"}
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              error={!!errors.password}
              size="medium"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 bottom-2.5 text-sepia-600 dark:text-sepia-400 hover:text-sepia-900 dark:hover:text-sepia-50"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <TuiIcon name="EyeOff" size="5" /> : <TuiIcon name="Eye" size="5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs font-mono text-error-600 dark:text-error-500">
              {errors.password}
            </p>
          )}
        </div>

        {/* Hidden submit so Enter submits the form (the visible CTA lives in the footer) */}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Card>
  );
}

/**
 * SETTINGS VIEW
 *
 * Switch / Select / Divider rows. Each row carries its own visible heading,
 * so the Switches take label + hideLabel: the label stays the accessible
 * name without duplicating the text next to the track.
 */
function SettingsView() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [language, setLanguage] = useState("en");

  // One settings row: heading + description on the left, control on the right
  const row = (title: string, description: string, control: React.ReactNode) => (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-mono text-[var(--text-primary)]">{title}</p>
        <p className="text-xs font-mono text-secondary-700 dark:text-secondary-600">
          {description}
        </p>
      </div>
      {control}
    </div>
  );

  return (
    <Card title="Settings" subtitle="Notification and playback preferences">
      {row(
        "Email notifications",
        "Release notes and vendor updates",
        <Switch
          checked={emailNotifications}
          onCheckedChange={setEmailNotifications}
          label="Email notifications"
          hideLabel
        />
      )}
      <Divider spacing="medium" />
      {row(
        "Push notifications",
        "Build results as they land",
        <Switch
          checked={pushNotifications}
          onCheckedChange={setPushNotifications}
          label="Push notifications"
          hideLabel
        />
      )}
      <Divider spacing="medium" />
      {row(
        "Autoplay",
        "Start the music player on open",
        <Switch checked={autoplay} onCheckedChange={setAutoplay} label="Autoplay" hideLabel />
      )}
      <Divider spacing="medium" />
      {row(
        "Language",
        "Interface language",
        <div className="w-40">
          <Select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            size="medium"
            aria-label="Language"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </Select>
        </div>
      )}
    </Card>
  );
}

/**
 * PROFILE VIEW
 *
 * Avatar, Badge, and Card composing a simple identity screen.
 */
function ProfileView() {
  return (
    <Card
      title="Profile"
      subtitle="Public identity on this workspace"
      footerContent={
        <p className="text-xs font-mono text-secondary-700 dark:text-secondary-600">
          Member since 2025 · Scorpion Design System
        </p>
      }
    >
      <div className="flex items-start gap-4">
        <Avatar initials="SH" size="large" status="online" alt="Sacha Hurley" />
        <div>
          <p className="text-base font-mono text-[var(--text-primary)]">Sacha Hurley</p>
          <p className="text-sm font-mono text-secondary-800 dark:text-secondary-500 mb-3">
            Designer & Builder
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="primary">Design systems</Badge>
            <Badge variant="info">TUI</Badge>
            <Badge variant="default" dashed>
              More soon
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Screens() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>("sign-in");

  return (
    <div className="container mx-auto px-5 lg:px-10 pt-5 lg:pt-10 pb-5 lg:pb-20">
      {/* Shared page measure: every page outside Home centers on the same
          max-w-2xl column (the Essay/Case Study editorial width). */}
      <div className="mx-auto max-w-2xl">
      {/* PAGE HEADER SECTION */}
      <div className="flex flex-col gap-2 mb-10">
        <h2 className="text-2xl font-mono text-[var(--text-primary)]">Screens</h2>
        <p className="text-sm font-mono text-secondary-800 dark:text-secondary-500">
          A working mini-app: the SideNavigation pattern as an app shell, with three
          destinations composed entirely from DS components. Everything on this page is
          interactive and self-contained.
        </p>
      </div>

      {/* APP SHELL: side navigation + active view */}
      <Panel>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Side navigation: the plate row recipe from the SideNavigation pattern.
              aria-current marks the active destination; state is the fill + accent,
              never color alone (the row also carries its icon). */}
          <nav aria-label="Demo screens" className="md:w-52 shrink-0">
            <div className="flex flex-row md:flex-col gap-1">
              {SCREENS.map((screen) => {
                const active = activeScreen === screen.id;
                return (
                  <button
                    key={screen.id}
                    onClick={() => setActiveScreen(screen.id)}
                    aria-current={active ? "true" : undefined}
                    className={`
                      flex flex-1 md:flex-none items-center gap-3 px-3 py-2 plate-round font-mono text-sm text-left
                      transition-colors [transition-duration:var(--duration-fast)]
                      focus:outline-none focus-visible:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-primary)]
                      ${
                        active
                          ? "bg-[var(--surface-muted)] text-[var(--accent)]"
                          : "text-secondary-800 dark:text-secondary-500 hover:bg-[var(--surface-muted)] hover:text-[var(--accent)]"
                      }
                    `}
                  >
                    <TuiIcon name={screen.icon} size="5" className="shrink-0" />
                    <span>{screen.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Active view */}
          <div className="flex-1 max-w-xl">
            {activeScreen === "sign-in" && <SignInView />}
            {activeScreen === "settings" && <SettingsView />}
            {activeScreen === "profile" && <ProfileView />}
          </div>
        </div>
      </Panel>

      {/* REFERENCE DOCS: the settings view follows the Settings panel pattern spec */}
      <p className="mt-10 text-sm font-mono text-secondary-800 dark:text-secondary-500">
        The Settings view follows the{" "}
        <Link
          href="https://github.com/sachahurley/scorp-ds/blob/main/docs/specs/patterns-settings-panel.md"
          external
        >
          Settings panel pattern spec
        </Link>
        ; every component composed here has its own spec on the{" "}
        <Link as={RouterLink} asProps={{ to: "/specs" }}>Specs page</Link>.
      </p>
      </div>
    </div>
  );
}
