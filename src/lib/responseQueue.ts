// Resilient response queue saving all target words (recalled and missed) and intrusions with retry backoff.
import { supabase, isSupabaseConfigured } from './supabase';
import { WordItem } from '../data/lists';
import { RecallCompletionPayload } from '../components/RecallTest';

export interface FormattedResponseRow {
  participant_id: string;
  phase: string;
  list_id: string;
  condition: 'palace' | 'flashcard';
  item_index: number;
  typed_answer: string | null;
  correct: boolean;
  response_ms: number | null;
}

/**
 * Formats a recall test completion into 20 target-word rows plus intrusion rows (item_index = -1).
 */
export function formatListRecallRows(
  payload: RecallCompletionPayload,
  targetList: readonly WordItem[],
  participantId: string,
  condition: 'palace' | 'flashcard'
): FormattedResponseRow[] {
  const rows: FormattedResponseRow[] = [];

  // Map correctly recalled words to their typed responses
  const matchedResponses = new Map<string, { typed: string; responseMs: number }>();
  const intrusionResponses: { typed: string; responseMs: number }[] = [];

  for (const resp of payload.recordedResponses) {
    if (resp.evaluation?.correct && resp.evaluation.matchedWord) {
      const targetLower = resp.evaluation.matchedWord.toLowerCase();
      if (!matchedResponses.has(targetLower)) {
        matchedResponses.set(targetLower, {
          typed: resp.typed,
          responseMs: resp.responseMs,
        });
      }
    } else if (resp.typed.trim()) {
      intrusionResponses.push({
        typed: resp.typed,
        responseMs: resp.responseMs,
      });
    }
  }

  // 1. Exactly 20 rows for the 20 target stimuli words
  targetList.forEach((item, index) => {
    const match = matchedResponses.get(item.word.toLowerCase());
    if (match) {
      rows.push({
        participant_id: participantId,
        phase: payload.phase,
        list_id: payload.listId,
        condition,
        item_index: index,
        typed_answer: match.typed,
        correct: true,
        response_ms: match.responseMs,
      });
    } else {
      // Missed word: typed_answer is null, correct is false
      rows.push({
        participant_id: participantId,
        phase: payload.phase,
        list_id: payload.listId,
        condition,
        item_index: index,
        typed_answer: null,
        correct: false,
        response_ms: null,
      });
    }
  });

  // 2. Extra typed entries (intrusions/unmatched guesses) saved with item_index = -1
  intrusionResponses.forEach((intrusion) => {
    rows.push({
      participant_id: participantId,
      phase: payload.phase,
      list_id: payload.listId,
      condition,
      item_index: -1,
      typed_answer: intrusion.typed,
      correct: false,
      response_ms: intrusion.responseMs,
    });
  });

  return rows;
}

/**
 * Saves rows to Supabase with automatic retry on failure.
 */
export async function saveResponsesWithRetry(
  rows: FormattedResponseRow[],
  maxRetries = 3
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || rows.length === 0) {
    return { success: true };
  }

  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const { error } = await supabase.from('responses').insert(rows);
      if (!error) {
        return { success: true };
      }
      attempt++;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, attempt * 1200));
      } else {
        return { success: false, error: error.message };
      }
    } catch (err: unknown) {
      attempt++;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, attempt * 1200));
      } else {
        const msg = err instanceof Error ? err.message : 'Network error during save';
        return { success: false, error: msg };
      }
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}
