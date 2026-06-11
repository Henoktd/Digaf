export function formatDate(
  value: string | Date | null | undefined,
  opts?: { style?: "date" | "datetime" | "relative" }
): string {
  if (value === null || value === undefined || value === "") return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "—";

  const style = opts?.style ?? "datetime";

  if (style === "date") {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
  }

  if (style === "relative") {
    const diffMs = d.getTime() - Date.now();
    const diffDays = Math.round(diffMs / 86_400_000);
    if (Math.abs(diffDays) <= 7) {
      return new Intl.RelativeTimeFormat("en-US", { numeric: "auto" }).format(
        diffDays,
        "day"
      );
    }
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}
