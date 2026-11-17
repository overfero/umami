import { expect, it } from 'vitest';
import { createDocument } from 'zod-openapi';
import { operations } from '@/app/api/ai/assistant/chats/contract';
it('documents re-exported assistant JSON requests and the actual SSE turn response', () => {
  const document = createDocument({
    openapi: '3.1.0',
    info: { title: 'Assistant', version: '1' },
    paths: Object.fromEntries(
      operations.map(contract => [contract.path, { [contract.method]: contract.operation }]),
    ),
  });
  for (const operation of operations) {
    const request = document.paths?.[operation.path]?.[operation.method]?.requestBody;
    expect(request).toHaveProperty('content.application/json.schema');
  }
  const response =
    document.paths?.['/api/ai/assistant/chats/{chatId}/turn']?.post?.responses?.['200'];
  expect(response).toHaveProperty('content.text/event-stream.schema.type', 'string');
  expect(response).not.toHaveProperty('content.application/json');
});
