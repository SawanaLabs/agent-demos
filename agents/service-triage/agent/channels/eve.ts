import { localDev, none } from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";

// Demo agent: accept anonymous browser traffic (none) and local dev (localDev).
// none() is a deliberate fail-open for this public demo; production agents
// should use a real authenticator (vercelOidc, httpBasic, jwt, etc.).
export default eveChannel({
  auth: [localDev(), none()],
});
