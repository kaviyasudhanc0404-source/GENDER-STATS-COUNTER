import { Camera, Image, Video, type LucideIcon } from "lucide-react";
import type { Gender } from "@/services/api";

export type InputMode = "image" | "video" | "camera";

interface ModeInfo {
  label: string;
  icon: LucideIcon;
  title: string;
  description: string;
  tip: string; // how to get accurate results
}

export const MODES: Record<InputMode, ModeInfo> = {
  image: {
    label: "Image",
    icon: Image,
    title: "Analyze a photo",
    description: "Upload a photo to count the people in it by gender.",
    tip: "For accurate results, use a clear, well-lit photo where faces are visible and facing the camera.",
  },
  video: {
    label: "Video",
    icon: Video,
    title: "Analyze a video",
    description: "Each person is counted once, even if they leave and come back.",
    tip: "For accurate results, use a clear, steady video with good lighting where faces are easy to see.",
  },
  camera: {
    label: "Camera",
    icon: Camera,
    title: "Live camera",
    description: "Count the people in front of your camera in real time.",
    tip: "For accurate results, face the camera in good lighting and keep your face in view.",
  },
};

/** Order of the modes in the tabs and for the previous/next arrows. */
export const MODE_ORDER = Object.keys(MODES) as InputMode[];

/** File types accepted by the backend for each upload mode. */
export const UPLOAD_EXTENSIONS: Record<Exclude<InputMode, "camera">, string[]> = {
  image: [".jpg", ".jpeg", ".png", ".webp"],
  video: [".mp4", ".webm", ".mov", ".avi"],
};

export const GENDER_STYLES: Record<Gender, { label: string; color: string }> = {
  male: { label: "Male", color: "hsl(210 90% 55%)" },
  female: { label: "Female", color: "hsl(330 85% 60%)" },
};
