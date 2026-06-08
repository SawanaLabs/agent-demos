import type { UltraChatbotAgentToolPart } from "./ultra-chatbot-agent-message-parts";
import type { UltraChatbotAgentWeatherData } from "./ultra-chatbot-agent-weather";

export function isUltraChatbotAgentDocumentTool(
  part: UltraChatbotAgentToolPart
) {
  return (
    part.type === "tool-createDocument" ||
    part.type === "tool-editDocument" ||
    part.type === "tool-updateDocument"
  );
}

export function hasUltraChatbotAgentDocumentToolError(
  part: UltraChatbotAgentToolPart,
  isDocumentTool: boolean
): part is UltraChatbotAgentToolPart & { output: { error: unknown } } {
  return (
    isDocumentTool &&
    part.state === "output-available" &&
    part.output !== null &&
    part.output !== undefined &&
    typeof part.output === "object" &&
    "error" in part.output
  );
}

export function isUltraChatbotAgentWeatherResult(
  output: UltraChatbotAgentToolPart["output"]
): output is UltraChatbotAgentWeatherData {
  if (!output || typeof output !== "object") {
    return false;
  }

  return (
    "current" in output &&
    typeof output.current === "object" &&
    output.current !== null &&
    "daily" in output &&
    typeof output.daily === "object" &&
    output.daily !== null &&
    "current_units" in output &&
    typeof output.current_units === "object" &&
    output.current_units !== null
  );
}
