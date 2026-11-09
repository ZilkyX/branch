// ALLOWED_EMAILS is a comma-separated list. If it's missing or empty, nobody is allowed in.
export function isAllowedEmail(email: unknown) {
  if (typeof email !== "string") return false;

  const allowed = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes(email.trim().toLowerCase());
}
