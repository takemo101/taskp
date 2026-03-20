# taskp

A CLI tool that runs skills (task procedures) defined in Markdown — collecting arguments via interactive prompts, then executing them with an LLM or template engine.

[日本語版 README はこちら](README.ja.md)

## Features

- **Skills defined in Markdown** — Human-readable, easy to write, and Git-friendly
- **Two execution modes** — Template rendering (no LLM required) and AI agent execution
- **Multi-provider support** — Anthropic / OpenAI / Google / Ollama
- **MCP server** — Usable from AI tools like Claude Code and pi

## Installation

```bash
bun add -g github:takemo101/taskp
```

> **Requirements:** Bun >= 1.2.0

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

## Commands

### `taskp run <skill>`

Run a skill.

```bash
taskp run deploy
taskp run deploy --model ollama/qwen2.5-coder:32b
taskp run deploy --dry-run
taskp run deploy --set environment=production --set branch=main
taskp run deploy --no-input
```

| Option | Short | Description |
|--------|-------|-------------|
| `--model` | `-m` | LLM model to use |
| `--provider` | `-p` | LLM provider |
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
```

### `taskp show <skill>`

Show skill details.

```bash
taskp show deploy
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
model: anthropic/claude-sonnet-4-20250514  # For agent mode (optional)
tools:                  # Tools for agent mode (optional)
  - bash
  - read
  - write
context:                # Sources auto-included in context (optional)
  - type: file
    path: "src/{{target}}"
  - type: command
    run: "git diff --cached"
---
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
