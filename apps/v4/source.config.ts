import { defineConfig, defineDocs } from "fumadocs-mdx/config"
import rehypePrettyCode from "rehype-pretty-code"
import { createHighlighterCore } from "shiki/core"
import { createOnigurumaEngine } from "shiki/engine/oniguruma"

import langAstro from "shiki/dist/langs/astro.mjs"
import langBash from "shiki/dist/langs/bash.mjs"
import langCss from "shiki/dist/langs/css.mjs"
import langDiff from "shiki/dist/langs/diff.mjs"
import langHtml from "shiki/dist/langs/html.mjs"
import langJavascript from "shiki/dist/langs/javascript.mjs"
import langJson from "shiki/dist/langs/json.mjs"
import langJsx from "shiki/dist/langs/jsx.mjs"
import langMarkdown from "shiki/dist/langs/markdown.mjs"
import langRegex from "shiki/dist/langs/regex.mjs"
import langToml from "shiki/dist/langs/toml.mjs"
import langTsx from "shiki/dist/langs/tsx.mjs"
import langTypescript from "shiki/dist/langs/typescript.mjs"
import themeGithubLightDefault from "shiki/dist/themes/github-light-default.mjs"
import themeVesper from "shiki/dist/themes/vesper.mjs"

import { transformers } from "@/lib/highlight-code"

export default defineConfig({
  mdxOptions: {
    rehypePlugins: (plugins) => {
      plugins.shift()
      plugins.push([
        rehypePrettyCode,
        {
          theme: {
            dark: "vesper",
            light: "github-light-default",
          },
          transformers,
          // Restrict to only languages used in docs instead of loading all ~200
          // bundled shiki grammars, which would exhaust the Node.js heap at build time.
          getHighlighter: () =>
            createHighlighterCore({
              langs: [
                langTsx,
                langTypescript,
                langJavascript,
                langJsx,
                langBash,
                langJson,
                langCss,
                langDiff,
                langHtml,
                langMarkdown,
                langAstro,
                langToml,
                langRegex,
              ],
              themes: [themeVesper, themeGithubLightDefault],
              engine: createOnigurumaEngine(import("shiki/wasm")),
            }),
        },
      ])

      return plugins
    },
  },
})

export const docs = defineDocs({
  dir: "content/docs",
  // TODO: Fix this when we upgrade to zod v4.
  // docs: {
  //   schema: frontmatterSchema.extend({
  //     links: z.optional(
  //       z.object({
  //         doc: z.string().optional(),
  //         api: z.string().optional(),
  //       })
  //     ),
  //   }),
  // },
})
