export const createElement = (
  tag: string,
  attrs: { [k: string]: any },
  document: Document,
) => {
  const el = document.createElement(tag)

  for (const key of Object.keys(attrs)) {
    let value = attrs[key]

    if (key === 'key' || value === false) {
      continue
    }

    if (key === 'children') {
      el.textContent = value
    } else if (/^on/.test(key)) {
      const eventName = key.slice(2).toLowerCase();
      el.addEventListener(eventName, value);
    } else {
      el.setAttribute(key, value)
    }
  }

  return el
}
