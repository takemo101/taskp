---
url: https://ai-sdk.dev/
title: "AI SDK"
description: "The AI Toolkit for TypeScript, from the creators of Next.js."
hash: "baaaea13f34121491b16d4fc82ada6aedc154136a814badf50be93a68304e136"
crawledAt: 2026-03-07T07:56:06.421Z
depth: 1
---

Vercel's @aisdk is insanely good. Docs are fantastic. Great abstractions where you want them, doesn't force unnecessary ones, and lets you get under the hood where appropriate. Solves the hard stuff (stream parsing, tool streaming, multi-turn tool execution, error handling and healing/recovery) without forcing you into dumb patterns

It just works, it's fantastic software and delightful to use. The team ships insanely fast, and has turned PRs from me around in like 2 days, and frequently ships requested features in < 1w

---
url: https://ai-sdk.dev/docs
title: "AI SDK by Vercel"
description: "The AI SDK is the TypeScript toolkit for building AI applications and agents with React, Next.js, Vue, Svelte, Node.js, and more."
hash: "f86b7234df3ba52ae559fdcd0c1c9640a66380fff19801158c304f1928058ab4"
crawledAt: 2026-03-07T07:56:12.036Z
depth: 2
---

AI SDK by Vercel

The AI SDK is the TypeScript toolkit designed to help developers build AI-powered applications and agents with React, Next.js, Vue, Svelte, Node.js, and more.

## [Why use the AI SDK?](#why-use-the-ai-sdk)

Integrating large language models (LLMs) into applications is complicated and heavily dependent on the specific model provider you use.

The AI SDK standardizes integrating artificial intelligence (AI) models across [supported providers](https://ai-sdk.dev/docs/foundations/providers-and-models). This enables developers to focus on building great AI applications, not waste time on technical details.

For example, here’s how you can generate text with various models using the AI SDK:

```
1import { generateText } from "ai";2
3const { text } = await generateText({4 model: "anthropic/claude-sonnet-4.5",5 prompt: "What is love?",6});
```

Love is a complex and multifaceted emotion that can be felt and expressed in many different ways. It involves deep affection, care, compassion, and connection towards another person or thing.

The AI SDK has two main libraries:

* **[AI SDK Core](https://ai-sdk.dev/docs/ai-sdk-core):** A unified API for generating text, structured objects, tool calls, and building agents with LLMs.
* **[AI SDK UI](https://ai-sdk.dev/docs/ai-sdk-ui):** A set of framework-agnostic hooks for quickly building chat and generative user interface.

## [Model Providers](#model-providers)

The AI SDK supports [multiple model providers](https://ai-sdk.dev/providers).

## [Templates](#templates)

We've built some [templates](https://vercel.com/templates?type=ai) that include AI SDK integrations for different use cases, providers, and frameworks. You can use these templates to get started with your AI-powered application.

### [Starter Kits](#starter-kits)

### [Feature Exploration](#feature-exploration)

### [Frameworks](#frameworks)

### [Generative UI](#generative-ui)

### [Security](#security)

## [Join our Community](#join-our-community)

If you have questions about anything related to the AI SDK, you're always welcome to ask our community on [the Vercel Community](https://community.vercel.com/c/ai-sdk/62).

## [`llms.txt` (for Cursor, Windsurf, Copilot, Claude etc.)](#llmstxt-for-cursor-windsurf-copilot-claude-etc)

You can access the entire AI SDK documentation in Markdown format at [ai-sdk.dev/llms.txt](https://ai-sdk.dev/llms.txt). This can be used to ask any LLM (assuming it has a big enough context window) questions about the AI SDK based on the most up-to-date documentation.

### [Example Usage](#example-usage)

For instance, to prompt an LLM with questions about the AI SDK:

1. Copy the documentation contents from [ai-sdk.dev/llms.txt](https://ai-sdk.dev/llms.txt)
2. Use the following prompt format:

```
1Documentation:2{paste documentation here}3---4Based on the above documentation, answer the following:5{your question}
```

---
url: https://ai-sdk.dev/cookbook
title: "AI SDK Cookbook"
description: "Open-source collection of examples, guides, and templates for building with the AI SDK."
hash: "db02c9774c591397dc0eb928d57966080a26362a5e56062c3cc86539ecaf283e"
crawledAt: 2026-03-07T07:56:17.359Z
depth: 2
---

An open-source collection of recipes, guides, and templates for building with the AI SDK.

## Recipes

Next.js

streaming

11

tool use

5

chat

4

agent

3

chatbot

2

multi-modal

2

pdf

2

agents

2

tools

2

multimodal

2

structured data

2

rag

1

embeddings

1

database

1

retrieval

1

memory

1

images

1

vision

1

image generation

1

caching

1

middleware

1

markdown

1

mcp

1

useChat

1

context

1

generative user interface

1

## Templates

We've built some [templates](https://vercel.com/templates?type=ai) that include AI SDK integrations for different use cases, providers, and frameworks. You can use these templates to get started with your AI-powered application.

### Starter Kits

### Feature Exploration

### Frameworks

### Generative UI

### Security

---
url: https://ai-sdk.dev/providers
title: "AI SDK Providers"
description: "Learn how to use AI SDK providers."
hash: "a1565e521e4e8859e50d468c5017578042c36037dbc9460d8d0589c0c552f1c6"
crawledAt: 2026-03-07T07:56:23.619Z
depth: 2
---

[xAI Grok](https://ai-sdk.dev/providers/ai-sdk-providers/xai)`grok-4-fast-reasoning`[xAI Grok](https://ai-sdk.dev/providers/ai-sdk-providers/xai)`grok-4`[xAI Grok](https://ai-sdk.dev/providers/ai-sdk-providers/xai)`grok-3`[xAI Grok](https://ai-sdk.dev/providers/ai-sdk-providers/xai)`grok-3-mini`[xAI Grok](https://ai-sdk.dev/providers/ai-sdk-providers/xai)`grok-2-vision-1212`[Vercel](https://ai-sdk.dev/providers/ai-sdk-providers/vercel)`v0-1.0-md`[OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai)`gpt-5.2-pro`[OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai)`gpt-5.2`[OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai)`gpt-5.1`[OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai)`gpt-5.1-codex`[OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai)`gpt-5`[OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai)`gpt-5-mini`[OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai)`gpt-4.1`[OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai)`gpt-4.1-mini`[OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai)`gpt-4o`[OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai)`gpt-4o-mini`[Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)`claude-opus-4-6`[Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)`claude-sonnet-4-6`[Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)`claude-opus-4-5`[Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)`claude-sonnet-4-5`[Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)`claude-haiku-4-5`[Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)`claude-opus-4-1`[Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)`claude-sonnet-4-0`[Google Generative AI](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai)`gemini-3.1-pro-preview`[Google Generative AI](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai)`gemini-3-pro-preview`[Google Generative AI](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai)`gemini-2.5-pro`[Google Generative AI](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai)`gemini-2.5-flash`[Google Vertex](https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex)`gemini-3.1-pro-preview`[Google Vertex](https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex)`gemini-3-pro-preview`[Google Vertex](https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex)`gemini-2.5-pro`[Google Vertex](https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex)`gemini-2.5-flash`[Mistral](https://ai-sdk.dev/providers/ai-sdk-providers/mistral)`pixtral-large-latest`[Mistral](https://ai-sdk.dev/providers/ai-sdk-providers/mistral)`mistral-large-latest`[Mistral](https://ai-sdk.dev/providers/ai-sdk-providers/mistral)`magistral-medium-2506`[Mistral](https://ai-sdk.dev/providers/ai-sdk-providers/mistral)`magistral-small-2506`[Mistral](https://ai-sdk.dev/providers/ai-sdk-providers/mistral)`mistral-small-latest`[Mistral](https://ai-sdk.dev/providers/ai-sdk-providers/mistral)`ministral-8b-latest`[Cohere](https://ai-sdk.dev/providers/ai-sdk-providers/cohere)`command-a-03-2025`[Cohere](https://ai-sdk.dev/providers/ai-sdk-providers/cohere)`command-a-reasoning-08-2025`[Cohere](https://ai-sdk.dev/providers/ai-sdk-providers/cohere)`command-r-plus`[Cohere](https://ai-sdk.dev/providers/ai-sdk-providers/cohere)`command-r`[DeepSeek](https://ai-sdk.dev/providers/ai-sdk-providers/deepseek)`deepseek-chat`[DeepSeek](https://ai-sdk.dev/providers/ai-sdk-providers/deepseek)`deepseek-reasoner`[Moonshot AI](https://ai-sdk.dev/providers/ai-sdk-providers/moonshotai)`kimi-k2.5`[Moonshot AI](https://ai-sdk.dev/providers/ai-sdk-providers/moonshotai)`kimi-k2-thinking`[Groq](https://ai-sdk.dev/providers/ai-sdk-providers/groq)`meta-llama/llama-4-scout-17b-16e-instruct`[Groq](https://ai-sdk.dev/providers/ai-sdk-providers/groq)`llama-3.3-70b-versatile`[Groq](https://ai-sdk.dev/providers/ai-sdk-providers/groq)`deepseek-r1-distill-llama-70b`[Groq](https://ai-sdk.dev/providers/ai-sdk-providers/groq)`qwen-qwq-32b`[Groq](https://ai-sdk.dev/providers/ai-sdk-providers/groq)`openai/gpt-oss-120b`[Together AI](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai)`meta-llama/Meta-Llama-3.3-70B-Instruct-Turbo`[Together AI](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai)`Qwen/Qwen2.5-72B-Instruct-Turbo`[Together AI](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai)`deepseek-ai/DeepSeek-V3`[Together AI](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai)`mistralai/Mixtral-8x22B-Instruct-v0.1`[Fireworks](https://ai-sdk.dev/providers/ai-sdk-providers/fireworks)`accounts/fireworks/models/deepseek-r1`[Fireworks](https://ai-sdk.dev/providers/ai-sdk-providers/fireworks)`accounts/fireworks/models/deepseek-v3`[Fireworks](https://ai-sdk.dev/providers/ai-sdk-providers/fireworks)`accounts/fireworks/models/llama-v3p3-70b-instruct`[Fireworks](https://ai-sdk.dev/providers/ai-sdk-providers/fireworks)`accounts/fireworks/models/qwen2-vl-72b-instruct`[Alibaba](https://ai-sdk.dev/providers/ai-sdk-providers/alibaba)`qwen3-max`[Alibaba](https://ai-sdk.dev/providers/ai-sdk-providers/alibaba)`qwen-plus`[DeepInfra](https://ai-sdk.dev/providers/ai-sdk-providers/deepinfra)`meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8`[DeepInfra](https://ai-sdk.dev/providers/ai-sdk-providers/deepinfra)`meta-llama/Llama-4-Scout-17B-16E-Instruct`[DeepInfra](https://ai-sdk.dev/providers/ai-sdk-providers/deepinfra)`meta-llama/Llama-3.3-70B-Instruct`[DeepInfra](https://ai-sdk.dev/providers/ai-sdk-providers/deepinfra)`deepseek-ai/DeepSeek-V3`[DeepInfra](https://ai-sdk.dev/providers/ai-sdk-providers/deepinfra)`deepseek-ai/DeepSeek-R1`[DeepInfra](https://ai-sdk.dev/providers/ai-sdk-providers/deepinfra)`Qwen/QwQ-32B`[Cerebras](https://ai-sdk.dev/providers/ai-sdk-providers/cerebras)`llama3.3-70b`[Cerebras](https://ai-sdk.dev/providers/ai-sdk-providers/cerebras)`gpt-oss-120b`[Cerebras](https://ai-sdk.dev/providers/ai-sdk-providers/cerebras)`qwen-3-32b`[Hugging Face](https://ai-sdk.dev/providers/ai-sdk-providers/huggingface)`meta-llama/Llama-3.1-8B-Instruct`[Hugging Face](https://ai-sdk.dev/providers/ai-sdk-providers/huggingface)`moonshotai/Kimi-K2-Instruct`[Baseten](https://ai-sdk.dev/providers/ai-sdk-providers/baseten)`Qwen/Qwen3-235B-A22B-Instruct-2507`[Baseten](https://ai-sdk.dev/providers/ai-sdk-providers/baseten)`deepseek-ai/DeepSeek-V3.1`[Baseten](https://ai-sdk.dev/providers/ai-sdk-providers/baseten)`moonshotai/Kimi-K2-Instruct-0905`

---
url: https://ai-sdk.dev/tools-registry
title: "AI SDK Tools Registry"
description: "Add powerful functionality to your agents with just a few lines of code."
hash: "aa0b45e054e0d1f8242ea146d9b124a830d3d3c3fbe82636097340c6f39c00dd"
crawledAt: 2026-03-07T07:56:28.886Z
depth: 2
---

Add powerful functionality to your agents with just a few lines of code. These pre-made tools provide everything from web search to extraction and more.

[

Code Execution

Execute Python code in a sandboxed environment using Vercel Sandbox. Run calculations, data processing, and other computational tasks safely in an isolated environment with Python 3.13.

code-executionsandbox

](https://ai-sdk.dev/tools-registry/code-execution)[

Exa

Exa is a web search API that adds web search capabilities to your LLMs. Exa can search the web for code docs, current information, news, articles, and a lot more. Exa performs real-time web searches and can get page content from specific URLs. Add Exa web search tool to your LLMs in just a few lines of code.

searchwebextraction

](https://ai-sdk.dev/tools-registry/exa)[

Parallel

Parallel gives AI agents best-in-class tools to search and extract context from the web. Web results returned by Parallel are compressed for optimal token efficiency at inference time.

searchwebextraction

](https://ai-sdk.dev/tools-registry/parallel)[

ctx-zip

Transform MCP tools and AI SDK tools into code, write it to a Vercel sandbox file system and have the agent import the tools, write code, and execute it.

code-executionsandboxmcpcode-mode

](https://ai-sdk.dev/tools-registry/ctx-zip)[

Perplexity Search

Search the web with real-time results and advanced filtering powered by Perplexity's Search API. Provides ranked search results with domain, language, date range, and recency filters. Supports multi-query searches and regional search results.

searchweb

](https://ai-sdk.dev/tools-registry/perplexity-search)[

Tavily

Tavily is a web intelligence platform offering real-time web search optimized for AI applications. Tavily provides comprehensive web research capabilities including search, content extraction, website crawling, and site mapping to power AI agents with current information.

searchextractcrawl

](https://ai-sdk.dev/tools-registry/tavily)[

Firecrawl

Firecrawl tools for the AI SDK. Web scraping, search, crawling, and data extraction for AI applications. Scrape any website into clean markdown, search the web, crawl entire sites, and extract structured data.

scrapingsearchcrawlingextractionweb

](https://ai-sdk.dev/tools-registry/firecrawl)[

Amazon Bedrock AgentCore

Fully managed Browser and Code Interpreter tools for AI agents. Browser is a fast and secure cloud-based runtime for interacting with web applications, filling forms, navigating websites, and extracting information. Code Interpreter provides an isolated sandbox for executing Python, JavaScript, and TypeScript code to solve complex tasks.

code-executionbrowser-automationsandbox

](https://ai-sdk.dev/tools-registry/bedrock-agentcore)[

Superagent

AI security guardrails for your LLMs. Protect your AI apps from prompt injection, redact PII/PHI (SSNs, emails, phone numbers), and verify claims against source materials. Add security tools to your LLMs in just a few lines of code.

securityguardrailspiiprompt-injectionverification

](https://ai-sdk.dev/tools-registry/superagent)[

Tako Search

Search Tako's knowledge base for data visualizations, insights, and well-sourced information with charts and analytics.

searchdatavisualizationanalytics

](https://ai-sdk.dev/tools-registry/tako-search)[

Valyu

Valyu provides powerful search tools for AI agents. Web search for real-time information, plus specialized domain-specific searchtools: financeSearch (stock prices, earnings, income statements, cash flows, etc), paperSearch (full-text PubMed, arXiv, bioRxiv, medRxiv), bioSearch (clinical trials, FDA drug labels, PubMed, medRxiv, bioRxiv), patentSearch (USPTO patents), secSearch (10-k/10-Q/8-k), economicsSearch (BLS, FRED, World Bank data), and companyResearch (comprehensive company research reports).

searchwebdomain-search

](https://ai-sdk.dev/tools-registry/valyu)[

Airweave

Airweave is an open-source platform that makes any app searchable for your agent. Sync and search across 35+ data sources (Notion, Slack, Google Drive, databases, and more) with semantic search. Add unified search across all your connected data to your AI applications in just a few lines of code.

searchragdata-sourcessemantic-search

](https://ai-sdk.dev/tools-registry/airweave)[

bash-tool

Provides bash, readFile, and writeFile tools for AI agents. Supports @vercel/sandbox for full VM isolation.

bashfile-systemsandboxcode-execution

](https://ai-sdk.dev/tools-registry/bash-tool)

## Build your own tools

Package your functionality and share it with others. Build custom tools that anyone can add to their agent in just a few lines of code.

[View template](https://github.com/vercel-labs/ai-sdk-tool-as-package-template)[Submit your tool](https://github.com/vercel/ai/blob/main/content/tools-registry/registry.ts)

---
url: https://ai-sdk.dev/playground
title: "AI Playground | Compare top AI models side-by-side"
description: "Chat and compare OpenAI GPT, Anthropic Claude, Google Gemini, Llama, Mistral, and more."
hash: "e3438ce33343c3aa1c5040429bf2219223b7b464714d276fd48c6b597140ec7a"
crawledAt: 2026-03-07T07:56:34.694Z
depth: 2
---

OpenAI/GPT-5.2

GPT-5.2 is OpenAI's best general-purpose model, part of the GPT-5 flagship model family. It's their most intelligent model yet for both general and agentic tasks.

---
url: https://ai-sdk.dev/getting-started
title: "AI SDK"
description: "The AI SDK is the TypeScript toolkit designed to help developers build AI-powered applications with React, Next.js, Vue, Svelte, Node.js, and more."
hash: "8dea714e13ca1c269a3cfe38bb218f432d97230bbaaefd3b93e041f4f7448a65"
crawledAt: 2026-03-07T07:56:39.939Z
depth: 2
---

Deploy and Scale AI Apps with Vercel

Deliver AI experiences globally with one push.

Trusted by industry leaders:

* OpenAI
* Photoroom
* ![leonardo-ai Logo](https://ai-sdk.dev/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fleonardo-ai-light.c7c240a2.svg&w=384&q=75&dpl=dpl_m9N5rp3hnJw2StkSiCk6WZjEEEC1)![leonardo-ai Logo](https://ai-sdk.dev/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fleonardo-ai-dark.98769390.svg&w=384&q=75&dpl=dpl_m9N5rp3hnJw2StkSiCk6WZjEEEC1)
* ![zapier Logo](https://ai-sdk.dev/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fzapier-light.5dde0542.svg&w=256&q=75&dpl=dpl_m9N5rp3hnJw2StkSiCk6WZjEEEC1)![zapier Logo](https://ai-sdk.dev/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fzapier-dark.828a0308.svg&w=256&q=75&dpl=dpl_m9N5rp3hnJw2StkSiCk6WZjEEEC1)

---
url: https://ai-sdk.dev/showcase
title: "AI SDK"
description: "The AI SDK is the TypeScript toolkit designed to help developers build AI-powered applications with React, Next.js, Vue, Svelte, Node.js, and more."
hash: "0fc937905df1536d83a4594cb7c1ff33db493a250a41da4f89f444ddd15339db"
crawledAt: 2026-03-07T07:57:06.772Z
depth: 2
---

Check out these applications built with the AI SDK.

Are you using the AI SDK?