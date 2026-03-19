# Code

> Source: https://opentui.com/docs/components/code

Displays syntax-highlighted code using Tree-sitter. Supports many languages with accurate, fast highlighting.

## Basic usage

### Renderable API

```
import { CodeRenderable, createCliRenderer, SyntaxStyle, RGBA } from "@opentui/core"

const renderer = await createCliRenderer()

const syntaxStyle = SyntaxStyle.fromStyles({
 keyword: { fg: RGBA.fromHex("#FF7B72"), bold: true },
 string: { fg: RGBA.fromHex("#A5D6FF") },
 comment: { fg: RGBA.fromHex("#8B949E"), italic: true },
 number: { fg: RGBA.fromHex("#79C0FF") },
 function: { fg: RGBA.fromHex("#D2A8FF") },
 default: { fg: RGBA.fromHex("#E6EDF3") },
})

const code = new CodeRenderable(renderer, {
 id: "code",
 content: `function hello() {
 // This is a comment
 const message = "Hello, world!"
 return message
}`,
 filetype: "javascript",
 syntaxStyle,
 width: 50,
 height: 10,
})

renderer.root.add(code)
```

### Construct API

```
import { Code, Box, createCliRenderer, SyntaxStyle, RGBA } from "@opentui/core"

const renderer = await createCliRenderer()

const syntaxStyle = SyntaxStyle.fromStyles({
 keyword: { fg: RGBA.fromHex("#FF7B72"), bold: true },
 string: { fg: RGBA.fromHex("#A5D6FF") },
 default: { fg: RGBA.fromHex("#E6EDF3") },
})

renderer.root.add(
 Box(
 { border: true, width: 50, height: 10 },
 Code({
 content: 'const x = "hello"',
 filetype: "javascript",
 syntaxStyle,
 }),
 ),
)
```

## Creating syntax styles

Use `SyntaxStyle.fromStyles()` to define colors and attributes for syntax tokens:

```
import { SyntaxStyle, RGBA, parseColor } from "@opentui/core"

const syntaxStyle = SyntaxStyle.fromStyles({
 // Basic tokens
 keyword: { fg: RGBA.fromHex("#FF7B72"), bold: true },
 "keyword.import": { fg: RGBA.fromHex("#FF7B72"), bold: true },
 "keyword.operator": { fg: RGBA.fromHex("#FF7B72") },

 string: { fg: RGBA.fromHex("#A5D6FF") },
 comment: { fg: RGBA.fromHex("#8B949E"), italic: true },
 number: { fg: RGBA.fromHex("#79C0FF") },
 boolean: { fg: RGBA.fromHex("#79C0FF") },
 constant: { fg: RGBA.fromHex("#79C0FF") },

 // Functions and types
 function: { fg: RGBA.fromHex("#D2A8FF") },
 "function.call": { fg: RGBA.fromHex("#D2A8FF") },
 "function.method.call": { fg: RGBA.fromHex("#D2A8FF") },
 type: { fg: RGBA.fromHex("#FFA657") },
 constructor: { fg: RGBA.fromHex("#FFA657") },

 // Variables and properties
 variable: { fg: RGBA.fromHex("#E6EDF3") },
 "variable.member": { fg: RGBA.fromHex("#79C0FF") },
 property: { fg: RGBA.fromHex("#79C0FF") },

 // Operators and punctuation
 operator: { fg: RGBA.fromHex("#FF7B72") },
 punctuation: { fg: RGBA.fromHex("#F0F6FC") },
 "punctuation.bracket": { fg: RGBA.fromHex("#F0F6FC") },
 "punctuation.delimiter": { fg: RGBA.fromHex("#C9D1D9") },

 // Default fallback
 default: { fg: RGBA.fromHex("#E6EDF3") },
})
```

### Style properties

Each style definition can include:

| Property | Type | Description |
| --- | --- | --- |
| `fg` | `RGBA` | Foreground (text) color |
| `bg` | `RGBA` | Background color |
| `bold` | `boolean` | Bold text |
| `italic` | `boolean` | Italic text |
| `underline` | `boolean` | Underlined text |
| `dim` | `boolean` | Dimmed text |

## Supported languages

Code uses Tree-sitter for parsing. Tree-sitter supports these languages:

* TypeScript / JavaScript
* Markdown
* Zig
* And any language with a Tree-sitter grammar

## Streaming mode

Enable streaming mode when content arrives incrementally, like LLM output:

```
const code = new CodeRenderable(renderer, {
 id: "streaming-code",
 content: "",
 filetype: "typescript",
 syntaxStyle,
 streaming: true, // Enable streaming mode
})

// Later, append content
code.content += "const x = 1\n"
code.content += "const y = 2\n"
```

Streaming mode optimizes highlighting for incremental updates.

## Text selection

Enable text selection for copy operations:

```
const code = new CodeRenderable(renderer, {
 id: "code",
 content: sourceCode,
 filetype: "typescript",
 syntaxStyle,
 selectable: true,
 selectionBg: "#264F78",
 selectionFg: "#FFFFFF",
})
```

## Concealment

The `conceal` option controls whether certain syntax elements (like markdown formatting characters) are hidden:

```
const code = new CodeRenderable(renderer, {
 id: "markdown",
 content: "# Heading\n**bold** text",
 filetype: "markdown",
 syntaxStyle,
 conceal: true, // Hide formatting characters
})
```

## With line numbers

Use `LineNumberRenderable` to add line numbers:

```
import { CodeRenderable, LineNumberRenderable, ScrollBoxRenderable } from "@opentui/core"

const code = new CodeRenderable(renderer, {
 id: "code",
 content: sourceCode,
 filetype: "typescript",
 syntaxStyle,
 width: "100%",
})

const lineNumbers = new LineNumberRenderable(renderer, {
 id: "code-with-lines",
 target: code,
 minWidth: 3,
 paddingRight: 1,
 fg: "#6b7280",
 bg: "#161b22",
 width: "100%",
})

// Wrap in ScrollBox for scrolling
const scrollbox = new ScrollBoxRenderable(renderer, {
 id: "scrollbox",
 width: 60,
 height: 20,
})
scrollbox.add(lineNumbers)
```

## Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `content` | `string` | `""` | Source code to display |
| `filetype` | `string` | \- | Language for syntax highlighting |
| `syntaxStyle` | `SyntaxStyle` | required | Syntax highlighting theme |
| `streaming` | `boolean` | `false` | Optimize for incremental content updates |
| `conceal` | `boolean` | `true` | Hide concealed syntax elements |
| `drawUnstyledText` | `boolean` | `true` | Show text before highlighting completes |
| `treeSitterClient` | `TreeSitterClient` | \- | Custom Tree-sitter client instance |

### Inherited from TextBufferRenderable

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `fg` | `string | RGBA` | \- | Default foreground color |
| `bg` | `string | RGBA` | \- | Background color |
| `selectable` | `boolean` | `false` | Enable text selection |
| `selectionBg` | `string | RGBA` | \- | Selection background color |
| `selectionFg` | `string | RGBA` | \- | Selection foreground color |
| `wrapMode` | `string` | `"word"` | Text wrapping: `"none"`, `"char"`, `"word"` |
| `tabIndicator` | `string | number` | \- | Tab display character or width |

## Additional properties

| Property | Type | Description |
| --- | --- | --- |
| `lineCount` | `number` | Number of lines in content |
| `scrollY` | `number` | Current vertical scroll position (get/set) |
| `scrollX` | `number` | Current horizontal scroll position (get/set) |
| `scrollWidth` | `number` | Total scrollable width (read-only) |
| `scrollHeight` | `number` | Total scrollable height (read-only) |
| `isHighlighting` | `boolean` | Whether highlighting is in progress |
| `plainText` | `string` | Raw text content |

## Markdown styles

For markdown highlighting, use markup-prefixed style names:

```
const markdownStyle = SyntaxStyle.fromStyles({
 "markup.heading": { fg: RGBA.fromHex("#58A6FF"), bold: true },
 "markup.heading.1": { fg: RGBA.fromHex("#00FF88"), bold: true, underline: true },
 "markup.heading.2": { fg: RGBA.fromHex("#00D7FF"), bold: true },
 "markup.bold": { fg: RGBA.fromHex("#F0F6FC"), bold: true },
 "markup.strong": { fg: RGBA.fromHex("#F0F6FC"), bold: true },
 "markup.italic": { fg: RGBA.fromHex("#F0F6FC"), italic: true },
 "markup.list": { fg: RGBA.fromHex("#FF7B72") },
 "markup.quote": { fg: RGBA.fromHex("#8B949E"), italic: true },
 "markup.raw": { fg: RGBA.fromHex("#A5D6FF") },
 "markup.raw.block": { fg: RGBA.fromHex("#A5D6FF") },
 "markup.link": { fg: RGBA.fromHex("#58A6FF"), underline: true },
 "markup.link.url": { fg: RGBA.fromHex("#58A6FF"), underline: true },
 default: { fg: RGBA.fromHex("#E6EDF3") },
})
```

---


# Markdown

> Source: https://opentui.com/docs/components/markdown

Render markdown content with syntax-aware styling and optional Tree-sitter highlighting for code blocks.

## Basic usage

### Renderable API

```
import { MarkdownRenderable, SyntaxStyle, RGBA, createCliRenderer } from "@opentui/core"

const renderer = await createCliRenderer()

const syntaxStyle = SyntaxStyle.fromStyles({
 "markup.heading.1": { fg: RGBA.fromHex("#58A6FF"), bold: true },
 "markup.list": { fg: RGBA.fromHex("#FF7B72") },
 "markup.raw": { fg: RGBA.fromHex("#A5D6FF") },
 default: { fg: RGBA.fromHex("#E6EDF3") },
})

const markdown = new MarkdownRenderable(renderer, {
 id: "readme",
 width: 60,
 content: "# Hello\n\n- One\n- Two\n\n```ts\nconst x = 1\n```",
 syntaxStyle,
})

renderer.root.add(markdown)
```

## Concealment

Hide markdown markers (backticks, emphasis markers, etc.) when `conceal` is true:

```
const markdown = new MarkdownRenderable(renderer, {
 content: "**bold** and `code`",
 syntaxStyle,
 conceal: true,
})
```

## Streaming updates

Enable streaming mode for incremental updates:

```
const markdown = new MarkdownRenderable(renderer, {
 content: "",
 syntaxStyle,
 streaming: true,
})

markdown.content += "# Live log\n"
markdown.content += "- line 1\n"
```

## Custom node rendering

Override rendering for a token and fall back to default rendering:

```
const markdown = new MarkdownRenderable(renderer, {
 content: "# Title\n\nHello",
 syntaxStyle,
 renderNode: (token, context) => {
 if (token.type === "heading") {
 return context.defaultRender()
 }
 return undefined
 },
})
```

## Construct API

> Not available yet. Use `MarkdownRenderable` for now.

## Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `content` | `string` | `""` | Markdown source |
| `syntaxStyle` | `SyntaxStyle` | required | Style definitions for tokens |
| `conceal` | `boolean` | `true` | Hide markdown markers |
| `streaming` | `boolean` | `false` | Optimize for incremental updates |
| `treeSitterClient` | `TreeSitterClient` | \- | Custom Tree-sitter client for code blocks |
| `renderNode` | `(token: Token, context: RenderNodeContext) => Renderable` | \- | Custom render hook per markdown block |

---


# Line numbers

> Source: https://opentui.com/docs/components/line-number

Add a line number gutter to renderables that provide line info, such as `CodeRenderable` and text editor components.

## Basic usage

### Renderable API

```
import { CodeRenderable, LineNumberRenderable, ScrollBoxRenderable, SyntaxStyle, RGBA } from "@opentui/core"

const syntaxStyle = SyntaxStyle.fromStyles({
 default: { fg: RGBA.fromHex("#E6EDF3") },
})

const code = new CodeRenderable(renderer, {
 id: "code",
 content: "const x = 1\nconst y = 2\n",
 filetype: "typescript",
 syntaxStyle,
 width: "100%",
})

const lineNumbers = new LineNumberRenderable(renderer, {
 id: "code-lines",
 target: code,
 minWidth: 3,
 paddingRight: 1,
 fg: "#6b7280",
 bg: "#161b22",
})

const scrollbox = new ScrollBoxRenderable(renderer, {
 id: "scrollbox",
 width: 70,
 height: 18,
})

scrollbox.add(lineNumbers)
renderer.root.add(scrollbox)
```

## Line signs and colors

```
lineNumbers.setLineColor(3, "#2b6cb0")
lineNumbers.setLineSign(3, { before: ">", beforeColor: "#2b6cb0" })
```

## Construct API

> Not available yet. Use `LineNumberRenderable` for now.

## Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `target` | `Renderable & LineInfoProvider` | \- | Target renderable to number |
| `fg` | `string` or `RGBA` | `#888888` | Gutter text color |
| `bg` | `string` or `RGBA` | transparent | Gutter background color |
| `minWidth` | `number` | `3` | Minimum gutter width |
| `paddingRight` | `number` | `1` | Right padding for gutter |
| `lineColors` | `Map<number, string or RGBA or LineColorConfig>` | \- | Per-line background colors |
| `lineSigns` | `Map<number, LineSign>` | \- | Per-line signs (before/after) |
| `lineNumberOffset` | `number` | `0` | Offset for line numbering |
| `hideLineNumbers` | `Set<number>` | \- | Lines to hide numbers for |
| `lineNumbers` | `Map<number, number>` | \- | Override line numbers per line |
| `showLineNumbers` | `boolean` | `true` | Toggle gutter visibility |

## Methods

| Method | Description |
| --- | --- |
| `setLineColor()` | Set a background color for a line |
| `clearLineColor()` | Clear a line background color |
| `setLineSign()` | Set a sign before/after a line number |
| `clearLineSign()` | Clear a line sign |
| `setLineNumbers()` | Override multiple line numbers |
| `setHideLineNumbers()` | Hide line numbers for specific lines |

---


# FrameBuffer

> Source: https://opentui.com/docs/components/frame-buffer

A low-level rendering surface for custom graphics and complex visual effects. FrameBuffer provides a 2D array of cells with methods optimized for performance and memory.

## Basic usage

### Renderable API

```
import { FrameBufferRenderable, RGBA, createCliRenderer } from "@opentui/core"

const renderer = await createCliRenderer()

const canvas = new FrameBufferRenderable(renderer, {
 id: "canvas",
 width: 50,
 height: 20,
})

// Draw on the frame buffer
canvas.frameBuffer.fillRect(5, 2, 20, 10, RGBA.fromHex("#FF0000"))
canvas.frameBuffer.drawText("Hello!", 8, 6, RGBA.fromHex("#FFFFFF"))

renderer.root.add(canvas)
```

### Construct API

```
import { FrameBuffer, createCliRenderer } from "@opentui/core"

const renderer = await createCliRenderer()

renderer.root.add(
 FrameBuffer({
 width: 50,
 height: 20,
 }),
)
```

## Drawing methods

### setCell

Set a single cell’s content and colors:

```
canvas.frameBuffer.setCell(
 x, // X position
 y, // Y position
 char, // Character to display
 fg, // Foreground color (RGBA)
 bg, // Background color (RGBA)
 attributes, // Text attributes (optional, default: 0)
)

// Example
canvas.frameBuffer.setCell(10, 5, "@", RGBA.fromHex("#FFFF00"), RGBA.fromHex("#000000"))
```

### setCellWithAlphaBlending

Set a cell with alpha blending for transparency effects:

```
const semiTransparent = RGBA.fromValues(1.0, 0.0, 0.0, 0.5)
const transparent = RGBA.fromValues(0, 0, 0, 0)
canvas.frameBuffer.setCellWithAlphaBlending(10, 5, " ", transparent, semiTransparent)
```

### drawText

Draw a string of text at a position:

```
canvas.frameBuffer.drawText(
 text, // String to draw
 x, // Starting X position
 y, // Y position
 fg, // Text color (RGBA)
 bg, // Background color (RGBA, optional)
 attributes, // Text attributes (optional, default: 0)
)

// Example
canvas.frameBuffer.drawText("Score: 100", 2, 1, RGBA.fromHex("#00FF00"))
```

### fillRect

Fill a rectangular area with a color:

```
canvas.frameBuffer.fillRect(
 x, // X position
 y, // Y position
 width, // Rectangle width
 height, // Rectangle height
 color, // Fill color (RGBA)
)

// Example: Draw a red rectangle
canvas.frameBuffer.fillRect(10, 5, 20, 8, RGBA.fromHex("#FF0000"))
```

### drawFrameBuffer

Copy another frame buffer onto this one:

```
canvas.frameBuffer.drawFrameBuffer(
 destX, // Destination X
 destY, // Destination Y
 sourceBuffer, // Source FrameBuffer (OptimizedBuffer)
 sourceX, // Source X offset (optional)
 sourceY, // Source Y offset (optional)
 sourceWidth, // Width to copy (optional)
 sourceHeight, // Height to copy (optional)
)
```

## Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `width` | `number` | \- | Buffer width in characters (required) |
| `height` | `number` | \- | Buffer height in rows (required) |
| `respectAlpha` | `boolean` | `false` | Enable alpha blending when drawing |
| `position` | `string` | `"relative"` | Positioning mode |
| `left`, `top`, `right`, `bottom` | `number` | \- | Position offsets |

## Example: Simple game canvas

```
import { FrameBufferRenderable, RGBA, createCliRenderer } from "@opentui/core"

const renderer = await createCliRenderer()

const gameCanvas = new FrameBufferRenderable(renderer, {
 id: "game",
 width: 40,
 height: 20,
 position: "absolute",
 left: 5,
 top: 2,
})

// Game state
let playerX = 20
let playerY = 10

function render() {
 const fb = gameCanvas.frameBuffer
 const BG = RGBA.fromHex("#111111")

 // Clear the canvas
 fb.fillRect(0, 0, 40, 20, BG)

 // Draw border
 for (let x = 0; x < 40; x++) {
 fb.setCell(x, 0, "-", RGBA.fromHex("#444444"), BG)
 fb.setCell(x, 19, "-", RGBA.fromHex("#444444"), BG)
 }
 for (let y = 0; y < 20; y++) {
 fb.setCell(0, y, "|", RGBA.fromHex("#444444"), BG)
 fb.setCell(39, y, "|", RGBA.fromHex("#444444"), BG)
 }

 // Draw player
 fb.setCell(playerX, playerY, "@", RGBA.fromHex("#00FF00"), BG)

 // Draw score
 fb.drawText("Score: 0", 2, 0, RGBA.fromHex("#FFFF00"))
}

// Handle input
renderer.keyInput.on("keypress", (key) => {
 switch (key.name) {
 case "up":
 playerY = Math.max(1, playerY - 1)
 break
 case "down":
 playerY = Math.min(18, playerY + 1)
 break
 case "left":
 playerX = Math.max(1, playerX - 1)
 break
 case "right":
 playerX = Math.min(38, playerX + 1)
 break
 }
 render()
})

render()
renderer.root.add(gameCanvas)
```

## Example: Progress bar

```
const EMPTY_BG = RGBA.fromHex("#222222")

function drawProgressBar(fb, x, y, width, progress, color) {
 const filled = Math.floor(width * progress)

 // Draw filled portion
 for (let i = 0; i < filled; i++) {
 fb.setCell(x + i, y, "█", color, EMPTY_BG)
 }

 // Draw empty portion
 for (let i = filled; i < width; i++) {
 fb.setCell(x + i, y, "░", RGBA.fromHex("#333333"), EMPTY_BG)
 }
}

// Usage
drawProgressBar(canvas.frameBuffer, 5, 10, 30, 0.75, RGBA.fromHex("#00FF00"))
```

## Performance tips

1. **Batch updates**: Make multiple changes to the frame buffer before the next render cycle
2. **Minimize fillRect calls**: Use individual setCell calls for complex shapes
3. **Reuse RGBA objects**: Create color constants instead of calling `fromHex` repeatedly

```
// Good: Create once, reuse
const RED = RGBA.fromHex("#FF0000")
const GREEN = RGBA.fromHex("#00FF00")
const BG = RGBA.fromHex("#000000")

for (let i = 0; i < 100; i++) {
 fb.setCell(i, 5, "*", RED, BG)
}

// Avoid: Creating new RGBA objects in loops
for (let i = 0; i < 100; i++) {
 fb.setCell(i, 5, "*", RGBA.fromHex("#FF0000"), RGBA.fromHex("#000000")) // Creates 200 objects
}
```

---


# ASCIIFont

> Source: https://opentui.com/docs/components/ascii-font

Display text using ASCII art fonts with multiple font styles available. Great for titles, headers, and decorative text.

## Basic Usage

### Renderable API

```
import { ASCIIFontRenderable, RGBA, createCliRenderer } from "@opentui/core"

const renderer = await createCliRenderer()

const title = new ASCIIFontRenderable(renderer, {
 id: "title",
 text: "OPENTUI",
 font: "tiny",
 color: RGBA.fromInts(255, 255, 255, 255),
})

renderer.root.add(title)
```

### Construct API

```
import { ASCIIFont, createCliRenderer } from "@opentui/core"

const renderer = await createCliRenderer()

renderer.root.add(
 ASCIIFont({
 text: "HELLO",
 font: "block",
 color: "#00FF00",
 }),
)
```

## Available Fonts

OpenTUI includes several ASCII art font styles:

```
// Small, compact font
{
 font: "tiny"
}

// Block style font
{
 font: "block"
}

// Shaded style font
{
 font: "shade"
}

// Slick style font
{
 font: "slick"
}

// Large font
{
 font: "huge"
}

// Grid style font
{
 font: "grid"
}

// Pallet style font
{
 font: "pallet"
}
```

## Positioning

Position the ASCII text anywhere on screen:

```
const title = new ASCIIFontRenderable(renderer, {
 id: "title",
 text: "TITLE",
 font: "block",
 color: RGBA.fromHex("#FFFF00"),
 x: 10,
 y: 2,
})
```

## Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | `""` | Text to display |
| `font` | `ASCIIFontName` | `"tiny"` | Font style to use |
| `color` | `ColorInput | ColorInput[]` | `"#FFFFFF"` | Text color(s) |
| `backgroundColor` | `ColorInput` | `"transparent"` | Background color |
| `selectable` | `boolean` | `true` | Whether text is selectable |
| `selectionBg` | `ColorInput` | \- | Selection background color |
| `selectionFg` | `ColorInput` | \- | Selection foreground color |
| `x` | `number` | \- | X position offset |
| `y` | `number` | \- | Y position offset |

## Example: Welcome Screen

```
import { Box, ASCIIFont, Text, createCliRenderer } from "@opentui/core"

const renderer = await createCliRenderer()

const welcomeScreen = Box(
 {
 width: "100%",
 height: "100%",
 flexDirection: "column",
 alignItems: "center",
 justifyContent: "center",
 },
 ASCIIFont({
 text: "OPENTUI",
 font: "huge",
 color: "#00FFFF",
 }),
 Text({
 content: "Terminal UI Framework",
 fg: "#888888",
 }),
 Text({
 content: "Press any key to continue...",
 fg: "#444444",
 }),
)

renderer.root.add(welcomeScreen)
```

## Dynamic Text

Update the text content dynamically:

```
const counter = new ASCIIFontRenderable(renderer, {
 id: "counter",
 text: "0",
 font: "block",
 color: RGBA.fromHex("#FF0000"),
})

let count = 0
setInterval(() => {
 count++
 counter.text = count.toString()
}, 1000)
```

## Color Effects

Create gradient-like effects by positioning multiple ASCII fonts:

```
import { Box, ASCIIFont } from "@opentui/core"

const gradientTitle = Box(
 {},
 ASCIIFont({
 text: "HELLO",
 font: "block",
 color: "#FF0000",
 }),
 // Overlay with offset for shadow effect
 ASCIIFont({
 text: "HELLO",
 font: "block",
 color: "#880000",
 left: 1,
 top: 1,
 }),
)
```

---


# Diff

> Source: https://opentui.com/docs/components/diff

`diff``string``""`Unified diff string`view``"unified"` or `"split"``"unified"`Layout style`filetype``string`\-Syntax highlighting language`syntaxStyle``SyntaxStyle`\-Syntax style for code`wrapMode``"word"`, `"char"`, or `"none"`\-Code wrapping mode`conceal``boolean``false`Conceal markup when highlighting`treeSitterClient``TreeSitterClient`\-Custom Tree-sitter client`showLineNumbers``boolean``true`Show line numbers`lineNumberFg``string` or `RGBA``#888888`Line number text color`lineNumberBg``string` or `RGBA`transparentLine number background`addedLineNumberBg``string` or `RGBA`transparentLine number background for added`removedLineNumberBg``string` or `RGBA`transparentLine number background for removed`addedBg``string` or `RGBA``#1a4d1a`Background for added lines`removedBg``string` or `RGBA``#4d1a1a`Background for removed lines`contextBg``string` or `RGBA`transparentBackground for context lines`addedContentBg``string` or `RGBA`\-Optional content background (added)`removedContentBg``string` or `RGBA`\-Optional content background (removed)`contextContentBg``string` or `RGBA`\-Optional content background (context)`addedSignColor``string` or `RGBA``#22c55e`Sign color for added lines`removedSignColor``string` or `RGBA``#ef4444`Sign color for removed lines

---

