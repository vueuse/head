import { version } from 'vue'

export const Vue2 = version.startsWith('2.')

export const IsBrowser = typeof window !== 'undefined'
