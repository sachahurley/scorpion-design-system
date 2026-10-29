/**
 * One-time development warnings for deprecated props and values (decision 0024).
 *
 * A renamed prop keeps working as a deprecated alias: it carries `@deprecated` in
 * its JSDoc, so editors strike it through, and using it calls `warnDeprecated` once
 * per component and name, so a caller learns the replacement without a break.
 */
const warned = new Set<string>();

/** Warns once per component and name that a deprecated prop or value was used. Silent in production. */
export function warnDeprecated(component: string, used: string, replacement: string): void {
  // Written as `=== "production"` so consumer vendor scripts can rewrite it.
  if (import.meta.env.PROD) return;
  const key = `${component}:${used}`;
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[@scorp-ds/components] ${component}: ${used} is deprecated. Use ${replacement}.`);
}
