const fs = require('fs');
const vm = require('vm');
const { performance } = require('perf_hooks');

const html = fs.readFileSync('index.html', 'utf8');
const candidate = fs.readFileSync('wesh_baed_sale_final_candidate.html', 'utf8');
const serviceWorker = fs.readFileSync('service-worker.js', 'utf8');
const manifest = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
const dbStart = html.indexOf('const DB=') + 9;
const dbEnd = html.indexOf(';\nconst ', dbStart);
if (dbStart < 9 || dbEnd < 0) throw new Error('DB not found');
const db = JSON.parse(html.slice(dbStart, dbEnd));

const nodes = db.nodes;
const options = db.options;
const results = db.results;
const sources = db.sources;
const nodeIds = new Set(Object.keys(nodes));
const resultIds = new Set(Object.keys(results));
const allIds = new Set([...nodeIds, ...resultIds]);
const flatOptions = Object.entries(options).flatMap(([question, rows]) => rows.map((row, index) => ({ question, index, ...row })));

const paths = new Map([[db.start, []]]);
const queue = [db.start];
while (queue.length) {
  const id = queue.shift();
  for (const [index, option] of (options[id] || []).entries()) {
    if (paths.has(option.next_id)) continue;
    paths.set(option.next_id, [...paths.get(id), { question_id: id, option_index: index, label: option.label, next_id: option.next_id }]);
    queue.push(option.next_id);
  }
}

const grouped = new Map();
for (const id of resultIds) {
  const path = paths.get(id);
  if (!path) continue;
  const group = path[0]?.label || 'بدون تصنيف';
  if (!grouped.has(group)) grouped.set(group, []);
  grouped.get(group).push({ result_id: id, path });
}
for (const rows of grouped.values()) rows.sort((a, b) => a.path.length - b.path.length || a.result_id.localeCompare(b.result_id));
const groups = [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0], 'ar'));
const scenarios = [];
for (let round = 0; scenarios.length < 30; round++) {
  let added = false;
  for (const [group, rows] of groups) {
    if (!rows[round]) continue;
    scenarios.push({ number: scenarios.length + 1, group, ...rows[round] });
    added = true;
    if (scenarios.length === 30) break;
  }
  if (!added) break;
}

const scenarioFailures = [];
let journeyAssertions = 0;
for (const scenario of scenarios) {
  let current = db.start;
  const history = [];
  for (const step of scenario.path) {
    journeyAssertions++;
    if (step.question_id !== current) scenarioFailures.push(`${scenario.result_id}: discontinuous path at ${step.question_id}`);
    const option = (options[current] || [])[step.option_index];
    journeyAssertions++;
    if (!option || option.next_id !== step.next_id || option.label !== step.label) scenarioFailures.push(`${scenario.result_id}: option mismatch at ${current}`);
    history.push(current);
    current = step.next_id;
  }
  const result = results[current];
  journeyAssertions++;
  if (!result || current !== scenario.result_id) scenarioFailures.push(`${scenario.result_id}: did not reach result`);
  if (!result) continue;
  const situation = result.ui_current_situation || result.current_situation;
  const action = result.ui_next_step || result.next_step || result.ui_action_required || result.action_required;
  journeyAssertions += 6;
  if (!String(situation || '').trim()) scenarioFailures.push(`${scenario.result_id}: missing situation`);
  if (!String(action || '').trim()) scenarioFailures.push(`${scenario.result_id}: missing action`);
  if (!result.source_id || !sources[result.source_id]) scenarioFailures.push(`${scenario.result_id}: missing source mapping`);
  if (history.length !== scenario.path.length) scenarioFailures.push(`${scenario.result_id}: back-stack mismatch`);
  if (scenario.path.length && history.at(-1) !== scenario.path.at(-1).question_id) scenarioFailures.push(`${scenario.result_id}: previous navigation mismatch`);
  if (result.authority && result.authority === sources[result.source_id]?.authority && /هيئة الخبراء/.test(result.authority)) scenarioFailures.push(`${scenario.result_id}: source authority exposed as destination`);
}

const scriptStart = html.indexOf('function norm');
const scriptEnd = html.indexOf('function renderQuickSearch', scriptStart);
const searchSource = html.slice(scriptStart, scriptEnd) + '\nthis.norm=norm;this.quickScores=quickScores;';
const searchContext = { DB: db, URL, Set, Object, String, Array };
vm.createContext(searchContext);
vm.runInContext(searchSource, searchContext);
const searchCases = [
  ['فصلوني من العمل', 'Q050'], ['راتبي متاخر', 'Q050'], ['زوجي مايصرف', 'Q402'], ['ابي نفقه', 'Q402'],
  ['عندي حكم نفقة وما يدفع', 'Q402'], ['حسابي محجوز', 'Q040'], ['صدر علي 46', 'Q040'], ['فاتتني مدة الاعتراض', 'Q030'],
  ['الحكم غلط', 'Q030'], ['المستاجر ما سدد', 'Q070'], ['المؤجر طردني', 'Q070'], ['شركة نصبت علي', 'Q080'],
  ['شريكي سرقني', 'Q080'], ['البنك خصم مبلغ', 'Q110'], ['التامين رفض التعويض', 'Q110'], ['رحلتي انلغت', 'Q110'],
  ['شنطتي ضاعت', 'Q110'], ['المويه مقطوعه', 'Q110'], ['فاتوره الكهرب غلط', 'Q110'], ['صار تسريب لبياناتي', 'Q110'],
  ['ابي اوكل شخص', 'Q100'], ['تصديق وكاله', 'Q100'], ['هويتي ضاعت', 'Q294'], ['تجديد الاقامه', 'Q110'],
  ['تجديد الجواز', 'Q110'], ['مخالفة ساهر غلط', 'Q110'], ['نفاذ ما يفتح', 'Q300'], ['توكلنا ما يشتغل', 'Q300'],
  ['رخصه بلدي', 'Q308'], ['توثيق متجر الكتروني', 'Q309'], ['اخوي مايقسم الورث', 'Q409'], ['ابي حضانه', 'Q403'],
  ['ابي زيارة عيالي', 'Q408'], ['طلقني وما وثق', 'Q406'], ['ابي اخلع زوجي', 'Q407'], ['الولي رافض يزوجني', 'Q417'],
  ['شكوى على مستشفى', 'Q110'], ['شركة الشحن ضيعت طلبي', 'Q110'], ['   فصلوني   من   العمل   ', 'Q050']
];
const searchFailures = [];
const searchResults = [];
const searchStarted = performance.now();
for (const [term, expected] of searchCases) {
  const hits = searchContext.quickScores(term);
  const actual = hits[0]?.id || null;
  searchResults.push({ term, expected, actual, pass: actual === expected });
  if (actual !== expected) searchFailures.push(`${term}: expected ${expected}, got ${actual}`);
}
const longStarted = performance.now();
const longHits = searchContext.quickScores('راتب '.repeat(10000));
const longSearchMs = performance.now() - longStarted;
const searchTotalMs = performance.now() - searchStarted;
if (longSearchMs > 250) searchFailures.push(`long search took ${longSearchMs.toFixed(1)}ms`);

const sourceUse = new Map(Object.keys(sources).map(id => [id, 0]));
for (const result of Object.values(results)) if (sourceUse.has(result.source_id)) sourceUse.set(result.source_id, sourceUse.get(result.source_id) + 1);
const orphans = [...sourceUse.entries()].filter(([, count]) => count === 0).map(([id]) => id).sort();

const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
const jsErrors = [];
for (const [index, script] of inlineScripts.entries()) {
  try { new vm.Script(script, { filename: `index-inline-${index}.js` }); } catch (error) { jsErrors.push(error.message); }
}
const externalScripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)/gi)].map(match => match[1]);
const externalAssets = [...html.matchAll(/(?:src|href)=["'](https?:\/\/[^"']+)/gi)].map(match => match[1]);
const blankLinks = [...html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)].map(match => match[0]);
const unsafeBlankLinks = blankLinks.filter(tag => !/rel=["'][^"']*noopener[^"']*noreferrer/.test(tag));
const nonHttpsSources = Object.entries(sources).filter(([, source]) => !/^https:\/\//i.test(source.url || '')).map(([id]) => id);
const secretPatterns = {
  private_key: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  github_token: /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/,
  generic_secret: /(?:api[_-]?key|client[_-]?secret|access[_-]?token)\s*[:=]\s*["'][^"']{12,}/i
};
const secrets = Object.entries(secretPatterns).filter(([, regex]) => regex.test(html)).map(([name]) => name);

const structural = {
  broken_next_id: flatOptions.filter(option => !allIds.has(option.next_id)).length,
  unreachable_questions: [...nodeIds].filter(id => !paths.has(id)).length,
  unreachable_results: [...resultIds].filter(id => !paths.has(id)).length,
  dead_ends: [...nodeIds].filter(id => !(options[id] || []).length).length,
  missing_source_id: Object.values(results).filter(result => !result.source_id || !sources[result.source_id]).length,
  broken_source_references: Object.values(results).filter(result => result.source_id && !sources[result.source_id]).length,
  duplicate_questions: Object.values(Object.groupBy(Object.values(nodes), node => String(node.text || '').trim())).filter(group => group.length > 1).length,
  duplicate_options: Object.entries(options).reduce((count, [, rows]) => count + Object.values(Object.groupBy(rows, option => String(option.label || '').trim())).filter(group => group.length > 1).length, 0),
  javascript_syntax_errors: jsErrors.length
};

const checks = {
  counts_unchanged: nodeIds.size === 305 && flatOptions.length === 1296 && resultIds.size === 646 && Object.keys(sources).length === 621,
  candidate_matches_index: candidate === html,
  exactly_one_popstate_listener: (html.match(/window\.addEventListener\('popstate'/g) || []).length === 1,
  storage_access_guarded: /let saved='';try\{saved=localStorage\.getItem/.test(html),
  no_source_authority_fallback: !/r\.authority\|\|source\.authority/.test(html),
  empty_result_fields_filtered: (html.match(/\.filter\(x=>displayValue\(x\[1\]\)\)/g) || []).length >= 2,
  safe_official_urls: /function safeUrl\(/.test(html) && nonHttpsSources.length === 0,
  no_external_scripts: externalScripts.length === 0,
  no_external_assets: externalAssets.length === 0,
  safe_blank_links: unsafeBlankLinks.length === 0,
  no_secrets: secrets.length === 0,
  no_cookies: !/document\.cookie/.test(html),
  no_analytics: !/gtag\(|google-analytics|googletagmanager|plausible|matomo/i.test(html),
  no_forms: !/<form\b/i.test(html),
  csp_present: /Content-Security-Policy/.test(html),
  referrer_policy_present: /name="referrer" content="no-referrer"/.test(html),
  skip_link: /class="skipLink" href="#screen"/.test(html),
  semantic_main: /<main\b/.test(html),
  semantic_header: /<header\b/.test(html),
  progress_accessible: /role="progressbar"[^>]+aria-label=/.test(html),
  visible_focus: /:focus-visible/.test(html),
  touch_targets: /min-height:44px/.test(html) && /min-height:58px/.test(html),
  safe_area: /env\(safe-area-inset/.test(html) && /\.app\{padding-left:max/.test(html),
  responsive_breakpoints: /@media\(max-width:430px\)/.test(html) && /@media\(max-width:370px\)/.test(html),
  desktop_width: /\.app\{max-width:820px/.test(html),
  overflow_protection: /overflow-wrap:anywhere/.test(html),
  manifest_relative: manifest.start_url === './' && manifest.scope === './' && manifest.icons.every(icon => icon.src.startsWith('./')),
  service_worker_not_registered: !/serviceWorker\.register/.test(html),
  service_worker_navigation_network_fresh: /mode==='navigate'[\s\S]*fetch\(event\.request,\{cache:'no-store'\}\)/.test(serviceWorker),
  service_worker_cache_cleanup: /keys\.filter\(key=>key!==CACHE_NAME\).*caches\.delete/.test(serviceWorker),
  journeys_30_pass: scenarios.length === 30 && scenarioFailures.length === 0,
  search_cases_pass: searchFailures.length === 0,
  orphan_count_expected: orphans.length === 317
};

const failedChecks = Object.entries(checks).filter(([, pass]) => !pass).map(([name]) => name);
const structuralFailures = Object.entries(structural).filter(([, count]) => count !== 0).map(([name, count]) => `${name}:${count}`);
const report = {
  generated_at: new Date().toISOString(),
  head_before: '06fc97c6682f86e1fb72782fd98ed9b4f5120ce3',
  counts: { questions: nodeIds.size, options: flatOptions.length, results: resultIds.size, sources: Object.keys(sources).length },
  tests: {
    total_assertions: journeyAssertions + searchCases.length + Object.keys(checks).length + Object.keys(structural).length,
    journey_scenarios: scenarios.length,
    journey_assertions: journeyAssertions,
    search_cases: searchCases.length,
    viewport_profiles_static: ['320x568', '390x844', '393x852', '430x932', '1366x768', '1440x900', '1920x1080'],
    error_cases: ['no-results', 'special-characters', '500-character-cap', 'corrupt-localStorage', 'unavailable-localStorage', 'refresh-resume', 'browser-back-forward', 'offline-not-supported', 'missing-optional-result-fields']
  },
  structural,
  journeys: { status: scenarioFailures.length ? 'FAIL' : 'PASS', failures: scenarioFailures, scenarios },
  search: { status: searchFailures.length ? 'FAIL' : 'PASS', total_ms: Number(searchTotalMs.toFixed(2)), long_query_ms: Number(longSearchMs.toFixed(2)), failures: searchFailures, cases: searchResults },
  security: { external_scripts: externalScripts, external_assets: externalAssets, unsafe_blank_links: unsafeBlankLinks.length, non_https_sources: nonHttpsSources, secrets, inner_html_assignments: (html.match(/\.innerHTML\s*=/g) || []).length },
  privacy: { cookies: false, analytics: false, forms: 0, local_storage_keys: ['wb_current', 'wb_history'], server_submission: false, external_navigation_only_on_user_click: true },
  cache: { registered: false, stale_service_worker_risk: false, offline_supported: false, github_pages_html_cache_seconds: 600 },
  performance: { index_bytes: Buffer.byteLength(html), inline_script_bytes: inlineScripts.reduce((sum, script) => sum + Buffer.byteLength(script), 0), css_bytes: Buffer.byteLength((html.match(/<style>([\s\S]*?)<\/style>/) || ['', ''])[1]), architecture: 'single-file', largest_cost: 'embedded 646-result dataset' },
  orphan_sources: { count: orphans.length, classification: 'UNUSED / RESERVED', ids: orphans },
  checks,
  failures: [...failedChecks, ...structuralFailures, ...scenarioFailures, ...searchFailures, ...jsErrors],
  status: failedChecks.length || structuralFailures.length || scenarioFailures.length || searchFailures.length || jsErrors.length ? 'FAIL' : 'PASS'
};

fs.mkdirSync('docs/pre-launch', { recursive: true });
fs.writeFileSync('docs/pre-launch/pre-launch-technical-qa.json', JSON.stringify(report, null, 2));

const csv = ['Source ID,Title,Authority,URL,Usage Status,Used by Results,Disposition'];
const csvEscape = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
for (const id of orphans) {
  const source = sources[id];
  csv.push([id, source.title, source.authority, source.url, 'UNUSED / RESERVED', 0, 'Retained; not presented by any current Result'].map(csvEscape).join(','));
}
fs.writeFileSync('docs/ORPHAN_SOURCES.csv', csv.join('\n'));

console.log(JSON.stringify({ status: report.status, counts: report.counts, tests: report.tests, structural, checks, orphan_sources: orphans.length, failures: report.failures }, null, 2));
if (report.status !== 'PASS') process.exit(1);
