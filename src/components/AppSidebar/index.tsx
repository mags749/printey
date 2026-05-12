import { useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  ImageUploadIcon,
  DeleteThrowIcon,
  LayerBringToFrontIcon,
  LayerSendToBackIcon,
  CopyIcon,
  LockIcon,
  LockedIcon,
  LayerIcon,
  FileImageIcon,
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
  inToPx,
  fromInches,
  toInches,
  formatUnit,
  SCREEN_DPI,
} from "@/store/canvas-store"
import type { CanvasImage } from "@/store/canvas-store"
import { cn, readImageFile } from "@/lib/utils"
import SectionHeader from "./SectionHeader"
import NumRow from "./NumRow"
import NoContentView from "./NoContentView"
import { Button } from "../ui/button"

export const AppSidebar = () => {
  const {
    unit,
    paperSettings,
    imageLibrary,
    canvasImages,
    activeImageId,
    lockAspectRatio,
    addToLibrary,
    removeFromLibrary,
    placeOnCanvas,
    updateCanvasImage,
    removeCanvasImage,
    setActiveImageId,
    setLockAspectRatio,
    bringToFront,
    sendToBack,
    duplicateImage,
  } = useCanvasStore()

  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState<boolean>(false)

  const activeImg = canvasImages.find((i) => i.id === activeImageId) ?? null
  const physW = activeImg
    ? (activeImg.width * activeImg.scaleX) / SCREEN_DPI
    : 0
  const physH = activeImg
    ? (activeImg.height * activeImg.scaleY) / SCREEN_DPI
    : 0

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue
      const data = await readImageFile(file, paperSettings.widthIn)
      addToLibrary(data)
    }
  }

  const setPhysW = (displayVal: number) => {
    if (!activeImg) return
    const inches = toInches(displayVal, unit)
    const newScaleX = (inches * SCREEN_DPI) / activeImg.width
    const updates: Partial<CanvasImage> = { scaleX: newScaleX }
    if (lockAspectRatio) {
      const ar =
        (activeImg.height * activeImg.scaleY) /
        (activeImg.width * activeImg.scaleX)
      updates.scaleY = (newScaleX * activeImg.width * ar) / activeImg.height
    }
    updateCanvasImage(activeImg.id, updates)
  }

  const setPhysH = (displayVal: number) => {
    if (!activeImg) return
    const inches = toInches(displayVal, unit)
    const newScaleY = (inches * SCREEN_DPI) / activeImg.height
    const updates: Partial<CanvasImage> = { scaleY: newScaleY }
    if (lockAspectRatio) {
      const ar =
        (activeImg.width * activeImg.scaleX) /
        (activeImg.height * activeImg.scaleY)
      updates.scaleX = (newScaleY * activeImg.height * ar) / activeImg.width
    }
    updateCanvasImage(activeImg.id, updates)
  }

  const displayW = parseFloat(
    fromInches(physW, unit).toFixed(unit === "mm" ? 1 : 3)
  )
  const displayH = parseFloat(
    fromInches(physH, unit).toFixed(unit === "mm" ? 1 : 3)
  )

  const layerActions = [
    {
      icon: LayerBringToFrontIcon as IconSvgElement,
      label: "Front",
      action: () => bringToFront(activeImg!.id),
    },
    {
      icon: LayerSendToBackIcon as IconSvgElement,
      label: "Back",
      action: () => sendToBack(activeImg!.id),
    },
    {
      icon: CopyIcon as IconSvgElement,
      label: "Dupe",
      action: () => duplicateImage(activeImg!.id),
    },
  ]

  const imageInput = (
    <input
      ref={fileRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      multiple
      className="sr-only"
      onChange={(e) => handleFiles(e.target.files)}
    />
  )

  if (imageLibrary.length === 0) {
    return (
      <NoContentView
        fileRef={fileRef}
        handleFiles={handleFiles}
        setDragging={setDragging}
      >
        {imageInput}
      </NoContentView>
    )
  }

  return (
    <TooltipProvider>
      <aside className="flex h-full w-56 shrink-0 flex-col overflow-x-hidden overflow-y-auto border-r border-border bg-sidebar text-sidebar-foreground">
        {/* Upload zone */}
        <section
          className={cn(
            "relative flex cursor-pointer flex-col items-center gap-2 border-b border-border px-4 py-5 transition-colors",
            dragging ? "bg-primary/5" : "hover:bg-muted/50"
          )}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            handleFiles(e.dataTransfer.files)
          }}
        >
          <div
            className={cn(
              "flex size-10 items-center justify-center border transition-colors",
              dragging
                ? "border-primary text-primary"
                : "border-border text-muted-foreground"
            )}
          >
            <HugeiconsIcon
              icon={ImageUploadIcon}
              strokeWidth={1.5}
              className="size-5"
            />
          </div>
          <div className="text-center">
            <p className="text-[11px] font-semibold tracking-wide">
              Drop images here
            </p>
            <p className="text-[10px] text-muted-foreground">
              JPG · PNG · WebP
            </p>
          </div>
          {imageInput}
        </section>

        {/* Library */}
        {imageLibrary.length > 0 && (
          <>
            <SectionHeader
              icon={FileImageIcon as IconSvgElement}
              label="Library"
            />
            <section className="grid grid-cols-2 gap-1.5 px-3 pb-3">
              {imageLibrary.map((img) => (
                <div
                  key={img.id}
                  className="group relative cursor-pointer border border-border bg-muted/30 transition-colors hover:border-foreground"
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData("libraryImageId", img.id)
                  }
                  onClick={() => {
                    const newId = `placed-${Date.now()}-${Math.random().toString(36).slice(2)}`
                    placeOnCanvas({
                      ...img,
                      id: newId,
                      x: inToPx(0.5),
                      y: inToPx(0.5),
                    })
                    setActiveImageId(newId)
                  }}
                  title={`${img.name} — click or drag`}
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={img.src}
                      alt={img.name}
                      className="size-full object-cover"
                    />
                  </div>
                  <p className="truncate px-1 py-0.5 text-[9px] text-muted-foreground">
                    {img.name.replace(/\.[^.]+$/, "")}
                  </p>
                  <button
                    className="absolute top-0.5 right-0.5 hidden size-4 items-center justify-center bg-background/80 text-destructive group-hover:flex"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFromLibrary(img.id)
                    }}
                  >
                    <HugeiconsIcon
                      icon={DeleteThrowIcon}
                      strokeWidth={2}
                      className="size-2.5"
                    />
                  </button>
                </div>
              ))}
            </section>
            <Separator />
          </>
        )}

        {/* Selection controls */}
        {activeImg ? (
          <>
            <SectionHeader
              icon={LayerIcon as IconSvgElement}
              label="Selection"
            />

            <section className="mx-3 mb-2 flex items-center justify-center border border-primary/30 bg-primary/5 py-1.5">
              <span className="font-mono text-[11px] font-medium text-primary">
                {formatUnit(physW, unit)} × {formatUnit(physH, unit)}
              </span>
            </section>

            <section className="flex items-center justify-between px-3 pb-2">
              <span className="text-[11px] text-muted-foreground">
                Lock aspect ratio
              </span>
              <button
                onClick={() => setLockAspectRatio(!lockAspectRatio)}
                className={cn(
                  "flex h-6 items-center gap-1 border px-2 text-[10px] font-semibold tracking-wider uppercase transition-colors",
                  lockAspectRatio
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-foreground"
                )}
              >
                <HugeiconsIcon
                  icon={lockAspectRatio ? LockedIcon : LockIcon}
                  strokeWidth={1.5}
                  className="size-2.5"
                />
                {lockAspectRatio ? "On" : "Off"}
              </button>
            </section>

            <NumRow
              label={`Width (${unit})`}
              value={displayW}
              step={unit === "mm" ? 0.5 : 0.01}
              min={0.01}
              onChange={setPhysW}
            />
            <NumRow
              label={`Height (${unit})`}
              value={displayH}
              step={unit === "mm" ? 0.5 : 0.01}
              min={0.01}
              onChange={setPhysH}
            />

            <Separator className="my-2" />

            <NumRow
              label="Rotation (°)"
              value={parseFloat(activeImg.rotation.toFixed(1))}
              step={1}
              min={-180}
              max={180}
              onChange={(v) => updateCanvasImage(activeImg.id, { rotation: v })}
            />
            <NumRow
              label="Skew X (°)"
              value={parseFloat(activeImg.skewX.toFixed(1))}
              step={1}
              min={-45}
              max={45}
              onChange={(v) => updateCanvasImage(activeImg.id, { skewX: v })}
            />
            <NumRow
              label="Skew Y (°)"
              value={parseFloat(activeImg.skewY.toFixed(1))}
              step={1}
              min={-45}
              max={45}
              onChange={(v) => updateCanvasImage(activeImg.id, { skewY: v })}
            />

            <Separator className="my-2" />

            <section className="grid grid-cols-3 gap-1 px-3 pb-3">
              {layerActions.map(({ icon, label, action }) => (
                <Tooltip key={label}>
                  <TooltipTrigger>
                    <Button
                      variant="outline"
                      onClick={action}
                      className="flex w-full flex-col items-center gap-1 border border-border py-2 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                    >
                      <HugeiconsIcon
                        icon={icon}
                        strokeWidth={1.5}
                        className="size-3.5"
                      />
                      <span className="text-[9px] font-semibold tracking-wider uppercase">
                        {label}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{label}</TooltipContent>
                </Tooltip>
              ))}
            </section>

            <section className="px-3 pb-4">
              <Button
                onClick={() => removeCanvasImage(activeImg.id)}
                className="flex w-full items-center justify-center gap-2 border border-border py-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase transition-colors hover:border-destructive hover:text-destructive"
              >
                <HugeiconsIcon
                  icon={DeleteThrowIcon}
                  strokeWidth={1.5}
                  className="size-3"
                />
                Remove image
              </Button>
            </section>
            <Separator />
          </>
        ) : (
          <section className="px-4 py-4 text-[11px] leading-relaxed text-muted-foreground">
            Click an image on the canvas to select and edit it, or drag from the
            library above.
          </section>
        )}

        {/* Layers list */}
        {canvasImages.length > 0 && (
          <>
            <SectionHeader
              icon={LayerIcon as IconSvgElement}
              label={`Layers (${canvasImages.length})`}
            />
            <section className="flex flex-col gap-0.5 px-2 pb-4">
              {[...canvasImages]
                .sort((a, b) => b.zIndex - a.zIndex)
                .map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageId(img.id)}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 text-left transition-colors",
                      img.id === activeImageId
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <img
                      src={img.src}
                      alt=""
                      className="size-6 shrink-0 border border-border object-cover"
                    />
                    <span className="flex-1 truncate text-[10px] font-medium">
                      {img.name.replace(/\.[^.]+$/, "")}
                    </span>
                    <span className="font-mono text-[9px] text-muted-foreground/50">
                      {img.zIndex}
                    </span>
                  </button>
                ))}
            </section>
          </>
        )}
      </aside>
    </TooltipProvider>
  )
}
