// Runtime contracts are exercised against the locked upstream proof primitives.
declare module 'opentimestamps/src/*.js' {
  const primitive: unknown
  export default primitive
}
