"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function VisitTracker() {
  const pathname = usePathname();
  const last = useRef("");
  useEffect(() => {
    if (last.current === pathname || navigator.doNotTrack === "1") return;
    last.current = pathname;
    let first = true;
    let attribution = { referrer: document.referrer, source: "", campaign: "" };
    const query = new URLSearchParams(location.search);
    attribution.source = query.get("utm_source") || "";
    attribution.campaign = query.get("utm_campaign") || "";
    try {
      const saved = JSON.parse(sessionStorage.getItem("tp:visit:v1") || "null");
      if (saved && Date.now() - saved.at < 30 * 60 * 1000) {
        first = false;
        attribution = saved.attribution;
      }
      sessionStorage.setItem("tp:visit:v1", JSON.stringify({ at: Date.now(), attribution }));
    } catch { /* Storage blocked: each page load is an estimated visit. */ }
    void fetch("/api/visits/", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, first, ...attribution }), keepalive: true,
    }).catch(() => {});
  }, [pathname]);
  return null;
}
