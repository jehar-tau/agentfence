import type { PermissionsArea } from '../core/provenance/site-protection';

/** In-memory stand-in for chrome.permissions, for tests. */
export function createMemoryPermissions(
  initialOrigins: string[] = [],
): PermissionsArea & { granted: Set<string>; setDenyNextRequest: (value: boolean) => void } {
  const granted = new Set(initialOrigins);
  let denyNextRequest = false;
  return {
    granted,
    setDenyNextRequest(value: boolean) {
      denyNextRequest = value;
    },
    async contains({ origins }) {
      return origins.every((origin) => granted.has(origin));
    },
    async request({ origins }) {
      if (denyNextRequest) {
        denyNextRequest = false;
        return false;
      }
      origins.forEach((origin) => granted.add(origin));
      return true;
    },
    async remove({ origins }) {
      origins.forEach((origin) => granted.delete(origin));
      return true;
    },
    async getAll() {
      return { origins: Array.from(granted) };
    },
  };
}
