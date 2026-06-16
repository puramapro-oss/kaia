export const KARMA_SPLIT = { users: 50, asso: 10, sasu: 40 } as const;

export interface RevenueSplit {
  users: number;
  asso: number;
  sasu: number;
}

export function splitRevenue(totalCents: number): RevenueSplit {
  const users = Math.floor(totalCents * 0.5);
  const asso = Math.floor(totalCents * 0.1);
  const sasu = totalCents - users - asso;
  return { users, asso, sasu };
}

export function calculateUserShare(
  userSessions: number,
  totalSessions: number,
  usersPoolCents: number
): number {
  if (totalSessions === 0 || userSessions === 0) return 0;
  return Math.floor((userSessions / totalSessions) * usersPoolCents);
}
