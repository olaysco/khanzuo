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
    },
  },
}
