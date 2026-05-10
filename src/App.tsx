import { Toolbar } from "./components/Toolbar"
import { AppSidebar } from "./components/AppSidebar"
import { CanvasArea } from "./components/CanvasArea"

export function App() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <CanvasArea />
      </div>
    </div>
  )
}

export default App
