# Text

> Source: https://opentui.com/docs/components/text

Display styled text content with support for colors, attributes, and text selection.

## Basic Usage

### Renderable API

```
import { TextRenderable, createCliRenderer } from "@opentui/core"

const renderer = await createCliRenderer()

const text = new TextRenderable(renderer, {
 id: "greeting",
 content: "Hello, OpenTUI!",
 fg: "#00FF00",
})

renderer.root.add(text)
```

### Construct API

```
import { Text, createCliRenderer } from "@opentui/core"

const renderer = await createCliRenderer()

renderer.root.add(
 Text({
 content: "Hello, OpenTUI!",
 fg: "#00FF00",
 }),
)
```

## Text attributes

Combine multiple text attributes using bitwise OR:

```
import { TextRenderable, TextAttributes } from "@opentui/core"

const styledText = new TextRenderable(renderer, {
 id: "styled",
 content: "Important Message",
 fg: "#FFFF00",
 attributes: TextAttributes.BOLD | TextAttributes.UNDERLINE,
})
```

### Available attributes

| Attribute | Description |
| --- | --- |
| `TextAttributes.BOLD` | Bold text |
| `TextAttributes.DIM` | Dimmed text |
| `TextAttributes.ITALIC` | Italic text |
| `TextAttributes.UNDERLINE` | Underlined text |
| `TextAttributes.BLINK` | Blinking text |
| `TextAttributes.INVERSE` | Inverted colors |
| `TextAttributes.HIDDEN` | Hidden text |
| `TextAttributes.STRIKETHROUGH` | Strikethrough text |

## Template literals for rich text

Use the `t` template literal for inline styling within a single text element:

```
import { TextRenderable, t, bold, underline, fg, bg, italic } from "@opentui/core"

const richText = new TextRenderable(renderer, {
 id: "rich",
 content: t`${bold("Important:")} ${fg("#FF0000")(underline("Warning!"))} Normal text`,
})
```

### Available style functions

```
import { t, bold, dim, italic, underline, blink, reverse, strikethrough, fg, bg } from "@opentui/core"

// Basic attributes
t`${bold("bold text")}`
t`${italic("italic text")}`
t`${underline("underlined")}`
t`${strikethrough("deleted")}`

// Colors
t`${fg("#FF0000")("red text")}`
t`${bg("#0000FF")("blue background")}`

// Combining styles
t`${bold(fg("#FFFF00")("bold yellow"))}`
```

## Positioning

```
const text = new TextRenderable(renderer, {
 id: "positioned",
 content: "Absolute position",
 position: "absolute",
 left: 10,
 top: 5,
})
```

## Text selection

Enable text selection for copying:

```
const selectableText = new TextRenderable(renderer, {
 id: "selectable",
 content: "Select me!",
 selectable: true, // Default is true
})

const nonSelectable = new TextRenderable(renderer, {
 id: "label",
 content: "Button Label",
 selectable: false, // Disable selection
})
```

## Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `content` | `string | StyledText` | `""` | The text content to display |
| `fg` | `string | RGBA` | \- | Foreground (text) color |
| `bg` | `string | RGBA` | \- | Background color |
| `attributes` | `TextAttributes` | `0` | Text styling attributes |
| `selectable` | `boolean` | `true` | Whether text can be selected |
| `position` | `"relative" | "absolute"` | `"relative"` | Positioning mode |
| `left`, `top`, `right`, `bottom` | `number | "auto" | "{number}%"` | \- | Position offsets |

## Example: status bar

```
import { Text, Box, t, bold, fg } from "@opentui/core"

const statusBar = Box(
 {
 position: "absolute",
 bottom: 0,
 width: "100%",
 height: 1,
 backgroundColor: "#333333",
 flexDirection: "row",
 justifyContent: "space-between",
 paddingLeft: 1,
 paddingRight: 1,
 },
 Text({
 content: t`${bold("myfile.ts")} - ${fg("#888888")("TypeScript")}`,
 }),
 Text({
 content: t`Ln ${fg("#00FF00")("42")}, Col ${fg("#00FF00")("15")}`,
 }),
)

renderer.root.add(statusBar)
```

---


# Box

> Source: https://opentui.com/docs/components/box

A container component with borders, background colors, and layout capabilities. Use it to create panels, frames, and organized sections.

## Basic usage

### Renderable API

```
import { BoxRenderable, createCliRenderer } from "@opentui/core"

const renderer = await createCliRenderer()

const panel = new BoxRenderable(renderer, {
 id: "panel",
 width: 30,
 height: 10,
 backgroundColor: "#333366",
 borderStyle: "double",
 borderColor: "#FFFFFF",
})

renderer.root.add(panel)
```

### Construct API

```
import { Box, Text, createCliRenderer } from "@opentui/core"

const renderer = await createCliRenderer()

renderer.root.add(
 Box(
 {
 width: 30,
 height: 10,
 backgroundColor: "#333366",
 borderStyle: "rounded",
 },
 Text({ content: "Inside the box!" }),
 ),
)
```

## Border styles

```
// No border
{
 border: false
}

// Simple border (default style)
{
 border: true
}

// Specific border styles
{
 borderStyle: "single"
} // Single line: ┌─┐│└─┘
{
 borderStyle: "double"
} // Double line: ╔═╗║╚═╝
{
 borderStyle: "rounded"
} // Rounded corners: ╭─╮│╰─╯
{
 borderStyle: "heavy"
} // Heavy lines: ┏━┓┃┗━┛
```

## Titles

Add a title to the box border:

```
const panel = new BoxRenderable(renderer, {
 id: "settings",
 width: 40,
 height: 15,
 borderStyle: "rounded",
 title: "Settings",
 titleAlignment: "center",
})
```

### Title alignment

```
{
 titleAlignment: "left"
} // ┌─ Title ────────┐
{
 titleAlignment: "center"
} // ┌──── Title ─────┐
{
 titleAlignment: "right"
} // ┌────────── Title ┐
```

## Layout container

Box works as a flex container for child elements:

```
const container = Box(
 {
 flexDirection: "column",
 justifyContent: "space-between",
 alignItems: "stretch",
 width: 50,
 height: 20,
 padding: 1,
 gap: 1,
 },
 Text({ content: "Header" }),
 Box({ flexGrow: 1, backgroundColor: "#222" }, Text({ content: "Content area" })),
 Text({ content: "Footer" }),
)
```

## Mouse events

Handle mouse interactions on the box:

```
const button = new BoxRenderable(renderer, {
 id: "button",
 width: 12,
 height: 3,
 border: true,
 backgroundColor: "#444",
 onMouseDown: () => {
 console.log("Button clicked!")
 },
 onMouseOver: () => {
 button.backgroundColor = "#666"
 },
 onMouseOut: () => {
 button.backgroundColor = "#444"
 },
})
```

## Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `width` | `number | string` | \- | Width in characters or percentage |
| `height` | `number | string` | \- | Height in rows or percentage |
| `backgroundColor` | `string | RGBA` | \- | Background fill color |
| `border` | `boolean` | `false` | Show border |
| `borderStyle` | `string` | `"single"` | Border style |
| `borderColor` | `string | RGBA` | \- | Border color |
| `title` | `string` | \- | Title text in border |
| `titleAlignment` | `string` | `"left"` | Title position |
| `padding` | `number` | `0` | Internal padding |
| `gap` | `number | string` | \- | Gap between children |
| `flexDirection` | `string` | `"column"` | Child layout direction |
| `justifyContent` | `string` | `"flex-start"` | Main axis alignment |
| `alignItems` | `string` | `"stretch"` | Cross axis alignment |

## Example: Card component

```
import { Box, Text, t, bold, fg } from "@opentui/core"

function Card(props: { title: string; description: string }) {
 return Box(
 {
 width: 40,
 borderStyle: "rounded",
 borderColor: "#666",
 padding: 1,
 margin: 1,
 },
 Text({
 content: t`${bold(fg("#00FFFF")(props.title))}`,
 }),
 Text({
 content: props.description,
 fg: "#AAAAAA",
 }),
 )
}

renderer.root.add(
 Box(
 { flexDirection: "row", flexWrap: "wrap" },
 Card({ title: "Feature 1", description: "Description of feature 1" }),
 Card({ title: "Feature 2", description: "Description of feature 2" }),
 Card({ title: "Feature 3", description: "Description of feature 3" }),
 ),
)
```

---

