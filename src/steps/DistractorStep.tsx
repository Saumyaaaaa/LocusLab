// Distractor step administering the 3-minute mental arithmetic task and advancing to immediate recall.
import React from 'react';
import { useExperimentStore } from '../store/useExperimentStore';
import { ArithmeticDistractor } from '../components/ArithmeticDistractor';

export const DistractorStep: React.FC = () => {
  const { nextStep, recordDistractorResult } = useExperimentStore();

  const handleDistractorComplete = (meta: { score: number; total: number; tabHidden: boolean }) => {
    recordDistractorResult(meta.score, meta.total, meta.tabHidden);
    nextStep();
  };

  return <ArithmeticDistractor onComplete={handleDistractorComplete} />;
};
