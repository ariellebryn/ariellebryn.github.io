import styled from "@emotion/styled";
import { colors } from "../../styles/GlobalStyles";
import { STAMPS } from "../DrawingCanvas";
import type { StampShape } from "../DrawingCanvas";

// Viewport size the curve was traced at — the raw points below are x/y
// fractions of window width/height respectively, so they need to be
// un-distorted back into true (aspect-correct) pixel space before scaling.
const CAPTURE_VIEWPORT = { width: 1280, height: 720 };

// Hand-drawn curve, captured via DrawingCanvas's stroke logger.
const RAW_CURVE: { x: number; y: number }[] = [
  { x: 0.275, y: 0.408 },
  { x: 0.275, y: 0.408 },
  { x: 0.277, y: 0.408 },
  { x: 0.279, y: 0.408 },
  { x: 0.281, y: 0.408 },
  { x: 0.286, y: 0.408 },
  { x: 0.292, y: 0.408 },
  { x: 0.296, y: 0.408 },
  { x: 0.299, y: 0.408 },
  { x: 0.301, y: 0.408 },
  { x: 0.303, y: 0.408 },
  { x: 0.307, y: 0.408 },
  { x: 0.309, y: 0.408 },
  { x: 0.316, y: 0.408 },
  { x: 0.32, y: 0.408 },
  { x: 0.324, y: 0.408 },
  { x: 0.328, y: 0.408 },
  { x: 0.33, y: 0.407 },
  { x: 0.335, y: 0.407 },
  { x: 0.339, y: 0.405 },
  { x: 0.343, y: 0.404 },
  { x: 0.35, y: 0.404 },
  { x: 0.354, y: 0.402 },
  { x: 0.358, y: 0.402 },
  { x: 0.362, y: 0.402 },
  { x: 0.367, y: 0.4 },
  { x: 0.371, y: 0.4 },
  { x: 0.373, y: 0.4 },
  { x: 0.38, y: 0.4 },
  { x: 0.384, y: 0.4 },
  { x: 0.388, y: 0.4 },
  { x: 0.392, y: 0.4 },
  { x: 0.397, y: 0.399 },
  { x: 0.401, y: 0.399 },
  { x: 0.405, y: 0.399 },
  { x: 0.412, y: 0.397 },
  { x: 0.416, y: 0.397 },
  { x: 0.42, y: 0.397 },
  { x: 0.424, y: 0.397 },
  { x: 0.429, y: 0.395 },
  { x: 0.433, y: 0.395 },
  { x: 0.435, y: 0.395 },
  { x: 0.439, y: 0.395 },
  { x: 0.443, y: 0.395 },
  { x: 0.448, y: 0.395 },
  { x: 0.45, y: 0.395 },
  { x: 0.454, y: 0.395 },
  { x: 0.458, y: 0.395 },
  { x: 0.463, y: 0.395 },
  { x: 0.467, y: 0.395 },
  { x: 0.473, y: 0.395 },
  { x: 0.48, y: 0.395 },
  { x: 0.484, y: 0.395 },
  { x: 0.49, y: 0.395 },
  { x: 0.497, y: 0.395 },
  { x: 0.505, y: 0.395 },
  { x: 0.512, y: 0.395 },
  { x: 0.518, y: 0.395 },
  { x: 0.522, y: 0.395 },
  { x: 0.529, y: 0.395 },
  { x: 0.535, y: 0.397 },
  { x: 0.539, y: 0.397 },
  { x: 0.542, y: 0.397 },
  { x: 0.548, y: 0.399 },
  { x: 0.552, y: 0.399 },
  { x: 0.554, y: 0.4 },
  { x: 0.559, y: 0.4 },
  { x: 0.563, y: 0.402 },
  { x: 0.567, y: 0.404 },
  { x: 0.571, y: 0.404 },
  { x: 0.576, y: 0.404 },
  { x: 0.58, y: 0.405 },
  { x: 0.584, y: 0.405 },
  { x: 0.591, y: 0.407 },
  { x: 0.601, y: 0.407 },
  { x: 0.603, y: 0.408 },
  { x: 0.608, y: 0.408 },
  { x: 0.614, y: 0.408 },
  { x: 0.62, y: 0.41 },
  { x: 0.627, y: 0.41 },
  { x: 0.631, y: 0.412 },
  { x: 0.638, y: 0.412 },
  { x: 0.644, y: 0.413 },
  { x: 0.65, y: 0.413 },
  { x: 0.657, y: 0.413 },
  { x: 0.663, y: 0.413 },
  { x: 0.67, y: 0.415 },
  { x: 0.674, y: 0.415 },
  { x: 0.68, y: 0.415 },
  { x: 0.687, y: 0.415 },
  { x: 0.701, y: 0.415 },
  { x: 0.706, y: 0.415 },
  { x: 0.712, y: 0.415 },
  { x: 0.719, y: 0.413 },
  { x: 0.733, y: 0.412 },
  { x: 0.74, y: 0.412 },
  { x: 0.746, y: 0.41 },
  { x: 0.755, y: 0.408 },
  { x: 0.763, y: 0.407 },
  { x: 0.772, y: 0.405 },
  { x: 0.778, y: 0.404 },
  { x: 0.787, y: 0.402 },
  { x: 0.793, y: 0.399 },
  { x: 0.8, y: 0.397 },
  { x: 0.806, y: 0.395 },
  { x: 0.81, y: 0.394 },
  { x: 0.814, y: 0.392 },
  { x: 0.819, y: 0.392 },
  { x: 0.823, y: 0.391 },
  { x: 0.825, y: 0.389 },
  { x: 0.827, y: 0.387 },
  { x: 0.832, y: 0.386 },
  { x: 0.834, y: 0.384 },
  { x: 0.836, y: 0.382 },
  { x: 0.838, y: 0.381 },
  { x: 0.842, y: 0.379 },
  { x: 0.844, y: 0.377 },
  { x: 0.844, y: 0.377 },
  { x: 0.846, y: 0.376 },
  { x: 0.849, y: 0.374 },
  { x: 0.849, y: 0.374 },
];

const STAMP_ORDER: StampShape[] = ["plus"];
const STAMP_COUNT = 16;
const STAMP_SIZE = 8; // px, viewBox units
const CURVE_WIDTH = 240; // px, viewBox units — actual rendered size set via CSS % on Wrap

function toPxSpace(pts: { x: number; y: number }[]) {
  return pts.map((p) => ({
    x: p.x * CAPTURE_VIEWPORT.width,
    y: p.y * CAPTURE_VIEWPORT.height,
  }));
}

/** Shifts curve to start at x=0 and centers it vertically around y=0, then scales to targetWidth. */
function normalizeAndScale(
  pts: { x: number; y: number }[],
  targetWidth: number,
) {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const scale = targetWidth / (xMax - xMin || 1);
  return pts.map((p) => ({
    x: (p.x - xMin) * scale,
    y: (p.y - (yMin + yMax) / 2) * scale,
  }));
}

/** Evenly spaces `count` points along the path by arc length (not by sample index). */
function resampleByArcLength(pts: { x: number; y: number }[], count: number) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(
      cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y),
    );
  }
  const total = cum[cum.length - 1];
  const out: { x: number; y: number }[] = [];
  for (let k = 0; k < count; k++) {
    const target = total * (k / (count - 1));
    let i = 1;
    while (i < cum.length - 1 && cum[i] < target) i++;
    const segStart = cum[i - 1];
    const segEnd = cum[i];
    const t = segEnd > segStart ? (target - segStart) / (segEnd - segStart) : 0;
    const p0 = pts[i - 1];
    const p1 = pts[i];
    out.push({ x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t });
  }
  return out;
}

const scaledCurve = normalizeAndScale(toPxSpace(RAW_CURVE), CURVE_WIDTH);
const curveYMin = Math.min(...scaledCurve.map((p) => p.y));
const curveYMax = Math.max(...scaledCurve.map((p) => p.y));
const curveHeight = curveYMax - curveYMin + STAMP_SIZE;
const stampPoints = resampleByArcLength(scaledCurve, STAMP_COUNT).map((p) => ({
  x: p.x,
  y: p.y - curveYMin + STAMP_SIZE / 2,
}));

const Wrap = styled.div`
  position: absolute;
  left: 50%;
  top: 60%;
  width: 62%;
  transform: translate(-50%, 2px);
  pointer-events: none;
  z-index: -1;
`;

function StampIcon({
  shape,
  x,
  y,
  size,
}: {
  shape: StampShape;
  x: number;
  y: number;
  size: number;
}) {
  const pattern = STAMPS[shape];
  const cols = pattern[0].length;
  const rows = pattern.length;
  const cell = size / cols;
  return (
    <g transform={`translate(${x - size / 2}, ${y - size / 2})`}>
      {pattern.map((row, r) =>
        [...row].map((c, ci) =>
          c === "X" ? (
            <rect
              key={`${r}-${ci}`}
              x={ci * cell}
              y={(r * size) / rows}
              width={cell}
              height={size / rows}
              fill={colors.coolHorizon}
            />
          ) : null,
        ),
      )}
    </g>
  );
}

export function StampTrail() {
  return (
    <Wrap>
      <svg
        viewBox={`0 0 ${CURVE_WIDTH} ${curveHeight}`}
        width="100%"
        style={{
          display: "block",
          overflow: "visible",
          fill: colors.coolHorizon,
        }}
      >
        {stampPoints.map((p, i) => (
          <StampIcon
            key={i}
            shape={STAMP_ORDER[i % STAMP_ORDER.length]}
            x={p.x}
            y={p.y}
            size={STAMP_SIZE}
          />
        ))}
      </svg>
    </Wrap>
  );
}
