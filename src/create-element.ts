export const createElement = (tag: string, attrs: { [k: string]: any }) => {
  const el = document.createElement(tag)

  for (const key of Object.keys(attrs)) {
    let value = attrs[key]

    if (key === 'key' || value === false) {
      continue
    }

    if (key === 'children') {
      el.textContent = value
    } else {
      el.setAttribute(key, value)
    }
  }

  return el
}
