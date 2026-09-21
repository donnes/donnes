/** One-set beach tennis exhibition. AI never changes this state directly. */
export type Player = 0 | 1;
export type Pair = [number, number];
export type PointReason = "in" | "out" | "net" | "net-touch" | "double-hit" | "serve-fault";
export type Match = {
  points: Pair;
  games: Pair;
  server: Player;
  firstServer: Player;
  tieBreak: boolean;
  tieBreakFirst: Player;
  ends: boolean;
  winner: Player | null;
  lastPoint: { winner: Player; reason: PointReason; game: boolean; changeEnds: boolean } | null;
};
export const other = (player: Player): Player => player === 0 ? 1 : 0;
export function createMatch(firstServer: Player = 0): Match {
  return { points: [0, 0], games: [0, 0], server: firstServer, firstServer, tieBreak: false, tieBreakFirst: firstServer, ends: false, winner: null, lastPoint: null };
}
export function pointScore(match: Match): [string, string] {
  return match.points.map(value => match.tieBreak ? String(value) : ["0", "15", "30", "40"][value] ?? "0") as [string, string];
}
export function decidingPoint(match: Match) {
  return match.winner === null && !match.tieBreak && match.points[0] === 3 && match.points[1] === 3;
}
export function awardPoint(match: Match, winner: Player, reason: PointReason): Match {
  if (match.winner !== null) return match;
  const next: Match = { ...match, points: [...match.points], games: [...match.games], lastPoint: { winner, reason, game: false, changeEnds: false } };
  next.points[winner]++;
  const loser = other(winner);
  const total = next.points[0] + next.points[1];
  const game = next.tieBreak ? next.points[winner] >= 7 && next.points[winner] - next.points[loser] >= 2 : next.points[winner] === 4;
  let changeEnds = false;
  if (next.tieBreak) {
    changeEnds = total % 4 === 1; // Beach tennis: after 1, 5, 9... points.
    next.server = Math.ceil(total / 2) % 2 ? other(next.tieBreakFirst) : next.tieBreakFirst;
  }
  if (game) {
    next.games[winner]++;
    next.lastPoint!.game = true;
    if (!next.tieBreak) {
      changeEnds = (next.games[0] + next.games[1]) % 2 === 1;
      next.server = other(match.server);
      next.points = [0, 0];
    }
    if (next.tieBreak || (next.games[winner] >= 6 && next.games[winner] - next.games[loser] >= 2)) next.winner = winner;
    else if (next.games[0] === 6 && next.games[1] === 6) {
      next.tieBreak = true;
      next.tieBreakFirst = next.server;
    }
  }
  if (changeEnds && next.winner === null) next.ends = !next.ends;
  next.lastPoint!.changeEnds = changeEnds && next.winner === null;
  return next;
}

/** Coordinates in metres: net at x=0, baselines ±8, doubles sidelines ±4. Lines are in. */
export function landingWinner(lastHitter: Player, hitterEnd: -1 | 1, x: number, y = 0, halfWidth = 4, ballRadius = 0): { winner: Player; reason: PointReason } {
  const dx = Math.max(0, Math.abs(x) - 8);
  const dy = Math.max(0, Math.abs(y) - halfWidth);
  const inCourt = dx * dx + dy * dy <= ballRadius * ballRadius + 1e-12 && x * hitterEnd < 0;
  return { winner: inCourt ? lastHitter : other(lastHitter), reason: inCourt ? "in" : "out" };
}
export function faultWinner(offender: Player, reason: Exclude<PointReason, "in" | "out">) {
  return { winner: other(offender), reason };
}
