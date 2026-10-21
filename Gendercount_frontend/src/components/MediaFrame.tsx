import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Class for the image/video inside a MediaFrame: keeps its aspect ratio within the frame. */
export const MEDIA_CLASS = "block max-h-[60vh] max-w-full sm:max-h-[32rem]";

/** Shape and minimum height of the workspace media area (frame, drop zone and camera placeholder alike). */
export const MEDIA_AREA_CLASS = "min-h-72 rounded-[1.75rem] sm:min-h-[26rem]";

/**
 * Frame that centres a single image or video. The inner wrapper shrinks to the media's displayed size,
 * so absolutely positioned overlays (face boxes) line up with it exactly.
 */
const MediaFrame = ({ children }: { children: ReactNode }) => (
  <div className={cn("flex items-center justify-center overflow-hidden bg-muted/60", MEDIA_AREA_CLASS)}>
    <div className="relative min-w-0 max-w-full">{children}</div>
  </div>
);

/** Covers the media while it is being analysed. */
export const ProcessingOverlay = ({ message }: { message: string }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 text-sm font-medium backdrop-blur-sm">
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-end text-primary-foreground shadow-lg shadow-primary/30">
      <Loader2 className="h-6 w-6 animate-spin" />
    </span>
    {message}
  </div>
);

/** Gradient icon badge used in the empty states of the workspace. */
export const EmptyStateIcon = ({ children }: { children: ReactNode }) => (
  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-end text-primary-foreground shadow-lg shadow-primary/30 transition-transform group-hover:scale-105 [&_svg]:h-8 [&_svg]:w-8">
    {children}
  </span>
);

export default MediaFrame;
