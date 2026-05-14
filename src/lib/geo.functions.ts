import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

const ES_COUNTRIES = new Set([
  "ES", "MX", "AR", "CL", "CO", "PE", "VE", "UY", "PY", "BO",
  "EC", "CR", "PA", "DO", "GT", "HN", "NI", "SV", "CU", "PR",
]);
const PT_COUNTRIES = new Set(["BR", "PT", "AO", "MZ", "CV", "GW", "ST", "TL"]);

function localeFromCountry(country: string | null | undefined): "pt" | "en" | "es" {
  if (!country) return "pt";
  const c = country.toUpperCase();
  if (PT_COUNTRIES.has(c)) return "pt";
  if (ES_COUNTRIES.has(c)) return "es";
  return "en";
}

function localeFromAcceptLanguage(header: string | null | undefined): "pt" | "en" | "es" | null {
  if (!header) return null;
  const first = header.split(",")[0]?.trim().toLowerCase() ?? "";
  if (first.startsWith("pt")) return "pt";
  if (first.startsWith("es")) return "es";
  if (first.startsWith("en")) return "en";
  return null;
}

export const getSuggestedLocale = createServerFn({ method: "GET" }).handler(async () => {
  const country =
    getRequestHeader("cf-ipcountry") ??
    getRequestHeader("x-vercel-ip-country") ??
    getRequestHeader("x-country-code") ??
    null;
  if (country && country !== "XX" && country !== "T1") {
    return { locale: localeFromCountry(country), source: "ip" as const, country };
  }
  const fromAccept = localeFromAcceptLanguage(getRequestHeader("accept-language") ?? null);
  if (fromAccept) return { locale: fromAccept, source: "accept-language" as const, country: null };
  return { locale: "pt" as const, source: "default" as const, country: null };
});
