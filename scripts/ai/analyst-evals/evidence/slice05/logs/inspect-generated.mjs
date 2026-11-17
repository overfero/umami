import assert from 'node:assert/strict';
import ts from 'typescript';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
for (const file of ['packages/api-client/src/generated/operations.ts', 'packages/api-client/src/generated/types.ts']) {
  const parse = text => ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const a = parse(execFileSync('git', ['show', `a285a1806:${file}`], { encoding: 'utf8' }));
  const b = parse(fs.readFileSync(file, 'utf8'));
  let compared = 0, added = 0;
  if (file.endsWith('operations.ts')) {
    const extract = source => {
      const declaration = source.statements.filter(ts.isVariableStatement).flatMap(s => [...s.declarationList.declarations]).find(d => d.name.getText(source) === 'operations');
      let value = declaration.initializer;
      while (!ts.isObjectLiteralExpression(value)) value = value.expression;
      return value.properties;
    };
    const previous = new Map(extract(a).map(p => [p.name.getText(a), p.getText(a)]));
    for (const p of extract(b)) {
      const key = p.name.getText(b);
      if (previous.has(key)) { assert.equal(p.getText(b), previous.get(key), key); compared++; }
      else added++;
    }
    assert.equal(compared, previous.size);
  } else {
    for (const old of a.statements.filter(ts.isInterfaceDeclaration)) {
      const updated = b.statements.find(s => ts.isInterfaceDeclaration(s) && s.name.text === old.name.text);
      for (const member of old.members) {
        const match = updated.members.find(m => m.name?.getText(b) === member.name?.getText(a));
        assert.ok(match, `removed ${old.name.text}.${member.name?.getText(a)}`);
        assert.equal(match.getText(b), member.getText(a), `${old.name.text}.${member.name?.getText(a)}`);
        compared++;
      }
      added += updated.members.length - old.members.length;
    }
  }
  console.log(file, { compared, added, oldMembersExact: true });
}
