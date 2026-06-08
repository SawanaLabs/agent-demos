import { describe, expect, it } from "vitest";
import {
  pickRandomDemoDestination,
  type RandomDemoDestination,
} from "./random-demo-button";

const destinations: RandomDemoDestination[] = [
  {
    href: "/demos/foundation-chat",
    patternLabel: "Foundation",
    slug: "foundation-chat",
    source: "features/foundation-chat",
    summary: "A basic chat demo.",
    title: "Foundation Chat",
  },
  {
    href: "/demos/rag-chatbot",
    patternLabel: "RAG",
    slug: "rag-chatbot",
    source: "features/rag-chatbot",
    summary: "A retrieval chat demo.",
    title: "RAG Chatbot",
  },
  {
    href: "/demos/ultra-chatbot-agent",
    patternLabel: "Tools",
    slug: "ultra-chatbot-agent",
    source: "features/ultra-chatbot-agent",
    summary: "A full agent demo.",
    title: "Ultra Chatbot Agent",
  },
];

describe("pickRandomDemoDestination", () => {
  it("maps random values into the available ready demo destinations", () => {
    expect(pickRandomDemoDestination(destinations, () => 0)).toBe(
      destinations[0]
    );
    expect(pickRandomDemoDestination(destinations, () => 0.5)).toBe(
      destinations[1]
    );
    expect(pickRandomDemoDestination(destinations, () => 0.999)).toBe(
      destinations[2]
    );
  });

  it("excludes the current destination when another ready demo is available", () => {
    expect(
      pickRandomDemoDestination(destinations, () => 0, "/demos/foundation-chat")
    ).toBe(destinations[1]);
  });

  it("keeps the current destination eligible when it is the only ready demo", () => {
    const firstDestination = destinations[0];

    if (!firstDestination) {
      throw new Error("Expected the random demo fixture to include one item.");
    }

    expect(
      pickRandomDemoDestination(
        [firstDestination],
        () => 0,
        "/demos/foundation-chat"
      )
    ).toBe(firstDestination);
  });

  it("throws when there are no ready demo destinations", () => {
    expect(() => pickRandomDemoDestination([], () => 0)).toThrow(
      "Random demo button requires at least one ready demo."
    );
  });
});
