import { useRef, useState } from "react";
import { Lightbulb } from "lucide-react";
import { toast } from "sonner";
import AppToaster from "@/components/AppToaster";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import LiveCamera from "@/components/LiveCamera";
import MediaUpload from "@/components/MediaUpload";
import ModeNav from "@/components/ModeNav";
import ResultsPanel, { type DetectionView } from "@/components/ResultsPanel";
import { useAuth } from "@/hooks/use-auth";
import { useObjectUrl } from "@/hooks/use-object-url";
import { useSwipe } from "@/hooks/use-swipe";
import { useTheme } from "@/hooks/use-theme";
import { MODE_ORDER, MODES, type InputMode } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { detectImage, detectVideo, EMPTY_COUNTS, toCounts, type GenderCounts } from "@/services/api";

const describeCounts = ({ male, female, total }: GenderCounts) =>
  `${total} ${total === 1 ? "person" : "people"}: ${male} male, ${female} female`;

const App = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [mode, setMode] = useState<InputMode>("image");
  const [slideFrom, setSlideFrom] = useState<"left" | "right" | null>(null); // direction of the last mode change
  const [file, setFile] = useState<File | null>(null);
  const previewUrl = useObjectUrl(file);
  const [counts, setCounts] = useState<GenderCounts>(EMPTY_COUNTS);
  const [view, setView] = useState<DetectionView | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

  /** Cancel any running request and clear the previous results. */
  const resetResults = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    setIsProcessing(false);
    setCounts(EMPTY_COUNTS);
    setView(null);
  };

  const changeMode = (nextMode: InputMode) => {
    resetResults();
    setFile(null);
    setSlideFrom(MODE_ORDER.indexOf(nextMode) > MODE_ORDER.indexOf(mode) ? "right" : "left");
    setMode(nextMode);
  };

  const stepMode = (step: 1 | -1) => {
    const nextMode = MODE_ORDER[MODE_ORDER.indexOf(mode) + step];
    if (nextMode) changeMode(nextMode);
  };
  const swipe = useSwipe(stepMode);

  const changeFile = (nextFile: File | null) => {
    resetResults();
    setFile(nextFile);
  };

  const runDetection = async () => {
    if (!file) return;
    resetResults();
    const request = new AbortController();
    requestRef.current = request;
    setIsProcessing(true);

    try {
      const result = mode === "image" ? await detectImage(file, request.signal) : await detectVideo(file, request.signal);
      setCounts(toCounts(result));
      setView("faces" in result ? { kind: "image", faces: result.faces } : { kind: "video", result });
      toast.success("Detection complete", { description: describeCounts(result) });
    } catch (error) {
      if (!request.signal.aborted) {
        toast.error("Detection failed", { description: error instanceof Error ? error.message : String(error) });
      }
    } finally {
      if (requestRef.current === request) {
        requestRef.current = null;
        setIsProcessing(false);
      }
    }
  };

  const handleCameraActiveChange = (active: boolean) => {
    setCounts(EMPTY_COUNTS);
    setView(active ? { kind: "camera" } : null);
  };

  /** Clear the workspace (also stops the camera, see the workspace key) and sign out. */
  const handleSignOut = () => {
    resetResults();
    setFile(null);
    void signOut();
  };

  // Mode arrows and swiping are offered while the workspace is empty (no file chosen, camera off)
  const isIdle = mode === "camera" ? view?.kind !== "camera" : !file;
  const navigation = <ModeNav mode={mode} onStep={stepMode} />;

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col">
      <Header mode={mode} onModeChange={changeMode} theme={theme} onToggleTheme={toggleTheme} onSignOut={handleSignOut} />

      <main className="container max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{MODES[mode].title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{MODES[mode].description}</p>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
          <section aria-label={MODES[mode].title} className={cn("card min-w-0 overflow-hidden p-3 sm:p-4", isIdle && "touch-pan-y")} {...(isIdle ? swipe : {})}>
            {/* Keyed by user too, so signing out unmounts the camera and releases it */}
            <div key={`${mode}-${user?.uid}`} className={cn(slideFrom && (slideFrom === "right" ? "animate-slide-from-right" : "animate-slide-from-left"))}>
              {mode === "camera" ? (
                <LiveCamera navigation={navigation} onCounts={setCounts} onActiveChange={handleCameraActiveChange} />
              ) : (
                <MediaUpload
                  kind={mode}
                  file={file}
                  previewUrl={previewUrl}
                  faces={view?.kind === "image" ? view.faces : null}
                  frames={view?.kind === "video" ? view.result.frames : null}
                  isProcessing={isProcessing}
                  navigation={navigation}
                  onFileChange={changeFile}
                  onDetect={runDetection}
                  onCancel={resetResults}
                />
              )}
              <p className="mt-3 flex items-start gap-2 px-1 text-xs text-muted-foreground">
                <Lightbulb className="mt-px h-3.5 w-3.5 shrink-0 text-accent" />
                {MODES[mode].tip}
              </p>
            </div>
          </section>

          <ResultsPanel counts={counts} view={view} isProcessing={isProcessing} />
        </div>
      </main>

      <Footer />
      <AppToaster theme={theme} />
    </div>
  );
};

export default App;
