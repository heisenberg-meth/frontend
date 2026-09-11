export const DOSAGE_FORMS = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Cream",
  "Ointment",
  "Drops",
  "Inhaler",
  "Powder",
  "Sachet",
  "Suspension",
  "Solution",
  "Gel",
  "Spray",
  "Suppository",
  "Other",
];

/**
 * Formats a dosage form / medicine type to a clean Title Case string,
 * matching known dosage forms where possible.
 * Returns null if the form is missing or blank.
 *
 * @param {string} [form] - e.g. "TABLET", "capsule", "Syrup", null
 * @returns {string|null} - e.g. "Tablet", "Capsule", or null
 */
export function formatDosageForm(form) {
  if (!form || typeof form !== "string") return null;
  const clean = form.trim();
  if (!clean) return null;

  // Case-insensitive match against known standard forms
  const match = DOSAGE_FORMS.find(
    (df) => df.toLowerCase() === clean.toLowerCase(),
  );
  if (match) return match;

  // Title-case fallback for custom strings (e.g. "SOFTGEL" -> "Softgel")
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}
