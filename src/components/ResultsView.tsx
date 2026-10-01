// Accessible citizen-science results visualization with native SVG grouped bar chart, pattern fills, and honest non-diagnostic caveats.
import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ShareExperimentButton } from './ShareExperimentButton';
import { DeleteDataModal } from './DeleteDataModal';
import { PHASES, Phase, PHASE_LABELS, normalizePhase } from '../data/phases';

interface ResultsViewProps {
  participantId: string;
}

interface TimepointScore {
  phase: Phase | string;
  label: string;
  palaceCorrect: number;
  flashcardCorrect: number;
}

interface ParticipantMeta {
  palace_list?: string;
  imagery_score: number | null;
  palace_tab_hidden: boolean;
  flashcard_tab_hidden: boolean;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ participantId }) => {
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<TimepointScore[]>([]);
  const [meta, setMeta] = useState<ParticipantMeta | null>(null);
  const [hasLateSessions, setHasLateSessions] = useState(false);
  const [hasTabHidden, setHasTabHidden] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    async function loadUserResults() {
      try {
        // 1. Fetch only this participant's own responses via strict RLS
        let responses: any[] | null = null;
        let partData: any = null;
        let sessions: any[] | null = null;

        if (isSupabaseConfigured && participantId) {
          const resRes = await supabase
            .from('responses')
            .select('phase, condition, list_id, correct, item_index, tab_hidden')
            .eq('participant_id', participantId);
          responses = resRes.data;

          const partRes = await supabase
            .from('participants')
            .select('palace_list, imagery_score, palace_tab_hidden, flashcard_tab_hidden')
            .eq('id', participantId)
            .maybeSingle();
          partData = partRes.data;

          const sessRes = await supabase
            .from('sessions')
            .select('phase, late, completed_at')
            .eq('participant_id', participantId);
          sessions = sessRes.data;
        }

        if (partData) {
          setMeta(partData as ParticipantMeta);
        }

        const lateFlag = Boolean(sessions?.some((s) => s.late));
        setHasLateSessions(lateFlag);

        const tabSwitchInResponses = Boolean(responses?.some((r) => r.tab_hidden));
        const tabSwitchInMeta = Boolean(partData?.palace_tab_hidden || partData?.flashcard_tab_hidden);
        setHasTabHidden(tabSwitchInResponses || tabSwitchInMeta);

        // Tracking stats per timepoint
        const timepointStats: Record<
          Phase,
          { label: string; palaceTargets: number; flashcardTargets: number; palaceCorrect: number; flashcardCorrect: number }
        > = {
          immediateTest: { label: PHASE_LABELS.immediateTest, palaceTargets: 0, flashcardTargets: 0, palaceCorrect: 0, flashcardCorrect: 0 },
          '24h': { label: PHASE_LABELS['24h'], palaceTargets: 0, flashcardTargets: 0, palaceCorrect: 0, flashcardCorrect: 0 },
          '7d': { label: PHASE_LABELS['7d'], palaceTargets: 0, flashcardTargets: 0, palaceCorrect: 0, flashcardCorrect: 0 },
        };

        const activePalaceList = partData?.palace_list || 'listA';

        // Tally strictly from database rows
        if (responses && responses.length > 0) {
          responses.forEach((row) => {
            const phase = normalizePhase(row.phase) as Phase;
            if (!timepointStats[phase]) return;

            let condition = row.condition;
            if (!condition && row.list_id) {
              condition = row.list_id === activePalaceList ? 'palace' : 'flashcard';
            }

            if (row.item_index >= 0) {
              if (condition === 'palace') {
                timepointStats[phase].palaceTargets++;
                if (row.correct) timepointStats[phase].palaceCorrect++;
              } else if (condition === 'flashcard') {
                timepointStats[phase].flashcardTargets++;
                if (row.correct) timepointStats[phase].flashcardCorrect++;
              }
            }
          });
        }

        // CRUCIAL: Only accept time points where BOTH palace and flashcard have at least 20 target rows in Supabase!
        const computedScores: TimepointScore[] = [];
        PHASES.forEach((p) => {
          const stats = timepointStats[p];
          if (stats.palaceTargets >= 20 && stats.flashcardTargets >= 20) {
            computedScores.push({
              phase: p,
              label: stats.label,
              palaceCorrect: stats.palaceCorrect,
              flashcardCorrect: stats.flashcardCorrect,
            });
          }
        });

        setScores(computedScores);
      } catch {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    }

    loadUserResults();
  }, [participantId]);

  if (loading) {
    return (
      <div className="card" role="region" aria-label="Loading Results">
        <span className="badge">Results Analysis</span>
        <h2 className="title-lg" style={{ marginTop: 'var(--space-3)' }}>
          Compiling Your Results...
        </h2>
        <p className="lead-text">
          Retrieving your word recall records from the database.
        </p>
      </div>
    );
  }

  // Requirement: If rows are missing, show "We could not load your results" and nothing else.
  if (scores.length === 0) {
    return (
      <div className="card" role="region" aria-label="Results Unavailable">
        <h2 className="title-lg">We could not load your results</h2>
      </div>
    );
  }

  // SVG Chart Dimensions
  const chartWidth = 600;
  const chartHeight = 320;
  const plotTop = 40;
  const plotBottom = 260;
  const plotLeft = 60;
  const plotRight = 560;
  const plotHeight = plotBottom - plotTop;
  const maxScore = 20;

  const getY = (val: number) => plotBottom - (val / maxScore) * plotHeight;

  return (
    <div className="card" role="region" aria-label="Experiment Results Summary">
      <span className="badge" style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>
        Study Completed
      </span>
      <h1 className="title-xl" style={{ marginTop: 'var(--space-3)' }}>
        Your Word Recall Results
      </h1>
      <p className="lead-text">
        Thank you for participating in Locus Lab. Below is the honest breakdown of how many words you recalled out of 20 for each study method across your completed test sessions.
      </p>

      {/* SVG Grouped Bar Chart */}
      {scores.length > 0 ? (
        <div style={{ margin: 'var(--space-6) 0', overflowX: 'auto' }}>
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ width: '100%', height: 'auto', display: 'block', backgroundColor: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)' }}
              role="img"
              aria-label="Grouped bar chart displaying words recalled out of 20 for 3D palace versus flashcards"
            >
              <defs>
                {/* Diagonal stripes for 3D Palace */}
                <pattern id="palace-stripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="8" height="8" fill="#2563eb" />
                  <line x1="0" y1="0" x2="0" y2="8" stroke="#1d4ed8" strokeWidth="2.5" />
                </pattern>
                {/* Dots for Digital Flashcards */}
                <pattern id="flashcard-dots" width="8" height="8" patternUnits="userSpaceOnUse">
                  <rect width="8" height="8" fill="#0d9488" />
                  <circle cx="4" cy="4" r="1.5" fill="#14b8a6" />
                </pattern>
              </defs>

              {/* Horizontal Gridlines & Y-Axis Labels */}
              {[0, 5, 10, 15, 20].map((val) => {
                const y = getY(val);
                return (
                  <g key={val}>
                    <line
                      x1={plotLeft}
                      y1={y}
                      x2={plotRight}
                      y2={y}
                      stroke="var(--color-surface-border)"
                      strokeDasharray={val === 0 ? undefined : '4 4'}
                      strokeWidth={val === 0 ? '1.5' : '1'}
                    />
                    <text
                      x={plotLeft - 10}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="12"
                      fill="var(--color-text-muted)"
                      fontFamily="var(--font-family-sans)"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Grouped Bars */}
              {scores.map((sc, i) => {
                const groupWidth = (plotRight - plotLeft) / scores.length;
                const groupCenter = plotLeft + groupWidth * i + groupWidth / 2;
                const barWidth = 36;
                const barGap = 6;

                const palaceX = groupCenter - barWidth - barGap / 2;
                const flashcardX = groupCenter + barGap / 2;

                const palaceY = getY(sc.palaceCorrect);
                const palaceHeight = plotBottom - palaceY;

                const flashcardY = getY(sc.flashcardCorrect);
                const flashcardHeight = plotBottom - flashcardY;

                return (
                  <g key={sc.phase}>
                    {/* Palace Bar */}
                    <rect
                      x={palaceX}
                      y={palaceY}
                      width={barWidth}
                      height={palaceHeight}
                      fill="url(#palace-stripes)"
                      rx="3"
                    />
                    <text
                      x={palaceX + barWidth / 2}
                      y={palaceY - 6}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="700"
                      fill="#1d4ed8"
                    >
                      {sc.palaceCorrect}
                    </text>

                    {/* Flashcard Bar */}
                    <rect
                      x={flashcardX}
                      y={flashcardY}
                      width={barWidth}
                      height={flashcardHeight}
                      fill="url(#flashcard-dots)"
                      rx="3"
                    />
                    <text
                      x={flashcardX + barWidth / 2}
                      y={flashcardY - 6}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="700"
                      fill="#0f766e"
                    >
                      {sc.flashcardCorrect}
                    </text>

                    {/* X-Axis Group Label */}
                    <text
                      x={groupCenter}
                      y={plotBottom + 24}
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="600"
                      fill="var(--color-text)"
                    >
                      {sc.label}
                    </text>
                  </g>
                );
              })}

              {/* Legend */}
              <g transform={`translate(${plotLeft + 40}, ${chartHeight - 16})`}>
                <rect x="0" y="-10" width="16" height="12" fill="url(#palace-stripes)" rx="2" />
                <text x="22" y="0" fontSize="12" fill="var(--color-text)" fontWeight="500">
                  3D Memory Palace
                </text>

                <rect x="180" y="-10" width="16" height="12" fill="url(#flashcard-dots)" rx="2" />
                <text x="202" y="0" fontSize="12" fill="var(--color-text)" fontWeight="500">
                  Digital Flashcards
                </text>
              </g>
            </svg>

            {/* Visually Hidden Data Table for Screen Readers (WCAG AA) */}
            <table
              className="sr-only"
              style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: 0,
              }}
            >
              <caption>Detailed recall scores out of 20 words by study method</caption>
              <thead>
                <tr>
                  <th scope="col">Time Point</th>
                  <th scope="col">3D Memory Palace</th>
                  <th scope="col">Digital Flashcards</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((sc) => (
                  <tr key={sc.phase}>
                    <th scope="row">{sc.label}</th>
                    <td>{sc.palaceCorrect} of 20 words</td>
                    <td>{sc.flashcardCorrect} of 20 words</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="description-box" style={{ margin: 'var(--space-4) 0' }}>
          <p>No completed recall responses found in your session record.</p>
        </div>
      )}

      {/* Honest Plain Sentences Per Completed Time Point */}
      <div className="description-box" style={{ lineHeight: 1.7, margin: 'var(--space-6) 0' }}>
        <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
          Session Summary
        </h3>
        {scores.map((sc) => (
          <p key={sc.phase} style={{ marginBottom: 'var(--space-2)' }}>
            <strong>At {sc.label.toLowerCase()}:</strong> you recalled{' '}
            <strong>{sc.palaceCorrect} of 20</strong> palace words and{' '}
            <strong>{sc.flashcardCorrect} of 20</strong> flashcard words.
          </p>
        ))}
      </div>

      {/* Strict Scientific Caveat (Required Framing) */}
      <div
        role="note"
        style={{
          backgroundColor: 'var(--color-surface-subtle)',
          borderLeft: '4px solid var(--color-primary)',
          padding: 'var(--space-4) var(--space-5)',
          borderRadius: 'var(--radius-sm)',
          margin: 'var(--space-6) 0',
          fontSize: 'var(--font-size-sm)',
          lineHeight: 1.6,
        }}
      >
        <strong>⚠️ Scientific Interpretation Notice:</strong>
        <p style={{ marginTop: 'var(--space-2)' }}>
          With only 20 words per method, differences of about 3 words or fewer are within normal random variation. This is one person&apos;s result and is not a diagnosis.
        </p>
      </div>

      {/* Things That May Have Affected Your Result */}
      <div style={{ margin: 'var(--space-6) 0' }}>
        <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
          Factors That May Have Affected Your Result
        </h3>
        <ul style={{ paddingLeft: 'var(--space-5)', lineHeight: 1.7, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
          <li>
            <strong>3D Palace Novelty:</strong> Navigating a 3D visual palace for the first time demands spatial coordination and visual attention that digital flashcards do not require.
          </li>
          {hasTabHidden && (
            <li>
              <strong>Browser Tab Inattention:</strong> A browser tab switch was detected during your study or recall sessions, which can momentarily interrupt focus.
            </li>
          )}
          {hasLateSessions && (
            <li>
              <strong>Delayed Window Timing:</strong> One or more tests were submitted during the extended (late) return window, allowing more time for natural memory decay.
            </li>
          )}
          {meta?.imagery_score !== null && meta?.imagery_score !== undefined && (
            <li>
              <strong>Mental Imagery Rating:</strong> Your self-rated imagery score was <strong>{Number(meta.imagery_score).toFixed(1)} / 5.0</strong>. This is a personal self-rating, not a diagnostic assessment.
            </li>
          )}
        </ul>
      </div>

      {/* Action Bar: Share & Delete */}
      <div className="button-bar" style={{ marginTop: 'var(--space-8)' }}>
        <ShareExperimentButton />
        <button
          type="button"
          className="btn"
          style={{ backgroundColor: 'var(--color-surface-subtle)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)' }}
          onClick={() => setIsDeleteModalOpen(true)}
        >
          🗑️ Delete My Data
        </button>
      </div>

      <DeleteDataModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
