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

const guideQuery = document.querySelector('#guide-query');
const guideIndex = document.querySelector('[data-guide-index]');
const guideResults = document.querySelector('#guide-results');
const guideEmpty = document.querySelector('[data-guide-empty]');

if (guideQuery && guideIndex && guideResults && guideEmpty) {
  const guideLinks = [...guideIndex.querySelectorAll(':scope > a')];
  const searchable = guideLinks.map((link) => ({
    link,
    text: link.textContent.toLocaleLowerCase('en'),
  }));

  const applyGuideFilter = () => {
    const terms = guideQuery.value.trim().toLocaleLowerCase('en').split(/\s+/).filter(Boolean);
    let visible = 0;
    searchable.forEach(({ link, text }) => {
      const matches = terms.every((term) => text.includes(term));
      link.hidden = !matches;
      if (matches) visible += 1;
    });
    guideEmpty.hidden = visible !== 0;
    guideResults.textContent = terms.length === 0
      ? `${guideLinks.length} indexed paths`
      : `${visible} ${visible === 1 ? 'path' : 'paths'} found`;
  };

  guideQuery.addEventListener('input', applyGuideFilter);
  applyGuideFilter();
}
