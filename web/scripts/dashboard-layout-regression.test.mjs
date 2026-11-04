// Local, synthetic regression coverage. No database or network access.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const req = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function load(file, overrides = {}) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(code, { module: loaded, exports: loaded.exports, window: { location: { pathname: '/farm-dashboard/12' } }, require: id => id in overrides ? overrides[id] : req(id) }, { filename: file });
  return loaded.exports;
}
for (const kind of ['farm', 'service', 'shop']) {
  const title = kind[0].toUpperCase() + kind.slice(1);
  const access = load(`lib/${kind}-access.ts`);
  test(`${kind}: hook uses the provider value and rejects a missing provider`, () => {
    function Probe() { return React.createElement('span', null, access[`use${title}Access`]().myRole); }
    for (const role of ['owner', 'manager', 'staff', 'viewer']) {
      const value = { [`${kind}Id`]: '12', myRole: role };
      assert.equal(renderToStaticMarkup(React.createElement(access[`${title}AccessContext`].Provider, { value }, React.createElement(Probe))), `<span>${role}</span>`);
    }
    assert.throws(() => renderToStaticMarkup(React.createElement(Probe)), new RegExp(`use${title}Access must be used inside ${kind}-dashboard layout`));
  });
  test(`${kind}: layout preserves session, membership, owner fallback and redirects`, async () => {
    for (const scenario of ['anonymous', 'owner', 'manager', 'staff', 'viewer', 'legacy-owner', 'denied']) {
      const states = []; const effects = []; const redirects = []; const queries = [];
      let cursor = 0;
      const router = { push: url => redirects.push(url) };
      const client = { auth: { getSession: async () => ({ data: { session: scenario === 'anonymous' ? null : { user: { id: 'synthetic-user' } } } }) }, from: table => {
        const query = { table, filters: [] }; queries.push(query);
        const chain = { select: columns => { query.columns = columns; return chain; }, eq: (key, value) => { query.filters.push([key, value]); return chain; }, maybeSingle: async () => ({ data: table === 'workspaces' ? ['owner','manager','staff','viewer'].includes(scenario) ? { workspace_members: [{ role: scenario }] } : null : scenario === 'legacy-owner' ? { id: 12 } : null }) };
        return chain;
      } };
      const layout = load(`app/${kind}-dashboard/[id]/layout.tsx`, {
        react: { ...React, useState: initial => { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = value; }]; }, useEffect: fn => effects.push(fn) },
        'next/navigation': { useRouter: () => router, useParams: () => ({ id: '12' }), usePathname: () => `/${kind}-dashboard/12` },
        '@/lib/supabase': { supabase: client },
        [`@/lib/${kind}-access`]: access,
        '@/app/components/PageLoader': { default: 'loader' },
        '@/app/components/DefaultBottomNav': { default: 'nav' },
        '@/app/components/FarmBottomNav': { default: 'nav' },
      }).default;
      layout({ children: 'child' });
      effects[0]();
      await new Promise(resolve => setImmediate(resolve));
      if (scenario === 'anonymous') { assert.match(redirects[0], /^\/login/); assert.equal(queries.length, 0); }
      else if (scenario === 'denied') { assert.deepEqual(redirects, ['/partner']); }
      else {
        cursor = 0;
        const result = layout({ children: 'child' });
        assert.equal(result.type, access[`${title}AccessContext`].Provider);
        assert.equal(result.props.value.myRole, scenario === 'legacy-owner' ? 'owner' : scenario);
        assert.equal(result.props.value[`${kind}Id`], '12');
        assert.equal(redirects.length, 0);
      }
      if (scenario !== 'anonymous') {
        assert.equal(queries[0].table, 'workspaces');
        assert.deepEqual(queries[0].filters, [['type',kind],['entity_id',12],['workspace_members.user_id','synthetic-user']]);
        if (['legacy-owner','denied'].includes(scenario)) assert.deepEqual(queries[1].filters, [['id','12'],['user_id','synthetic-user']]);
      }
    }
  });
}
test('farm profile editing remains owner only', () => {
  const { canEditFarmProfile } = load('lib/farm-access.ts');
  for (const role of ['owner','manager','staff','viewer']) assert.equal(canEditFarmProfile(role), role === 'owner');
});
const allowed = new Set(['default','config','generateStaticParams','unstable_instant','unstable_dynamicStaleTime','revalidate','dynamic','dynamicParams','fetchCache','preferredRegion','runtime','maxDuration','metadata','generateMetadata','viewport','generateViewport']);
test('all layout runtime exports match Next.js 16.2.10 allowlist', () => {
  for (const file of fs.readdirSync(path.join(root, 'app'), { recursive: true }).filter(f => /(^|\/)layout\.[jt]sx?$/.test(f))) {
    const source = ts.createSourceFile(file, fs.readFileSync(path.join(root, 'app', file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    for (const node of source.statements) {
      if (ts.isExportDeclaration(node)) {
        if (node.isTypeOnly) continue;
        assert.ok(node.exportClause && ts.isNamedExports(node.exportClause), `${file}: wildcard export`);
        for (const item of node.exportClause.elements) if (!item.isTypeOnly) assert.ok(allowed.has(item.name.text), `${file}: ${item.name.text}`);
      } else if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || node.modifiers.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)) continue;
        const names = ts.isVariableStatement(node) ? node.declarationList.declarations.map(d => d.name.getText(source)) : [node.name?.text];
        for (const name of names) assert.ok(allowed.has(name), `${file}: ${name}`);
      }
    }
  }
});
