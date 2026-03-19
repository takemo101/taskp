# Keyboard input

> Source: https://opentui.com/docs/core-concepts/keyboard

OpenTUI parses terminal input and provides structured key events. The `renderer.keyInput` EventEmitter emits `keypress` and `paste` events with detailed key information.

## Basic key handling

```
import { createCliRenderer, type KeyEvent } from "@opentui/core"

const renderer = await createCliRenderer()
const keyHandler = renderer.keyInput

keyHandler.on("keypress", (key: KeyEvent) => {
 console.log("Key name:", key.name)
 console.log("Sequence:", key.sequence)
 console.log("Ctrl pressed:", key.ctrl)
 console.log("Shift pressed:", key.shift)
 console.log("Alt pressed:", key.meta)
 console.log("Option pressed:", key.option)
})
```

## KeyEvent properties

Each `KeyEvent` contains:

| Property | Type | Description |
| --- | --- | --- |
| `name` | `string` | The key name (e.g., “a”, “escape”, “f1”) |
| `sequence` | `string` | The raw escape sequence |
| `ctrl` | `boolean` | Whether Ctrl was held |
| `shift` | `boolean` | Whether Shift was held |
| `meta` | `boolean` | Whether Alt/Meta was held |
| `option` | `boolean` | Whether Option was held (macOS) |

## Common key patterns

### Single keys

```
keyHandler.on("keypress", (key: KeyEvent) => {
 if (key.name === "escape") {
 console.log("Escape pressed!")
 }

 if (key.name === "return") {
 console.log("Enter pressed!")
 }

 if (key.name === "space") {
 console.log("Space pressed!")
 }
})
```

### Modifier combinations

```
keyHandler.on("keypress", (key: KeyEvent) => {
 // Ctrl+C
 if (key.ctrl && key.name === "c") {
 console.log("Ctrl+C pressed!")
 }

 // Ctrl+S
 if (key.ctrl && key.name === "s") {
 console.log("Save shortcut!")
 }

 // Shift+F1
 if (key.shift && key.name === "f1") {
 console.log("Shift+F1 pressed!")
 }

 // Alt+Enter
 if (key.meta && key.name === "return") {
 console.log("Alt+Enter pressed!")
 }
})
```

### Function keys

```
keyHandler.on("keypress", (key: KeyEvent) => {
 // F1-F12
 if (key.name === "f1") {
 showHelp()
 }

 if (key.name === "f5") {
 refresh()
 }
})
```

### Arrow keys

```
keyHandler.on("keypress", (key: KeyEvent) => {
 switch (key.name) {
 case "up":
 moveCursorUp()
 break
 case "down":
 moveCursorDown()
 break
 case "left":
 moveCursorLeft()
 break
 case "right":
 moveCursorRight()
 break
 }
})
```

## Paste events

Handle pasted text separately from individual keypresses:

```
import { type PasteEvent } from "@opentui/core"

keyHandler.on("paste", (event: PasteEvent) => {
 console.log("Pasted text:", event.text)
 // Insert text at cursor position
})
```

## Exit on Ctrl+C

Configure the renderer to automatically exit on Ctrl+C:

```
const renderer = await createCliRenderer({
 exitOnCtrlC: true, // Default behavior
})

// Or handle it manually
const renderer = await createCliRenderer({
 exitOnCtrlC: false,
})

renderer.keyInput.on("keypress", (key: KeyEvent) => {
 if (key.ctrl && key.name === "c") {
 // Custom cleanup before exit
 cleanup()
 process.exit(0)
 }
})
```

## Focus and key routing

Focus components to receive keyboard input. OpenTUI routes events to the focused component:

```
import { InputRenderable } from "@opentui/core"

const input = new InputRenderable(renderer, {
 id: "my-input",
 placeholder: "Type here...",
})

// Focus the input to receive key events
input.focus()

// Or with constructs
import { Input } from "@opentui/core"

const inputNode = Input({ placeholder: "Type here..." })
inputNode.focus() // Queued for when instantiated

renderer.root.add(inputNode)
```

---


# Console overlay

> Source: https://opentui.com/docs/core-concepts/console

OpenTUI includes a built-in console overlay that captures all `console.log`, `console.info`, `console.warn`, `console.error`, and `console.debug` calls. You can position the console at any edge of the terminal. It supports scrolling and focus management.

## Basic usage

```
import { createCliRenderer, ConsolePosition } from "@opentui/core"

const renderer = await createCliRenderer({
 consoleOptions: {
 position: ConsolePosition.BOTTOM,
 sizePercent: 30,
 },
})

// These appear in the overlay instead of stdout
console.log("This appears in the overlay")
console.error("Errors are color-coded red")
console.warn("Warnings appear in yellow")
```

## Configuration options

```
const renderer = await createCliRenderer({
 consoleOptions: {
 position: ConsolePosition.BOTTOM, // Position on screen
 sizePercent: 30, // Size as percentage of terminal
 colorInfo: "#00FFFF", // Color for console.info
 colorWarn: "#FFFF00", // Color for console.warn
 colorError: "#FF0000", // Color for console.error
 startInDebugMode: false, // Show file/line info in logs
 },
})
```

## Console positions

```
import { ConsolePosition } from "@opentui/core"

ConsolePosition.TOP // Dock at top
ConsolePosition.BOTTOM // Dock at bottom
ConsolePosition.LEFT // Dock at left
ConsolePosition.RIGHT // Dock at right
```

## Toggling the console

Toggle the console overlay in code:

```
// Toggle visibility and focus
renderer.console.toggle()

// When open but not focused, toggle() focuses the console
// When focused, toggle() closes the console
```

## Console shortcuts

When the console is focused:

| Key | Action |
| --- | --- |
| Arrow keys | Scroll through log history |
| `+` | Increase console size |
| `-` | Decrease console size |

## Keybinding for toggle

Add a keyboard shortcut to toggle the console:

```
renderer.keyInput.on("keypress", (key) => {
 // Toggle with backtick key
 if (key.name === "`") {
 renderer.console.toggle()
 }

 // Or with a modifier
 if (key.ctrl && key.name === "l") {
 renderer.console.toggle()
 }
})
```

## Why use the console?

Terminal UI applications capture stdout for rendering. Regular `console.log` calls would interfere with your interface. The console overlay solves this problem:

* Captures all console output without disrupting the UI
* Displays logs in a dedicated overlay area
* Color-codes different log levels for easy identification
* Lets you scroll through history for debugging

## Environment variables

Control console behavior with environment variables:

```
# Disable console capture entirely
OTUI_USE_CONSOLE=false bun app.ts

# Start with console visible
SHOW_CONSOLE=true bun app.ts

# Dump captured output on exit
OTUI_DUMP_CAPTURES=true bun app.ts
```

---


# Colors

> Source: https://opentui.com/docs/core-concepts/colors

OpenTUI uses the `RGBA` class for color representation. The class stores colors as normalized float values (0.0-1.0) internally, but provides methods for working with different color formats.

## Creating colors

### From integers (0-255)

```
import { RGBA } from "@opentui/core"

const red = RGBA.fromInts(255, 0, 0, 255)
const semiTransparentBlue = RGBA.fromInts(0, 0, 255, 128)
```

### From float values (0.0-1.0)

```
const green = RGBA.fromValues(0.0, 1.0, 0.0, 1.0)
const transparent = RGBA.fromValues(1.0, 1.0, 1.0, 0.5)
```

### From hex strings

```
const purple = RGBA.fromHex("#800080")
const withAlpha = RGBA.fromHex("#FF000080") // Semi-transparent red
```

## String colors

Most component properties accept both `RGBA` objects and color strings:

```
import { Text, Box } from "@opentui/core"

// Using hex strings
Text({ content: "Hello", fg: "#00FF00" })

// Using CSS color names
Box({ backgroundColor: "red", borderColor: "white" })

// Using RGBA objects
const customColor = RGBA.fromInts(100, 150, 200, 255)
Text({ content: "Custom", fg: customColor })

// Transparent
Box({ backgroundColor: "transparent" })
```

## The parseColor utility

The `parseColor()` function converts various color formats to RGBA:

```
import { parseColor } from "@opentui/core"

const color1 = parseColor("#FF0000") // Hex
const color2 = parseColor("blue") // CSS color name
const color3 = parseColor("transparent") // Transparent
const color4 = parseColor(RGBA.fromInts(255, 0, 0, 255)) // Pass-through
```

## Alpha blending

You can use transparent cells and alpha blending for layered effects:

```
import { FrameBufferRenderable, RGBA } from "@opentui/core"

const canvas = new FrameBufferRenderable(renderer, {
 id: "canvas",
 width: 50,
 height: 20,
})

// Draw with alpha blending
const semiTransparent = RGBA.fromValues(1.0, 0.0, 0.0, 0.5)
const transparent = RGBA.fromInts(0, 0, 0, 0)
canvas.frameBuffer.setCellWithAlphaBlending(10, 5, " ", transparent, semiTransparent)
```

## Text attributes with colors

Combine colors with text attributes:

```
import { TextRenderable, TextAttributes, RGBA } from "@opentui/core"

const styledText = new TextRenderable(renderer, {
 id: "styled",
 content: "Important",
 fg: RGBA.fromHex("#FFFF00"),
 bg: RGBA.fromHex("#333333"),
 attributes: TextAttributes.BOLD | TextAttributes.UNDERLINE,
})
```

## Color constants

Common colors:

```
// Some examples of commonly used colors
const white = RGBA.fromInts(255, 255, 255, 255)
const black = RGBA.fromInts(0, 0, 0, 255)
const red = RGBA.fromInts(255, 0, 0, 255)
const green = RGBA.fromInts(0, 255, 0, 255)
const blue = RGBA.fromInts(0, 0, 255, 255)
const transparent = RGBA.fromInts(0, 0, 0, 0)
```

---

