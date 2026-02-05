const normalizeTargetTokens = (rawTarget) => {
  if (!rawTarget) return [];
  return String(rawTarget)
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
};

export const normalizeTargetValue = (rawTarget) => {
  const tokens = normalizeTargetTokens(rawTarget);
  if (tokens.length === 0) return '';
  if (tokens.includes('_blank') || tokens.includes('blank')) return '_blank';
  return tokens[0];
};

export const getLinkSettings = (node) => {
  const href = node.getAttribute('href') || '';
  const relValue = (node.getAttribute('rel') || '').toLowerCase();
  const targetTokens = normalizeTargetTokens(node.getAttribute('target') || '');

  // Always treat href as a custom URL (including hash anchors).
  return {
    type: 'external',
    url: href,
    noFollow: relValue.includes('nofollow'),
    noReferrer: relValue.includes('noreferrer'),
    openInNewWindow: targetTokens.includes('_blank')
  };
};
