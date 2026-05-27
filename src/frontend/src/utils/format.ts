// src/utils/format.ts

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (isToday) return time;

  const day = date.toLocaleDateString([], { weekday: "short" });
  return `${day} ${time}`;
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "…";
}

export function formatTraitValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";

  switch (key) {
    case "weight_kg":
      return `${value} kg`;
    case "height_cm":
      return `${value} cm`;
    case "age":
      return `${value} years`;
    case "goals":
    case "domains_of_concern":
      if (Array.isArray(value)) return value.join(", ") || "—";
      return String(value);
    case "lifestyle":
      return String(value);
    default:
      if (Array.isArray(value)) return value.join(", ") || "—";
      return String(value);
  }
}
