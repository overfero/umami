import { expect, it } from 'vitest';
import { prismaSessionConfig } from './prisma-session';

it('applies UTC last after inherited and URL startup options while preserving schema and other options', () => {
  const url = 'postgresql://synthetic@localhost/db?schema=owned&options=-c%20timezone%3DAsia%2FJakarta%20-c%20lock_timeout%3D23';
  const config = prismaSessionConfig(url, '-c search_path=owned -c timezone=America/New_York');
  expect(new URL(config.connectionString).searchParams.get('schema')).toBe('owned');
  expect(new URL(config.connectionString).searchParams.has('options')).toBe(false);
  expect(config.options).toBe('-c search_path=owned -c timezone=America/New_York -c timezone=Asia/Jakarta -c lock_timeout=23 -c TimeZone=UTC');
});

it('malformed credential-bearing URLs throw only sanitized configuration errors', () => {
  const password = 'synthetic-password-marker';
  const malformed = `postgresql://synthetic:${password}@localhost:invalid-port/db`;
  let thrown: unknown;
  try { prismaSessionConfig(malformed, ''); } catch (error) { thrown = error; }
  expect(thrown).toBeInstanceOf(Error);
  const error = thrown as Error;
  expect(error.message).toBe('Invalid PostgreSQL connection configuration');
  expect(error.cause).toBeUndefined();
  const ownProperties = Reflect.ownKeys(error).map(key => [String(key), Reflect.get(error, key)]);
  for (const representation of [error.message, error.stack ?? '', JSON.stringify(error), JSON.stringify(ownProperties)]) {
    expect(representation).not.toContain(password);
    expect(representation).not.toContain(malformed);
  }
  expect(Reflect.ownKeys(error).sort()).toEqual(['message', 'stack']);
});

it('fails closed on duplicate URL options or trailing escapes rather than guessing precedence', () => {
  expect(() => prismaSessionConfig('postgresql://host/db?options=a&options=b', '')).toThrow('startup options');
  expect(() => prismaSessionConfig('postgresql://host/db', '-c search_path=owned\\')).toThrow('startup options');
  expect(prismaSessionConfig('postgresql://host/db', '').options).toBe('-c TimeZone=UTC');
});
