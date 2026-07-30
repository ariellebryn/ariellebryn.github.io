import { Global, css } from "@emotion/react";

export const colors = {
  bg: "#FCF8EF", // creamy grayish-white
  text: "#2d3d2f", // dark, desaturated green

  rosyCopper: "#C65F40",
  palmLeaf: "#888E46",
  floralWhite: "#FCF8EF",
  paleAmber: "#D6D360",
  jungleTeal: "#008370",
  periwinkle: "#D0CBEB",
  coolHorizon: "#80B0E7",
  cottonRose: "#FFBFBF",
  mustard: "#F5D244",
  pinkMist: "#F39DC4",
} as const;

const globalStyles = css`
  @font-face {
    font-family: "GraphicoreBitmap";
    src: url("/fonts/graphicoreBitmapFont3-Medium.otf") format("opentype");
    font-weight: normal;
    font-style: normal;
    /* Disable smoothing so pixel/bitmap fonts render crisp */
    font-smooth: never;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body,
  #root {
    margin: 0;
    padding: 0;
    height: 100%;
    cursor: pointer;
  }

  body {
    background-color: ${colors.bg};
    color: ${colors.text};
    cursor: pointer;
  }

  ::selection {
    background: var(--selection-color, ${colors.rosyCopper});
    color: ${colors.bg};
  }
`;

export function GlobalStyles() {
  return <Global styles={globalStyles} />;
}
