"use client"

/**
 * Compress + resize an image File client-side before upload.
 * Returns a JPEG/PNG data URL.
 */
export async function compressImage(
  file: File,
  maxDim = 1600,
  quality = 0.82
): Promise<{ dataUrl: string; size: number }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas not supported")
  ctx.drawImage(bitmap, 0, 0, w, h)

  const isPng = file.type === "image/png"
  const dataUrl = isPng
    ? canvas.toDataURL("image/png")
    : canvas.toDataURL("image/jpeg", quality)

  // estimate size from base64 length
  const base64 = dataUrl.split(",")[1] || ""
  const size = Math.round((base64.length * 3) / 4)

  bitmap.close?.()
  return { dataUrl, size }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}
