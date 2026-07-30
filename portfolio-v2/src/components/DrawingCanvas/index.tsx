import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import styled from '@emotion/styled'

export type Tool = 'cursor' | 'pencil' | 'spray' | 'eraser' | 'stamp' | 'dots'
export type StampShape = 'star' | 'heart' | 'diamond' | 'x'

export interface DrawingCanvasHandle {
  getSnapshot: () => ImageData | null
  applySnapshot: (data: ImageData) => void
  clear: () => void
}

interface Props {
  tool: Tool
  color: string
  symmetry: boolean
  stampShape: StampShape
  onBeforeStroke: () => void
}

// ─── constants ────────────────────────────────────────────────────────────────

const PX = 2        // pencil / dots pixel size
const ERASER = 14   // eraser block (pixels)
const ERASER_H = ERASER / 2
const DASH = 4      // dots tool: pixels drawn per segment
const GAP = 3       // dots tool: pixels skipped per gap

// ─── stamp bitmap patterns (each cell → PX×PX block) ─────────────────────────

export const STAMPS: Record<StampShape, readonly string[]> = {
  star: [
    '..X..',
    '..X..',
    'XXXXX',
    '..X..',
    '..X..',
  ],
  heart: [
    '.X.X.',
    'XXXXX',
    'XXXXX',
    '.XXX.',
    '..X..',
  ],
  diamond: [
    '..X..',
    '.XXX.',
    'XXXXX',
    '.XXX.',
    '..X..',
  ],
  x: [
    'X...X',
    '.X.X.',
    '..X..',
    '.X.X.',
    'X...X',
  ],
} as const

// ─── styled canvas ────────────────────────────────────────────────────────────

const Canvas = styled.canvas<{ $tool: Tool }>`
  position: fixed;
  inset: 0;
  z-index: 0;
  cursor: ${({ $tool }) => ($tool === 'cursor' ? 'default' : 'crosshair')};
  touch-action: none;
  image-rendering: pixelated;
`

// ─── helpers ──────────────────────────────────────────────────────────────────

function getPos(e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect()
  if ('touches' in e) {
    return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
  }
  return { x: (e as MouseEvent).clientX - rect.left, y: (e as MouseEvent).clientY - rect.top }
}

/**
 * Bresenham line — calls plotFn at every integer pixel along the path.
 */
function bresenhamLine(
  x0: number, y0: number,
  x1: number, y1: number,
  plotFn: (x: number, y: number) => void,
) {
  let ix0 = Math.round(x0), iy0 = Math.round(y0)
  const ix1 = Math.round(x1), iy1 = Math.round(y1)
  const dx = Math.abs(ix1 - ix0), sx = ix0 < ix1 ? 1 : -1
  const dy = -Math.abs(iy1 - iy0), sy = iy0 < iy1 ? 1 : -1
  let err = dx + dy
  for (;;) {
    plotFn(ix0, iy0)
    if (ix0 === ix1 && iy0 === iy1) break
    const e2 = 2 * err
    if (e2 >= dy) { err += dy; ix0 += sx }
    if (e2 <= dx) { err += dx; iy0 += sy }
  }
}

/**
 * Same as bresenhamLine but skips pixels according to the dash/gap pattern.
 * Returns the updated counter so the pattern stays continuous across onMove calls.
 */
function bresenhamDotted(
  x0: number, y0: number,
  x1: number, y1: number,
  counter: number,
  plotFn: (x: number, y: number) => void,
): number {
  let ix0 = Math.round(x0), iy0 = Math.round(y0)
  const ix1 = Math.round(x1), iy1 = Math.round(y1)
  const dx = Math.abs(ix1 - ix0), sx = ix0 < ix1 ? 1 : -1
  const dy = -Math.abs(iy1 - iy0), sy = iy0 < iy1 ? 1 : -1
  let err = dx + dy
  let c = counter
  for (;;) {
    if ((c % (DASH + GAP)) < DASH) plotFn(ix0, iy0)
    c++
    if (ix0 === ix1 && iy0 === iy1) break
    const e2 = 2 * err
    if (e2 >= dy) { err += dy; ix0 += sx }
    if (e2 <= dx) { err += dx; iy0 += sy }
  }
  return c
}

function renderStamp(ctx: CanvasRenderingContext2D, cx: number, cy: number, shape: StampShape) {
  const pattern = STAMPS[shape]
  const cols = pattern[0].length
  const rows = pattern.length
  const ox = Math.floor(cols / 2)
  const oy = Math.floor(rows / 2)
  const icx = Math.round(cx), icy = Math.round(cy)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pattern[r][c] === 'X') {
        ctx.fillRect(icx + (c - ox) * PX, icy + (r - oy) * PX, PX, PX)
      }
    }
  }
}

// ─── component ────────────────────────────────────────────────────────────────

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(
function DrawingCanvas({ tool, color, symmetry, stampShape, onBeforeStroke }, ref) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)

  useImperativeHandle(ref, () => ({
    getSnapshot() {
      const canvas = canvasRef.current
      const ctx    = canvas?.getContext('2d')
      if (!canvas || !ctx) return null
      return ctx.getImageData(0, 0, canvas.width, canvas.height)
    },
    applySnapshot(data: ImageData) {
      const canvas = canvasRef.current
      const ctx    = canvas?.getContext('2d')
      if (!canvas || !ctx) return
      ctx.putImageData(data, 0, 0)
    },
    clear() {
      const canvas = canvasRef.current
      const ctx    = canvas?.getContext('2d')
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    },
  }), [])
  const isDrawing    = useRef(false)
  const lastPos      = useRef<{ x: number; y: number } | null>(null)
  const lastStampPos = useRef<{ x: number; y: number } | null>(null)
  const currentPos   = useRef<{ x: number; y: number } | null>(null)
  const sprayTimer   = useRef<ReturnType<typeof setInterval> | null>(null)
  const dotsCounter  = useRef(0)
  // DEV: captures the raw path of the current stroke (as 0–1 viewport fractions)
  // so it can be logged on mouseup for tracing a curve to hand-place later.
  const strokePath   = useRef<{ x: number; y: number }[]>([])

  // ── resize: preserve canvas content ────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const setSize = (preserve = false) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const saved = preserve ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      ctx.imageSmoothingEnabled = false
      if (saved) ctx.putImageData(saved, 0, 0)
    }
    setSize(false)
    window.addEventListener('resize', () => setSize(true))
    return () => window.removeEventListener('resize', () => setSize(true))
  }, [])

  // ── spray helper (stable across re-renders) ─────────────────────────────────
  const sprayAt = useCallback((ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
    const R = 22, N = 35
    ctx.fillStyle = color
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2
      const r = Math.random() * R
      ctx.fillRect(Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a)), 1, 1)
    }
  }, [color])

  // ── event listeners ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false

    const stopSpray = () => {
      if (sprayTimer.current) { clearInterval(sprayTimer.current); sprayTimer.current = null }
    }

    // Mirror an x-coordinate across the canvas centre
    const mx = (x: number) => canvas.width - x

    // Run fn(x) and, when symmetry is on, fn(mirror of x)
    const withMirror = (x: number, fn: (px: number) => void) => {
      fn(x)
      if (symmetry) fn(mx(x))
    }

    // ── mouse / touch down ───────────────────────────────────────────────────
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (tool === 'cursor') return
      // Snapshot before any pixels change so this stroke is undoable
      onBeforeStroke()
      isDrawing.current = true
      const pos = getPos(e, canvas)
      lastPos.current      = pos
      currentPos.current   = pos
      lastStampPos.current = pos
      strokePath.current   = [{ x: pos.x / canvas.width, y: pos.y / canvas.height }]
      ctx.fillStyle = color

      switch (tool) {
        case 'pencil':
          withMirror(pos.x, px => ctx.fillRect(Math.round(px), Math.round(pos.y), PX, PX))
          break

        case 'dots':
          dotsCounter.current = 0
          withMirror(pos.x, px => ctx.fillRect(Math.round(px), Math.round(pos.y), PX, PX))
          break

        case 'eraser':
          withMirror(pos.x, px =>
            ctx.clearRect(Math.round(px) - ERASER_H, Math.round(pos.y) - ERASER_H, ERASER, ERASER)
          )
          break

        case 'stamp':
          withMirror(pos.x, px => renderStamp(ctx, px, pos.y, stampShape))
          break

        case 'spray':
          withMirror(pos.x, px => sprayAt(ctx, px, pos.y))
          sprayTimer.current = setInterval(() => {
            if (!currentPos.current) return
            ctx.fillStyle = color
            withMirror(currentPos.current.x, px => sprayAt(ctx, px, currentPos.current!.y))
          }, 40)
          break
      }
    }

    // ── mouse / touch move ───────────────────────────────────────────────────
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing.current) return
      const pos = getPos(e, canvas)
      currentPos.current = pos
      strokePath.current.push({ x: pos.x / canvas.width, y: pos.y / canvas.height })
      ctx.fillStyle = color

      if (tool === 'pencil' && lastPos.current) {
        const lp = lastPos.current
        const plot = (px: number, py: number) => ctx.fillRect(px, py, PX, PX)
        bresenhamLine(lp.x, lp.y, pos.x, pos.y, plot)
        if (symmetry) bresenhamLine(mx(lp.x), lp.y, mx(pos.x), pos.y, plot)
        lastPos.current = pos
      }

      if (tool === 'dots' && lastPos.current) {
        const lp = lastPos.current
        const plot = (px: number, py: number) => ctx.fillRect(px, py, PX, PX)
        const c0 = dotsCounter.current
        // Advance counter only from primary side; use same c0 on mirror for sync'd dashes
        dotsCounter.current = bresenhamDotted(lp.x, lp.y, pos.x, pos.y, c0, plot)
        if (symmetry) bresenhamDotted(mx(lp.x), lp.y, mx(pos.x), pos.y, c0, plot)
        lastPos.current = pos
      }

      if (tool === 'eraser' && lastPos.current) {
        const lp = lastPos.current
        const erase = (px: number, py: number) =>
          ctx.clearRect(px - ERASER_H, py - ERASER_H, ERASER, ERASER)
        bresenhamLine(lp.x, lp.y, pos.x, pos.y, erase)
        if (symmetry) bresenhamLine(mx(lp.x), lp.y, mx(pos.x), pos.y, erase)
        lastPos.current = pos
      }

      if (tool === 'stamp' && lastStampPos.current) {
        const lsp = lastStampPos.current
        const minDist = STAMPS[stampShape][0].length * PX + 4
        if (Math.hypot(pos.x - lsp.x, pos.y - lsp.y) >= minDist) {
          withMirror(pos.x, px => renderStamp(ctx, px, pos.y, stampShape))
          lastStampPos.current = pos
        }
      }
      // spray: handled by interval
    }

    // ── up / leave ───────────────────────────────────────────────────────────
    const onUp = () => {
      isDrawing.current    = false
      lastPos.current      = null
      lastStampPos.current = null
      stopSpray()

      if (strokePath.current.length > 1) {
        const rounded = strokePath.current.map(p => ({
          x: Math.round(p.x * 1000) / 1000,
          y: Math.round(p.y * 1000) / 1000,
        }))
        console.log(`%cCurve captured — ${rounded.length} points (x/y as 0–1 viewport fractions):`, 'font-weight:bold')
        console.log(JSON.stringify(rounded))
      }
      strokePath.current = []
    }

    canvas.addEventListener('mousedown',  onDown)
    canvas.addEventListener('mousemove',  onMove)
    canvas.addEventListener('mouseup',    onUp)
    canvas.addEventListener('mouseleave', onUp)
    canvas.addEventListener('touchstart', onDown, { passive: false })
    canvas.addEventListener('touchmove',  onMove, { passive: false })
    canvas.addEventListener('touchend',   onUp)

    return () => {
      canvas.removeEventListener('mousedown',  onDown)
      canvas.removeEventListener('mousemove',  onMove)
      canvas.removeEventListener('mouseup',    onUp)
      canvas.removeEventListener('mouseleave', onUp)
      canvas.removeEventListener('touchstart', onDown)
      canvas.removeEventListener('touchmove',  onMove)
      canvas.removeEventListener('touchend',   onUp)
      stopSpray()
    }
  }, [tool, color, symmetry, stampShape, sprayAt, onBeforeStroke])

  return <Canvas ref={canvasRef} $tool={tool} />
})
