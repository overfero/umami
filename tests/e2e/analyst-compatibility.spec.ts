import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { loginPage } from './helpers';
import { fixtureSchema } from '../../src/lib/ai/fixture-database.mjs';
const schema = fixtureSchema(process.env.DATABASE_URL);
test.skip(!schema || schema === 'analyst_fixture' || process.env.ANALYST_FLAGS_OFF_PHASE !== '1', 'unique owned flags-off fixture required');
test('flags off browser preserves native board and persisted historical snapshot without live analysis execution', async ({ page, request }) => {
  const psql = (sql: string, variables: Record<string,string> = {}) => execFileSync(`${process.env.PG_BIN}/psql`,
    ['-XAt','-h','127.0.0.1','-p','25432','-U','ai_synthetic','-d','ai_synthetic','-v','ON_ERROR_STOP=1',
      ...Object.entries(variables).flatMap(([k,v]) => ['-v',`${k}=${v}`])], { input:sql,encoding:'utf8',timeout:10000 }).trim();
  expect(psql('select owner from public.ai_synthetic_owner;')).toBe('umami-ai-synthetic-r3');
  expect(psql("select obj_description(oid) from pg_namespace where nspname=:'schema';",{schema:schema!})).toBe('umami-analyst-fixture-r1');
  const auth = await loginPage(page, request); const headers={authorization:auth.authorization};
  const body={name:'Unchanged native board',type:'website',parameters:{websiteId:'a11a1a00-0000-4000-8000-000000000001',rows:[{id:'native-row',columns:[{id:'native-widget',component:{type:'WebsiteMetricsBar'}}]}]}};
  const created=await request.post('/api/boards',{headers,data:body});expect(created.status()).toBe(200);const board=await created.json();
  const chatId=randomUUID(),messageId=randomUUID();
  const part={type:'result-chart',id:'historical-result',kind:'table',series:{label:'Observed login',metric:'events',unit:'day',timezone:'Asia/Jakarta',range:{startAt:1790816400000,endAt:1790906400000},appliedFilters:{event:'login',country:'US'},buckets:[{t:'2026-10-01T01:00:00.000Z',y:3},{t:'2026-10-02T02:00:00.000Z',y:2}],total:5}};
  const message={id:messageId,role:'assistant',createdAt:'2026-10-02T02:00:00.000Z',status:'done',parts:[part]};
  psql(`set search_path to ${schema}; insert into ai_chat(chat_id,user_id,title,updated_at) values(:'chat'::uuid,'41e2b680-648e-4b09-bcd7-3e2b10c06264','Historical fixture',now()); insert into ai_chat_message(message_id,chat_id,role,content) values(:'message'::uuid,:'chat'::uuid,'assistant',:'content'::jsonb);`,{chat:chatId,message:messageId,content:JSON.stringify(message)});
  const saved=psql(`select content::text from ${schema}.ai_chat_message where message_id=:'id'::uuid;`,{id:messageId});
  try {
    await page.goto(`/boards/${board.id}?date=range:1790812800000:1792022400000`);
    await expect(page.getByRole('heading', { name: 'Unchanged native board', exact: true })).toBeVisible();
    for (const label of ['Views', 'Visits']) {
      const metric = page.getByText(label, { exact: true }).locator('../..');
      // MetricCard's numeric Text directly wraps AnimatedDiv; ChangeLabel is a Row
      // with its own identical title and must never substitute for the metric value.
      const value = metric.locator(':scope > span > div[title="42"]');
      await expect(value).toHaveCount(1);
      await expect(value).toHaveText('42');
      await expect(metric).not.toContainText('Unsupported');
    }
    expect(await (await request.get(`/api/boards/${board.id}`,{headers})).json()).toEqual(board);
    let executions=0;page.on('request',r=>{if(/\/api\/analyses\/.+\/execute/.test(r.url()))executions++;});
    await page.goto('/assistant');await page.getByRole('button',{name:'Historical fixture',exact:true}).click();
    await expect(page.getByRole('region',{name:'Chart data'})).toBeVisible();
    await expect(page.getByText('Total events: 5')).toBeVisible();
    await expect(page.getByText('event = login · country = US',{exact:false})).toBeVisible();
    await expect(page.getByRole('rowheader').filter({hasText:'2026-10-01T01:00:00.000Z'})).toBeVisible();
    expect(executions).toBe(0);
    expect(psql(`select content::text from ${schema}.ai_chat_message where message_id=:'id'::uuid;`,{id:messageId})).toBe(saved);
  } finally {
    psql(`delete from ${schema}.ai_chat where chat_id=:'id'::uuid;`,{id:chatId});
    await request.delete(`/api/boards/${board.id}`,{headers});
  }
});
