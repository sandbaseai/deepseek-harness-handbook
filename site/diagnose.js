const routes = {
  startup: {
    layer: 'Process', title: 'Confirm the host stays alive',
    summary: 'The first boundary is process startup—not the browser, workspace, or model provider.',
    evidence: 'The launch command, Node and DSH versions, and the complete terminal tail.',
    success: 'The process remains alive and prints a reachable Web URL.',
    command: 'npx @deepseek-ai/dsh web',
    steps: ['Keep the launch terminal visible.', 'Do not diagnose the browser until the URL is printed.', 'Preserve the first error and its cause chain.'],
    guide: 'https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/troubleshooting/README.md'
  },
  empty: {
    layer: 'Surface / browser security', title: 'Check the browser secure context',
    summary: 'A remote page served over plain HTTP may render while Web APIs such as crypto.randomUUID remain unavailable.',
    evidence: 'Browser console error, exact page URL, protocol, hostname, and whether localhost works.',
    success: 'The same page loads workspaces and providers over HTTPS or localhost.',
    command: 'window.isSecureContext && typeof crypto.randomUUID === "function"',
    steps: ['Open DevTools on the failing page.', 'Compare remote HTTP with localhost.', 'Serve the UI through trusted HTTPS; do not disable browser security.'],
    guide: './remote-web-secure-context.html'
  },
  workspace: {
    layer: 'Workspace / directory picker', title: 'Separate picker failure from path failure',
    summary: 'The native chooser, path decoding, realpath normalization, and workspace registration are separate boundaries.',
    evidence: 'The complete picker message, launch-terminal stderr, and a sanitized path shape.',
    success: 'An ASCII disposable path opens, or the in-app browse picker isolates the native worker.',
    command: 'dsh --profile web --dump-config',
    steps: ['Test a short disposable ASCII path.', 'Record whether the native worker exits or returns a truncated path.', 'Verify the active directory-picker rows before changing permissions.'],
    guide: 'https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/troubleshooting/windows-compatibility.md'
  },
  provider: {
    layer: 'Model provider', title: 'Hold the prompt constant; change the route',
    summary: 'Authentication, base URL, TLS, proxy behavior, model ID, and streaming can fail before the Agent Loop receives output.',
    evidence: 'Provider adapter, sanitized hostname, model ID, HTTP status or cause chain, and proxy state.',
    success: 'One bounded prompt streams repeatedly through the selected route.',
    command: 'dsh --profile web --dump-config',
    steps: ['Never print the API key.', 'Compare one provider or network variable at a time.', 'If the host exits, capture the uncaught stack rather than only the UI notice.'],
    guide: 'https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/getting-started/model-providers.md'
  },
  tool: {
    layer: 'Tool pipeline', title: 'Locate the last completed gate',
    summary: 'A visible tool call still passes argument validation, guards, approval, provider selection, execution, and result recording.',
    evidence: 'Raw sanitized arguments plus the last durable tool/call, approval, and tool/result events.',
    success: 'The call has a recorded result and the model consumes it in the next step.',
    command: 'dsh --profile web --dump-config',
    steps: ['Check schema validation before sandbox policy.', 'Inspect pending approval before assuming a hang.', 'Do not retry a side-effecting call until external state is verified.'],
    guide: 'https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/architecture/tool-execution-pipeline.md'
  },
  sandbox: {
    layer: 'Policy / isolation', title: 'Do not confuse denied with unavailable',
    summary: 'A policy denial is a decision. SANDBOX_UNAVAILABLE means the requested isolation boundary could not be established.',
    evidence: 'Operation, target, requested permission mode, active backend, error code, and complete stderr.',
    success: 'The bounded operation runs under the intended backend—or fails closed with an explained limitation.',
    command: 'dsh --profile web --dump-config',
    steps: ['Do not broaden permission as the first diagnostic.', 'Confirm the selected platform backend.', 'Use a disposable VM when OS-level boundaries are insufficient.'],
    guide: 'https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/troubleshooting/sandbox-denied-vs-unavailable.md'
  },
  session: {
    layer: 'Session / continuation', title: 'Read the durable event boundary',
    summary: 'The UI, live Agent, queue, persisted log, replayed provider history, and child-agent route can diverge.',
    evidence: 'Last turn/start, step/start, tool events, turn/end reason, queue snapshot, and sanitized resolved route.',
    success: 'The replayed transcript is balanced and the next turn uses the intended provider and workspace.',
    command: 'dsh --profile web --dump-config',
    steps: ['Find the last durable terminal event.', 'Treat an interrupted side effect as outcome-unknown.', 'Verify child-agent provider and credential inheritance independently.'],
    guide: './subagent-route-inheritance.html'
  }
};

const elements = {
  layer: document.querySelector('#route-layer'), title: document.querySelector('#route-title'),
  summary: document.querySelector('#route-summary'), evidence: document.querySelector('#route-evidence'),
  success: document.querySelector('#route-success'), command: document.querySelector('#route-command'),
  steps: document.querySelector('#route-steps'), guide: document.querySelector('#route-guide')
};

document.querySelectorAll('.symptom-button').forEach((button) => {
  button.addEventListener('click', () => {
    const route = routes[button.dataset.route];
    if (!route) return;
    document.querySelectorAll('.symptom-button').forEach((node) => {
      const active = node === button;
      node.classList.toggle('is-active', active);
      node.setAttribute('aria-pressed', String(active));
    });
    elements.layer.textContent = route.layer;
    elements.title.textContent = route.title;
    elements.summary.textContent = route.summary;
    elements.evidence.textContent = route.evidence;
    elements.success.textContent = route.success;
    elements.command.textContent = route.command;
    elements.steps.replaceChildren(...route.steps.map((step) => {
      const item = document.createElement('li'); item.textContent = step; return item;
    }));
    elements.guide.href = route.guide;
  });
});
