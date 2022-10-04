export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

export const escapeJS = (s: string) =>
  s.replace(/["'\\\n\r\u2028\u2029]/g, (character) => {
    // Escape all characters not included in SingleStringCharacters and
    // DoubleStringCharacters on
    // http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.4
    switch (character) {
      case '"':
      case '\'':
      case '\\':
        return `\\${character}`
      // Four possible LineTerminator characters need to be escaped:
      case '\n':
        return '\\n'
      case '\r':
        return '\\r'
      case '\u2028':
        return '\\u2028'
      case '\u2029':
        return '\\u2029'
    }
    return character
  })

/**
 * Attribute names must consist of one or more characters other than controls, U+0020 SPACE, U+0022 ("), U+0027 ('),
 * U+003E (>), U+002F (/), U+003D (=), and noncharacters.
 *
 * We strip them for the attribute name as they shouldn't exist even if encoded.
 *
 * @see https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
 */
export const stringifyAttrName = (str: string) =>
  str
    // replace special characters
    .replace(/[\s"'><\/=]/g, '')
    // replace noncharacters (except for - and _)
    .replace(/[^a-zA-Z0-9_-]/g, '')
/**
 * Double-quoted attribute value must not contain any literal U+0022 QUOTATION MARK characters ("). Including
 * < and > will cause HTML to be invalid.
 *
 * @see https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
 */
export const stringifyAttrValue = (str: string) =>
  escapeJS(str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))

export const stringifyAttrs = (attributes: Record<string, any>) => {
  const handledAttributes = []

  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'children' || key === 'key')
      continue

    if (value === false || value == null)
      continue

    let attribute = stringifyAttrName(key)

    if (value !== true) {
      const val = String(value)
      /*
       * Link attributes should be URI encoded to prevent XSS.
       * @see https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html#rule-5-url-escape-then-javascript-escape-before-inserting-untrusted-data-into-url-attribute-subcontext-within-the-execution-context
       */
      if (attribute === 'href' || attribute === 'src')
        attribute += `="${stringifyAttrValue(encodeURI(val))}"`
      else
        attribute += `="${stringifyAttrValue(val)}"`
    }

    handledAttributes.push(attribute)
  }

  return handledAttributes.length > 0 ? ` ${handledAttributes.join(' ')}` : ''
}
