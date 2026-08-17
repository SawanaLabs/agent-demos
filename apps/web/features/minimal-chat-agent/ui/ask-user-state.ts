import type { AskUserInput, AskUserOutput } from "../server/tools";

export function buildAskUserOutput(
  input: AskUserInput,
  answers: Record<number, string>
): AskUserOutput | null {
  const output = input.questions.map((item, index) => ({
    answer: answers[index]?.trim() ?? "",
    question: item.question,
  }));

  if (output.some((item) => item.answer.length === 0)) {
    return null;
  }

  return output;
}
