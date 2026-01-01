import enUSMessages, { meta as enMeta } from './en-us'
import zhCNMessages, { meta as zhMeta } from './zh-cn'

const definitions = [
  { ...enMeta, messages: enUSMessages },
  { ...zhMeta, messages: zhCNMessages },
]

export const lang = definitions.reduce((acc, cur) => {
  acc[cur.value] = cur.messages
  return acc
}, {})

export const languageOptions = definitions.map(({ messages, ...meta }) => meta)

export function getLanguageMeta(value) {
  return definitions.find((item) => item.value === value) ?? definitions[0]
}
