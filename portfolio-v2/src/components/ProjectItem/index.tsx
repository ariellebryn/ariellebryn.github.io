import type { ReactNode } from "react";
import styled from "@emotion/styled";
import { colors } from "../../styles/GlobalStyles";

interface Props {
  name: string;
  accent: string;
  /** e.g. "current role", "previous role", "side project", "academic" */
  category: string;
  children: ReactNode;
}

const Item = styled.div<{ $accent: string }>`
  font-family: "Work Sans", sans-serif;
  border-top: 1px solid ${({ $accent }) => $accent};
  padding-top: 0.45rem;
`;

const Header = styled.div`
  font-family: "Geist Pixel", monospace;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
`;

const Category = styled.span`
  font-family: "Courier New", Courier, monospace;
  font-size: 0.9rem;
  letter-spacing: 0.02em;
  color: ${colors.text};
  opacity: 1;
  flex-shrink: 0;
`;

const Name = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: bold;
  letter-spacing: 0.02em;
  color: ${colors.text};
  text-align: right;
`;

const Description = styled.div`
  margin: 0.8rem 0 0;
  font-size: 0.95rem;
  line-height: 1.65;
  color: ${colors.text};

  ul {
    margin: 0.3rem 0;
    padding-left: 1.1rem;
  }

  li + li {
    margin-top: 0.3rem;
  }

  a {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 2px;

    &:hover {
      opacity: 0.7;
    }
  }
`;

export function ProjectItem({ name, accent, category, children }: Props) {
  return (
    <Item $accent={accent}>
      <Header>
        <Name>{name}</Name>
        <Category>{category}</Category>
      </Header>
      <Description>{children}</Description>
    </Item>
  );
}
