const CODE_KEYWORDS = ['code', 'component', 'file', 'stacktrace', 'read', 'analy', 'config', 'refactor'];
const UI_KEYWORDS = ['click', 'navigate', 'login', 'signup', 'submit', 'reproduce', 'ui', 'screen'];

const createId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

const normalize = (text) => text?.toLowerCase?.() ?? '';

function buildUiPlan(promptText) {
  const snippet = promptText.length > 120 ? `${promptText.slice(0, 117)}...` : promptText;
  return [
    {
      id: createId(),
      title: 'Review user report',
      detail: snippet,
      status: 'pending',
    },
    {
      id: createId(),
      title: 'Navigate to target URL',
      detail: 'Open the configured session URL and wait for DOM ready.',
      status: 'pending',
    },
    {
      id: createId(),
      title: 'Execute reported steps',
      detail: 'Perform the actions described to reproduce the issue.',
      status: 'pending',
    },
  ];
}

function buildCodePlan(promptText, folders) {
  const folderNames = folders.map((folder) => folder.name).slice(0, 3);
  const scope = folderNames.length ? folderNames.join(', ') : 'attached folders';
  return [
    {
      id: createId(),
      title: 'Review prompt + stacktrace',
      detail: promptText,
      status: 'pending',
    },
    {
      id: createId(),
      title: `Inspect code in ${scope}`,
      detail: 'Identify components, handlers, or configs matching the report.',
      status: 'pending',
    },
    {
      id: createId(),
      title: 'Propose fix',
      detail: 'Summarize the root cause and produce a diff-ready patch.',
      status: 'pending',
    },
  ];
}

export function buildRouterDecision({ prompt, contextFolders = [] }) {
  const text = prompt?.trim() ?? '';
  const normalizedText = normalize(text);
  const hasContextFolders = contextFolders.length > 0;
  let intent = 'ui_repro';

  const mentionsCode = CODE_KEYWORDS.some((keyword) => normalizedText.includes(keyword));
  const mentionsUi = UI_KEYWORDS.some((keyword) => normalizedText.includes(keyword));

  if (mentionsCode && hasContextFolders && mentionsUi) {
    intent = 'hybrid';
  } else if (mentionsCode && hasContextFolders) {
    intent = 'code_analysis';
  } else if (mentionsCode && !hasContextFolders) {
    intent = 'ui_repro';
  }

  const plan =
    intent === 'code_analysis'
      ? buildCodePlan(text, contextFolders)
      : intent === 'hybrid'
        ? [...buildUiPlan(text), ...buildCodePlan(text, contextFolders)]
        : buildUiPlan(text);

  return {
    intent,
    plan,
    summary:
      intent === 'code_analysis'
        ? 'Analyze attached folders to explain and fix the issue.'
        : intent === 'hybrid'
          ? 'Reproduce the issue in the UI, then inspect code context.'
          : 'Attempt a full UI reproduction of the reported issue.',
    decidedAt: new Date().toISOString(),
  };
}
