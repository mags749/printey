import { Toolbar } from "./components/Toolbar"
import { AppSidebar } from "./components/AppSidebar"
import { CanvasArea } from "./components/CanvasArea"

export const App = () => (
  <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
    <Toolbar />
    <article className="flex flex-1 overflow-hidden">
      <AppSidebar />
      <CanvasArea />
    </article>
  </div>
)
