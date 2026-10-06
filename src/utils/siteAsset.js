import { publicAsset } from './publicAsset'

export function siteAsset(value) {
  if (!value) return ''
  return /^(?:https?:)?\/\//i.test(value) ? value : publicAsset(value)
}
