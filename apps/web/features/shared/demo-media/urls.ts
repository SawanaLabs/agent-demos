const demoOrigin = "https://agent-demos.hsawana9.com";
export const legacyDemoMediaOrigin =
  "https://qexbzl7te8r8i0bl.public.blob.vercel-storage.com";
const mediaPrefix = "/demo-media/";
const canvasKey =
  /^canvas-agent\/(?:uploads|results)\/[a-zA-Z0-9_/-]+\.(?:png|jpe?g|webp|gif)$/;
const chatKey =
  /^ultra-chatbot-agent\/[a-zA-Z0-9_-]+\/\d{4}-\d{2}-\d{2}\/[a-zA-Z0-9_-]+\/[a-f0-9-]{36}-[a-zA-Z0-9._-]+$/;

export function isDemoMediaKey(key: string) {
  return key.length <= 1536 && (canvasKey.test(key) || chatKey.test(key));
}

export function demoMediaUrl(key: string) {
  return `${demoOrigin}${mediaPrefix}${key}`;
}

export function demoMediaKey(input: string) {
  try {
    const url = new URL(input);
    if (url.username || url.password) {
      return null;
    }
    if (url.origin === legacyDemoMediaOrigin) {
      const key = url.pathname.slice(1);
      return isDemoMediaKey(key) ? key : null;
    }
    if (url.origin === demoOrigin && url.pathname.startsWith(mediaPrefix)) {
      const key = url.pathname.slice(mediaPrefix.length);
      return isDemoMediaKey(key) ? key : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function currentDemoMediaUrl(input: string) {
  if (!input.startsWith(`${legacyDemoMediaOrigin}/`)) {
    return input;
  }
  const key = demoMediaKey(input);
  return key === null ? input : demoMediaUrl(key);
}
