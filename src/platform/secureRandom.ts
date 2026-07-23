const UINT32_RANGE = 0x1_0000_0000;

/**
 * Returns an unbiased cryptographically secure integer in
 * [0, maxExclusive). Rejection sampling prevents the uneven distribution
 * caused by applying modulo when the range is not a power of two.
 */
export function secureRandomInt(maxExclusive: number) {
  if (
    !Number.isSafeInteger(maxExclusive) ||
    maxExclusive < 1 ||
    maxExclusive > UINT32_RANGE
  ) {
    throw new RangeError("maxExclusive must be an integer from 1 to 2^32.");
  }

  const bucketSize = Math.floor(UINT32_RANGE / maxExclusive);
  const acceptedRange = bucketSize * maxExclusive;
  const value = new Uint32Array(1);

  do {
    crypto.getRandomValues(value);
  } while (value[0] >= acceptedRange);

  return Math.floor(value[0] / bucketSize);
}
