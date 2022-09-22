/**
 * Attribute names must consist of one or more characters other than controls, U+0020 SPACE, U+0022 ("), U+0027 ('),
 * U+003E (>), U+002F (/), U+003D (=), and noncharacters.
 *
 * We strip them for the attribute name as they shouldn't exist even if encoded.
 *
 * @see https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
 */
export const stringifyAttrName = (str: string) =>
  str.replace(/[\s"'><\/=]/g, "")
/**
 * Double-quoted attribute value must not contain any literal U+0022 QUOTATION MARK characters ("). Including
 * < and > will cause HTML to be invalid.
 *
 * @see https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
 */
export const stringifyAttrValue = (str: string) =>
  str.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

export const stringifyAttrs = (attributes: Record<string, any>) => {
  const handledAttributes = []

  for (let [key, value] of Object.entries(attributes)) {
    if (key === "children" || key === "key") {
      continue
    }

    if (value === false || value == null) {
      continue
    }

    let attribute = stringifyAttrName(key)

    if (value !== true) {
      attribute += `="${stringifyAttrValue(String(value))}"`
    }

    handledAttributes.push(attribute)
  }

  return handledAttributes.length > 0 ? " " + handledAttributes.join(" ") : ""
}
