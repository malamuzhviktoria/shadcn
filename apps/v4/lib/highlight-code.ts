import { createHash } from "crypto"
import { LRUCache } from "lru-cache"
import { createHighlighterCore } from "shiki/core"
import { createOnigurumaEngine } from "shiki/engine/oniguruma"
import type { ShikiTransformer } from "shiki"

// Fine-grained lang imports — only these files enter webpack's module graph
// instead of all ~200 bundled languages from top-level "shiki" import.
import langCss from "shiki/dist/langs/css.mjs"
import langJavascript from "shiki/dist/langs/javascript.mjs"
import langJson from "shiki/dist/langs/json.mjs"
import langJsx from "shiki/dist/langs/jsx.mjs"
import langMdx from "shiki/dist/langs/mdx.mjs"
import langTsx from "shiki/dist/langs/tsx.mjs"
import langTypescript from "shiki/dist/langs/typescript.mjs"
import themeGithubDark from "shiki/dist/themes/github-dark.mjs"
import themeGithubLight from "shiki/dist/themes/github-light.mjs"

// LRU cache for cross-request caching of highlighted code.
// Shiki highlighting is CPU-intensive and deterministic, so caching is safe.
const highlightCache = new LRUCache<string, string>({
  max: 500,
  ttl: 1000 * 60 * 60, // 1 hour.
})

const SUPPORTED_LANGS = new Set([
  "tsx",
  "typescript",
  "javascript",
  "jsx",
  "css",
  "json",
  "mdx",
])

const LANG_ALIASES: Record<string, string> = {
  ts: "typescript",
  js: "javascript",
}

let _highlighterPromise: ReturnType<typeof createHighlighterCore> | null = null

function getHighlighterInstance() {
  if (!_highlighterPromise) {
    _highlighterPromise = createHighlighterCore({
      langs: [
        langTsx,
        langTypescript,
        langJavascript,
        langJsx,
        langCss,
        langJson,
        langMdx,
      ],
      themes: [themeGithubDark, themeGithubLight],
      engine: createOnigurumaEngine(import("shiki/wasm")),
    })
  }
  return _highlighterPromise
}

export const transformers = [
  {
    code(node) {
      if (node.tagName === "code") {
        const raw = this.source
        node.properties["__raw__"] = raw

        if (raw.startsWith("npm install")) {
          node.properties["__npm__"] = raw
          node.properties["__yarn__"] = raw.replace("npm install", "yarn add")
          node.properties["__pnpm__"] = raw.replace("npm install", "pnpm add")
          node.properties["__bun__"] = raw.replace("npm install", "bun add")
        } else if (raw.startsWith("npx create-")) {
          node.properties["__npm__"] = raw
          node.properties["__yarn__"] = raw.replace(
            "npx create-",
            "yarn create "
          )
          node.properties["__pnpm__"] = raw.replace(
            "npx create-",
            "pnpm create "
          )
          node.properties["__bun__"] = raw.replace("npx", "bunx --bun")
        } else if (raw.startsWith("npm create")) {
          // npm create.
          node.properties["__npm__"] = raw
          node.properties["__yarn__"] = raw.replace("npm create", "yarn create")
          node.properties["__pnpm__"] = raw.replace("npm create", "pnpm create")
          node.properties["__bun__"] = raw.replace("npm create", "bun create")
        } else if (raw.startsWith("npx")) {
          // npx.
          node.properties["__npm__"] = raw
          node.properties["__yarn__"] = raw.replace("npx", "yarn dlx")
          node.properties["__pnpm__"] = raw.replace("npx", "pnpm dlx")
          node.properties["__bun__"] = raw.replace("npx", "bunx --bun")
        } else if (raw.startsWith("npm run")) {
          // npm run.
          node.properties["__npm__"] = raw
          node.properties["__yarn__"] = raw.replace("npm run", "yarn")
          node.properties["__pnpm__"] = raw.replace("npm run", "pnpm")
          node.properties["__bun__"] = raw.replace("npm run", "bun")
        }
      }
    },
  },
] as ShikiTransformer[]

export async function highlightCode(code: string, language: string = "tsx") {
  // Create cache key from code content and language.
  const cacheKey = createHash("sha256")
    .update(`${language}:${code}`)
    .digest("hex")

  // Check cache first.
  const cached = highlightCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const highlighter = await getHighlighterInstance()

  const resolvedLang = LANG_ALIASES[language] ?? language
  const safeLang = SUPPORTED_LANGS.has(resolvedLang) ? resolvedLang : "tsx"

  const html = highlighter.codeToHtml(code, {
    lang: safeLang,
    themes: {
      dark: "github-dark",
      light: "github-light",
    },
    transformers: [
      {
        pre(node) {
          node.properties["class"] =
            "no-scrollbar min-w-0 overflow-x-auto overflow-y-auto overscroll-x-contain overscroll-y-auto px-4 py-3.5 outline-none has-[[data-highlighted-line]]:px-0 has-[[data-line-numbers]]:px-0 has-[[data-slot=tabs]]:p-0 !bg-transparent"
        },
        code(node) {
          node.properties["data-line-numbers"] = ""
        },
        line(node) {
          node.properties["data-line"] = ""
        },
      },
    ],
  })

  // Cache the result.
  highlightCache.set(cacheKey, html)

  return html
}
