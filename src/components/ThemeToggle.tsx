import { Button } from "@/components/ui/button"
import { useTheme } from "./theme-provider"
import { HugeiconsIcon } from "@hugeicons/react"
import { Moon01Icon, Sun01Icon } from "@hugeicons/core-free-icons"

const ThemeToggle = () => {
  const { isDarkTheme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      onClick={() => setTheme(isDarkTheme ? "light" : "dark")}
    >
      <HugeiconsIcon
        icon={isDarkTheme ? Sun01Icon : Moon01Icon}
        strokeWidth={1.5}
        className="size-4 text-primary"
      />
    </Button>
  )
}

export default ThemeToggle
