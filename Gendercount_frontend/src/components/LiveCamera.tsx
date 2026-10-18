import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, Camera, CameraOff } from "lucide-react";
import Button from "@/components/Button";
import FaceOverlay from "@/components/FaceOverlay";
import MediaFrame, { EmptyStateIcon, MEDIA_CLASS } from "@/components/MediaFrame";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { detectImage, toCounts, type DetectedFace, type GenderCounts } from "@/services/api";

const FRAME_INTERVAL_MS = 300; // pause between a response and the next frame
const MAX_FRAME_WIDTH = 640; // frames are downscaled before upload to keep requests small

const captureFrame = (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
  const scale = Math.min(1, MAX_FRAME_WIDTH / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);

  return new Promise<File>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(new File([blob], "frame.jpg", { type: "image/jpeg" })) : reject(new Error("Could not capture a camera frame")),
      "image/jpeg",
      0.85,
    ),
  );
};

interface LiveCameraProps {
  navigation: ReactNode; // mode arrows shown while the camera is off
  onCounts: (counts: GenderCounts) => void;
  onActiveChange: (active: boolean) => void;
}

const LiveCamera = ({ navigation, onCounts, onActiveChange }: LiveCameraProps) => {
  const { requireAuth } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [faces, setFaces] = useState<DetectedFace[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Show the stream, and release the camera when it is stopped or the component unmounts
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
    return () => stream?.getTracks().forEach((track) => track.stop());
  }, [stream]);

  // Detection loop: send a frame, wait for the result, pause, repeat (never more than one request in flight)
  useEffect(() => {
    const video = videoRef.current;
    if (!stream || !video) return;

    const controller = new AbortController();
    const canvas = document.createElement("canvas");
    let timer: number | undefined;

    const detectFrame = async () => {
      try {
        if (video.readyState >= video.HAVE_CURRENT_DATA) {
          const result = await detectImage(await captureFrame(video, canvas), controller.signal);
          setFaces(result.faces);
          onCounts(toCounts(result));
          setError(null);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Detection failed");
      }
      timer = window.setTimeout(detectFrame, FRAME_INTERVAL_MS);
    };
    detectFrame();

    return () => {
      controller.abort();
      window.clearTimeout(timer);
      setFaces([]);
    };
  }, [stream, onCounts]);

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access requires HTTPS or localhost.");
      return;
    }
    try {
      setError(null);
      setStream(
        await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        }),
      );
      onActiveChange(true);
    } catch {
      setError("Unable to access the camera. Please check the browser permissions.");
    }
  };

  const stopCamera = () => {
    setStream(null);
    setError(null);
    onActiveChange(false);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <MediaFrame>
          <video ref={videoRef} autoPlay playsInline muted className={cn(MEDIA_CLASS, !stream && "hidden")} />
          {stream ? (
            <>
              <FaceOverlay faces={faces} />
              <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-lg">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                LIVE
              </span>
            </>
          ) : (
            <div className="flex max-w-sm flex-col items-center gap-5 px-14 pb-12 pt-6 text-center sm:px-16">
              <EmptyStateIcon>{error ? <AlertCircle /> : <Camera />}</EmptyStateIcon>
              <p className={cn("text-sm", error ? "text-destructive" : "text-muted-foreground")}>
                {error ?? "Start the camera to count the people in view. Frames are analysed on the fly and never stored."}
              </p>
            </div>
          )}
        </MediaFrame>
        {!stream && navigation}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        {stream && error && (
          <p className="flex min-w-0 basis-full items-center gap-2 px-1 text-sm text-destructive sm:basis-auto sm:flex-1">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
        {stream ? (
          <Button key="stop" variant="destructive" onClick={stopCamera} className="flex-1 sm:ml-auto sm:flex-none">
            <CameraOff />
            Stop camera
          </Button>
        ) : (
          <Button key="start" onClick={() => requireAuth(startCamera)} className="flex-1 sm:ml-auto sm:flex-none">
            <Camera />
            Start camera
          </Button>
        )}
      </div>
    </div>
  );
};

export default LiveCamera;
