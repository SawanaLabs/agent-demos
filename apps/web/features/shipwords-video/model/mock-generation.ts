export async function generateMockVideo(signal: AbortSignal): Promise<Blob> {
  const response = await fetch("/shipwords-video/mock-result.mp4", { signal });
  if (!response.ok) {
    throw new Error(`Test video request failed: ${response.status}`);
  }
  return response.blob();
}
