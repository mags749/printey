import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"

type SectionHeaderProps = {
  icon: IconSvgElement
  label: string
}

const SectionHeader = ({ icon, label }: SectionHeaderProps) => (
  <div className="flex items-center gap-2 px-3 py-2.5">
    <HugeiconsIcon
      icon={icon}
      strokeWidth={1.5}
      className="size-3 text-muted-foreground"
    />
    <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
      {label}
    </span>
  </div>
)

export default SectionHeader
