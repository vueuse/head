import { useHead } from '../src'
import { ssrRenderHeadToString } from './shared/utils'

describe('titleTemplate', () => {
  test('string replace', async () => {
    const titleTemplate = '%s - my template'
    const headResult = await ssrRenderHeadToString(() => {
      useHead({
        titleTemplate,
        title: 'test',
      })
    })
    expect(headResult.headTags).toMatchInlineSnapshot(
      '"<title>test - my template</title>"',
    )
  })
  test('fn replace', async () => {
    const titleTemplate = (title?: string) => `${title} - my template`
    const headResult = await ssrRenderHeadToString(() => {
      useHead({
        titleTemplate,
        title: 'test',
      })
    })
    expect(headResult.headTags).toMatchInlineSnapshot(
      '"<title>test - my template</title>"',
    )
  })
  test('titleTemplate as title', async () => {
    const titleTemplate = (title?: string) => title ? `${title} - Template` : 'Default Title'
    const headResult = await ssrRenderHeadToString(() => {
      useHead({
        titleTemplate,
        title: null,
      })
    })
    expect(headResult.headTags).toMatchInlineSnapshot(
      '"<title>Default Title</title>"',
    )
  })
  test('reset title template', async () => {
    const titleTemplate = (title?: string) => title ? `${title} - Template` : 'Default Title'
    const headResult = await ssrRenderHeadToString(() => {
      useHead({
        titleTemplate,
      })
      useHead({
        // resets the titleTemplate
        titleTemplate: null,
        title: 'page title',
      })
    })
    expect(headResult.headTags).toMatchInlineSnapshot(
      '"<title>page title</title>"',
    )
  })

  test('nested title template', async () => {
    const titleTemplate = (title?: string | null) => title ? `${title} - Template` : 'Default Title'
    const headResult = await ssrRenderHeadToString(() => {
      useHead({
        titleTemplate,
      })
      useHead({
        titleTemplate: null,
      })
    })
    expect(headResult.headTags).toMatchInlineSnapshot(
      '""',
    )
  })

  test('null fn return', async () => {
    const titleTemplate = (title?: string | null) => title === 'test' ? null : `${title} - Template`
    const headResult = await ssrRenderHeadToString(() => {
      useHead({
        titleTemplate,
        title: 'test',
      })
    })
    expect(headResult.headTags).toMatchInlineSnapshot(
      '""',
    )
  })

  test('empty title', async () => {
    const headResult = await ssrRenderHeadToString(() => {
      useHead({
        title: '',
      })
    })
    expect(headResult.headTags).toMatchInlineSnapshot(
      '"<title></title>"',
    )
  })
})
