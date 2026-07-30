import { css } from "@emotion/react";
import { colors } from "../styles/GlobalStyles";

const styles = {
  container: css`
    font-size: 3rem;
    font-weight: normal;
    color: ${colors.text};
    margin: 0 0 1.25rem 0;
    line-height: 1.1;
    letter-spacing: 0.01em;
    text-align: center;
    z-index: 1;
  `,
  serif: css`
    font-family: "Spectral", serif;
    font-style: italic;
  `,
  mono: css`
    font-family: "Geist Pixel", sans-serif;
    font-size: 2.7rem;
    /* Keep the pixel font crisp/jagged; everything else on the page stays smooth */
    -webkit-font-smoothing: none;
    -moz-osx-font-smoothing: unset;
  `,
};

const Mono = ({ children }: { children: String }) => {
  return <span css={styles.mono}>{children}</span>;
};

const Serif = ({ children }: { children: String }) => {
  return <span css={styles.serif}>{children}</span>;
};

const Name = () => {
  return (
    <div css={styles.container}>
      <Serif>ari</Serif>
      <Mono>elle</Mono> <Serif>c</Serif>
      <Mono>ha</Mono>
      <Serif>pin</Serif>
    </div>
  );
};

export default Name;
