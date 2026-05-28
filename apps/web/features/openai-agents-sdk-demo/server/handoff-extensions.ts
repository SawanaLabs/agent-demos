import type { RunContext, RunItem } from "@openai/agents";

const TOOL_ITEM_TYPES = new Set([
  "apply_patch_call",
  "apply_patch_call_output",
  "computer_call",
  "computer_call_result",
  "function_call",
  "function_call_result",
  "handoff_call_item",
  "handoff_output_item",
  "hosted_tool_call",
  "reasoning",
  "shell_call",
  "shell_call_output",
  "tool_search_call",
  "tool_search_output",
]);

export const RECOMMENDED_PROMPT_PREFIX = `# System context
You are part of a multi-agent system called the Agents SDK, designed to make agent coordination and execution easy. Agents uses two primary abstractions: **Agents** and **Handoffs**. An agent encompasses instructions and tools and can hand off a conversation to another agent when appropriate. Handoffs are achieved by calling a handoff function, generally named \`transfer_to_<agent_name>\`. Transfers between agents are handled seamlessly in the background; do not mention or draw attention to these transfers in your conversation with the user.`;

export function promptWithHandoffInstructions(prompt: string) {
  return `${RECOMMENDED_PROMPT_PREFIX}\n\n${prompt}`;
}

interface OpenAiAgentsSdkDemoHandoffInputData {
  inputHistory: string | Array<{ type?: string }>;
  newItems: RunItem[];
  preHandoffItems: RunItem[];
  runContext?: RunContext<any>;
}

function removeToolTypesFromInput<TInputItem extends { type?: string }>(
  items: TInputItem[]
) {
  return items.filter((item) => !TOOL_ITEM_TYPES.has(item.type ?? ""));
}

function removeToolsFromItems(items: RunItem[]) {
  return items.filter(
    (item) => !TOOL_ITEM_TYPES.has(((item.rawItem ?? {}) as { type?: string }).type ?? "")
  );
}

export function removeAllTools<TInputItem extends { type?: string }>(
  handoffInputData: Omit<OpenAiAgentsSdkDemoHandoffInputData, "inputHistory"> & {
    inputHistory: string | TInputItem[];
  }
) {
  const { inputHistory, preHandoffItems, newItems, runContext } =
    handoffInputData;

  return {
    inputHistory: Array.isArray(inputHistory)
      ? removeToolTypesFromInput(inputHistory)
      : inputHistory,
    newItems: removeToolsFromItems(newItems),
    preHandoffItems: removeToolsFromItems(preHandoffItems),
    runContext,
  };
}
