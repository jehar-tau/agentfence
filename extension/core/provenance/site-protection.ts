/** The subset of chrome.permissions AgentFence uses, so tests can substitute a fake. */
export interface PermissionsArea {
  contains(query: { origins: string[] }): Promise<boolean>;
  request(query: { origins: string[] }): Promise<boolean>;
  remove(query: { origins: string[] }): Promise<boolean>;
  getAll(): Promise<{ origins?: string[] }>;
}

const SINGLE_HOST_ORIGIN_PATTERN = /^https?:\/\/[^*/]+\/\*$/;

/** `https://Chat.Example.com/thread` → `https://chat.example.com/*`. http(s) only. */
export function originPatternFromUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined;
    return `${parsed.protocol}//${parsed.hostname.toLowerCase()}/*`;
  } catch {
    return undefined;
  }
}

export function isSingleHostOriginPattern(pattern: string): boolean {
  return SINGLE_HOST_ORIGIN_PATTERN.test(pattern);
}

export async function isOriginProtected(
  permissions: PermissionsArea,
  originPattern: string,
): Promise<boolean> {
  return permissions.contains({ origins: [originPattern] });
}

/** Asks the user, via the browser's own permission prompt, to let AgentFence watch copies on this site. */
export async function requestSiteProtection(
  permissions: PermissionsArea,
  originPattern: string,
): Promise<boolean> {
  return permissions.request({ origins: [originPattern] });
}

export async function revokeSiteProtection(
  permissions: PermissionsArea,
  originPattern: string,
): Promise<void> {
  await permissions.remove({ origins: [originPattern] });
}

/** Every currently granted single-host origin. */
export async function listProtectedOrigins(permissions: PermissionsArea): Promise<string[]> {
  const { origins = [] } = await permissions.getAll();
  return origins.filter(isSingleHostOriginPattern);
}
