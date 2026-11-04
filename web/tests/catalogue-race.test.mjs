// Execute the real page components with controlled promises and React hook lifecycles.
// No API/network/database, no copy of the request guard implementation in this test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const tick = () => new Promise(resolve => setImmediate(resolve));
const source = name => readFileSync(new URL(`../app/${name}/page.tsx`, import.meta.url), 'utf8');
function harness(name, code = source(name)) {
  const slots = [], effects = [], requests = [], logs = [];
  let cursor = 0, writes = 0, tree;
  const changed = (a, b) => !a || a.some((v, i) => !Object.is(v, b[i]));
  const react = {
    useState(value) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = value;
      return [slots[i], value => { writes++; slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
    },
    useRef(value) { const i = cursor++; return slots[i] ??= { current: value }; },
    useCallback(fn, deps) {
      const i = cursor++;
      if (!slots[i] || changed(slots[i].deps, deps)) slots[i] = { fn, deps };
      return slots[i].fn;
    },
    useEffect(fn, deps) {
      const i = cursor++;
      if (!slots[i] || changed(slots[i].deps, deps)) effects.push(() => {
        slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() };
      });
    },
  };
  const client = { from(table) {
    let resolve, reject;
    const promise = new Promise((a, b) => { resolve = a; reject = b; });
    const request = { table, filters: [], resolve, reject };
    requests.push(request);
    const chain = {
      select(value) { request.select = value; return chain; },
      order(...value) { request.order = value; return chain; },
      eq(...value) { request.filters.push(['eq', ...value]); return chain; },
      contains(...value) { request.filters.push(['contains', ...value]); return chain; },
      then: promise.then.bind(promise),
    };
    return chain;
  } };
  const modules = {
    react, 'react/jsx-runtime': require('react/jsx-runtime'),
    '@/lib/supabase': { supabase: client }, 'next/navigation': { useRouter: () => ({ push() {} }) },
    'next/link': { default: 'a' }, '@/i18n/context': { useLocale: () => 'en', useTranslations: () => key => key },
    '@/lib/species': { speciesName: id => id }, '@/lib/format': { formatPrice: value => String(value) },
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, require: id => { if (!(id in modules)) throw Error(`Unmocked import ${id}`); return modules[id]; },
    console: { error: (...args) => logs.push(args) },
  });
  const render = () => { cursor = 0; tree = exports.default(); while (effects.length) effects.shift()(); return tree; };
  function nodes(node) {
    if (Array.isArray(node)) return node.flatMap(n => nodes(n));
    if (!node || typeof node !== 'object') return [node];
    return [node, ...nodes(node.props?.children)];
  }
  const text = node => nodes(node).filter(n => typeof n === 'string' || typeof n === 'number').join(' ');
  const click = label => {
    const button = nodes(tree).find(n => n?.type === 'button' && text(n) === label);
    assert.ok(button, `Missing ${label}`); button.props.onClick();
  };
  render();
  return {
    render, requests, logs, click,
    category() { click(name === 'marketplace' ? 'category.food' : 'category.grooming'); render(); },
    species() { click('cat'); render(); },
    busy: () => nodes(tree).some(n => n?.props?.['aria-busy'] === 'true'),
    error: () => nodes(tree).some(n => n?.props?.['data-testid'] === `${name}-error`),
    text: () => text(tree), writes: () => writes,
    unmount() { for (const slot of slots) slot?.cleanup?.(); },
    async success(index, title) {
      const row = name === 'marketplace' ? { id: 501, name: title, price: 1, shops: { id: 1, shop_name: 'Sample' } } : { id: 601, service_name: title, category: 'อาบน้ำ-ตัดขน' };
      requests[index].resolve({ data: [row], error: null }); await tick(); render();
    },
    async fail(index, reject = false) {
      if (reject) requests[index].reject(Error('synthetic transport error'));
      else requests[index].resolve({ data: null, error: { message: 'synthetic API error' } });
      await tick(); render();
    },
  };
}
async function staleFailureScenario(h, reject = false) {
  h.category(); await h.success(1, 'Latest success'); await h.fail(0, reject);
  assert.ok(h.text().includes('Latest success')); assert.equal(h.error(), false); assert.equal(h.busy(), false); assert.equal(h.logs.length, 0);
}
for (const name of ['marketplace', 'service-hub']) {
  test(`${name}: slow API error cannot overwrite newer success`, async () => staleFailureScenario(harness(name)));
  test(`${name}: slow rejected promise cannot overwrite newer success`, async () => staleFailureScenario(harness(name), true));
  test(`${name}: rapid category/species changes keep loading until the newest request ends`, async () => {
    const h = harness(name); h.category(); h.species();
    await h.success(1, 'Middle response'); assert.equal(h.busy(), true);
    await h.fail(0); assert.equal(h.busy(), true); assert.equal(h.error(), false);
    await h.success(2, 'Newest filter'); assert.ok(h.text().includes('Newest filter')); assert.ok(!h.text().includes('Middle response'));
    const filters = JSON.parse(JSON.stringify(h.requests[2].filters));
    assert.ok(filters.some(f => f[0] === 'eq' && f[1] === 'category' && f[2] === (name === 'marketplace' ? 'อาหาร' : 'อาบน้ำ-ตัดขน')));
    assert.ok(filters.some(f => f[1] === (name === 'marketplace' ? 'pet_type' : 'pet_types')));
  });
  test(`${name}: older success cannot clear the latest error`, async () => {
    const h = harness(name); h.category(); await h.fail(1); await h.success(0, 'Old success');
    assert.equal(h.error(), true); assert.ok(!h.text().includes('Old success')); assert.equal(h.busy(), false);
  });
  test(`${name}: concurrent manual retries use the latest attempt only`, async () => {
    const h = harness(name); await h.fail(0); h.click('retry'); h.click('retry');
    assert.equal(h.requests.length, 3); await h.success(2, 'Retry success'); await h.fail(1, true);
    assert.equal(h.error(), false); assert.ok(h.text().includes('Retry success')); assert.equal(h.logs.length, 1);
  });
  for (const reject of [false, true]) test(`${name}: unmount invalidates pending ${reject ? 'rejection' : 'success'}`, async () => {
    const h = harness(name); h.unmount(); const before = h.writes();
    if (reject) h.requests[0].reject(Error('unmounted transport error'));
    else h.requests[0].resolve({ data: [], error: null });
    await tick(); assert.equal(h.writes(), before); assert.equal(h.logs.length, 0);
  });
  test(`${name}: regression kills removal of stale-response guards`, async () => {
    const original = source(name), mutant = original.replaceAll('if (!isCurrent()) return;', '');
    assert.notEqual(mutant, original);
    await assert.rejects(staleFailureScenario(harness(name, mutant)));
  });
}
