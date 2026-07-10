"use client";

import { useEffect, useRef } from "react";

export type MenuItem = {
  label: string;
  danger?: boolean;
  onClick: () => void;
};

/**
 * 轻量右键菜单：由父组件管理 open/position/items。
 * 用法：onContextMenu 里 e.preventDefault() 后设置 {x, y, items}。
 */
export function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("mousedown", handle);
    window.addEventListener("keydown", esc);
    window.addEventListener("scroll", onClose, true);
    return () => {
      window.removeEventListener("mousedown", handle);
      window.removeEventListener("keydown", esc);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);

  // 防止菜单超出视口
  const style: React.CSSProperties = {
    left: Math.min(x, typeof window !== "undefined" ? window.innerWidth - 180 : x),
    top: Math.min(y, typeof window !== "undefined" ? window.innerHeight - items.length * 36 - 16 : y),
  };

  return (
    <div
      ref={ref}
      style={style}
      className="fixed z-50 min-w-40 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg"
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => {
            onClose();
            item.onClick();
          }}
          className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-secondary ${
            item.danger ? "text-red-600 hover:bg-red-50" : "text-foreground"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
