import styled from "@emotion/styled";
import { colors } from "../../styles/GlobalStyles";
import { ProjectItem } from "../ProjectItem";
import { PALETTE } from "../Toolbar";
import type { Tool } from "../DrawingCanvas";

interface Props {
  tool: Tool;
}

const Section = styled.section<{ $interactive: boolean }>`
  position: relative;
  z-index: 1;
  max-width: 640px;
  margin: 0 auto;
  padding: 4rem 2rem 6rem;
  background: transparent;
  /* While a drawing tool is active, let clicks fall through to the fixed
     canvas behind — you can draw underneath this section. */
  pointer-events: ${({ $interactive }) => ($interactive ? "auto" : "none")};

  @media (min-width: 720px) {
    max-width: 880px;
  }
`;

const Heading = styled.h2`
  margin: 0 0 2rem;
  font-family: "Courier New", Courier, monospace;
  font-size: 0.8rem;
  font-weight: normal;
  letter-spacing: 0.08em;
  text-transform: lowercase;
  color: ${colors.text};
  opacity: 0.6;
`;

const List = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2.5rem 2rem;
`;

const Cell = styled.div`
  flex: 1 1 100%;

  @media (min-width: 720px) {
    flex: 1 1 calc(50% - 1rem);
  }
`;

const projects = [
  //   {
  //     name: "Marginalia",
  //     category: "side project",
  //     description: (
  //       <>
  //         Server-owned context management, swappable model providers, background
  //         concept extraction, Langfuse tracing. An agent that reads with you.{" "}
  //         <a href="#">Live</a> · <a href="#">Repo</a>
  //       </>
  //     ),
  //   },
  {
    name: "Sayari",
    category: "current role",
    description: (
      <ul>
        <li>
          <b>current role: senior software engineer</b> building pre-production
          agent harness, with a focus on generative ui subagents (generating
          analytic dashboards and due diligence reporting)
        </li>
        <li>
          previous work includes{" "}
          <a
            href="https://sayari.com/platform/graph/#supply-chain-mapping:~:text=from%20the%20visualization.-,SUPPLY%20CHAIN%20MAPPING,-PREMIUM%20ADD%2DON"
            target="_blank"
            rel="noreferrer"
          >
            building large supply chains in an interactive graph
          </a>
          , with a focus on efficient data processing to increase performance
        </li>
      </ul>
    ),
  },
  {
    name: "critter grid game",
    category: "side project",
    description: (
      <>
        <ul>
          <li>deductive logic puzzle game (think sudoku!) for the browser</li>
          <li>built with react + typescript</li>
        </ul>
        <a href="https://crittergrid.com/" target="_blank" rel="noreferrer">
          Play it
        </a>
      </>
    ),
  },
  {
    name: "reader",
    category: "side project",
    description: (
      <>
        <ul>
          <li>
            chrome extension (private, built for a friend ✨) that tracks the
            articles you read, finds connections in your reading patterns,
            provides data visualizations
          </li>
          <li>
            a monthly "wrapped" that shows your favorite authors, rabbit holes
            you got into, etc
          </li>
          <li>
            uses a local browser-based LLM to identify when a page is an
            article, assign topics and tags, and build out "rabbit holes"
          </li>
        </ul>
        (blog post pending)
      </>
    ),
  },
  {
    name: "NYT frontend platform",
    category: "previous role",
    description: (
      <>
        worked on a new frontend platform for publishing tools:
        <ul>
          <li>
            a query client built on top of Apollo with custom codegen for
            GraphQL queries
          </li>
          <li>a collaborative text editor built in React with Prosemirror</li>
          <li>
            maintained and contributed to the React component library used by
            all publishing teams (accessible, with a descriptive Storybook)
          </li>
        </ul>
      </>
    ),
  },
  {
    name: "mosaicJS",
    category: "side project",
    description: (
      <ul>
        <li>
          layout plugin that allows a developer to pin specific blocks in a grid
          and have remaining blocks flow automatically around the pinned ones
        </li>
        <li>
          originally built in jQuery, rebuilt with newer CSS grid functionality
        </li>
        <a
          href="http://ariellechapin.com/mosaic/"
          target="_blank"
          rel="noreferrer"
        >
          View it
        </a>
      </ul>
    ),
  },
  {
    name: "Instagram + Facebook",
    category: "previous role",
    description: (
      <>
        <ul>
          <li>
            iOS engineer, built instagram camera formats (
            <a
              href="https://www.engadget.com/2019-12-17-instagram-stories-layout-feature.html"
              target="_blank"
              rel="noreferrer"
            >
              Layout
            </a>
            , Dual Camera) for use in instagram stories
          </li>
          <li>
            worked on Facebook Group features, such as{" "}
            <a
              href="https://www.digitalinformationworld.com/2019/08/facebook-more-new-badges-pages.html"
              target="_blank"
              rel="noreferrer"
            >
              badges
            </a>
            , for iOS and across the stack
          </li>
        </ul>
      </>
    ),
  },
  {
    name: "Talk Climate Change",
    category: "freelance",
    description: (
      <>
        Built on the idea that the biggest barrier to climate action is the
        assumption that nobody else is talking about it. Walks people through
        having a real conversation about climate change with someone outside
        their usual circle then logs it to a live, interactive map alongside
        everyone else's.
        <br />
        <a
          href="https://talkclimatechange.org/"
          target="_blank"
          rel="noreferrer"
        >
          View it
        </a>
      </>
    ),
  },
  {
    name: "delve",
    category: "side project",
    description: (
      <>
        A series of history video essays — research, scripting, and editing, all
        self-taught. <br />
        <a href="https://vimeo.com/464018809" target="_blank" rel="noreferrer">
          Watch
        </a>
      </>
    ),
  },
  {
    name: "imprint",
    category: "academic",
    description: (
      <>
        HCI Honors Thesis, shown at{" "}
        <a
          href="https://tei.acm.org/2017/cp-sdc.php"
          target="_blank"
          rel="noreferrer"
        >
          the 2017 TEI conference Student Design Challenge
        </a>
        :
        <ul>
          <li>
            developed a prototype wall of motorized blocks that reconfigure into
            custom 3D surfaces
          </li>
          <li>
            evaluated how manual vs. automated and touch vs. touchless controls
            impact user comfort and control
          </li>
          <li>
            discovered that while "magical" manual interaction is highly
            engaging, automated extension and retraction initiated without
            physical contact is preferred for everyday convenience
          </li>
        </ul>
        <a
          href="/Imprint__Exploring_Interaction_with_Dynamic_Interiors.pdf"
          target="_blank"
          rel="noreferrer"
        >
          PDF
        </a>{" "}
        ·{" "}
        <a
          href="https://dl.acm.org/doi/10.1145/3024969.3035532"
          target="_blank"
          rel="noreferrer"
        >
          ACM DL
        </a>
      </>
    ),
  },
  {
    name: "zest",
    category: "academic",
    description: (
      <>
        A computer-vision spice kiosk that recommends what to add to your food —
        ideated, iterated, and built with a group for a design course. Featured
        on{" "}
        <a
          href="https://www.core77.com/projects/66414/A-Spice-Station-Designed-to-Encourage-College-Students-to-Experiment-in-the-Kitchen"
          target="_blank"
          rel="noreferrer"
        >
          Core77
        </a>
        .
      </>
    ),
  },
];

export function Projects({ tool }: Props) {
  return (
    <Section $interactive={tool === "cursor"}>
      <Heading>selected work</Heading>
      <List>
        {projects.map((p, i) => (
          <Cell key={p.name}>
            <ProjectItem
              name={p.name}
              accent={PALETTE[i % PALETTE.length].hex}
              category={p.category}
            >
              {p.description}
            </ProjectItem>
          </Cell>
        ))}
      </List>
    </Section>
  );
}
