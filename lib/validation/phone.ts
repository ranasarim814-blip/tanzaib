/**
 * Pakistani mobile numbers.
 * Accepts 03XXXXXXXXX, +923XXXXXXXXX, 923XXXXXXXXX, 0092 3XXXXXXXXX (spaces/dashes allowed).
 * Returns the normalised +923XXXXXXXXX form, or null if invalid.
 */
export function normalizePkPhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const cleaned = input.trim().replace(/[\s\-().]/g, "");
  let rest: string | null = null;
  if (/^\+923\d{9}$/.test(cleaned)) rest = cleaned.slice(3);
  else if (/^00923\d{9}$/.test(cleaned)) rest = cleaned.slice(4);
  else if (/^923\d{9}$/.test(cleaned)) rest = cleaned.slice(2);
  else if (/^03\d{9}$/.test(cleaned)) rest = cleaned.slice(1);
  if (!rest) return null;
  return `+92${rest}`;
}

export function isPkPhone(input: string): boolean {
  return normalizePkPhone(input) !== null;
}

/** +923001234567 -> 0300 1234567 */
export function displayPkPhone(normalised: string): string {
  const m = /^\+92(3\d{2})(\d{7})$/.exec(normalised);
  return m ? `0${m[1]} ${m[2]}` : normalised;
}
