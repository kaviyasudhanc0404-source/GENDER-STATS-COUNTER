import { GENDER_STYLES } from "@/lib/constants";
import type { DetectedFace, Gender } from "@/services/api";

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the image"));
    image.src = src;
  });

/**
 * Draws the detected faces (same colours and labels as on screen) on a full-resolution copy of the image,
 * with a summary strip of the counts underneath, and returns it as a JPEG.
 */
export async function renderAnnotatedImage(src: string, faces: DetectedFace[]): Promise<Blob> {
  const image = await loadImage(src);
  const { naturalWidth: width, naturalHeight: height } = image;

  // Sizes scale with the image so labels look the same on small and very large photos
  const unit = Math.max(width, height) / 100;
  const fontSize = Math.round(Math.min(Math.max(unit * 1.2, 12), 48));
  const padding = Math.round(fontSize * 0.35);
  const labelHeight = fontSize + padding * 2;
  const lineWidth = Math.max(2, Math.round(unit * 0.25));
  const stripHeight = labelHeight + padding * 2;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height + stripHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser cannot create the image");

  context.drawImage(image, 0, 0);
  context.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
  context.textBaseline = "top";

  const drawLabel = (text: string, x: number, y: number, background: string) => {
    context.fillStyle = background;
    context.fillRect(x, y, context.measureText(text).width + padding * 2, labelHeight);
    context.fillStyle = "#ffffff";
    context.fillText(text, x + padding, y + padding);
  };

  for (const { box, gender, confidence } of faces) {
    const { label, color } = GENDER_STYLES[gender];
    const [x, y, w, h] = [box.x * width, box.y * height, box.width * width, box.height * height];
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.strokeRect(x, y, w, h);

    // Full label when it fits the face, otherwise just the initial (as on screen)
    const fullLabel = `${label} ${Math.round(confidence * 100)}%`;
    const text = context.measureText(fullLabel).width + padding * 2 <= w * 1.6 ? fullLabel : label[0];
    drawLabel(text, x - lineWidth / 2, y >= labelHeight ? y - labelHeight : y + h, color);
  }

  const count = (gender: Gender) => faces.filter((face) => face.gender === gender).length;
  context.fillStyle = "#090d1a";
  context.fillRect(0, height, width, stripHeight);
  context.fillStyle = "#ffffff";
  context.fillText(
    `${count("male")} male  ·  ${count("female")} female  ·  ${faces.length} total`,
    padding * 2,
    height + padding * 2,
  );

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not create the image"))), "image/jpeg", 0.92),
  );
}

/** Saves a file to the user's downloads. */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url));
}
