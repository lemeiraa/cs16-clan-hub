import ctGign from "@/assets/avatars/cs-ct-gign.jpg";
import ctSas from "@/assets/avatars/cs-ct-sas.jpg";
import ctSeal from "@/assets/avatars/cs-ct-seal.jpg";
import tPhoenix from "@/assets/avatars/cs-t-phoenix.jpg";
import tElite from "@/assets/avatars/cs-t-elite.jpg";
import tArctic from "@/assets/avatars/cs-t-arctic.jpg";

export const CS_AVATARS = [
  { src: ctGign, name: "GIGN", side: "CT" as const },
  { src: ctSas, name: "SAS", side: "CT" as const },
  { src: ctSeal, name: "SEAL", side: "CT" as const },
  { src: tPhoenix, name: "Phoenix", side: "T" as const },
  { src: tElite, name: "Elite Crew", side: "T" as const },
  { src: tArctic, name: "Arctic Avengers", side: "T" as const },
];

/** Deterministic avatar selection based on a stable id (e.g. user uuid). */
export function csAvatarFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return CS_AVATARS[hash % CS_AVATARS.length];
}
