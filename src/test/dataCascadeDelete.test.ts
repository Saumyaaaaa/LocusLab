// Unit test verifying data deletion cascading contract (participants -> sessions & responses).
import { describe, it, expect } from 'vitest';

interface Participant {
  id: string;
  code: string;
}

interface Session {
  id: string;
  participant_id: string;
  phase: string;
}

interface ResponseRow {
  id: string;
  participant_id: string;
  phase: string;
  typed_answer: string | null;
}

/**
 * Simulates PostgreSQL ON DELETE CASCADE relationship between participants, sessions, and responses.
 */
class MockDatabase {
  participants = new Map<string, Participant>();
  sessions = new Map<string, Session>();
  responses = new Map<string, ResponseRow>();

  insertParticipant(p: Participant) {
    this.participants.set(p.id, p);
  }

  insertSession(s: Session) {
    if (!this.participants.has(s.participant_id)) {
      throw new Error('Foreign key violation: participant does not exist');
    }
    this.sessions.set(s.id, s);
  }

  insertResponse(r: ResponseRow) {
    if (!this.participants.has(r.participant_id)) {
      throw new Error('Foreign key violation: participant does not exist');
    }
    this.responses.set(r.id, r);
  }

  deleteParticipant(id: string) {
    // 1. Remove participant row
    this.participants.delete(id);

    // 2. Cascade delete on sessions
    for (const [sId, session] of Array.from(this.sessions.entries())) {
      if (session.participant_id === id) {
        this.sessions.delete(sId);
      }
    }

    // 3. Cascade delete on responses
    for (const [rId, resp] of Array.from(this.responses.entries())) {
      if (resp.participant_id === id) {
        this.responses.delete(rId);
      }
    }
  }
}

describe('Data Privacy: ON DELETE CASCADE', () => {
  it('permanently deletes all child session and response rows when participant is deleted', () => {
    const db = new MockDatabase();
    const userId = 'user-uuid-123';
    const otherUserId = 'user-uuid-456';

    // Populate data for participant 1
    db.insertParticipant({ id: userId, code: 'TEST1234' });
    db.insertSession({ id: 's1', participant_id: userId, phase: 'immediateTest' });
    db.insertSession({ id: 's2', participant_id: userId, phase: '24h' });
    db.insertResponse({ id: 'r1', participant_id: userId, phase: 'immediateTest', typed_answer: 'flag' });
    db.insertResponse({ id: 'r2', participant_id: userId, phase: '24h', typed_answer: 'rope' });

    // Populate data for participant 2 (to verify isolation)
    db.insertParticipant({ id: otherUserId, code: 'OTHER567' });
    db.insertSession({ id: 's3', participant_id: otherUserId, phase: 'immediateTest' });
    db.insertResponse({ id: 'r3', participant_id: otherUserId, phase: 'immediateTest', typed_answer: 'tent' });

    expect(db.participants.size).toBe(2);
    expect(db.sessions.size).toBe(3);
    expect(db.responses.size).toBe(3);

    // Act: Delete participant 1
    db.deleteParticipant(userId);

    // Assert: Participant 1 and ALL child rows are completely gone
    expect(db.participants.has(userId)).toBe(false);

    // Sessions for user 1 are gone
    const remainingUserSessions = Array.from(db.sessions.values()).filter(
      (s) => s.participant_id === userId
    );
    expect(remainingUserSessions.length).toBe(0);

    // Responses for user 1 are gone
    const remainingUserResponses = Array.from(db.responses.values()).filter(
      (r) => r.participant_id === userId
    );
    expect(remainingUserResponses.length).toBe(0);

    // Participant 2 data remains intact
    expect(db.participants.has(otherUserId)).toBe(true);
    expect(db.sessions.get('s3')?.participant_id).toBe(otherUserId);
    expect(db.responses.get('r3')?.participant_id).toBe(otherUserId);
    expect(db.sessions.size).toBe(1);
    expect(db.responses.size).toBe(1);
  });
});
