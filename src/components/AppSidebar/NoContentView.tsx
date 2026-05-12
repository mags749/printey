import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ImageUploadIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { RefObject, ReactElement } from "react"
import { useTheme } from "../theme-provider"

type NoContentViewProps = {
  fileRef: RefObject<HTMLInputElement | null>
  handleFiles: (files: FileList | null) => Promise<void>
  setDragging: (value: boolean) => void
  children: ReactElement
}

const NoContentView = ({
  fileRef,
  handleFiles,
  setDragging,
  children,
}: NoContentViewProps) => {
  const { isDarkTheme } = useTheme()

  return (
    <Empty
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
      style={{
        backgroundImage: `radial-gradient(circle, ${isDarkTheme ? "#222021" : "#D3D3D3"} 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon
            icon={ImageUploadIcon}
            strokeWidth={1.5}
            className="size-6"
          />
        </EmptyMedia>
        <EmptyTitle>No images to print</EmptyTitle>
        <EmptyDescription>
          <p className="text-[16px] font-semibold tracking-wide">
            Drop images here to start
          </p>
          <p className="text-[14px] text-muted-foreground">JPG · PNG · WebP</p>
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>{children}</EmptyContent>
    </Empty>
  )
}

export default NoContentView
