"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function CategorySelect({ categories, value }: { categories: string[]; value?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return <label style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0, maxWidth: "100%" }}>
    <span className="tp-hint">Categoría</span>
    <select className="tp-select" value={value ?? ""} style={{ minWidth: 0, maxWidth: "100%" }} onChange={event => {
      const next = new URLSearchParams(params.toString());
      if (event.target.value) next.set("categoria", event.target.value);
      else next.delete("categoria");
      router.push(`${pathname}${next.size ? "?" + next.toString() : ""}`);
    }}>
      <option value="">Todas las categorías</option>
      {value && !categories.includes(value) && <option value={value}>{value}</option>}
      {categories.map(category => <option key={category} value={category}>{category}</option>)}
    </select>
  </label>;
}
