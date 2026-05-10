import { create } from "zustand"

// ─── Unit system ───────────────────────────────────────────────────────────────
export type Unit = "in" | "mm" | "cm"
export type PaperPreset = "letter" | "a4" | "custom"

// ─── DPI constants ─────────────────────────────────────────────────────────────
export const SCREEN_DPI = 96  // CSS pixels per inch on screen
export const PRINT_DPI  = 300 // target DPI for PDF export

// ─── Unit helpers ──────────────────────────────────────────────────────────────
export const inToPx  = (inches: number, dpi = SCREEN_DPI) => inches * dpi
export const pxToIn  = (px: number,     dpi = SCREEN_DPI) => px / dpi
export const inToMm  = (inches: number) => inches * 25.4
export const inToCm  = (inches: number) => inches * 2.54
export const mmToIn  = (mm: number)     => mm / 25.4
export const cmToIn  = (cm: number)     => cm / 2.54

export const toInches = (value: number, unit: Unit): number => {
  if (unit === "mm") return mmToIn(value)
  if (unit === "cm") return cmToIn(value)
  return value
}

export const fromInches = (inches: number, unit: Unit): number => {
  if (unit === "mm") return inToMm(inches)
  if (unit === "cm") return inToCm(inches)
  return inches
}

export const formatUnit = (inches: number, unit: Unit, decimals?: number): string => {
  const d = decimals ?? (unit === "mm" ? 1 : 2)
  const val = fromInches(inches, unit)
  const suffix = unit === "in" ? '"' : unit
  return `${val.toFixed(d)}${suffix}`
}

// ─── Paper presets ─────────────────────────────────────────────────────────────
export const PAPER_PRESETS: Record<string, { widthIn: number; heightIn: number; label: string }> = {
  letter: { widthIn: 8.5,   heightIn: 11,     label: "Letter 8.5×11" },
  a4:     { widthIn: 8.267, heightIn: 11.693,  label: "A4" },
  "4x6":  { widthIn: 4,     heightIn: 6,       label: "4×6 Photo" },
  "5x7":  { widthIn: 5,     heightIn: 7,       label: "5×7 Photo" },
}

export interface PaperSettings {
  preset:          PaperPreset | string
  widthIn:         number
  heightIn:        number
  backgroundColor: string
}

// ─── Canvas image ──────────────────────────────────────────────────────────────
export interface CanvasImage {
  id:       string
  src:      string      // blob URL
  name:     string
  x:        number      // px at SCREEN_DPI, relative to canvas origin
  y:        number
  width:    number      // natural px width of the image element
  height:   number      // natural px height
  scaleX:   number
  scaleY:   number
  rotation: number      // degrees
  skewX:    number      // degrees
  skewY:    number      // degrees
  zIndex:   number
}

// ─── Store ─────────────────────────────────────────────────────────────────────
interface CanvasStore {
  unit:           Unit
  paperSettings:  PaperSettings
  imageLibrary:   CanvasImage[]   // sidebar tray
  canvasImages:   CanvasImage[]   // placed on paper
  activeImageId:  string | null
  lockAspectRatio: boolean

  // Actions
  setUnit:            (u: Unit)                          => void
  setPaperSettings:   (p: Partial<PaperSettings>)        => void
  addToLibrary:       (img: Omit<CanvasImage, "zIndex">) => void
  removeFromLibrary:  (id: string)                       => void
  placeOnCanvas:      (img: CanvasImage)                 => void
  updateCanvasImage:  (id: string, u: Partial<CanvasImage>) => void
  removeCanvasImage:  (id: string)                       => void
  setActiveImageId:   (id: string | null)                => void
  setLockAspectRatio: (v: boolean)                       => void
  bringToFront:       (id: string)                       => void
  sendToBack:         (id: string)                       => void
  duplicateImage:     (id: string)                       => void
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  unit: "in",
  paperSettings: {
    preset:          "letter",
    widthIn:         8.5,
    heightIn:        11,
    backgroundColor: "#ffffff",
  },
  imageLibrary:    [],
  canvasImages:    [],
  activeImageId:   null,
  lockAspectRatio: true,

  setUnit: (unit) => set({ unit }),

  setPaperSettings: (p) =>
    set((s) => ({ paperSettings: { ...s.paperSettings, ...p } })),

  addToLibrary: (img) =>
    set((s) => ({ imageLibrary: [...s.imageLibrary, { ...img, zIndex: 0 }] })),

  removeFromLibrary: (id) =>
    set((s) => ({ imageLibrary: s.imageLibrary.filter((i) => i.id !== id) })),

  placeOnCanvas: (img) =>
    set((s) => {
      const maxZ = s.canvasImages.reduce((m, i) => Math.max(m, i.zIndex), 0)
      return { canvasImages: [...s.canvasImages, { ...img, zIndex: maxZ + 1 }] }
    }),

  updateCanvasImage: (id, updates) =>
    set((s) => ({
      canvasImages: s.canvasImages.map((img) =>
        img.id === id ? { ...img, ...updates } : img
      ),
    })),

  removeCanvasImage: (id) =>
    set((s) => ({
      canvasImages:  s.canvasImages.filter((img) => img.id !== id),
      activeImageId: s.activeImageId === id ? null : s.activeImageId,
    })),

  setActiveImageId: (id) => set({ activeImageId: id }),

  setLockAspectRatio: (v) => set({ lockAspectRatio: v }),

  bringToFront: (id) =>
    set((s) => {
      const maxZ = s.canvasImages.reduce((m, i) => Math.max(m, i.zIndex), 0)
      return {
        canvasImages: s.canvasImages.map((img) =>
          img.id === id ? { ...img, zIndex: maxZ + 1 } : img
        ),
      }
    }),

  sendToBack: (id) =>
    set((s) => {
      const minZ = s.canvasImages.reduce((m, i) => Math.min(m, i.zIndex), Infinity)
      return {
        canvasImages: s.canvasImages.map((img) =>
          img.id === id ? { ...img, zIndex: minZ - 1 } : img
        ),
      }
    }),

  duplicateImage: (id) =>
    set((s) => {
      const original = s.canvasImages.find((i) => i.id === id)
      if (!original) return {}
      const maxZ = s.canvasImages.reduce((m, i) => Math.max(m, i.zIndex), 0)
      const newId = `dup-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const dupe: CanvasImage = {
        ...original,
        id:     newId,
        x:      original.x + inToPx(0.15),
        y:      original.y + inToPx(0.15),
        zIndex: maxZ + 1,
      }
      return { canvasImages: [...s.canvasImages, dupe], activeImageId: newId }
    }),
}))
