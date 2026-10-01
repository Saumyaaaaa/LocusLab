// Validation rules and summary metrics for the arithmetic distractor task.

export interface DistractorItemRecord {
  itemIndex: number;
  problem: string;
  answer: number;
  correct: boolean;
  responseMs: number;
}

export interface DistractorSummaryMetrics {
  attempted: number;
  correct: number;
  accuracy: number; // 0.0 to 1.0
  medianMs: number;
  valid: boolean;
}

/**
 * Checks if the array of answers contains the same number repeated 4 or more times consecutively.
 */
export function hasConsecutiveIdenticalAnswers(answers: number[], threshold = 4): boolean {
  if (answers.length < threshold) return false;
  let count = 1;
  for (let i = 1; i < answers.length; i++) {
    if (answers[i] === answers[i - 1]) {
      count++;
      if (count >= threshold) return true;
    } else {
      count = 1;
    }
  }
  return false;
}

/**
 * Calculates the median of an array of numbers.
 */
export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return sorted[mid];
}

/**
 * Evaluates the validity of a distractor task session based on preregistered criteria:
 * distractor_valid = false if ANY of:
 * 1. Fewer than 5 attempts (< 5)
 * 2. Accuracy below 60% (< 0.60)
 * 3. Median response under 1000 ms (< 1000)
 * 4. The same answer typed 4+ times in a row
 */
export function evaluateDistractorMetrics(items: DistractorItemRecord[]): DistractorSummaryMetrics {
  const attempted = items.length;
  const correct = items.filter((i) => i.correct).length;
  const accuracy = attempted > 0 ? Number((correct / attempted).toFixed(4)) : 0;
  const responseTimes = items.map((i) => i.responseMs);
  const medianMs = calculateMedian(responseTimes);
  const answers = items.map((i) => i.answer);

  const failAttempts = attempted < 5;
  const failAccuracy = accuracy < 0.6;
  const failSpeed = medianMs < 1000;
  const failRepetition = hasConsecutiveIdenticalAnswers(answers, 4);

  const valid = !failAttempts && !failAccuracy && !failSpeed && !failRepetition;

  return {
    attempted,
    correct,
    accuracy,
    medianMs,
    valid,
  };
}

export interface ArithmeticProblem {
  num1: number;
  num2: number;
  operator: '+' | '-';
  solution: number;
  text: string;
}

/**
 * Generates a two-digit addition or subtraction problem with non-negative result,
 * ensuring it never repeats consecutively.
 */
export function generateDistinctArithmeticProblem(lastProblemText?: string): ArithmeticProblem {
  let attempts = 0;
  while (attempts < 50) {
    attempts++;
    const isAdd = Math.random() < 0.5;
    let num1: number;
    let num2: number;
    let operator: '+' | '-';
    let solution: number;

    if (isAdd) {
      // Two-digit add: 10 to 89 + 10 to 89
      num1 = Math.floor(Math.random() * 80) + 10;
      num2 = Math.floor(Math.random() * 80) + 10;
      operator = '+';
      solution = num1 + num2;
    } else {
      // Two-digit subtract: 20 to 99 - 10 to (num1) ensures non-negative result
      num1 = Math.floor(Math.random() * 80) + 20;
      num2 = Math.floor(Math.random() * (num1 - 10)) + 10;
      operator = '-';
      solution = num1 - num2;
    }

    const text = `${num1} ${operator} ${num2}`;
    if (text !== lastProblemText) {
      return { num1, num2, operator, solution, text };
    }
  }

  // Fallback guaranteed non-repeating
  return { num1: 42, num2: 17, operator: '+', solution: 59, text: '42 + 17' };
}
