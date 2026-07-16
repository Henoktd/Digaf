"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type TreemapRow = {
  shareholder_id: string;
  shareholder_name: string;
  shareholder_type: string;
  share_class: string;
  quantity: number;
  pledged_quantity: number;
  ownership_percentage: number;
};

type Tile = {
  id: string;
  name: string;
  type: string;
  shareClass: string;
  value: number;
  pct: number;
  pledged: number;
  isOthers?: boolean;
  othersCount?: number;
  // layout, in percentages of the container
  x: number;
  y: number;
  w: number;
  h: number;
};

// Share-class color assignment — Digaf palette pairs (bg, text on tile)
const CLASS_COLORS = [
  { bg: "#0D6B4F", light: "#17A673" },
  { bg: "#3B5488", light: "#52689B" },
  { bg: "#8A5B2B", light: "#A97310" },
  { bg: "#6B4487", light: "#8A5BA8" },
  { bg: "#22697A", light: "#2E8BA1" },
  { bg: "#8A3E3E", light: "#A85252" },
];

const OTHERS_COLOR = { bg: "#4A544E", light: "#6B7671" };

// ── Squarified treemap layout (Bruls et al.) ────────────────────────────────
// Computed in abstract units matching the container aspect so tiles stay
// close to square, then converted to percentages.

type LayoutItem = { area: number; ref: number };

function layoutSquarify(
  values: number[],
  width: number,
  height: number
): { x: number; y: number; w: number; h: number }[] {
  const total = values.reduce((a, b) => a + b, 0);
  const scale = (width * height) / total;
  const items: LayoutItem[] = values.map((v, i) => ({ area: v * scale, ref: i }));
  const out: { x: number; y: number; w: number; h: number }[] = new Array(values.length);

  let x = 0;
  let y = 0;
  let w = width;
  let h = height;
  let row: LayoutItem[] = [];
  let i = 0;

  const worst = (r: LayoutItem[], side: number) => {
    const sum = r.reduce((a, b) => a + b.area, 0);
    let max = 0;
    for (const it of r) {
      const ratio = Math.max(
        (side * side * it.area) / (sum * sum),
        (sum * sum) / (side * side * it.area)
      );
      if (ratio > max) max = ratio;
    }
    return max;
  };

  const placeRow = (r: LayoutItem[]) => {
    const sum = r.reduce((a, b) => a + b.area, 0);
    const horizontal = w >= h;
    const side = horizontal ? h : w;
    const thickness = sum / side;
    let offset = 0;
    for (const it of r) {
      const length = it.area / thickness;
      out[it.ref] = horizontal
        ? { x, y: y + offset, w: thickness, h: length }
        : { x: x + offset, y, w: length, h: thickness };
      offset += length;
    }
    if (horizontal) {
      x += thickness;
      w -= thickness;
    } else {
      y += thickness;
      h -= thickness;
    }
  };

  while (i < items.length) {
    const side = Math.min(w, h);
    const item = items[i];
    if (row.length === 0 || worst([...row, item], side) <= worst(row, side)) {
      row.push(item);
      i++;
    } else {
      placeRow(row);
      row = [];
    }
  }
  if (row.length > 0) placeRow(row);
  return out;
}

// ── Component ────────────────────────────────────────────────────────────────

const ASPECT = 2.2; // container width : height
const MAX_TILES = 18;

export function CapTableTreemap({ rows }: { rows: TreemapRow[] }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState<Tile | null>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const { tiles, classColorMap } = useMemo(() => {
    // Aggregate per shareholder (a holder can appear once per share class)
    const byHolder = new Map<
      string,
      { name: string; type: string; classes: Map<string, number>; value: number; pct: number; pledged: number }
    >();
    for (const r of rows) {
      const cur = byHolder.get(r.shareholder_id) ?? {
        name: r.shareholder_name,
        type: r.shareholder_type,
        classes: new Map<string, number>(),
        value: 0,
        pct: 0,
        pledged: 0,
      };
      cur.value += r.quantity;
      cur.pct += r.ownership_percentage;
      cur.pledged += r.pledged_quantity;
      cur.classes.set(r.share_class, (cur.classes.get(r.share_class) ?? 0) + r.quantity);
      byHolder.set(r.shareholder_id, cur);
    }

    const holders = [...byHolder.entries()]
      .map(([id, v]) => ({
        id,
        ...v,
        shareClass:
          [...v.classes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—",
      }))
      .sort((a, b) => b.value - a.value);

    // Stable class → color mapping
    const classNames = [...new Set(holders.map((h) => h.shareClass))];
    const classColorMap = new Map(
      classNames.map((c, i) => [c, CLASS_COLORS[i % CLASS_COLORS.length]])
    );

    // Group the tail into "Others"
    const head = holders.slice(0, MAX_TILES);
    const tail = holders.slice(MAX_TILES);
    const entries: Omit<Tile, "x" | "y" | "w" | "h">[] = head.map((h) => ({
      id: h.id,
      name: h.name,
      type: h.type,
      shareClass: h.shareClass,
      value: h.value,
      pct: h.pct,
      pledged: h.pledged,
    }));
    if (tail.length > 0) {
      entries.push({
        id: "__others__",
        name: `${tail.length} other shareholders`,
        type: "group",
        shareClass: "",
        value: tail.reduce((a, b) => a + b.value, 0),
        pct: tail.reduce((a, b) => a + b.pct, 0),
        pledged: 0,
        isOthers: true,
        othersCount: tail.length,
      });
    }

    if (entries.length === 0) return { tiles: [] as Tile[], classColorMap };

    const layout = layoutSquarify(
      entries.map((e) => e.value),
      100 * ASPECT,
      100
    );

    const tiles: Tile[] = entries.map((e, i) => ({
      ...e,
      x: (layout[i].x / (100 * ASPECT)) * 100,
      y: layout[i].y,
      w: (layout[i].w / (100 * ASPECT)) * 100,
      h: layout[i].h,
    }));

    return { tiles, classColorMap };
  }, [rows]);

  if (tiles.length === 0) return null;

  const classLegend = [...classColorMap.entries()];

  return (
    <div>
      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {classLegend.map(([name, color]) => (
          <span key={name} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color.bg }} />
            {name}
          </span>
        ))}
        {tiles.some((t) => t.isOthers) && (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: OTHERS_COLOR.bg }} />
            Others
          </span>
        )}
        <span className="ml-auto hidden text-xs text-slate-400 sm:block">
          Tile size = shares held · click a tile to open the shareholder
        </span>
      </div>

      {/* Treemap canvas */}
      <div
        className="relative w-full overflow-hidden rounded-xl bg-slate-100"
        style={{ aspectRatio: `${ASPECT} / 1` }}
        onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setHovered(null)}
      >
        {tiles.map((t, i) => {
          const color = t.isOthers
            ? OTHERS_COLOR
            : classColorMap.get(t.shareClass) ?? OTHERS_COLOR;
          const isHovered = hovered?.id === t.id;
          const showLabel = t.w > 9 && t.h > 12;
          return (
            <button
              key={t.id}
              type="button"
              aria-label={`${t.name}: ${t.pct.toFixed(2)}% ownership`}
              onMouseEnter={() => setHovered(t)}
              onFocus={() => setHovered(t)}
              onBlur={() => setHovered(null)}
              onClick={() => {
                if (!t.isOthers) router.push(`/shareholders/${t.id}`);
              }}
              className="absolute overflow-hidden text-left transition-all duration-500 ease-out focus-visible:outline-none"
              style={{
                left: `${t.x}%`,
                top: `${t.y}%`,
                width: `${t.w}%`,
                height: `${t.h}%`,
                padding: "2px",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "scale(1)" : "scale(0.85)",
                transitionDelay: `${Math.min(i * 35, 600)}ms`,
                cursor: t.isOthers ? "default" : "pointer",
              }}
            >
              <span
                className="flex h-full w-full flex-col justify-between rounded-md p-2 transition-[filter,box-shadow] duration-150"
                style={{
                  background: `linear-gradient(145deg, ${color.light}, ${color.bg})`,
                  filter: isHovered ? "brightness(1.12)" : undefined,
                  boxShadow: isHovered
                    ? "inset 0 0 0 2px rgba(255,255,255,0.85)"
                    : "inset 0 0 0 1px rgba(255,255,255,0.15)",
                }}
              >
                {showLabel ? (
                  <>
                    <span className="block truncate text-[12px] font-semibold leading-tight text-white/95">
                      {t.name}
                    </span>
                    <span className="block text-[11px] font-medium text-white/75 tabular-nums">
                      {t.pct.toFixed(1)}%
                    </span>
                  </>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cursor tooltip */}
      {hovered && (
        <div
          className="pointer-events-none fixed z-50 w-56 rounded-lg border border-slate-200 bg-white p-3 shadow-xl"
          style={{
            left: Math.min(cursor.x + 14, typeof window !== "undefined" ? window.innerWidth - 240 : cursor.x),
            top: cursor.y + 14,
          }}
        >
          <p className="truncate text-[13px] font-semibold text-slate-900">{hovered.name}</p>
          <div className="mt-1.5 space-y-1 text-[12px]">
            <p className="flex justify-between">
              <span className="text-slate-500">Ownership</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {hovered.pct.toFixed(2)}%
              </span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-500">Shares</span>
              <span className="font-medium text-slate-900 tabular-nums">
                {new Intl.NumberFormat("en-US").format(hovered.value)}
              </span>
            </p>
            {hovered.isOthers ? (
              <p className="flex justify-between">
                <span className="text-slate-500">Shareholders</span>
                <span className="font-medium text-slate-900">{hovered.othersCount}</span>
              </p>
            ) : (
              <>
                <p className="flex justify-between">
                  <span className="text-slate-500">Class</span>
                  <span className="font-medium text-slate-900">{hovered.shareClass}</span>
                </p>
                {hovered.pledged > 0 && (
                  <p className="flex justify-between">
                    <span className="text-slate-500">Pledged</span>
                    <span className="font-medium text-amber-700 tabular-nums">
                      {new Intl.NumberFormat("en-US").format(hovered.pledged)}
                    </span>
                  </p>
                )}
              </>
            )}
          </div>
          {!hovered.isOthers && (
            <p className="mt-2 border-t border-slate-100 pt-1.5 text-[11px] text-slate-400">
              Click to open profile
            </p>
          )}
        </div>
      )}
    </div>
  );
}
