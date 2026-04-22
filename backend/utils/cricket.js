const BALLS_PER_OVER = 6;

const splitOvers = (oversValue = 0) => {
  const safe = Number(oversValue) || 0;
  const completed = Math.floor(safe + 1e-9);
  const balls = Math.round((safe - completed) * 10);
  return { completed, balls };
};

const toOversFormat = (completed, balls) => {
  return Math.round((completed + balls / 10) * 10) / 10;
};

const advanceOver = (oversValue) => {
  const { completed, balls } = splitOvers(oversValue);
  const nextBalls = balls + 1;
  if (nextBalls >= BALLS_PER_OVER) {
    return toOversFormat(completed + 1, 0);
  }
  return toOversFormat(completed, nextBalls);
};

const isExtra = (value) => value === 'wide' || value === 'no-ball';

module.exports = {
  BALLS_PER_OVER,
  advanceOver,
  splitOvers,
  isExtra,
};
