import { inToPx, type CanvasImage } from "@/store/canvas-store"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const readImageFile = (
  file: File,
  paperWidthIn: number
): Promise<Omit<CanvasImage, "zIndex">> =>
  new Promise((resolve) => {
    const src = URL.createObjectURL(file)
    const el = new Image()
    el.onload = () => {
      const maxW = inToPx(Math.min(3, paperWidthIn * 0.5))
      const ratio = el.naturalHeight / el.naturalWidth
      const w = Math.min(maxW, inToPx(paperWidthIn * 0.65))
      resolve({
        id: `lib-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        src,
        name: file.name,
        x: inToPx(0.5),
        y: inToPx(0.5),
        width: w,
        height: w * ratio,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        skewX: 0,
        skewY: 0,
      })
    }
    el.src = src
  })
