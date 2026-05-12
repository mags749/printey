import { useRef, useState } from "react"
import { Image as KonvaImage, Text } from "react-konva"
import useImage from "use-image"
import Konva from "konva"
import { formatUnit, SCREEN_DPI } from "@/store/canvas-store"
import type { CanvasImage } from "@/store/canvas-store"
import { CANVAS_SCALE } from "./constant"

// ─── Single image node ─────────────────────────────────────────────────────────
type ImageNodeProps = {
  img: CanvasImage
  unit: string
  offsetX: number
  offsetY: number
  onSelect: () => void
  onChange: (u: Partial<CanvasImage>) => void
}

const ImageNode = ({
  img,
  unit,
  offsetX,
  offsetY,
  onSelect,
  onChange,
}: ImageNodeProps) => {
  const [bitmap] = useImage(img.src)
  const nodeRef = useRef<Konva.Image>(null)
  const [label, setLabel] = useState("")

  // Build a dimension label while interacting
  const buildLabel = (node: Konva.Image) => {
    const wIn = (node.width() * node.scaleX()) / SCREEN_DPI
    const hIn = (node.height() * node.scaleY()) / SCREEN_DPI
    return `${formatUnit(wIn, unit as "in" | "mm" | "cm")} × ${formatUnit(hIn, unit as "in" | "mm" | "cm")}`
  }

  return (
    <>
      <KonvaImage
        id={img.id}
        ref={nodeRef}
        image={bitmap}
        x={img.x * CANVAS_SCALE + offsetX}
        y={img.y * CANVAS_SCALE + offsetY}
        width={img.width * CANVAS_SCALE}
        height={img.height * CANVAS_SCALE}
        scaleX={img.scaleX}
        scaleY={img.scaleY}
        rotation={img.rotation}
        skewX={Math.tan((img.skewX * Math.PI) / 180)}
        skewY={Math.tan((img.skewY * Math.PI) / 180)}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={() => setLabel(buildLabel(nodeRef.current!))}
        onDragMove={(e) => setLabel(buildLabel(e.target as Konva.Image))}
        onDragEnd={(e) => {
          onChange({
            x: (e.target.x() - offsetX) / CANVAS_SCALE,
            y: (e.target.y() - offsetY) / CANVAS_SCALE,
          })
          setLabel("")
        }}
        onTransformStart={() => setLabel(buildLabel(nodeRef.current!))}
        onTransform={(e) => setLabel(buildLabel(e.target as Konva.Image))}
        onTransformEnd={(e) => {
          const n = e.target as Konva.Image
          onChange({
            x: (n.x() - offsetX) / CANVAS_SCALE,
            y: (n.y() - offsetY) / CANVAS_SCALE,
            scaleX: n.scaleX(),
            scaleY: n.scaleY(),
            rotation: n.rotation(),
          })
          setLabel("")
        }}
      />
      {/* Dimension label while dragging/resizing */}
      {label && (
        <Text
          x={img.x * CANVAS_SCALE + offsetX}
          y={img.y * CANVAS_SCALE + offsetY - 22}
          text={label}
          fontSize={10}
          fontFamily="'Geist Mono Variable', monospace"
          fill="#ffffff"
          padding={4}
          cornerRadius={2}
          listening={false}
        />
      )}
    </>
  )
}

export default ImageNode
