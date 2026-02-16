"use client";

import { useRouter } from "next/navigation";
import { LANGUAGE_COOKIE_NAME, type SiteLanguage } from "@/lib/lang";

type LanguageSwitchProps = {
  lang: SiteLanguage;
};

export function LanguageSwitch({ lang }: LanguageSwitchProps) {
  const router = useRouter();

  function setLanguage(nextLanguage: SiteLanguage) {
    if (nextLanguage === lang) {
      return;
    }
    document.cookie = `${LANGUAGE_COOKIE_NAME}=${nextLanguage}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-1"
      aria-label="Language switch"
    >
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`label-pill cursor-pointer ${lang === "en" ? "" : "opacity-70"}`}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage("et")}
        className={`label-pill cursor-pointer ${lang === "et" ? "" : "opacity-70"}`}
        aria-pressed={lang === "et"}
      >
        EE
      </button>
    </div>
  );
}
