import type { GuidageMode } from "./guidage-modes";

export interface RotationState {
  currentSpeakerIndex: number;
  elapsedInTurnSeconds: number;
  totalElapsedSeconds: number;
}

/**
 * Given participant IDs (ordered by join time) and elapsed seconds,
 * returns current speaker index. Cycles through all participants.
 */
export function getCurrentSpeaker(
  participantIds: string[],
  elapsedSeconds: number,
  mode: GuidageMode
): { speakerId: string | null; indexInRound: number; secondsRemaining: number } {
  if (participantIds.length === 0 || mode.speakerTurnSeconds === 0) {
    return { speakerId: null, indexInRound: 0, secondsRemaining: 0 };
  }

  const turnDuration = mode.speakerTurnSeconds;
  const roundDuration = turnDuration * participantIds.length;
  const positionInRound = elapsedSeconds % roundDuration;
  const indexInRound = Math.floor(positionInRound / turnDuration);
  const secondsRemaining = turnDuration - (positionInRound % turnDuration);

  return {
    speakerId: participantIds[indexInRound],
    indexInRound,
    secondsRemaining: Math.ceil(secondsRemaining),
  };
}

/**
 * Returns the full rotation schedule for a session.
 */
export function buildRotationSchedule(
  participantIds: string[],
  mode: GuidageMode,
  rounds = 1
): Array<{ speakerId: string; startSeconds: number; endSeconds: number }> {
  if (participantIds.length === 0 || mode.speakerTurnSeconds === 0) return [];

  const schedule: Array<{ speakerId: string; startSeconds: number; endSeconds: number }> = [];
  let t = 0;

  for (let round = 0; round < rounds; round++) {
    for (const id of participantIds) {
      schedule.push({ speakerId: id, startSeconds: t, endSeconds: t + mode.speakerTurnSeconds });
      t += mode.speakerTurnSeconds;
    }
  }

  return schedule;
}
