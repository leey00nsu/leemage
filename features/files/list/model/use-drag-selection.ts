"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export function useDragSelection({
  surfaceRef,
  containerRef,
  selected,
  disabled,
  onSelect,
}: {
  surfaceRef: RefObject<HTMLDivElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  selected: Set<string>;
  disabled: boolean;
  onSelect: (ids: Set<string>) => void;
}) {
  const [rectangle, setRectangle] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const gesture = useRef<{
    x: number;
    y: number;
    ids: Set<string>;
    active: boolean;
  } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    // Include the scroll panel's padding, not just the cards' bounding box.
    const surface = surfaceRef.current?.parentElement;
    if (!surface) return;
    const down = (e: PointerEvent) => {
      suppressClick.current = false;
      const target = e.target as HTMLElement;
      if (
        disabled ||
        e.button !== 0 ||
        e.pointerType === "touch" ||
        target.closest(
          '[data-selection-ignore],button,input,select,textarea,[role="dialog"],[role="alertdialog"],[contenteditable="true"]',
        ) ||
        (target.closest("a") && !target.closest("[data-file-id]"))
      )
        return;
      gesture.current = {
        x: e.clientX,
        y: e.clientY,
        ids:
          e.shiftKey || e.ctrlKey || e.metaKey ? new Set(selected) : new Set(),
        active: false,
      };
    };
    const move = (e: PointerEvent) => {
      const g = gesture.current;
      if (!g) return;
      if (!g.active && Math.hypot(e.clientX - g.x, e.clientY - g.y) < 6) return;
      e.preventDefault();
      g.active = true;
      suppressClick.current = true;
      window.getSelection()?.removeAllRanges();
      // Keep both the marquee and hit testing inside the visible file panel.
      const bounds = surface.getBoundingClientRect();
      const left = bounds.left + surface.clientLeft;
      const top = bounds.top + surface.clientTop;
      const clampX = (x: number) => Math.max(left, Math.min(left + surface.clientWidth, x));
      const clampY = (y: number) => Math.max(top, Math.min(top + surface.clientHeight, y));
      const startX = clampX(g.x);
      const startY = clampY(g.y);
      const endX = clampX(e.clientX);
      const endY = clampY(e.clientY);
      const rect = {
        left: Math.min(startX, endX),
        top: Math.min(startY, endY),
        width: Math.abs(endX - startX),
        height: Math.abs(endY - startY),
      };
      setRectangle(rect);
      const ids = new Set(g.ids);
      containerRef.current
        ?.querySelectorAll<HTMLElement>("[data-file-id]")
        .forEach((card) => {
          const r = card.getBoundingClientRect();
          if (
            r.left < rect.left + rect.width &&
            r.right > rect.left &&
            r.top < rect.top + rect.height &&
            r.bottom > rect.top
          )
            ids.add(card.dataset.fileId!);
        });
      onSelect(ids);
    };
    const up = () => {
      gesture.current = null;
      setRectangle(null);
    };
    const click = (e: MouseEvent) => {
      if (suppressClick.current) {
        e.preventDefault();
        e.stopPropagation();
        suppressClick.current = false;
      }
    };
    surface.addEventListener("pointerdown", down);
    surface.addEventListener("click", click, true);
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("blur", up);
    return () => {
      surface.removeEventListener("pointerdown", down);
      surface.removeEventListener("click", click, true);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("blur", up);
    };
  }, [surfaceRef, containerRef, selected, disabled, onSelect]);
  return rectangle;
}
