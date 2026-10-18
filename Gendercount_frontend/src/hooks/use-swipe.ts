import { useRef, type TouchEvent } from "react";

const MIN_DISTANCE = 50; // px a finger must travel horizontally to count as a swipe

/** Touch handlers that report a horizontal swipe: 1 = swiped left (next), -1 = swiped right (previous). */
export const useSwipe = (onSwipe: (step: 1 | -1) => void) => {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onTouchStart: (event: TouchEvent) => {
      const touch = event.touches[0];
      start.current = { x: touch.clientX, y: touch.clientY };
    },
    onTouchEnd: (event: TouchEvent) => {
      if (!start.current) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.current.x;
      const dy = touch.clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) >= MIN_DISTANCE && Math.abs(dx) > Math.abs(dy) * 1.5) onSwipe(dx < 0 ? 1 : -1);
    },
  };
};
