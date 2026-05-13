// Avatares padrão do site — gerados via DiceBear (sem necessidade de upload)
export const DEFAULT_AVATARS: { id: string; url: string }[] = [
  "terrorist", "ct", "awp", "dust2", "nuke", "inferno",
  "headshot", "rambo", "noob", "pro", "ace", "clutch",
].map((seed) => ({
  id: seed,
  url: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${seed}&backgroundColor=1a1a1a,2d2d2d,4a4a4a&radius=20`,
}));

export function avatarUrlFor(seed: string | null | undefined, fallback?: string) {
  if (fallback) return fallback;
  const s = seed || "player";
  return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(s)}&backgroundColor=1a1a1a&radius=20`;
}
