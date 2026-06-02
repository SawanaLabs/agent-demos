export function getPersistentAgentAppEnv() {
  // biome-ignore lint/style/noProcessEnv: Registry source installs into consumer apps without this repo's env wrapper.
  return process.env;
}
