const fs = require('fs');
const vm = require('vm');

const file = process.argv[2] || 'reports/legal-approval-master/index.html';
const html = fs.readFileSync(file, 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if (scripts.length !== 1) throw new Error(`Expected one script, found ${scripts.length}`);
new vm.Script(scripts[0][1]);

const ids = [...html.matchAll(/"Result ID":"([^"]+)"/g)].map((match) => match[1]);
const failures = [];
if (ids.length !== 646) failures.push(`embedded results: ${ids.length}`);
if (new Set(ids).size !== 646) failures.push(`unique result IDs: ${new Set(ids).size}`);
if (!html.includes('id="results" class="cards" aria-label="نتائج التقرير" tabindex="-1"')) failures.push('results focus target missing');
if (!html.includes('طباعة النتائج المصفّاة')) failures.push('filtered print label missing');

const elements = {};
const makeElement = (id) => elements[id] || (elements[id] = {
  id, value: '', disabled: false, hidden: false, textContent: '', innerHTML: '',
  insertAdjacentHTML(_position, value) { this.innerHTML += value; },
  addEventListener(type, handler) { this[`on${type}`] = handler; }
});
const pager = makeElement('pager');
let printedCards = 0;
const context = {
  document: {
    getElementById: makeElement,
    querySelector(selector) { return selector === '.pager' ? pager : null; }
  },
  window: { print() { printedCards = (elements.results.innerHTML.match(/<details /g) || []).length; } },
  scrollTo() {}, Set, Object, String, Math
};
vm.createContext(context);
vm.runInContext(scripts[0][1], context);
if (elements.count.textContent !== 'المعروض: 646 من 646 نتيجة') failures.push('initial count failed');
if ((elements.results.innerHTML.match(/<details /g) || []).length !== 25) failures.push('initial page size failed');
elements.search.value = 'R-UNI-COMPLAINT'; elements.search.oninput();
if (elements.count.textContent !== 'المعروض: 1 من 646 نتيجة') failures.push('search failed');
elements.search.value = ''; elements.search.oninput();
elements.risk.value = 'CRITICAL'; elements.risk.onchange();
if (elements.count.textContent !== 'المعروض: 28 من 646 نتيجة') failures.push('risk filter failed');
elements.risk.value = ''; elements.risk.onchange();
elements.print.onclick();
if (printedCards !== 646) failures.push(`print rendered ${printedCards} cards`);

const summary = {
  status: failures.length ? 'FAIL' : 'PASS',
  embedded_results: ids.length,
  unique_results: new Set(ids).size,
  initial_page_size: 25,
  search: failures.includes('search failed') ? 'FAIL' : 'PASS',
  critical_filter: failures.includes('risk filter failed') ? 'FAIL' : 'PASS',
  printable_results: printedCards,
  failures
};
console.log(JSON.stringify(summary, null, 2));
if (failures.length) process.exit(1);
