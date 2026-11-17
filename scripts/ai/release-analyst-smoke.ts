import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { loadApprovedInput } from './release-smoke/analyst-input';

/** Public runner has no injectable transport/clock or approval bypass. All I/O follows local qualification. */
export async function releaseAnalystSmoke(
  args = process.argv.slice(2),
  env: Record<string, string | undefined> = process.env,
) {
  let input: ReturnType<typeof loadApprovedInput>;
  try {
    input = loadApprovedInput(args, env, Date.now());
  } catch {
    return { status: 'failed', category: 'guard-rejected', cleanup: { status: 'not-created' } };
  }
  const { approval, manifest, readiness, token } = input;
  const startedAt = Date.now();
  const deadline = Math.min(
    startedAt + approval.limits.durationMs,
    approval.expiresAt,
    readiness.expiresAt,
  );
  const id = randomUUID();
  const marker = `release-ingest-${randomUUID().replaceAll('-', '')}`;
  const name = `analyst-smoke-${id}`;
  const domain = `${id}.invalid`;
  let requests = 0;
  let createAttempted = false;
  let created = false;
  let safeToCleanup = true;
  let stage = 'runtime-preflight';
  const report = {
    schema: 'analyst-release-smoke-v1',
    status: 'failed',
    category: '',
    approvalSha256: input.approvalSha256,
    manifestSha256: input.manifestSha256,
    readinessSha256: input.readinessSha256,
    sourceRevision: manifest.sourceRevision,
    sourceFiles: manifest.sourceFiles,
    readinessReported: {
      sourceRevision: readiness.sourceRevision,
      image: readiness.image,
      buildId: readiness.buildId,
      verifierImage: readiness.verifierImage,
      flags: readiness.flags,
      verifier: 'operator-attested-executed-synthetic-render',
    },
    runtimeObserved: {
      heartbeat: false,
      authDenials: [] as number[],
      principalMatched: false,
      ingestStatuses: [] as number[],
      storedEvents: 0,
    },
    vision: input.vision,
    trustBoundary:
      'Unsigned operator-supplied readiness/verifier/vision records and local source/file equality; not cryptographic provenance or independent deployed-image/flag authenticity. Runtime checks are separate. No provider call made.',
    cleanup: {
      status: 'not-created',
      retained: [] as { websiteId: string; marker: string; reason: string }[],
    },
    requests: 0,
  };
  async function request(path: string, method = 'GET', body?: unknown, authenticated = false) {
    if (Date.now() >= deadline || ++requests > approval.limits.requests) throw new Error('bounds');
    const url = new URL(path, approval.target.baseUrl);
    const base = new URL(approval.target.baseUrl);
    if (
      url.origin !== base.origin ||
      !url.pathname.startsWith(base.pathname) ||
      !path.startsWith('api/') ||
      path.includes('..')
    )
      throw new Error('confinement');
    const response = await fetch(url, {
      method,
      redirect: 'manual',
      credentials: 'omit',
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(authenticated ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(Math.max(1, Math.min(10000, deadline - Date.now()))),
    });
    // Redirects, including same-origin redirects, never confer authority on their Location.
    if ((response.status >= 300 && response.status < 400) || response.url !== url.href) {
      safeToCleanup = false;
      await response.body?.cancel();
      throw new Error('unsafe-response');
    }
    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      if (reader)
        while (true) {
          const part = await reader.read();
          if (part.done) break;
          size += part.value.byteLength;
          if (size > 128 * 1024 || Date.now() >= deadline) throw new Error('response-bounds');
          chunks.push(part.value);
        }
    } finally {
      await reader?.cancel().catch(() => {});
      reader?.releaseLock();
    }
    const bytes = Buffer.concat(chunks);
    return {
      status: response.status,
      json: () => {
        if (!/^application\/json\b/i.test(response.headers.get('content-type') ?? ''))
          throw new Error('content-type');
        return JSON.parse(bytes.toString('utf8'));
      },
    };
  }
  const require200 = (response: { status: number }) => {
    if (response.status !== 200) throw new Error('http');
  };
  function owned(value: any) {
    if (
      value?.id !== id ||
      value.name !== name ||
      value.domain !== domain ||
      value.userId !== approval.principalId ||
      value.createdBy !== approval.principalId ||
      value.teamId != null ||
      value.deletedAt != null
    )
      throw new Error('ownership');
  }
  try {
    const heartbeat = await request('api/heartbeat');
    require200(heartbeat);
    if (heartbeat.json().ok !== true) throw new Error('readiness');
    report.runtimeObserved.heartbeat = true;
    for (const [path, method] of [
      ['api/auth/verify', 'POST'],
      ['api/websites', 'GET'],
    ]) {
      const response = await request(path, method);
      if (![401, 403].includes(response.status)) throw new Error('auth-denial');
      report.runtimeObserved.authDenials.push(response.status);
    }
    const auth = await request('api/auth/verify', 'POST', undefined, true);
    require200(auth);
    if (auth.json().id !== approval.principalId) throw new Error('principal');
    report.runtimeObserved.principalMatched = true;
    stage = 'synthetic-create';
    // Client-assigned random ID, never list/reuse/overwrite an existing website.
    createAttempted = true;
    const response = await request('api/websites', 'POST', { id, name, domain }, true);
    require200(response);
    owned(response.json());
    created = true;
    const readback = await request(`api/websites/${id}`, 'GET', undefined, true);
    require200(readback);
    owned(readback.json());
    stage = 'ingest-storage';
    for (const custom of [false, true]) {
      const ingest = await request('api/send', 'POST', {
        type: 'event',
        payload: {
          website: id,
          hostname: domain,
          url: `/${marker}`,
          language: 'en-US',
          screen: '1440x1000',
          userAgent:
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          ...(custom ? { name: marker } : {}),
        },
      });
      require200(ingest);
      report.runtimeObserved.ingestStatuses.push(ingest.status);
    }
    // Bounded exact website+marker query; no global analytics read and no polling/retry.
    const end = Date.now();
    const query = new URLSearchParams({
      startAt: String(startedAt - 60000),
      endAt: String(end + 60000),
      search: marker,
      page: '1',
      pageSize: '10',
    });
    const stored = await request(`api/websites/${id}/events?${query}`, 'GET', undefined, true);
    require200(stored);
    const rows = stored.json();
    if (
      !Array.isArray(rows.data) ||
      rows.count !== 2 ||
      rows.data.length !== 2 ||
      new Set(rows.data.map(row => row.id)).size !== 2 ||
      !rows.data.every(
        row => typeof row.id === 'string' && row.websiteId === id && row.urlPath === `/${marker}`,
      ) ||
      rows.data.filter(
        row => row.eventType === 1 && (row.eventName === '' || row.eventName === null),
      ).length !== 1 ||
      rows.data.filter(row => row.eventType === 2 && row.eventName === marker).length !== 1
    )
      throw new Error('stored-proof');
    report.runtimeObserved.storedEvents = 2;
    report.status = 'passed';
  } catch {
    // Never serialize exception, URL, response body, user profile, header or token.
    report.category = `${stage}-failed`;
  } finally {
    if (created && safeToCleanup) {
      try {
        const ownership = await request(`api/websites/${id}`, 'GET', undefined, true);
        require200(ownership);
        owned(ownership.json());
        const deleted = await request(`api/websites/${id}`, 'DELETE', undefined, true);
        require200(deleted);
        report.cleanup.status = 'deleted-owned';
      } catch {
        report.cleanup.status = 'retained';
        report.status = 'failed';
        report.category ||= 'cleanup-failed';
      }
    } else if (createAttempted) report.cleanup.status = 'retained';
    if (report.cleanup.status === 'retained')
      report.cleanup.retained.push({
        websiteId: id,
        marker: name,
        reason: 'creation-or-ownership-or-transport-uncertain-manual-review-required',
      });
    report.requests = requests;
  }
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await releaseAnalystSmoke();
  console.log(JSON.stringify(result));
  process.exitCode = result.status === 'passed' ? 0 : 1;
}
