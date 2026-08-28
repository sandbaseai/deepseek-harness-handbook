const form = document.querySelector('#terminal-router-form');
const title = document.querySelector('#terminal-route-title');
const reason = document.querySelector('#terminal-route-reason');
const action = document.querySelector('#terminal-route-action');

const routes = {
  background: {
    title: 'Background job',
    reason: 'The job ID is the authoritative control handle. Foreground timeout rules do not apply.',
    action: 'Next: call job_output once. Keep the job or stop it with one job_kill request.',
  },
  persistent: {
    title: 'Persistent terminal',
    reason: 'The terminal session and its completion marker own this command, not the standard foreground Bash deadline.',
    action: 'Next: inspect the terminal session, marker, reset state, and matching process identity.',
  },
  stale: {
    title: 'Stale presentation',
    reason: 'No operating-system process remains. The visible card may no longer reflect runtime state.',
    action: 'Next: preserve the Session event tail and browser console before refreshing.',
  },
  foreground: {
    title: 'Live foreground call',
    reason: 'A live process exists without detached job or persistent-terminal evidence.',
    action: 'Next: use explicit Stop once, then prove process, tool, and Turn settlement.',
  },
  unknown: {
    title: 'Evidence incomplete',
    reason: 'The card timer alone cannot identify a live process or its lifecycle owner.',
    action: 'Next: inspect the process tree and Session event tail. Do not resubmit yet.',
  },
};

function selected(name) {
  return new FormData(form).get(name);
}

function classify() {
  const job = selected('job');
  const persistent = selected('persistent');
  const process = selected('process');
  const key = job === 'yes'
    ? 'background'
    : persistent === 'yes'
      ? 'persistent'
      : process === 'no'
        ? 'stale'
        : job === 'no' && persistent === 'no' && process === 'yes'
          ? 'foreground'
          : 'unknown';
  const route = routes[key];
  title.textContent = route.title;
  reason.textContent = route.reason;
  action.textContent = route.action;
  action.dataset.route = key;
}

form?.addEventListener('change', classify);
classify();
