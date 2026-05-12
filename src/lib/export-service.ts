import jsPDF from "jspdf"
import type { CanvasImage, PaperSettings } from "@/store/canvas-store"
import { PRINT_DPI, SCREEN_DPI } from "@/store/canvas-store"

// ─── Coordinate helpers ────────────────────────────────────────────────────────
// All jsPDF units are in inches via the format array + unit:"in"
const pxToInch = (px: number, dpi = SCREEN_DPI) => px / dpi

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

/**
 * Rasterise a single CanvasImage to a JPEG data-URL at PRINT_DPI.
 * Applies scaleX/scaleY so the physical size matches the canvas exactly.
 */
const rasterise = async (
  img: CanvasImage
): Promise<{ dataUrl: string; wIn: number; hIn: number }> => {
  const wIn = (img.width * img.scaleX) / SCREEN_DPI
  const hIn = (img.height * img.scaleY) / SCREEN_DPI

  const targetW = Math.max(1, Math.round(wIn * PRINT_DPI))
  const targetH = Math.max(1, Math.round(hIn * PRINT_DPI))

  const offscreen = document.createElement("canvas")
  offscreen.width = targetW
  offscreen.height = targetH
  const ctx = offscreen.getContext("2d")!

  // Apply skew if needed
  if (img.skewX !== 0 || img.skewY !== 0) {
    ctx.transform(
      1,
      Math.tan((img.skewY * Math.PI) / 180),
      Math.tan((img.skewX * Math.PI) / 180),
      1,
      0,
      0
    )
  }

  const el = await loadImage(img.src)
  ctx.drawImage(el, 0, 0, targetW, targetH)

  const dataUrl = offscreen.toDataURL("image/jpeg", 0.95)
  return { dataUrl, wIn, hIn }
}

// ─── Main export ───────────────────────────────────────────────────────────────
export const exportToPDF = async (
  canvasImages: CanvasImage[],
  paperSettings: PaperSettings
): Promise<void> => {
  const { widthIn, heightIn, backgroundColor } = paperSettings

  const doc = new jsPDF({
    orientation: widthIn >= heightIn ? "landscape" : "portrait",
    unit: "in",
    format: [Math.max(widthIn, heightIn), Math.min(widthIn, heightIn)],
    // jsPDF landscape swaps width/height, so we normalise via format tuple
    putOnlyUsedFonts: true,
    compress: true,
  })

  // For landscape jsPDF internally uses [longer, shorter], so we need to set
  // the page as [widthIn, heightIn] explicitly:
  doc.internal.pageSize.width = widthIn
  doc.internal.pageSize.height = heightIn

  // Background fill
  if (backgroundColor && backgroundColor.toLowerCase() !== "#ffffff") {
    const r = parseInt(backgroundColor.slice(1, 3), 16)
    const g = parseInt(backgroundColor.slice(3, 5), 16)
    const b = parseInt(backgroundColor.slice(5, 7), 16)
    doc.setFillColor(r, g, b)
    doc.rect(0, 0, widthIn, heightIn, "F")
  }

  // Sort by zIndex (lowest first = bottom layer)
  const sorted = [...canvasImages].sort((a, b) => a.zIndex - b.zIndex)

  for (const img of sorted) {
    const xIn = pxToInch(img.x)
    const yIn = pxToInch(img.y)

    try {
      const { dataUrl, wIn, hIn } = await rasterise(img)

      if (img.rotation !== 0) {
        // Save/rotate/restore around the image centre
        const cx = xIn + wIn / 2
        const cy = yIn + hIn / 2
        const rad = (img.rotation * Math.PI) / 180
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)

        // jsPDF matrix is column-major: [a b c d e f]
        // equivalent to ctx.transform(a, b, c, d, e, f)
        // We need: translate to centre, rotate, translate back
        // Combined matrix:
        //   a = cos, b = sin, c = -sin, d = cos
        //   e = cx - cx*cos + cy*sin, f = cy - cx*sin - cy*cos
        ;(doc as any).saveGraphicsState?.()
        const e = cx - cx * cos + cy * sin
        const f = cy - cx * sin - cy * cos
        ;(doc as any).setCurrentTransformationMatrix?.(
          cos,
          sin,
          -sin,
          cos,
          e,
          f
        )
        doc.addImage(dataUrl, "JPEG", xIn, yIn, wIn, hIn)
        ;(doc as any).restoreGraphicsState?.()
      } else {
        doc.addImage(dataUrl, "JPEG", xIn, yIn, wIn, hIn)
      }
    } catch (err) {
      console.error(`Failed to render image ${img.name}:`, err)
    }
  }

  doc.save(`printey-${Date.now()}.pdf`)
}
