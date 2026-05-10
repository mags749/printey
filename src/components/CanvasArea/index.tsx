import { useRef, useEffect, useState, useCallback } from "react"
import { Stage, Layer, Rect, Transformer, Line } from "react-konva"
import Konva from "konva"
import { useCanvasStore, inToPx, formatUnit } from "@/store/canvas-store"
import type { CanvasImage } from "@/store/canvas-store"
import { CANVAS_SCALE, SAFE_ZONE_IN, SNAP_THRESHOLD } from "./constant"
import ImageNode from "./ImageNode"

// ─── Main canvas ───────────────────────────────────────────────────────────────
export const CanvasArea = () => {
  const {
    unit,
    paperSettings,
    canvasImages,
    activeImageId,
    imageLibrary,
    lockAspectRatio,
    setActiveImageId,
    updateCanvasImage,
    placeOnCanvas,
  } = useCanvasStore()

  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [containerSize, setContainerSize] = useState({ w: 900, h: 700 })
  const [guides, setGuides] = useState<{ axis: "H" | "V"; pos: number }[]>([])

  // Paper dimensions in screen pixels
  const paperW = inToPx(paperSettings.widthIn) * CANVAS_SCALE
  const paperH = inToPx(paperSettings.heightIn) * CANVAS_SCALE
  const safeZone = inToPx(SAFE_ZONE_IN) * CANVAS_SCALE

  console.info({ paperW, paperH, safeZone })

  // Centred offset within the stage
  const offsetX = Math.max(40, (containerSize.w - paperW) / 2)
  const offsetY = Math.max(40, (containerSize.h - paperH) / 2)

  // ── ResizeObserver ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() =>
      setContainerSize({ w: el.clientWidth, h: el.clientHeight })
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Attach Transformer ──────────────────────────────────────────────────────
  useEffect(() => {
    const tr = transformerRef.current
    const stage = stageRef.current
    if (!tr || !stage) return
    if (activeImageId) {
      const node = stage.findOne(`#${activeImageId}`)
      if (node) {
        tr.nodes([node])
        tr.getLayer()?.batchDraw()
      }
    } else {
      tr.nodes([])
      tr.getLayer()?.batchDraw()
    }
  }, [activeImageId, canvasImages])

  // ── Smart guides ────────────────────────────────────────────────────────────
  const computeGuides = useCallback(
    (movingId: string, img: CanvasImage) => {
      const result: { axis: "H" | "V"; pos: number }[] = []
      const mL = img.x,
        mR = img.x + img.width * img.scaleX
      const mT = img.y,
        mB = img.y + img.height * img.scaleY
      const mCX = (mL + mR) / 2,
        mCY = (mT + mB) / 2

      // Page edges + centre
      const refs = {
        V: [0, paperW / CANVAS_SCALE, paperW / CANVAS_SCALE / 2],
        H: [0, paperH / CANVAS_SCALE, paperH / CANVAS_SCALE / 2],
      }
      for (const pos of refs.V) {
        if (
          Math.abs(mL - pos) < SNAP_THRESHOLD ||
          Math.abs(mR - pos) < SNAP_THRESHOLD ||
          Math.abs(mCX - pos) < SNAP_THRESHOLD
        )
          result.push({ axis: "V", pos })
      }
      for (const pos of refs.H) {
        if (
          Math.abs(mT - pos) < SNAP_THRESHOLD ||
          Math.abs(mB - pos) < SNAP_THRESHOLD ||
          Math.abs(mCY - pos) < SNAP_THRESHOLD
        )
          result.push({ axis: "H", pos })
      }
      // Other images
      canvasImages
        .filter((i) => i.id !== movingId)
        .forEach((other) => {
          const oL = other.x,
            oR = other.x + other.width * other.scaleX
          const oT = other.y,
            oB = other.y + other.height * other.scaleY
          if (Math.abs(mL - oL) < SNAP_THRESHOLD)
            result.push({ axis: "V", pos: oL })
          if (Math.abs(mR - oR) < SNAP_THRESHOLD)
            result.push({ axis: "V", pos: oR })
          if (Math.abs(mCX - (oL + oR) / 2) < SNAP_THRESHOLD)
            result.push({ axis: "V", pos: (oL + oR) / 2 })
          if (Math.abs(mT - oT) < SNAP_THRESHOLD)
            result.push({ axis: "H", pos: oT })
          if (Math.abs(mB - oB) < SNAP_THRESHOLD)
            result.push({ axis: "H", pos: oB })
          if (Math.abs(mCY - (oT + oB) / 2) < SNAP_THRESHOLD)
            result.push({ axis: "H", pos: (oT + oB) / 2 })
        })
      return result
    },
    [canvasImages, paperW, paperH]
  )

  // ── Ruler ticks ─────────────────────────────────────────────────────────────
  const buildTicks = (totalIn: number) => {
    const step = totalIn <= 5 ? 0.5 : 1
    const ticks: { pos: number; label: string }[] = []
    for (let i = 0; i <= totalIn + 0.001; i += step) {
      ticks.push({
        pos: inToPx(i) * CANVAS_SCALE,
        label: i === 0 ? "" : formatUnit(i, unit as "in" | "mm" | "cm", 0),
      })
    }
    return ticks
  }
  const xTicks = buildTicks(paperSettings.widthIn)
  const yTicks = buildTicks(paperSettings.heightIn)

  // ── Drop from library onto canvas ───────────────────────────────────────────
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const id = e.dataTransfer.getData("libraryImageId")
    if (!id) return
    const libImg = imageLibrary.find((i) => i.id === id)
    if (!libImg) return
    const rect = containerRef.current!.getBoundingClientRect()
    const dropX = (e.clientX - rect.left - offsetX) / CANVAS_SCALE
    const dropY = (e.clientY - rect.top - offsetY) / CANVAS_SCALE
    const newId = `placed-${Date.now()}`
    placeOnCanvas({
      ...libImg,
      id: newId,
      x: Math.max(0, dropX - libImg.width / 2),
      y: Math.max(0, dropY - libImg.height / 2),
    })
    setActiveImageId(newId)
  }

  // ── Colour helpers ───────────────────────────────────────────────────────────
  const hex = paperSettings.backgroundColor || "#ffffff"
  const isDark =
    parseInt(hex.slice(1, 3), 16) * 0.299 +
      parseInt(hex.slice(3, 5), 16) * 0.587 +
      parseInt(hex.slice(5, 7), 16) * 0.114 <
    186

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-scroll bg-[#0a0a0c]"
      style={{
        backgroundImage:
          "radial-gradient(circle, #1e1e24 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* ── Horizontal ruler ───────────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute z-10 flex items-end"
        style={{ left: offsetX, top: offsetY - 22, height: 20, width: paperW }}
      >
        {xTicks.map((t, i) => (
          <div
            key={i}
            className="absolute flex flex-col items-center"
            style={{ left: t.pos, transform: "translateX(-50%)" }}
          >
            <span className="font-mono text-[8px] text-white/30">
              {t.label}
            </span>
            <div className="h-1.5 w-px bg-white/15" />
          </div>
        ))}
      </div>

      {/* ── Vertical ruler ─────────────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute z-10 flex flex-col items-end"
        style={{ left: offsetX - 22, top: offsetY, width: 20, height: paperH }}
      >
        {yTicks.map((t, i) => (
          <div
            key={i}
            className="absolute flex items-center"
            style={{ top: t.pos, transform: "translateY(-50%)" }}
          >
            <span
              className="font-mono text-[8px] text-white/30"
              style={{ writingMode: "vertical-lr" }}
            >
              {t.label}
            </span>
            <div className="h-px w-1.5 bg-white/15" />
          </div>
        ))}
      </div>

      {/* ── Konva Stage ────────────────────────────────────────────────────── */}
      <Stage
        ref={stageRef}
        width={containerSize.w}
        height={containerSize.h + 40}
        onClick={(e) => {
          const target = e.target
          if (
            target === target.getStage() ||
            (target as unknown as { name?: () => string }).name?.() === "paper"
          ) {
            setActiveImageId(null)
          }
        }}
      >
        <Layer>
          {/* Paper shadow */}
          <Rect
            x={offsetX + 6}
            y={offsetY + 8}
            width={paperW}
            height={paperH}
            fill="rgba(0,0,0,0.45)"
            listening={false}
          />

          {/* Paper surface */}
          <Rect
            x={offsetX}
            y={offsetY}
            width={paperW}
            height={paperH}
            fill={paperSettings.backgroundColor}
            name="paper"
          />

          {/* Safe zone border */}
          <Rect
            x={offsetX + safeZone}
            y={offsetY + safeZone}
            width={paperW - safeZone * 2}
            height={paperH - safeZone * 2}
            stroke={isDark ? "rgba(255,100,100,0.35)" : "rgba(200,60,60,0.25)"}
            strokeWidth={0.75}
            dash={[3, 3]}
            listening={false}
          />

          {/* Images */}
          {[...canvasImages]
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((img) => (
              <ImageNode
                key={img.id}
                img={img}
                unit={unit}
                offsetX={offsetX}
                offsetY={offsetY}
                onSelect={() => setActiveImageId(img.id)}
                onChange={(updates) => {
                  updateCanvasImage(img.id, updates)
                  if (updates.x !== undefined || updates.y !== undefined) {
                    const next = { ...img, ...updates }
                    const g = computeGuides(img.id, next)
                    setGuides(g)
                    setTimeout(() => setGuides([]), 150)
                  }
                }}
              />
            ))}

          {/* Smart guides */}
          {guides.map((g, i) =>
            g.axis === "V" ? (
              <Line
                key={i}
                points={[
                  g.pos * CANVAS_SCALE + offsetX,
                  0,
                  g.pos * CANVAS_SCALE + offsetX,
                  containerSize.h,
                ]}
                stroke="#3b82f6"
                strokeWidth={1}
                dash={[5, 3]}
                listening={false}
                opacity={0.8}
              />
            ) : (
              <Line
                key={i}
                points={[
                  0,
                  g.pos * CANVAS_SCALE + offsetY,
                  containerSize.w,
                  g.pos * CANVAS_SCALE + offsetY,
                ]}
                stroke="#3b82f6"
                strokeWidth={1}
                dash={[5, 3]}
                listening={false}
                opacity={0.8}
              />
            )
          )}

          {/* Transformer */}
          <Transformer
            ref={transformerRef}
            keepRatio={lockAspectRatio}
            rotateEnabled
            enabledAnchors={[
              "top-left",
              "top-center",
              "top-right",
              "middle-left",
              "middle-right",
              "bottom-left",
              "bottom-center",
              "bottom-right",
            ]}
            borderStroke="#3b82f6"
            borderStrokeWidth={1.5}
            anchorFill="#ffffff"
            anchorStroke="#3b82f6"
            anchorSize={8}
            rotateAnchorOffset={24}
            padding={1}
          />
        </Layer>
      </Stage>

      {/* ── Page label ─────────────────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute z-10 flex items-center gap-3 font-mono text-[10px] text-white/25"
        style={{ left: offsetX, top: offsetY + paperH + 10 }}
      >
        <span>
          {formatUnit(paperSettings.widthIn, unit as "in" | "mm" | "cm")} ×{" "}
          {formatUnit(paperSettings.heightIn, unit as "in" | "mm" | "cm")}
        </span>
        <span className="text-red-500/40">⬜ {SAFE_ZONE_IN}" safe zone</span>
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {canvasImages.length === 0 && (
        <div
          className="pointer-events-none absolute z-10 flex flex-col items-center justify-center text-center"
          style={{
            left: offsetX,
            top: offsetY,
            width: paperW,
            height: paperH,
          }}
        >
          <p className="text-[11px] font-semibold tracking-widest text-black/20 uppercase">
            Drop images from the sidebar
          </p>
        </div>
      )}
    </div>
  )
}
