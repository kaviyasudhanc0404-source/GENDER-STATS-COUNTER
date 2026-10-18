import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { Download, FileImage, FileVideo, ImageUp, Loader2, RefreshCw, ScanFace, Upload, X } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/Button";
import FaceOverlay from "@/components/FaceOverlay";
import MediaFrame, { EmptyStateIcon, MEDIA_AREA_CLASS, MEDIA_CLASS, ProcessingOverlay } from "@/components/MediaFrame";
import { useAuth } from "@/hooks/use-auth";
import { downloadBlob, renderAnnotatedImage } from "@/lib/annotate";
import { UPLOAD_EXTENSIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { DetectedFace } from "@/services/api";

interface MediaUploadProps {
  kind: "image" | "video";
  file: File | null;
  previewUrl: string | null;
  faces: DetectedFace[] | null; // detection result drawn over the image
  isProcessing: boolean;
  navigation: ReactNode; // mode arrows shown on the empty drop zone
  onFileChange: (file: File | null) => void;
  onDetect: () => void;
  onCancel: () => void;
}

/** Round icon in the corner of the analysed photo's frame; saves it at full resolution with face boxes and counts. */
const DownloadButton = ({ src, fileName, faces }: { src: string; fileName: string; faces: DetectedFace[] }) => {
  const [isSaving, setIsSaving] = useState(false);

  const download = async () => {
    setIsSaving(true);
    try {
      downloadBlob(await renderAnnotatedImage(src, faces), `${fileName.replace(/\.[^.]+$/, "")}-analyzed.jpg`);
    } catch (error) {
      toast.error("Download failed", { description: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={download}
      disabled={isSaving}
      aria-label="Download analysed image"
      title="Download analysed image"
      className="absolute right-3 top-3 h-10 w-10 shadow-lg [&_svg]:size-[18px]"
    >
      {isSaving ? <Loader2 className="animate-spin" /> : <Download />}
    </Button>
  );
};

/** Workspace for image/video: drop zone -> preview -> analysed result, all in the same place. */
const MediaUpload = (props: MediaUploadProps) => {
  const { kind, file, previewUrl, faces, isProcessing, navigation, onFileChange, onDetect, onCancel } = props;
  const { requireAuth } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const extensions = UPLOAD_EXTENSIONS[kind];
  const formats = extensions.map((extension) => extension.slice(1).toUpperCase());
  const FileIcon = kind === "image" ? FileImage : FileVideo;

  const selectFile = (selected?: File) => {
    if (!selected) return;
    if (extensions.some((extension) => selected.name.toLowerCase().endsWith(extension))) {
      onFileChange(selected);
    } else {
      toast.error("Unsupported file", { description: `Please choose a ${formats.join(", ")} file.` });
    }
  };

  const browse = () => requireAuth(() => inputRef.current?.click());

  const handleDrag = (event: DragEvent, dragging: boolean) => {
    event.preventDefault();
    setIsDragging(dragging && !isProcessing);
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={extensions.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          selectFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <div
        onDragOver={(event) => handleDrag(event, true)}
        onDragLeave={(event) => handleDrag(event, false)}
        onDrop={(event) => {
          handleDrag(event, false);
          const dropped = event.dataTransfer.files[0];
          if (!isProcessing) requireAuth(() => selectFile(dropped));
        }}
        className={cn("relative transition-shadow", MEDIA_AREA_CLASS, isDragging && "ring-2 ring-accent ring-offset-2 ring-offset-card")}
      >
        {previewUrl ? (
          <MediaFrame fill={kind === "video"}>
            {kind === "image" ? (
              <img src={previewUrl} alt="Selected image" className={MEDIA_CLASS} />
            ) : (
              <video src={previewUrl} controls playsInline className={cn(MEDIA_CLASS, "w-full")} />
            )}
            {faces && <FaceOverlay faces={faces} />}
            {isProcessing && <ProcessingOverlay message={kind === "image" ? "Analyzing photo..." : "Analyzing video..."} />}
          </MediaFrame>
        ) : (
          <>
            <button
              type="button"
              onClick={browse}
              className={cn(
                "group flex w-full flex-col items-center justify-center gap-5 border-2 border-dashed border-accent/30 bg-gradient-to-b from-accent/[0.06] to-transparent px-14 pb-12 pt-6 sm:px-16 text-center transition-colors",
                "hover:border-accent/60 hover:from-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                MEDIA_AREA_CLASS,
              )}
            >
              <EmptyStateIcon>{kind === "image" ? <ImageUp /> : <Upload />}</EmptyStateIcon>
              <span>
                <span className="block text-base font-semibold">
                  Drop {kind === "image" ? "a photo" : "a video"} here or <span className="text-accent">browse</span>
                </span>
                <span className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {formats.map((format) => (
                    <span key={format} className="rounded-full border bg-card/70 px-2.5 py-0.5 text-xs text-muted-foreground">
                      {format}
                    </span>
                  ))}
                </span>
              </span>
            </button>
            {navigation}
          </>
        )}
        {previewUrl && file && faces && faces.length > 0 && <DownloadButton src={previewUrl} fileName={file.name} faces={faces} />}
      </div>

      {file && (
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          <p className="flex min-w-0 basis-full items-center gap-2 px-1 text-sm text-muted-foreground sm:basis-auto sm:flex-1">
            <FileIcon className="h-4 w-4 shrink-0" />
            <span className="truncate" title={file.name}>
              {file.name}
            </span>
          </p>
          <Button variant="outline" size="icon" onClick={() => onFileChange(null)} disabled={isProcessing} aria-label={`Remove ${kind}`}>
            <X />
          </Button>
          <Button variant="outline" onClick={browse} disabled={isProcessing}>
            <RefreshCw />
            Change
          </Button>
          {isProcessing ? (
            <Button key="cancel" variant="outline" onClick={onCancel} className="flex-1 sm:flex-none">
              <X />
              Cancel
            </Button>
          ) : (
            <Button key="analyze" onClick={() => requireAuth(onDetect)} className="flex-1 sm:flex-none">
              <ScanFace />
              Analyze
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
