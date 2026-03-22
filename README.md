# taskp

A CLI tool that runs skills (task procedures) defined in Markdown — collecting arguments via interactive prompts, then executing them with an LLM or template engine.

[日本語版 README はこちら](README.ja.md)

## Features

- **Skills defined in Markdown** — Human-readable, easy to write, and Git-friendly
- **Two execution modes** — Template rendering (no LLM required) and AI agent execution
- **Multi-action skills** — Group related operations (add/delete/list) into a single skill
- **Multi-provider support** — Anthropic / OpenAI / Google / Ollama
- **MCP server** — Usable from AI tools like Claude Code and pi

## Installation

```bash
bun add -g github:takemo101/taskp
```

> **Requirements:** Bun >= 1.2.0

If `taskp` is not found after installation, add the Bun global bin directory to your PATH:

```bash
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Update

```bash
bun add -g github:takemo101/taskp
```

### Uninstall

```bash
bun remove -g taskp
```

## Quick Start

### 1. Create a skill

```bash
taskp init deploy
```

This generates `.taskp/skills/deploy/SKILL.md`.

### 2. Edit the skill

```markdown
---
name: deploy
description: Deploy the application
mode: template
inputs:
  - name: environment
    type: select
    message: "Select deployment target"
    choices: [staging, production]
  - name: branch
    type: text
    message: "Branch name?"
    default: main
---

# Deploy

Deploying branch {{branch}} to the {{environment}} environment.

## Steps

\`\`\`bash
git checkout {{branch}}
git pull origin {{branch}}
npm run build
npm run deploy:{{environment}}
\`\`\`
```

### 3. Run the skill

```bash
taskp run deploy
# → "Select deployment target" [staging / production]
# → "Branch name?" [main]
# → Commands are executed in order
```

### 4. Run in AI agent mode

Change to `mode: agent` and the LLM will interpret and execute the skill's content.

```bash
taskp run code-review --model anthropic/claude-sonnet-4-20250514
```

### 5. Create a multi-action skill

Group related operations into a single skill with `actions`:

```markdown
---
name: task
description: Manage tasks
mode: template
actions:
  add:
    description: Add a task
    inputs:
      - name: title
        type: text
        message: "Task title?"
  list:
    description: List tasks
  delete:
    description: Delete a task
    mode: agent
    tools: [bash]
    inputs:
      - name: id
        type: text
        message: "Task ID?"
---

# Task Management

## action:add

｀｀｀bash
echo "Adding task: {{title}}"
｀｀｀

## action:list

｀｀｀bash
echo "Listing tasks..."
｀｀｀

## action:delete

Find and delete task {{id}}, confirming with the user first.
```

```bash
taskp run task:add                 # Run a specific action
taskp run task:add --set title="Buy milk"
taskp tui                          # Select actions interactively
```

Each action can have its own `mode`, `model`, `inputs`, `tools`, and `context` — mixing template and agent mode within a single skill.

## Commands

### `taskp run <skill>`

Run a skill.

```bash
taskp run deploy
taskp run deploy --model ollama/qwen2.5-coder:32b
taskp run deploy --dry-run
taskp run deploy --set environment=production --set branch=main
taskp run deploy --no-input
taskp run task:add               # Run a specific action
```

| Option | Short | Description |
|--------|-------|-------------|
| `--model` | `-m` | LLM model (`provider/model` format supported) |
| `--dry-run` | | Show execution plan without running |
| `--force` | `-f` | Continue on error (template mode) |
| `--verbose` | `-v` | Show detailed logs |
| `--no-input` | | Disable interactive prompts (use defaults) |
| `--set` | `-s` | Set variables directly (`--set key=value`) |

### `taskp list`

List available skills.

```bash
taskp list
taskp list --global
taskp list --local
```

### `taskp init <name>`

Generate a skill scaffold.

```bash
taskp init my-task
taskp init my-task --global
taskp init my-task --mode agent
taskp init my-task --actions add,delete,list
```

### `taskp show <skill>`

Show skill details.

```bash
taskp show deploy
taskp show task:add              # Show action details
```

### `taskp tui`

Launch the interactive TUI.

```bash
taskp tui
```

Select skills with fzf-style fuzzy search, fill in parameters, and execute.
Agent mode results are streamed as rendered Markdown.

#### Key Bindings

| Screen | Key | Action |
|--------|-----|--------|
| Skill selector | ↑↓ | Navigate |
| Skill selector | Enter | Select |
| Skill selector | Esc | Quit |
| Input form | Tab / Shift+Tab | Next / previous input |
| Input form | Enter | Confirm value |
| Input form | Esc | Back |
| Execution done | Enter | Return to skill selector |
| Execution done | Esc | Quit |

<!-- TODO: Add screenshots -->

### `taskp serve`

Start as an MCP server (see [Using as an MCP Server](#using-as-an-mcp-server) for details).

## Creating Skills

Skills are defined as Markdown files named `SKILL.md`.

### File Structure

```
<skill-name>/
└── SKILL.md
```

### Locations

| Location | Scope | Use Case |
|----------|-------|----------|
| `.taskp/skills/<name>/SKILL.md` | Project-local | Project-specific tasks |
| `~/.taskp/skills/<name>/SKILL.md` | Global | Personal tasks shared across projects |

Project-local skills take priority.

### Frontmatter

```yaml
---
name: my-skill          # Skill name
description: About this  # Shown in list command
mode: template          # template | agent
inputs:                 # Input definitions
  - name: target
    type: text
    message: "Target?"
model: anthropic/claude-sonnet-4-20250514  # For agent mode (provider/model format)
tools:                  # Tools for agent mode (optional)
  - bash
  - read
  - write
context:                # Sources auto-included in context (optional)
  - type: file
    path: "src/{{target}}"
  - type: command
    run: "git diff --cached"
actions:                # Multi-action definitions (optional)
  build:
    description: Build the project
    inputs:
      - name: target
        type: text
        message: "Build target?"
  test:
    description: Run tests
    mode: agent
    tools: [bash, read]
---
```

### Actions

A skill can define multiple actions via the `actions` field. Each action can override `mode`, `model`, `inputs`, `tools`, `context`, and `timeout` — unspecified fields inherit from the skill level.

When `actions` is defined, the skill-level `inputs` is ignored.

Action bodies are defined in the Markdown body using `## action:<name>` sections:

```markdown
## action:build

｀｀｀bash
npm run build --target={{target}}
｀｀｀

## action:test

Analyze test coverage and suggest improvements.
```

Run actions with colon syntax:

```bash
taskp run my-skill:build
taskp run my-skill:test --model anthropic/claude-sonnet-4-20250514
```

### Input Types

| Type | UI | Return Type |
|------|-----|------------|
| `text` | Free text input | `string` |
| `textarea` | Multi-line input (confirm with Meta+Enter) | `string` |
| `select` | Choose from options | `string` |
| `confirm` | Yes/No | `boolean` |
| `number` | Numeric input | `number` |
| `password` | Masked input | `string` |

### Variable Expansion

Use `{{variable_name}}` in the body to expand input values.

### Built-in Tool: `taskp_run`

In agent mode, the LLM can invoke other template-mode skills using the `taskp_run` tool:

```yaml
---
name: diagnose
mode: agent
tools:
  - bash
  - read
  - taskp_run    # Enable cross-skill invocation
---
```

Constraints:
- Only template-mode skills can be called (no agent nesting)
- Recursive calls are detected and blocked
- Maximum nesting depth: 3

## Custom System Prompt

You can customize the system prompt used in agent mode by placing a `SYSTEM.md` file.

| Location | Scope |
|----------|-------|
| `.taskp/SYSTEM.md` | Project-local (takes priority) |
| `~/.taskp/SYSTEM.md` | Global |

When `SYSTEM.md` exists, its content replaces the default system prompt. The available tools list and environment information are automatically appended.

When no `SYSTEM.md` is found (or the file is empty), the built-in default system prompt is used.

For details, see [Skill Spec — Custom System Prompt](docs/SKILL-SPEC.md#カスタムシステムプロンプトsystemmd).

## Configuration

Configuration is written in TOML format. Project settings take priority over global settings.

### Global config `~/.taskp/config.toml`

```toml
[ai]
default_provider = "anthropic"
default_model = "claude-sonnet-4-20250514"

[ai.providers.anthropic]
api_key_env = "ANTHROPIC_API_KEY"

[ai.providers.openai]
api_key_env = "OPENAI_API_KEY"

[ai.providers.ollama]
base_url = "http://localhost:11434/v1"
default_model = "qwen2.5-coder:32b"
```

### Project config `.taskp/config.toml`

```toml
[ai]
default_provider = "ollama"
default_model = "qwen2.5-coder:14b"
```

## Using as an MCP Server

taskp can run as an MCP (Model Context Protocol) server, making it accessible from AI tools like Claude Code and pi.

```bash
taskp serve
```

Exposed tools:

- `taskp_run` — Run a skill
- `taskp_list` — List available skills
- `taskp_init` — Generate a skill scaffold
- `taskp_show` — Show skill details

## Documentation

See the `docs/` directory for detailed specifications.

- [Concept](docs/CONCEPT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Skill Spec](docs/SKILL-SPEC.md)
- [CLI Spec](docs/CLI-SPEC.md)
- [AI Integration Spec](docs/AI-SPEC.md)

## License

MIT
