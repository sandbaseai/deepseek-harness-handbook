const doctorRoutes = {
  etarget: {
    layer: 'Registry metadata', title: 'Prove which registry can see rc.8.',
    summary: 'Compare configured and official metadata before changing shared cache state.',
    collect: 'Registry URL, exact missing range, and both version lists.',
    success: 'A fresh isolated cache prints 0.1.0-rc.8.', guide: './npm-etarget-rc8.html',
    windows: {
      npm: ['npm config get registry', 'npm view @deepseek-ai/dsh-agent-loop versions --json', 'npm view @deepseek-ai/dsh-agent-loop@0.1.0-rc.8 version dist.integrity --json --registry=https://registry.npmjs.org/', '$probeCache = Join-Path $env:TEMP "dsh-npm-rc8-probe"', 'New-Item -ItemType Directory -Force $probeCache | Out-Null', 'npx -y --cache $probeCache --registry=https://registry.npmjs.org/ @deepseek-ai/dsh@0.1.0-rc.8 --version'],
      mirror: ['npm config get registry', 'npm view @deepseek-ai/dsh-agent-loop versions --json', 'npm view @deepseek-ai/dsh-agent-loop@0.1.0-rc.8 version dist.integrity --json --registry=https://registry.npmjs.org/', '# Give both results to the registry operator before bypassing policy.'],
      source: ['git rev-parse HEAD', 'node --version', 'pnpm --version', 'npm view @deepseek-ai/dsh-agent-loop@0.1.0-rc.8 version --registry=https://registry.npmjs.org/']
    },
    posix: {
      npm: ['npm config get registry', 'npm view @deepseek-ai/dsh-agent-loop versions --json', 'npm view @deepseek-ai/dsh-agent-loop@0.1.0-rc.8 version dist.integrity --json --registry=https://registry.npmjs.org/', 'probe_cache="$(mktemp -d)"', 'npx -y --cache "$probe_cache" --registry=https://registry.npmjs.org/ @deepseek-ai/dsh@0.1.0-rc.8 --version'],
      mirror: ['npm config get registry', 'npm view @deepseek-ai/dsh-agent-loop versions --json', 'npm view @deepseek-ai/dsh-agent-loop@0.1.0-rc.8 version dist.integrity --json --registry=https://registry.npmjs.org/', '# Give both results to the registry operator before bypassing policy.'],
      source: ['git rev-parse HEAD', 'node --version', 'pnpm --version', 'npm view @deepseek-ai/dsh-agent-loop@0.1.0-rc.8 version --registry=https://registry.npmjs.org/']
    }
  },
  engine: {
    layer: 'Runtime contract', title: 'Match the release engine before debugging packages.',
    summary: 'Node, npm, pnpm, and the selected DSH version are separate coordinates.',
    collect: 'Exact executable paths and version output from the failing shell.',
    success: 'The runtime meets the selected release contract and resolves one CLI.',
    guide: './official-deepseek-harness.html',
    windows: { npm: ['Get-Command node,npm,npx -All | Select-Object Name,Source', 'node --version', 'npm --version', 'npx -y @deepseek-ai/dsh@0.1.0-rc.8 --version'], mirror: ['npm config get registry', 'Get-Command node,npm,npx -All | Select-Object Name,Source', 'node --version', 'npm --version'], source: ['Get-Command node,pnpm -All | Select-Object Name,Source', 'node --version', 'pnpm --version', 'git rev-parse HEAD'] },
    posix: { npm: ['command -v node npm npx', 'node --version', 'npm --version', 'npx -y @deepseek-ai/dsh@0.1.0-rc.8 --version'], mirror: ['npm config get registry', 'command -v node npm npx', 'node --version', 'npm --version'], source: ['command -v node pnpm', 'node --version', 'pnpm --version', 'git rev-parse HEAD'] }
  },
  silent: {
    layer: 'Build entrypoint', title: 'Require artifacts, not only exit zero.',
    summary: 'A skipped tsx entrypoint can finish normally without running either nested build.',
    collect: 'Build output, status, commit, artifact record, and named missing exports.',
    success: 'The root build records a non-empty client artifact digest.', guide: './node24-tsx-silent-build.html',
    windows: { npm: ['node --version', 'npm --version', 'npx -y @deepseek-ai/dsh@0.1.0-rc.8 --version'], mirror: ['npm config get registry', 'node --version', 'npm --version'], source: ['node --version', 'pnpm --version', 'git rev-parse HEAD', 'pnpm run build', 'Test-Path .dsh-build/client-build-environment.json', 'pnpm dsh --profile web --help'] },
    posix: { npm: ['node --version', 'npm --version', 'npx -y @deepseek-ai/dsh@0.1.0-rc.8 --version'], mirror: ['npm config get registry', 'node --version', 'npm --version'], source: ['node --version', 'pnpm --version', 'git rev-parse HEAD', 'pnpm run build', 'test -s .dsh-build/client-build-environment.json', 'pnpm dsh --profile web --help'] }
  },
  startup: {
    layer: 'CLI startup', title: 'Preserve the first cause before the process exits.',
    summary: 'Resolve the executable and version first, then capture the complete terminal tail.',
    collect: 'Executable path, exact launch command, exit status, and complete cause chain.',
    success: 'The exact CLI prints its version and remains alive for the selected profile.', guide: './deepseek-harness-cli.html',
    windows: { npm: ['Get-Command node,npm,npx,dsh -All | Select-Object Name,Source', 'node --version', 'npm --version', 'npx -y @deepseek-ai/dsh@0.1.0-rc.8 --version'], mirror: ['npm config get registry', 'Get-Command node,npm,npx,dsh -All | Select-Object Name,Source', 'npx -y @deepseek-ai/dsh@0.1.0-rc.8 --version'], source: ['git rev-parse HEAD', 'node --version', 'pnpm --version', 'pnpm dsh --version'] },
    posix: { npm: ['command -v node npm npx dsh', 'node --version', 'npm --version', 'npx -y @deepseek-ai/dsh@0.1.0-rc.8 --version'], mirror: ['npm config get registry', 'command -v node npm npx dsh', 'npx -y @deepseek-ai/dsh@0.1.0-rc.8 --version'], source: ['git rev-parse HEAD', 'node --version', 'pnpm --version', 'pnpm dsh --version'] }
  },
  artifact: {
    layer: 'Package artifact', title: 'Name the first missing runtime export.',
    summary: 'Separate package materialization, build policy, generated output, and module resolution.',
    collect: 'Package version, resolved package root, expected export, and installation log.',
    success: 'The declared export exists and resolves in the same dependency graph as DSH.', guide: './git-plugin-missing-dist.html',
    windows: { npm: ['npm config get registry', 'npm ls @deepseek-ai/dsh --all', 'npm config get ignore-scripts'], mirror: ['npm config get registry', 'npm ls @deepseek-ai/dsh --all', 'npm config get ignore-scripts'], source: ['git rev-parse HEAD', 'pnpm list --depth 1', 'pnpm run build', 'Get-ChildItem .dsh-build,packages -Filter "*.host.js" -Recurse | Select-Object -First 20 FullName'] },
    posix: { npm: ['npm config get registry', 'npm ls @deepseek-ai/dsh --all', 'npm config get ignore-scripts'], mirror: ['npm config get registry', 'npm ls @deepseek-ai/dsh --all', 'npm config get ignore-scripts'], source: ['git rev-parse HEAD', 'pnpm list --depth 1', 'pnpm run build', 'find .dsh-build packages -type f -name "*.host.js" | head -20'] }
  },
  preflight: {
    layer: 'Install preflight', title: 'Capture identity before changing state.',
    summary: 'A neutral preflight records the runtime, registry, requested release, and executable path.',
    collect: 'OS, shell, Node, package manager, registry, DSH version, and exact command.',
    success: 'One exact DSH version resolves and prints without changing project files.', guide: './official-deepseek-harness.html',
    windows: { npm: ['Get-ComputerInfo | Select-Object OsName,OsVersion,OsArchitecture', 'Get-Command node,npm,npx,dsh -All | Select-Object Name,Source', 'node --version', 'npm --version', 'npm config get registry', 'npx -y @deepseek-ai/dsh@0.1.0-rc.8 --version'], mirror: ['npm config get registry', 'Get-Command node,npm,npx -All | Select-Object Name,Source', 'node --version', 'npm --version'], source: ['Get-Command git,node,pnpm -All | Select-Object Name,Source', 'git rev-parse HEAD', 'node --version', 'pnpm --version'] },
    posix: { npm: ['uname -a', 'command -v node npm npx dsh', 'node --version', 'npm --version', 'npm config get registry', 'npx -y @deepseek-ai/dsh@0.1.0-rc.8 --version'], mirror: ['uname -a', 'npm config get registry', 'command -v node npm npx', 'node --version', 'npm --version'], source: ['uname -a', 'command -v git node pnpm', 'git rev-parse HEAD', 'node --version', 'pnpm --version'] }
  }
};

const doctorForm = document.querySelector('#doctor-form');
const doctorSymptom = document.querySelector('#doctor-symptom');
const doctorCommands = document.querySelector('#doctor-commands');
const doctorCopy = document.querySelector('#doctor-copy');
const doctorCopyStatus = document.querySelector('#doctor-copy-status');

function doctorSelection(name) {
  return doctorForm.querySelector(`input[name="${name}"]:checked`)?.value;
}

function renderDoctor() {
  const os = doctorSelection('os');
  const path = doctorSelection('path');
  const route = doctorRoutes[doctorSymptom.value];
  const commands = route?.[os]?.[path];
  if (!route || !commands) {
    document.querySelector('.doctor-output').classList.add('has-error');
    document.querySelector('#doctor-route-title').textContent = 'This route is not available.';
    doctorCommands.textContent = '# Open an issue with the selected environment.';
    return;
  }
  document.querySelector('.doctor-output').classList.remove('has-error');
  document.querySelector('#doctor-layer').textContent = route.layer;
  document.querySelector('#doctor-scope').textContent = `${os === 'windows' ? 'Windows' : 'macOS or Linux'} / ${path === 'npm' ? 'official npm' : path === 'mirror' ? 'mirror or proxy' : 'source checkout'}`;
  document.querySelector('#doctor-route-title').textContent = route.title;
  document.querySelector('#doctor-summary').textContent = route.summary;
  document.querySelector('#doctor-collect').textContent = route.collect;
  document.querySelector('#doctor-success').textContent = route.success;
  document.querySelector('#doctor-guide').href = route.guide;
  doctorCommands.textContent = commands.join('\n');
  doctorCopyStatus.textContent = '';
}

doctorForm.addEventListener('change', renderDoctor);
doctorCopy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(doctorCommands.textContent);
    doctorCopy.textContent = 'Copied';
    doctorCopyStatus.textContent = 'Evidence commands copied.';
  } catch {
    doctorCopyStatus.textContent = 'Copy failed. Select the commands manually.';
  }
  window.setTimeout(() => { doctorCopy.textContent = 'Copy commands'; doctorCopyStatus.textContent = ''; }, 2200);
});

renderDoctor();
