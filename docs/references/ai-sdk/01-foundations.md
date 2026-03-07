---
url: https://ai-sdk.dev/docs/introduction
title: "AI SDK by Vercel"
description: "The AI SDK is the TypeScript toolkit for building AI applications and agents with React, Next.js, Vue, Svelte, Node.js, and more."
hash: "f86b7234df3ba52ae559fdcd0c1c9640a66380fff19801158c304f1928058ab4"
crawledAt: 2026-03-07T07:55:59.076Z
depth: 0
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
url: https://ai-sdk.dev/docs/foundations/providers-and-models
title: "Foundations: Providers and Models"
description: "Learn about the providers and models available in the AI SDK."
hash: "c95ee2b6166378bbf47f67311ca7f1815bc79735879096b2b4af470a1bc9d0c2"
crawledAt: 2026-03-07T07:56:45.408Z
depth: 2
---

Companies such as OpenAI and Anthropic (providers) offer access to a range of large language models (LLMs) with differing strengths and capabilities through their own APIs.

Each provider typically has its own unique method for interfacing with their models, complicating the process of switching providers and increasing the risk of vendor lock-in.

To solve these challenges, AI SDK Core offers a standardized approach to interacting with LLMs through a [language model specification](https://github.com/vercel/ai/tree/main/packages/provider/src/language-model/v3) that abstracts differences between providers. This unified interface allows you to switch between providers with ease while using the same API for all providers.

Here is an overview of the AI SDK Provider Architecture:

![](https://ai-sdk.dev/_next/image?url=%2Fimages%2Fai-sdk-diagram.png&w=1920&q=75&dpl=dpl_m9N5rp3hnJw2StkSiCk6WZjEEEC1)![](https://ai-sdk.dev/_next/image?url=%2Fimages%2Fai-sdk-diagram-dark.png&w=1920&q=75&dpl=dpl_m9N5rp3hnJw2StkSiCk6WZjEEEC1)

## [AI SDK Providers](#ai-sdk-providers)

The AI SDK comes with a wide range of providers that you can use to interact with different language models:

* [xAI Grok Provider](https://ai-sdk.dev/providers/ai-sdk-providers/xai) (`@ai-sdk/xai`)
* [OpenAI Provider](https://ai-sdk.dev/providers/ai-sdk-providers/openai) (`@ai-sdk/openai`)
* [Azure OpenAI Provider](https://ai-sdk.dev/providers/ai-sdk-providers/azure) (`@ai-sdk/azure`)
* [Anthropic Provider](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic) (`@ai-sdk/anthropic`)
* [Amazon Bedrock Provider](https://ai-sdk.dev/providers/ai-sdk-providers/amazon-bedrock) (`@ai-sdk/amazon-bedrock`)
* [Google Generative AI Provider](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai) (`@ai-sdk/google`)
* [Google Vertex Provider](https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex) (`@ai-sdk/google-vertex`)
* [Mistral Provider](https://ai-sdk.dev/providers/ai-sdk-providers/mistral) (`@ai-sdk/mistral`)
* [Together.ai Provider](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai) (`@ai-sdk/togetherai`)
* [Cohere Provider](https://ai-sdk.dev/providers/ai-sdk-providers/cohere) (`@ai-sdk/cohere`)
* [Fireworks Provider](https://ai-sdk.dev/providers/ai-sdk-providers/fireworks) (`@ai-sdk/fireworks`)
* [DeepInfra Provider](https://ai-sdk.dev/providers/ai-sdk-providers/deepinfra) (`@ai-sdk/deepinfra`)
* [DeepSeek Provider](https://ai-sdk.dev/providers/ai-sdk-providers/deepseek) (`@ai-sdk/deepseek`)
* [Cerebras Provider](https://ai-sdk.dev/providers/ai-sdk-providers/cerebras) (`@ai-sdk/cerebras`)
* [Groq Provider](https://ai-sdk.dev/providers/ai-sdk-providers/groq) (`@ai-sdk/groq`)
* [Perplexity Provider](https://ai-sdk.dev/providers/ai-sdk-providers/perplexity) (`@ai-sdk/perplexity`)
* [ElevenLabs Provider](https://ai-sdk.dev/providers/ai-sdk-providers/elevenlabs) (`@ai-sdk/elevenlabs`)
* [LMNT Provider](https://ai-sdk.dev/providers/ai-sdk-providers/lmnt) (`@ai-sdk/lmnt`)
* [Hume Provider](https://ai-sdk.dev/providers/ai-sdk-providers/hume) (`@ai-sdk/hume`)
* [Rev.ai Provider](https://ai-sdk.dev/providers/ai-sdk-providers/revai) (`@ai-sdk/revai`)
* [Deepgram Provider](https://ai-sdk.dev/providers/ai-sdk-providers/deepgram) (`@ai-sdk/deepgram`)
* [Gladia Provider](https://ai-sdk.dev/providers/ai-sdk-providers/gladia) (`@ai-sdk/gladia`)
* [AssemblyAI Provider](https://ai-sdk.dev/providers/ai-sdk-providers/assemblyai) (`@ai-sdk/assemblyai`)
* [Baseten Provider](https://ai-sdk.dev/providers/ai-sdk-providers/baseten) (`@ai-sdk/baseten`)

You can also use the [OpenAI Compatible provider](https://ai-sdk.dev/providers/openai-compatible-providers) with OpenAI-compatible APIs:

* [LM Studio](https://ai-sdk.dev/providers/openai-compatible-providers/lmstudio)
* [Heroku](https://ai-sdk.dev/providers/openai-compatible-providers/heroku)

Our [language model specification](https://github.com/vercel/ai/tree/main/packages/provider/src/language-model/v3) is published as an open-source package, which you can use to create [custom providers](https://ai-sdk.dev/providers/community-providers/custom-providers).

The open-source community has created the following providers:

* [Ollama Provider](https://ai-sdk.dev/providers/community-providers/ollama) (`ollama-ai-provider`)
* [FriendliAI Provider](https://ai-sdk.dev/providers/community-providers/friendliai) (`@friendliai/ai-provider`)
* [Portkey Provider](https://ai-sdk.dev/providers/community-providers/portkey) (`@portkey-ai/vercel-provider`)
* [Cloudflare Workers AI Provider](https://ai-sdk.dev/providers/community-providers/cloudflare-workers-ai) (`workers-ai-provider`)
* [OpenRouter Provider](https://ai-sdk.dev/providers/community-providers/openrouter) (`@openrouter/ai-sdk-provider`)
* [Apertis Provider](https://ai-sdk.dev/providers/community-providers/apertis) (`@apertis/ai-sdk-provider`)
* [Aihubmix Provider](https://ai-sdk.dev/providers/community-providers/aihubmix) (`@aihubmix/ai-sdk-provider`)
* [Requesty Provider](https://ai-sdk.dev/providers/community-providers/requesty) (`@requesty/ai-sdk`)
* [Crosshatch Provider](https://ai-sdk.dev/providers/community-providers/crosshatch) (`@crosshatch/ai-provider`)
* [Mixedbread Provider](https://ai-sdk.dev/providers/community-providers/mixedbread) (`mixedbread-ai-provider`)
* [Voyage AI Provider](https://ai-sdk.dev/providers/community-providers/voyage-ai) (`voyage-ai-provider`)
* [Mem0 Provider](https://ai-sdk.dev/providers/community-providers/mem0) (`@mem0/vercel-ai-provider`)
* [Letta Provider](https://ai-sdk.dev/providers/community-providers/letta) (`@letta-ai/vercel-ai-sdk-provider`)
* [Hindsight Provider](https://ai-sdk.dev/providers/community-providers/hindsight) (`@vectorize-io/hindsight-ai-sdk`)
* [Supermemory Provider](https://ai-sdk.dev/providers/community-providers/supermemory) (`@supermemory/tools`)
* [Spark Provider](https://ai-sdk.dev/providers/community-providers/spark) (`spark-ai-provider`)
* [AnthropicVertex Provider](https://ai-sdk.dev/providers/community-providers/anthropic-vertex-ai) (`anthropic-vertex-ai`)
* [LangDB Provider](https://ai-sdk.dev/providers/community-providers/langdb) (`@langdb/vercel-provider`)
* [Dify Provider](https://ai-sdk.dev/providers/community-providers/dify) (`dify-ai-provider`)
* [Sarvam Provider](https://ai-sdk.dev/providers/community-providers/sarvam) (`sarvam-ai-provider`)
* [Claude Code Provider](https://ai-sdk.dev/providers/community-providers/claude-code) (`ai-sdk-provider-claude-code`)
* [Browser AI Provider](https://ai-sdk.dev/providers/community-providers/browser-ai) (`browser-ai`)
* [Gemini CLI Provider](https://ai-sdk.dev/providers/community-providers/gemini-cli) (`ai-sdk-provider-gemini-cli`)
* [A2A Provider](https://ai-sdk.dev/providers/community-providers/a2a) (`a2a-ai-provider`)
* [SAP-AI Provider](https://ai-sdk.dev/providers/community-providers/sap-ai) (`@mymediset/sap-ai-provider`)
* [AI/ML API Provider](https://ai-sdk.dev/providers/community-providers/aimlapi) (`@ai-ml.api/aimlapi-vercel-ai`)
* [MCP Sampling Provider](https://ai-sdk.dev/providers/community-providers/mcp-sampling) (`@mcpc-tech/mcp-sampling-ai-provider`)
* [ACP Provider](https://ai-sdk.dev/providers/community-providers/acp) (`@mcpc-tech/acp-ai-provider`)
* [OpenCode Provider](https://ai-sdk.dev/providers/community-providers/opencode-sdk) (`ai-sdk-provider-opencode-sdk`)
* [Codex CLI Provider](https://ai-sdk.dev/providers/community-providers/codex-cli) (`ai-sdk-provider-codex-cli`)
* [Soniox Provider](https://ai-sdk.dev/providers/community-providers/soniox) (`@soniox/vercel-ai-sdk-provider`)
* [Zhipu (Z.AI) Provider](https://ai-sdk.dev/providers/community-providers/zhipu) (`zhipu-ai-provider`)
* [OLLM Provider](https://ai-sdk.dev/providers/community-providers/ollm) (`@ofoundation/ollm`)

## [Self-Hosted Models](#self-hosted-models)

You can access self-hosted models with the following providers:

* [Ollama Provider](https://ai-sdk.dev/providers/community-providers/ollama)
* [LM Studio](https://ai-sdk.dev/providers/openai-compatible-providers/lmstudio)
* [Baseten](https://ai-sdk.dev/providers/ai-sdk-providers/baseten)
* [Browser AI](https://ai-sdk.dev/providers/community-providers/browser-ai)

Additionally, any self-hosted provider that supports the OpenAI specification can be used with the [OpenAI Compatible Provider](https://ai-sdk.dev/providers/openai-compatible-providers).

## [Model Capabilities](#model-capabilities)

The AI providers support different language models with various capabilities. Here are the capabilities of popular models:

| Provider | Model | Image Input | Object Generation | Tool Usage | Tool Streaming |
| --- | --- | --- | --- | --- | --- |
| [xAI Grok](https://ai-sdk.dev/providers/ai-sdk-providers/xai) | `grok-4` | | | | |
| [xAI Grok](https://ai-sdk.dev/providers/ai-sdk-providers/xai) | `grok-3` | | | | |
| [xAI Grok](https://ai-sdk.dev/providers/ai-sdk-providers/xai) | `grok-3-mini` | | | | |
| [xAI Grok](https://ai-sdk.dev/providers/ai-sdk-providers/xai) | `grok-2-vision-1212` | | | | |
| [Vercel](https://ai-sdk.dev/providers/ai-sdk-providers/vercel) | `v0-1.0-md` | | | | |
| [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai) | `gpt-5.2-pro` | | | | |
| [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai) | `gpt-5.2-chat-latest` | | | | |
| [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai) | `gpt-5.2` | | | | |
| [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai) | `gpt-5` | | | | |
| [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai) | `gpt-5-mini` | | | | |
| [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai) | `gpt-5-nano` | | | | |
| [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai) | `gpt-5.1-chat-latest` | | | | |
| [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai) | `gpt-5.1-codex-mini` | | | | |
| [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai) | `gpt-5.1-codex` | | | | |
| [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai) | `gpt-5.1` | | | | |
| [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai) | `gpt-5-codex` | | | | |
| [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai) | `gpt-5-chat-latest` | | | | |
| [Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic) | `claude-opus-4-6` | | | | |
| [Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic) | `claude-sonnet-4-6` | | | | |
| [Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic) | `claude-opus-4-5` | | | | |
| [Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic) | `claude-opus-4-1` | | | | |
| [Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic) | `claude-opus-4-0` | | | | |
| [Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic) | `claude-sonnet-4-0` | | | | |
| [Mistral](https://ai-sdk.dev/providers/ai-sdk-providers/mistral) | `pixtral-large-latest` | | | | |
| [Mistral](https://ai-sdk.dev/providers/ai-sdk-providers/mistral) | `mistral-large-latest` | | | | |
| [Mistral](https://ai-sdk.dev/providers/ai-sdk-providers/mistral) | `mistral-medium-latest` | | | | |
| [Mistral](https://ai-sdk.dev/providers/ai-sdk-providers/mistral) | `mistral-medium-2505` | | | | |
| [Mistral](https://ai-sdk.dev/providers/ai-sdk-providers/mistral) | `mistral-small-latest` | | | | |
| [Mistral](https://ai-sdk.dev/providers/ai-sdk-providers/mistral) | `pixtral-12b-2409` | | | | |
| [DeepSeek](https://ai-sdk.dev/providers/ai-sdk-providers/deepseek) | `deepseek-chat` | | | | |
| [DeepSeek](https://ai-sdk.dev/providers/ai-sdk-providers/deepseek) | `deepseek-reasoner` | | | | |
| [Cerebras](https://ai-sdk.dev/providers/ai-sdk-providers/cerebras) | `llama3.1-8b` | | | | |
| [Cerebras](https://ai-sdk.dev/providers/ai-sdk-providers/cerebras) | `llama3.1-70b` | | | | |
| [Cerebras](https://ai-sdk.dev/providers/ai-sdk-providers/cerebras) | `llama3.3-70b` | | | | |
| [Groq](https://ai-sdk.dev/providers/ai-sdk-providers/groq) | `meta-llama/llama-4-scout-17b-16e-instruct` | | | | |
| [Groq](https://ai-sdk.dev/providers/ai-sdk-providers/groq) | `llama-3.3-70b-versatile` | | | | |
| [Groq](https://ai-sdk.dev/providers/ai-sdk-providers/groq) | `llama-3.1-8b-instant` | | | | |
| [Groq](https://ai-sdk.dev/providers/ai-sdk-providers/groq) | `mixtral-8x7b-32768` | | | | |
| [Groq](https://ai-sdk.dev/providers/ai-sdk-providers/groq) | `gemma2-9b-it` | | | | |

This table is not exhaustive. Additional models can be found in the provider documentation pages and on the provider websites.

---
url: https://ai-sdk.dev/docs/foundations
title: "Foundations"
description: "A section that covers foundational knowledge around LLMs and concepts crucial to the AI SDK"
hash: "8dea714e13ca1c269a3cfe38bb218f432d97230bbaaefd3b93e041f4f7448a65"
crawledAt: 2026-03-07T07:57:12.026Z
depth: 1
---

Deploy and Scale AI Apps with Vercel

Deliver AI experiences globally with one push.

Trusted by industry leaders:

* OpenAI
* Photoroom
* ![leonardo-ai Logo](https://ai-sdk.dev/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fleonardo-ai-light.c7c240a2.svg&w=384&q=75&dpl=dpl_m9N5rp3hnJw2StkSiCk6WZjEEEC1)![leonardo-ai Logo](https://ai-sdk.dev/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fleonardo-ai-dark.98769390.svg&w=384&q=75&dpl=dpl_m9N5rp3hnJw2StkSiCk6WZjEEEC1)
* ![zapier Logo](https://ai-sdk.dev/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fzapier-light.5dde0542.svg&w=256&q=75&dpl=dpl_m9N5rp3hnJw2StkSiCk6WZjEEEC1)![zapier Logo](https://ai-sdk.dev/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fzapier-dark.828a0308.svg&w=256&q=75&dpl=dpl_m9N5rp3hnJw2StkSiCk6WZjEEEC1)

---
url: https://ai-sdk.dev/docs/foundations/overview
title: "Foundations: Overview"
description: "An overview of foundational concepts critical to understanding the AI SDK"
hash: "bd1b82b1c012515cfb007d017f6beaf42838cb771b12ab5ee3ae4b83af7ba7f9"
crawledAt: 2026-03-07T07:57:17.251Z
depth: 2
---

This page is a beginner-friendly introduction to high-level artificial intelligence (AI) concepts. To dive right into implementing the AI SDK, feel free to skip ahead to our [quickstarts](https://ai-sdk.dev/docs/getting-started) or learn about our [supported models and providers](https://ai-sdk.dev/docs/foundations/providers-and-models).

The AI SDK standardizes integrating artificial intelligence (AI) models across [supported providers](https://ai-sdk.dev/docs/foundations/providers-and-models). This enables developers to focus on building great AI applications, not waste time on technical details.

For example, here’s how you can generate text with various models using the AI SDK:

```
1import { generateText } from "ai";2
3const { text } = await generateText({4 model: "anthropic/claude-sonnet-4.5",5 prompt: "What is love?",6});
```

Love is a complex and multifaceted emotion that can be felt and expressed in many different ways. It involves deep affection, care, compassion, and connection towards another person or thing.

To effectively leverage the AI SDK, it helps to familiarize yourself with the following concepts:

## [Generative Artificial Intelligence](#generative-artificial-intelligence)

**Generative artificial intelligence** refers to models that predict and generate various types of outputs (such as text, images, or audio) based on what’s statistically likely, pulling from patterns they’ve learned from their training data. For example:

* Given a photo, a generative model can generate a caption.
* Given an audio file, a generative model can generate a transcription.
* Given a text description, a generative model can generate an image.

## [Large Language Models](#large-language-models)

A **large language model (LLM)** is a subset of generative models focused primarily on **text**. An LLM takes a sequence of words as input and aims to predict the most likely sequence to follow. It assigns probabilities to potential next sequences and then selects one. The model continues to generate sequences until it meets a specified stopping criterion.

LLMs learn by training on massive collections of written text, which means they will be better suited to some use cases than others. For example, a model trained on GitHub data would understand the probabilities of sequences in source code particularly well.

However, it's crucial to understand LLMs' limitations. When asked about less known or absent information, like the birthday of a personal relative, LLMs might "hallucinate" or make up information. It's essential to consider how well-represented the information you need is in the model.

## [Embedding Models](#embedding-models)

An **embedding model** is used to convert complex data (like words or images) into a dense vector (a list of numbers) representation, known as an embedding. Unlike generative models, embedding models do not generate new text or data. Instead, they provide representations of semantic and syntactic relationships between entities that can be used as input for other models or other natural language processing tasks.

In the next section, you will learn about the difference between models providers and models, and which ones are available in the AI SDK.

---
url: https://ai-sdk.dev/docs/foundations/prompts
title: "Foundations: Prompts"
description: "Learn about the Prompt structure used in the AI SDK."
hash: "fa57734ab9e975a63c46b8d054ef1e87990cd051ca661f50dc8d480dced18ab4"
crawledAt: 2026-03-07T07:57:23.136Z
depth: 2
---

Prompts are instructions that you give a [large language model (LLM)](https://ai-sdk.dev/docs/foundations/overview#large-language-models) to tell it what to do. It's like when you ask someone for directions; the clearer your question, the better the directions you'll get.

Many LLM providers offer complex interfaces for specifying prompts. They involve different roles and message types. While these interfaces are powerful, they can be hard to use and understand.

In order to simplify prompting, the AI SDK supports text, message, and system prompts.

## [Text Prompts](#text-prompts)

Text prompts are strings. They are ideal for simple generation use cases, e.g. repeatedly generating content for variants of the same prompt text.

You can set text prompts using the `prompt` property made available by AI SDK functions like [`streamText`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text) or [`generateText`](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text). You can structure the text in any way and inject variables, e.g. using a template literal.

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 prompt: 'Invent a new holiday and describe its traditions.',4});
```

You can also use template literals to provide dynamic data to your prompt.

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 prompt:4 `I am planning a trip to ${destination} for ${lengthOfStay} days. ` +5 `Please suggest the best tourist activities for me to do.`,6});
```

## [System Prompts](#system-prompts)

System prompts are the initial set of instructions given to models that help guide and constrain the models' behaviors and responses. You can set system prompts using the `system` property. System prompts work with both the `prompt` and the `messages` properties.

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 system:4 `You help planning travel itineraries. ` +5 `Respond to the users' request with a list ` +6 `of the best stops to make in their destination.`,7 prompt:8 `I am planning a trip to ${destination} for ${lengthOfStay} days. ` +9 `Please suggest the best tourist activities for me to do.`,10});
```

When you use a message prompt, you can also use system messages instead of a system prompt.

## [Message Prompts](#message-prompts)

A message prompt is an array of user, assistant, and tool messages. They are great for chat interfaces and more complex, multi-modal prompts. You can use the `messages` property to set message prompts.

Each message has a `role` and a `content` property. The content can either be text (for user and assistant messages), or an array of relevant parts (data) for that message type.

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 messages: [4 { role: 'user', content: 'Hi!' },5 { role: 'assistant', content: 'Hello, how can I help?' },6 { role: 'user', content: 'Where can I buy the best Currywurst in Berlin?' },7 ],8});
```

Instead of sending a text in the `content` property, you can send an array of parts that includes a mix of text and other content parts.

### [Provider Options](#provider-options)

You can pass through additional provider-specific metadata to enable provider-specific functionality at 3 levels.

#### [Function Call Level](#function-call-level)

Functions like [`streamText`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text#provider-options) or [`generateText`](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text#provider-options) accept a `providerOptions` property.

Adding provider options at the function call level should be used when you do not need granular control over where the provider options are applied.

```
1const { text } = await generateText({2 model: azure('your-deployment-name'),3 providerOptions: {4 openai: {5 reasoningEffort: 'low',6 },7 },8});
```

#### [Message Level](#message-level)

For granular control over applying provider options at the message level, you can pass `providerOptions` to the message object:

```
1import { ModelMessage } from 'ai';2
3const messages: ModelMessage[] = [4 {5 role: 'system',6 content: 'Cached system message',7 providerOptions: {8 // Sets a cache control breakpoint on the system message9 anthropic: { cacheControl: { type: 'ephemeral' } },10 },11 },12];
```

#### [Message Part Level](#message-part-level)

Certain provider-specific options require configuration at the message part level:

```
1import { ModelMessage } from 'ai';2
3const messages: ModelMessage[] = [4 {5 role: 'user',6 content: [7 {8 type: 'text',9 text: 'Describe the image in detail.',10 providerOptions: {11 openai: { imageDetail: 'low' },12 },13 },14 {15 type: 'image',16 image:17 'https://github.com/vercel/ai/blob/main/examples/ai-functions/data/comic-cat.png?raw=true',18 // Sets image detail configuration for image part:19 providerOptions: {20 openai: { imageDetail: 'low' },21 },22 },23 ],24 },25];
```

### [User Messages](#user-messages)

#### [Text Parts](#text-parts)

Text content is the most common type of content. It is a string that is passed to the model.

If you only need to send text content in a message, the `content` property can be a string, but you can also use it to send multiple content parts.

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 messages: [4 {5 role: 'user',6 content: [7 {8 type: 'text',9 text: 'Where can I buy the best Currywurst in Berlin?',10 },11 ],12 },13 ],14});
```

#### [Image Parts](#image-parts)

User messages can include image parts. An image can be one of the following:

* base64-encoded image:
 * `string` with base-64 encoded content
 * data URL `string`, e.g. `data:image/png;base64,...`
* binary image:
 * `ArrayBuffer`
 * `Uint8Array`
 * `Buffer`
* URL:
 * http(s) URL `string`, e.g. `https://example.com/image.png`
 * `URL` object, e.g. `new URL('https://example.com/image.png')`

##### [Example: Binary image (Buffer)](#example-binary-image-buffer)

```
1const result = await generateText({2 model,3 messages: [4 {5 role: 'user',6 content: [7 { type: 'text', text: 'Describe the image in detail.' },8 {9 type: 'image',10 image: fs.readFileSync('./data/comic-cat.png'),11 },12 ],13 },14 ],15});
```

##### [Example: Base-64 encoded image (string)](#example-base-64-encoded-image-string)

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 messages: [4 {5 role: 'user',6 content: [7 { type: 'text', text: 'Describe the image in detail.' },8 {9 type: 'image',10 image: fs.readFileSync('./data/comic-cat.png').toString('base64'),11 },12 ],13 },14 ],15});
```

##### [Example: Image URL (string)](#example-image-url-string)

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 messages: [4 {5 role: 'user',6 content: [7 { type: 'text', text: 'Describe the image in detail.' },8 {9 type: 'image',10 image:11 'https://github.com/vercel/ai/blob/main/examples/ai-functions/data/comic-cat.png?raw=true',12 },13 ],14 },15 ],16});
```

#### [File Parts](#file-parts)

User messages can include file parts. A file can be one of the following:

* base64-encoded file:
 * `string` with base-64 encoded content
 * data URL `string`, e.g. `data:image/png;base64,...`
* binary data:
 * `ArrayBuffer`
 * `Uint8Array`
 * `Buffer`
* URL:
 * http(s) URL `string`, e.g. `https://example.com/some.pdf`
 * `URL` object, e.g. `new URL('https://example.com/some.pdf')`

You need to specify the MIME type of the file you are sending.

##### [Example: PDF file from Buffer](#example-pdf-file-from-buffer)

```
1import { google } from '@ai-sdk/google';2import { generateText } from 'ai';3
4const result = await generateText({5 model: google('gemini-2.5-flash'),6 messages: [7 {8 role: 'user',9 content: [10 { type: 'text', text: 'What is the file about?' },11 {12 type: 'file',13 mediaType: 'application/pdf',14 data: fs.readFileSync('./data/example.pdf'),15 filename: 'example.pdf', // optional, not used by all providers16 },17 ],18 },19 ],20});
```

##### [Example: mp3 audio file from Buffer](#example-mp3-audio-file-from-buffer)

```
1import { openai } from '@ai-sdk/openai';2import { generateText } from 'ai';3
4const result = await generateText({5 model: openai('gpt-4o-audio-preview'),6 messages: [7 {8 role: 'user',9 content: [10 { type: 'text', text: 'What is the audio saying?' },11 {12 type: 'file',13 mediaType: 'audio/mpeg',14 data: fs.readFileSync('./data/galileo.mp3'),15 },16 ],17 },18 ],19});
```

#### [Custom Download Function (Experimental)](#custom-download-function-experimental)

You can use custom download functions to implement throttling, retries, authentication, caching, and more.

The default download implementation automatically downloads files in parallel when they are not supported by the model.

Custom download function can be passed via the `experimental_download` property:

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 experimental_download: async (4 requestedDownloads: Array<{5 url: URL;6 isUrlSupportedByModel: boolean;7 }>,8 ): PromiseLike<9 Array<{10 data: Uint8Array;11 mediaType: string | undefined;12 } | null>13 > => {14 //... download the files and return an array with similar order15 },16 messages: [17 {18 role: 'user',19 content: [20 {21 type: 'file',22 data: new URL('https://api.company.com/private/document.pdf'),23 mediaType: 'application/pdf',24 },25 ],26 },27 ],28});
```

The `experimental_download` option is experimental and may change in future releases.

### [Assistant Messages](#assistant-messages)

Assistant messages are messages that have a role of `assistant`. They are typically previous responses from the assistant and can contain text, reasoning, and tool call parts.

#### [Example: Assistant message with text content](#example-assistant-message-with-text-content)

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 messages: [4 { role: 'user', content: 'Hi!' },5 { role: 'assistant', content: 'Hello, how can I help?' },6 ],7});
```

#### [Example: Assistant message with text content in array](#example-assistant-message-with-text-content-in-array)

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 messages: [4 { role: 'user', content: 'Hi!' },5 {6 role: 'assistant',7 content: [{ type: 'text', text: 'Hello, how can I help?' }],8 },9 ],10});
```

#### [Example: Assistant message with tool call content](#example-assistant-message-with-tool-call-content)

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 messages: [4 { role: 'user', content: 'How many calories are in this block of cheese?' },5 {6 role: 'assistant',7 content: [8 {9 type: 'tool-call',10 toolCallId: '12345',11 toolName: 'get-nutrition-data',12 input: { cheese: 'Roquefort' },13 },14 ],15 },16 ],17});
```

#### [Example: Assistant message with file content](#example-assistant-message-with-file-content)

This content part is for model-generated files. Only a few models support this, and only for file types that they can generate.

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 messages: [4 { role: 'user', content: 'Generate an image of a roquefort cheese!' },5 {6 role: 'assistant',7 content: [8 {9 type: 'file',10 mediaType: 'image/png',11 data: fs.readFileSync('./data/roquefort.jpg'),12 },13 ],14 },15 ],16});
```

### [Tool messages](#tool-messages)

[Tools](https://ai-sdk.dev/docs/foundations/tools) (also known as function calling) are programs that you can provide an LLM to extend its built-in functionality. This can be anything from calling an external API to calling functions within your UI. Learn more about Tools in [the next section](https://ai-sdk.dev/docs/foundations/tools).

For models that support [tool](https://ai-sdk.dev/docs/foundations/tools) calls, assistant messages can contain tool call parts, and tool messages can contain tool output parts. A single assistant message can call multiple tools, and a single tool message can contain multiple tool results.

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 messages: [4 {5 role: 'user',6 content: [7 {8 type: 'text',9 text: 'How many calories are in this block of cheese?',10 },11 { type: 'image', image: fs.readFileSync('./data/roquefort.jpg') },12 ],13 },14 {15 role: 'assistant',16 content: [17 {18 type: 'tool-call',19 toolCallId: '12345',20 toolName: 'get-nutrition-data',21 input: { cheese: 'Roquefort' },22 },23 // there could be more tool calls here (parallel calling)24 ],25 },26 {27 role: 'tool',28 content: [29 {30 type: 'tool-result',31 toolCallId: '12345', // needs to match the tool call id32 toolName: 'get-nutrition-data',33 output: {34 type: 'json',35 value: {36 name: 'Cheese, roquefort',37 calories: 369,38 fat: 31,39 protein: 22,40 },41 },42 },43 // there could be more tool results here (parallel calling)44 ],45 },46 ],47});
```

#### [Multi-modal Tool Results](#multi-modal-tool-results)

Tool results can be multi-part and multi-modal, e.g. a text and an image. You can use `output: { type: 'content', value: [...] }` to specify multi-part tool results.

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 messages: [4 //...5 {6 role: 'tool',7 content: [8 {9 type: 'tool-result',10 toolCallId: '12345', // needs to match the tool call id11 toolName: 'get-nutrition-data',12 // for models that do not support multi-part tool results,13 // you can include a regular output part:14 output: {15 type: 'json',16 value: {17 name: 'Cheese, roquefort',18 calories: 369,19 fat: 31,20 protein: 22,21 },22 },23 },24 {25 type: 'tool-result',26 toolCallId: '12345', // needs to match the tool call id27 toolName: 'get-nutrition-data',28 // for models that support multi-part tool results,29 // you can include a multi-part content part:30 output: {31 type: 'content',32 value: [33 {34 type: 'text',35 text: 'Here is the nutrition data for the cheese:',36 },37 {38 type: 'image-data',39 data: fs40.readFileSync('./data/roquefort-nutrition-data.png')41.toString('base64'),42 mediaType: 'image/png',43 },44 ],45 },46 },47 ],48 },49 ],50});
```

### [System Messages](#system-messages)

System messages are messages that are sent to the model before the user messages to guide the assistant's behavior. You can alternatively use the `system` property.

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 messages: [4 { role: 'system', content: 'You help planning travel itineraries.' },5 {6 role: 'user',7 content:8 'I am planning a trip to Berlin for 3 days. Please suggest the best tourist activities for me to do.',9 },10 ],11});
```

---
url: https://ai-sdk.dev/docs/foundations/tools
title: "Foundations: Tools"
description: "Learn about tools with the AI SDK."
hash: "8b8c90bbce20aaf327b373aa2d1346affdd82827aafe9490455e71db9e90f08b"
crawledAt: 2026-03-07T07:57:28.726Z
depth: 2
---

While [large language models (LLMs)](https://ai-sdk.dev/docs/foundations/overview#large-language-models) have incredible generation capabilities, they struggle with discrete tasks (e.g. mathematics) and interacting with the outside world (e.g. getting the weather).

Tools are actions that an LLM can invoke. The results of these actions can be reported back to the LLM to be considered in the next response.

For example, when you ask an LLM for the "weather in London", and there is a weather tool available, it could call a tool with London as the argument. The tool would then fetch the weather data and return it to the LLM. The LLM can then use this information in its response.

## [What is a tool?](#what-is-a-tool)

A tool is an object that can be called by the model to perform a specific task. You can use tools with [`generateText`](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text) and [`streamText`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text) by passing one or more tools to the `tools` parameter.

A tool consists of three properties:

* **`description`**: An optional description of the tool that can influence when the tool is picked.
* **`inputSchema`**: A [Zod schema](https://ai-sdk.dev/docs/reference/ai-sdk-core/zod-schema) or a [JSON schema](https://ai-sdk.dev/docs/reference/ai-sdk-core/json-schema) that defines the input required for the tool to run. The schema is consumed by the LLM, and also used to validate the LLM tool calls.
* **`execute`**: An optional async function that is called with the arguments from the tool call.

`streamUI` uses UI generator tools with a `generate` function that can return React components.

If the LLM decides to use a tool, it will generate a tool call. Tools with an `execute` function are run automatically when these calls are generated. The output of the tool calls are returned using tool result objects.

You can automatically pass tool results back to the LLM using [multi-step calls](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling#multi-step-calls) with `streamText` and `generateText`.

## [Types of Tools](#types-of-tools)

The AI SDK supports three types of tools, each with different trade-offs:

### [Custom Tools](#custom-tools)

Custom tools are tools you define entirely yourself, including the description, input schema, and execute function. They are provider-agnostic and give you full control.

```
1import { tool } from 'ai';2import { z } from 'zod';3
4const weatherTool = tool({5 description: 'Get the weather in a location',6 inputSchema: z.object({7 location: z.string().describe('The location to get the weather for'),8 }),9 execute: async ({ location }) => {10 // Your implementation11 return { temperature: 72, conditions: 'sunny' };12 },13});
```

**When to use**: When you need full control, want provider portability, or are implementing application-specific functionality.

### [Provider-Defined Tools](#provider-defined-tools)

Provider-defined tools are tools where the provider specifies the tool's `inputSchema` and `description`, but you provide the `execute` function. These are sometimes called "client tools" because execution happens on your side.

Examples include Anthropic's `bash` and `text_editor` tools. The model has been specifically trained to use these tools effectively, which can result in better performance for supported tasks.

```
1import { anthropic } from '@ai-sdk/anthropic';2import { generateText } from 'ai';3
4const result = await generateText({5 model: anthropic('claude-opus-4-5'),6 tools: {7 bash: anthropic.tools.bash_20250124({8 execute: async ({ command }) => {9 // Your implementation to run the command10 return runCommand(command);11 },12 }),13 },14 prompt: 'List files in the current directory',15});
```

**When to use**: When the provider offers a tool the model is trained to use well, and you want better performance for that specific task.

### [Provider-Executed Tools](#provider-executed-tools)

Provider-executed tools are tools that run entirely on the provider's servers. You configure them, but the provider handles execution. These are sometimes called "server-side tools".

Examples include OpenAI's web search and Anthropic's code execution. These provide out-of-the-box functionality without requiring you to set up infrastructure.

```
1import { openai } from '@ai-sdk/openai';2import { generateText } from 'ai';3
4const result = await generateText({5 model: openai('gpt-5.2'),6 tools: {7 web_search: openai.tools.webSearch(),8 },9 prompt: 'What happened in the news today?',10});
```

**When to use**: When you want powerful functionality (like web search or sandboxed code execution) without managing the infrastructure yourself.

### [Comparison](#comparison)

| Aspect | Custom Tools | Provider-Defined Tools | Provider-Executed Tools |
| --- | --- | --- | --- |
| **Execution** | Your code | Your code | Provider's servers |
| **Schema** | You define | Provider defines | Provider defines |
| **Portability** | Works with any provider | Provider-specific | Provider-specific |
| **Model Training** | General tool use | Optimized for the tool | Optimized for the tool |
| **Setup** | You implement everything | You implement execute | Configuration only |

## [Schemas](#schemas)

Schemas are used to define and validate the [tool input](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling), tools outputs, and structured output generation.

The AI SDK supports the following schemas:

* [Zod](https://zod.dev/) v3 and v4 directly or via [`zodSchema()`](https://ai-sdk.dev/docs/reference/ai-sdk-core/zod-schema)
* [Valibot](https://valibot.dev/) via [`valibotSchema()`](https://ai-sdk.dev/docs/reference/ai-sdk-core/valibot-schema) from `@ai-sdk/valibot`
* [Standard JSON Schema](https://standardschema.dev/json-schema) compatible schemas
* Raw JSON schemas via [`jsonSchema()`](https://ai-sdk.dev/docs/reference/ai-sdk-core/json-schema)

## [Tool Packages](#tool-packages)

Given tools are JavaScript objects, they can be packaged and distributed through npm like any other library. This makes it easy to share reusable tools across projects and with the community.

### [Using Ready-Made Tool Packages](#using-ready-made-tool-packages)

Install a tool package and import the tools you need:

```
1pnpm add some-tool-package
```

Then pass them directly to `generateText`, `streamText`, or your agent definition:

```
1import { generateText, stepCountIs } from 'ai';2import { searchTool } from 'some-tool-package';3
4const { text } = await generateText({5 model: 'anthropic/claude-haiku-4.5',6 prompt: 'When was Vercel Ship AI?',7 tools: {8 webSearch: searchTool,9 },10 stopWhen: stepCountIs(10),11});
```

### [Publishing Your Own Tools](#publishing-your-own-tools)

You can publish your own tool packages to npm for others to use. Simply export your tool objects from your package:

```
1import { tool } from 'ai';2import { z } from 'zod';3
4export const myTool = tool({5 description: 'A helpful tool',6 inputSchema: z.object({7 query: z.string(),8 }),9 execute: async ({ query }) => {10 // your tool logic11 return result;12 },13});
```

Anyone can then install and use your tools by importing them.

To get started, you can use the [AI SDK Tool Package Template](https://github.com/vercel-labs/ai-sdk-tool-as-package-template) which provides a ready-to-use starting point for publishing your own tools.

## [Toolsets](#toolsets)

When you work with tools, you typically need a mix of application-specific tools and general-purpose tools. The community has created various toolsets and resources to help you build and use tools.

### [Ready-to-Use Tool Packages](#ready-to-use-tool-packages)

These packages provide pre-built tools you can install and use immediately:

* **[@exalabs/ai-sdk](https://www.npmjs.com/package/@exalabs/ai-sdk)** - Web search tool that lets AI search the web and get real-time information.
* **[@parallel-web/ai-sdk-tools](https://www.npmjs.com/package/@parallel-web/ai-sdk-tools)** - Web search and extract tools powered by Parallel Web API for real-time information and content extraction.
* **[@perplexity-ai/ai-sdk](https://www.npmjs.com/package/@perplexity-ai/ai-sdk)** - Search the web with real-time results and advanced filtering powered by Perplexity's Search API.
* **[@tavily/ai-sdk](https://www.npmjs.com/package/@tavily/ai-sdk)** - Search, extract, crawl, and map tools for enterprise-grade agents to explore the web in real-time.
* **[Stripe agent tools](https://docs.stripe.com/agents?framework=vercel)** - Tools for interacting with Stripe.
* **[StackOne ToolSet](https://docs.stackone.com/agents/typescript/frameworks/vercel-ai-sdk)** - Agentic integrations for hundreds of [enterprise SaaS](https://www.stackone.com/integrations) platforms.
* **[agentic](https://docs.agentic.so/marketplace/ts-sdks/ai-sdk)** - A collection of 20+ tools that connect to external APIs such as [Exa](https://exa.ai/) or [E2B](https://e2b.dev/).
* **[Amazon Bedrock AgentCore](https://github.com/aws/bedrock-agentcore-sdk-typescript)** - Fully managed AI agent services including [**Browser**](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/built-in-tools.html) (a fast and secure cloud-based browser runtime to enable agents to interact with web applications, fill forms, navigate websites, and extract information) and [**Code Interpreter**](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/built-in-tools.html) (an isolated sandbox environment for agents to execute code in Python, JavaScript, and TypeScript, enhancing accuracy and expanding ability to solve complex end-to-end tasks).
* **[@airweave/vercel-ai-sdk](https://www.npmjs.com/package/@airweave/vercel-ai-sdk)** - Unified semantic search across 35+ data sources (Notion, Slack, Google Drive, databases, and more) for AI agents.
* **[Composio](https://docs.composio.dev/providers/vercel)** - 250+ tools like GitHub, Gmail, Salesforce and [more](https://composio.dev/tools).
* **[JigsawStack](http://www.jigsawstack.com/docs/integration/vercel)** - Over 30+ small custom fine-tuned models available for specific uses.
* **[AI Tools Registry](https://ai-tools-registry.vercel.app/)** - A Shadcn-compatible tool definitions and components registry for the AI SDK.
* **[Toolhouse](https://docs.toolhouse.ai/toolhouse/toolhouse-sdk/using-vercel-ai)** - AI function-calling in 3 lines of code for over 25 different actions.
* **[bash-tool](https://www.npmjs.com/package/bash-tool)** - Provides `bash`, `readFile`, and `writeFile` tools for AI agents. Supports [@vercel/sandbox](https://vercel.com/docs/vercel-sandbox) for full VM isolation.

### [MCP Tools](#mcp-tools)

These are pre-built tools available as MCP servers:

* **[Smithery](https://smithery.ai/docs/integrations/vercel_ai_sdk)** - An open marketplace of 6,000+ MCPs, including [Browserbase](https://browserbase.com/) and [Exa](https://exa.ai/).
* **[Pipedream](https://pipedream.com/docs/connect/mcp/ai-frameworks/vercel-ai-sdk)** - Developer toolkit that lets you easily add 3,000+ integrations to your app or AI agent.
* **[Apify](https://docs.apify.com/platform/integrations/vercel-ai-sdk)** - Apify provides a [marketplace](https://apify.com/store) of thousands of tools for web scraping, data extraction, and browser automation.

### [Tool Building Tutorials](#tool-building-tutorials)

These tutorials and guides help you build your own tools that integrate with specific services:

* **[browserbase](https://docs.browserbase.com/integrations/vercel/introduction#vercel-ai-integration)** - Tutorial for building browser tools that run a headless browser.
* **[browserless](https://docs.browserless.io/ai-integrations/vercel-ai-sdk)** - Guide for integrating browser automation (self-hosted or cloud-based).
* **[AI Tool Maker](https://github.com/nihaocami/ai-tool-maker)** - A CLI utility to generate AI SDK tools from OpenAPI specs.
* **[Interlify](https://www.interlify.com/docs/integrate-with-vercel-ai)** - Guide for converting APIs into tools.
* **[DeepAgent](https://deepagent.amardeep.space/docs/vercel-ai-sdk)** - A suite of 50+ AI tools and integrations, seamlessly connecting with APIs like Tavily, E2B, Airtable and [more](https://deepagent.amardeep.space/docs).

Do you have open source tools or tool libraries that are compatible with the AI SDK? Please [file a pull request](https://github.com/vercel/ai/pulls) to add them to this list.

## [Learn more](#learn-more)

The AI SDK Core [Tool Calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling) and [Agents](https://ai-sdk.dev/docs/agents) documentation has more information about tools and tool calling.

---
url: https://ai-sdk.dev/docs/foundations/streaming
title: "Foundations: Streaming"
description: "Why use streaming for AI applications?"
hash: "328a6e8c2188d2801bb42dad5177dbd4bcfec4e4051ebaacf2c363d7db30e70c"
crawledAt: 2026-03-07T07:57:34.142Z
depth: 2
---

Streaming conversational text UIs (like ChatGPT) have gained massive popularity over the past few months. This section explores the benefits and drawbacks of streaming and blocking interfaces.

[Large language models (LLMs)](https://ai-sdk.dev/docs/foundations/overview#large-language-models) are extremely powerful. However, when generating long outputs, they can be very slow compared to the latency you're likely used to. If you try to build a traditional blocking UI, your users might easily find themselves staring at loading spinners for 5, 10, even up to 40s waiting for the entire LLM response to be generated. This can lead to a poor user experience, especially in conversational applications like chatbots. Streaming UIs can help mitigate this issue by **displaying parts of the response as they become available**.

Blocking UI

Blocking responses wait until the full response is available before displaying it.

Streaming UI

Streaming responses can transmit parts of the response as they become available.

## [Real-world Examples](#real-world-examples)

Here are 2 examples that illustrate how streaming UIs can improve user experiences in a real-world setting – the first uses a blocking UI, while the second uses a streaming UI.

### [Blocking UI](#blocking-ui)...

### [Streaming UI](#streaming-ui)...

As you can see, the streaming UI is able to start displaying the response much faster than the blocking UI. This is because the blocking UI has to wait for the entire response to be generated before it can display anything, while the streaming UI can display parts of the response as they become available.

While streaming interfaces can greatly enhance user experiences, especially with larger language models, they aren't always necessary or beneficial. If you can achieve your desired functionality using a smaller, faster model without resorting to streaming, this route can often lead to simpler and more manageable development processes.

However, regardless of the speed of your model, the AI SDK is designed to make implementing streaming UIs as simple as possible. In the example below, we stream text generation in under 10 lines of code using the SDK's [`streamText`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text) function:

```
1import { streamText } from 'ai';2
3const { textStream } = streamText({4 model: "anthropic/claude-sonnet-4.5",5 prompt: 'Write a poem about embedding models.',6});7
8for await (const textPart of textStream) {9 console.log(textPart);10}
```

For an introduction to streaming UIs and the AI SDK, check out our [Getting Started guides](https://ai-sdk.dev/docs/getting-started).

---
url: https://ai-sdk.dev/docs/foundations/provider-options
title: "Foundations: Provider Options"
description: "Learn how to use provider-specific options to control reasoning, caching, and other advanced features."
hash: "ea06de0812d79f946832bce4c8b254c6040c7fb8f487f661209e55815044a73a"
crawledAt: 2026-03-07T07:57:39.646Z
depth: 2
---

Provider options let you pass provider-specific configuration that goes beyond the [standard settings](https://ai-sdk.dev/docs/ai-sdk-core/settings) shared by all providers. They are set via the `providerOptions` property on functions like `generateText` and `streamText`.

```
1const result = await generateText({2 model: openai('gpt-5.2'),3 prompt: 'Explain quantum entanglement.',4 providerOptions: {5 openai: {6 reasoningEffort: 'low',7 },8 },9});
```

Provider options are namespaced by the provider name (e.g. `openai`, `anthropic`) so you can even include options for multiple providers in the same call — only the options matching the active provider are used. See [Prompts: Provider Options](https://ai-sdk.dev/docs/foundations/prompts#provider-options) for details on applying options at the message and message-part level.

## [Common Provider Options](#common-provider-options)

The sections below cover the most frequently used provider options, focusing on reasoning and output control for OpenAI and Anthropic. For a complete reference, see the individual provider pages:

* [OpenAI provider options](https://ai-sdk.dev/providers/ai-sdk-providers/openai)
* [Anthropic provider options](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)

* * *

## [OpenAI](#openai)

### [Reasoning Effort](#reasoning-effort)

For reasoning models (e.g. `o3`, `o4-mini`, `gpt-5.2`), `reasoningEffort` controls how much internal reasoning the model performs before responding. Lower values are faster and cheaper; higher values produce more thorough answers.

```
1import {2 openai,3 type OpenAILanguageModelResponsesOptions,4} from '@ai-sdk/openai';5import { generateText } from 'ai';6
7const { text, usage, providerMetadata } = await generateText({8 model: openai('gpt-5.2'),9 prompt: 'Invent a new holiday and describe its traditions.',10 providerOptions: {11 openai: {12 reasoningEffort: 'low', // 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'13 } satisfies OpenAILanguageModelResponsesOptions,14 },15});16
17console.log('Reasoning tokens:', providerMetadata?.openai?.reasoningTokens);
```

| Value | Behavior |
| --- | --- |
| `'none'` | No reasoning (GPT-5.1 models only) |
| `'minimal'` | Bare-minimum reasoning |
| `'low'` | Fast, concise reasoning |
| `'medium'` | Balanced (default) |
| `'high'` | Thorough reasoning |
| `'xhigh'` | Maximum reasoning (GPT-5.1-Codex-Max only) |

`'none'` and `'xhigh'` are only supported on specific models. Using them with unsupported models will result in an error.

### [Reasoning Summary](#reasoning-summary)

When working with reasoning models, you may want to see _how_ the model arrived at its answer. The `reasoningSummary` option surfaces the model's thought process.

#### [Streaming](#streaming)

```
1import {2 openai,3 type OpenAILanguageModelResponsesOptions,4} from '@ai-sdk/openai';5import { streamText } from 'ai';6
7const result = streamText({8 model: openai('gpt-5.2'),9 prompt: 'Tell me about the Mission burrito debate in San Francisco.',10 providerOptions: {11 openai: {12 reasoningSummary: 'detailed', // 'auto' | 'detailed'13 } satisfies OpenAILanguageModelResponsesOptions,14 },15});16
17for await (const part of result.fullStream) {18 if (part.type === 'reasoning') {19 console.log(`Reasoning: ${part.textDelta}`);20 } else if (part.type === 'text-delta') {21 process.stdout.write(part.textDelta);22 }23}
```

#### [Non-streaming](#non-streaming)

```
1import {2 openai,3 type OpenAILanguageModelResponsesOptions,4} from '@ai-sdk/openai';5import { generateText } from 'ai';6
7const result = await generateText({8 model: openai('gpt-5.2'),9 prompt: 'Tell me about the Mission burrito debate in San Francisco.',10 providerOptions: {11 openai: {12 reasoningSummary: 'auto',13 } satisfies OpenAILanguageModelResponsesOptions,14 },15});16
17console.log('Reasoning:', result.reasoning);
```

| Value | Behavior |
| --- | --- |
| `'auto'` | Condensed summary of reasoning |
| `'detailed'` | Comprehensive reasoning output |

### [Text Verbosity](#text-verbosity)

Control the length and detail of the model's text response independently of reasoning:

```
1import {2 openai,3 type OpenAILanguageModelResponsesOptions,4} from '@ai-sdk/openai';5import { generateText } from 'ai';6
7const result = await generateText({8 model: openai('gpt-5-mini'),9 prompt: 'Write a poem about a boy and his first pet dog.',10 providerOptions: {11 openai: {12 textVerbosity: 'low', // 'low' | 'medium' | 'high'13 } satisfies OpenAILanguageModelResponsesOptions,14 },15});
```

| Value | Behavior |
| --- | --- |
| `'low'` | Terse, minimal responses |
| `'medium'` | Balanced detail (default) |
| `'high'` | Verbose, comprehensive responses |

* * *

## [Anthropic](#anthropic)

### [Thinking (Extended Reasoning)](#thinking-extended-reasoning)

Anthropic's thinking feature gives Claude models a dedicated "thinking" phase before they respond. You enable it by providing a `thinking` object with a token budget.

```
1import { anthropic, AnthropicLanguageModelOptions } from '@ai-sdk/anthropic';2import { generateText } from 'ai';3
4const { text, reasoning, reasoningText } = await generateText({5 model: anthropic('claude-opus-4-20250514'),6 prompt: 'How many people will live in the world in 2040?',7 providerOptions: {8 anthropic: {9 thinking: { type: 'enabled', budgetTokens: 12000 },10 } satisfies AnthropicLanguageModelOptions,11 },12});13
14console.log('Reasoning:', reasoningText);15console.log('Answer:', text);
```

The `budgetTokens` value sets the upper limit on how many tokens the model can use for its internal reasoning. Higher budgets allow deeper reasoning but increase latency and cost.

Thinking is supported on `claude-opus-4-20250514`, `claude-sonnet-4-20250514`, and `claude-sonnet-4-5-20250929` models.

### [Effort](#effort)

The `effort` option provides a simpler way to control reasoning depth without specifying a token budget. It affects thinking, text responses, and function calls.

```
1import { anthropic, AnthropicLanguageModelOptions } from '@ai-sdk/anthropic';2import { generateText } from 'ai';3
4const { text, usage } = await generateText({5 model: anthropic('claude-opus-4-20250514'),6 prompt: 'How many people will live in the world in 2040?',7 providerOptions: {8 anthropic: {9 effort: 'low', // 'low' | 'medium' | 'high'10 } satisfies AnthropicLanguageModelOptions,11 },12});
```

| Value | Behavior |
| --- | --- |
| `'low'` | Minimal reasoning, fastest responses |
| `'medium'` | Balanced reasoning |
| `'high'` | Thorough reasoning (default) |

### [Fast Mode](#fast-mode)

For `claude-opus-4-6`, the `speed` option enables approximately 2.5x faster output token speeds:

```
1import { anthropic, AnthropicLanguageModelOptions } from '@ai-sdk/anthropic';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: anthropic('claude-opus-4-6'),6 prompt: 'Write a short poem about the sea.',7 providerOptions: {8 anthropic: {9 speed: 'fast', // 'fast' | 'standard'10 } satisfies AnthropicLanguageModelOptions,11 },12});
```

* * *

## [Combining Options](#combining-options)

You can combine multiple provider options in a single call. For example, using both reasoning effort and reasoning summaries with OpenAI:

```
1import {2 openai,3 type OpenAILanguageModelResponsesOptions,4} from '@ai-sdk/openai';5import { generateText } from 'ai';6
7const result = await generateText({8 model: openai('gpt-5.2'),9 prompt: 'What are the implications of quantum computing for cryptography?',10 providerOptions: {11 openai: {12 reasoningEffort: 'high',13 reasoningSummary: 'detailed',14 } satisfies OpenAILanguageModelResponsesOptions,15 },16});
```

Or enabling thinking with a low effort level for Anthropic:

```
1import { anthropic, AnthropicLanguageModelOptions } from '@ai-sdk/anthropic';2import { generateText } from 'ai';3
4const result = await generateText({5 model: anthropic('claude-opus-4-20250514'),6 prompt: 'Explain the Riemann hypothesis in simple terms.',7 providerOptions: {8 anthropic: {9 thinking: { type: 'enabled', budgetTokens: 8000 },10 effort: 'medium',11 } satisfies AnthropicLanguageModelOptions,12 },13});
```

## [Using Provider Options with the AI Gateway](#using-provider-options-with-the-ai-gateway)

Provider options work the same way when using the [Vercel AI Gateway](https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway). Use the underlying provider name (e.g. `openai`, `anthropic`) as the key — not `gateway`. The AI Gateway forwards these options to the target provider automatically.

```
1import type { OpenAILanguageModelResponsesOptions } from '@ai-sdk/openai';2import { generateText } from 'ai';3
4const result = await generateText({5 model: 'openai/gpt-5.2', // AI Gateway model string6 prompt: 'What are the implications of quantum computing for cryptography?',7 providerOptions: {8 openai: {9 reasoningEffort: 'high',10 reasoningSummary: 'detailed',11 } satisfies OpenAILanguageModelResponsesOptions,12 },13});
```

You can also combine gateway-specific options (like routing and fallbacks) with provider-specific options in the same call:

```
1import type { AnthropicLanguageModelOptions } from '@ai-sdk/anthropic';2import type { GatewayLanguageModelOptions } from '@ai-sdk/gateway';3import { generateText } from 'ai';4
5const result = await generateText({6 model: 'anthropic/claude-sonnet-4',7 prompt: 'Explain quantum computing',8 providerOptions: {9 // Gateway-specific: control routing10 gateway: {11 order: ['vertex', 'anthropic'],12 } satisfies GatewayLanguageModelOptions,13 // Provider-specific: enable reasoning14 anthropic: {15 thinking: { type: 'enabled', budgetTokens: 12000 },16 } satisfies AnthropicLanguageModelOptions,17 },18});
```

For more on gateway routing, fallbacks, and other gateway-specific options, see the [AI Gateway provider documentation](https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway#provider-options).

## [Type Safety](#type-safety)

Each provider exports a type for its options, which you can use with `satisfies` to get autocomplete and catch typos at build time:

```
1import { type OpenAILanguageModelResponsesOptions } from '@ai-sdk/openai';2import { type AnthropicLanguageModelOptions } from '@ai-sdk/anthropic';
```

For a full list of available options, see the provider-specific documentation:

* [OpenAI Provider](https://ai-sdk.dev/providers/ai-sdk-providers/openai)
* [Anthropic Provider](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)