#!/usr/bin/env python3
"""
LocusLab Results Analysis Pipeline
==================================
Analyzes participant recall accuracy and intrusion rates comparing 3D Virtual Memory Palace vs. Flashcards
across Immediate, 24-Hour, and 7-Day intervals.

Usage:
    python scripts/analyze_results.py --data-dir path/to/csv_exports/

Expected CSV files in data-dir:
    - participants.csv
    - sessions.csv
    - responses.csv
"""

import os
import sys
import argparse
import pandas as pd
import numpy as np
from scipy import stats

def parse_args():
    parser = argparse.ArgumentParser(description="Analyze LocusLab Memory Experiment Data")
    parser.add_argument(
        "--data-dir",
        type=str,
        default=".",
        help="Directory containing participants.csv, sessions.csv, and responses.csv"
    )
    parser.add_argument(
        "--out-dir",
        type=str,
        default="results",
        help="Directory where summary tables and figures will be saved"
    )
    parser.add_argument(
        "--include-fallbacks",
        action="store_true",
        help="Include sessions where palace_asset_fallback was true (default: exclude per prereg)"
    )
    return parser.parse_args()

def load_data(data_dir: str):
    p_path = os.path.join(data_dir, "participants.csv")
    s_path = os.path.join(data_dir, "sessions.csv")
    r_path = os.path.join(data_dir, "responses.csv")

    for path, name in [(p_path, "participants"), (s_path, "sessions"), (r_path, "responses")]:
        if not os.path.exists(path):
            raise FileNotFoundError(f"Missing required CSV: {path}")

    participants = pd.read_csv(p_path)
    sessions = pd.read_csv(s_path)
    responses = pd.read_csv(r_path)
    return participants, sessions, responses

def compute_recall_scores(participants: pd.DataFrame, responses: pd.DataFrame, exclude_fallbacks: bool = True):
    # Filter out asset fallbacks if specified by preregistration
    if exclude_fallbacks and "palace_asset_fallback" in participants.columns:
        valid_participants = participants[participants["palace_asset_fallback"] != True]["id"].unique()
        print(f"[*] Preregistration filter: Retained {len(valid_participants)}/{len(participants)} participants (palace_asset_fallback == False)")
    else:
        valid_participants = participants["id"].unique()

    # Filter responses to valid participants
    df_resp = responses[responses["participant_id"].isin(valid_participants)].copy()

    # Count correct responses per participant, phase, and list_id
    # Note: Target words per list is 20
    correct_counts = (
        df_resp[df_resp["is_correct"] == True]
        .groupby(["participant_id", "phase", "list_id"])["word_entered"]
        .nunique()
        .reset_index(name="score")
    )

    # Merge participant condition mappings (palace_list: 'listA' or 'listB')
    df_merged = correct_counts.merge(
        participants[["id", "palace_list", "condition_order", "device_class", "cohort"]],
        left_on="participant_id",
        right_on="id"
    )

    # Map list_id to condition: Palace vs Flashcard
    df_merged["condition"] = np.where(
        df_merged["list_id"] == df_merged["palace_list"],
        "Palace",
        "Flashcard"
    )

    return df_merged

def run_statistical_tests(scores_df: pd.DataFrame):
    print("\n" + "=" * 60)
    print("           STATISTICAL HYPOTHESIS TESTING RESULTS           ")
    print("=" * 60)

    phases = ["immediateTest", "test24h", "test7d"]
    phase_labels = {"immediateTest": "Immediate", "test24h": "24 Hours", "test7d": "7 Days"}

    for phase in phases:
        sub = scores_df[scores_df["phase"] == phase]
        pivot = sub.pivot_table(index="participant_id", columns="condition", values="score")
        
        # Keep only participants who completed both conditions in this phase
        paired = pivot.dropna(subset=["Palace", "Flashcard"])
        n = len(paired)

        if n < 2:
            print(f"\n[-] Phase: {phase_labels.get(phase, phase)} - Insufficient paired data (N={n})")
            continue

        palace_mean = paired["Palace"].mean()
        palace_std = paired["Palace"].std()
        flash_mean = paired["Flashcard"].mean()
        flash_std = paired["Flashcard"].std()

        diff = paired["Palace"] - paired["Flashcard"]
        diff_mean = diff.mean()
        diff_std = diff.std()
        t_stat, p_val = stats.ttest_rel(paired["Palace"], paired["Flashcard"])
        cohen_d = diff_mean / diff_std if diff_std > 0 else 0.0

        print(f"\n[+] Phase: {phase_labels.get(phase, phase)} (N = {n})")
        print(f"    Palace Mean:    {palace_mean:.2f} ± {palace_std:.2f} words (out of 20)")
        print(f"    Flashcard Mean: {flash_mean:.2f} ± {flash_std:.2f} words (out of 20)")
        print(f"    Mean Advantage: {diff_mean:+.2f} words")
        print(f"    Paired t-test:  t({n-1}) = {t_stat:.3f}, p = {p_val:.4f} (Cohen's d = {cohen_d:.2f})")
        if p_val < 0.05:
            print(f"    >>> Statistically Significant (p < 0.05)")

def main():
    args = parse_args()
    os.makedirs(args.out_dir, exist_ok=True)

    print(f"Loading data from: {args.data_dir}")
    try:
        participants, sessions, responses = load_data(args.data_dir)
    except Exception as e:
        print(f"Error loading CSV files: {e}")
        sys.exit(1)

    print(f"Total Participants: {len(participants)}")
    print(f"Total Sessions:     {len(sessions)}")
    print(f"Total Responses:    {len(responses)}")

    scores = compute_recall_scores(participants, responses, exclude_fallbacks=not args.include_fallbacks)
    run_statistical_tests(scores)

    # Save aggregated scores
    out_csv = os.path.join(args.out_dir, "participant_condition_scores.csv")
    scores.to_csv(out_csv, index=False)
    print(f"\n[✓] Aggregated scores saved to: {out_csv}")

if __name__ == "__main__":
    main()
