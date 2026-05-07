"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    UnicornStudio: {
      isInitialized: boolean;
      init: () => void;
    };
  }
}

export default function Background() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!window.UnicornStudio) {
      window.UnicornStudio = { isInitialized: false, init: () => {} };
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js";
      script.onload = function () {
        if (!window.UnicornStudio.isInitialized) {
          window.UnicornStudio.init();
          window.UnicornStudio.isInitialized = true;
        }
      };
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className="aura-background-component fixed top-0 w-full h-screen -z-10 hue-rotate-15 brightness-50 blur-lg">
      <div
        ref={containerRef}
        data-us-project="K7xzrAoejHe2lHXqTJzm"
        className="absolute top-0 left-0 -z-10 w-full h-full"
      ></div>
    </div>
  );
}
