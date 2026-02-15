"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    const saved = localStorage.getItem("fart_picker_theme");
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("fart_picker_theme", theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
  }

  return (
    <button type="button" onClick={toggleTheme} className="label-pill cursor-pointer">
      {theme === "light" ? "Dark" : "Light"}
    </button>
  );
}
