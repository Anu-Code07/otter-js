import type { ClaudeStatus } from '../../src/types/claude';

const NEEDS_USER_PATTERNS: RegExp[] = [
  /waiting (for )?(your )?(input|response|reply|permission|approval)/i,
  /needs? your (input|response|reply|permission|approval)/i,
  /reply to claude/i,
  /your turn/i,
  /allow (claude|this|access)/i,
  /approve (this|tool|command|action)/i,
  /run (this )?(command|tool)/i,
  /tool (use|approval|request)/i,
  /permission (required|needed|request)/i,
  /respond to claude/i,
  /waiting for you/i,
  /input required/i,
  /choose (a |an )?(option|file|folder)/i,
  /select (a |an )?(option|file|folder)/i,
  /continue\?/i,
  /allow once/i,
  /always allow/i,
  /\bwaiting\b/i,
  /\brespond\b/i,
  /\breply\b/i,
];

const WORKING_PATTERNS: RegExp[] = [
  /generating/i,
  /thinking/i,
  /claude is (thinking|working|writing)/i,
  /\bworking\b/i,
  /writing response/i,
];

export function inferClaudeStatusFromText(
  text: string,
  options?: { requireClaudeName?: boolean },
): ClaudeStatus {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return 'idle';

  const lower = normalized.toLowerCase();
  if (options?.requireClaudeName && !lower.includes('claude')) {
    return 'idle';
  }

  for (const pattern of NEEDS_USER_PATTERNS) {
    if (pattern.test(lower)) return 'waiting_for_user';
  }

  for (const pattern of WORKING_PATTERNS) {
    if (pattern.test(lower)) return 'working';
  }

  return 'idle';
}

export function mergeClaudeStatuses(statuses: ClaudeStatus[]): ClaudeStatus {
  if (statuses.includes('waiting_for_user')) return 'waiting_for_user';
  if (statuses.includes('working')) return 'working';
  if (statuses.length > 0 && statuses.every((status) => status === 'not_detected')) {
    return 'not_detected';
  }
  return 'idle';
}
