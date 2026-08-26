/** Turn a remote image into a downloaded PNG via an offscreen canvas. */

export function pngFileName(from?: string) {
  const base = (from ?? "image").replace(/\.[a-z0-9]+$/i, "");
  return `${base || "image"}.png`;
}

function loadHtmlImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image."));
    image.src = src;
  });
}

function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not export PNG."));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

function saveBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Defer revoke: Firefox/Safari start the download asynchronously, so revoking
  // synchronously can cancel it before it begins.
  setTimeout(() => URL.revokeObjectURL(href), 10_000);
}

export async function downloadImageAsPng(src: string, filename?: string) {
  const response = await fetch(src);
  if (!response.ok) throw new Error("Could not download image.");

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = await loadHtmlImage(objectUrl);
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) throw new Error("Image has no size.");

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not create image.");
    context.drawImage(image, 0, 0);

    const png = await canvasToPngBlob(canvas);
    saveBlob(png, pngFileName(filename));
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
