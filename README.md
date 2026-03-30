# taskp

A CLI tool that runs skills (task procedures) defined in Markdown — collecting arguments via interactive prompts, then executing them with an LLM or template engine.

[日本語版 README はこちら](README.ja.md)

## Features

- **Skills defined in Markdown** — Human-readable, easy to write, and Git-friendly
- **Two execution modes** — Template rendering (no LLM required) and AI agent execution
- **Multi-action skills** — Group related operations (add/delete/list) into a single skill
- **Multi-provider support** — Anthropic / OpenAI / Google / Ollama
- **Skill hooks** — Run setup/teardown commands before and after skill execution
- **Session ID & output forwarding** — Track executions and pipe results to hooks
- **MCP server** — Usable from AI tools like Claude Code and pi
- **MCP client** — Use external MCP server tools (GitHub, Slack, etc.) in agent mode

## Installation

```bash
bun install -g github:takemo101/taskp
```

To install a specific version:

```bash
bun install -g github:takemo101/taskp#v0.1.7
```

> **Requirements:** Bun >= 1.2.0

If `taskp` is not found after installation, add the Bun global bin directory to your PATH:

```bash
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Update

```bash
bun install -g github:takemo101/taskp
```

### Uninstall

```bash
bun remove -g taskp
```

## Quick Start

### 1. Initialize the project

```bash
taskp setup
```

This creates the `.taskp/` directory with a commented-out `config.toml`. Uncomment the lines you need:

```toml
[ai]
default_provider = "anthropic"
default_model = "claude-sonnet-4-20250514"

[ai.providers.anthropic]
api_key_env = "ANTHROPIC_API_KEY"
```

A JSON Schema and `.taplo.toml` are also generated, enabling autocompletion in editors that support [Taplo](https://taplo.tamasfe.dev/).

For global configuration (shared across projects):

```bash
taskp setup --global
```

### 2. Create a skill

```bash
taskp init deploy
```

This generates `.taskp/skills/deploy/SKILL.md`.

### 3. Edit the skill

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

### 4. Run the skill

```bash
taskp run deploy
# → "Select deployment target" [staging / production]
# → "Branch name?" [main]
# → Commands are executed in order
```

### 5. Run in AI agent mode

Change to `mode: agent` and the LLM will interpret and execute the skill's content.

```bash
taskp run code-review --model anthropic/claude-sonnet-4-20250514
```

### 6. Create a multi-action skill

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

Each action can have its own `mode`, `model`, `inputs`, `tools`, `context`, and `hooks` — mixing template and agent mode within a single skill.

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

### `taskp setup`

Initialize project configuration.

```bash
taskp setup
taskp setup --global
taskp setup --force
```

| Option | Short | Description |
|--------|-------|-------------|
| `--global` | `-g` | Initialize global configuration (`~/.taskp/`) |
| `--force` | `-f` | Overwrite existing files |

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
  - edit
  - grep
  - fetch
context:                # Sources auto-included in context (optional)
  - type: file
    path: "src/{{target}}"
  - type: command
    run: "git diff --cached"
  - type: image
    path: "docs/diagram.png"
hooks:                  # Lifecycle hooks (optional)
  before:
    - "git stash --include-untracked"
  after:
    - "git stash pop || true"
  on_failure:
    - "echo 'Failed: $TASKP_ERROR'"
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

### Agent Tools

In agent mode, the following built-in tools are available:

| Tool | Description |
|------|-------------|
| `bash` | Execute shell commands |
| `read` | Read file contents |
| `write` | Write to files |
| `edit` | Replace a specific string in a file (exact single match required) |
| `grep` | Search file contents for a pattern (regex supported) |
| `fetch` | Fetch text content from a URL (http/https only) |
| `glob` | Find files by glob pattern |
| `ask_user` | Prompt the user for input during execution |
| `taskp_run` | Invoke another template-mode skill |
| `mcp:<server>` | All tools from an MCP server |
| `mcp:<server>/<tool>` | A specific tool from an MCP server |

Specify the tools you need in the `tools` field:

```yaml
tools:
  - bash
  - read
  - grep
  - fetch
```

#### MCP Tools

In agent mode, you can also use tools provided by external MCP servers. Define MCP server connections in `config.toml`, then reference them with the `mcp:` prefix:

```yaml
tools:
  - bash
  - read
  - mcp:github              # All tools from the "github" MCP server
  - mcp:slack/post_message   # Only the "post_message" tool from "slack"
```

```toml
# .taskp/config.toml
[mcp.servers.github]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = { GITHUB_TOKEN = "GITHUB_TOKEN" }
```

#### `taskp_run`

The LLM can invoke other template-mode skills using the `taskp_run` tool:

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

### Image Context

Skills can include images as context for multimodal LLM processing:

```yaml
context:
  - type: image
    path: "docs/architecture.png"
  - type: image
    path: "screenshots/{{target}}.png"    # Variable expansion supported
```

Supported formats: PNG, JPEG, GIF, WebP. The image is sent as binary data directly to the LLM.

## Skill Hooks

Define `before`, `after`, and `on_failure` commands in the `hooks` field to run setup/teardown logic around skill execution.

```yaml
hooks:
  before:
    - "git stash --include-untracked"
  after:
    - "git stash pop || true"
  on_failure:
    - "curl -X POST https://slack.example.com/webhook -d '{\"text\": \"Failed: $TASKP_ERROR\"}'"
```

### Execution Order

```
skill hooks.before → skill body → skill hooks.after → skill hooks.on_failure → global hooks
```

- **`before`** — Blocking. If any command fails, the skill body is skipped (but `after` still runs for cleanup).
- **`after`** — Always runs after the skill body (success or failure). Failures are warnings only.
- **`on_failure`** — Runs only when the skill body or `before` failed. Runs after `after`.

Global hooks defined in `config.toml` run independently after skill hooks. See [Config Spec](docs/CONFIG-SPEC.md#hooks--ライフサイクルフック設定) for details.

Actions can also define their own `hooks`, which completely override the skill-level hooks (no merging).

Hooks are skipped when `--dry-run` is specified.

### Hook Environment Variables

In addition to the [global hook environment variables](docs/CONFIG-SPEC.md#フックに渡される環境変数), skill hooks receive:

| Variable | Description |
|----------|-------------|
| `TASKP_HOOK_PHASE` | Current phase (`before` / `after` / `on_failure`) |
| `TASKP_OUTPUT_FILE` | Absolute path to the output file (see [Output Forwarding](#output-forwarding)) |

## Session ID

Each skill execution is assigned a unique session ID in the format `tskp_<random>` (e.g., `tskp_a1b2c3d4e5f6`).

- Available as the reserved variable `{{__session_id__}}` in skill templates
- Passed to hooks via the `TASKP_SESSION_ID` environment variable
- Included in the agent mode system prompt
- Nested `taskp_run` calls share the parent's session ID

```yaml
---
name: deploy
mode: template
---
```

```markdown
# Deploy (Session: {{__session_id__}})

｀｀｀bash
curl -X POST https://api.example.com/deploy \
  --header "X-Session-Id: {{__session_id__}}"
｀｀｀
```

## Output Forwarding

Skill execution output is written to a temporary file, accessible from hook commands via `$TASKP_OUTPUT_FILE`.

- **Template mode**: stdout from all commands, concatenated with newlines
- **Agent mode**: final LLM text output

```bash
# after hook: save output to a log file
cp "$TASKP_OUTPUT_FILE" "logs/${TASKP_SKILL_REF}_$(date +%Y%m%d).txt"

# after hook: feed output into another skill
taskp run summarize --set content="$(cat $TASKP_OUTPUT_FILE)"
```

The output file is created before execution and cleaned up (directory deleted) after all hooks complete.

For full details, see [Skill Spec — Output Forwarding](docs/SKILL-SPEC.md#出力フォワーディング).

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

## Using MCP Tools (Client)

taskp can connect to external MCP servers as a client, allowing LLMs to use tools like GitHub, Slack, and other APIs during agent execution. See [MCP Client Spec](docs/MCP-SPEC.md) for details.

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
- [Config Spec](docs/CONFIG-SPEC.md)
- [MCP Client Spec](docs/MCP-SPEC.md)

## License

MIT
