# Input

> Source: https://opentui.com/docs/components/input

Text input field with cursor, placeholder text, and focus states. Focus the input to receive keyboard input.

## Basic usage

### Renderable api

```
import { InputRenderable, InputRenderableEvents, createCliRenderer } from "@opentui/core"

const renderer = await createCliRenderer()

const input = new InputRenderable(renderer, {
 id: "name-input",
 width: 25,
 placeholder: "Enter your name...",
})

input.on(InputRenderableEvents.CHANGE, (value) => {
 console.log("Input value:", value)
})

input.focus()
renderer.root.add(input)
```

### Construct api

```
import { Input, createCliRenderer } from "@opentui/core"

const renderer = await createCliRenderer()

const input = Input({
 placeholder: "Enter your name...",
 width: 25,
})

input.focus()
renderer.root.add(input)
```

## Focus states

The input changes appearance when focused:

```
const input = new InputRenderable(renderer, {
 id: "styled-input",
 width: 30,
 placeholder: "Type here...",
 backgroundColor: "#1a1a1a",
 focusedBackgroundColor: "#2a2a2a",
 textColor: "#FFFFFF",
 cursorColor: "#00FF00",
})
```

## Events

### Input event

Fires on every keystroke as the value changes:

```
import { InputRenderableEvents } from "@opentui/core"

input.on(InputRenderableEvents.INPUT, (value: string) => {
 console.log("Current value:", value)
})
```

### Change event

Fires when the input loses focus (blur) or when you press Enter, but only if the value changed since focus:

```
input.on(InputRenderableEvents.CHANGE, (value: string) => {
 console.log("Value committed:", value)
})
```

### Enter event

Fires when the user presses Enter/Return:

```
input.on(InputRenderableEvents.ENTER, (value: string) => {
 console.log("Submitted value:", value)
})
```

### Getting the current value

```
const currentValue = input.value
```

### Setting the value

```
input.value = "New value"
```

## Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `width` | `number` | \- | Input field width |
| `value` | `string` | `""` | Initial text value |
| `placeholder` | `string` | `""` | Placeholder text when empty |
| `maxLength` | `number` | `1000` | Maximum number of characters |
| `backgroundColor` | `string | RGBA` | \- | Background when unfocused |
| `focusedBackgroundColor` | `string | RGBA` | \- | Background when focused |
| `textColor` | `string | RGBA` | \- | Text color |
| `cursorColor` | `string | RGBA` | \- | Cursor color |
| `position` | `"static" | "relative" | "absolute"` | `"relative"` | Positioning mode |

## Example: Login form

```
import { Box, Text, Input, delegate, createCliRenderer } from "@opentui/core"

const renderer = await createCliRenderer()

function LabeledInput(props: { id: string; label: string; placeholder: string }) {
 return delegate(
 { focus: `${props.id}-input` },
 Box(
 { flexDirection: "row", marginBottom: 1 },
 Text({ content: props.label.padEnd(12), fg: "#888888" }),
 Input({
 id: `${props.id}-input`,
 placeholder: props.placeholder,
 width: 20,
 backgroundColor: "#222",
 focusedBackgroundColor: "#333",
 textColor: "#FFF",
 cursorColor: "#0F0",
 }),
 ),
 )
}

const usernameInput = LabeledInput({
 id: "username",
 label: "Username:",
 placeholder: "Enter username",
})

const passwordInput = LabeledInput({
 id: "password",
 label: "Password:",
 placeholder: "Enter password",
})

const form = Box(
 {
 width: 40,
 borderStyle: "rounded",
 title: "Login",
 padding: 1,
 },
 usernameInput,
 passwordInput,
)

// Focus the username input
usernameInput.focus()

renderer.root.add(form)
```

## Tab navigation

Add tab navigation between inputs:

```
const inputs = [usernameInput, passwordInput]
let focusIndex = 0

renderer.keyInput.on("keypress", (key) => {
 if (key.name === "tab") {
 focusIndex = (focusIndex + 1) % inputs.length
 inputs[focusIndex].focus()
 }
})
```

---


# Textarea

> Source: https://opentui.com/docs/components/textarea

`width``number` or `string`\-Width in characters or percentage`height``number` or `string`\-Height in rows or percentage`initialValue``string``""`Initial text content`placeholder``string`, `StyledText`, or `null``null`Placeholder content`placeholderColor``string` or `RGBA``#666666`Placeholder color`backgroundColor``string` or `RGBA`transparentBackground when unfocused`textColor``string` or `RGBA``#FFFFFF`Text color when unfocused`focusedBackgroundColor``string` or `RGBA`transparentBackground when focused`focusedTextColor``string` or `RGBA``#FFFFFF`Text color when focused`wrapMode``"none"`, `"char"`, or `"word"``"word"`Line wrapping mode`selectionBg``string` or `RGBA`\-Selection background`selectionFg``string` or `RGBA`\-Selection foreground`cursorColor``string` or `RGBA``#FFFFFF`Cursor color`cursorStyle``CursorStyleOptions`\-Cursor style and blinking`keyBindings``KeyBinding[]`\-Custom keybindings`keyAliasMap``KeyAliasMap`\-Key alias mapping`onSubmit``(event: SubmitEvent) => void`\-Submit handler`onContentChange``(event: ContentChangeEvent) => void`\-Fired on content changes`onCursorChange``(event: CursorChangeEvent) => void`\-Fired on cursor movement

---


# Select

> Source: https://opentui.com/docs/components/select

`width``number`\-Component width`height``number`\-Component height`options``SelectOption[]``[]`Available options`selectedIndex``number``0`Initially selected index`backgroundColor``string | RGBA``transparent`Background color`textColor``string | RGBA``#FFFFFF`Normal text color`focusedBackgroundColor``string | RGBA``#1a1a1a`Background when focused`focusedTextColor``string | RGBA``#FFFFFF`Text color when focused`selectedBackgroundColor``string | RGBA``#334455`Selected item background`selectedTextColor``string | RGBA``#FFFF00`Selected item text color`descriptionColor``string | RGBA``#888888`Description text color`selectedDescriptionColor``string | RGBA``#CCCCCC`Selected item description color`showDescription``boolean``true`Show option descriptions`showScrollIndicator``boolean``false`Show scroll position indicator`wrapSelection``boolean``false`Wrap selection at list boundaries`itemSpacing``number``0`Spacing between items`fastScrollStep``number``5`Items to skip with Shift+Up/Down

---


# TabSelect

> Source: https://opentui.com/docs/components/tab-select

Horizontal tab-based selection component with descriptions and scroll support. The component must be focused to receive keyboard input.

## Basic Usage

### Renderable API

```
import { TabSelectRenderable, TabSelectRenderableEvents, createCliRenderer } from "@opentui/core"

const renderer = await createCliRenderer()

const tabs = new TabSelectRenderable(renderer, {
 id: "tabs",
 width: 60,
 options: [
 { name: "Home", description: "Dashboard and overview" },
 { name: "Files", description: "File management" },
 { name: "Settings", description: "Application settings" },
 ],
 tabWidth: 20,
})

tabs.on(TabSelectRenderableEvents.ITEM_SELECTED, (index, option) => {
 console.log("Tab selected:", option.name)
})

tabs.focus()
renderer.root.add(tabs)
```

### Construct API

```
import { TabSelect, createCliRenderer } from "@opentui/core"

const renderer = await createCliRenderer()

const tabs = TabSelect({
 width: 60,
 tabWidth: 15,
 options: [
 { name: "Tab 1", description: "First tab" },
 { name: "Tab 2", description: "Second tab" },
 { name: "Tab 3", description: "Third tab" },
 ],
})

tabs.focus()
renderer.root.add(tabs)
```

## Keyboard Navigation

When focused, the tab select responds to these keys:

| Key | Action |
| --- | --- |
| `Left` / `[` | Move to previous tab |
| `Right` / `]` | Move to next tab |
| `Enter` | Select current tab |

## Events

### Item Selected

Emitted when the user presses Enter on a tab:

```
import { TabSelectRenderableEvents, type TabSelectOption } from "@opentui/core"

tabs.on(TabSelectRenderableEvents.ITEM_SELECTED, (index: number, option: TabSelectOption) => {
 console.log(`Selected tab ${index}: ${option.name}`)
 // Switch to the corresponding panel
})
```

### Selection Changed

Emitted when the highlighted tab changes:

```
import { TabSelectRenderableEvents, type TabSelectOption } from "@opentui/core"

tabs.on(TabSelectRenderableEvents.SELECTION_CHANGED, (index: number, option: TabSelectOption) => {
 console.log(`Hovering: ${option.name}`)
})
```

## Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `width` | `number` | \- | Total component width |
| `options` | `TabSelectOption[]` | `[]` | Available tabs |
| `tabWidth` | `number` | `20` | Width of each tab |
| `backgroundColor` | `string | RGBA` | `transparent` | Background color |
| `textColor` | `string | RGBA` | `#FFFFFF` | Normal tab text |
| `focusedBackgroundColor` | `string | RGBA` | `#1a1a1a` | Background color when focused |
| `focusedTextColor` | `string | RGBA` | `#FFFFFF` | Text color when focused |
| `selectedBackgroundColor` | `string | RGBA` | `#334455` | Selected tab background |
| `selectedTextColor` | `string | RGBA` | `#FFFF00` | Selected tab text |
| `selectedDescriptionColor` | `string | RGBA` | `#CCCCCC` | Description text color |
| `showScrollArrows` | `boolean` | `true` | Show scroll indicators |
| `showDescription` | `boolean` | `true` | Show tab descriptions |
| `showUnderline` | `boolean` | `true` | Show underline on selected tab |
| `wrapSelection` | `boolean` | `false` | Wrap around when navigating |
| `keyBindings` | `TabSelectKeyBinding[]` | \- | Custom key bindings |
| `keyAliasMap` | `KeyAliasMap` | \- | Key alias mappings |

## Example: Tabbed Interface

```
import { Box, Text, TabSelect, createCliRenderer } from "@opentui/core"

const renderer = await createCliRenderer()

// Create content panels
const panels = {
 home: Box({ padding: 1 }, Text({ content: "Home content here" })),
 files: Box({ padding: 1 }, Text({ content: "File browser here" })),
 settings: Box({ padding: 1 }, Text({ content: "Settings form here" })),
}

// Create the tabbed container
const container = Box({
 width: 60,
 height: 20,
 borderStyle: "rounded",
})

const tabs = TabSelect({
 width: 60,
 tabWidth: 20,
 options: [
 { name: "Home", description: "Dashboard" },
 { name: "Files", description: "Browse files" },
 { name: "Settings", description: "Preferences" },
 ],
})

// Content area
let currentPanel = panels.home
const contentArea = Box({
 flexGrow: 1,
 padding: 1,
})
contentArea.add(currentPanel)

// Handle tab changes
tabs.on("itemSelected", (index, option) => {
 // Remove current panel
 if (currentPanel) {
 contentArea.remove(currentPanel.id)
 }
 // Add new panel based on selection
 switch (option.name) {
 case "Home":
 currentPanel = panels.home
 break
 case "Files":
 currentPanel = panels.files
 break
 case "Settings":
 currentPanel = panels.settings
 break
 }
 contentArea.add(currentPanel)
})

container.add(tabs)
container.add(contentArea)

tabs.focus()
renderer.root.add(container)
```

## Programmatic Control

```
// Get current tab index
const currentIndex = tabs.getSelectedIndex()

// Set tab programmatically
tabs.setSelectedIndex(1)

// Update tabs dynamically
tabs.setOptions([
 { name: "New Tab 1", description: "Updated" },
 { name: "New Tab 2", description: "Also updated" },
])
```

When there are more tabs than fit in the width, the component automatically handles horizontal scrolling as you navigate with the keyboard.

---

