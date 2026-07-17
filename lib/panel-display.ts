export function getPanelDisplayName(
  fullName: string | null | undefined,
  _email?: string | null,
) {
  const normalizedName = fullName?.trim();

  if (normalizedName && !normalizedName.includes("@")) {
    return normalizedName;
  }

  return "Gülay Deniz";
}

export function getPanelGreeting(
  fullName: string | null | undefined,
  email: string | null | undefined,
) {
  return `Merhaba ${getPanelDisplayName(fullName, email)}, iyi günler dileriz.`;
}
