## Unreleased

No unreleased changes.

## 1.0.21

- chore(deps): bump deps, unhead

## 1.0.20

- chore(pkg): bump deps
- fix: support Vue 2.7

## 1.0.19

- chore(deps): bump deps, unhead
- chore(deps): bump deps, unhead

## 1.0.18

- chore(deps): bump unhead

## 1.0.17

- chore(deps): bump unhead

## 1.0.16

- chore(deps): bump unhead / nuxt

## 1.0.15

- chore: bump unhead

## 1.0.14

- chore: sync lock file
- chore: experimenting with async props
- chore: bump unhead and dev deps

## 1.0.13

- chore: bump unhead

## 1.0.12

- types: expose `ActiveHeadEntry`

## 1.0.11

- fix: expose `useSeoMeta`, `createHeadCore`
- types: export `HeadTag`

## 1.0.10

- chore: bump `@unhead/vue`

## 1.0.9

- chore: bump unhead

## 1.0.8

- fix: export all `@unhead/vue` composables
- types: export missing useHead types

## 1.0.7

- chore: bump unhead

## 1.0.6

- fix: add legacy functions to unhead instance

## 1.0.5

- chore: bump unhead

## 1.0.4

- fix: Nuxt v3 useHead reactivity

## 1.0.3

- chore: linting
- fix: Nuxt v3 hook compatibility

## 1.0.2

- fix: full < v1 compatibility

## 1.0.1

- fix: add v1 RC props back

## 1.0.0

- chore: prepare v1 release
- doc: update readme
- v1 release (#162)
- chore: add v1 announcement
- chore: fix typo (#159)

## 1.0.0-next.3

- chore: expose `VueHeadMixin`
- chore: bump unhead

## 1.0.0-next.2

- chore: bump unhead, update tests and examples
- chore: improve doc

## 1.0.0-next.1

- chore: document install
- Merge branch 'main' of github.com:vueuse/head into v1
- chore(ci): switch to next channel
- chore(pkg): bump deps
- chore: fix typo (#159)
- chore: readme link fix
- feat: migrate core to unhead (#157)
- Release v0.9.8
- chore: bump deps

## 1.0.0-rc.14

- chore(pkg): ignore eslint in vue2 example
- fix: Vue 2.7 compatibility (#150)

## 1.0.0-rc.13

- fix: dedupe `htmlAttrs` and `bodyAttrs` for csr (#149)
- chore(pkg): bump deps
- add vue 2.7 compatibility to Head component (#147)

## 1.0.0-rc.12

- chore(pkg): bump zhead
- fix: vue 2.7 globalProperties, fixes #141

## 1.0.0-rc.11

- Merge branch 'v1' of github.com:vueuse/head into v1
- chore(pkg): bump deps
- fix: ensure csr elements are created equally (#145)
- fix: ensure single pass of `htmlAttr` sanitization, fixes #142 (#143)

## 1.0.0-rc.10

- chore(pkg): bump deps

## 1.0.0-rc.9

- fix: ensure tags props are immutable (#139)

## 1.0.0-rc.8

- chore(pkg): bump deps
- chore: linting
- chore: test issue #138
- chore: bump deps

## 1.0.0-rc.7

- fix(titleTemplate): allow titleTemplate to resolve the title (#137)
- chore(pkg): bump deps

## 1.0.0-rc.6

- chore: add missing `type`
- fix(types): export `MaybeComputedRef`

## 1.0.0-rc.5

- chore: useHeadSafe types
- refactor!: useHeadRaw -> useHeadSafe (#136)
- fix: add legacy `addHeadObjs` (#135)

## 1.0.0-rc.4

- fix: add `headTags` for backwards compatibility (#133)
- chore: prefer runtime prop for id & position (#134)
- feat: improved hook api (#132)
- fix: use simpler API for tags (#131)
- fix(ci): use --pre

## 1.0.0-rc.3

- fix(ci): remove broken --pre
- Merge branch 'v1' of github.com:vueuse/head into v1
- fix: ensure empty attrs reset attrs (#130)

## 1.0.0-rc.2

- fix(ci): release on rc

## 1.0.0-rc.1

- Release v1.0.0-rc.0
- chore: bump version

## 1.0.0-rc.0

- chore: bump version

## 0.9.8

- chore: bump deps

## 0.9.7

- fix: ensure `hookBeforeDomUpdate` doesn't block dom update

## 0.9.6

- Merge branch 'main' of github.com:vueuse/head into main
- fix(xss) drop non-raw `on` handles and `innerHTML` (#124)
- Merge branch 'main' of github.com:vueuse/head into main
- fix: warn script children usage (#123)
- refactor: smaller hook fns

## 0.9.5

- Merge branch 'main' of github.com:vueuse/head into main
- chore: bump zhead
- fix: simpler logic for removing added head objs (#122)

## 0.9.4

- chore: make optional id
- fix: safer removal of objects using hash
- fix: dedupe title

## 0.9.3

- fix: remove head objects at right index

## 0.9.2

- chore: bump zhead schema

## 0.9.1

- chore(doc): fix typo
- Merge branch 'main' of github.com:vueuse/head into main
- feat: debounce dom update (#120)

## 0.9.0

- fix: return remove fn from addHeadObj, fixes #48
- feat: `useHeadRaw` to bypass XSS protections (#118)
- fix(ssr): encode `children`, `href` and `url` more appropriately (#119)

## 0.8.2

- chore(doc): add example for primitives
- chore(doc): improve type documentation
- chore(doc): fix typo
- chore(doc): improve readme

## 0.8.1

- chore: bump dependencies (#116)
- feat: hook into resolved tags `hookTagsResolved` (#115)
- refactor: improve HeadAugmentation types and add export

## 0.8.0

- feat: before dom update hookable (#114)
- feat: computed getter support (#110)
- refactor: modify internal API to better isolate envs (#113)
- chore: migrate to eslint (#111)
- chore(tests): improve nuxt3 tests / example (#107)
- feat: support deprecated dedupe keys (#106)
- chore(github): add harlan to funding
- chore(doc): fix links
- chore: harlan as maintainer and wording improvements

## 0.7.13

- chore: ignore .idea files
- fix: use proper encoding for attr name / val pairs (#103)
- fix: simplify tag dedupe logic (#105)
- chore(ci): add export-size-action (#94)
- tests: migrate to vitest, add nuxt e2e (#93)

## 0.7.12

- chore: update deps
- feat: sort critical tags and sort opt-in `renderPriority` (#89)
- fix(types): export head schemas (#87)

## 0.7.11

No unreleased changes.

## 0.7.10

No unreleased changes.

## 0.7.9

No unreleased changes.

## 0.7.8

No unreleased changes.

## 0.7.7

No unreleased changes.

## 0.7.6

No unreleased changes.

## 0.7.5

- Properly get `key` from HTML element.
- Removed the buggy implementation of removing uncontrolled head elements. For example if you have a `<meta name="description">` in `index.html` (which is not generated by `useHead`) and you use `useHead` to generate the same tag, the pre-existing one will be removed first, but the implementation will incorrectly remove the ones generated by `useHead` itself too, so this feature is now removed.
