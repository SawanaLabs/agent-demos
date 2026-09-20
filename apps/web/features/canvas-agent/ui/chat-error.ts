export const emptyChatError =
  "请求未完成，请重试。已完成的节点结果仍保留在画布中。";

export function canvasChatError(error: Error | undefined, status: string) {
  return error || status === "error"
    ? error?.message.trim() || emptyChatError
    : undefined;
}

// AI SDK's default transport uses response.text() as its error message. Next.js
// can return an empty 500 response before the agent handler is reached.
export const canvasChatFetch: typeof fetch = async (input, init) => {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (error) {
    if (init?.signal?.aborted) {
      throw error;
    }
    throw new Error("无法连接服务，请检查网络后重试。", { cause: error });
  }
  if (!response.ok) {
    let message = `请求未完成（${response.status}），请检查输入后重试。`;
    if (response.status === 429) {
      message = "今日使用额度已用完，请稍后再试。";
    }
    if (response.status >= 500) {
      message = `服务暂时不可用（${response.status}），请重试。已完成的节点结果仍保留。`;
    }
    throw new Error(message);
  }
  return response;
};
