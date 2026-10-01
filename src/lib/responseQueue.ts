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
  tab_hidden: boolean;
  intrusion_seq: number;
}

/**
 * Formats a recall test completion into 20 target-word rows plus intrusion rows (item_index = -1).
 */
export function formatListRecallRows(
  payload: RecallCompletionPayload,
  targetList: readonly (WordItem | string)[],
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
    } else if (resp.typed && resp.typed.trim()) {
      intrusionResponses.push({
        typed: resp.typed,
        responseMs: resp.responseMs,
      });
    }
  }

  // Normalize phase name for consistency (e.g. 'immediate' -> 'immediateTest')
  const normalizedPhase = payload.phase === 'immediate' ? 'immediateTest' : payload.phase;

  // 1. Exactly 20 rows for the 20 target stimuli words
  targetList.forEach((item, index) => {
    const wordStr = typeof item === 'string' ? item : item?.word || '';
    const match = wordStr ? matchedResponses.get(wordStr.toLowerCase()) : undefined;
    if (match) {
      rows.push({
        participant_id: participantId,
        phase: normalizedPhase,
        list_id: payload.listId,
        condition,
        item_index: index,
        typed_answer: match.typed,
        correct: true,
        response_ms: match.responseMs,
        tab_hidden: Boolean(payload.tabHidden),
        intrusion_seq: 0,
      });
    } else {
      // Missed word: typed_answer is null, correct is false
      rows.push({
        participant_id: participantId,
        phase: normalizedPhase,
        list_id: payload.listId,
        condition,
        item_index: index,
        typed_answer: null,
        correct: false,
        response_ms: null,
        tab_hidden: Boolean(payload.tabHidden),
        intrusion_seq: 0,
      });
    }
  });

  // 2. Extra typed entries (intrusions/unmatched guesses) saved with item_index = -1 and positive intrusion_seq
  intrusionResponses.forEach((intrusion, idx) => {
    rows.push({
      participant_id: participantId,
      phase: normalizedPhase,
      list_id: payload.listId,
      condition,
      item_index: -1,
      typed_answer: intrusion.typed,
      correct: false,
      response_ms: intrusion.responseMs,
      tab_hidden: Boolean(payload.tabHidden),
      intrusion_seq: idx + 1,
    });
  });

  return rows;
}

/**
 * Saves rows to Supabase via idempotent upsert with automatic retry on failure.
 * If composite unique constraint is missing in remote DB, gracefully falls back to insert.
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
      const { error } = await supabase
        .from('responses')
        .upsert(rows, { onConflict: 'participant_id,phase,list_id,item_index,intrusion_seq' });
      if (!error) {
        return { success: true };
      }

      // If constraint error (e.g. index not yet created in remote database), try fallback upsert without intrusion_seq
      if (error.message && (error.message.includes('constraint') || error.message.includes('ON CONFLICT'))) {
        const targetRows = rows.filter((r) => r.item_index >= 0);
        const intrusionRows = rows.filter((r) => r.item_index === -1);

        const { error: targetErr } = await supabase
          .from('responses')
          .upsert(targetRows, { onConflict: 'participant_id,phase,list_id,item_index' });

        if (!targetErr) {
          if (intrusionRows.length > 0) {
            await supabase.from('responses').insert(intrusionRows);
          }
          return { success: true };
        }
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
