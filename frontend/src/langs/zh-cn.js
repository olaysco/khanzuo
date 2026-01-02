import { zhCN, dateZhCN } from 'naive-ui'

export const meta = {
  value: 'zh-cn',
  label: '中文',
  naiveLocale: zhCN,
  naiveDateLocale: dateZhCN,
}

export default {
  ui: {
    brand: 'Khanzuo',
    brandSubtitle: '调查代理',
    nav: {
      urlPlaceholder: 'https://app.example.com/Login',
      start: '开始会话',
      stop: '停止会话',
      statusIdle: '空闲',
      statusRunning: '执行中',
      themeLabel: '主题',
      languageLabel: '语言',
      themeOptions: {
        light: '浅色',
        dark: '深色',
        auto: '跟随系统',
      },
    },
    view: {
      title: '用户视图',
      waitingTitle: '等待开始会话…',
      waitingDescription: '请输入目标地址或描述问题以启动调查流程。',
      streamReady: '流已准备',
      noInput: '尚未输入',
    },
    logs: {
      title: '代理日志',
      empty: '代理的操作与观察会出现在这里。',
      lastSync: '最近同步',
    },
    prompts: {
      title: '常见问题',
      placeholder: '向代理描述问题（例如：“用户反馈启用 2FA 后无法登录”）。',
      disclaimer: 'Khanzuo AI 可能仍会出现错误，请务必核实关键结论。',
      send: '发送给代理',
      quick: {
        login2fa: '双重验证登录失败',
        checkout404: '结算页面 404',
        slowLoading: '提交后加载缓慢',
      },
    },
    footer: {
      agentStatus: '代理状态',
      capture: '截图',
      serverTime: '服务器时间',
    },
    events: {
      sessionRequested: '已收到会话请求',
      sessionReady: '浏览器已就绪',
      awaitingInput: '等待用户提供更详细步骤。',
      sessionStopped: '会话已停止',
      stopDescription: '用户手动停止了代理。',
    },
    settings: {
      title: '设置',
      subtitle: '管理 Khanzuo 在调查期间的行为方式',
      general: '通用',
      interfaceLanguage: '界面语言',
      appearance: '外观',
      themePreference: '主题偏好',
      themeSelected: '已选择',
      themeSwitchTo: '切换为 {theme}',
      agentSelection: '编码代理选择',
      agentSelectionDescription: '选择用于自动复现与分析的 AI 模型。',
      agents: {
        codex: {
          name: 'OpenAI Codex',
          description: '适用于 Python 与 Javascript 代码库',
          badge: '默认',
        },
        gemini: {
          name: 'Google Gemini',
          description: '针对超大上下文窗口优化',
        },
        claude: {
          name: 'Anthropic Claude',
          description: '擅长推理复杂问题',
        },
      },
      dataManagement: '数据管理',
      clearDataTitle: '清除本地数据',
      clearDataDescription: '移除缓存的调查会话与临时文件。',
      clearDataCta: '清除数据',
      cancel: '取消',
      save: '保存更改',
      close: '关闭对话框',
    },
  },
}
