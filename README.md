<h1 align='center'>@vueuse/head - 🌇 Sunset</h1>

<p align="center">
<a href='https://github.com/harlan-zw/unhead/actions/workflows/test.yml'>
</a>
<a href="https://www.npmjs.com/package/@vueuse/head" target="__blank"><img src="https://img.shields.io/npm/v/@vueuse/head?style=flat&colorA=002438&colorB=28CF8D" alt="NPM version"></a>
<a href="https://www.npmjs.com/package/@vueuse/head" target="__blank"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/@vueuse/head?flat&colorA=002438&colorB=28CF8D"></a>
<a href="https://github.com/vueuse/head" target="__blank"><img alt="GitHub stars" src="https://img.shields.io/github/stars/vueuse/head?flat&colorA=002438&colorB=28CF8D"></a>
</p>


<p align="center">
Document head management for Vue. Powered by <a href="https://unhead.harlanzw.com/">Unhead</a>.
</p>

<p align="center">
<table>
<tbody>
<td align="center">
<img width="800" height="0" /><br>
Created by <a href="https://github.com/sponsors/egoist">egoist</a>, maintained by <a href="https://github.com/harlan-zw">harlan-zw</a> <br>
<sub>💛 Support ongoing development by sponsoring us.</sub><br> 
<sub>Follow <a href="https://twitter.com/harlan_zw">🐦 @harlan_zw</a> for updates  • Join <a href="https://discord.gg/275MBUBvgP">Discord</a> for support</sub><br>
<img width="800" height="0" />
</td>
</tbody>
</table>
</p>

### 🌇 Sunsetting @vueuse/head

The `@vueuse/head` package has been sunset in favour of Unhead. This means no new features will be added to this package and
installation of this package directly will be discouraged.

[Unhead](https://unhead.unjs.io) is a any-framework document head manager with a focus on delightful DX and performance. 
It's used in the Nuxt core and is part of the UnJS ecosystem. 

This package and Unhead share an almost identical API and migrating in most cases will just involve updating the package names.

The `@vueuse/head` package will continue to receive bug fixes and security updates for the foreseeable future.

[Installation guide](https://unhead.unjs.io/setup/vue/installation)

## Docs

[Unhead documentation](https://unhead.unjs.io/setup/vue/installation)

## Migrating to Unhead from @vueuse/head

Replace all imports of `@vueuse/head` with `@unhead/vue`.

If you're using the `<Head>` component you will need to import it from `@unhead/vue/components`.

## Sponsors

<p align="center">
  <a href="https://raw.githubusercontent.com/harlan-zw/static/main/sponsors.svg">
    <img src='https://raw.githubusercontent.com/harlan-zw/static/main/sponsors.svg'/>
  </a>
</p>


## License

MIT &copy; [EGOIST](https://egoist.sh)
MIT License © 2022-PRESENT [Harlan Wilton](https://github.com/harlan-zw)
