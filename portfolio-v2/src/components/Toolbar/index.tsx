import { useEffect, useState } from "react";
import type { ComponentType, CSSProperties } from "react";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import {
  IconArrowUpLeft,
  IconPencil,
  IconSpray,
  IconEraser,
  IconLineDashed,
  IconFlipHorizontal,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconRubberStamp,
  IconTrash,
  IconArrowUp,
  IconX,
  IconBrush,
} from "@tabler/icons-react";
import { colors } from "../../styles/GlobalStyles";
import { STAMPS } from "../DrawingCanvas";
import type { Tool, StampShape } from "../DrawingCanvas";

// ─── drawing colour palette ───────────────────────────────────────────────────

export const PALETTE = [
  { hex: colors.coolHorizon, name: "cool horizon" },
  { hex: colors.cottonRose, name: "cotton rose" },
  { hex: colors.jungleTeal, name: "jungle teal" },
  { hex: colors.mustard, name: "mustard" },
  { hex: colors.periwinkle, name: "periwinkle" },
  { hex: colors.paleAmber, name: "pale amber" },
  { hex: colors.palmLeaf, name: "palm leaf" },
  { hex: colors.pinkMist, name: "pink mist" },
  { hex: colors.rosyCopper, name: "rosy copper" },
  { hex: colors.text, name: "deep forest" },
] as const;

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
  tool: Tool;
  onToolChange: (t: Tool) => void;
  stampShape: StampShape;
  onStampShapeChange: (s: StampShape) => void;
  color: string;
  onColorChange: (c: string) => void;
  symmetry: boolean;
  onSymmetryToggle: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}

// ─── layout constants ─────────────────────────────────────────────────────────

const CELL = 24; // px — circular button hit target
const ICON = 13; // px — tabler icon size

// ─── tool button definitions ──────────────────────────────────────────────────
// Single source of truth for the tools pill's contents. The scroll-to-top
// button's "normal" resting position is computed from these arrays' lengths
// (via pillWidth below), so adding/removing a button here keeps that
// positioning correct automatically — nothing to hand-tune elsewhere.

type IconComponent = ComponentType<{ size?: number; stroke?: number }>;

interface ToolDef {
  key: string;
  icon: IconComponent;
  label: string;
}

const TOOL_DEFS: ToolDef[] = [
  { key: "cursor", icon: IconArrowUpLeft, label: "cursor ↖" },
  { key: "pencil", icon: IconPencil, label: "pencil ✎" },
  { key: "spray", icon: IconSpray, label: "spray can ✺" },
  { key: "eraser", icon: IconEraser, label: "eraser ⌫" },
  { key: "stamp", icon: IconRubberStamp, label: "stamps ✿" },
  { key: "dots", icon: IconLineDashed, label: "dotted line ⋯" },
  { key: "mirror", icon: IconFlipHorizontal, label: "mirror mode ⇋" },
];

const HISTORY_DEFS: ToolDef[] = [
  { key: "undo", icon: IconArrowBackUp, label: "oops, undo" },
  { key: "redo", icon: IconArrowForwardUp, label: "nvm, redo" },
];

const UTILITY_DEFS: ToolDef[] = [
  { key: "clear", icon: IconTrash, label: "clear canvas" },
];

const TOOL_GROUPS = [TOOL_DEFS, HISTORY_DEFS, UTILITY_DEFS];
const TOOLS_BUTTON_COUNT = TOOL_GROUPS.reduce((n, g) => n + g.length, 0);
const TOOLS_DIVIDER_COUNT = TOOL_GROUPS.length - 1; // one divider between each group

// ─── toolbar row width (derived, not measured) ────────────────────────────────
// The toolbar's rendered width is fully determined by fixed CSS box-model
// constants (button size, padding, gaps, dividers) — never by runtime DOM
// state — so we can compute it once here and compare it against
// window.innerWidth to decide whether the row needs to scroll horizontally.

const PILL_PADDING = 4; // px, each side
const PILL_BORDER = 1; // px, each side — only on the light (non-$dark) pill
const PILL_GAP = 1; // px — Pill's own flex `gap`, between every direct child
const DIVIDER_WIDTH = 1; // px
const DIVIDER_MARGIN = 3; // px, each side
const TOOLBAR_ROW_GAP = 8; // px — gap between every direct child of ToolbarContainer

function pillWidth({
  buttons,
  dividers = 0,
  bordered = false,
}: {
  buttons: number;
  dividers?: number;
  bordered?: boolean;
}) {
  const children = buttons + dividers;
  const gaps = Math.max(children - 1, 0) * PILL_GAP;
  const content =
    buttons * CELL + dividers * (DIVIDER_WIDTH + DIVIDER_MARGIN * 2);
  const padding = PILL_PADDING * 2;
  const border = bordered ? PILL_BORDER * 2 : 0;
  return padding + border + content + gaps;
}

const TOOLS_PILL_WIDTH = pillWidth({
  buttons: TOOLS_BUTTON_COUNT,
  dividers: TOOLS_DIVIDER_COUNT,
  bordered: false,
});
const COLOR_PILL_WIDTH = pillWidth({ buttons: PALETTE.length, bordered: true });
const TOGGLE_WIDTH = CELL + 8; // matches ToggleBtn's own size formula
const SCROLL_PILL_WIDTH = pillWidth({ buttons: 1 }); // the lone scroll-to-top pill

// Desktop pills group's total on-screen width (tools + gap + colour), used to
// derive the scroll button's "open" resting spot just left of that group.
const DESKTOP_PILLS_WIDTH =
  TOOLS_PILL_WIDTH + TOOLBAR_ROW_GAP + COLOR_PILL_WIDTH;
const CONTAINER_PADDING_X = 12; // px — ToolbarContainer's own left/right padding

// Mobile: colour palette collapses into one extra button (+ its own divider)
// inside the tools pill instead of living in a separate pill, so the pill
// itself is wider than the desktop TOOLS_PILL_WIDTH.
const MOBILE_TOOLS_PILL_WIDTH = pillWidth({
  buttons: TOOLS_BUTTON_COUNT + 1,
  dividers: TOOLS_DIVIDER_COUNT + 1,
  bordered: false,
});

// ToolbarContainer is a 3-item flex row — [Spacer][pills group][toggle] — with
// justify-content:space-between, so the toggle always sits at the container's
// right edge and a transparent Spacer (equal to the toggle's own width) on the
// left keeps the pills group visually centered between them. The scroll-to-top
// button is NOT a flex child: it's absolutely positioned (out of flow, so it
// never disturbs this centering) and slid between two derived x-positions —
// right of the pills while open, left of the toggle while hidden. Below the
// point where all items no longer fit, space-between falls back to packing them
// together (with the scrollbar taking over) — see ToolbarContainer's comment.
const TOOLBAR_WIDTH =
  TOGGLE_WIDTH +
  TOOLBAR_ROW_GAP +
  TOOLS_PILL_WIDTH +
  TOOLBAR_ROW_GAP +
  COLOR_PILL_WIDTH +
  TOOLBAR_ROW_GAP +
  TOGGLE_WIDTH;

const MOBILE_TOOLBAR_WIDTH =
  TOGGLE_WIDTH + TOOLBAR_ROW_GAP + MOBILE_TOOLS_PILL_WIDTH + TOOLBAR_ROW_GAP + TOGGLE_WIDTH;

// ─── styles ───────────────────────────────────────────────────────────────────

const ToolbarContainer = styled.div<{ $scrollable: boolean }>`
  width: 100%;
  padding: 0 12px 0 12px;
  position: fixed;
  top: 25px;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  /* Spacer / pills-group / toggle are pushed to the two ends, with the
     Spacer (same width as the toggle) balancing it so the pills group reads
     as centered. Once the row is too narrow to fit all three with room to
     spare, space-between has no slack left to distribute and the browser's
     "safe" fallback packs them like flex-start instead — which is exactly
     the horizontally-scrolling, tightly-packed layout we want at that size. */
  justify-content: space-between;
  gap: 8px;
  /* Tall on purpose: tooltips and flyouts pop out *below* their trigger
     button via position:absolute, and CSS won't let overflow-x:auto sit next
     to a genuinely "visible" overflow-y — the moment one axis stops being
     visible, the browser forces the other to auto too, which clips anything
     poking out past the box's own height. Giving the row a generous fixed
     height means every popup's extent still fits inside that height, so the
     forced overflow-y:auto never actually has anything to clip.
     align-items:flex-start keeps the (short) pills from stretching to fill it. */
  height: 260px;
  /* The row spans the full width (minus margins) and is invisible/oversized
     past its pills, so it must not swallow clicks meant for the page
     underneath — only its actual (explicitly opted-in) children are
     interactive; see Pill and TipWrapper below. */
  pointer-events: none;

  /* If the viewport's narrower than the toolbar's natural width, scroll
     instead of clipping or squishing the buttons. $scrollable is computed
     from the known TOOLBAR_WIDTH constant vs. window.innerWidth — NOT from
     native overflow auto-detection, which would false-positive here: hidden
     tooltips are position:absolute and still count toward scrollWidth even
     at opacity:0, so a plain overflow-x:auto thinks there's overflow to
     scroll even when the visible toolbar fits comfortably. */
  ${({ $scrollable }) => ($scrollable ? "overflow-x: auto;" : "")}

  /* Scroll works, scrollbar itself just doesn't render. */
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

/** Transparent, non-interactive — exists only to balance the toggle button's
 * width so the pills group between them reads as visually centered. */
const Spacer = styled.div`
  width: ${TOGGLE_WIDTH}px;
  flex-shrink: 0;
`;

const PillsGroup = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-shrink: 0;
`;

/**
 * Shrinks a pill's own layout box away (not just its opacity) when the
 * toolbar's hidden, so the row visibly closes up instead of leaving a dead
 * gap where the pill used to be. $width is the pill's own known, derived
 * width (TOOLS_PILL_WIDTH / COLOR_PILL_WIDTH / MOBILE_TOOLS_PILL_WIDTH), so
 * nothing here is measured. overflow only switches to hidden while actually
 * hidden — while open it stays visible so the stamp/colour flyouts
 * (position:absolute, taller than the pill itself) aren't clipped, which is
 * safe since those flyouts can only be open while the toolbar itself is open.
 */
const CollapsibleWrap = styled.div<{ $hidden: boolean; $width: number }>`
  max-width: ${({ $hidden, $width }) => ($hidden ? "0px" : `${$width}px`)};
  overflow: ${({ $hidden }) => ($hidden ? "hidden" : "visible")};
  flex-shrink: 0;
  transition: max-width 220ms ease;
`;

const Pill = styled.div<{ $dark?: boolean }>`
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 4px;
  border-radius: 999px;
  background: ${({ $dark }) => ($dark ? colors.text : colors.bg)};
  border: ${({ $dark }) => ($dark ? "none" : `1px solid ${colors.text}`)};
  box-shadow: 0 3px 9px rgba(0, 0, 0, 0.16);
  flex-shrink: 0;
  pointer-events: auto;
`;

const GroupDivider = styled.div`
  width: 1px;
  height: 11px;
  background: ${colors.bg};
  opacity: 0.25;
  margin: 0 3px;
  flex-shrink: 0;
`;

const ToolBtn = styled.button<{ $active: boolean; $disabled?: boolean }>`
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${CELL}px;
  height: ${CELL}px;
  border-radius: 50%;
  color: ${colors.bg};
  background: ${({ $active }) => ($active ? colors.rosyCopper : "transparent")};
  cursor: ${({ $disabled }) => ($disabled ? "default" : "pointer")};
  opacity: ${({ $disabled }) => ($disabled ? 0.3 : 1)};
  flex-shrink: 0;
  transition:
    background 100ms,
    transform 100ms;
  pointer-events: ${({ $disabled }) => ($disabled ? "none" : "auto")};

  &:hover {
    background: ${({ $active }) =>
      $active ? colors.rosyCopper : "rgba(255, 255, 255, 0.12)"};
  }

  &:active {
    transform: scale(0.92);
  }
`;

const Swatch = styled.button<{ $color: string; $active: boolean }>`
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${CELL}px;
  height: ${CELL}px;
  flex-shrink: 0;
  cursor: pointer;

  &::after {
    content: "";
    width: ${CELL - 8}px;
    height: ${CELL - 8}px;
    border-radius: 50%;
    background: ${({ $color }) => $color};
    box-shadow: ${({ $active }) =>
      $active ? `0 0 0 1px ${colors.bg}, 0 0 0 2px ${colors.text}` : "none"};
    transition:
      transform 100ms,
      box-shadow 100ms;
  }

  &:hover::after {
    transform: scale(1.15);
  }
`;

/** Stamp-shape cells inside the flyout — same circular button, smaller pill */
const ShapeBtn = ToolBtn;

/** Renders the exact bitmap pattern that tool stamps onto the canvas */
function StampPreview({ shape }: { shape: StampShape }) {
  const pattern = STAMPS[shape];
  const cols = pattern[0].length;
  const rows = pattern.length;
  return (
    <svg
      width={ICON}
      height={ICON}
      viewBox={`0 0 ${cols} ${rows}`}
      shapeRendering="crispEdges"
    >
      {pattern.map((row, r) =>
        [...row].map((cell, c) =>
          cell === "X" ? (
            <rect
              key={`${r}-${c}`}
              x={c}
              y={r}
              width={1}
              height={1}
              fill="currentColor"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

const flyoutIn = keyframes`
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const StampFlyout = styled.div`
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  z-index: 4;
  animation: ${flyoutIn} 150ms ease-out;
`;

/**
 * Mobile-only colour picker flyout. Anchored to the tools pill's right edge
 * (StampFlyout anchors left) so the two never overlap if both are open.
 */
const ColorFlyout = styled.div`
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  z-index: 4;
  animation: ${flyoutIn} 150ms ease-out;
`;

/** Mobile-only: shows the current colour, opens ColorFlyout to change it */
const ColorPreviewBtn = styled.button<{ $color: string }>`
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${CELL}px;
  height: ${CELL}px;
  flex-shrink: 0;
  cursor: pointer;

  &::after {
    content: "";
    width: ${CELL - 8}px;
    height: ${CELL - 8}px;
    border-radius: 50%;
    background: ${({ $color }) => $color};
    box-shadow: 0 0 0 1px ${colors.bg};
    transition: transform 100ms;
  }

  &:active::after {
    transform: scale(0.92);
  }
`;

// ─── tooltip ──────────────────────────────────────────────────────────────────

const TipWrapper = styled.span`
  position: relative;
  display: inline-flex;
  pointer-events: auto;
`;

const TipBubble = styled.span<{ $show: boolean; $align?: "center" | "right" }>`
  position: absolute;
  top: calc(100% + 10px);
  ${({ $align }) =>
    $align === "right" ? "right: 0; left: auto;" : "left: 50%;"}
  transform: ${({ $show, $align }) => {
    const center = $align === "right" ? "" : "translateX(-50%) ";
    return `${center}${$show ? "translateY(0)" : "translateY(-2px)"}`;
  }};
  padding: 4px 11px;
  border-radius: 999px;
  background: ${colors.text};
  color: ${colors.bg};
  font-family: "Courier New", Courier, monospace;
  font-size: 0.8rem;
  white-space: nowrap;
  pointer-events: none;
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  transition:
    opacity 120ms,
    transform 120ms;
  z-index: 5;

  &::after {
    content: "";
    position: absolute;
    bottom: 100%;
    ${({ $align }) =>
      $align === "right" ? "right: 12px; left: auto;" : "left: 50%;"}
    transform: ${({ $align }) =>
      $align === "right" ? "none" : "translateX(-50%)"};
    width: 8px;
    height: 8px;
    background: ${colors.text};
    clip-path: polygon(50% 0, 100% 100%, 0 100%);
  }
`;

function Tip({
  label,
  children,
  align,
}: {
  label: string;
  children: React.ReactNode;
  align?: "center" | "right";
}) {
  const [show, setShow] = useState(false);
  return (
    <TipWrapper
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      <TipBubble $show={show} $align={align}>
        {label}
      </TipBubble>
    </TipWrapper>
  );
}

// ─── scroll-to-top pill ─────────────────────────────────────────────────────────

/**
 * Desktop: absolutely positioned inside ToolbarContainer (out of the flex
 * flow, so it never affects the pills' centering) and slid horizontally by
 * animating `left`. Its two resting x-positions are derived from
 * window.innerWidth + the known pill/toggle widths (no DOM measuring): just
 * right of the centred pills group while the toolbar's open, and just left of
 * the toggle once it's hidden. The `left` transition is timed to the pills'
 * max-width collapse so the slide and the collapse read as one motion. opacity
 * + scale handle its scroll-triggered fade-in independently of the slide.
 */
const ScrollTopFloat = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 0;
  z-index: 3;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: ${({ $visible }) => ($visible ? "scale(1)" : "scale(0.85)")};
  pointer-events: ${({ $visible }) => ($visible ? "auto" : "none")};
  transition:
    left 220ms ease,
    opacity 150ms ease-out,
    transform 150ms ease-out;
`;

/**
 * Mobile: rendered outside ToolbarContainer entirely, bottom-right corner —
 * a deliberately different (thumb-reachable) resting spot than desktop's
 * in-row placement. ToolbarContainer always carries a transform (for
 * centering), which would make it the containing block for a nested
 * position:fixed child — pinning this to the toolbar's own small box
 * instead of the viewport. Rendering it as a top-level sibling avoids that,
 * so right/bottom resolve against the true viewport.
 */
const ScrollTopWrapMobile = styled.div<{ $visible: boolean }>`
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 2;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: ${({ $visible }) => ($visible ? "scale(1)" : "scale(0.85)")};
  pointer-events: ${({ $visible }) => ($visible ? "auto" : "none")};
  transition:
    opacity 150ms ease-out,
    transform 150ms ease-out;
`;

// ─── visibility toggle ──────────────────────────────────────────────────────────

/** Outline (toolbar visible) vs. filled (toolbar hidden) standalone toggle */
const ToggleBtn = styled.button<{ $filled: boolean }>`
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${CELL + 8}px;
  height: ${CELL + 8}px;
  border-radius: 50%;
  border: 1px solid ${colors.text};
  background: ${({ $filled }) => ($filled ? colors.text : colors.bg)};
  color: ${({ $filled }) => ($filled ? colors.bg : colors.text)};
  cursor: pointer;
  box-shadow: 0 3px 9px rgba(0, 0, 0, 0.16);
  transition:
    background 100ms,
    color 100ms,
    transform 100ms;

  &:active {
    transform: scale(0.92);
  }
`;

/** Little pop-in when the toggle icon swaps between X and brush */
const IconPop = styled.span`
  display: flex;
  animation: ${keyframes`
    from { transform: scale(0.5) rotate(-45deg); opacity: 0; }
    to   { transform: scale(1) rotate(0); opacity: 1; }
  `} 200ms ease-out;
`;

// ─── component ────────────────────────────────────────────────────────────────

export function Toolbar({
  tool,
  onToolChange,
  stampShape,
  onStampShapeChange,
  color,
  onColorChange,
  symmetry,
  onSymmetryToggle,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
}: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [stampMenuOpen, setStampMenuOpen] = useState(false);
  const [needsScroll, setNeedsScroll] = useState(false);
  const [winWidth, setWinWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );

  useEffect(() => {
    const onScroll = () =>
      setScrolled(window.scrollY > window.innerHeight * 0.5);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 730px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Don't leave the flyout open (with no visible trigger) if the viewport grows
  useEffect(() => {
    if (!isMobile) setColorMenuOpen(false);
  }, [isMobile]);

  // Whether the toolbar needs to scroll horizontally — compared against the
  // known TOOLBAR_WIDTH/MOBILE_TOOLBAR_WIDTH constants (not native overflow
  // detection, which false-positives on invisible tooltips — see
  // ToolbarContainer's comment).
  useEffect(() => {
    const threshold = (isMobile ? MOBILE_TOOLBAR_WIDTH : TOOLBAR_WIDTH) + 24;
    const check = () => {
      setNeedsScroll(window.innerWidth < threshold);
      setWinWidth(window.innerWidth);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [isMobile]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const currentColorName =
    PALETTE.find((c) => c.hex === color)?.name ?? "color";

  // Desktop scroll button's slid x-position (its left edge, measured from the
  // container's padding box i.e. viewport x=0). Both endpoints are derived from
  // the viewport width + known widths, never measured. "open" = one row-gap
  // right of the centred pills group; "hidden"/scrolling = one row-gap left of
  // the toggle (which itself sits a container-padding in from the right edge).
  const scrollLeftHidden =
    winWidth -
    CONTAINER_PADDING_X -
    TOGGLE_WIDTH -
    TOOLBAR_ROW_GAP -
    SCROLL_PILL_WIDTH;
  const scrollLeftOpen =
    winWidth / 2 + DESKTOP_PILLS_WIDTH / 2 + TOOLBAR_ROW_GAP;
  // While the row is packed/scrolling there's no centred pills group to hug, so
  // keep the button in its by-the-toggle spot.
  const scrollLeft =
    hidden || needsScroll ? scrollLeftHidden : scrollLeftOpen;

  const scrollTopButton = (
    <Pill $dark>
      <Tip label="back to top">
        <ToolBtn $active={false} onClick={scrollToTop}>
          <IconArrowUp size={ICON} stroke={1.75} />
        </ToolBtn>
      </Tip>
    </Pill>
  );

  // Any non-stamp tool closes both flyouts
  const selectTool = (t: Tool) => {
    onToolChange(t);
    setStampMenuOpen(false);
    setColorMenuOpen(false);
  };

  // Stamp button toggles its own flyout instead of always showing it while
  // the stamp tool is active — click again (or select a different tool) to
  // close it without losing the tool selection.
  const selectStamp = () => {
    if (tool === "stamp") {
      setStampMenuOpen((o) => !o);
    } else {
      onToolChange("stamp");
      setStampMenuOpen(true);
    }
    setColorMenuOpen(false);
  };

  const toggleColorMenu = () => {
    setColorMenuOpen((o) => !o);
    setStampMenuOpen(false);
  };

  // Animated open/close for the tools & colour pills — opacity/transform
  // instead of visibility so the transition is actually visible; pointer
  // events are cut immediately so a hidden pill can't be clicked mid-fade.
  const collapseStyle: CSSProperties = {
    opacity: hidden ? 0 : 1,
    transform: hidden
      ? "translateY(-6px) scale(0.96)"
      : "translateY(0) scale(1)",
    transition: "opacity 200ms ease, transform 200ms ease",
    pointerEvents: hidden ? "none" : "auto",
  };

  return (
    <>
      <ToolbarContainer $scrollable={needsScroll}>
        {!needsScroll && <Spacer />}

        <PillsGroup>
          {/* ── tools pill ── */}
          <CollapsibleWrap
            $hidden={hidden}
            $width={isMobile ? MOBILE_TOOLS_PILL_WIDTH : TOOLS_PILL_WIDTH}
          >
          <Pill $dark style={{ position: "relative", ...collapseStyle }}>
            {TOOL_DEFS.map((def) => {
              const Icon = def.icon;
              if (def.key === "mirror") {
                return (
                  <Tip key={def.key} label={def.label}>
                    <ToolBtn $active={symmetry} onClick={onSymmetryToggle}>
                      <Icon size={ICON} stroke={1.75} />
                    </ToolBtn>
                  </Tip>
                );
              }
              const t = def.key as Tool;
              const onClick = t === "stamp" ? selectStamp : () => selectTool(t);
              return (
                <Tip key={def.key} label={def.label}>
                  <ToolBtn $active={tool === t} onClick={onClick}>
                    <Icon size={ICON} stroke={1.75} />
                  </ToolBtn>
                </Tip>
              );
            })}

            <GroupDivider />

            {HISTORY_DEFS.map((def) => {
              const Icon = def.icon;
              const isUndo = def.key === "undo";
              return (
                <Tip key={def.key} label={def.label}>
                  <ToolBtn
                    $active={false}
                    $disabled={isUndo ? !canUndo : !canRedo}
                    onClick={isUndo ? onUndo : onRedo}
                  >
                    <Icon size={ICON} stroke={1.75} />
                  </ToolBtn>
                </Tip>
              );
            })}

            <GroupDivider />

            {UTILITY_DEFS.map((def) => {
              const Icon = def.icon;
              return (
                <Tip key={def.key} label={def.label}>
                  <ToolBtn $active={false} onClick={onClear}>
                    <Icon size={ICON} stroke={1.75} />
                  </ToolBtn>
                </Tip>
              );
            })}

            {/* ── stamp shape flyout ── */}
            {tool === "stamp" && stampMenuOpen && (
              <StampFlyout>
                <Pill $dark>
                  <Tip label="sparkle">
                    <ShapeBtn
                      $active={stampShape === "star"}
                      onClick={() => onStampShapeChange("star")}
                    >
                      <StampPreview shape="star" />
                    </ShapeBtn>
                  </Tip>
                  <Tip label="heart">
                    <ShapeBtn
                      $active={stampShape === "heart"}
                      onClick={() => onStampShapeChange("heart")}
                    >
                      <StampPreview shape="heart" />
                    </ShapeBtn>
                  </Tip>
                  <Tip label="gem">
                    <ShapeBtn
                      $active={stampShape === "diamond"}
                      onClick={() => onStampShapeChange("diamond")}
                    >
                      <StampPreview shape="diamond" />
                    </ShapeBtn>
                  </Tip>
                  <Tip label="lil x">
                    <ShapeBtn
                      $active={stampShape === "x"}
                      onClick={() => onStampShapeChange("x")}
                    >
                      <StampPreview shape="x" />
                    </ShapeBtn>
                  </Tip>
                </Pill>
              </StampFlyout>
            )}

            {/* ── mobile-only: colour palette collapses into a single button ── */}
            {isMobile && (
              <>
                <GroupDivider />
                <Tip label={`color: ${currentColorName}`}>
                  <ColorPreviewBtn $color={color} onClick={toggleColorMenu} />
                </Tip>
              </>
            )}

            {isMobile && colorMenuOpen && (
              <ColorFlyout>
                <Pill>
                  {PALETTE.map((c) => (
                    <Tip key={c.hex} label={c.name}>
                      <Swatch
                        $color={c.hex}
                        $active={color === c.hex}
                        onClick={() => {
                          onColorChange(c.hex);
                          setColorMenuOpen(false);
                        }}
                      />
                    </Tip>
                  ))}
                </Pill>
              </ColorFlyout>
            )}
          </Pill>
          </CollapsibleWrap>

          {/* ── colour palette pill (desktop only — collapses into a button on mobile) ── */}
          {!isMobile && (
            <CollapsibleWrap $hidden={hidden} $width={COLOR_PILL_WIDTH}>
              <Pill style={collapseStyle}>
                {PALETTE.map((c) => (
                  <Tip key={c.hex} label={c.name}>
                    <Swatch
                      $color={c.hex}
                      $active={color === c.hex}
                      onClick={() => onColorChange(c.hex)}
                    />
                  </Tip>
                ))}
              </Pill>
            </CollapsibleWrap>
          )}

        </PillsGroup>

        {/* ── visibility toggle — always visible, not affected by $hidden ── */}
        <Tip label={hidden ? "i wanna paint" : "no paint"} align="right">
          <ToggleBtn
            $filled={hidden}
            onClick={() => {
              const next = !hidden;
              setHidden(next);
              // Don't leave a drawing tool active while the toolbar's hidden
              if (next) onToolChange("cursor");
            }}
          >
            <IconPop key={hidden ? "brush" : "x"}>
              {hidden ? (
                <IconBrush size={ICON} stroke={1.75} />
              ) : (
                <IconX size={ICON} stroke={1.75} />
              )}
            </IconPop>
          </ToggleBtn>
        </Tip>

        {/* ── scroll-to-top: floated (out of flow) so it never affects the
             pills' centering; slides between left-of-pills and left-of-toggle.
             Desktop only — mobile keeps its own bottom-right spot. ── */}
        {!isMobile && (
          <ScrollTopFloat $visible={scrolled} style={{ left: `${scrollLeft}px` }}>
            {scrollTopButton}
          </ScrollTopFloat>
        )}
      </ToolbarContainer>

      {isMobile && (
        <ScrollTopWrapMobile $visible={scrolled}>
          {scrollTopButton}
        </ScrollTopWrapMobile>
      )}
    </>
  );
}
