// Re-exported handlers validate plain request bodies; source inference cannot recover them.
import { z } from 'zod';
import { defineOperation } from '@/openapi/operation';
import { jsonResponse } from '@/openapi/schemas';

const title = z.string().refine(value => !!value.trim() && value.trim().length <= 200);
const chatId = z.object({ chatId: z.string() });
const summary = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
const error = jsonResponse(z.object({ error: z.string() }), 'Request rejected.');
const body = (schema: z.ZodType, required = true) => ({
  required,
  content: { 'application/json': { schema } },
});
const base = { audience: 'public', auth: 'bearer' } as const;

export const operations = [
  defineOperation({
    ...base,
    method: 'post',
    path: '/api/ai/assistant/chats',
    operation: {
      operationId: 'postAiAssistantChats',
      summary: 'Create an assistant chat',
      requestBody: body(z.object({ title: title.optional() }), false),
      responses: { 200: jsonResponse(summary), 400: error, 401: error },
    },
  }),
  defineOperation({
    ...base,
    method: 'patch',
    path: '/api/ai/assistant/chats/{chatId}',
    operation: {
      operationId: 'patchAiAssistantChatsChatId',
      summary: 'Rename an assistant chat',
      requestParams: { path: chatId },
      requestBody: body(z.object({ title })),
      responses: { 200: jsonResponse(summary), 400: error, 401: error, 404: error },
    },
  }),
  defineOperation({
    ...base,
    method: 'post',
    path: '/api/ai/assistant/chats/{chatId}/turn',
    operation: {
      operationId: 'postAiAssistantChatsChatIdTurn',
      summary: 'Run an assistant turn',
      description:
        'Streams named server-sent events. The client transport returns text, not a JSON result or parsed event iterator. Message limit is 32768 UTF-8 bytes.',
      requestParams: { path: chatId },
      requestBody: body(
        z.object({
          message: z.string().min(1),
          context: z
            .object({
              websiteId: z.string().max(100).optional(),
              boardId: z.string().max(100).optional(),
              timezone: z.string().max(100).optional(),
              startAt: z.number().nonnegative().optional(),
              endAt: z.number().nonnegative().optional(),
            })
            .strict()
            .optional(),
        }),
      ),
      responses: {
        200: {
          description: 'Named assistant events encoded as SSE frames.',
          content: { 'text/event-stream': { schema: z.string() } },
        },
        400: error,
        401: error,
        404: error,
        409: error,
        429: error,
      },
    },
  }),
  defineOperation({
    ...base,
    method: 'post',
    path: '/api/ai/assistant/chats/{chatId}/reply',
    operation: {
      operationId: 'postAiAssistantChatsChatIdReply',
      summary: 'Reply to a pending assistant interaction',
      requestParams: { path: chatId },
      requestBody: body(
        z.discriminatedUnion('kind', [
          z.object({ partId: z.string(), kind: z.literal('confirm'), confirmed: z.boolean() }),
          z.object({
            partId: z.string(),
            kind: z.literal('question'),
            answer: z.string().min(1).max(4000),
          }),
        ]),
      ),
      responses: {
        200: jsonResponse(z.object({ ok: z.literal(true) })),
        401: error,
        404: error,
        409: error,
      },
    },
  }),
] as const;
