# Environment variables

> Source: https://opentui.com/docs/reference/env-vars

`OTUI_TS_STYLE_WARN``string``false`Enable warnings for missing syntax styles`OTUI_TREE_SITTER_WORKER_PATH``string``""`Path to the Tree-sitter worker`XDG_CONFIG_HOME``string``""`Base directory for user-specific configuration files`XDG_DATA_HOME``string``""`Base directory for user-specific data files`OTUI_DEBUG_FFI``boolean``false`Enable debug logging for the FFI bindings`OTUI_SHOW_STATS``boolean``false`Show the debug overlay at startup`OTUI_TRACE_FFI``boolean``false`Enable tracing for the FFI bindings`OPENTUI_FORCE_WCWIDTH``boolean``false`Use wcwidth for character width calculations`OPENTUI_FORCE_UNICODE``boolean``false`Force Mode 2026 Unicode support in terminal capabilities`OPENTUI_GRAPHICS``boolean``true`Enable Kitty graphics protocol detection`OPENTUI_FORCE_NOZWJ``boolean``false`Use no\_zwj width method (Unicode without ZWJ joining)`OPENTUI_FORCE_EXPLICIT_WIDTH``string`\-Force explicit width detection (`true`/`1` or `false`/`0`)`OTUI_USE_CONSOLE``boolean``true`Enable or disable the built-in console capture`SHOW_CONSOLE``boolean``false`Show the console overlay at startup`OTUI_DUMP_CAPTURES``boolean``false`Dump captured output when the renderer exits`OTUI_NO_NATIVE_RENDER``boolean``false`Disable native rendering (debug only)`OTUI_USE_ALTERNATE_SCREEN``boolean``true`Use the terminal alternate screen buffer`OTUI_OVERRIDE_STDOUT``boolean``true`Override the stdout stream (debug only)`OTUI_DEBUG``boolean``false`Enable debug mode to capture raw input

---


# Tree-sitter

> Source: https://opentui.com/docs/reference/tree-sitter

OpenTUI integrates Tree-sitter for fast, accurate syntax highlighting. You can register parsers globally or per client.

## Add parsers globally

Use `addDefaultParsers()` before creating clients:

```
import { addDefaultParsers, getTreeSitterClient } from "@opentui/core"

addDefaultParsers([
 {
 filetype: "python",
 wasm: "https://github.com/tree-sitter/tree-sitter-python/releases/download/v0.23.6/tree-sitter-python.wasm",
 queries: {
 highlights: ["https://raw.githubusercontent.com/tree-sitter/tree-sitter-python/master/queries/highlights.scm"],
 },
 },
])

const client = getTreeSitterClient()
await client.initialize()
```

## Add parsers per client

```
import { TreeSitterClient } from "@opentui/core"

const client = new TreeSitterClient({ dataPath: "./cache" })
await client.initialize()

client.addFiletypeParser({
 filetype: "rust",
 wasm: "https://github.com/tree-sitter/tree-sitter-rust/releases/download/v0.23.2/tree-sitter-rust.wasm",
 queries: {
 highlights: ["https://raw.githubusercontent.com/tree-sitter/tree-sitter-rust/master/queries/highlights.scm"],
 },
})
```

## Parser configuration

```
interface FiletypeParserOptions {
 filetype: string
 wasm: string
 queries: {
 highlights: string[]
 }
}
```

## Use local files

```
import pythonWasm from "./parsers/tree-sitter-python.wasm" with { type: "file" }
import pythonHighlights from "./queries/python/highlights.scm" with { type: "file" }

addDefaultParsers([
 {
 filetype: "python",
 wasm: pythonWasm,
 queries: {
 highlights: [pythonHighlights],
 },
 },
])
```

## Automated asset management

Use the `updateAssets` utility to download parsers and generate imports.

### CLI usage

```
{
 "scripts": {
 "prebuild": "bun node_modules/@opentui/core/lib/tree-sitter/assets/update.ts --config./parsers-config.json --assets./src/parsers --output./src/parsers.ts"
 }
}
```

### Programmatic usage

```
import { updateAssets } from "@opentui/core"

await updateAssets({
 configPath: "./parsers-config.json",
 assetsDir: "./src/parsers",
 outputPath: "./src/parsers.ts",
})
```

## Using with CodeRenderable

```
import { CodeRenderable, getTreeSitterClient } from "@opentui/core"

const client = getTreeSitterClient()
await client.initialize()

const code = new CodeRenderable(renderer, {
 id: "code",
 content: "const x = 1",
 filetype: "typescript",
 syntaxStyle,
 treeSitterClient: client,
})
```

## Caching

Parser and query files are cached in the client `dataPath`. Set a custom cache directory:

```
const client = new TreeSitterClient({
 dataPath: "./my-cache",
})
```

## File type resolution

```
import { pathToFiletype, extToFiletype } from "@opentui/core"

const ft1 = pathToFiletype("src/main.rs")
const ft2 = extToFiletype("ts")
```

---

