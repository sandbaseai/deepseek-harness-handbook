const criteria = [
  { id: 'model', title: 'Model boundary', question: 'Can you replace the provider without changing the loop?', evidence: 'Prove route selection, credential isolation, capability negotiation, and provider failure containment.', guide: './deepseek-harness-vs-claude-code-vs-codex.html' },
  { id: 'loop', title: 'Loop lifecycle', question: 'Does every turn have bounded admission and settlement?', evidence: 'Trace turn start, steps, cancellation, terminal reason, and every automatic wake source.', guide: './runaway-agent-loop.html' },
  { id: 'state', title: 'Durable state', question: 'Can a cold process reconstruct the same model-visible history?', evidence: 'Test append, replay, interrupted writes, compaction, corruption, and recovery.', guide: './session-log-durability.html' },
  { id: 'tools', title: 'Tool execution', question: 'Can you locate the last completed gate for every call?', evidence: 'Record validation, policy, approval, provider, execution, result, and model consumption.', guide: './streamed-tool-call-identity.html' },
  { id: 'authority', title: 'Authority', question: 'Is every consequential effect tied to an authenticated decision owner?', evidence: 'Prove scope, expiry, cancellation, replay resistance, and least privilege.', guide: './sdk-human-interaction-wire.html' },
  { id: 'sandbox', title: 'Effect isolation', question: 'Does the system fail closed when the requested boundary is unavailable?', evidence: 'Separate policy denial from isolation failure and verify the actual backend.', guide: './code-mode-security-boundary.html' },
  { id: 'evidence', title: 'Observability', question: 'Can operators distinguish display state from durable truth?', evidence: 'Correlate process logs, events, tool outcomes, artifacts, and external state.', guide: './diagnose.html' },
  { id: 'release', title: 'Release gates', question: 'Do tests cover success, denial, interruption, replay, and upgrade?', evidence: 'Require repeatable fixtures, source pinning, rollback evidence, and bounded canaries.', guide: './version-evidence.html' }
];

const values = new Map();
const params = new URLSearchParams(location.search);
const encoded = params.get('s');
if (encoded && /^[x012]{8}$/.test(encoded)) criteria.forEach((item, index) => {
  if (encoded[index] !== 'x') values.set(item.id, Number(encoded[index]));
});

const container = document.querySelector('#criteria');
const scoreNode = document.querySelector('#score');
const titleNode = document.querySelector('#result-title');
const summaryNode = document.querySelector('#result-summary');
const answeredNode = document.querySelector('#answered');
const nextNode = document.querySelector('#next-gate');
const statusNode = document.querySelector('#scorecard-status');

const levels = [
  { max: 5, title: 'Demo shell', summary: 'The system has not yet demonstrated durable runtime boundaries.' },
  { max: 10, title: 'Operable prototype', summary: 'The core path works, but important failure or recovery contracts remain implicit.' },
  { max: 14, title: 'Bounded runtime', summary: 'Most contracts are explicit and tested. Close the remaining evidence gaps before broad deployment.' },
  { max: 16, title: 'Evidence-ready system', summary: 'All eight boundaries have claimed evidence. Independently review the evidence before release.' }
];

function renderCriteria() {
  container.replaceChildren(...criteria.map((item, index) => {
    const section = document.createElement('section');
    section.className = 'criterion';
    section.innerHTML = `<div class="criterion-copy"><span>${String(index + 1).padStart(2, '0')}</span><div><h3>${item.title}</h3><p>${item.question}</p><small>${item.evidence}</small><a href="${item.guide}">Inspect this boundary</a></div></div><div class="criterion-options" role="group" aria-label="${item.title} rating"></div>`;
    const options = section.querySelector('.criterion-options');
    ['Missing', 'Partial', 'Proven'].forEach((label, value) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.dataset.id = item.id;
      button.dataset.value = value;
      button.setAttribute('aria-pressed', String(values.get(item.id) === value));
      button.addEventListener('click', () => { values.set(item.id, value); update(); });
      options.append(button);
    });
    return section;
  }));
}

function update() {
  const score = criteria.reduce((total, item) => total + (values.get(item.id) || 0), 0);
  const answered = criteria.filter((item) => values.has(item.id)).length;
  const level = levels.find((item) => score <= item.max);
  const next = criteria.find((item) => (values.get(item.id) || 0) < 2);
  scoreNode.textContent = score;
  titleNode.textContent = level.title;
  summaryNode.textContent = level.summary;
  answeredNode.textContent = `${answered} / ${criteria.length}`;
  nextNode.textContent = next ? next.title : 'Independent review';
  document.querySelectorAll('.criterion-options button').forEach((button) => button.setAttribute('aria-pressed', String(values.get(button.dataset.id) === Number(button.dataset.value))));
  const state = criteria.map((item) => values.has(item.id) ? values.get(item.id) : 'x').join('');
  const url = new URL(location.href); url.searchParams.set('s', state); history.replaceState(null, '', url);
}

document.querySelector('#reset-scorecard').addEventListener('click', () => { values.clear(); statusNode.textContent = 'Scorecard reset.'; update(); });
document.querySelector('#copy-result').addEventListener('click', async () => {
  const score = criteria.reduce((total, item) => total + (values.get(item.id) || 0), 0);
  const rows = criteria.map((item) => `${item.title}: ${values.has(item.id) ? ['Missing', 'Partial', 'Proven'][values.get(item.id)] : 'Not rated'}`);
  const text = `Agent Harness Evaluation: ${score}/16, ${titleNode.textContent}\n${rows.join('\n')}\n${location.href}`;
  try { await navigator.clipboard.writeText(text); statusNode.textContent = 'Review and share URL copied.'; }
  catch { statusNode.textContent = 'Copy failed. Select the page URL manually.'; }
});

renderCriteria();
update();
