import { enUS, dateEnUS } from 'naive-ui'

export const meta = {
  value: 'en-us',
  label: 'English',
  naiveLocale: enUS,
  naiveDateLocale: dateEnUS,
}

export default {
  ui: {
    brand: 'Khanzuo',
    brandSubtitle: 'Investigation Agent',
    nav: {
      urlPlaceholder: 'https://app.example.com/Login',
      start: 'Start Session',
      stop: 'Stop Session',
      statusIdle: 'Idle',
      statusRunning: 'Running',
      themeLabel: 'Theme',
      languageLabel: 'Language',
      themeOptions: {
        light: 'Light',
        dark: 'Dark',
        auto: 'Auto',
      },
    },
    view: {
      title: 'User View',
      waitingTitle: 'Waiting to start session...',
      waitingDescription: 'Enter a target URL above or describe the issue to begin the investigation stream.',
      streamReady: 'Stream Ready',
      noInput: 'No Input',
    },
    logs: {
      title: 'Agent Logs',
      empty: 'Agent actions and observations will appear here.',
      lastSync: 'Last Sync',
    },
    prompts: {
      title: 'Common issues',
      placeholder: 'Describe the bug to the agent (e.g. “A user reports they can’t log in with 2FA”).',
      disclaimer: 'Khanzuo AI may produce inaccurate results.',
      send: 'Send to agent',
      quick: {
        login2fa: 'Login failure with 2FA',
        checkout404: '404 on Checkout page',
        slowLoading: 'Slow load after submit',
      },
    },
    footer: {
      agentStatus: 'Agent Status',
      capture: 'Capture',
      serverTime: 'Server Time',
    },
    events: {
      sessionRequested: 'Session requested',
      sessionReady: 'Browser ready',
      awaitingInput: 'Waiting for detailed steps from user.',
      sessionStopped: 'Session stopped',
      stopDescription: 'Agent halted by user command.',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Manage how Khanzuo behaves during investigations',
      general: 'General',
      interfaceLanguage: 'Interface Language',
      appearance: 'Appearance',
      themePreference: 'Theme Preference',
      themeSelected: 'Selected',
      themeSwitchTo: 'Switch to {theme}',
      agentSelection: 'Coding Agent Selection',
      agentSelectionDescription: 'Choose the AI model used for automated bug reproduction and analysis.',
      agents: {
        codex: {
          name: 'OpenAI Codex',
          description: 'Best for Python & Javascript codebases',
          badge: 'Default',
        },
        gemini: {
          name: 'Google Gemini',
          description: 'Optimized for large context windows',
        },
        claude: {
          name: 'Anthropic Claude',
          description: 'Superior reasoning for complex bugs',
        },
      },
      dataManagement: 'Data Management',
      clearDataTitle: 'Clear Local Data',
      clearDataDescription: 'Remove cached investigation sessions and temporary files.',
      clearDataCta: 'Clear Data',
      cancel: 'Cancel',
      save: 'Save Changes',
      close: 'Close dialog',
    },
  },
}
