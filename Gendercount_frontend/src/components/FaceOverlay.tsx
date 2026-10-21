import { useEffect, useRef, useState } from "react";
import { GENDER_STYLES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { DetectedFace, TrackedFace } from "@/services/api";

const FULL_LABEL_MIN_WIDTH = 64; // px; narrower boxes get a short label so labels don't overlap

const percent = (fraction: number) => `${fraction * 100}%`;

/**
 * Draws labelled face boxes (with the person number for video faces);
 * must be placed inside the MediaFrame that holds the analysed media.
 */
const FaceOverlay = ({ faces }: { faces: (DetectedFace | TrackedFace)[] }) => {
  const layerRef = useRef<HTMLDivElement>(null);
  const [layerWidth, setLayerWidth] = useState(0);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const observer = new ResizeObserver(([entry]) => setLayerWidth(entry.contentRect.width));
    observer.observe(layer);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={layerRef} className="pointer-events-none absolute inset-0">
      {faces.map((face, index) => {
        const { box, gender, confidence } = face;
        const { label, color } = GENDER_STYLES[gender];
        const person = "person" in face ? `#${face.person}` : null;
        const showFullLabel = box.width * layerWidth >= FULL_LABEL_MIN_WIDTH;
        return (
          <div
            key={person ?? index}
            className="absolute rounded-sm border-2"
            style={{ left: percent(box.x), top: percent(box.y), width: percent(box.width), height: percent(box.height), borderColor: color }}
          >
            <span
              className={cn(
                "absolute -left-0.5 whitespace-nowrap rounded px-1 py-0.5 text-[10px] font-semibold leading-none text-white",
                box.y > 0.06 ? "bottom-full mb-0.5" : "top-full mt-0.5",
              )}
              style={{ backgroundColor: color }}
            >
              {showFullLabel
                ? [person, label, `${Math.round(confidence * 100)}%`].filter(Boolean).join(" ")
                : (person ?? label[0])}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default FaceOverlay;
