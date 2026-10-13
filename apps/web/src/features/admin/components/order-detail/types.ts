export type MutationRunner = (
  endpoint: string,
  method: "PATCH" | "POST",
  body: Record<string, unknown>,
) => Promise<boolean>;

export function money(value: number): string {
  return `Tk ${value.toLocaleString("en-BD")}`;
}

export function label(value: string): string {
  return value.replaceAll("_", " ");
}

export function localDate(value: string): string {
  return new Date(value).toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
