import { CheckCircle2, Loader2, Users } from "lucide-react";
import { GENDER_STYLES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { DetectedFace, Gender, GenderCounts, VideoDetection } from "@/services/api";

export type DetectionView =
  | { kind: "image"; faces: DetectedFace[] }
  | { kind: "video"; result: VideoDetection }
  | { kind: "camera" };

interface ResultsPanelProps {
  counts: GenderCounts;
  view: DetectionView | null;
  isProcessing: boolean;
}

const GENDERS = Object.keys(GENDER_STYLES) as Gender[];
const RING_THICKNESS = 12; // px

const tint = (color: string, percent: number) => `color-mix(in srgb, ${color} ${percent}%, transparent)`;

const summary = (view: DetectionView | null, isProcessing: boolean, counts: GenderCounts) => {
  if (isProcessing) return "Detecting faces and classifying gender...";
  if (!view) return "Analyse a photo or video, or start the camera, to see the gender split here.";
  if (view.kind === "camera") return "Updating live from your camera.";
  if (view.kind === "video") {
    const { duration_seconds, frames_analyzed } = view.result;
    const people = `${counts.total} unique ${counts.total === 1 ? "person" : "people"}`;
    const replay = counts.total ? " Play the video to see each person." : "";
    return `${people} in ${duration_seconds.toFixed(1)} s of video · ${frames_analyzed} frames analysed.${replay}`;
  }
  const faces = view.faces.length;
  return faces ? `${faces} ${faces === 1 ? "face" : "faces"} detected in the photo.` : "No faces found in this photo.";
};

const Status = ({ view, isProcessing }: { view: DetectionView | null; isProcessing: boolean }) => {
  const chip = "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium";
  if (isProcessing) {
    return (
      <span className={cn(chip, "bg-accent/10 text-accent")}>
        <Loader2 className="h-3 w-3 animate-spin" /> Analyzing
      </span>
    );
  }
  if (view?.kind === "camera") {
    return (
      <span className={cn(chip, "bg-red-600/10 text-red-600 dark:text-red-400")}>
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" /> Live
      </span>
    );
  }
  if (view) {
    return (
      <span className={cn(chip, "bg-accent/10 text-accent")}>
        <CheckCircle2 className="h-3 w-3" /> Done
      </span>
    );
  }
  return <span className={cn(chip, "bg-muted text-muted-foreground")}>Waiting</span>;
};

/** Ring split by gender with the total in the middle. */
const GenderRing = ({ counts, share }: { counts: GenderCounts; share: (gender: Gender) => number }) => {
  const maleShare = share("male");
  const fill = counts.total
    ? `conic-gradient(${GENDER_STYLES.male.color} 0 ${maleShare}%, ${GENDER_STYLES.female.color} ${maleShare}% 100%)`
    : "hsl(var(--muted))";
  const ring = `radial-gradient(farthest-side, transparent calc(100% - ${RING_THICKNESS}px), #000 calc(100% - ${RING_THICKNESS - 1}px))`;

  return (
    <div className="relative h-32 w-32 shrink-0" role="img" aria-label={`${maleShare}% male, ${share("female")}% female`}>
      <div className="absolute inset-0 rounded-full" style={{ background: fill, WebkitMaskImage: ring, maskImage: ring }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums leading-none">{counts.total}</span>
        <span className="mt-1 text-xs text-muted-foreground">{counts.total === 1 ? "person" : "people"}</span>
      </div>
    </div>
  );
};

const ResultsPanel = ({ counts, view, isProcessing }: ResultsPanelProps) => {
  const share = (gender: Gender) => (counts.total ? Math.round((counts[gender] / counts.total) * 100) : 0);

  return (
    <aside aria-live="polite" className="card p-5 lg:sticky lg:top-24">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Results</h2>
        <Status view={view} isProcessing={isProcessing} />
      </div>

      <div className="mt-5 flex items-center gap-5 sm:gap-6 lg:flex-col lg:items-stretch">
        <div className="flex justify-center">
          <GenderRing counts={counts} share={share} />
        </div>

        <dl className="grid flex-1 gap-2.5">
          {GENDERS.map((gender) => {
            const { label, color } = GENDER_STYLES[gender];
            return (
              <div key={gender} className="rounded-2xl p-3" style={{ backgroundColor: tint(color, 12) }}>
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-sm font-medium">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                    {label}
                  </dt>
                  <dd className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold tabular-nums">{counts[gender]}</span>
                    {counts.total > 0 && <span className="text-xs text-muted-foreground">{share(gender)}%</span>}
                  </dd>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: tint(color, 20) }}>
                  <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${share(gender)}%`, backgroundColor: color }} />
                </div>
              </div>
            );
          })}
          {/* Shown once there is a result (analysed photo/video or live camera) */}
          {view && (
            <div className="animate-slide-from-right rounded-2xl bg-accent/10 p-3">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4 text-accent" />
                  Total
                </dt>
                <dd className="text-xl font-bold tabular-nums">{counts.total}</dd>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{view.kind === "video" ? "unique people in the video" : "people detected"}</p>
            </div>
          )}
        </dl>
      </div>

      <p className="mt-5 text-sm text-muted-foreground">{summary(view, isProcessing, counts)}</p>
    </aside>
  );
};

export default ResultsPanel;
