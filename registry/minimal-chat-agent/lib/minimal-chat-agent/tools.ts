import { tool } from "ai";
import { z } from "zod";

const githubRepositoryPattern = /^[\w.-]+\/[\w.-]+$/;
const githubApiVersion = "2022-11-28";
const githubRequestTimeoutMs = 5000;

export const githubRepoInputSchema = z.object({
  repo: z
    .string()
    .regex(githubRepositoryPattern, 'Must be in "owner/name" format.')
    .describe(
      'The public GitHub repository in "owner/name" format, for example "shadcn-ui/chatbot-template".'
    ),
});

export const githubRepoOutputSchema = z.union([
  z.object({ error: z.string() }),
  z.object({
    description: z.string(),
    forks: z.number(),
    language: z.string(),
    openIssues: z.number(),
    repo: z.string(),
    stars: z.number(),
    url: z.string().url(),
  }),
]);

export const askUserInputSchema = z.object({
  questions: z
    .array(
      z.object({
        choices: z
          .array(z.string().trim().min(1))
          .length(3)
          .describe("Exactly three short answer choices."),
        question: z.string().trim().min(1).describe("The question to ask."),
      })
    )
    .min(1)
    .describe("The questions to ask the user."),
});

export const askUserOutputSchema = z
  .array(
    z.object({
      answer: z.string().trim().min(1),
      question: z.string().trim().min(1),
    })
  )
  .describe("The user's answer to each question.");

export type AskUserInput = z.infer<typeof askUserInputSchema>;
export type AskUserOutput = z.infer<typeof askUserOutputSchema>;
export type GithubRepoInput = z.infer<typeof githubRepoInputSchema>;
export type GithubRepoOutput = z.infer<typeof githubRepoOutputSchema>;

export interface GithubRepositorySummary {
  description: string;
  forks: number;
  language: string;
  openIssues: number;
  repo: string;
  stars: number;
  url: string;
}

export interface GithubRepositoryError {
  error: string;
}

interface GithubLookupDependencies {
  abortSignal?: AbortSignal;
  fetch?: typeof fetch;
}

export function parseGithubRepositoryName(repo: string) {
  const normalizedRepo = repo.trim();

  if (!githubRepositoryPattern.test(normalizedRepo)) {
    throw new Error('Expected a GitHub repository in "owner/name" format.');
  }

  return normalizedRepo;
}

function getRequestSignal(abortSignal?: AbortSignal) {
  const timeoutSignal = AbortSignal.timeout(githubRequestTimeoutMs);

  return abortSignal
    ? AbortSignal.any([abortSignal, timeoutSignal])
    : timeoutSignal;
}

export async function lookupGithubRepository(
  repo: string,
  dependencies: GithubLookupDependencies = {}
): Promise<GithubRepositorySummary | GithubRepositoryError> {
  const normalizedRepo = parseGithubRepositoryName(repo);
  const fetchImplementation = dependencies.fetch ?? fetch;

  try {
    const response = await fetchImplementation(
      `https://api.github.com/repos/${normalizedRepo}`,
      {
        headers: {
          accept: "application/vnd.github+json",
          "x-github-api-version": githubApiVersion,
        },
        signal: getRequestSignal(dependencies.abortSignal),
      }
    );

    if (!response.ok) {
      return {
        error: `Could not find public GitHub repository ${normalizedRepo}.`,
      };
    }

    const data = (await response.json()) as Record<string, unknown>;
    const resolvedRepo =
      typeof data.full_name === "string"
        ? parseGithubRepositoryName(data.full_name)
        : normalizedRepo;

    return {
      description: typeof data.description === "string" ? data.description : "",
      forks: Number(data.forks_count ?? 0),
      language: typeof data.language === "string" ? data.language : "Unknown",
      openIssues: Number(data.open_issues_count ?? 0),
      repo: resolvedRepo,
      stars: Number(data.stargazers_count ?? 0),
      url: `https://github.com/${resolvedRepo}`,
    };
  } catch {
    return {
      error: `Could not reach GitHub for ${normalizedRepo}.`,
    };
  }
}

export const githubRepoTool = tool({
  description:
    "Get public stats for a GitHub repository: stars, forks, open issues, language, and description.",
  execute: ({ repo }, { abortSignal }) =>
    lookupGithubRepository(repo, { abortSignal }),
  inputSchema: githubRepoInputSchema,
  outputSchema: githubRepoOutputSchema,
});

export const askUserTool = tool({
  description:
    "Ask the user clarifying questions when their request is ambiguous. Provide one or more questions, each with exactly three short, distinct answer choices. The user can also answer in their own words.",
  inputSchema: askUserInputSchema,
  outputSchema: askUserOutputSchema,
});

interface WebSearchProvider<TWebSearchTool> {
  webSearch: (options: { searchContextSize: "medium" }) => TWebSearchTool;
}

export function createMinimalChatAgentTools<TWebSearchTool>(
  provider: WebSearchProvider<TWebSearchTool>
) {
  return {
    web_search: provider.webSearch({ searchContextSize: "medium" }),
    github_repo: githubRepoTool,
    ask_user: askUserTool,
  };
}
