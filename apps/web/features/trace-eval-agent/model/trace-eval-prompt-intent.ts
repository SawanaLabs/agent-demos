const greetingPattern =
  /^(?:hi|hello|hey|yo|sup|hola|bonjour|你好|您好|嗨|哈喽|在吗)[!.?]*$/i;

const researchIntentPattern =
  /\b(research|compare|comparison|evaluate|analysis|analyze|explain|latest|current|today|recommend|recommendation|pick|should|versus|vs\.?|source|sources|cite|search)\b|研究|调研|比较|分析|解释|最新|推荐|检索|搜索|资料|来源/u;

const minimumResearchPromptLength = 20;

export function hasTraceEvalResearchIntent(prompt: string | null) {
  const normalizedPrompt = prompt?.trim() ?? "";

  if (normalizedPrompt.length === 0) {
    return false;
  }

  if (greetingPattern.test(normalizedPrompt)) {
    return false;
  }

  return (
    normalizedPrompt.length >= minimumResearchPromptLength ||
    researchIntentPattern.test(normalizedPrompt)
  );
}
