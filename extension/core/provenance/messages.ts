export const COPY_MESSAGE_TYPE = 'agentfence:copy' as const;

export interface CopyMessage {
  type: typeof COPY_MESSAGE_TYPE;
  text: string;
  href: string;
}

export function isCopyMessage(message: unknown): message is CopyMessage {
  if (!message || typeof message !== 'object') return false;
  const candidate = message as Record<string, unknown>;
  return (
    candidate.type === COPY_MESSAGE_TYPE &&
    typeof candidate.text === 'string' &&
    typeof candidate.href === 'string'
  );
}
