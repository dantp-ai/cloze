export type Grade = "again" | "hard" | "good" | "easy";

export type SRParams = {
  startingEase: number;
  minEase: number;
  hardMultiplier: number;
  easyBonus: number;
  intervalModifier: number;
  maxInterval: number;
  newCardsPerSession: number;
};

export const DEFAULT_SR_PARAMS: SRParams = {
  startingEase: 2.5,
  minEase: 1.3,
  hardMultiplier: 1.2,
  easyBonus: 1.5,
  intervalModifier: 1.0,
  maxInterval: 365,
  newCardsPerSession: 20,
};

export type SRState = {
  easeFactor: number;
  interval: number;
  repetitions: number;
  lapses: number;
};

export type SRResult = SRState & { dueDate: Date };

const DAY_MS = 86_400_000;

function addDays(now: Date, days: number): Date {
  return new Date(now.getTime() + days * DAY_MS);
}

export function review(state: SRState, grade: Grade, params: SRParams, now: Date): SRResult {
  if (grade === "again") {
    const easeFactor = Math.max(params.minEase, state.easeFactor - 0.2);
    return {
      easeFactor,
      interval: 0,
      repetitions: 0,
      lapses: state.lapses + 1,
      dueDate: addDays(now, 0),
    };
  }

  let easeFactor = state.easeFactor;
  if (grade === "hard") easeFactor = Math.max(params.minEase, easeFactor - 0.15);
  else if (grade === "easy") easeFactor = easeFactor + 0.15;

  const factor =
    grade === "hard" ? params.hardMultiplier : grade === "easy" ? easeFactor * params.easyBonus : easeFactor;

  const base = state.interval <= 0 ? 1 : state.interval;
  const interval = Math.min(
    params.maxInterval,
    Math.max(1, Math.round(base * factor * params.intervalModifier)),
  );

  return {
    easeFactor,
    interval,
    repetitions: state.repetitions + 1,
    lapses: state.lapses,
    dueDate: addDays(now, interval),
  };
}
