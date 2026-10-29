/**
 * LIGHT MODE NOTICE
 *
 * Watches the theme and pops a small dialog the moment the user switches
 * INTO light mode: the light theme is still under construction, and the
 * dialog says so instead of letting rough edges read as bugs.
 *
 * Only fires on an actual dark -> light switch in this session, never on
 * initial load (a visitor whose saved preference is light should not be
 * greeted with a modal), and only once per session so toggling back and
 * forth doesn't nag.
 */

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function LightModeNotice() {
  const { resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  // Previous theme; null until the first client-side resolution lands
  const previousTheme = useRef<string | null>(null);
  const hasShownThisSession = useRef(false);

  useEffect(() => {
    if (!resolvedTheme) return;
    if (
      previousTheme.current === "dark" &&
      resolvedTheme === "light" &&
      !hasShownThisSession.current
    ) {
      hasShownThisSession.current = true;
      setIsOpen(true);
    }
    previousTheme.current = resolvedTheme;
  }, [resolvedTheme]);

  return (
    <Modal
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Under construction"
      size="sm"
      footerContent={
        <Button variant="primary" size="md" onClick={() => setIsOpen(false)}>
          Got it
        </Button>
      }
    >
      <p className="text-sm font-mono text-secondary-800 dark:text-secondary-500">
        Light mode is still under construction. Some surfaces and contrast
        pairs are rough while the light theme catches up to dark, which is
        the system's default.
      </p>
    </Modal>
  );
}
