export const CONTEXT_TYPES = [
  'work',
  'personal',
  'finance',
  'health',
  'client',
  'public',
  'unknown',
] as const;

export type ContextType = (typeof CONTEXT_TYPES)[number];

export interface ContextRef {
  type: ContextType;
  /** Only meaningful for `client` contexts, e.g. `acme` in `client/acme`. */
  scope?: string;
}

export interface DomainContext {
  id: string;
  /** A hostname (`chat.example.com`) or a subdomain wildcard (`*.example.com`). */
  pattern: string;
  context: ContextRef;
  enabled: boolean;
  source: 'default' | 'user';
  createdAt: number;
  updatedAt: number;
}

export const UNKNOWN_CONTEXT: ContextRef = { type: 'unknown' };

/** Context types a user can assign to a site. `unknown` means "not assigned". */
export const ASSIGNABLE_CONTEXT_TYPES = CONTEXT_TYPES.filter(
  (type): type is Exclude<ContextType, 'unknown'> => type !== 'unknown',
);

export const CONTEXT_LABELS: Record<ContextType, string> = {
  work: 'Work',
  personal: 'Personal',
  finance: 'Finance',
  health: 'Health',
  client: 'Client',
  public: 'Public',
  unknown: 'Unknown',
};
