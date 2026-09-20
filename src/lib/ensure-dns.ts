import dns from "dns";

// Some Windows setups (VPN clients, local proxies, misconfigured adapters) leave
// Node's resolver pointed at a loopback address that refuses SRV/TXT queries,
// even though the OS's own resolver works fine. mongodb+srv:// URIs need working
// SRV/TXT lookups, so force a known-good public resolver ahead of whatever Node
// picked up, without dropping any resolvers that were already configured.
const FALLBACK_SERVERS = ["8.8.8.8", "1.1.1.1"];

let applied = false;

export function ensureWorkingDns() {
  if (applied) return;
  applied = true;

  try {
    const current = dns.getServers();
    const merged = Array.from(new Set([...FALLBACK_SERVERS, ...current]));
    dns.setServers(merged);
  } catch {
    // best-effort only; if this fails, connection errors will surface normally
  }
}
