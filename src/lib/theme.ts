import { workspaceColors } from "./workspace";
export function mix(a: string, b: string, ratio: number) {
  const p = (x: string, i: number) => parseInt(x.slice(i, i + 2), 16);
  return (
    "#" +
    [1, 3, 5]
      .map((i) =>
        Math.round(p(a, i) * ratio + p(b, i) * (1 - ratio))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
export function makeTheme(color: string, dark: boolean) {
  const base =
    workspaceColors.find((c) => c.id === color)?.color ??
    workspaceColors[0].color;
  return {
    dark,
    base,
    accent: dark ? mix(base, "#ffffff", 0.5) : base,
    bg: dark ? mix(base, "#14161b", 0.1) : mix(base, "#f8f9fb", 0.03),
    card: dark ? mix(base, "#1e2128", 0.09) : "#ffffff",
    input: dark ? mix(base, "#171a20", 0.05) : "#fcfcfd",
    soft: dark ? mix(base, "#22252c", 0.18) : mix(base, "#ffffff", 0.08),
    border: dark ? mix(base, "#353941", 0.25) : mix(base, "#e4e6ea", 0.15),
    text: dark ? "#edf0f6" : "#262b36",
    muted: dark ? "#adb4c4" : "#687080",
    danger: dark ? "#f4a3ae" : "#b34451",
    onAccent: dark ? "#151820" : "#ffffff",
  };
}
export type Theme = ReturnType<typeof makeTheme>;
