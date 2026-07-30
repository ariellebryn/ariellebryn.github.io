import { useState, useRef, useCallback, useEffect } from 'react'
import { GlobalStyles } from './styles/GlobalStyles'
import { DrawingCanvas } from './components/DrawingCanvas'
import type { Tool, StampShape, DrawingCanvasHandle } from './components/DrawingCanvas'
import { LandingPage } from './components/LandingPage'
import { Toolbar, PALETTE } from './components/Toolbar'
import { Projects } from './components/Projects'

const MAX_HISTORY = 50

function App() {
  const [tool,       setTool]       = useState<Tool>('cursor')
  const [stampShape, setStampShape] = useState<StampShape>('star')
  const [color,      setColor]      = useState<string>(PALETTE[0].hex)
  const [symmetry,   setSymmetry]   = useState(false)
  const [canUndo,    setCanUndo]    = useState(false)
  const [canRedo,    setCanRedo]    = useState(false)

  const canvasRef  = useRef<DrawingCanvasHandle>(null)
  const undoStack  = useRef<ImageData[]>([])
  const redoStack  = useRef<ImageData[]>([])

  // Called by DrawingCanvas at the start of every stroke, before any pixels change
  const onBeforeStroke = useCallback(() => {
    const snapshot = canvasRef.current?.getSnapshot()
    if (!snapshot) return
    undoStack.current.push(snapshot)
    if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift()
    redoStack.current = []
    setCanUndo(true)
    setCanRedo(false)
  }, [])

  const undo = useCallback(() => {
    const snapshot = undoStack.current.pop()
    if (!snapshot) return
    const current = canvasRef.current?.getSnapshot()
    if (current) redoStack.current.push(current)
    canvasRef.current?.applySnapshot(snapshot)
    setCanUndo(undoStack.current.length > 0)
    setCanRedo(true)
  }, [])

  const redo = useCallback(() => {
    const snapshot = redoStack.current.pop()
    if (!snapshot) return
    const current = canvasRef.current?.getSnapshot()
    if (current) undoStack.current.push(current)
    canvasRef.current?.applySnapshot(snapshot)
    setCanRedo(redoStack.current.length > 0)
    setCanUndo(true)
  }, [])

  const clearCanvas = useCallback(() => {
    onBeforeStroke()
    canvasRef.current?.clear()
  }, [onBeforeStroke])

  // Keep the text-selection highlight color in sync with the current drawing color
  useEffect(() => {
    document.documentElement.style.setProperty('--selection-color', color)
  }, [color])

  // Keyboard shortcuts: Ctrl/⌘+Z → undo, Ctrl/⌘+Shift+Z or Ctrl/⌘+Y → redo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      }
      if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  return (
    <>
      <GlobalStyles />
      {/* z-index 0 — full-screen drawing surface */}
      <DrawingCanvas
        ref={canvasRef}
        tool={tool}
        color={color}
        symmetry={symmetry}
        stampShape={stampShape}
        onBeforeStroke={onBeforeStroke}
      />
      {/* z-index 1 — text floats above; interactive only in cursor mode */}
      <LandingPage tool={tool} />
      {/* z-index 2 — tool picker, fully interactive */}
      <Toolbar
        tool={tool}             onToolChange={setTool}
        stampShape={stampShape} onStampShapeChange={setStampShape}
        color={color}           onColorChange={setColor}
        symmetry={symmetry}     onSymmetryToggle={() => setSymmetry(s => !s)}
        canUndo={canUndo}       onUndo={undo}
        canRedo={canRedo}       onRedo={redo}
        onClear={clearCanvas}
      />
      <Projects tool={tool} />
    </>
  )
}

export default App
