// Unit test validating multi-tenant RLS isolation: User B cannot select, update, delete, or insert rows belonging to User A.
import { describe, it, expect } from 'vitest';

interface ParticipantRow {
  id: string;
  code: string;
  imagery_score: number | null;
}

interface SessionRow {
  id: string;
  participant_id: string;
  phase: string;
}

interface ResponseRow {
  id: string;
  participant_id: string;
  typed_answer: string | null;
}

/**
 * Simulates PostgreSQL Row-Level Security (RLS) policies:
 * - participants: id = auth.uid()
 * - sessions: participant_id = auth.uid()
 * - responses: participant_id = auth.uid()
 */
class MockPostgresWithRls {
  private participants: ParticipantRow[] = [];
  private sessions: SessionRow[] = [];
  private responses: ResponseRow[] = [];

  // Simulate active auth.uid()
  currentAuthUid: string | null = null;

  // Insert with WITH CHECK (id = auth.uid())
  insertParticipant(row: ParticipantRow) {
    if (this.currentAuthUid !== row.id) {
      throw new Error('new row violates row-level security policy for table "participants"');
    }
    this.participants.push({ ...row });
  }

  insertSession(row: SessionRow) {
    if (this.currentAuthUid !== row.participant_id) {
      throw new Error('new row violates row-level security policy for table "sessions"');
    }
    this.sessions.push({ ...row });
  }

  insertResponse(row: ResponseRow) {
    if (this.currentAuthUid !== row.participant_id) {
      throw new Error('new row violates row-level security policy for table "responses"');
    }
    this.responses.push({ ...row });
  }

  // Select with USING (id = auth.uid())
  selectParticipants(): ParticipantRow[] {
    return this.participants.filter((p) => p.id === this.currentAuthUid);
  }

  selectSessions(): SessionRow[] {
    return this.sessions.filter((s) => s.participant_id === this.currentAuthUid);
  }

  selectResponses(): ResponseRow[] {
    return this.responses.filter((r) => r.participant_id === this.currentAuthUid);
  }

  // Update with USING (id = auth.uid()) WITH CHECK (id = auth.uid())
  updateParticipant(targetId: string, updates: Partial<ParticipantRow>): number {
    let updatedCount = 0;
    this.participants = this.participants.map((p) => {
      // USING filter: row must belong to active auth.uid()
      if (p.id === targetId && p.id === this.currentAuthUid) {
        updatedCount++;
        return { ...p, ...updates };
      }
      return p;
    });
    return updatedCount;
  }

  // Delete with USING (id = auth.uid())
  deleteParticipant(targetId: string): number {
    const initialLen = this.participants.length;
    this.participants = this.participants.filter(
      (p) => !(p.id === targetId && p.id === this.currentAuthUid)
    );
    const deletedCount = initialLen - this.participants.length;

    // Simulate ON DELETE CASCADE
    if (deletedCount > 0) {
      this.sessions = this.sessions.filter((s) => s.participant_id !== targetId);
      this.responses = this.responses.filter((r) => r.participant_id !== targetId);
    }
    return deletedCount;
  }
}

describe('RLS Cross-Tenant Security Audit', () => {
  const userA = 'user-a-1111-1111-111111111111';
  const userB = 'user-b-2222-2222-222222222222';

  it('strictly prevents User B from selecting, updating, deleting, or spoofing User A rows', () => {
    const db = new MockPostgresWithRls();

    // 1. User A creates records
    db.currentAuthUid = userA;
    db.insertParticipant({ id: userA, code: 'CODEAAAA', imagery_score: 4.2 });
    db.insertSession({ id: 'sess-a1', participant_id: userA, phase: 'immediateTest' });
    db.insertResponse({ id: 'resp-a1', participant_id: userA, typed_answer: 'flag' });

    // Confirm User A sees own rows
    expect(db.selectParticipants().length).toBe(1);
    expect(db.selectSessions().length).toBe(1);
    expect(db.selectResponses().length).toBe(1);

    // 2. User B connects
    db.currentAuthUid = userB;
    db.insertParticipant({ id: userB, code: 'CODEBBBB', imagery_score: 3.0 });

    // TEST A: SELECT isolation
    // User B attempts to select participants, sessions, responses
    const visibleParticipants = db.selectParticipants();
    expect(visibleParticipants.length).toBe(1);
    expect(visibleParticipants[0].id).toBe(userB);
    expect(visibleParticipants.some((p) => p.id === userA)).toBe(false);

    expect(db.selectSessions().length).toBe(0); // User A's session is invisible to User B
    expect(db.selectResponses().length).toBe(0); // User A's responses are invisible to User B

    // TEST B: UPDATE tampering rejection
    // User B attempts to alter User A's imagery score
    const updatedCount = db.updateParticipant(userA, { imagery_score: 1.0 });
    expect(updatedCount).toBe(0); // 0 rows updated

    // Verify User A's score is unchanged
    db.currentAuthUid = userA;
    const userARow = db.selectParticipants()[0];
    expect(userARow.imagery_score).toBe(4.2);

    // TEST C: DELETE tampering rejection
    db.currentAuthUid = userB;
    const deletedCount = db.deleteParticipant(userA);
    expect(deletedCount).toBe(0); // 0 rows deleted

    // Verify User A and children still exist
    db.currentAuthUid = userA;
    expect(db.selectParticipants().length).toBe(1);
    expect(db.selectSessions().length).toBe(1);
    expect(db.selectResponses().length).toBe(1);

    // TEST D: INSERT spoofing rejection
    db.currentAuthUid = userB;
    expect(() => {
      // User B tries to insert a participant row using User A's UUID
      db.insertParticipant({ id: userA, code: 'SPOOF123', imagery_score: 1.0 });
    }).toThrow('new row violates row-level security policy for table "participants"');

    expect(() => {
      // User B tries to insert a session row under User A's ID
      db.insertSession({ id: 'sess-b-fake', participant_id: userA, phase: '24h' });
    }).toThrow('new row violates row-level security policy for table "sessions"');

    expect(() => {
      // User B tries to insert a response row under User A's ID
      db.insertResponse({ id: 'resp-b-fake', participant_id: userA, typed_answer: 'spoofed' });
    }).toThrow('new row violates row-level security policy for table "responses"');
  });
});
