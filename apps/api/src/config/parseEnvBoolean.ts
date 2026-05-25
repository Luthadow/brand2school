import { z } from "zod";

/** Parses env booleans reliably (Zod coerce treats the string "false" as true). */
export function envBoolean(defaultValue: boolean) {
  return z.preprocess((val) => {
    if (val === undefined || val === "") return defaultValue;
    if (typeof val === "boolean") return val;
    const s = String(val).trim().toLowerCase();
    if (s === "true" || s === "1" || s === "yes") return true;
    if (s === "false" || s === "0" || s === "no") return false;
    return defaultValue;
  }, z.boolean());
}
