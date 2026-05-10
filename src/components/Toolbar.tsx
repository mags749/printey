import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PrinterIcon,
  FileDownloadIcon,
  ArrowReloadHorizontalIcon,
} from "@hugeicons/core-free-icons"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  useCanvasStore,
  PAPER_PRESETS,
  fromInches,
  toInches,
} from "@/store/canvas-store"
import type { Unit } from "@/store/canvas-store"
import { exportToPDF } from "@/lib/export-service"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"

const UNITS: { value: Unit; label: string }[] = [
  { value: "in", label: "IN" },
  { value: "mm", label: "MM" },
  { value: "cm", label: "CM" },
]

export const Toolbar = () => {
  const { unit, setUnit, paperSettings, setPaperSettings, canvasImages } =
    useCanvasStore()

  const [exporting, setExporting] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [customW, setCustomW] = useState("8.5")
  const [customH, setCustomH] = useState("11")

  const handlePreset = (key: string) => {
    if (key === "custom") {
      setShowCustom(true)
      return
    }
    setShowCustom(false)
    const p = PAPER_PRESETS[key]
    if (p)
      setPaperSettings({
        preset: key,
        widthIn: p.widthIn,
        heightIn: p.heightIn,
      })
  }

  const applyCustom = () => {
    const w = toInches(parseFloat(customW) || 8.5, unit)
    const h = toInches(parseFloat(customH) || 11, unit)
    setPaperSettings({ preset: "custom", widthIn: w, heightIn: h })
    setShowCustom(false)
  }

  const toggleOrientation = () => {
    const { widthIn, heightIn } = paperSettings
    setPaperSettings({ widthIn: heightIn, heightIn: widthIn })
  }

  const displayW = fromInches(paperSettings.widthIn, unit).toFixed(
    unit === "mm" ? 1 : 2
  )
  const displayH = fromInches(paperSettings.heightIn, unit).toFixed(
    unit === "mm" ? 1 : 2
  )

  const handleExport = async () => {
    if (canvasImages.length === 0) return
    setExporting(true)
    try {
      await exportToPDF(canvasImages, paperSettings)
    } finally {
      setExporting(false)
    }
  }

  return (
    <TooltipProvider>
      <header className="flex h-12 shrink-0 items-center gap-0 border-b border-border bg-background px-3">
        {/* Brand */}
        <div className="flex items-center gap-2 pr-4">
          <HugeiconsIcon
            icon={PrinterIcon}
            strokeWidth={1.5}
            className="size-4 text-primary"
          />
          <span className="font-heading text-sm font-semibold tracking-wider uppercase">
            Printey
          </span>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Paper presets */}
        <div className="flex items-center gap-1 px-3">
          <span className="mr-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            Paper
          </span>
          {Object.entries(PAPER_PRESETS).map(([key, p]) => (
            <button
              key={key}
              onClick={() => handlePreset(key)}
              className={cn(
                "h-7 border px-2.5 text-[10px] font-semibold tracking-widest uppercase transition-colors",
                paperSettings.preset === key
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => handlePreset("custom")}
            className={cn(
              "h-7 border px-2.5 text-[10px] font-semibold tracking-widest uppercase transition-colors",
              paperSettings.preset === "custom"
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            )}
          >
            Custom
          </button>
        </div>

        {showCustom && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2 px-3">
              <input
                type="number"
                value={customW}
                onChange={(e) => setCustomW(e.target.value)}
                className="h-7 w-14 border border-border bg-transparent px-2 text-center font-mono text-xs outline-none focus:border-foreground"
                placeholder="W"
              />
              <span className="text-muted-foreground">×</span>
              <input
                type="number"
                value={customH}
                onChange={(e) => setCustomH(e.target.value)}
                className="h-7 w-14 border border-border bg-transparent px-2 text-center font-mono text-xs outline-none focus:border-foreground"
                placeholder="H"
              />
              <span className="text-[10px] text-muted-foreground uppercase">
                {unit}
              </span>
              <button
                onClick={applyCustom}
                className="h-7 border border-foreground bg-foreground px-2.5 text-[10px] font-semibold tracking-widest text-background uppercase"
              >
                Apply
              </button>
            </div>
          </>
        )}

        <Separator orientation="vertical" className="h-6" />

        {/* Dimensions badge + orientation flip */}
        <div className="flex items-center gap-1.5 px-3">
          <span className="font-mono text-xs text-muted-foreground">
            {displayW} × {displayH} {unit}
          </span>
          <Tooltip>
            <TooltipTrigger>
              <button
                onClick={toggleOrientation}
                className="flex size-6 items-center justify-center border border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              >
                <HugeiconsIcon
                  icon={ArrowReloadHorizontalIcon}
                  strokeWidth={1.5}
                  className="size-3"
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>Swap orientation</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Unit toggle */}
        <div className="flex items-center gap-1 px-3">
          <span className="mr-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            Units
          </span>
          {UNITS.map((u) => (
            <button
              key={u.value}
              onClick={() => setUnit(u.value)}
              className={cn(
                "h-7 w-10 border text-[10px] font-semibold tracking-widest uppercase transition-colors",
                unit === u.value
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              )}
            >
              {u.label}
            </button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Background colour */}
        <div className="flex items-center gap-2 px-3">
          <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            BG
          </span>
          <div className="relative flex items-center gap-2 border border-border px-2 py-1">
            <input
              type="color"
              value={paperSettings.backgroundColor}
              onChange={(e) =>
                setPaperSettings({ backgroundColor: e.target.value })
              }
              className="size-4 cursor-pointer appearance-none border-0 bg-transparent p-0 outline-none"
              style={{ colorScheme: "normal" }}
            />
            <span className="font-mono text-[10px] text-muted-foreground">
              {paperSettings.backgroundColor.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex-1" />

        {/* Export */}
        <Button
          onClick={handleExport}
          disabled={exporting || canvasImages.length === 0}
        >
          <HugeiconsIcon
            icon={FileDownloadIcon}
            strokeWidth={1.5}
            className="size-3.5"
          />
          {exporting ? "Generating…" : "Export PDF · 300 DPI"}
        </Button>
      </header>
    </TooltipProvider>
  )
}
