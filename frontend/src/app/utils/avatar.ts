export const DEFAULT_AVATAR = "/default-avatar.svg";

export function getUserAvatar(
  profileImage: string | null | undefined,
  _userId?: number | string | null,
  _fallbackSeed?: string | null,
) {
  return profileImage || DEFAULT_AVATAR;
}
