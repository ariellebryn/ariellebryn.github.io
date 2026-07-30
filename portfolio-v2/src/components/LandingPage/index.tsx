import styled from "@emotion/styled";
import { colors } from "../../styles/GlobalStyles";
import Name from "../Name";
import { StampTrail } from "./StampTrail";
import type { Tool } from "../DrawingCanvas";

interface Props {
  tool: Tool;
}

const Wrapper = styled.div<{ $interactive: boolean }>`
  position: relative;
  min-height: 80vh;
  padding-top: 100px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  /* While a drawing tool is active, let clicks fall through to the fixed
     canvas behind. In cursor mode, allow normal interaction (e.g. text selection). */
  pointer-events: ${({ $interactive }) => ($interactive ? "auto" : "none")};
`;

const Inner = styled.div`
  max-width: 560px;
  padding: 2rem;
  text-align: left;
`;

const NameWrap = styled.div`
  position: relative;
`;

const Bio = styled.p`
  font-family: "Work Sans", sans-serif;
  font-size: 0.95rem;
  line-height: 1.65;
  color: ${colors.text};
  margin: 0;
`;

export function LandingPage({ tool }: Props) {
  return (
    <Wrapper $interactive={tool === "cursor"}>
      <Inner>
        <NameWrap>
          <StampTrail />

          <Name />
        </NameWrap>
        <Bio>
          Full-stack engineer building <strong>agentic AI systems</strong> and{" "}
          <strong>generative UI</strong> at <strong>Sayari</strong>. Previously
          at <strong>The New York Times</strong>, building the shared{" "}
          <strong>frontend platform</strong> behind newsroom apps: component
          libraries, a <strong>real-time collaborative editor</strong>, a
          GraphQL client. Before that <strong>iOS</strong> at{" "}
          <strong>Instagram</strong> and <strong>Facebook</strong>, on camera
          modes and creator tools.
        </Bio>
      </Inner>
    </Wrapper>
  );
}
