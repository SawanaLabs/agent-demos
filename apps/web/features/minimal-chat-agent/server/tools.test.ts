import { describe, expect, it, vi } from "vitest";

import {
  createMinimalChatAgentTools,
  lookupGithubRepository,
  parseGithubRepositoryName,
} from "./tools";

describe("minimal chat agent tools", () => {
  it("accepts only GitHub owner/name repository coordinates", () => {
    expect(parseGithubRepositoryName("shadcn-ui/chatbot-template")).toBe(
      "shadcn-ui/chatbot-template"
    );
    expect(() =>
      parseGithubRepositoryName("https://github.com/shadcn-ui")
    ).toThrow('Expected a GitHub repository in "owner/name" format.');
    expect(() => parseGithubRepositoryName("owner/name/extra")).toThrow(
      'Expected a GitHub repository in "owner/name" format.'
    );
  });

  it("maps a successful public GitHub repository response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          description: "A minimal chatbot template.",
          forks_count: 42,
          full_name: "shadcn-ui/chatbot-template",
          html_url: "https://github.com/shadcn-ui/chatbot-template",
          language: "TypeScript",
          open_issues_count: 3,
          stargazers_count: 1234,
        }),
        { status: 200 }
      )
    );

    await expect(
      lookupGithubRepository("shadcn-ui/chatbot-template", {
        fetch: fetchMock,
      })
    ).resolves.toEqual({
      description: "A minimal chatbot template.",
      forks: 42,
      language: "TypeScript",
      openIssues: 3,
      repo: "shadcn-ui/chatbot-template",
      stars: 1234,
      url: "https://github.com/shadcn-ui/chatbot-template",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/shadcn-ui/chatbot-template",
      expect.objectContaining({
        headers: expect.objectContaining({
          accept: "application/vnd.github+json",
        }),
      })
    );
  });

  it("returns a stable error when GitHub cannot resolve the repository", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 404 }));

    await expect(
      lookupGithubRepository("missing/repository", { fetch: fetchMock })
    ).resolves.toEqual({
      error: "Could not find public GitHub repository missing/repository.",
    });
  });

  it("composes provider-native search, GitHub lookup, and ask-user tools", () => {
    const webSearch = vi.fn().mockReturnValue("provider-web-search");
    const tools = createMinimalChatAgentTools({ webSearch });

    expect(Object.keys(tools)).toEqual([
      "web_search",
      "github_repo",
      "ask_user",
    ]);
    expect(tools.web_search).toBe("provider-web-search");
    expect(webSearch).toHaveBeenCalledWith({ searchContextSize: "medium" });
    expect(tools.ask_user.execute).toBeUndefined();
  });
});
