---
url: https://ai-sdk.dev/docs/agents
title: "Getting Started: Coding Agents"
description: "Learn how to set up the AI SDK for use with coding agents, including installing skills, accessing bundled docs, and using DevTools."
hash: "46b93c6197e4c7eb2996d1e0dc10c9976c4c93704d4200d7ae24786a28e6481c"
crawledAt: 2026-03-07T07:58:41.744Z
depth: 2
---

Coding Agents

## [Getting Started with Coding Agents](#getting-started-with-coding-agents)

This page explains how to get the most out of the AI SDK when working inside a coding agent (such as Claude Code, Codex, OpenCode, Cursor, or any other AI-assisted development environment).

## [Install the AI SDK Skill](#install-the-ai-sdk-skill)

The fastest way to give your coding agent deep knowledge of the AI SDK is to install the official AI SDK skill. Skills are lightweight markdown files that load specialized instructions into your agent's context on demand — so your agent knows exactly how to use the SDK without you needing to explain it.

Install the AI SDK skill using `npx skills add`:

```
1npx skills add vercel/ai
```

This installs the skill into your agent's specific skills directory (e.g., `.claude/skills`, `.codex/skills`). If you select more than one agent, the CLI creates symlinks so each agent can discover the skill. Use `-a` to specify agents directly — for example, `-a amp` installs into the universal `.agents/skills` directory. Use `-y` for non-interactive installation.

Once installed, any agent that supports the [Agent Skills](https://agentskills.io/) format will automatically discover and load the skill when working on AI SDK tasks.

Agent Skills use **progressive disclosure**: your agent loads only the skill's name and description at startup. The full instructions are only pulled into context when the task calls for it, keeping your agent fast and focused.

## [Docs and Source Code in `node_modules`](#docs-and-source-code-in-node_modules)

Once you've installed the `ai` package, you already have the full AI SDK documentation and source code available locally inside `node_modules`. Your coding agent can read these directly — no internet access required.

Install the `ai` package if you haven't already:

pnpm add ai

After installation, your agent can reference the bundled source code and documentation at paths like:

```
1node_modules/ai/src/ # Full source code organized by module2node_modules/ai/docs/ # Official documentation with examples
```

This means your agent can look up accurate API signatures, implementations, and usage examples directly from the installed package — ensuring it always uses the version of the SDK that's actually installed in your project.

## [Install DevTools](#install-devtools)

AI SDK DevTools gives you full visibility into your AI SDK calls during development. It captures LLM requests, responses, tool calls, token usage, and multi-step interactions, and displays them in a local web UI.

AI SDK DevTools is experimental and intended for local development only. Do not use in production environments.

Install the DevTools package:

pnpm add @ai-sdk/devtools

### [Add the middleware](#add-the-middleware)

Wrap your language model with the DevTools middleware using [`wrapLanguageModel`](https://ai-sdk.dev/docs/ai-sdk-core/middleware):

```
1import { wrapLanguageModel, gateway } from 'ai';2import { devToolsMiddleware } from '@ai-sdk/devtools';3
4const model = wrapLanguageModel({5 model: gateway('anthropic/claude-sonnet-4.5'),6 middleware: devToolsMiddleware(),7});
```

Use the wrapped model with any AI SDK Core function:

```
1import { generateText } from 'ai';2
3const result = await generateText({4 model, // wrapped model with DevTools middleware5 prompt: 'What cities are in the United States?',6});
```

### [Launch the viewer](#launch-the-viewer)

Start the DevTools viewer in a separate terminal:

```
1npx @ai-sdk/devtools
```

Open [http://localhost:4983](http://localhost:4983/) to inspect your AI SDK interactions in real time.

## [Inspecting Tool Calls and Outputs](#inspecting-tool-calls-and-outputs)

DevTools captures and displays the following for every call:

* **Input parameters and prompts** — the complete input sent to your LLM
* **Output content and tool calls** — generated text and tool invocations
* **Token usage and timing** — resource consumption and latency per step
* **Raw provider data** — complete request and response payloads

For multi-step agent interactions, DevTools groups everything into **runs** (a complete interaction) and **steps** (each individual LLM call within it), making it easy to trace exactly what your agent did and why.

You can also log tool results directly in code during development:

```
1import { streamText, tool, stepCountIs } from 'ai';2import { z } from 'zod';3
4const result = streamText({5 model,6 prompt: "What's the weather in New York in celsius?",7 tools: {8 weather: tool({9 description: 'Get the weather in a location (fahrenheit)',10 inputSchema: z.object({11 location: z.string().describe('The location to get the weather for'),12 }),13 execute: async ({ location }) => ({14 location,15 temperature: Math.round(Math.random() * (90 - 32) + 32),16 }),17 }),18 },19 stopWhen: stepCountIs(5),20 onStepFinish: async ({ toolResults }) => {21 if (toolResults.length) {22 console.log(JSON.stringify(toolResults, null, 2));23 }24 },25});
```

The `onStepFinish` callback fires after each LLM step and prints any tool results to your terminal — useful for quick debugging without opening the DevTools UI.

DevTools stores all AI interactions in a local `.devtools/generations.json` file. It automatically adds `.devtools` to your `.gitignore` to prevent committing sensitive interaction data.

## [Where to Next?](#where-to-next)

* Learn about [Agent Skills](https://agentskills.io/specification) to understand the full skill format.
* Read the [DevTools reference](https://ai-sdk.dev/docs/ai-sdk-core/devtools) for a complete list of captured data and configuration options.
* Explore [Tools and Tool Calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling) to build agents that can take real-world actions.
* Check out the [Add Skills to Your Agent](https://ai-sdk.dev/cookbook/guides/agent-skills) cookbook guide for a step-by-step integration walkthrough.

---
url: https://ai-sdk.dev/docs/agents/overview
title: "Agents: Overview"
description: "Learn how to build agents with the AI SDK."
hash: "3219af97853f1a1962031422e910a0a42ca295d38978036ddaf165ae37285848"
crawledAt: 2026-03-07T07:58:47.051Z
depth: 2
---

## [Agents](#agents)

Agents are **large language models (LLMs)** that use **tools** in a **loop** to accomplish tasks.

These components work together:

* **LLMs** process input and decide the next action
* **Tools** extend capabilities beyond text generation (reading files, calling APIs, writing to databases)
* **Loop** orchestrates execution through:
 * **Context management** - Maintaining conversation history and deciding what the model sees (input) at each step
 * **Stopping conditions** - Determining when the loop (task) is complete

## [ToolLoopAgent Class](#toolloopagent-class)

The ToolLoopAgent class handles these three components. Here's an agent that uses multiple tools in a loop to accomplish a task:

```
1import { ToolLoopAgent, stepCountIs, tool } from 'ai';2import { z } from 'zod';3
4const weatherAgent = new ToolLoopAgent({5 model: "anthropic/claude-sonnet-4.5",6 tools: {7 weather: tool({8 description: 'Get the weather in a location (in Fahrenheit)',9 inputSchema: z.object({10 location: z.string().describe('The location to get the weather for'),11 }),12 execute: async ({ location }) => ({13 location,14 temperature: 72 + Math.floor(Math.random() * 21) - 10,15 }),16 }),17 convertFahrenheitToCelsius: tool({18 description: 'Convert temperature from Fahrenheit to Celsius',19 inputSchema: z.object({20 temperature: z.number().describe('Temperature in Fahrenheit'),21 }),22 execute: async ({ temperature }) => {23 const celsius = Math.round((temperature - 32) * (5 / 9));24 return { celsius };25 },26 }),27 },28 // Agent's default behavior is to stop after a maximum of 20 steps29 // stopWhen: stepCountIs(20),30});31
32const result = await weatherAgent.generate({33 prompt: 'What is the weather in San Francisco in celsius?',34});35
36console.log(result.text); // agent's final answer37console.log(result.steps); // steps taken by the agent
```

The agent automatically:

1. Calls the `weather` tool to get the temperature in Fahrenheit
2. Calls `convertFahrenheitToCelsius` to convert it
3. Generates a final text response with the result

The ToolLoopAgent handles the loop, context management, and stopping conditions.

## [Why Use the ToolLoopAgent?](#why-use-the-toolloopagent)

The ToolLoopAgent is the recommended approach for building agents with the AI SDK because it:

* **Reduces boilerplate** - Manages loops and message arrays
* **Improves reusability** - Define once, use throughout your application
* **Simplifies maintenance** - Single place to update agent configuration

For most use cases, start with the ToolLoopAgent. Use core functions (`generateText`, `streamText`) when you need explicit control over each step for complex structured workflows.

## [Structured Workflows](#structured-workflows)

Agents are flexible and powerful, but non-deterministic. When you need reliable, repeatable outcomes with explicit control flow, use core functions with structured workflow patterns combining:

* Conditional statements for explicit branching
* Standard functions for reusable logic
* Error handling for robustness
* Explicit control flow for predictability

[Explore workflow patterns](https://ai-sdk.dev/docs/agents/workflows) to learn more about building structured, reliable systems.

## [Next Steps](#next-steps)

* **[Building Agents](https://ai-sdk.dev/docs/agents/building-agents)** - Guide to creating agents with the ToolLoopAgent
* **[Workflow Patterns](https://ai-sdk.dev/docs/agents/workflows)** - Structured patterns using core functions for complex workflows
* **[Loop Control](https://ai-sdk.dev/docs/agents/loop-control)** - Execution control with stopWhen and prepareStep

---
url: https://ai-sdk.dev/docs/agents/building-agents
title: "Agents: Building Agents"
description: "Complete guide to creating agents with the ToolLoopAgent."
hash: "77db2f5fd53dc7970060b62f0d9aaae02ee5142f1711ee9dc672061f2a71d714"
crawledAt: 2026-03-07T07:58:52.640Z
depth: 2
---

The ToolLoopAgent provides a structured way to encapsulate LLM configuration, tools, and behavior into reusable components. It handles the agent loop for you, allowing the LLM to call tools multiple times in sequence to accomplish complex tasks. Define agents once and use them across your application.

## [Why Use the ToolLoopAgent Class?](#why-use-the-toolloopagent-class)

When building AI applications, you often need to:

* **Reuse configurations** - Same model settings, tools, and prompts across different parts of your application
* **Maintain consistency** - Ensure the same behavior and capabilities throughout your codebase
* **Simplify API routes** - Reduce boilerplate in your endpoints
* **Type safety** - Get full TypeScript support for your agent's tools and outputs

The ToolLoopAgent class provides a single place to define your agent's behavior.

## [Creating an Agent](#creating-an-agent)

Define an agent by instantiating the ToolLoopAgent class with your desired configuration:

```
1import { ToolLoopAgent } from 'ai';2
3const myAgent = new ToolLoopAgent({4 model: "anthropic/claude-sonnet-4.5",5 instructions: 'You are a helpful assistant.',6 tools: {7 // Your tools here8 },9});
```

## [Configuration Options](#configuration-options)

The ToolLoopAgent accepts all the same settings as `generateText` and `streamText`. Configure:

### [Model and System Instructions](#model-and-system-instructions)

```
1import { ToolLoopAgent } from 'ai';2
3const agent = new ToolLoopAgent({4 model: "anthropic/claude-sonnet-4.5",5 instructions: 'You are an expert software engineer.',6});
```

### [Tools](#tools)

Provide tools that the agent can use to accomplish tasks:

```
1import { ToolLoopAgent, tool } from 'ai';2import { z } from 'zod';3
4const codeAgent = new ToolLoopAgent({5 model: "anthropic/claude-sonnet-4.5",6 tools: {7 runCode: tool({8 description: 'Execute Python code',9 inputSchema: z.object({10 code: z.string(),11 }),12 execute: async ({ code }) => {13 // Execute code and return result14 return { output: 'Code executed successfully' };15 },16 }),17 },18});
```

### [Loop Control](#loop-control)

By default, agents run for 20 steps (`stopWhen: stepCountIs(20)`). In each step, the model either generates text or calls a tool. If it generates text, the agent completes. If it calls a tool, the AI SDK executes that tool.

To let agents call multiple tools in sequence, configure `stopWhen` to allow more steps. After each tool execution, the agent triggers a new generation where the model can call another tool or generate text:

```
1import { ToolLoopAgent, stepCountIs } from 'ai';2
3const agent = new ToolLoopAgent({4 model: "anthropic/claude-sonnet-4.5",5 stopWhen: stepCountIs(20), // Allow up to 20 steps6});
```

Each step represents one generation (which results in either text or a tool call). The loop continues until:

* A finish reasoning other than tool-calls is returned, or
* A tool that is invoked does not have an execute function, or
* A tool call needs approval, or
* A stop condition is met

You can combine multiple conditions:

```
1import { ToolLoopAgent, stepCountIs } from 'ai';2
3const agent = new ToolLoopAgent({4 model: "anthropic/claude-sonnet-4.5",5 stopWhen: [6 stepCountIs(20), // Maximum 20 steps7 yourCustomCondition(), // Custom logic for when to stop8 ],9});
```

Learn more about [loop control and stop conditions](https://ai-sdk.dev/docs/agents/loop-control).

### [Tool Choice](#tool-choice)

Control how the agent uses tools:

```
1import { ToolLoopAgent } from 'ai';2
3const agent = new ToolLoopAgent({4 model: "anthropic/claude-sonnet-4.5",5 tools: {6 // your tools here7 },8 toolChoice: 'required', // Force tool use9 // or toolChoice: 'none' to disable tools10 // or toolChoice: 'auto' (default) to let the model decide11});
```

You can also force the use of a specific tool:

```
1import { ToolLoopAgent } from 'ai';2
3const agent = new ToolLoopAgent({4 model: "anthropic/claude-sonnet-4.5",5 tools: {6 weather: weatherTool,7 cityAttractions: attractionsTool,8 },9 toolChoice: {10 type: 'tool',11 toolName: 'weather', // Force the weather tool to be used12 },13});
```

### [Structured Output](#structured-output)

Define structured output schemas:

```
1import { ToolLoopAgent, Output, stepCountIs } from 'ai';2import { z } from 'zod';3
4const analysisAgent = new ToolLoopAgent({5 model: "anthropic/claude-sonnet-4.5",6 output: Output.object({7 schema: z.object({8 sentiment: z.enum(['positive', 'neutral', 'negative']),9 summary: z.string(),10 keyPoints: z.array(z.string()),11 }),12 }),13 stopWhen: stepCountIs(10),14});15
16const { output } = await analysisAgent.generate({17 prompt: 'Analyze customer feedback from the last quarter',18});
```

## [Define Agent Behavior with System Instructions](#define-agent-behavior-with-system-instructions)

System instructions define your agent's behavior, personality, and constraints. They set the context for all interactions and guide how the agent responds to user queries and uses tools.

### [Basic System Instructions](#basic-system-instructions)

Set the agent's role and expertise:

```
1const agent = new ToolLoopAgent({2 model: "anthropic/claude-sonnet-4.5",3 instructions:4 'You are an expert data analyst. You provide clear insights from complex data.',5});
```

### [Detailed Behavioral Instructions](#detailed-behavioral-instructions)

Provide specific guidelines for agent behavior:

```
1const codeReviewAgent = new ToolLoopAgent({2 model: "anthropic/claude-sonnet-4.5",3 instructions: `You are a senior software engineer conducting code reviews.4
5 Your approach:6 - Focus on security vulnerabilities first7 - Identify performance bottlenecks8 - Suggest improvements for readability and maintainability9 - Be constructive and educational in your feedback10 - Always explain why something is an issue and how to fix it`,11});
```

### [Constrain Agent Behavior](#constrain-agent-behavior)

Set boundaries and ensure consistent behavior:

```
1const customerSupportAgent = new ToolLoopAgent({2 model: "anthropic/claude-sonnet-4.5",3 instructions: `You are a customer support specialist for an e-commerce platform.4
5 Rules:6 - Never make promises about refunds without checking the policy7 - Always be empathetic and professional8 - If you don't know something, say so and offer to escalate9 - Keep responses concise and actionable10 - Never share internal company information`,11 tools: {12 checkOrderStatus,13 lookupPolicy,14 createTicket,15 },16});
```

### [Tool Usage Instructions](#tool-usage-instructions)

Guide how the agent should use available tools:

```
1const researchAgent = new ToolLoopAgent({2 model: "anthropic/claude-sonnet-4.5",3 instructions: `You are a research assistant with access to search and document tools.4
5 When researching:6 1. Always start with a broad search to understand the topic7 2. Use document analysis for detailed information8 3. Cross-reference multiple sources before drawing conclusions9 4. Cite your sources when presenting information10 5. If information conflicts, present both viewpoints`,11 tools: {12 webSearch,13 analyzeDocument,14 extractQuotes,15 },16});
```

### [Format and Style Instructions](#format-and-style-instructions)

Control the output format and communication style:

```
1const technicalWriterAgent = new ToolLoopAgent({2 model: "anthropic/claude-sonnet-4.5",3 instructions: `You are a technical documentation writer.4
5 Writing style:6 - Use clear, simple language7 - Avoid jargon unless necessary8 - Structure information with headers and bullet points9 - Include code examples where relevant10 - Write in second person ("you" instead of "the user")11
12 Always format responses in Markdown.`,13});
```

## [Using an Agent](#using-an-agent)

Once defined, you can use your agent in three ways:

### [Generate Text](#generate-text)

Use `generate()` for one-time text generation:

```
1const result = await myAgent.generate({2 prompt: 'What is the weather like?',3});4
5console.log(result.text);
```

### [Stream Text](#stream-text)

Use `stream()` for streaming responses:

```
1const result = await myAgent.stream({2 prompt: 'Tell me a story',3});4
5for await (const chunk of result.textStream) {6 console.log(chunk);7}
```

### [Respond to UI Messages](#respond-to-ui-messages)

Use `createAgentUIStreamResponse()` to create API responses for client applications:

```
1// In your API route (e.g., app/api/chat/route.ts)2import { createAgentUIStreamResponse } from 'ai';3
4export async function POST(request: Request) {5 const { messages } = await request.json();6
7 return createAgentUIStreamResponse({8 agent: myAgent,9 uiMessages: messages,10 });11}
```

### [Lifecycle Callbacks](#lifecycle-callbacks)

Experimental callbacks are subject to breaking changes in incremental package releases.

Agents provide lifecycle callbacks that let you hook into different phases of the agent execution. These are useful for logging, observability, debugging, and custom telemetry.

```
1const result = await myAgent.generate({2 prompt: 'Research and summarize the latest AI trends',3
4 experimental_onStart({ model, functionId }) {5 console.log('Agent started', { model: model.modelId, functionId });6 },7
8 experimental_onStepStart({ stepNumber, model }) {9 console.log(`Step ${stepNumber} starting`, { model: model.modelId });10 },11
12 experimental_onToolCallStart({ toolCall }) {13 console.log(`Tool call starting: ${toolCall.toolName}`);14 },15
16 experimental_onToolCallFinish({ toolCall, durationMs, success }) {17 console.log(`Tool call finished: ${toolCall.toolName} (${durationMs}ms)`, {18 success,19 });20 },21
22 onStepFinish({ stepNumber, usage, finishReason, toolCalls }) {23 console.log(`Step ${stepNumber} completed:`, {24 inputTokens: usage.inputTokens,25 outputTokens: usage.outputTokens,26 finishReason,27 toolsUsed: toolCalls?.map(tc => tc.toolName),28 });29 },30
31 onFinish({ totalUsage, steps }) {32 console.log('Agent finished:', {33 totalSteps: steps.length,34 totalTokens: totalUsage.totalTokens,35 });36 },37});
```

The available lifecycle callbacks are:

* **`experimental_onStart`**: Called once when the agent operation begins, before any LLM calls. Receives model info, prompt, settings, and telemetry metadata.
* **`experimental_onStepStart`**: Called before each step (LLM call). Receives the step number, model, messages being sent, tools, and prior steps.
* **`experimental_onToolCallStart`**: Called right before a tool's `execute` function runs. Receives the tool call object with tool name, call ID, and input.
* **`experimental_onToolCallFinish`**: Called right after a tool's `execute` function completes or errors. Receives the tool call, `durationMs`, and a `success` discriminator (`output` when successful, `error` when failed).
* **`onStepFinish`**: Called after each step finishes. Receives step results including usage, finish reason, and tool calls.
* **`onFinish`**: Called when all steps are finished and the response is complete. Receives all step results, total usage, and telemetry metadata.

#### [Constructor vs. Method Callbacks](#constructor-vs-method-callbacks)

All lifecycle callbacks can be defined in the constructor for agent-wide tracking, in the `generate()`/`stream()` call for per-call tracking, or both. When both are provided, both are called (constructor first, then the method callback):

```
1const agent = new ToolLoopAgent({2 model: "anthropic/claude-sonnet-4.5",3 onStepFinish: async ({ stepNumber, usage }) => {4 // Agent-wide logging5 console.log(`Agent step ${stepNumber}:`, usage.totalTokens);6 },7});8
9// Method-level callback runs after constructor callback10const result = await agent.generate({11 prompt: 'Hello',12 onStepFinish: async ({ stepNumber, usage }) => {13 // Per-call tracking (e.g., for billing)14 await trackUsage(stepNumber, usage);15 },16});
```

## [End-to-end Type Safety](#end-to-end-type-safety)

You can infer types for your agent's `UIMessage`s:

```
1import { ToolLoopAgent, InferAgentUIMessage } from 'ai';2
3const myAgent = new ToolLoopAgent({4 //... configuration5});6
7// Infer the UIMessage type for UI components or persistence8export type MyAgentUIMessage = InferAgentUIMessage<typeof myAgent>;
```

Use this type in your client components with `useChat`:

```
1'use client';2
3import { useChat } from '@ai-sdk/react';4import type { MyAgentUIMessage } from '@/agent/my-agent';5
6export function Chat() {7 const { messages } = useChat<MyAgentUIMessage>();8 // Full type safety for your messages and tools9}
```

## [Next Steps](#next-steps)

Now that you understand building agents, you can:

* Explore [workflow patterns](https://ai-sdk.dev/docs/agents/workflows) for structured patterns using core functions
* Learn about [loop control](https://ai-sdk.dev/docs/agents/loop-control) for advanced execution control
* See [manual loop examples](https://ai-sdk.dev/cookbook/node/manual-agent-loop) for custom workflow implementations

---
url: https://ai-sdk.dev/docs/agents/workflows
title: "Agents: Workflow Patterns"
description: "Learn workflow patterns for building reliable agents with the AI SDK."
hash: "2676bdc10ac20d8627e0d389433d02cd06a9218a45fd141eb270723f05225176"
crawledAt: 2026-03-07T07:58:58.214Z
depth: 2
---

Combine the building blocks from the [overview](https://ai-sdk.dev/docs/agents/overview) with these patterns to add structure and reliability to your agents:

* [Sequential Processing](#sequential-processing-chains) - Steps executed in order
* [Parallel Processing](#parallel-processing) - Independent tasks run simultaneously
* [Evaluation/Feedback Loops](#evaluator-optimizer) - Results checked and improved iteratively
* [Orchestration](#orchestrator-worker) - Coordinating multiple components
* [Routing](#routing) - Directing work based on context

## [Choose Your Approach](#choose-your-approach)

Consider these key factors:

* **Flexibility vs Control** - How much freedom does the LLM need vs how tightly you must constrain its actions?
* **Error Tolerance** - What are the consequences of mistakes in your use case?
* **Cost Considerations** - More complex systems typically mean more LLM calls and higher costs
* **Maintenance** - Simpler architectures are easier to debug and modify

**Start with the simplest approach that meets your needs**. Add complexity only when required by:

1. Breaking down tasks into clear steps
2. Adding tools for specific capabilities
3. Implementing feedback loops for quality control
4. Introducing multiple agents for complex workflows

Let's look at examples of these patterns in action.

## [Patterns with Examples](#patterns-with-examples)

These patterns, adapted from [Anthropic's guide on building effective agents](https://www.anthropic.com/research/building-effective-agents), serve as building blocks you can combine to create comprehensive workflows. Each pattern addresses specific aspects of task execution. Combine them thoughtfully to build reliable solutions for complex problems.

## [Sequential Processing (Chains)](#sequential-processing-chains)

The simplest workflow pattern executes steps in a predefined order. Each step's output becomes input for the next step, creating a clear chain of operations. Use this pattern for tasks with well-defined sequences, like content generation pipelines or data transformation processes.

```
1import { generateText, Output } from 'ai';2import { z } from 'zod';3
4async function generateMarketingCopy(input: string) {5 const model = "anthropic/claude-sonnet-4.5";6
7 // First step: Generate marketing copy8 const { text: copy } = await generateText({9 model,10 prompt: `Write persuasive marketing copy for: ${input}. Focus on benefits and emotional appeal.`,11 });12
13 // Perform quality check on copy14 const { output: qualityMetrics } = await generateText({15 model,16 output: Output.object({17 schema: z.object({18 hasCallToAction: z.boolean(),19 emotionalAppeal: z.number().min(1).max(10),20 clarity: z.number().min(1).max(10),21 }),22 }),23 prompt: `Evaluate this marketing copy for:24 1. Presence of call to action (true/false)25 2. Emotional appeal (1-10)26 3. Clarity (1-10)27
28 Copy to evaluate: ${copy}`,29 });30
31 // If quality check fails, regenerate with more specific instructions32 if (33 !qualityMetrics.hasCallToAction ||34 qualityMetrics.emotionalAppeal < 7 ||35 qualityMetrics.clarity < 736 ) {37 const { text: improvedCopy } = await generateText({38 model,39 prompt: `Rewrite this marketing copy with:40 ${!qualityMetrics.hasCallToAction ? '- A clear call to action' : ''}41 ${qualityMetrics.emotionalAppeal < 7 ? '- Stronger emotional appeal' : ''}42 ${qualityMetrics.clarity < 7 ? '- Improved clarity and directness' : ''}43
44 Original copy: ${copy}`,45 });46 return { copy: improvedCopy, qualityMetrics };47 }48
49 return { copy, qualityMetrics };50}
```

## [Routing](#routing)

This pattern lets the model decide which path to take through a workflow based on context and intermediate results. The model acts as an intelligent router, directing the flow of execution between different branches of your workflow. Use this when handling varied inputs that require different processing approaches. In the example below, the first LLM call's results determine the second call's model size and system prompt.

```
1import { generateText, Output } from 'ai';2import { z } from 'zod';3
4async function handleCustomerQuery(query: string) {5 const model = "anthropic/claude-sonnet-4.5";6
7 // First step: Classify the query type8 const { output: classification } = await generateText({9 model,10 output: Output.object({11 schema: z.object({12 reasoning: z.string(),13 type: z.enum(['general', 'refund', 'technical']),14 complexity: z.enum(['simple', 'complex']),15 }),16 }),17 prompt: `Classify this customer query:18 ${query}19
20 Determine:21 1. Query type (general, refund, or technical)22 2. Complexity (simple or complex)23 3. Brief reasoning for classification`,24 });25
26 // Route based on classification27 // Set model and system prompt based on query type and complexity28 const { text: response } = await generateText({29 model:30 classification.complexity === 'simple'31 ? 'openai/gpt-4o-mini'32 : 'openai/o4-mini',33 system: {34 general:35 'You are an expert customer service agent handling general inquiries.',36 refund:37 'You are a customer service agent specializing in refund requests. Follow company policy and collect necessary information.',38 technical:39 'You are a technical support specialist with deep product knowledge. Focus on clear step-by-step troubleshooting.',40 }[classification.type],41 prompt: query,42 });43
44 return { response, classification };45}
```

## [Parallel Processing](#parallel-processing)

Break down tasks into independent subtasks that execute simultaneously. This pattern uses parallel execution to improve efficiency while maintaining the benefits of structured workflows. For example, analyze multiple documents or process different aspects of a single input concurrently (like code review).

```
1import { generateText, Output } from 'ai';2import { z } from 'zod';3
4// Example: Parallel code review with multiple specialized reviewers5async function parallelCodeReview(code: string) {6 const model = "anthropic/claude-sonnet-4.5";7
8 // Run parallel reviews9 const [securityReview, performanceReview, maintainabilityReview] =10 await Promise.all([11 generateText({12 model,13 system:14 'You are an expert in code security. Focus on identifying security vulnerabilities, injection risks, and authentication issues.',15 output: Output.object({16 schema: z.object({17 vulnerabilities: z.array(z.string()),18 riskLevel: z.enum(['low', 'medium', 'high']),19 suggestions: z.array(z.string()),20 }),21 }),22 prompt: `Review this code:23 ${code}`,24 }),25
26 generateText({27 model,28 system:29 'You are an expert in code performance. Focus on identifying performance bottlenecks, memory leaks, and optimization opportunities.',30 output: Output.object({31 schema: z.object({32 issues: z.array(z.string()),33 impact: z.enum(['low', 'medium', 'high']),34 optimizations: z.array(z.string()),35 }),36 }),37 prompt: `Review this code:38 ${code}`,39 }),40
41 generateText({42 model,43 system:44 'You are an expert in code quality. Focus on code structure, readability, and adherence to best practices.',45 output: Output.object({46 schema: z.object({47 concerns: z.array(z.string()),48 qualityScore: z.number().min(1).max(10),49 recommendations: z.array(z.string()),50 }),51 }),52 prompt: `Review this code:53 ${code}`,54 }),55 ]);56
57 const reviews = [58 {...securityReview.output, type: 'security' },59 {...performanceReview.output, type: 'performance' },60 {...maintainabilityReview.output, type: 'maintainability' },61 ];62
63 // Aggregate results using another model instance64 const { text: summary } = await generateText({65 model,66 system: 'You are a technical lead summarizing multiple code reviews.',67 prompt: `Synthesize these code review results into a concise summary with key actions:68 ${JSON.stringify(reviews, null, 2)}`,69 });70
71 return { reviews, summary };72}
```

## [Orchestrator-Worker](#orchestrator-worker)

A primary model (orchestrator) coordinates the execution of specialized workers. Each worker optimizes for a specific subtask, while the orchestrator maintains overall context and ensures coherent results. This pattern excels at complex tasks requiring different types of expertise or processing.

```
1import { generateText, Output } from 'ai';2import { z } from 'zod';3
4async function implementFeature(featureRequest: string) {5 // Orchestrator: Plan the implementation6 const { output: implementationPlan } = await generateText({7 model: "anthropic/claude-sonnet-4.5",8 output: Output.object({9 schema: z.object({10 files: z.array(11 z.object({12 purpose: z.string(),13 filePath: z.string(),14 changeType: z.enum(['create', 'modify', 'delete']),15 }),16 ),17 estimatedComplexity: z.enum(['low', 'medium', 'high']),18 }),19 }),20 system:21 'You are a senior software architect planning feature implementations.',22 prompt: `Analyze this feature request and create an implementation plan:23 ${featureRequest}`,24 });25
26 // Workers: Execute the planned changes27 const fileChanges = await Promise.all(28 implementationPlan.files.map(async file => {29 // Each worker is specialized for the type of change30 const workerSystemPrompt = {31 create:32 'You are an expert at implementing new files following best practices and project patterns.',33 modify:34 'You are an expert at modifying existing code while maintaining consistency and avoiding regressions.',35 delete:36 'You are an expert at safely removing code while ensuring no breaking changes.',37 }[file.changeType];38
39 const { output: change } = await generateText({40 model: "anthropic/claude-sonnet-4.5",41 output: Output.object({42 schema: z.object({43 explanation: z.string(),44 code: z.string(),45 }),46 }),47 system: workerSystemPrompt,48 prompt: `Implement the changes for ${file.filePath} to support:49 ${file.purpose}50
51 Consider the overall feature context:52 ${featureRequest}`,53 });54
55 return {56 file,57 implementation: change,58 };59 }),60 );61
62 return {63 plan: implementationPlan,64 changes: fileChanges,65 };66}
```

## [Evaluator-Optimizer](#evaluator-optimizer)

Add quality control to workflows with dedicated evaluation steps that assess intermediate results. Based on the evaluation, the workflow proceeds, retries with adjusted parameters, or takes corrective action. This creates robust workflows capable of self-improvement and error recovery.

```
1import { generateText, Output } from 'ai';2import { z } from 'zod';3
4async function translateWithFeedback(text: string, targetLanguage: string) {5 let currentTranslation = '';6 let iterations = 0;7 const MAX_ITERATIONS = 3;8
9 // Initial translation10 const { text: translation } = await generateText({11 model: "anthropic/claude-sonnet-4.5",12 system: 'You are an expert literary translator.',13 prompt: `Translate this text to ${targetLanguage}, preserving tone and cultural nuances:14 ${text}`,15 });16
17 currentTranslation = translation;18
19 // Evaluation-optimization loop20 while (iterations < MAX_ITERATIONS) {21 // Evaluate current translation22 const { output: evaluation } = await generateText({23 model: "anthropic/claude-sonnet-4.5",24 output: Output.object({25 schema: z.object({26 qualityScore: z.number().min(1).max(10),27 preservesTone: z.boolean(),28 preservesNuance: z.boolean(),29 culturallyAccurate: z.boolean(),30 specificIssues: z.array(z.string()),31 improvementSuggestions: z.array(z.string()),32 }),33 }),34 system: 'You are an expert in evaluating literary translations.',35 prompt: `Evaluate this translation:36
37 Original: ${text}38 Translation: ${currentTranslation}39
40 Consider:41 1. Overall quality42 2. Preservation of tone43 3. Preservation of nuance44 4. Cultural accuracy`,45 });46
47 // Check if quality meets threshold48 if (49 evaluation.qualityScore >= 8 &&50 evaluation.preservesTone &&51 evaluation.preservesNuance &&52 evaluation.culturallyAccurate53 ) {54 break;55 }56
57 // Generate improved translation based on feedback58 const { text: improvedTranslation } = await generateText({59 model: "anthropic/claude-sonnet-4.5",60 system: 'You are an expert literary translator.',61 prompt: `Improve this translation based on the following feedback:62 ${evaluation.specificIssues.join('\n')}63 ${evaluation.improvementSuggestions.join('\n')}64
65 Original: ${text}66 Current Translation: ${currentTranslation}`,67 });68
69 currentTranslation = improvedTranslation;70 iterations++;71 }72
73 return {74 finalTranslation: currentTranslation,75 iterationsRequired: iterations,76 };77}
```

---
url: https://ai-sdk.dev/docs/agents/loop-control
title: "Agents: Loop Control"
description: "Control agent execution with built-in loop management using stopWhen and prepareStep"
hash: "6371078f7a52ba8e0177f2fa70dda44df1877423a1f8870f540d7335cb076a68"
crawledAt: 2026-03-07T07:59:03.814Z
depth: 2
---

You can control both the execution flow and the settings at each step of the agent loop. The loop continues until:

* A finish reasoning other than tool-calls is returned, or
* A tool that is invoked does not have an execute function, or
* A tool call needs approval, or
* A stop condition is met

The AI SDK provides built-in loop control through two parameters: `stopWhen` for defining stopping conditions and `prepareStep` for modifying settings (model, tools, messages, and more) between steps.

## [Stop Conditions](#stop-conditions)

The `stopWhen` parameter controls when to stop execution when there are tool results in the last step. By default, agents stop after 20 steps using `stepCountIs(20)`.

When you provide `stopWhen`, the agent continues executing after tool calls until a stopping condition is met. When the condition is an array, execution stops when any of the conditions are met.

### [Use Built-in Conditions](#use-built-in-conditions)

The AI SDK provides several built-in stopping conditions:

```
1import { ToolLoopAgent, stepCountIs } from 'ai';2
3const agent = new ToolLoopAgent({4 model: "anthropic/claude-sonnet-4.5",5 tools: {6 // your tools7 },8 stopWhen: stepCountIs(20), // Default state: stop after 20 steps maximum9});10
11const result = await agent.generate({12 prompt: 'Analyze this dataset and create a summary report',13});
```

### [Combine Multiple Conditions](#combine-multiple-conditions)

Combine multiple stopping conditions. The loop stops when it meets any condition:

```
1import { ToolLoopAgent, stepCountIs, hasToolCall } from 'ai';2
3const agent = new ToolLoopAgent({4 model: "anthropic/claude-sonnet-4.5",5 tools: {6 // your tools7 },8 stopWhen: [9 stepCountIs(20), // Maximum 20 steps10 hasToolCall('someTool'), // Stop after calling 'someTool'11 ],12});13
14const result = await agent.generate({15 prompt: 'Research and analyze the topic',16});
```

### [Create Custom Conditions](#create-custom-conditions)

Build custom stopping conditions for specific requirements:

```
1import { ToolLoopAgent, StopCondition, ToolSet } from 'ai';2
3const tools = {4 // your tools5} satisfies ToolSet;6
7const hasAnswer: StopCondition<typeof tools> = ({ steps }) => {8 // Stop when the model generates text containing "ANSWER:"9 return steps.some(step => step.text?.includes('ANSWER:')) ?? false;10};11
12const agent = new ToolLoopAgent({13 model: "anthropic/claude-sonnet-4.5",14 tools,15 stopWhen: hasAnswer,16});17
18const result = await agent.generate({19 prompt: 'Find the answer and respond with "ANSWER: [your answer]"',20});
```

Custom conditions receive step information across all steps:

```
1const budgetExceeded: StopCondition<typeof tools> = ({ steps }) => {2 const totalUsage = steps.reduce(3 (acc, step) => ({4 inputTokens: acc.inputTokens + (step.usage?.inputTokens ?? 0),5 outputTokens: acc.outputTokens + (step.usage?.outputTokens ?? 0),6 }),7 { inputTokens: 0, outputTokens: 0 },8 );9
10 const costEstimate =11 (totalUsage.inputTokens * 0.01 + totalUsage.outputTokens * 0.03) / 1000;12 return costEstimate > 0.5; // Stop if cost exceeds $0.5013};
```

## [Prepare Step](#prepare-step)

The `prepareStep` callback runs before each step in the loop and defaults to the initial settings if you don't return any changes. Use it to modify settings, manage context, or implement dynamic behavior based on execution history.

### [Dynamic Model Selection](#dynamic-model-selection)

Switch models based on step requirements:

```
1import { ToolLoopAgent } from 'ai';2
3const agent = new ToolLoopAgent({4 model: 'openai/gpt-4o-mini', // Default model5 tools: {6 // your tools7 },8 prepareStep: async ({ stepNumber, messages }) => {9 // Use a stronger model for complex reasoning after initial steps10 if (stepNumber > 2 && messages.length > 10) {11 return {12 model: "anthropic/claude-sonnet-4.5",13 };14 }15 // Continue with default settings16 return {};17 },18});19
20const result = await agent.generate({21 prompt: '...',22});
```

### [Context Management](#context-management)

Manage growing conversation history in long-running loops:

```
1import { ToolLoopAgent } from 'ai';2
3const agent = new ToolLoopAgent({4 model: "anthropic/claude-sonnet-4.5",5 tools: {6 // your tools7 },8 prepareStep: async ({ messages }) => {9 // Keep only recent messages to stay within context limits10 if (messages.length > 20) {11 return {12 messages: [13 messages[0], // Keep system instructions14...messages.slice(-10), // Keep last 10 messages15 ],16 };17 }18 return {};19 },20});21
22const result = await agent.generate({23 prompt: '...',24});
```

### [Tool Selection](#tool-selection)

Control which tools are available at each step:

```
1import { ToolLoopAgent } from 'ai';2
3const agent = new ToolLoopAgent({4 model: "anthropic/claude-sonnet-4.5",5 tools: {6 search: searchTool,7 analyze: analyzeTool,8 summarize: summarizeTool,9 },10 prepareStep: async ({ stepNumber, steps }) => {11 // Search phase (steps 0-2)12 if (stepNumber <= 2) {13 return {14 activeTools: ['search'],15 toolChoice: 'required',16 };17 }18
19 // Analysis phase (steps 3-5)20 if (stepNumber <= 5) {21 return {22 activeTools: ['analyze'],23 };24 }25
26 // Summary phase (step 6+)27 return {28 activeTools: ['summarize'],29 toolChoice: 'required',30 };31 },32});33
34const result = await agent.generate({35 prompt: '...',36});
```

You can also force a specific tool to be used:

```
1prepareStep: async ({ stepNumber }) => {2 if (stepNumber === 0) {3 // Force the search tool to be used first4 return {5 toolChoice: { type: 'tool', toolName: 'search' },6 };7 }8
9 if (stepNumber === 5) {10 // Force the summarize tool after analysis11 return {12 toolChoice: { type: 'tool', toolName: 'summarize' },13 };14 }15
16 return {};17};
```

### [Message Modification](#message-modification)

Transform messages before sending them to the model:

```
1import { ToolLoopAgent } from 'ai';2
3const agent = new ToolLoopAgent({4 model: "anthropic/claude-sonnet-4.5",5 tools: {6 // your tools7 },8 prepareStep: async ({ messages, stepNumber }) => {9 // Summarize tool results to reduce token usage10 const processedMessages = messages.map(msg => {11 if (msg.role === 'tool' && msg.content.length > 1000) {12 return {13...msg,14 content: summarizeToolResult(msg.content),15 };16 }17 return msg;18 });19
20 return { messages: processedMessages };21 },22});23
24const result = await agent.generate({25 prompt: '...',26});
```

## [Access Step Information](#access-step-information)

Both `stopWhen` and `prepareStep` receive detailed information about the current execution:

```
1prepareStep: async ({2 model, // Current model configuration3 stepNumber, // Current step number (0-indexed)4 steps, // All previous steps with their results5 messages, // Messages to be sent to the model6}) => {7 // Access previous tool calls and results8 const previousToolCalls = steps.flatMap(step => step.toolCalls);9 const previousResults = steps.flatMap(step => step.toolResults);10
11 // Make decisions based on execution history12 if (previousToolCalls.some(call => call.toolName === 'dataAnalysis')) {13 return {14 toolChoice: { type: 'tool', toolName: 'reportGenerator' },15 };16 }17
18 return {};19},
```

## [Forced Tool Calling](#forced-tool-calling)

You can force the agent to always use tools by combining `toolChoice: 'required'` with a `done` tool that has no `execute` function. This pattern ensures the agent uses tools for every step and stops only when it explicitly signals completion.

```
1import { ToolLoopAgent, tool } from 'ai';2import { z } from 'zod';3
4const agent = new ToolLoopAgent({5 model: "anthropic/claude-sonnet-4.5",6 tools: {7 search: searchTool,8 analyze: analyzeTool,9 done: tool({10 description: 'Signal that you have finished your work',11 inputSchema: z.object({12 answer: z.string().describe('The final answer'),13 }),14 // No execute function - stops the agent when called15 }),16 },17 toolChoice: 'required', // Force tool calls at every step18});19
20const result = await agent.generate({21 prompt: 'Research and analyze this topic, then provide your answer.',22});23
24// extract answer from done tool call25const toolCall = result.staticToolCalls[0]; // tool call from final step26if (toolCall?.toolName === 'done') {27 console.log(toolCall.input.answer);28}
```

Key aspects of this pattern:

* **`toolChoice: 'required'`**: Forces the model to call a tool at every step instead of generating text directly. This ensures the agent follows a structured workflow.
* **`done` tool without `execute`**: A tool that has no `execute` function acts as a termination signal. When the agent calls this tool, the loop stops because there's no function to execute.
* **Accessing results**: The final answer is available in `result.staticToolCalls`, which contains tool calls that weren't executed.

This pattern is useful when you want the agent to always use specific tools for operations (like code execution or data retrieval) rather than attempting to answer directly.

## [Manual Loop Control](#manual-loop-control)

For scenarios requiring complete control over the agent loop, you can use AI SDK Core functions (`generateText` and `streamText`) to implement your own loop management instead of using `stopWhen` and `prepareStep`. This approach provides maximum flexibility for complex workflows.

### [Implementing a Manual Loop](#implementing-a-manual-loop)

Build your own agent loop when you need full control over execution:

```
1import { generateText, ModelMessage } from 'ai';2
3const messages: ModelMessage[] = [{ role: 'user', content: '...' }];4
5let step = 0;6const maxSteps = 10;7
8while (step < maxSteps) {9 const result = await generateText({10 model: "anthropic/claude-sonnet-4.5",11 messages,12 tools: {13 // your tools here14 },15 });16
17 messages.push(...result.response.messages);18
19 if (result.text) {20 break; // Stop when model generates text21 }22
23 step++;24}
```

This manual approach gives you complete control over:

* Message history management
* Step-by-step decision making
* Custom stopping conditions
* Dynamic tool and model selection
* Error handling and recovery

[Learn more about manual agent loops in the cookbook](https://ai-sdk.dev/cookbook/node/manual-agent-loop).

---
url: https://ai-sdk.dev/docs/agents/configuring-call-options
title: "Agents: Configuring Call Options"
description: "Pass type-safe runtime inputs to dynamically configure agent behavior."
hash: "cb62a79b3ad5f2d3f33183fab84e921a6f665c7f09a08dac29e018c92d928256"
crawledAt: 2026-03-07T07:59:09.278Z
depth: 2
---

Call options allow you to pass type-safe structured inputs to your agent. Use them to dynamically modify any agent setting based on the specific request.

## [Why Use Call Options?](#why-use-call-options)

When you need agent behavior to change based on runtime context:

* **Add dynamic context** - Inject retrieved documents, user preferences, or session data into prompts
* **Select models dynamically** - Choose faster or more capable models based on request complexity
* **Configure tools per request** - Pass user location to search tools or adjust tool behavior
* **Customize provider options** - Set reasoning effort, temperature, or other provider-specific settings

Without call options, you'd need to create multiple agents or handle configuration logic outside the agent.

## [How It Works](#how-it-works)

Define call options in three steps:

1. **Define the schema** - Specify what inputs you accept using `callOptionsSchema`
2. **Configure with `prepareCall`** - Use those inputs to modify agent settings
3. **Pass options at runtime** - Provide the options when calling `generate()` or `stream()`

## [Basic Example](#basic-example)

Add user context to your agent's prompt at runtime:

```
1import { ToolLoopAgent } from 'ai';2import { z } from 'zod';3
4const supportAgent = new ToolLoopAgent({5 model: "anthropic/claude-sonnet-4.5",6 callOptionsSchema: z.object({7 userId: z.string(),8 accountType: z.enum(['free', 'pro', 'enterprise']),9 }),10 instructions: 'You are a helpful customer support agent.',11 prepareCall: ({ options,...settings }) => ({12...settings,13 instructions:14 settings.instructions +15 `\nUser context:16- Account type: ${options.accountType}17- User ID: ${options.userId}18
19Adjust your response based on the user's account level.`,20 }),21});22
23// Call the agent with specific user context24const result = await supportAgent.generate({25 prompt: 'How do I upgrade my account?',26 options: {27 userId: 'user_123',28 accountType: 'free',29 },30});
```

The `options` parameter is now required and type-checked. If you don't provide it or pass incorrect types, TypeScript will error.

## [Modifying Agent Settings](#modifying-agent-settings)

Use `prepareCall` to modify any agent setting. Return only the settings you want to change.

### [Dynamic Model Selection](#dynamic-model-selection)

Choose models based on request characteristics:

```
1import { ToolLoopAgent } from 'ai';2import { z } from 'zod';3
4const agent = new ToolLoopAgent({5 model: "anthropic/claude-sonnet-4.5", // Default model6 callOptionsSchema: z.object({7 complexity: z.enum(['simple', 'complex']),8 }),9 prepareCall: ({ options,...settings }) => ({10...settings,11 model:12 options.complexity === 'simple' ? 'openai/gpt-4o-mini' : 'openai/o1-mini',13 }),14});15
16// Use faster model for simple queries17await agent.generate({18 prompt: 'What is 2+2?',19 options: { complexity: 'simple' },20});21
22// Use more capable model for complex reasoning23await agent.generate({24 prompt: 'Explain quantum entanglement',25 options: { complexity: 'complex' },26});
```

### [Dynamic Tool Configuration](#dynamic-tool-configuration)

Configure tools based on runtime context:

```
1import { openai } from '@ai-sdk/openai';2import { ToolLoopAgent } from 'ai';3import { z } from 'zod';4
5const newsAgent = new ToolLoopAgent({6 model: "anthropic/claude-sonnet-4.5",7 callOptionsSchema: z.object({8 userCity: z.string().optional(),9 userRegion: z.string().optional(),10 }),11 tools: {12 web_search: openai.tools.webSearch(),13 },14 prepareCall: ({ options,...settings }) => ({15...settings,16 tools: {17 web_search: openai.tools.webSearch({18 searchContextSize: 'low',19 userLocation: {20 type: 'approximate',21 city: options.userCity,22 region: options.userRegion,23 country: 'US',24 },25 }),26 },27 }),28});29
30await newsAgent.generate({31 prompt: 'What are the top local news stories?',32 options: {33 userCity: 'San Francisco',34 userRegion: 'California',35 },36});
```

### [Provider-Specific Options](#provider-specific-options)

Configure provider settings dynamically:

```
1import { openai, OpenAILanguageModelResponsesOptions } from '@ai-sdk/openai';2import { ToolLoopAgent } from 'ai';3import { z } from 'zod';4
5const agent = new ToolLoopAgent({6 model: 'openai/o3',7 callOptionsSchema: z.object({8 taskDifficulty: z.enum(['low', 'medium', 'high']),9 }),10 prepareCall: ({ options,...settings }) => ({11...settings,12 providerOptions: {13 openai: {14 reasoningEffort: options.taskDifficulty,15 } satisfies OpenAILanguageModelResponsesOptions,16 },17 }),18});19
20await agent.generate({21 prompt: 'Analyze this complex scenario...',22 options: { taskDifficulty: 'high' },23});
```

## [Advanced Patterns](#advanced-patterns)

### [Retrieval Augmented Generation (RAG)](#retrieval-augmented-generation-rag)

Fetch relevant context and inject it into your prompt:

```
1import { ToolLoopAgent } from 'ai';2import { z } from 'zod';3
4const ragAgent = new ToolLoopAgent({5 model: "anthropic/claude-sonnet-4.5",6 callOptionsSchema: z.object({7 query: z.string(),8 }),9 prepareCall: async ({ options,...settings }) => {10 // Fetch relevant documents (this can be async)11 const documents = await vectorSearch(options.query);12
13 return {14...settings,15 instructions: `Answer questions using the following context:16
17${documents.map(doc => doc.content).join('\n\n')}`,18 };19 },20});21
22await ragAgent.generate({23 prompt: 'What is our refund policy?',24 options: { query: 'refund policy' },25});
```

The `prepareCall` function can be async, enabling you to fetch data before configuring the agent.

### [Combining Multiple Modifications](#combining-multiple-modifications)

Modify multiple settings together:

```
1import { ToolLoopAgent } from 'ai';2import { z } from 'zod';3
4const agent = new ToolLoopAgent({5 model: "anthropic/claude-sonnet-4.5",6 callOptionsSchema: z.object({7 userRole: z.enum(['admin', 'user']),8 urgency: z.enum(['low', 'high']),9 }),10 tools: {11 readDatabase: readDatabaseTool,12 writeDatabase: writeDatabaseTool,13 },14 prepareCall: ({ options,...settings }) => ({15...settings,16 // Upgrade model for urgent requests17 model: options.urgency === 'high' ? "anthropic/claude-sonnet-4.5" : settings.model,18 // Limit tools based on user role19 activeTools:20 options.userRole === 'admin'21 ? ['readDatabase', 'writeDatabase']22 : ['readDatabase'],23 // Adjust instructions24 instructions: `You are a ${options.userRole} assistant.25${options.userRole === 'admin' ? 'You have full database access.' : 'You have read-only access.'}`,26 }),27});28
29await agent.generate({30 prompt: 'Update the user record',31 options: {32 userRole: 'admin',33 urgency: 'high',34 },35});
```

## [Using with createAgentUIStreamResponse](#using-with-createagentuistreamresponse)

Pass call options through API routes to your agent:

```
1import { createAgentUIStreamResponse } from 'ai';2import { myAgent } from '@/ai/agents/my-agent';3
4export async function POST(request: Request) {5 const { messages, userId, accountType } = await request.json();6
7 return createAgentUIStreamResponse({8 agent: myAgent,9 messages,10 options: {11 userId,12 accountType,13 },14 });15}
```

## [Next Steps](#next-steps)

* Learn about [loop control](https://ai-sdk.dev/docs/agents/loop-control) for execution management
* Explore [workflow patterns](https://ai-sdk.dev/docs/agents/workflows) for complex multi-step processes

---
url: https://ai-sdk.dev/docs/agents/memory
title: "Agents: Memory"
description: "Add persistent memory to your agent using provider-defined tools, memory providers, or a custom tool."
hash: "85abd308af0b021333c059ad32f9bf294e940a4648fe10f06fd89c0c971db21b"
crawledAt: 2026-03-07T07:59:14.659Z
depth: 2
---

Memory lets your agent save information and recall it later. Without memory, every conversation starts fresh. With memory, your agent builds context over time, recalls previous interactions, and adapts to the user.

## [Three Approaches](#three-approaches)

You can add memory to your agent with the AI SDK in three ways, each with different tradeoffs:

| Approach | Effort | Flexibility | Provider Lock-in |
| --- | --- | --- | --- |
| [Provider-Defined Tools](#provider-defined-tools) | Low | Medium | Yes |
| [Memory Providers](#memory-providers) | Low | Low | Depends on memory provider |
| [Custom Tool](#custom-tool) | High | High | No |

## [Provider-Defined Tools](#provider-defined-tools)

[Provider-defined tools](https://ai-sdk.dev/docs/foundations/tools#types-of-tools) are tools where the provider specifies the tool's `inputSchema` and `description`, but you provide the `execute` function. The model has been trained to use these tools, which can result in better performance compared to custom tools.

### [Anthropic Memory Tool](#anthropic-memory-tool)

The [Anthropic Memory Tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool) gives Claude a structured interface for managing a `/memories` directory. Claude reads its memory before starting tasks, creates and updates files as it works, and references them in future conversations.

```
1import { anthropic } from '@ai-sdk/anthropic';2import { ToolLoopAgent } from 'ai';3
4const memory = anthropic.tools.memory_20250818({5 execute: async action => {6 // `action` contains `command`, `path`, and other fields7 // depending on the command (view, create, str_replace,8 // insert, delete, rename).9 // Implement your storage backend here.10 // Return the result as a string.11 },12});13
14const agent = new ToolLoopAgent({15 model: 'anthropic/claude-haiku-4.5',16 tools: { memory },17});18
19const result = await agent.generate({20 prompt: 'Remember that my favorite editor is Neovim',21});
```

The tool receives structured commands (`view`, `create`, `str_replace`, `insert`, `delete`, `rename`), each with a `path` scoped to `/memories`. Your `execute` function maps these to your storage backend (the filesystem, a database, or any other persistence layer).

**When to use this**: you want memory with minimal implementation effort and are already using Anthropic models. The tradeoff is provider lock-in, since this tool only works with Claude.

## [Memory Providers](#memory-providers)

Another approach is to use a provider that has memory built in. These providers wrap an external memory service and expose it through the AI SDK's standard interface. Memory storage, retrieval, and injection happen transparently, and you do not define any tools yourself.

### [Letta](#letta)

[Letta](https://letta.com/) provides agents with persistent long-term memory. You create an agent on Letta's platform (cloud or self-hosted), configure its memory there, and use the AI SDK provider to interact with it. Letta's agent runtime handles memory management (core memory, archival memory, recall).

```
1pnpm add @letta-ai/vercel-ai-sdk-provider
```

```
1import { lettaCloud } from '@letta-ai/vercel-ai-sdk-provider';2import { ToolLoopAgent } from 'ai';3
4const agent = new ToolLoopAgent({5 model: lettaCloud(),6 providerOptions: {7 letta: {8 agent: { id: 'your-agent-id' },9 },10 },11});12
13const result = await agent.generate({14 prompt: 'Remember that my favorite editor is Neovim',15});
```

You can also use Letta's built-in memory tools alongside custom tools:

```
1import { lettaCloud } from '@letta-ai/vercel-ai-sdk-provider';2import { ToolLoopAgent } from 'ai';3
4const agent = new ToolLoopAgent({5 model: lettaCloud(),6 tools: {7 core_memory_append: lettaCloud.tool('core_memory_append'),8 memory_insert: lettaCloud.tool('memory_insert'),9 memory_replace: lettaCloud.tool('memory_replace'),10 },11 providerOptions: {12 letta: {13 agent: { id: 'your-agent-id' },14 },15 },16});17
18const stream = agent.stream({19 prompt: 'What do you remember about me?',20});
```

See the [Letta provider documentation](https://ai-sdk.dev/providers/community-providers/letta) for full setup and configuration.

### [Mem0](#mem0)

[Mem0](https://mem0.ai/) adds a memory layer on top of any supported LLM provider. It automatically extracts memories from conversations, stores them, and retrieves relevant ones for future prompts.

```
1pnpm add @mem0/vercel-ai-provider
```

```
1import { createMem0 } from '@mem0/vercel-ai-provider';2import { ToolLoopAgent } from 'ai';3
4const mem0 = createMem0({5 provider: 'openai',6 mem0ApiKey: process.env.MEM0_API_KEY,7 apiKey: process.env.OPENAI_API_KEY,8});9
10const agent = new ToolLoopAgent({11 model: mem0('gpt-4.1', { user_id: 'user-123' }),12});13
14const { text } = await agent.generate({15 prompt: 'Remember that my favorite editor is Neovim',16});
```

Mem0 works across multiple LLM providers (OpenAI, Anthropic, Google, Groq, Cohere). You can also manage memories explicitly:

```
1import { addMemories, retrieveMemories } from '@mem0/vercel-ai-provider';2
3await addMemories(messages, { user_id: 'user-123' });4const context = await retrieveMemories(prompt, { user_id: 'user-123' });
```

See the [Mem0 provider documentation](https://ai-sdk.dev/providers/community-providers/mem0) for full setup and configuration.

### [Supermemory](#supermemory)

[Supermemory](https://supermemory.ai/) is a long-term memory platform that adds persistent, self-growing memory to your AI applications. It provides tools that handle saving and retrieving memories automatically through semantic search.

```
1pnpm add @supermemory/tools
```

```
1import { supermemoryTools } from '@supermemory/tools/ai-sdk';2import { ToolLoopAgent } from 'ai';3
4const agent = new ToolLoopAgent({5 model: "anthropic/claude-sonnet-4.5",6 tools: supermemoryTools(process.env.SUPERMEMORY_API_KEY!),7});8
9const result = await agent.generate({10 prompt: 'Remember that my favorite editor is Neovim',11});
```

Supermemory works with any AI SDK provider. The tools give the model `addMemory` and `searchMemories` operations that handle storage and retrieval.

See the [Supermemory provider documentation](https://ai-sdk.dev/providers/community-providers/supermemory) for full setup and configuration.

### [Hindsight](#hindsight)

[Hindsight](https://ai-sdk.dev/providers/community-providers/hindsight) provides agents with persistent memory through five tools: `retain`, `recall`, `reflect`, `getMentalModel`, and `getDocument`. It can be self-hosted with Docker or used as a cloud service.

```
1pnpm add @vectorize-io/hindsight-ai-sdk @vectorize-io/hindsight-client
```

```
1import { HindsightClient } from '@vectorize-io/hindsight-client';2import { createHindsightTools } from '@vectorize-io/hindsight-ai-sdk';3import { ToolLoopAgent, stepCountIs } from 'ai';4import { openai } from '@ai-sdk/openai';5
6const client = new HindsightClient({ baseUrl: process.env.HINDSIGHT_API_URL });7
8const agent = new ToolLoopAgent({9 model: "anthropic/claude-sonnet-4.5",10 tools: createHindsightTools({ client, bankId: 'user-123' }),11 stopWhen: stepCountIs(10),12 instructions: 'You are a helpful assistant with long-term memory.',13});14
15const result = await agent.generate({16 prompt: 'Remember that my favorite editor is Neovim',17});
```

The `bankId` identifies the memory store and is typically a user ID. In multi-user apps, call `createHindsightTools` inside your request handler so each request gets the right bank. Hindsight works with any AI SDK provider.

See the [Hindsight provider documentation](https://ai-sdk.dev/providers/community-providers/hindsight) for full setup and configuration.

**When to use memory providers**: these providers are a good fit when you want memory without building any storage infrastructure. The tradeoff is that the provider controls memory behavior, so you have less visibility into what gets stored and how it is retrieved. You also take on a dependency on an external service.

## [Custom Tool](#custom-tool)

Building your own memory tool from scratch is the most flexible approach. You control the storage format, the interface, and the retrieval logic. This requires the most upfront work but gives you full ownership of how memory works, with no provider lock-in and no external dependencies.

There are two common patterns:

* **Structured actions**: you define explicit operations (`view`, `create`, `update`, `search`) and handle structured input yourself. Safe by design since you control every operation.
* **Bash-backed**: you give the model a sandboxed bash environment to compose shell commands (`cat`, `grep`, `sed`, `echo`) for flexible memory access. More powerful but requires command validation for safety.

For a full walkthrough of implementing a custom memory tool with a bash-backed interface, AST-based command validation, and filesystem persistence, see the **[Build a Custom Memory Tool](https://ai-sdk.dev/cookbook/guides/custom-memory-tool)** recipe.

---
url: https://ai-sdk.dev/docs/agents/subagents
title: "Agents: Subagents"
description: "Delegate context-heavy tasks to specialized subagents while keeping the main agent focused."
hash: "3f7f9e05899ccf736208b6bb619c57408c5ff54691b4b150d93281c6310f2852"
crawledAt: 2026-03-07T07:59:20.129Z
depth: 2
---

A subagent is an agent that a parent agent can invoke. The parent delegates work via a tool, and the subagent executes autonomously before returning a result.

## [How It Works](#how-it-works)

1. **Define a subagent** with its own model, instructions, and tools
2. **Create a tool that calls it** for the main agent to use
3. **Subagent runs independently with its own context window**
4. **Return a result** (optionally streaming progress to the UI)
5. **Control what the model sees** using `toModelOutput` to summarize

## [When to Use Subagents](#when-to-use-subagents)

Subagents add latency and complexity. Use them when the benefits outweigh the costs:

| Use Subagents When | Avoid Subagents When |
| --- | --- |
| Tasks require exploring large amounts of tokens | Tasks are simple and focused |
| You need to parallelize independent research | Sequential processing suffices |
| Context would grow beyond model limits | Context stays manageable |
| You want to isolate tool access by capability | All tools can safely coexist |

## [Why Use Subagents?](#why-use-subagents)

### [Offloading Context-Heavy Tasks](#offloading-context-heavy-tasks)

Some tasks require exploring large amounts of information—reading files, searching codebases, or researching topics. Running these in the main agent consumes context quickly, making the agent less coherent over time.

With subagents, you can:

* Spin up a dedicated agent that uses hundreds of thousands of tokens
* Have it return only a focused summary (perhaps 1,000 tokens)
* Keep your main agent's context clean and coherent

The subagent does the heavy lifting while the main agent stays focused on orchestration.

### [Parallelizing Independent Work](#parallelizing-independent-work)

For tasks like exploring a codebase, you can spawn multiple subagents to research different areas simultaneously. Each returns a summary, and the main agent synthesizes the findings—without paying the context cost of all that exploration.

### [Specialized Orchestration](#specialized-orchestration)

A less common but valid pattern is using a main agent purely for orchestration, delegating to specialized subagents for different types of work. For example:

* An exploration subagent with read-only tools for researching codebases
* A coding subagent with file editing tools
* An integration subagent with tools for a specific platform or API

This creates a clear separation of concerns, though context offloading and parallelization are the more common motivations for subagents.

## [Basic Subagent Without Streaming](#basic-subagent-without-streaming)

The simplest subagent pattern requires no special machinery. Your main agent has a tool that calls another agent in its `execute` function:

```
1import { ToolLoopAgent, tool } from 'ai';2import { z } from 'zod';3
4// Define a subagent for research tasks5const researchSubagent = new ToolLoopAgent({6 model: "anthropic/claude-sonnet-4.5",7 instructions: `You are a research agent.8Summarize your findings in your final response.`,9 tools: {10 read: readFileTool, // defined elsewhere11 search: searchTool, // defined elsewhere12 },13});14
15// Create a tool that delegates to the subagent16const researchTool = tool({17 description: 'Research a topic or question in depth.',18 inputSchema: z.object({19 task: z.string().describe('The research task to complete'),20 }),21 execute: async ({ task }, { abortSignal }) => {22 const result = await researchSubagent.generate({23 prompt: task,24 abortSignal,25 });26 return result.text;27 },28});29
30// Main agent uses the research tool31const mainAgent = new ToolLoopAgent({32 model: "anthropic/claude-sonnet-4.5",33 instructions: 'You are a helpful assistant that can delegate research tasks.',34 tools: {35 research: researchTool,36 },37});
```

This works well when you don't need to show the subagent's progress in the UI. The tool call blocks until the subagent completes, then returns the final text response.

### [Handling Cancellation](#handling-cancellation)

When the user cancels a request, the `abortSignal` propagates to the subagent. Always pass it through to ensure cleanup:

```
1execute: async ({ task }, { abortSignal }) => {2 const result = await researchSubagent.generate({3 prompt: task,4 abortSignal, // Cancels subagent if main request is aborted5 });6 return result.text;7},
```

If you abort the signal, the subagent stops executing and throws an `AbortError`. The main agent's tool execution fails, which stops the main loop.

To avoid errors about incomplete tool calls in subsequent messages, use `convertToModelMessages` with `ignoreIncompleteToolCalls`:

```
1import { convertToModelMessages } from 'ai';2
3const modelMessages = await convertToModelMessages(messages, {4 ignoreIncompleteToolCalls: true,5});
```

This filters out tool calls that don't have corresponding results. Learn more in the [convertToModelMessages](https://ai-sdk.dev/docs/reference/ai-sdk-ui/convert-to-model-messages) reference.

## [Streaming Subagent Progress](#streaming-subagent-progress)

When you want to show incremental progress as the subagent works, use [**preliminary tool results**](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling#preliminary-tool-results). This pattern uses a generator function that yields partial updates to the UI.

### [How Preliminary Tool Results Work](#how-preliminary-tool-results-work)

Change your `execute` function from a regular function to an async generator (`async function*`). Each `yield` sends a preliminary result to the frontend:

```
1execute: async function* ({ /* input */ }) {2 //... do work...3 yield partialResult;4 //... do more work...5 yield updatedResult;6}
```

### [Building the Complete Message](#building-the-complete-message)

Each `yield` **replaces** the previous output entirely (it does not append). This means you need a way to accumulate the subagent's response into a complete message that grows over time.

The `readUIMessageStream` utility handles this. It reads each chunk from the stream and builds an ever-growing `UIMessage` containing all parts received so far:

```
1import { readUIMessageStream, tool } from 'ai';2import { z } from 'zod';3
4const researchTool = tool({5 description: 'Research a topic or question in depth.',6 inputSchema: z.object({7 task: z.string().describe('The research task to complete'),8 }),9 execute: async function* ({ task }, { abortSignal }) {10 // Start the subagent with streaming11 const result = await researchSubagent.stream({12 prompt: task,13 abortSignal,14 });15
16 // Each iteration yields a complete, accumulated UIMessage17 for await (const message of readUIMessageStream({18 stream: result.toUIMessageStream(),19 })) {20 yield message;21 }22 },23});
```

Each yielded `message` is a complete `UIMessage` containing all the subagent's parts up to that point (text, tool calls, and tool results). The frontend simply replaces its display with each new message.

## [Controlling What the Model Sees](#controlling-what-the-model-sees)

Here's where subagents become powerful for context management. The full `UIMessage` with all the subagent's work is stored in the message history and displayed in the UI. But you can control what the main agent's model actually sees using `toModelOutput`.

### [How It Works](#how-it-works-1)

The `toModelOutput` function maps the tool's output to the tokens sent to the model:

```
1const researchTool = tool({2 description: 'Research a topic or question in depth.',3 inputSchema: z.object({4 task: z.string().describe('The research task to complete'),5 }),6 execute: async function* ({ task }, { abortSignal }) {7 const result = await researchSubagent.stream({8 prompt: task,9 abortSignal,10 });11
12 for await (const message of readUIMessageStream({13 stream: result.toUIMessageStream(),14 })) {15 yield message;16 }17 },18 toModelOutput: ({ output: message }) => {19 // Extract just the final text as a summary20 const lastTextPart = message?.parts.findLast(p => p.type === 'text');21 return {22 type: 'text',23 value: lastTextPart?.text ?? 'Task completed.',24 };25 },26});
```

With this setup:

* **Users see**: The full subagent execution—every tool call, every intermediate step
* **The model sees**: Just the final summary text

The subagent might use 100,000 tokens exploring and reasoning, but the main agent only consumes the summary. This keeps the main agent coherent and focused.

### [Write Subagent Instructions for Summarization](#write-subagent-instructions-for-summarization)

For `toModelOutput` to extract a useful summary, your subagent must produce one. Add explicit instructions like this:

```
1const researchSubagent = new ToolLoopAgent({2 model: "anthropic/claude-sonnet-4.5",3 instructions: `You are a research agent. Complete the task autonomously.4
5IMPORTANT: When you have finished, write a clear summary of your findings as your final response.6This summary will be returned to the main agent, so include all relevant information.`,7 tools: {8 read: readFileTool,9 search: searchTool,10 },11});
```

Without this instruction, the subagent might not produce a comprehensive summary. It could simply say "Done", leaving `toModelOutput` with nothing useful to extract.

## [Rendering Subagents in the UI (with useChat)](#rendering-subagents-in-the-ui-with-usechat)

To display streaming progress, check the tool part's `state` and `preliminary` flag.

### [Tool Part States](#tool-part-states)

| State | Description |
| --- | --- |
| `input-streaming` | Tool input being generated |
| `input-available` | Tool ready to execute |
| `output-available` | Tool produced output (check `preliminary`) |
| `output-error` | Tool execution failed |

### [Detecting Streaming vs Complete](#detecting-streaming-vs-complete)

```
1const hasOutput = part.state === 'output-available';2const isStreaming = hasOutput && part.preliminary === true;3const isComplete = hasOutput && !part.preliminary;
```

### [Type Safety for Subagent Output](#type-safety-for-subagent-output)

Export types alongside your agents for use in UI components:

```
1import { ToolLoopAgent, InferAgentUIMessage } from 'ai';2
3export const mainAgent = new ToolLoopAgent({4 //... configuration with researchTool5});6
7// Export the main agent message type for the chat UI8export type MainAgentMessage = InferAgentUIMessage<typeof mainAgent>;
```

### [Render Messages and Subagent Output](#render-messages-and-subagent-output)

This example uses the types defined above to render both the main agent's messages and the subagent's streamed output:

```
1'use client';2
3import { useChat } from '@ai-sdk/react';4import type { MainAgentMessage } from '@/lib/agents';5
6export function Chat() {7 const { messages } = useChat<MainAgentMessage>();8
9 return (10 <div>11 {messages.map(message =>12 message.parts.map((part, i) => {13 switch (part.type) {14 case 'text':15 return <p key={i}>{part.text}</p>;16 case 'tool-research':17 return (18 <div>19 {part.state !== 'input-streaming' && (20 <div>Research: {part.input.task}</div>21 )}22 {part.state === 'output-available' && (23 <div>24 {part.output.parts.map((nestedPart, i) => {25 switch (nestedPart.type) {26 case 'text':27 return <p key={i}>{nestedPart.text}</p>;28 default:29 return null;30 }31 })}32 </div>33 )}34 </div>35 );36 default:37 return null;38 }39 }),40 )}41 </div>42 );43}
```

## [Caveats](#caveats)

### [No Tool Approvals in Subagents](#no-tool-approvals-in-subagents)

Subagent tools cannot use `needsApproval`. All tools must execute automatically without user confirmation.

### [Subagent Context is Isolated](#subagent-context-is-isolated)

Each subagent invocation starts with a fresh context window. This is one of the key benefits of subagents: they don't inherit the accumulated context from the main agent, which is exactly what allows them to do heavy exploration without bloating the main conversation.

If you need to give a subagent access to the conversation history, the `messages` are available in the tool's execute function alongside `abortSignal`:

```
1execute: async ({ task }, { abortSignal, messages }) => {2 const result = await researchSubagent.generate({3 messages: [4...messages, // The main agent's conversation history5 { role: 'user', content: task }, // The specific task for this invocation6 ],7 abortSignal,8 });9 return result.text;10},
```

Use this sparingly since passing full history defeats some of the context isolation benefits.

### [Streaming Adds Complexity](#streaming-adds-complexity)

The basic pattern (no streaming) is simpler to implement and debug. Only add streaming when you need to show real-time progress in the UI.