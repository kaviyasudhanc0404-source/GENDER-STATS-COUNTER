/**
 * Client for the Gender Statistics Counter API.
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/+$/, ""); // no trailing slash

export type Gender = "male" | "female";

/** Face box as fractions (0-1) of the image width and height. */
interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedFace {
  box: BoundingBox;
  gender: Gender;
  confidence: number;
}

/** A face in a video, labelled with the person it belongs to (numbered from 1 in order of first appearance). */
export interface TrackedFace extends DetectedFace {
  person: number;
}

/** One analysed video frame and the counted people visible in it. */
export interface VideoFrame {
  time: number; // seconds from the start of the video
  faces: TrackedFace[];
}

export interface GenderCounts {
  male: number;
  female: number;
  total: number;
}

interface ImageDetection extends GenderCounts {
  faces: DetectedFace[];
}

export interface VideoDetection extends GenderCounts {
  frames_analyzed: number;
  duration_seconds: number;
  frames: VideoFrame[]; // sorted by time
}

export const EMPTY_COUNTS: GenderCounts = { male: 0, female: 0, total: 0 };

export const toCounts = ({ male, female, total }: GenderCounts): GenderCounts => ({ male, female, total });

async function upload<T>(path: string, file: File, signal?: AbortSignal): Promise<T> {
  const body = new FormData();
  body.append("file", file);

  const response = await fetch(`${API_BASE_URL}${path}`, { method: "POST", body, signal }).catch((error) => {
    if (signal?.aborted) throw error;
    throw new Error("Cannot reach the detection server. Make sure the backend is running.");
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(typeof error?.detail === "string" ? error.detail : `Request failed (${response.status})`);
  }
  return response.json();
}

/** Detect faces and their gender in an image or a camera frame. */
export const detectImage = (file: File, signal?: AbortSignal) => upload<ImageDetection>("/detect/image", file, signal);

/** Count unique people by gender in a video. Aborting the request also stops processing on the server. */
export const detectVideo = (file: File, signal?: AbortSignal) => upload<VideoDetection>("/detect/video", file, signal);
