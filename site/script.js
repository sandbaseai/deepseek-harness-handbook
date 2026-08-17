const repo = 'sandbaseai/deepseek-harness-handbook';

fetch(`https://api.github.com/repos/${repo}`, {
  headers: { Accept: 'application/vnd.github+json' }
})
  .then((response) => {
    if (!response.ok) throw new Error('GitHub API unavailable');
    return response.json();
  })
  .then((data) => {
    document.querySelectorAll('.star-count').forEach((node) => {
      node.textContent = `${Number(data.stargazers_count).toLocaleString()} stars`;
    });
  })
  .catch(() => {
    document.querySelectorAll('.star-count').forEach((node) => {
      node.textContent = '';
    });
  });

document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    const target = document.getElementById(button.dataset.copy);
    const status = button.parentElement.querySelector('.copy-status');
    try {
      await navigator.clipboard.writeText(target.textContent.trim());
      status.textContent = 'Command copied.';
      button.textContent = 'Copied';
    } catch {
      status.textContent = 'Copy failed. Select the command manually.';
    }
    window.setTimeout(() => {
      button.textContent = 'Copy command';
      status.textContent = '';
    }, 2200);
  });
});
