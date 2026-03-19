# Getting started

> Source: https://opentui.com/docs/getting-started/

OpenTUI is a native terminal UI core written in Zig with TypeScript bindings. The native core exposes a C ABI and can be used from any language. OpenTUI powers OpenCode in production today and will also power terminal.shop. It is an extensible core with a focus on correctness, stability, and high performance. It provides a component-based architecture with flexible layout capabilities, allowing you to create complex terminal applications.

## Installation

OpenTUI is currently [Bun](https://bun.sh/) exclusive but Deno and Node support in-progress.

```
mkdir my-tui && cd my-tui
bun init -y
bun add @opentui/core
```

## Hello world

Create `index.ts`:

```
import { createCliRenderer, Text } from "@opentui/core"

const renderer = await createCliRenderer({
 exitOnCtrlC: true,
})

renderer.root.add(
 Text({
 content: "Hello, OpenTUI!",
 fg: "#00FF00",
 }),
)
```

Run it:

```
bun index.ts
```

You should see green text. Press `Ctrl+C` to exit.

## Composing components

Components nest naturally. Here’s a bordered panel with content:

```
import { createCliRenderer, Box, Text } from "@opentui/core"

const renderer = await createCliRenderer({
 exitOnCtrlC: true,
})

renderer.root.add(
 Box(
 { borderStyle: "rounded", padding: 1, flexDirection: "column", gap: 1 },
 Text({ content: "Welcome", fg: "#FFFF00" }),
 Text({ content: "Press Ctrl+C to exit" }),
 ),
)
```

`Box` and `Text` are factory functions. The first argument is props; additional arguments are children.

## What’s next

### Core concepts

* [Renderer](https://opentui.com/docs/core-concepts/renderer) - The rendering engine
* [Layout](https://opentui.com/docs/core-concepts/layout) - Flexbox positioning
* [Constructs](https://opentui.com/docs/core-concepts/constructs) - The declarative component API

### Components

* [Text](https://opentui.com/docs/components/text), [Box](https://opentui.com/docs/components/box) - Display and layout
* [Input](https://opentui.com/docs/components/input), [Select](https://opentui.com/docs/components/select) - User interaction

### Framework bindings

* [React](https://opentui.com/docs/bindings/react)
* [Solid.js](https://opentui.com/docs/bindings/solid)

---

# OpenTUI - Terminal UIs

> Source: https://opentui.com/

## Terminal UIs on a Native Zig Core

Build rich, interactive terminal interfaces with TypeScript bindings, first-class React/Solid support, and a C ABI for any language.

12345678910

```
import { createCliRenderer, Text } from "@opentui/core"

const renderer = await createCliRenderer()

renderer.root.add(
 Text({
 content: "Hello, OpenTUI!",
 fg: "#00FF00",
 })
)
```

1234567891011

```
import { createCliRenderer, Input } from "@opentui/core"

const renderer = await createCliRenderer()

const input = Input({
 placeholder: "Type something...",
 width: 30,
})

input.focus()
renderer.root.add(input)
```

1234567891011121314

```
import { createCliRenderer, Box, Text } from "@opentui/core"

const renderer = await createCliRenderer()

renderer.root.add(
 Box(
 { width: "100%", height: "100%", flexDirection: "row", gap: 2 },
 Box(
 { flexGrow: 1, backgroundColor: "#1a1b26" },
 Text({ content: "Sidebar", fg: "#bb9af7" })
 ),
 Box({ flexGrow: 3, backgroundColor: "#24283b" }, Text({ content: "Main" }))
 )
)
```

### What is OpenTUI?

OpenTUI is a native terminal UI core written in Zig with TypeScript bindings. The native core exposes a C ABI and can be used from any language. OpenTUI powers OpenCode in production today and will also power terminal.shop. It is an extensible core with a focus on correctness, stability, and high performance. It provides a component-based architecture with flexible layout capabilities, allowing you to create complex terminal applications.

* \[o\]
 
 **Flexbox layout** Yoga-powered layout engine with familiar CSS-like positioning and sizing
 
* \[\*\]
 
 **Syntax highlighting** Built-in tree-sitter integration for beautiful code rendering
 
* \[\*\]
 
 **Rich components** Text, Box, Input, Select, ScrollBox, Code, Diff, and more
 
* \[\*\]
 
 **Keyboard handling** Focus management and input handling built in
 
* \[\*\]
 
 **React and Solid.js** First-class bindings for building UIs with your favorite framework
 
* \[\*\]
 
 **Animations** Timeline API for smooth, performant terminal animations
 

[Read docs](https://opentui.com/docs/getting-started)

---

