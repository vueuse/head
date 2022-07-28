import { BODY_TAG_ATTR_NAME } from "./constants"

export const createElement = (
  tag: string,
  attrs: { [k: string]: any },
  document: Document,
) => {
  const el = document.createElement(tag)

  for (const key of Object.keys(attrs)) {
    if (key === 'body' && attrs.body === true) {
      // set meta-body attribute to add the tag before </body>
      el.setAttribute(BODY_TAG_ATTR_NAME, 'true')
    } else {
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
  }

  return el
}
