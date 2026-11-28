/** Colour for the phone's status bar / browser bar: matches the page background of each theme, never the bright brand green. */
const COLORS: Record<string, { light: string; dark: string }> = {
  bloxy: { light: "#eff7ff", dark: "#131f24" },
  gamer: { light: "#090911", dark: "#090911" },   // gamer is always dark
  retro: { light: "#d8d8d8", dark: "#1e1e22" },
};
export function themeColor(theme?: string | null, mode?: string | null) {
  const c = COLORS[theme || "bloxy"] || COLORS.bloxy;
  return mode === "dark" ? c.dark : c.light;
}
/** keep the bar in step when someone switches theme without reloading */
export function applyThemeColor(theme?: string | null, mode?: string | null) {
  if (typeof document === "undefined") return;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", themeColor(theme, mode)));
}
