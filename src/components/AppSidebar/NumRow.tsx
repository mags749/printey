type NumRowProps = {
  label: string
  value: number
  step?: number
  min?: number
  max?: number
  onChange: (v: number) => void
}

const NumRow = ({
  label,
  value,
  step = 0.01,
  min,
  max,
  onChange,
}: NumRowProps) => (
  <section className="flex items-center justify-between px-3 py-0.5">
    <span className="text-[11px] text-muted-foreground">{label}</span>
    <input
      type="number"
      step={step}
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="h-6 w-24 border border-transparent border-b-border bg-transparent px-0 text-right font-mono text-[11px] outline-none focus:border-b-ring"
    />
  </section>
)

export default NumRow
