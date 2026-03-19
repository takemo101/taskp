# Renderables

> Source: https://opentui.com/docs/core-concepts/renderables

Renderables are the building blocks of your UI. You can position, style, and nest them within each other. Each renderable represents a visual element and uses the Yoga layout engine for flexible positioning and sizing.

## Creating Renderables

Create a renderable by instantiating a class with a render context (the renderer) and options:

```
import { createCliRenderer, TextRenderable, BoxRenderable } from "@opentui/core"

const renderer = await createCliRenderer()

const greeting = new TextRenderable(renderer, {
 id: "greeting",
 content: "Hello, OpenTUI!",
 fg: "#00FF00",
})

renderer.root.add(greeting)
```

## Available Renderables

OpenTUI provides these built-in renderables:

| Class | Description |
| --- | --- |
| `BoxRenderable` | Container with border, background, and layout |
| `TextRenderable` | Read-only styled text display |
| `InputRenderable` | Single-line text input |
| `TextareaRenderable` | Multi-line editable text |
| `SelectRenderable` | Dropdown/list selection |
| `TabSelectRenderable` | Horizontal tab selection |
| `ScrollBoxRenderable` | Scrollable container |
| `ScrollBarRenderable` | Standalone scroll bar control |
| `CodeRenderable` | Syntax-highlighted code display |
| `LineNumberRenderable` | Line number gutter for code/text views |
| `DiffRenderable` | Unified or split diff viewer |
| `ASCIIFontRenderable` | ASCII art font display |
| `FrameBufferRenderable` | Raw framebuffer for custom graphics |
| `MarkdownRenderable` | Markdown renderer |
| `SliderRenderable` | Numeric slider control |

## The Renderable Tree

Renderables form a tree structure. Use `add()` and `remove()` to manage children:

```
const container = new BoxRenderable(renderer, {
 id: "container",
 flexDirection: "column",
 padding: 1,
})

const title = new TextRenderable(renderer, { id: "title", content: "My App" })
const body = new TextRenderable(renderer, { id: "body", content: "Content here" })

container.add(title)
container.add(body)

renderer.root.add(container)

// Later, remove a child
container.remove("body")
```

## Finding Renderables

Navigate the tree to find specific renderables:

```
// Get a direct child by ID
const title = container.getRenderable("title")

// Recursively search all descendants
const deepChild = container.findDescendantById("nested-input")

// Get all children
const children = container.getChildren()
```

## Layout Properties

All renderables support Yoga flexbox properties:

```
const panel = new BoxRenderable(renderer, {
 id: "panel",

 // Sizing
 width: 40,
 height: "50%",
 minWidth: 20,
 maxHeight: 30,

 // Flex behavior
 flexGrow: 1,
 flexShrink: 0,
 flexDirection: "column",
 justifyContent: "center",
 alignItems: "flex-start",

 // Positioning
 position: "absolute",
 left: 10,
 top: 5,

 // Spacing
 padding: 2,
 paddingTop: 1,
 margin: 1,
})
```

See the [Layout](https://opentui.com/docs/core-concepts/layout) page for complete details.

## Focus Management

Interactive renderables can receive keyboard focus:

```
const input = new InputRenderable(renderer, {
 id: "username",
 placeholder: "Enter username...",
})

renderer.root.add(input)

// Give focus to the input
input.focus()

// Remove focus
input.blur()

// Check focus state
console.log(input.focused) // true
```

By default, left-clicking a renderable will auto-focus the closest focusable ancestor. Disable this globally with `createCliRenderer({ autoFocus: false })`, or stop it per interaction by calling `event.preventDefault()` in `onMouseDown`.

Listen for focus changes:

```
import { RenderableEvents } from "@opentui/core"

input.on(RenderableEvents.FOCUSED, () => {
 console.log("Input focused")
})

input.on(RenderableEvents.BLURRED, () => {
 console.log("Input blurred")
})
```

## Event Handling

### Mouse Events

Handle mouse interactions via options:

```
const button = new BoxRenderable(renderer, {
 id: "button",
 border: true,
 onMouseDown: (event) => {
 console.log("Clicked at", event.x, event.y)
 },
 onMouseOver: (event) => {
 button.borderColor = "#FFFF00"
 },
 onMouseOut: (event) => {
 button.borderColor = "#FFFFFF"
 },
})
```

Available mouse events:

* `onMouseDown`, `onMouseUp`
* `onMouseMove`, `onMouseDrag`, `onMouseDragEnd`, `onMouseDrop`
* `onMouseOver`, `onMouseOut`
* `onMouseScroll`
* `onMouse` (catch-all)

Mouse events bubble up through the tree. Stop propagation with `event.stopPropagation()`.

### Keyboard Events

For focusable renderables:

```
const input = new InputRenderable(renderer, {
 id: "input",
 onKeyDown: (key) => {
 if (key.name === "escape") {
 input.blur()
 }
 },
 onPaste: (event) => {
 console.log("Pasted:", event.text)
 },
})
```

## Visibility

Control visibility with the `visible` property:

```
// Hide (also removes from layout)
panel.visible = false

// Show
panel.visible = true
```

When `visible` is `false`, Yoga excludes the renderable from layout calculation (equivalent to CSS `display: none`).

## Opacity

Set opacity for semi-transparent rendering:

```
panel.opacity = 0.5 // 50% transparent
```

Opacity affects the renderable and all its children.

## Z-Index

Control layering order for overlapping elements:

```
const overlay = new BoxRenderable(renderer, {
 id: "overlay",
 position: "absolute",
 zIndex: 100, // Higher values render on top
})
```

## Live Rendering

For animations, extend the Renderable class and override `onUpdate`:

```
class AnimatedBox extends BoxRenderable {
 onUpdate(deltaTime) {
 // Update animation state
 this.translateX += 1
 }
}

const box = new AnimatedBox(renderer, {
 id: "anim-box",
 live: true, // Enable continuous rendering
})
```

## Translation

Offset a renderable from its layout position (useful for scrolling/animation):

```
// Offset by pixels
renderable.translateX = 10
renderable.translateY = -5
```

This moves the renderable visually without affecting layout.

## Buffered Rendering

Enable offscreen rendering for complex content and use hooks to draw to the buffer:

```
import { RGBA } from "@opentui/core"

const complex = new BoxRenderable(renderer, {
 id: "complex",
 buffered: true, // Render to offscreen buffer first
 renderAfter: (buffer) => {
 // Draw directly to the buffer (or offscreen buffer if buffered=true)
 buffer.fillRect(0, 0, 10, 5, RGBA.fromHex("#FF0000"))
 },
})
```

## Lifecycle Methods

Override these methods in custom renderables:

```
class CustomRenderable extends Renderable {
 // Called each frame before rendering
 onUpdate(deltaTime: number) {
 // Update state, animations, etc.
 }

 // Called when dimensions change
 onResize(width: number, height: number) {
 // Respond to size changes
 }

 // Called when removed from parent
 onRemove() {
 // Cleanup
 }

 // Override for custom rendering
 renderSelf(buffer: OptimizedBuffer, deltaTime: number) {
 // Draw to buffer
 }
}
```

## Destroying Renderables

Clean up a renderable and remove it from the tree:

```
// Remove from parent and free resources
renderable.destroy()

// Destroy self and all children
container.destroyRecursively()
```

---


# Renderables vs Constructs

> Source: https://opentui.com/docs/core-concepts/renderables-vs-constructs

OpenTUI provides two ways to build your UI: the imperative Renderable API and the declarative Construct API. Both approaches have different tradeoffs.

## Imperative (Renderables)

You create `Renderable` instances with a `RenderContext` and compose them using `add()`. You mutate state and behavior directly on instances through setters and methods.

```
import { BoxRenderable, TextRenderable, InputRenderable, createCliRenderer, type RenderContext } from "@opentui/core"

const renderer = await createCliRenderer()

const loginForm = new BoxRenderable(renderer, {
 id: "login-form",
 width: 40,
 height: 10,
 padding: 1,
})

// Compose multiple renderables into one
function createLabeledInput(renderer: RenderContext, props: { label: string; placeholder: string; id: string }) {
 const container = new BoxRenderable(renderer, {
 id: `${props.id}-container`,
 flexDirection: "row",
 })

 container.add(
 new TextRenderable(renderer, {
 id: `${props.id}-label`,
 content: props.label + " ",
 }),
 )

 container.add(
 new InputRenderable(renderer, {
 id: `${props.id}-input`,
 placeholder: props.placeholder,
 width: 20,
 }),
 )

 return container
}

const username = createLabeledInput(renderer, {
 id: "username",
 label: "Username:",
 placeholder: "Enter username...",
})
loginForm.add(username)

// You must navigate to the nested component to focus it
username.getRenderable("username-input")?.focus()

renderer.root.add(loginForm)
```

### Characteristics

* Requires `RenderContext` at creation time
* Direct mutation of instances
* Manual navigation for nested component access
* Explicit control over component lifecycle

## Declarative (Constructs)

Builds a lightweight VNode graph using functional constructs. Instances don’t exist until you add the node to the tree. VNodes queue method calls and replay them when instantiated.

```
import { Text, Input, Box, createCliRenderer, delegate } from "@opentui/core"

const renderer = await createCliRenderer()

function LabeledInput(props: { id: string; label: string; placeholder: string }) {
 return delegate(
 { focus: `${props.id}-input` },
 Box(
 { flexDirection: "row" },
 Text({ content: props.label + " " }),
 Input({
 id: `${props.id}-input`,
 placeholder: props.placeholder,
 width: 20,
 }),
 ),
 )
}

const usernameInput = LabeledInput({
 id: "username",
 label: "Username:",
 placeholder: "Enter username...",
})

// delegate() automatically routes focus to the nested input
usernameInput.focus()

const loginForm = Box(
 { width: 40, height: 10, padding: 1 },
 usernameInput,
 LabeledInput({
 id: "password",
 label: "Password:",
 placeholder: "Enter password...",
 }),
)

renderer.root.add(loginForm)
```

### Characteristics

* No `RenderContext` needed until instantiation
* VNodes queue method calls
* `delegate()` routes APIs to nested components
* Declarative, React-like syntax

## The delegate() function

The `delegate()` function makes constructs ergonomic by routing method calls from the parent to specific children:

```
function Button(props: { id: string; label: string; onClick: () => void }) {
 return delegate(
 {
 focus: `${props.id}-box`, // Route focus() to the box
 },
 Box(
 {
 id: `${props.id}-box`,
 border: true,
 onMouseDown: props.onClick,
 },
 Text({ content: props.label }),
 ),
 )
}

const button = Button({ id: "submit", label: "Submit", onClick: handleSubmit })
button.focus() // Focuses the inner Box
```

## When to use which

### Use Renderables when

* You need fine-grained control over component lifecycle
* You’re building low-level custom components
* You need to access renderable methods immediately
* Performance is critical and you want to avoid VNode overhead

### Use Constructs when

* You prefer declarative, compositional code
* You’re building higher-level UI components
* You want cleaner, more readable component definitions
* You’re familiar with React/Solid patterns

## Mixing both

You can mix both approaches in the same application:

```
import { BoxRenderable, Text, Input } from "@opentui/core"

// Create a renderable container
const container = new BoxRenderable(renderer, {
 id: "container",
 flexDirection: "column",
})

// Add constructs to it
container.add(Text({ content: "Title" }), Input({ placeholder: "Type here..." }))

renderer.root.add(container)
```

---

