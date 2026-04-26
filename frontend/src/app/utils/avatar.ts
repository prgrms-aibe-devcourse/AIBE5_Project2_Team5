export function getUserAvatar(
  profileImage: string | null | undefined,
  userId?: number | string | null,
  fallbackSeed?: string | null,
) {
  if (profileImage) {
    return profileImage;
  }

  const normalizedUserId =
    typeof userId === "number" || typeof userId === "string"
      ? String(userId).trim()
      : "";
  const normalizedSeed = fallbackSeed?.trim() ?? "";
  const seed = normalizedUserId || normalizedSeed || "default";

  return `https://i.pravatar.cc/150?u=user-${encodeURIComponent(seed)}`;
}
