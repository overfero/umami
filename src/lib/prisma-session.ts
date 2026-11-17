/**
 * Temporary PrismaPg7.10 instant-transport policy: every physical connection starts UTC.
 * The pinned adapter drops offsets on Date writes and misreads nonUTC timestamptz results.
 * Explicit business calendars (e.g. Asia/Jakarta) stay in query/date/display semantics.
 * Trusted SQL must not SET a nonUTC session/transaction timezone: startup settings are
 * not a security boundary against SQL or database administrators changing a live session.
 */
export function prismaSessionConfig(
  connectionString: string,
  inheritedOptions = process.env.PGOPTIONS ?? '',
) {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    // Node's URL error retains credential-bearing input. Do not propagate it or its cause.
    throw new Error('Invalid PostgreSQL connection configuration');
  }
  const urlOptions = url.searchParams.getAll('options');
  if (urlOptions.length > 1) throw new Error('Ambiguous PostgreSQL startup options');
  const parts = [inheritedOptions, urlOptions[0] ?? ''].filter(Boolean);
  // PostgreSQL startup options use backslash escaping, not shell quotes. An odd trailing
  // escape could merge our appended flag into the preceding value instead of enforcing it.
  for (const part of parts) {
    const trailing = part.match(/\\+$/)?.[0].length ?? 0;
    if (trailing % 2 || part.includes('\0')) throw new Error('Invalid PostgreSQL startup options');
  }
  // pg parses connectionString AFTER PoolConfig and lets URL options win. Remove them
  // there, preserve both sources explicitly, then PostgreSQL processes UTC last.
  url.searchParams.delete('options');
  return { connectionString: url.toString(), options: [...parts, '-c TimeZone=UTC'].join(' ') };
}
