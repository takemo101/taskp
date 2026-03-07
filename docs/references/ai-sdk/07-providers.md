---
url: https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway
title: "AI SDK Providers: AI Gateway"
description: "Learn how to use the AI Gateway provider with the AI SDK."
hash: "cbd2702d8d63207277ec980a005fd73aab99717ec462047f9084b1f293e48800"
crawledAt: 2026-03-07T08:03:51.365Z
depth: 1
---

## [AI Gateway Provider](#ai-gateway-provider)

The [AI Gateway](https://vercel.com/docs/ai-gateway) provider connects you to models from multiple AI providers through a single interface. Instead of integrating with each provider separately, you can access OpenAI, Anthropic, Google, Meta, xAI, and other providers and their models.

## [Features](#features)

* Access models from multiple providers without having to install additional provider modules/dependencies
* Use the same code structure across different AI providers
* Switch between models and providers easily
* Automatic authentication when deployed on Vercel
* View pricing information across providers
* Observability for AI model usage through the Vercel dashboard

## [Setup](#setup)

The Vercel AI Gateway provider is part of the AI SDK.

## [Basic Usage](#basic-usage)

For most use cases, you can use the AI Gateway directly with a model string:

```
1// use plain model string with global provider2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: 'openai/gpt-5',6 prompt: 'Hello world',7});
```

```
1// use provider instance (requires version 5.0.36 or later)2import { generateText, gateway } from 'ai';3
4const { text } = await generateText({5 model: gateway('openai/gpt-5'),6 prompt: 'Hello world',7});
```

The AI SDK automatically uses the AI Gateway when you pass a model string in the `creator/model-name` format.

## [Provider Instance](#provider-instance)

The `gateway` provider instance is available from the `ai` package in version 5.0.36 and later.

You can also import the default provider instance `gateway` from `ai`:

```
1import { gateway } from 'ai';
```

You may want to create a custom provider instance when you need to:

* Set custom configuration options (API key, base URL, headers)
* Use the provider in a [provider registry](https://ai-sdk.dev/docs/ai-sdk-core/provider-management)
* Wrap the provider with [middleware](https://ai-sdk.dev/docs/ai-sdk-core/middleware)
* Use different settings for different parts of your application

To create a custom provider instance, import `createGateway` from `ai`:

```
1import { createGateway } from 'ai';2
3const gateway = createGateway({4 apiKey: process.env.AI_GATEWAY_API_KEY ?? '',5});
```

You can use the following optional settings to customize the AI Gateway provider instance:

* **baseURL** _string_
 
 Use a different URL prefix for API calls. The default prefix is `https://ai-gateway.vercel.sh/v3/ai`.
 
* **apiKey** _string_
 
 API key that is being sent using the `Authorization` header. It defaults to the `AI_GATEWAY_API_KEY` environment variable.
 
* **headers** _Record<string,string>_
 
 Custom headers to include in the requests.
 
* **fetch** _(input: RequestInfo, init?: RequestInit) => Promise<Response>_
 
 Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation. Defaults to the global `fetch` function. You can use it as a middleware to intercept requests, or to provide a custom fetch implementation for e.g. testing.
 
* **metadataCacheRefreshMillis** _number_
 
 How frequently to refresh the metadata cache in milliseconds. Defaults to 5 minutes (300,000ms).
 

## [Authentication](#authentication)

The Gateway provider supports two authentication methods:

### [API Key Authentication](#api-key-authentication)

Set your API key via environment variable:

```
1AI_GATEWAY_API_KEY=your_api_key_here
```

Or pass it directly to the provider:

```
1import { createGateway } from 'ai';2
3const gateway = createGateway({4 apiKey: 'your_api_key_here',5});
```

### [OIDC Authentication (Vercel Deployments)](#oidc-authentication-vercel-deployments)

When deployed to Vercel, the AI Gateway provider supports authenticating using [OIDC (OpenID Connect) tokens](https://vercel.com/docs/oidc) without API Keys.

#### [How OIDC Authentication Works](#how-oidc-authentication-works)

1. **In Production/Preview Deployments**:
 
 * OIDC authentication is automatically handled
 * No manual configuration needed
 * Tokens are automatically obtained and refreshed
2. **In Local Development**:
 
 * First, install and authenticate with the [Vercel CLI](https://vercel.com/docs/cli)
 * Run `vercel env pull` to download your project's OIDC token locally
 * For automatic token management:
 * Use `vercel dev` to start your development server - this will handle token refreshing automatically
 * For manual token management:
 * If not using `vercel dev`, note that OIDC tokens expire after 12 hours
 * You'll need to run `vercel env pull` again to refresh the token before it expires

If an API Key is present (either passed directly or via environment), it will always be used, even if invalid.

Read more about using OIDC tokens in the [Vercel AI Gateway docs](https://vercel.com/docs/ai-gateway#using-the-ai-gateway-with-a-vercel-oidc-token).

## [Bring Your Own Key (BYOK)](#bring-your-own-key-byok)

You can connect your own provider credentials to use with Vercel AI Gateway. This lets you use your existing provider accounts and access private resources.

To set up BYOK, add your provider credentials in your Vercel team's AI Gateway settings. Once configured, AI Gateway automatically uses your credentials. No code changes are needed.

Learn more in the [BYOK documentation](https://vercel.com/docs/ai-gateway/byok).

## [Language Models](#language-models)

You can create language models using a provider instance. The first argument is the model ID in the format `creator/model-name`:

```
1import { generateText } from 'ai';2
3const { text } = await generateText({4 model: 'openai/gpt-5',5 prompt: 'Explain quantum computing in simple terms',6});
```

AI Gateway language models can also be used in the `streamText` function and support structured data generation with [`Output`](https://ai-sdk.dev/docs/reference/ai-sdk-core/output) (see [AI SDK Core](https://ai-sdk.dev/docs/ai-sdk-core)).

## [Available Models](#available-models)

The AI Gateway supports models from OpenAI, Anthropic, Google, Meta, xAI, Mistral, DeepSeek, Amazon Bedrock, Cohere, Perplexity, Alibaba, and other providers.

For the complete list of available models, see the [AI Gateway documentation](https://vercel.com/docs/ai-gateway).

## [Dynamic Model Discovery](#dynamic-model-discovery)

You can discover available models programmatically:

```
1import { gateway, generateText } from 'ai';2
3const availableModels = await gateway.getAvailableModels();4
5// List all available models6availableModels.models.forEach(model => {7 console.log(`${model.id}: ${model.name}`);8 if (model.description) {9 console.log(` Description: ${model.description}`);10 }11 if (model.pricing) {12 console.log(` Input: $${model.pricing.input}/token`);13 console.log(` Output: $${model.pricing.output}/token`);14 if (model.pricing.cachedInputTokens) {15 console.log(16 ` Cached input (read): $${model.pricing.cachedInputTokens}/token`,17 );18 }19 if (model.pricing.cacheCreationInputTokens) {20 console.log(21 ` Cache creation (write): $${model.pricing.cacheCreationInputTokens}/token`,22 );23 }24 }25});26
27// Use any discovered model with plain string28const { text } = await generateText({29 model: availableModels.models[0].id, // e.g., 'openai/gpt-4o'30 prompt: 'Hello world',31});
```

## [Credit Usage](#credit-usage)

You can check your team's current credit balance and usage:

```
1import { gateway } from 'ai';2
3const credits = await gateway.getCredits();4
5console.log(`Team balance: ${credits.balance} credits`);6console.log(`Team total used: ${credits.total_used} credits`);
```

The `getCredits()` method returns your team's credit information based on the authenticated API key or OIDC token:

* **balance** _number_ - Your team's current available credit balance
* **total\_used** _number_ - Total credits consumed by your team

## [Examples](#examples)

### [Basic Text Generation](#basic-text-generation)

```
1import { generateText } from 'ai';2
3const { text } = await generateText({4 model: 'anthropic/claude-sonnet-4',5 prompt: 'Write a haiku about programming',6});7
8console.log(text);
```

### [Streaming](#streaming)

```
1import { streamText } from 'ai';2
3const { textStream } = await streamText({4 model: 'openai/gpt-5',5 prompt: 'Explain the benefits of serverless architecture',6});7
8for await (const textPart of textStream) {9 process.stdout.write(textPart);10}
```

### [Tool Usage](#tool-usage)

```
1import { generateText, tool } from 'ai';2import { z } from 'zod';3
4const { text } = await generateText({5 model: 'xai/grok-4',6 prompt: 'What is the weather like in San Francisco?',7 tools: {8 getWeather: tool({9 description: 'Get the current weather for a location',10 parameters: z.object({11 location: z.string().describe('The location to get weather for'),12 }),13 execute: async ({ location }) => {14 // Your weather API call here15 return `It's sunny in ${location}`;16 },17 }),18 },19});
```

### [Provider-Executed Tools](#provider-executed-tools)

Some providers offer tools that are executed by the provider itself, such as [OpenAI's web search tool](https://ai-sdk.dev/providers/ai-sdk-providers/openai#web-search-tool). To use these tools through AI Gateway, import the provider to access the tool definitions:

```
1import { generateText, stepCountIs } from 'ai';2import { openai } from '@ai-sdk/openai';3
4const result = await generateText({5 model: 'openai/gpt-5-mini',6 prompt: 'What is the Vercel AI Gateway?',7 stopWhen: stepCountIs(10),8 tools: {9 web_search: openai.tools.webSearch({}),10 },11});12
13console.dir(result.text);
```

Some provider-executed tools require account-specific configuration (such as Claude Agent Skills) and may not work through AI Gateway. To use these tools, you must bring your own key (BYOK) directly to the provider.

### [Gateway Tools](#gateway-tools)

The AI Gateway provider includes built-in tools that are executed by the gateway itself. These tools can be used with any model through the gateway.

#### [Perplexity Search](#perplexity-search)

The Perplexity Search tool enables models to search the web using [Perplexity's search API](https://docs.perplexity.ai/guides/search-quickstart). This tool is executed by the AI Gateway and returns web search results that the model can use to provide up-to-date information.

```
1import { gateway, generateText } from 'ai';2
3const result = await generateText({4 model: 'openai/gpt-5-nano',5 prompt: 'Search for news about AI regulations in January 2025.',6 tools: {7 perplexity_search: gateway.tools.perplexitySearch(),8 },9});10
11console.log(result.text);12console.log('Tool calls:', JSON.stringify(result.toolCalls, null, 2));13console.log('Tool results:', JSON.stringify(result.toolResults, null, 2));
```

You can also configure the search with optional parameters:

```
1import { gateway, generateText } from 'ai';2
3const result = await generateText({4 model: 'openai/gpt-5-nano',5 prompt:6 'Search for news about AI regulations from the first week of January 2025.',7 tools: {8 perplexity_search: gateway.tools.perplexitySearch({9 maxResults: 5,10 searchLanguageFilter: ['en'],11 country: 'US',12 searchDomainFilter: ['reuters.com', 'bbc.com', 'nytimes.com'],13 }),14 },15});16
17console.log(result.text);18console.log('Tool calls:', JSON.stringify(result.toolCalls, null, 2));19console.log('Tool results:', JSON.stringify(result.toolResults, null, 2));
```

The Perplexity Search tool supports the following optional configuration options:

* **maxResults** _number_
 
 The maximum number of search results to return (1-20, default: 10).
 
* **maxTokensPerPage** _number_
 
 The maximum number of tokens to extract per search result page (256-2048, default: 2048).
 
* **maxTokens** _number_
 
 The maximum total tokens across all search results (default: 25000, max: 1000000).
 
* **searchLanguageFilter** _string\[\]_
 
 Filter search results by language using ISO 639-1 language codes (e.g., `['en']` for English, `['en', 'es']` for English and Spanish).
 
* **country** _string_
 
 Filter search results by country using ISO 3166-1 alpha-2 country codes (e.g., `'US'` for United States, `'GB'` for United Kingdom).
 
* **searchDomainFilter** _string\[\]_
 
 Limit search results to specific domains (e.g., `['reuters.com', 'bbc.com']`). This is useful for restricting results to trusted sources.
 
* **searchRecencyFilter** _'day' | 'week' | 'month' | 'year'_
 
 Filter search results by relative time period. Useful for always getting recent results (e.g., 'week' for results from the last week).
 

The tool works with both `generateText` and `streamText`:

```
1import { gateway, streamText } from 'ai';2
3const result = streamText({4 model: 'openai/gpt-5-nano',5 prompt: 'Search for the latest news about AI regulations.',6 tools: {7 perplexity_search: gateway.tools.perplexitySearch(),8 },9});10
11for await (const part of result.fullStream) {12 switch (part.type) {13 case 'text-delta':14 process.stdout.write(part.text);15 break;16 case 'tool-call':17 console.log('\nTool call:', JSON.stringify(part, null, 2));18 break;19 case 'tool-result':20 console.log('\nTool result:', JSON.stringify(part, null, 2));21 break;22 }23}
```

#### [Parallel Search](#parallel-search)

The Parallel Search tool enables models to search the web using [Parallel AI's Search API](https://docs.parallel.ai/api-reference/search-beta/search). This tool is optimized for LLM consumption, returning relevant excerpts from web pages that can replace multiple keyword searches with a single call.

```
1import { gateway, generateText } from 'ai';2
3const result = await generateText({4 model: 'openai/gpt-5-nano',5 prompt: 'Research the latest developments in quantum computing.',6 tools: {7 parallel_search: gateway.tools.parallelSearch(),8 },9});10
11console.log(result.text);12console.log('Tool calls:', JSON.stringify(result.toolCalls, null, 2));13console.log('Tool results:', JSON.stringify(result.toolResults, null, 2));
```

You can also configure the search with optional parameters:

```
1import { gateway, generateText } from 'ai';2
3const result = await generateText({4 model: 'openai/gpt-5-nano',5 prompt: 'Find detailed information about TypeScript 5.0 features.',6 tools: {7 parallel_search: gateway.tools.parallelSearch({8 mode: 'agentic',9 maxResults: 5,10 sourcePolicy: {11 includeDomains: ['typescriptlang.org', 'github.com'],12 },13 excerpts: {14 maxCharsPerResult: 8000,15 },16 }),17 },18});19
20console.log(result.text);21console.log('Tool calls:', JSON.stringify(result.toolCalls, null, 2));22console.log('Tool results:', JSON.stringify(result.toolResults, null, 2));
```

The Parallel Search tool supports the following optional configuration options:

* **mode** _'one-shot' | 'agentic'_
 
 Mode preset for different use cases:
 
 * `'one-shot'` - Comprehensive results with longer excerpts for single-response answers (default)
 * `'agentic'` - Concise, token-efficient results optimized for multi-step agentic workflows
* **maxResults** _number_
 
 Maximum number of results to return (1-20). Defaults to 10 if not specified.
 
* **sourcePolicy** _object_
 
 Source policy for controlling which domains to include/exclude:
 
 * `includeDomains` - List of domains to include in search results
 * `excludeDomains` - List of domains to exclude from search results
 * `afterDate` - Only include results published after this date (ISO 8601 format)
* **excerpts** _object_
 
 Excerpt configuration for controlling result length:
 
 * `maxCharsPerResult` - Maximum characters per result
 * `maxCharsTotal` - Maximum total characters across all results
* **fetchPolicy** _object_
 
 Fetch policy for controlling content freshness:
 
 * `maxAgeSeconds` - Maximum age in seconds for cached content (set to 0 for always fresh)

The tool works with both `generateText` and `streamText`:

```
1import { gateway, streamText } from 'ai';2
3const result = streamText({4 model: 'openai/gpt-5-nano',5 prompt: 'Research the latest AI safety guidelines.',6 tools: {7 parallel_search: gateway.tools.parallelSearch(),8 },9});10
11for await (const part of result.fullStream) {12 switch (part.type) {13 case 'text-delta':14 process.stdout.write(part.text);15 break;16 case 'tool-call':17 console.log('\nTool call:', JSON.stringify(part, null, 2));18 break;19 case 'tool-result':20 console.log('\nTool result:', JSON.stringify(part, null, 2));21 break;22 }23}
```

### [Usage Tracking with User and Tags](#usage-tracking-with-user-and-tags)

Track usage per end-user and categorize requests with tags:

```
1import type { GatewayLanguageModelOptions } from '@ai-sdk/gateway';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: 'openai/gpt-5',6 prompt: 'Summarize this document...',7 providerOptions: {8 gateway: {9 user: 'user-abc-123', // Track usage for this specific end-user10 tags: ['document-summary', 'premium-feature'], // Categorize for reporting11 } satisfies GatewayLanguageModelOptions,12 },13});
```

This allows you to:

* View usage and costs broken down by end-user in your analytics
* Filter and analyze spending by feature or use case using tags
* Track which users or features are driving the most AI usage

## [Provider Options](#provider-options)

The AI Gateway provider accepts provider options that control routing behavior and provider-specific configurations.

### [Gateway Provider Options](#gateway-provider-options)

You can use the `gateway` key in `providerOptions` to control how AI Gateway routes requests:

```
1import type { GatewayLanguageModelOptions } from '@ai-sdk/gateway';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: 'anthropic/claude-sonnet-4',6 prompt: 'Explain quantum computing',7 providerOptions: {8 gateway: {9 order: ['vertex', 'anthropic'], // Try Vertex AI first, then Anthropic10 only: ['vertex', 'anthropic'], // Only use these providers11 } satisfies GatewayLanguageModelOptions,12 },13});
```

The following gateway provider options are available:

* **order** _string\[\]_
 
 Specifies the sequence of providers to attempt when routing requests. The gateway will try providers in the order specified. If a provider fails or is unavailable, it will move to the next provider in the list.
 
 Example: `order: ['bedrock', 'anthropic']` will attempt Amazon Bedrock first, then fall back to Anthropic.
 
* **only** _string\[\]_
 
 Restricts routing to only the specified providers. When set, the gateway will never route to providers not in this list, even if they would otherwise be available.
 
 Example: `only: ['anthropic', 'vertex']` will only allow routing to Anthropic or Vertex AI.
 
* **models** _string\[\]_
 
 Specifies fallback models to use when the primary model fails or is unavailable. The gateway will try the primary model first (specified in the `model` parameter), then try each model in this array in order until one succeeds.
 
 Example: `models: ['openai/gpt-5-nano', 'gemini-2.0-flash']` will try the fallback models in order if the primary model fails.
 
* **user** _string_
 
 Optional identifier for the end user on whose behalf the request is being made. This is used for spend tracking and attribution purposes, allowing you to track usage per end-user in your application.
 
 Example: `user: 'user-123'` will associate this request with end-user ID "user-123" in usage reports.
 
* **tags** _string\[\]_
 
 Optional array of tags for categorizing and filtering usage in reports. Useful for tracking spend by feature, prompt version, or any other dimension relevant to your application.
 
 Example: `tags: ['chat', 'v2']` will tag this request with "chat" and "v2" for filtering in usage analytics.
 
* **byok** _Record<string, Array<Record<string, unknown>>>_
 
 Request-scoped BYOK (Bring Your Own Key) credentials to use for this request. When provided, any cached BYOK credentials configured in the gateway system are not considered. Requests may still fall back to use system credentials if the provided credentials fail.
 
 Each provider can have multiple credentials (tried in order). The structure is a record where keys are provider slugs and values are arrays of credential objects.
 
 Examples:
 
 * Single provider: `byok: { 'anthropic': [{ apiKey: 'sk-ant-...' }] }`
 * Multiple credentials: `byok: { 'vertex': [{ project: 'proj-1', googleCredentials: { privateKey: '...', clientEmail: '...' } }, { project: 'proj-2', googleCredentials: { privateKey: '...', clientEmail: '...' } }] }`
 * Multiple providers: `byok: { 'anthropic': [{ apiKey: '...' }], 'bedrock': [{ accessKeyId: '...', secretAccessKey: '...' }] }`
* **zeroDataRetention** _boolean_
 
 Restricts routing requests to providers that have zero data retention policies.
 
* **providerTimeouts** _object_
 
 Per-provider timeouts for BYOK credentials in milliseconds. Controls how long to wait for a provider to start responding before falling back to the next available provider.
 
 Example: `providerTimeouts: { byok: { openai: 5000, anthropic: 2000 } }`
 
 For full details, see [Provider Timeouts](https://vercel.com/docs/ai-gateway/models-and-providers/provider-timeouts).
 

You can combine these options to have fine-grained control over routing and tracking:

```
1import type { GatewayLanguageModelOptions } from '@ai-sdk/gateway';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: 'anthropic/claude-sonnet-4',6 prompt: 'Write a haiku about programming',7 providerOptions: {8 gateway: {9 order: ['vertex'], // Prefer Vertex AI10 only: ['anthropic', 'vertex'], // Only allow these providers11 } satisfies GatewayLanguageModelOptions,12 },13});
```

#### [Model Fallbacks Example](#model-fallbacks-example)

The `models` option enables automatic fallback to alternative models when the primary model fails:

```
1import type { GatewayLanguageModelOptions } from '@ai-sdk/gateway';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: 'openai/gpt-4o', // Primary model6 prompt: 'Write a TypeScript haiku',7 providerOptions: {8 gateway: {9 models: ['openai/gpt-5-nano', 'gemini-2.0-flash'], // Fallback models10 } satisfies GatewayLanguageModelOptions,11 },12});13
14// This will:15// 1. Try openai/gpt-4o first16// 2. If it fails, try openai/gpt-5-nano17// 3. If that fails, try gemini-2.0-flash18// 4. Return the result from the first model that succeeds
```

#### [Zero Data Retention Example](#zero-data-retention-example)

Set `zeroDataRetention` to true to ensure requests are only routed to providers that have zero data retention policies. When `zeroDataRetention` is `false` or not specified, there is no enforcement of restricting routing.

```
1import type { GatewayLanguageModelOptions } from '@ai-sdk/gateway';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: 'anthropic/claude-sonnet-4.5',6 prompt: 'Analyze this sensitive document...',7 providerOptions: {8 gateway: {9 zeroDataRetention: true,10 } satisfies GatewayLanguageModelOptions,11 },12});
```

### [Provider-Specific Options](#provider-specific-options)

When using provider-specific options through AI Gateway, use the actual provider name (e.g. `anthropic`, `openai`, not `gateway`) as the key:

```
1import type { AnthropicLanguageModelOptions } from '@ai-sdk/anthropic';2import type { GatewayLanguageModelOptions } from '@ai-sdk/gateway';3import { generateText } from 'ai';4
5const { text } = await generateText({6 model: 'anthropic/claude-sonnet-4',7 prompt: 'Explain quantum computing',8 providerOptions: {9 gateway: {10 order: ['vertex', 'anthropic'],11 } satisfies GatewayLanguageModelOptions,12 anthropic: {13 thinking: { type: 'enabled', budgetTokens: 12000 },14 } satisfies AnthropicLanguageModelOptions,15 },16});
```

This works with any provider supported by AI Gateway. Each provider has its own set of options - see the individual [provider documentation pages](https://ai-sdk.dev/providers/ai-sdk-providers) for details on provider-specific options.

### [Available Providers](#available-providers)

AI Gateway supports routing to 20+ providers.

For a complete list of available providers and their slugs, see the [AI Gateway documentation](https://vercel.com/docs/ai-gateway/provider-options#available-providers).

## [Model Capabilities](#model-capabilities)

Model capabilities depend on the specific provider and model you're using. For detailed capability information, see:

* [AI Gateway provider options](https://vercel.com/docs/ai-gateway/provider-options#available-providers) for an overview of available providers
* Individual [AI SDK provider pages](https://ai-sdk.dev/providers/ai-sdk-providers) for specific model capabilities and features

---
url: https://ai-sdk.dev/providers/ai-sdk-providers
title: "AI SDK Providers"
description: "Learn how to use AI SDK providers."
hash: "a1565e521e4e8859e50d468c5017578042c36037dbc9460d8d0589c0c552f1c6"
crawledAt: 2026-03-07T08:03:58.265Z
depth: 2
---

[xAI Grok](https://ai-sdk.dev/providers/ai-sdk-providers/xai)`grok-4-fast-reasoning`[xAI Grok](https://ai-sdk.dev/providers/ai-sdk-providers/xai)`grok-4`[xAI Grok](https://ai-sdk.dev/providers/ai-sdk-providers/xai)`grok-3`[xAI Grok](https://ai-sdk.dev/providers/ai-sdk-providers/xai)`grok-3-mini`[xAI Grok](https://ai-sdk.dev/providers/ai-sdk-providers/xai)`grok-2-vision-1212`[Vercel](https://ai-sdk.dev/providers/ai-sdk-providers/vercel)`v0-1.0-md`[OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai)`gpt-5.2-pro`[OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai)`gpt-5.2`[OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai)`gpt-5.1`[OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai)`gpt-5.1-codex`[OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai)`gpt-5`[OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai)`gpt-5-mini`[OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai)`gpt-4.1`[OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai)`gpt-4.1-mini`[OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai)`gpt-4o`[OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai)`gpt-4o-mini`[Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)`claude-opus-4-6`[Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)`claude-sonnet-4-6`[Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)`claude-opus-4-5`[Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)`claude-sonnet-4-5`[Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)`claude-haiku-4-5`[Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)`claude-opus-4-1`[Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)`claude-sonnet-4-0`[Google Generative AI](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai)`gemini-3.1-pro-preview`[Google Generative AI](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai)`gemini-3-pro-preview`[Google Generative AI](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai)`gemini-2.5-pro`[Google Generative AI](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai)`gemini-2.5-flash`[Google Vertex](https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex)`gemini-3.1-pro-preview`[Google Vertex](https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex)`gemini-3-pro-preview`[Google Vertex](https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex)`gemini-2.5-pro`[Google Vertex](https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex)`gemini-2.5-flash`[Mistral](https://ai-sdk.dev/providers/ai-sdk-providers/mistral)`pixtral-large-latest`[Mistral](https://ai-sdk.dev/providers/ai-sdk-providers/mistral)`mistral-large-latest`[Mistral](https://ai-sdk.dev/providers/ai-sdk-providers/mistral)`magistral-medium-2506`[Mistral](https://ai-sdk.dev/providers/ai-sdk-providers/mistral)`magistral-small-2506`[Mistral](https://ai-sdk.dev/providers/ai-sdk-providers/mistral)`mistral-small-latest`[Mistral](https://ai-sdk.dev/providers/ai-sdk-providers/mistral)`ministral-8b-latest`[Cohere](https://ai-sdk.dev/providers/ai-sdk-providers/cohere)`command-a-03-2025`[Cohere](https://ai-sdk.dev/providers/ai-sdk-providers/cohere)`command-a-reasoning-08-2025`[Cohere](https://ai-sdk.dev/providers/ai-sdk-providers/cohere)`command-r-plus`[Cohere](https://ai-sdk.dev/providers/ai-sdk-providers/cohere)`command-r`[DeepSeek](https://ai-sdk.dev/providers/ai-sdk-providers/deepseek)`deepseek-chat`[DeepSeek](https://ai-sdk.dev/providers/ai-sdk-providers/deepseek)`deepseek-reasoner`[Moonshot AI](https://ai-sdk.dev/providers/ai-sdk-providers/moonshotai)`kimi-k2.5`[Moonshot AI](https://ai-sdk.dev/providers/ai-sdk-providers/moonshotai)`kimi-k2-thinking`[Groq](https://ai-sdk.dev/providers/ai-sdk-providers/groq)`meta-llama/llama-4-scout-17b-16e-instruct`[Groq](https://ai-sdk.dev/providers/ai-sdk-providers/groq)`llama-3.3-70b-versatile`[Groq](https://ai-sdk.dev/providers/ai-sdk-providers/groq)`deepseek-r1-distill-llama-70b`[Groq](https://ai-sdk.dev/providers/ai-sdk-providers/groq)`qwen-qwq-32b`[Groq](https://ai-sdk.dev/providers/ai-sdk-providers/groq)`openai/gpt-oss-120b`[Together AI](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai)`meta-llama/Meta-Llama-3.3-70B-Instruct-Turbo`[Together AI](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai)`Qwen/Qwen2.5-72B-Instruct-Turbo`[Together AI](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai)`deepseek-ai/DeepSeek-V3`[Together AI](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai)`mistralai/Mixtral-8x22B-Instruct-v0.1`[Fireworks](https://ai-sdk.dev/providers/ai-sdk-providers/fireworks)`accounts/fireworks/models/deepseek-r1`[Fireworks](https://ai-sdk.dev/providers/ai-sdk-providers/fireworks)`accounts/fireworks/models/deepseek-v3`[Fireworks](https://ai-sdk.dev/providers/ai-sdk-providers/fireworks)`accounts/fireworks/models/llama-v3p3-70b-instruct`[Fireworks](https://ai-sdk.dev/providers/ai-sdk-providers/fireworks)`accounts/fireworks/models/qwen2-vl-72b-instruct`[Alibaba](https://ai-sdk.dev/providers/ai-sdk-providers/alibaba)`qwen3-max`[Alibaba](https://ai-sdk.dev/providers/ai-sdk-providers/alibaba)`qwen-plus`[DeepInfra](https://ai-sdk.dev/providers/ai-sdk-providers/deepinfra)`meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8`[DeepInfra](https://ai-sdk.dev/providers/ai-sdk-providers/deepinfra)`meta-llama/Llama-4-Scout-17B-16E-Instruct`[DeepInfra](https://ai-sdk.dev/providers/ai-sdk-providers/deepinfra)`meta-llama/Llama-3.3-70B-Instruct`[DeepInfra](https://ai-sdk.dev/providers/ai-sdk-providers/deepinfra)`deepseek-ai/DeepSeek-V3`[DeepInfra](https://ai-sdk.dev/providers/ai-sdk-providers/deepinfra)`deepseek-ai/DeepSeek-R1`[DeepInfra](https://ai-sdk.dev/providers/ai-sdk-providers/deepinfra)`Qwen/QwQ-32B`[Cerebras](https://ai-sdk.dev/providers/ai-sdk-providers/cerebras)`llama3.3-70b`[Cerebras](https://ai-sdk.dev/providers/ai-sdk-providers/cerebras)`gpt-oss-120b`[Cerebras](https://ai-sdk.dev/providers/ai-sdk-providers/cerebras)`qwen-3-32b`[Hugging Face](https://ai-sdk.dev/providers/ai-sdk-providers/huggingface)`meta-llama/Llama-3.1-8B-Instruct`[Hugging Face](https://ai-sdk.dev/providers/ai-sdk-providers/huggingface)`moonshotai/Kimi-K2-Instruct`[Baseten](https://ai-sdk.dev/providers/ai-sdk-providers/baseten)`Qwen/Qwen3-235B-A22B-Instruct-2507`[Baseten](https://ai-sdk.dev/providers/ai-sdk-providers/baseten)`deepseek-ai/DeepSeek-V3.1`[Baseten](https://ai-sdk.dev/providers/ai-sdk-providers/baseten)`moonshotai/Kimi-K2-Instruct-0905`

---
url: https://ai-sdk.dev/providers/ai-sdk-providers/xai
title: "AI SDK Providers: xAI Grok"
description: "Learn how to use xAI Grok."
hash: "1210086c34b36e714535e52e6674ff7aee399232c23ca71e3b7f13f6b11fc838"
crawledAt: 2026-03-07T08:04:04.236Z
depth: 2
---

## [xAI Grok Provider](#xai-grok-provider)

The [xAI Grok](https://x.ai/) provider contains language model support for the [xAI API](https://x.ai/api).

## [Setup](#setup)

The xAI Grok provider is available via the `@ai-sdk/xai` module. You can install it with

pnpm add @ai-sdk/xai

## [Provider Instance](#provider-instance)

You can import the default provider instance `xai` from `@ai-sdk/xai`:

```
1import { xai } from '@ai-sdk/xai';
```

If you need a customized setup, you can import `createXai` from `@ai-sdk/xai` and create a provider instance with your settings:

```
1import { createXai } from '@ai-sdk/xai';2
3const xai = createXai({4 apiKey: 'your-api-key',5});
```

You can use the following optional settings to customize the xAI provider instance:

* **baseURL** _string_
 
 Use a different URL prefix for API calls, e.g. to use proxy servers. The default prefix is `https://api.x.ai/v1`.
 
* **apiKey** _string_
 
 API key that is being sent using the `Authorization` header. It defaults to the `XAI_API_KEY` environment variable.
 
* **headers** _Record<string,string>_
 
 Custom headers to include in the requests.
 
* **fetch** _(input: RequestInfo, init?: RequestInit) => Promise<Response>_
 
 Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation. Defaults to the global `fetch` function. You can use it as a middleware to intercept requests, or to provide a custom fetch implementation for e.g. testing.
 

## [Language Models](#language-models)

You can create [xAI models](https://console.x.ai/) using a provider instance. The first argument is the model id, e.g. `grok-3`.

```
1const model = xai('grok-3');
```

By default, `xai(modelId)` uses the Chat API. To use the Responses API with server-side agentic tools, explicitly use `xai.responses(modelId)`.

### [Example](#example)

You can use xAI language models to generate text with the `generateText` function:

```
1import { xai } from '@ai-sdk/xai';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: xai('grok-3'),6 prompt: 'Write a vegetarian lasagna recipe for 4 people.',7});
```

xAI language models can also be used in the `streamText` function and support structured data generation with [`Output`](https://ai-sdk.dev/docs/reference/ai-sdk-core/output) (see [AI SDK Core](https://ai-sdk.dev/docs/ai-sdk-core)).

### [Provider Options](#provider-options)

xAI chat models support additional provider options that are not part of the [standard call settings](https://ai-sdk.dev/docs/ai-sdk-core/settings). You can pass them in the `providerOptions` argument:

```
1import { xai, type XaiLanguageModelChatOptions } from '@ai-sdk/xai';2
3const model = xai('grok-3-mini');4
5await generateText({6 model,7 providerOptions: {8 xai: {9 reasoningEffort: 'high',10 } satisfies XaiLanguageModelChatOptions,11 },12});
```

The following optional provider options are available for xAI chat models:

* **reasoningEffort** _'low' | 'high'_
 
 Reasoning effort for reasoning models.
 
* **logprobs** _boolean_
 
 Return log probabilities for output tokens.
 
* **topLogprobs** _number_
 
 Number of most likely tokens to return per token position (0-8). When set, `logprobs` is automatically enabled.
 
* **parallel\_function\_calling** _boolean_
 
 Whether to enable parallel function calling during tool use. When true, the model can call multiple functions in parallel. When false, the model will call functions sequentially. Defaults to `true`.
 

## [Responses API (Agentic Tools)](#responses-api-agentic-tools)

You can use the xAI Responses API with the `xai.responses(modelId)` factory method for server-side agentic tool calling. This enables the model to autonomously orchestrate tool calls and research on xAI's servers.

```
1const model = xai.responses('grok-4-fast-non-reasoning');
```

The Responses API provides server-side tools that the model can autonomously execute during its reasoning process:

* **web\_search**: Real-time web search and page browsing
* **x\_search**: Search X (Twitter) posts, users, and threads
* **code\_execution**: Execute Python code for calculations and data analysis
* **view\_image**: View and analyze images
* **view\_x\_video**: View and analyze videos from X posts
* **mcp\_server**: Connect to remote MCP servers and use their tools
* **file\_search**: Search through documents in vector stores (collections)

### [Vision](#vision)

The Responses API supports image input with vision models:

```
1import { xai } from '@ai-sdk/xai';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: xai.responses('grok-2-vision-1212'),6 messages: [7 {8 role: 'user',9 content: [10 { type: 'text', text: 'What do you see in this image?' },11 { type: 'image', image: fs.readFileSync('./image.png') },12 ],13 },14 ],15});
```

### [Web Search Tool](#web-search-tool)

The web search tool enables autonomous web research with optional domain filtering and image understanding:

```
1import { xai } from '@ai-sdk/xai';2import { generateText } from 'ai';3
4const { text, sources } = await generateText({5 model: xai.responses('grok-4-fast-non-reasoning'),6 prompt: 'What are the latest developments in AI?',7 tools: {8 web_search: xai.tools.webSearch({9 allowedDomains: ['arxiv.org', 'openai.com'],10 enableImageUnderstanding: true,11 }),12 },13});14
15console.log(text);16console.log('Citations:', sources);
```

#### [Web Search Parameters](#web-search-parameters)

* **allowedDomains** _string\[\]_
 
 Only search within specified domains (max 5). Cannot be used with `excludedDomains`.
 
* **excludedDomains** _string\[\]_
 
 Exclude specified domains from search (max 5). Cannot be used with `allowedDomains`.
 
* **enableImageUnderstanding** _boolean_
 
 Enable the model to view and analyze images found during search. Increases token usage.
 

### [X Search Tool](#x-search-tool)

The X search tool enables searching X (Twitter) for posts, with filtering by handles and date ranges:

```
1const { text, sources } = await generateText({2 model: xai.responses('grok-4-fast-non-reasoning'),3 prompt: 'What are people saying about AI on X this week?',4 tools: {5 x_search: xai.tools.xSearch({6 allowedXHandles: ['elonmusk', 'xai'],7 fromDate: '2025-10-23',8 toDate: '2025-10-30',9 enableImageUnderstanding: true,10 enableVideoUnderstanding: true,11 }),12 },13});
```

#### [X Search Parameters](#x-search-parameters)

* **allowedXHandles** _string\[\]_
 
 Only search posts from specified X handles (max 10). Cannot be used with `excludedXHandles`.
 
* **excludedXHandles** _string\[\]_
 
 Exclude posts from specified X handles (max 10). Cannot be used with `allowedXHandles`.
 
* **fromDate** _string_
 
 Start date for posts in ISO8601 format (`YYYY-MM-DD`).
 
* **toDate** _string_
 
 End date for posts in ISO8601 format (`YYYY-MM-DD`).
 
* **enableImageUnderstanding** _boolean_
 
 Enable the model to view and analyze images in X posts.
 
* **enableVideoUnderstanding** _boolean_
 
 Enable the model to view and analyze videos in X posts.
 

### [Code Execution Tool](#code-execution-tool)

The code execution tool enables the model to write and execute Python code for calculations and data analysis:

```
1const { text } = await generateText({2 model: xai.responses('grok-4-fast-non-reasoning'),3 prompt:4 'Calculate the compound interest for $10,000 at 5% annually for 10 years',5 tools: {6 code_execution: xai.tools.codeExecution(),7 },8});
```

### [View Image Tool](#view-image-tool)

The view image tool enables the model to view and analyze images:

```
1const { text } = await generateText({2 model: xai.responses('grok-4-fast-non-reasoning'),3 prompt: 'Describe what you see in the image',4 tools: {5 view_image: xai.tools.viewImage(),6 },7});
```

### [View X Video Tool](#view-x-video-tool)

The view X video tool enables the model to view and analyze videos from X (Twitter) posts:

```
1const { text } = await generateText({2 model: xai.responses('grok-4-fast-non-reasoning'),3 prompt: 'Summarize the content of this X video',4 tools: {5 view_x_video: xai.tools.viewXVideo(),6 },7});
```

### [MCP Server Tool](#mcp-server-tool)

The MCP server tool enables the model to connect to remote [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers and use their tools:

```
1const { text } = await generateText({2 model: xai.responses('grok-4-fast-non-reasoning'),3 prompt: 'Use the weather tool to check conditions in San Francisco',4 tools: {5 weather_server: xai.tools.mcpServer({6 serverUrl: 'https://example.com/mcp',7 serverLabel: 'weather-service',8 serverDescription: 'Weather data provider',9 allowedTools: ['get_weather', 'get_forecast'],10 }),11 },12});
```

#### [MCP Server Parameters](#mcp-server-parameters)

* **serverUrl** _string_ (required)
 
 The URL of the remote MCP server.
 
* **serverLabel** _string_
 
 A label to identify the MCP server.
 
* **serverDescription** _string_
 
 A description of what the MCP server provides.
 
* **allowedTools** _string\[\]_
 
 List of tool names that the model is allowed to use from the MCP server. If not specified, all tools are allowed.
 
* **headers** _Record<string, string>_
 
 Custom headers to include when connecting to the MCP server.
 
* **authorization** _string_
 
 Authorization header value for authenticating with the MCP server (e.g., `'Bearer token123'`).
 

### [File Search Tool](#file-search-tool)

The file search tool enables searching through documents stored in xAI vector stores (collections):

```
1import { xai, type XaiLanguageModelResponsesOptions } from '@ai-sdk/xai';2import { streamText } from 'ai';3
4const result = streamText({5 model: xai.responses('grok-4-1-fast-reasoning'),6 prompt: 'What documents do you have access to?',7 tools: {8 file_search: xai.tools.fileSearch({9 vectorStoreIds: ['collection_your-collection-id'],10 maxNumResults: 10,11 }),12 },13 providerOptions: {14 xai: {15 include: ['file_search_call.results'],16 } satisfies XaiLanguageModelResponsesOptions,17 },18});
```

#### [File Search Parameters](#file-search-parameters)

* **vectorStoreIds** _string\[\]_ (required)
 
 The IDs of the vector stores (collections) to search.
 
* **maxNumResults** _number_
 
 The maximum number of results to return from the search.
 

#### [Provider Options for File Search](#provider-options-for-file-search)

* **include** _Array<'file\_search\_call.results'>_
 
 Include file search results in the response. When set to `['file_search_call.results']`, the response will contain the actual search results with file content and scores.
 

File search requires grok-4 family models and the Responses API. Vector stores can be created using the [xAI API](https://docs.x.ai/docs/guides/using-collections/api).

### [Multiple Tools](#multiple-tools)

You can combine multiple server-side tools for comprehensive research:

```
1import { xai } from '@ai-sdk/xai';2import { streamText } from 'ai';3
4const { fullStream } = streamText({5 model: xai.responses('grok-4-fast-non-reasoning'),6 prompt: 'Research AI safety developments and calculate risk metrics',7 tools: {8 web_search: xai.tools.webSearch(),9 x_search: xai.tools.xSearch(),10 code_execution: xai.tools.codeExecution(),11 file_search: xai.tools.fileSearch({12 vectorStoreIds: ['collection_your-documents'],13 }),14 data_service: xai.tools.mcpServer({15 serverUrl: 'https://data.example.com/mcp',16 serverLabel: 'data-service',17 }),18 },19});20
21for await (const part of fullStream) {22 if (part.type === 'text-delta') {23 process.stdout.write(part.text);24 } else if (part.type === 'source' && part.sourceType === 'url') {25 console.log('\nSource:', part.url);26 }27}
```

### [Provider Options](#provider-options-1)

The Responses API supports the following provider options:

```
1import { xai, type XaiLanguageModelResponsesOptions } from '@ai-sdk/xai';2import { generateText } from 'ai';3
4const result = await generateText({5 model: xai.responses('grok-4-fast-non-reasoning'),6 providerOptions: {7 xai: {8 reasoningEffort: 'high',9 } satisfies XaiLanguageModelResponsesOptions,10 },11 //...12});
```

The following provider options are available:

* **reasoningEffort** _'low' | 'medium' | 'high'_
 
 Control the reasoning effort for the model. Higher effort may produce more thorough results at the cost of increased latency and token usage.
 
* **logprobs** _boolean_
 
 Return log probabilities for output tokens.
 
* **topLogprobs** _number_
 
 Number of most likely tokens to return per token position (0-8). When set, `logprobs` is automatically enabled.
 
* **include** _Array<'file\_search\_call.results'>_
 
 Specify additional output data to include in the model response. Use `['file_search_call.results']` to include file search results with scores and content.
 
* **store** _boolean_
 
 Whether to store the input message(s) and model response for later retrieval. Defaults to `true`.
 
* **previousResponseId** _string_
 
 The ID of the previous response from the model. You can use it to continue a conversation.
 

The Responses API only supports server-side tools. You cannot mix server-side tools with client-side function tools in the same request.

## [Live Search](#live-search)

xAI models support Live Search functionality, allowing them to query real-time data from various sources and include it in responses with citations.

### [Basic Search](#basic-search)

To enable search, specify `searchParameters` with a search mode:

```
1import { xai, type XaiLanguageModelChatOptions } from '@ai-sdk/xai';2import { generateText } from 'ai';3
4const { text, sources } = await generateText({5 model: xai('grok-3-latest'),6 prompt: 'What are the latest developments in AI?',7 providerOptions: {8 xai: {9 searchParameters: {10 mode: 'auto', // 'auto', 'on', or 'off'11 returnCitations: true,12 maxSearchResults: 5,13 },14 } satisfies XaiLanguageModelChatOptions,15 },16});17
18console.log(text);19console.log('Sources:', sources);
```

### [Search Parameters](#search-parameters)

The following search parameters are available:

* **mode** _'auto' | 'on' | 'off'_
 
 Search mode preference:
 
 * `'auto'` (default): Model decides whether to search
 * `'on'`: Always enables search
 * `'off'`: Disables search completely
* **returnCitations** _boolean_
 
 Whether to return citations in the response. Defaults to `true`.
 
* **fromDate** _string_
 
 Start date for search data in ISO8601 format (`YYYY-MM-DD`).
 
* **toDate** _string_
 
 End date for search data in ISO8601 format (`YYYY-MM-DD`).
 
* **maxSearchResults** _number_
 
 Maximum number of search results to consider. Defaults to 20, max 50.
 
* **sources** _Array<SearchSource>_
 
 Data sources to search from. Defaults to `["web", "x"]` if not specified.
 

### [Search Sources](#search-sources)

You can specify different types of data sources for search:

#### [Web Search](#web-search)

```
1import { xai, type XaiLanguageModelChatOptions } from '@ai-sdk/xai';2
3const result = await generateText({4 model: xai('grok-3-latest'),5 prompt: 'Best ski resorts in Switzerland',6 providerOptions: {7 xai: {8 searchParameters: {9 mode: 'on',10 sources: [11 {12 type: 'web',13 country: 'CH', // ISO alpha-2 country code14 allowedWebsites: ['ski.com', 'snow-forecast.com'],15 safeSearch: true,16 },17 ],18 },19 } satisfies XaiLanguageModelChatOptions,20 },21});
```

#### [Web source parameters](#web-source-parameters)

* **country** _string_: ISO alpha-2 country code
* **allowedWebsites** _string\[\]_: Max 5 allowed websites
* **excludedWebsites** _string\[\]_: Max 5 excluded websites
* **safeSearch** _boolean_: Enable safe search (default: true)

#### [X (Twitter) Search](#x-twitter-search)

```
1import { xai, type XaiLanguageModelChatOptions } from '@ai-sdk/xai';2
3const result = await generateText({4 model: xai('grok-3-latest'),5 prompt: 'Latest updates on Grok AI',6 providerOptions: {7 xai: {8 searchParameters: {9 mode: 'on',10 sources: [11 {12 type: 'x',13 includedXHandles: ['grok', 'xai'],14 excludedXHandles: ['openai'],15 postFavoriteCount: 10,16 postViewCount: 100,17 },18 ],19 },20 } satisfies XaiLanguageModelChatOptions,21 },22});
```

#### [X source parameters](#x-source-parameters)

* **includedXHandles** _string\[\]_: Array of X handles to search (without @ symbol)
* **excludedXHandles** _string\[\]_: Array of X handles to exclude from search (without @ symbol)
* **postFavoriteCount** _number_: Minimum favorite count of the X posts to consider.
* **postViewCount** _number_: Minimum view count of the X posts to consider.

#### [News Search](#news-search)

```
1import { xai, type XaiLanguageModelChatOptions } from '@ai-sdk/xai';2
3const result = await generateText({4 model: xai('grok-3-latest'),5 prompt: 'Recent tech industry news',6 providerOptions: {7 xai: {8 searchParameters: {9 mode: 'on',10 sources: [11 {12 type: 'news',13 country: 'US',14 excludedWebsites: ['tabloid.com'],15 safeSearch: true,16 },17 ],18 },19 } satisfies XaiLanguageModelChatOptions,20 },21});
```

#### [News source parameters](#news-source-parameters)

* **country** _string_: ISO alpha-2 country code
* **excludedWebsites** _string\[\]_: Max 5 excluded websites
* **safeSearch** _boolean_: Enable safe search (default: true)

```
1import { xai, type XaiLanguageModelChatOptions } from '@ai-sdk/xai';2
3const result = await generateText({4 model: xai('grok-3-latest'),5 prompt: 'Latest status updates',6 providerOptions: {7 xai: {8 searchParameters: {9 mode: 'on',10 sources: [11 {12 type: 'rss',13 links: ['https://status.x.ai/feed.xml'],14 },15 ],16 },17 } satisfies XaiLanguageModelChatOptions,18 },19});
```

* **links** _string\[\]_: Array of RSS feed URLs (max 1 currently supported)

### [Multiple Sources](#multiple-sources)

You can combine multiple data sources in a single search:

```
1import { xai, type XaiLanguageModelChatOptions } from '@ai-sdk/xai';2
3const result = await generateText({4 model: xai('grok-3-latest'),5 prompt: 'Comprehensive overview of recent AI breakthroughs',6 providerOptions: {7 xai: {8 searchParameters: {9 mode: 'on',10 returnCitations: true,11 maxSearchResults: 15,12 sources: [13 {14 type: 'web',15 allowedWebsites: ['arxiv.org', 'openai.com'],16 },17 {18 type: 'news',19 country: 'US',20 },21 {22 type: 'x',23 includedXHandles: ['openai', 'deepmind'],24 },25 ],26 },27 } satisfies XaiLanguageModelChatOptions,28 },29});
```

### [Sources and Citations](#sources-and-citations)

When search is enabled with `returnCitations: true`, the response includes sources that were used to generate the answer:

```
1import { xai, type XaiLanguageModelChatOptions } from '@ai-sdk/xai';2
3const { text, sources } = await generateText({4 model: xai('grok-3-latest'),5 prompt: 'What are the latest developments in AI?',6 providerOptions: {7 xai: {8 searchParameters: {9 mode: 'auto',10 returnCitations: true,11 },12 } satisfies XaiLanguageModelChatOptions,13 },14});15
16// Access the sources used17for (const source of sources) {18 if (source.sourceType === 'url') {19 console.log('Source:', source.url);20 }21}
```

### [Streaming with Search](#streaming-with-search)

Live Search works with streaming responses. Citations are included when the stream completes:

```
1import { xai, type XaiLanguageModelChatOptions } from '@ai-sdk/xai';2import { streamText } from 'ai';3
4const result = streamText({5 model: xai('grok-3-latest'),6 prompt: 'What has happened in tech recently?',7 providerOptions: {8 xai: {9 searchParameters: {10 mode: 'auto',11 returnCitations: true,12 },13 } satisfies XaiLanguageModelChatOptions,14 },15});16
17for await (const textPart of result.textStream) {18 process.stdout.write(textPart);19}20
21console.log('Sources:', await result.sources);
```

## [Model Capabilities](#model-capabilities)

| Model | Image Input | Object Generation | Tool Usage | Tool Streaming | Reasoning |
| --- | --- | --- | --- | --- | --- |
| `grok-4-1` | | | | | |
| `grok-4-1-fast-reasoning` | | | | | |
| `grok-4-1-fast-non-reasoning` | | | | | |
| `grok-4-fast-non-reasoning` | | | | | |
| `grok-4-fast-reasoning` | | | | | |
| `grok-code-fast-1` | | | | | |
| `grok-4` | | | | | |
| `grok-4-0709` | | | | | |
| `grok-4-latest` | | | | | |
| `grok-3` | | | | | |
| `grok-3-latest` | | | | | |
| `grok-3-mini` | | | | | |
| `grok-3-mini-latest` | | | | | |
| `grok-2-vision` | | | | | |
| `grok-2-vision-latest` | | | | | |
| `grok-2-vision-1212` | | | | | |

The table above lists popular models. Please see the [xAI docs](https://docs.x.ai/docs#models) for a full list of available models. You can also pass any available provider model ID as a string if needed.

## [Image Models](#image-models)

You can create xAI image models using the `.image()` factory method. For more on image generation with the AI SDK see [generateImage()](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-image).

```
1import { xai } from '@ai-sdk/xai';2import { generateImage } from 'ai';3
4const { image } = await generateImage({5 model: xai.image('grok-2-image'),6 prompt: 'A futuristic cityscape at sunset',7});
```

The xAI image model does not support the `size` parameter. Use `aspectRatio` instead. Supported aspect ratios: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`, `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`, and `auto`.

### [Image Editing](#image-editing)

xAI supports image editing through the `grok-2-image` and `grok-imagine-image` models. Pass input images via `prompt.images` to transform or edit existing images.

xAI image editing does not support masks. Editing is prompt-driven - describe what you want to change in the text prompt.

#### [Basic Image Editing](#basic-image-editing)

Transform an existing image using text prompts:

```
1import { xai } from '@ai-sdk/xai';2import { generateImage } from 'ai';3import { readFileSync } from 'fs';4
5const imageBuffer = readFileSync('./input-image.png');6
7const { images } = await generateImage({8 model: xai.image('grok-2-image'),9 prompt: {10 text: 'Turn the cat into a golden retriever dog',11 images: [imageBuffer],12 },13});
```

#### [Style Transfer](#style-transfer)

Apply artistic styles to an image:

```
1const imageBuffer = readFileSync('./input-image.png');2
3const { images } = await generateImage({4 model: xai.image('grok-2-image'),5 prompt: {6 text: 'Transform this into a watercolor painting style',7 images: [imageBuffer],8 },9 aspectRatio: '1:1',10});
```

Input images can be provided as `Buffer`, `ArrayBuffer`, `Uint8Array`, or base64-encoded strings. xAI only supports a single input image per request.

### [Model-specific options](#model-specific-options)

You can customize the image generation behavior with model-specific settings:

```
1import { xai } from '@ai-sdk/xai';2import { generateImage } from 'ai';3
4const { images } = await generateImage({5 model: xai.image('grok-2-image'),6 prompt: 'A futuristic cityscape at sunset',7 aspectRatio: '16:9',8 n: 2,9});
```

### [Model Capabilities](#model-capabilities-1)

| Model | Aspect Ratios | Image Editing |
| --- | --- | --- |
| `grok-2-image` | `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`, `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`, `auto` | |
| `grok-imagine-image` | `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`, `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`, `auto` | |

## [Video Models](#video-models)

You can create xAI video models using the `.video()` factory method. For more on video generation with the AI SDK see [generateVideo()](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-video).

This provider supports three video generation modes: text-to-video, image-to-video, and video editing.

### [Text-to-Video](#text-to-video)

Generate videos from text prompts:

```
1import { xai, type XaiVideoModelOptions } from '@ai-sdk/xai';2import { experimental_generateVideo as generateVideo } from 'ai';3
4const { videos } = await generateVideo({5 model: xai.video('grok-imagine-video'),6 prompt: 'A chicken flying into the sunset in the style of 90s anime.',7 aspectRatio: '16:9',8 duration: 5,9 providerOptions: {10 xai: {11 pollTimeoutMs: 600000, // 10 minutes12 } satisfies XaiVideoModelOptions,13 },14});
```

### [Image-to-Video](#image-to-video)

Generate videos using an image as the starting frame with an optional text prompt:

```
1import { xai, type XaiVideoModelOptions } from '@ai-sdk/xai';2import { experimental_generateVideo as generateVideo } from 'ai';3
4const { videos } = await generateVideo({5 model: xai.video('grok-imagine-video'),6 prompt: {7 image: 'https://example.com/start-frame.png',8 text: 'The cat slowly turns its head and blinks',9 },10 duration: 5,11 providerOptions: {12 xai: {13 pollTimeoutMs: 600000, // 10 minutes14 } satisfies XaiVideoModelOptions,15 },16});
```

### [Video Editing](#video-editing)

Edit an existing video using a text prompt by providing a source video URL via provider options:

```
1import { xai, type XaiVideoModelOptions } from '@ai-sdk/xai';2import { experimental_generateVideo as generateVideo } from 'ai';3
4const { videos } = await generateVideo({5 model: xai.video('grok-imagine-video'),6 prompt: 'Give the person sunglasses and a hat',7 providerOptions: {8 xai: {9 videoUrl: 'https://example.com/source-video.mp4',10 pollTimeoutMs: 600000, // 10 minutes11 } satisfies XaiVideoModelOptions,12 },13});
```

Video editing accepts input videos up to 8.7 seconds long. The `duration`, `aspectRatio`, and `resolution` parameters are not supported for editing - the output matches the input video's properties (capped at 720p).

### [Chaining and Concurrent Edits](#chaining-and-concurrent-edits)

The xAI-hosted video URL is available in `providerMetadata.xai.videoUrl`. You can use it to chain sequential edits or branch into concurrent edits using `Promise.all`:

```
1import { xai, type XaiVideoModelOptions } from '@ai-sdk/xai';2import { experimental_generateVideo as generateVideo } from 'ai';3
4const providerOptions = {5 xai: {6 videoUrl: 'https://example.com/source-video.mp4',7 pollTimeoutMs: 600000,8 } satisfies XaiVideoModelOptions,9};10
11// Step 1: Apply an initial edit12const step1 = await generateVideo({13 model: xai.video('grok-imagine-video'),14 prompt: 'Add a party hat to the person',15 providerOptions,16});17
18// Get the xAI-hosted URL from provider metadata19const step1VideoUrl = step1.providerMetadata?.xai?.videoUrl as string;20
21// Step 2: Apply two more edits concurrently, building on step 122const [withSunglasses, withScarf] = await Promise.all([23 generateVideo({24 model: xai.video('grok-imagine-video'),25 prompt: 'Add sunglasses',26 providerOptions: {27 xai: { videoUrl: step1VideoUrl, pollTimeoutMs: 600000 },28 },29 }),30 generateVideo({31 model: xai.video('grok-imagine-video'),32 prompt: 'Add a scarf',33 providerOptions: {34 xai: { videoUrl: step1VideoUrl, pollTimeoutMs: 600000 },35 },36 }),37]);
```

### [Video Provider Options](#video-provider-options)

The following provider options are available via `providerOptions.xai`. You can validate the provider options using the `XaiVideoModelOptions` type.

* **pollIntervalMs** _number_
 
 Polling interval in milliseconds for checking task status. Defaults to 5000.
 
* **pollTimeoutMs** _number_
 
 Maximum wait time in milliseconds for video generation. Defaults to 600000 (10 minutes).
 
* **resolution** _'480p' | '720p'_
 
 Video resolution. When using the SDK's standard `resolution` parameter, `1280x720` maps to `720p` and `854x480` maps to `480p`. Use this provider option to pass the native format directly.
 
* **videoUrl** _string_
 
 URL of a source video for video editing. When provided, the prompt is used to describe the desired edits to the video.
 

Video generation is an asynchronous process that can take several minutes. Consider setting `pollTimeoutMs` to at least 10 minutes (600000ms) for reliable operation. Generated video URLs are ephemeral and should be downloaded promptly.

### [Aspect Ratio and Resolution](#aspect-ratio-and-resolution)

For **text-to-video**, you can specify both `aspectRatio` and `resolution`. The default aspect ratio is `16:9` and the default resolution is `480p`.

For **image-to-video**, the output defaults to the input image's aspect ratio. If you specify `aspectRatio`, it will override this and stretch the image to the desired ratio.

For **video editing**, the output matches the input video's aspect ratio and resolution. Custom `duration`, `aspectRatio`, and `resolution` are not supported - the output resolution is capped at 720p (e.g., a 1080p input will be downsized to 720p).

### [Video Model Capabilities](#video-model-capabilities)

| Model | Duration | Aspect Ratios | Resolution | Image-to-Video | Video Editing |
| --- | --- | --- | --- | --- | --- |
| `grok-imagine-video` | 1–15s | `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3` | `480p`, `720p` | | |

You can also pass any available provider model ID as a string if needed.

---
url: https://ai-sdk.dev/providers/ai-sdk-providers/vercel
title: "AI SDK Providers: Vercel"
description: "Learn how to use Vercel's v0 models with the AI SDK."
hash: "c08f95f86a618f4cd371bae361dbfed7f9ccc1f1bffcc5df6c46ec91f3b03096"
crawledAt: 2026-03-07T08:04:09.519Z
depth: 2
---

## [Vercel Provider](#vercel-provider)

The [Vercel](https://vercel.com/) provider gives you access to the [v0 API](https://v0.app/docs/api/model), designed for building modern web applications. The v0 models support text and image inputs and provide fast streaming responses.

You can create your Vercel API key at [v0.dev](https://v0.dev/chat/settings/keys).

The v0 API is currently in beta and requires a Premium or Team plan with usage-based billing enabled. For details, visit the [pricing page](https://v0.dev/pricing). To request a higher limit, contact Vercel at [support@v0.dev](mailto:support@v0.dev).

## [Features](#features)

* **Framework aware completions**: Evaluated on modern stacks like Next.js and Vercel
* **Auto-fix**: Identifies and corrects common coding issues during generation
* **Quick edit**: Streams inline edits as they're available
* **Multimodal**: Supports both text and image inputs

## [Setup](#setup)

The Vercel provider is available via the `@ai-sdk/vercel` module. You can install it with:

pnpm add @ai-sdk/vercel

## [Provider Instance](#provider-instance)

You can import the default provider instance `vercel` from `@ai-sdk/vercel`:

```
1import { vercel } from '@ai-sdk/vercel';
```

If you need a customized setup, you can import `createVercel` from `@ai-sdk/vercel` and create a provider instance with your settings:

```
1import { createVercel } from '@ai-sdk/vercel';2
3const vercel = createVercel({4 apiKey: process.env.VERCEL_API_KEY ?? '',5});
```

You can use the following optional settings to customize the Vercel provider instance:

* **baseURL** _string_
 
 Use a different URL prefix for API calls. The default prefix is `https://api.v0.dev/v1`.
 
* **apiKey** _string_
 
 API key that is being sent using the `Authorization` header. It defaults to the `VERCEL_API_KEY` environment variable.
 
* **headers** _Record<string,string>_
 
 Custom headers to include in the requests.
 
* **fetch** _(input: RequestInfo, init?: RequestInit) => Promise<Response>_
 
 Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation. Defaults to the global `fetch` function. You can use it as a middleware to intercept requests, or to provide a custom fetch implementation for e.g. testing.
 

## [Language Models](#language-models)

You can create language models using a provider instance. The first argument is the model ID, for example:

```
1import { vercel } from '@ai-sdk/vercel';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: vercel('v0-1.5-md'),6 prompt: 'Create a Next.js AI chatbot',7});
```

Vercel language models can also be used in the `streamText` function (see [AI SDK Core](https://ai-sdk.dev/docs/ai-sdk-core)).

## [Models](#models)

### [v0-1.5-md](#v0-15-md)

The `v0-1.5-md` model is for everyday tasks and UI generation.

### [v0-1.5-lg](#v0-15-lg)

The `v0-1.5-lg` model is for advanced thinking or reasoning.

### [v0-1.0-md (legacy)](#v0-10-md-legacy)

The `v0-1.0-md` model is the legacy model served by the v0 API.

All v0 models have the following capabilities:

* Supports text and image inputs (multimodal)
* Supports function/tool calls
* Streaming responses with low latency
* Optimized for frontend and full-stack web development

## [Model Capabilities](#model-capabilities)

| Model | Image Input | Object Generation | Tool Usage | Tool Streaming |
| --- | --- | --- | --- | --- |
| `v0-1.5-md` | | | | |
| `v0-1.5-lg` | | | | |
| `v0-1.0-md` | | | | |

---
url: https://ai-sdk.dev/providers/ai-sdk-providers/openai
title: "AI SDK Providers: OpenAI"
description: "Learn how to use the OpenAI provider for the AI SDK."
hash: "7a94a4e53af8701e29bedaff760f4a4ac3b1a76d0fe1f59c9222594e47bc2e32"
crawledAt: 2026-03-07T08:04:16.852Z
depth: 2
---

## [OpenAI Provider](#openai-provider)

The [OpenAI](https://openai.com/) provider contains language model support for the OpenAI responses, chat, and completion APIs, as well as embedding model support for the OpenAI embeddings API.

## [Setup](#setup)

The OpenAI provider is available in the `@ai-sdk/openai` module. You can install it with

pnpm add @ai-sdk/openai

## [Provider Instance](#provider-instance)

You can import the default provider instance `openai` from `@ai-sdk/openai`:

```
1import { openai } from '@ai-sdk/openai';
```

If you need a customized setup, you can import `createOpenAI` from `@ai-sdk/openai` and create a provider instance with your settings:

```
1import { createOpenAI } from '@ai-sdk/openai';2
3const openai = createOpenAI({4 // custom settings, e.g.5 headers: {6 'header-name': 'header-value',7 },8});
```

You can use the following optional settings to customize the OpenAI provider instance:

* **baseURL** _string_
 
 Use a different URL prefix for API calls, e.g. to use proxy servers. The default prefix is `https://api.openai.com/v1`.
 
* **apiKey** _string_
 
 API key that is being sent using the `Authorization` header. It defaults to the `OPENAI_API_KEY` environment variable.
 
* **name** _string_
 
 The provider name. You can set this when using OpenAI compatible providers to change the model provider property. Defaults to `openai`.
 
* **organization** _string_
 
 OpenAI Organization.
 
* **project** _string_
 
 OpenAI project.
 
* **headers** _Record<string,string>_
 
 Custom headers to include in the requests.
 
* **fetch** _(input: RequestInfo, init?: RequestInit) => Promise<Response>_
 
 Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation. Defaults to the global `fetch` function. You can use it as a middleware to intercept requests, or to provide a custom fetch implementation for e.g. testing.
 

## [Language Models](#language-models)

The OpenAI provider instance is a function that you can invoke to create a language model:

```
1const model = openai('gpt-5');
```

It automatically selects the correct API based on the model id. You can also pass additional settings in the second argument:

```
1const model = openai('gpt-5', {2 // additional settings3});
```

The available options depend on the API that's automatically chosen for the model (see below). If you want to explicitly select a specific model API, you can use `.responses`, `.chat`, or `.completion`.

Since AI SDK 5, the OpenAI responses API is called by default (unless you specify e.g. 'openai.chat')

### [Example](#example)

You can use OpenAI language models to generate text with the `generateText` function:

```
1import { openai } from '@ai-sdk/openai';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: openai('gpt-5'),6 prompt: 'Write a vegetarian lasagna recipe for 4 people.',7});
```

OpenAI language models can also be used in the `streamText` function and support structured data generation with [`Output`](https://ai-sdk.dev/docs/reference/ai-sdk-core/output) (see [AI SDK Core](https://ai-sdk.dev/docs/ai-sdk-core)).

### [Responses Models](#responses-models)

You can use the OpenAI responses API with the `openai(modelId)` or `openai.responses(modelId)` factory methods. It is the default API that is used by the OpenAI provider (since AI SDK 5).

```
1const model = openai('gpt-5');
```

Further configuration can be done using OpenAI provider options. You can validate the provider options using the `OpenAILanguageModelResponsesOptions` type.

```
1import { openai, OpenAILanguageModelResponsesOptions } from '@ai-sdk/openai';2import { generateText } from 'ai';3
4const result = await generateText({5 model: openai('gpt-5'), // or openai.responses('gpt-5')6 providerOptions: {7 openai: {8 parallelToolCalls: false,9 store: false,10 user: 'user_123',11 //...12 } satisfies OpenAILanguageModelResponsesOptions,13 },14 //...15});
```

The following provider options are available:

* **parallelToolCalls** _boolean_ Whether to use parallel tool calls. Defaults to `true`.
 
* **store** _boolean_
 
 Whether to store the generation. Defaults to `true`.
 
* **maxToolCalls** _integer_ The maximum number of total calls to built-in tools that can be processed in a response. This maximum number applies across all built-in tool calls, not per individual tool. Any further attempts to call a tool by the model will be ignored.
 
* **metadata** _Record<string, string>_ Additional metadata to store with the generation.
 
* **conversation** _string_ The ID of the OpenAI Conversation to continue. You must create a conversation first via the [OpenAI API](https://platform.openai.com/docs/api-reference/conversations/create). Cannot be used in conjunction with `previousResponseId`. Defaults to `undefined`.
 
* **previousResponseId** _string_ The ID of the previous response. You can use it to continue a conversation. Defaults to `undefined`.
 
* **instructions** _string_ Instructions for the model. They can be used to change the system or developer message when continuing a conversation using the `previousResponseId` option. Defaults to `undefined`.
 
* **logprobs** _boolean | number_ Return the log probabilities of the tokens. Including logprobs will increase the response size and can slow down response times. However, it can be useful to better understand how the model is behaving. Setting to `true` returns the log probabilities of the tokens that were generated. Setting to a number (1-20) returns the log probabilities of the top n tokens that were generated.
 
* **user** _string_ A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse. Defaults to `undefined`.
 
* **reasoningEffort** _'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'_ Reasoning effort for reasoning models. Defaults to `medium`. If you use `providerOptions` to set the `reasoningEffort` option, this model setting will be ignored.
 

The 'none' type for `reasoningEffort` is only available for OpenAI's GPT-5.1 models. Also, the 'xhigh' type for `reasoningEffort` is only available for OpenAI's GPT-5.1-Codex-Max model. Setting `reasoningEffort` to 'none' or 'xhigh' with unsupported models will result in an error.

* **reasoningSummary** _'auto' | 'detailed'_ Controls whether the model returns its reasoning process. Set to `'auto'` for a condensed summary, `'detailed'` for more comprehensive reasoning. Defaults to `undefined` (no reasoning summaries). When enabled, reasoning summaries appear in the stream as events with type `'reasoning'` and in non-streaming responses within the `reasoning` field.
 
* **strictJsonSchema** _boolean_ Whether to use strict JSON schema validation. Defaults to `true`.
 

OpenAI structured outputs have several [limitations](https://openai.com/index/introducing-structured-outputs-in-the-api), in particular around the [supported schemas](https://platform.openai.com/docs/guides/structured-outputs/supported-schemas), and are therefore opt-in. For example, optional schema properties are not supported. You need to change Zod `.nullish()` and `.optional()` to `.nullable()`.

* **serviceTier** _'auto' | 'flex' | 'priority' | 'default'_ Service tier for the request. Set to 'flex' for 50% cheaper processing at the cost of increased latency (available for o3, o4-mini, and gpt-5 models). Set to 'priority' for faster processing with Enterprise access (available for gpt-4, gpt-5, gpt-5-mini, o3, o4-mini; gpt-5-nano is not supported).
 
 Defaults to 'auto'.
 
* **textVerbosity** _'low' | 'medium' | 'high'_ Controls the verbosity of the model's response. Lower values result in more concise responses, while higher values result in more verbose responses. Defaults to `'medium'`.
 
* **include** _Array<string>_ Specifies additional content to include in the response. Supported values: `['file_search_call.results']` for including file search results in responses. `['message.output_text.logprobs']` for logprobs. Defaults to `undefined`.
 
* **truncation** _string_ The truncation strategy to use for the model response.
 
 * Auto: If the input to this Response exceeds the model's context window size, the model will truncate the response to fit the context window by dropping items from the beginning of the conversation.
 * disabled (default): If the input size will exceed the context window size for a model, the request will fail with a 400 error.
* **promptCacheKey** _string_ A cache key for manual prompt caching control. Used by OpenAI to cache responses for similar requests to optimize your cache hit rates.
 
* **promptCacheRetention** _'in\_memory' | '24h'_ The retention policy for the prompt cache. Set to `'24h'` to enable extended prompt caching, which keeps cached prefixes active for up to 24 hours. Defaults to `'in_memory'` for standard prompt caching. Note: `'24h'` is currently only available for the 5.1 series of models.
 
* **safetyIdentifier** _string_ A stable identifier used to help detect users of your application that may be violating OpenAI's usage policies. The IDs should be a string that uniquely identifies each user.
 
* **systemMessageMode** _'system' | 'developer' | 'remove'_ Controls the role of the system message when making requests. By default (when omitted), for models that support reasoning the `system` message is automatically converted to a `developer` message. Setting `systemMessageMode` to `system` passes the system message as a system-level instruction; `developer` passes it as a developer message; `remove` omits the system message from the request.
 
* **forceReasoning** _boolean_ Force treating this model as a reasoning model. This is useful for "stealth" reasoning models (e.g. via a custom baseURL) where the model ID is not recognized by the SDK's allowlist. When enabled, the SDK applies reasoning-model parameter compatibility rules and defaults `systemMessageMode` to `developer` unless overridden.
 

The OpenAI responses provider also returns provider-specific metadata:

For Responses models, you can type this metadata using `OpenaiResponsesProviderMetadata`:

```
1import { openai, type OpenaiResponsesProviderMetadata } from '@ai-sdk/openai';2import { generateText } from 'ai';3
4const result = await generateText({5 model: openai('gpt-5'),6});7
8const providerMetadata = result.providerMetadata as9 | OpenaiResponsesProviderMetadata10 | undefined;11
12const { responseId, logprobs, serviceTier } = providerMetadata?.openai ?? {};13
14// responseId can be used to continue a conversation (previousResponseId).15console.log(responseId);
```

The following OpenAI-specific metadata may be returned:

* **responseId** _string | null | undefined_ The ID of the response. Can be used to continue a conversation.
* **logprobs** _(optional)_ Log probabilities of output tokens (when enabled).
* **serviceTier** _(optional)_ Service tier information returned by the API.

#### [Reasoning Output](#reasoning-output)

For reasoning models like `gpt-5`, you can enable reasoning summaries to see the model's thought process. Different models support different summarizers—for example, `o4-mini` supports detailed summaries. Set `reasoningSummary: "auto"` to automatically receive the richest level available.

```
1import {2 openai,3 type OpenAILanguageModelResponsesOptions,4} from '@ai-sdk/openai';5import { streamText } from 'ai';6
7const result = streamText({8 model: openai('gpt-5'),9 prompt: 'Tell me about the Mission burrito debate in San Francisco.',10 providerOptions: {11 openai: {12 reasoningSummary: 'detailed', // 'auto' for condensed or 'detailed' for comprehensive13 } satisfies OpenAILanguageModelResponsesOptions,14 },15});16
17for await (const part of result.fullStream) {18 if (part.type === 'reasoning') {19 console.log(`Reasoning: ${part.textDelta}`);20 } else if (part.type === 'text-delta') {21 process.stdout.write(part.textDelta);22 }23}
```

For non-streaming calls with `generateText`, the reasoning summaries are available in the `reasoning` field of the response:

```
1import {2 openai,3 type OpenAILanguageModelResponsesOptions,4} from '@ai-sdk/openai';5import { generateText } from 'ai';6
7const result = await generateText({8 model: openai('gpt-5'),9 prompt: 'Tell me about the Mission burrito debate in San Francisco.',10 providerOptions: {11 openai: {12 reasoningSummary: 'auto',13 } satisfies OpenAILanguageModelResponsesOptions,14 },15});16console.log('Reasoning:', result.reasoning);
```

Learn more about reasoning summaries in the [OpenAI documentation](https://platform.openai.com/docs/guides/reasoning?api-mode=responses#reasoning-summaries).

#### [WebSocket Transport](#websocket-transport)

OpenAI's [WebSocket API](https://developers.openai.com/api/docs/guides/websocket-mode) keeps a persistent connection open, which can significantly reduce Time-to-First-Byte (TTFB) in agentic workflows with many tool calls. After the initial connection, subsequent requests skip TCP/TLS/HTTP negotiation entirely.

The [`ai-sdk-openai-websocket-fetch`](https://www.npmjs.com/package/ai-sdk-openai-websocket-fetch) package provides a drop-in `fetch` replacement that routes streaming requests through a persistent WebSocket connection.

pnpm add ai-sdk-openai-websocket-fetch

Pass the WebSocket fetch to `createOpenAI` via the `fetch` option:

```
1import { createOpenAI } from '@ai-sdk/openai';2import { createWebSocketFetch } from 'ai-sdk-openai-websocket-fetch';3import { streamText } from 'ai';4
5// Create a WebSocket-backed fetch instance6const wsFetch = createWebSocketFetch();7const openai = createOpenAI({ fetch: wsFetch });8
9const result = streamText({10 model: openai('gpt-4.1-mini'),11 prompt: 'Hello!',12 tools: {13 //...14 },15 onFinish: () => wsFetch.close(), // close the WebSocket when done16});
```

The first request will be slower because it must establish the WebSocket connection (DNS + TCP + TLS + WebSocket upgrade). After that, subsequent steps in a multi-step tool-calling loop reuse the open connection, resulting in lower TTFB per step.

The WebSocket transport only routes streaming requests to the OpenAI Responses API (`POST /responses` with `stream: true`) through the WebSocket. All other requests (non-streaming, embeddings, etc.) fall through to the standard `fetch` implementation.

You can see a live side-by-side comparison of HTTP vs WebSocket streaming performance in the [demo app](https://github.com/vercel-labs/ai-sdk-openai-websocket).

#### [Verbosity Control](#verbosity-control)

You can control the length and detail of model responses using the `textVerbosity` parameter:

```
1import {2 openai,3 type OpenAILanguageModelResponsesOptions,4} from '@ai-sdk/openai';5import { generateText } from 'ai';6
7const result = await generateText({8 model: openai('gpt-5-mini'),9 prompt: 'Write a poem about a boy and his first pet dog.',10 providerOptions: {11 openai: {12 textVerbosity: 'low', // 'low' for concise, 'medium' (default), or 'high' for verbose13 } satisfies OpenAILanguageModelResponsesOptions,14 },15});
```

The `textVerbosity` parameter scales output length without changing the underlying prompt:

* `'low'`: Produces terse, minimal responses
* `'medium'`: Balanced detail (default)
* `'high'`: Verbose responses with comprehensive detail

#### [Web Search Tool](#web-search-tool)

The OpenAI responses API supports web search through the `openai.tools.webSearch` tool.

```
1const result = await generateText({2 model: openai('gpt-5'),3 prompt: 'What happened in San Francisco last week?',4 tools: {5 web_search: openai.tools.webSearch({6 // optional configuration:7 externalWebAccess: true,8 searchContextSize: 'high',9 userLocation: {10 type: 'approximate',11 city: 'San Francisco',12 region: 'California',13 },14 filters: {15 allowedDomains: ['sfchronicle.com', 'sfgate.com'],16 },17 }),18 },19 // Force web search tool (optional):20 toolChoice: { type: 'tool', toolName: 'web_search' },21});22
23// URL sources directly from `results`24const sources = result.sources;25
26// Or access sources from tool results27for (const toolResult of result.toolResults) {28 if (toolResult.toolName === 'web_search') {29 console.log('Query:', toolResult.output.action.query);30 console.log('Sources:', toolResult.output.sources);31 // `sources` is an array of object: { type: 'url', url: string }32 }33}
```

The web search tool supports the following configuration options:

* **externalWebAccess** _boolean_ - Whether to use external web access for fetching live content. Defaults to `true`.
* **searchContextSize** _'low' | 'medium' | 'high'_ - Controls the amount of context used for the search. Higher values provide more comprehensive results but may have higher latency and cost.
* **userLocation** - Optional location information to provide geographically relevant results. Includes `type` (always `'approximate'`), `country`, `city`, `region`, and `timezone`.
* **filters** - Optional filter configuration to restrict search results.
 * **allowedDomains** _string\[\]_ - Array of allowed domains for the search. Subdomains of the provided domains are automatically included.

For detailed information on configuration options see the [OpenAI Web Search Tool documentation](https://platform.openai.com/docs/guides/tools-web-search?api-mode=responses).

#### [File Search Tool](#file-search-tool)

The OpenAI responses API supports file search through the `openai.tools.fileSearch` tool.

You can force the use of the file search tool by setting the `toolChoice` parameter to `{ type: 'tool', toolName: 'file_search' }`.

```
1const result = await generateText({2 model: openai('gpt-5'),3 prompt: 'What does the document say about user authentication?',4 tools: {5 file_search: openai.tools.fileSearch({6 vectorStoreIds: ['vs_123'],7 // configuration below is optional:8 maxNumResults: 5,9 filters: {10 key: 'author',11 type: 'eq',12 value: 'Jane Smith',13 },14 ranking: {15 ranker: 'auto',16 scoreThreshold: 0.5,17 },18 }),19 },20 providerOptions: {21 openai: {22 // optional: include results23 include: ['file_search_call.results'],24 } satisfies OpenAILanguageModelResponsesOptions,25 },26});
```

The file search tool supports filtering with both comparison and compound filters:

**Comparison filters** - Filter by a single attribute:

* `eq` - Equal to
* `ne` - Not equal to
* `gt` - Greater than
* `gte` - Greater than or equal to
* `lt` - Less than
* `lte` - Less than or equal to
* `in` - Value is in array
* `nin` - Value is not in array

```
1// Single comparison filter2filters: { key: 'year', type: 'gte', value: 2023 }3
4// Filter with array values5filters: { key: 'status', type: 'in', value: ['published', 'reviewed'] }
```

**Compound filters** - Combine multiple filters with `and` or `or`:

```
1// Compound filter with AND2filters: {3 type: 'and',4 filters: [5 { key: 'author', type: 'eq', value: 'Jane Smith' },6 { key: 'year', type: 'gte', value: 2023 },7 ],8}9
10// Compound filter with OR11filters: {12 type: 'or',13 filters: [14 { key: 'department', type: 'eq', value: 'Engineering' },15 { key: 'department', type: 'eq', value: 'Research' },16 ],17}
```

#### [Image Generation Tool](#image-generation-tool)

OpenAI's Responses API supports multi-modal image generation as a provider-defined tool. Availability is restricted to specific models (for example, `gpt-5` variants).

You can use the image tool with either `generateText` or `streamText`:

```
1import { openai } from '@ai-sdk/openai';2import { generateText } from 'ai';3
4const result = await generateText({5 model: openai('gpt-5'),6 prompt:7 'Generate an image of an echidna swimming across the Mozambique channel.',8 tools: {9 image_generation: openai.tools.imageGeneration({ outputFormat: 'webp' }),10 },11});12
13for (const toolResult of result.staticToolResults) {14 if (toolResult.toolName === 'image_generation') {15 const base64Image = toolResult.output.result;16 }17}
```

```
1import { openai } from '@ai-sdk/openai';2import { streamText } from 'ai';3
4const result = streamText({5 model: openai('gpt-5'),6 prompt:7 'Generate an image of an echidna swimming across the Mozambique channel.',8 tools: {9 image_generation: openai.tools.imageGeneration({10 outputFormat: 'webp',11 quality: 'low',12 }),13 },14});15
16for await (const part of result.fullStream) {17 if (part.type == 'tool-result' && !part.dynamic) {18 const base64Image = part.output.result;19 }20}
```

When you set `store: false`, then previously generated images will not be accessible by the model. We recommend using the image generation tool without setting `store: false`.

For complete details on model availability, image quality controls, supported sizes, and tool-specific parameters, refer to the OpenAI documentation:

* Image generation overview and models: [OpenAI Image Generation](https://platform.openai.com/docs/guides/image-generation)
* Image generation tool parameters (background, size, quality, format, etc.): [Image Generation Tool Options](https://platform.openai.com/docs/guides/tools-image-generation#tool-options)

#### [Code Interpreter Tool](#code-interpreter-tool)

The OpenAI responses API supports the code interpreter tool through the `openai.tools.codeInterpreter` tool. This allows models to write and execute Python code.

```
1import { openai } from '@ai-sdk/openai';2import { generateText } from 'ai';3
4const result = await generateText({5 model: openai('gpt-5'),6 prompt: 'Write and run Python code to calculate the factorial of 10',7 tools: {8 code_interpreter: openai.tools.codeInterpreter({9 // optional configuration:10 container: {11 fileIds: ['file-123', 'file-456'], // optional file IDs to make available12 },13 }),14 },15});
```

The code interpreter tool can be configured with:

* **container**: Either a container ID string or an object with `fileIds` to specify uploaded files that should be available to the code interpreter

When working with files generated by the Code Interpreter, reference information can be obtained from both [annotations in Text Parts](#typed-providermetadata-in-text-parts) and [`providerMetadata` in Source Document Parts](#typed-providermetadata-in-source-document-parts).

#### [MCP Tool](#mcp-tool)

The OpenAI responses API supports connecting to [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers through the `openai.tools.mcp` tool. This allows models to call tools exposed by remote MCP servers or service connectors.

```
1import { openai } from '@ai-sdk/openai';2import { generateText } from 'ai';3
4const result = await generateText({5 model: openai('gpt-5'),6 prompt: 'Search the web for the latest news about AI developments',7 tools: {8 mcp: openai.tools.mcp({9 serverLabel: 'web-search',10 serverUrl: 'https://mcp.exa.ai/mcp',11 serverDescription: 'A web-search API for AI agents',12 }),13 },14});
```

The MCP tool can be configured with:

* **serverLabel** _string_ (required)
 
 A label to identify the MCP server. This label is used in tool calls to distinguish between multiple MCP servers.
 
* **serverUrl** _string_ (required if `connectorId` is not provided)
 
 The URL for the MCP server. Either `serverUrl` or `connectorId` must be provided.
 
* **connectorId** _string_ (required if `serverUrl` is not provided)
 
 Identifier for a service connector. Either `serverUrl` or `connectorId` must be provided.
 
* **serverDescription** _string_ (optional)
 
 Optional description of the MCP server that helps the model understand its purpose.
 
* **allowedTools** _string\[\] | object_ (optional)
 
 Controls which tools from the MCP server are available. Can be:
 
 * An array of tool names: `['tool1', 'tool2']`
 * An object with filters:
 
 ```
 1{2 readOnly: true, // Only allow read-only tools3 toolNames: ['tool1', 'tool2'] // Specific tool names4}
 ```
 
* **authorization** _string_ (optional)
 
 OAuth access token for authenticating with the MCP server or connector.
 
* **headers** _Record<string, string>_ (optional)
 
 Optional HTTP headers to include in requests to the MCP server.
 
* **requireApproval** _'always' | 'never' | object_ (optional)
 
 Controls which MCP tool calls require user approval before execution. Can be:
 
 * `'always'`: All MCP tool calls require approval
 * `'never'`: No MCP tool calls require approval (default)
 * An object with filters:
 
 ```
 1{2 never: {3 toolNames: ['safe_tool', 'another_safe_tool']; // Skip approval for these tools4 }5}
 ```
 
 
 When approval is required, the model will return a `tool-approval-request` content part that you can use to prompt the user for approval. See [Human in the Loop](https://ai-sdk.dev/cookbook/next/human-in-the-loop) for more details on implementing approval workflows.
 

When `requireApproval` is not set, tool calls are approved by default. Be sure to connect to only trusted MCP servers, who you trust to share your data with.

The OpenAI MCP tool is different from the general MCP client approach documented in [MCP Tools](https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools). The OpenAI MCP tool is a built-in provider-defined tool that allows OpenAI models to directly connect to MCP servers, while the general MCP client requires you to convert MCP tools to AI SDK tools first.

#### [Local Shell Tool](#local-shell-tool)

The OpenAI responses API support the local shell tool for Codex models through the `openai.tools.localShell` tool. Local shell is a tool that allows agents to run shell commands locally on a machine you or the user provides.

```
1import { openai } from '@ai-sdk/openai';2import { generateText } from 'ai';3
4const result = await generateText({5 model: openai.responses('gpt-5-codex'),6 tools: {7 local_shell: openai.tools.localShell({8 execute: async ({ action }) => {9 //... your implementation, e.g. sandbox access...10 return { output: stdout };11 },12 }),13 },14 prompt: 'List the files in my home directory.',15 stopWhen: stepCountIs(2),16});
```

#### [Shell Tool](#shell-tool)

The OpenAI Responses API supports the shell tool through the `openai.tools.shell` tool. The shell tool allows running bash commands and interacting with a command line. The model proposes shell commands; your integration executes them and returns the outputs.

Running arbitrary shell commands can be dangerous. Always sandbox execution or add strict allow-/deny-lists before forwarding a command to the system shell.

The shell tool supports three environment modes that control where commands are executed:

##### [Local Execution (default)](#local-execution-default)

When no `environment` is specified (or `type: 'local'` is used), commands are executed locally via your `execute` callback:

```
1import { openai } from '@ai-sdk/openai';2import { generateText } from 'ai';3
4const result = await generateText({5 model: openai('gpt-5.2'),6 tools: {7 shell: openai.tools.shell({8 execute: async ({ action }) => {9 //... your implementation, e.g. sandbox access...10 return { output: results };11 },12 }),13 },14 prompt: 'List the files in the current directory and show disk usage.',15});
```

##### [Hosted Container (auto)](#hosted-container-auto)

Set `environment.type` to `'containerAuto'` to run commands in an OpenAI-hosted container. No `execute` callback is needed — OpenAI handles execution server-side:

```
1const result = await generateText({2 model: openai('gpt-5.2'),3 tools: {4 shell: openai.tools.shell({5 environment: {6 type: 'containerAuto',7 // optional configuration:8 memoryLimit: '4g',9 fileIds: ['file-abc123'],10 networkPolicy: {11 type: 'allowlist',12 allowedDomains: ['example.com'],13 },14 },15 }),16 },17 prompt: 'Install numpy and compute the eigenvalues of a 3x3 matrix.',18});
```

The `containerAuto` environment supports:

* **fileIds** _string\[\]_ - File IDs to make available in the container
* **memoryLimit** _'1g' | '4g' | '16g' | '64g'_ - Memory limit for the container
* **networkPolicy** - Network access policy:
 * `{ type: 'disabled' }` — no network access
 * `{ type: 'allowlist', allowedDomains: string[], domainSecrets?: Array<{ domain, name, value }> }` — allow specific domains with optional secrets

##### [Existing Container Reference](#existing-container-reference)

Set `environment.type` to `'containerReference'` to use an existing container by ID:

```
1const result = await generateText({2 model: openai('gpt-5.2'),3 tools: {4 shell: openai.tools.shell({5 environment: {6 type: 'containerReference',7 containerId: 'cntr_abc123',8 },9 }),10 },11 prompt: 'Check the status of running processes.',12});
```

##### [Execute Callback](#execute-callback)

For local execution (default or `type: 'local'`), your execute function must return an output array with results for each command:

* **stdout** _string_ - Standard output from the command
* **stderr** _string_ - Standard error from the command
* **outcome** - Either `{ type: 'timeout' }` or `{ type: 'exit', exitCode: number }`

##### [Skills](#skills)

[Skills](https://platform.openai.com/docs/guides/tools-skills) are versioned bundles of files with a `SKILL.md` manifest that extend the shell tool's capabilities. They can be attached to both `containerAuto` and `local` environments.

**Container skills** support two formats — by reference (for skills uploaded to OpenAI) or inline (as a base64-encoded zip):

```
1const result = await generateText({2 model: openai('gpt-5.2'),3 tools: {4 shell: openai.tools.shell({5 environment: {6 type: 'containerAuto',7 skills: [8 // By reference:9 { type: 'skillReference', skillId: 'skill_abc123' },10 // Or inline:11 {12 type: 'inline',13 name: 'my-skill',14 description: 'What this skill does',15 source: {16 type: 'base64',17 mediaType: 'application/zip',18 data: readFileSync('./my-skill.zip').toString('base64'),19 },20 },21 ],22 },23 }),24 },25 prompt: 'Use the skill to solve this problem.',26});
```

**Local skills** point to a directory on disk containing a `SKILL.md` file:

```
1const result = await generateText({2 model: openai('gpt-5.2'),3 tools: {4 shell: openai.tools.shell({5 execute: async ({ action }) => {6 //... your local execution implementation...7 return { output: results };8 },9 environment: {10 type: 'local',11 skills: [12 {13 name: 'my-skill',14 description: 'What this skill does',15 path: resolve('path/to/skill-directory'),16 },17 ],18 },19 }),20 },21 prompt: 'Use the skill to solve this problem.',22 stopWhen: stepCountIs(5),23});
```

For more details on creating skills, see the [OpenAI Skills documentation](https://platform.openai.com/docs/guides/tools-skills).

#### [Apply Patch Tool](#apply-patch-tool)

The OpenAI Responses API supports the apply patch tool for GPT-5.1 models through the `openai.tools.applyPatch` tool. The apply patch tool lets the model create, update, and delete files in your codebase using structured diffs. Instead of just suggesting edits, the model emits patch operations that your application applies and reports back on, enabling iterative, multi-step code editing workflows.

```
1import { openai } from '@ai-sdk/openai';2import { generateText, stepCountIs } from 'ai';3
4const result = await generateText({5 model: openai('gpt-5.1'),6 tools: {7 apply_patch: openai.tools.applyPatch({8 execute: async ({ callId, operation }) => {9 //... your implementation for applying the diffs.10 },11 }),12 },13 prompt: 'Create a python file that calculates the factorial of a number',14 stopWhen: stepCountIs(5),15});
```

Your execute function must return:

* **status** _'completed' | 'failed'_ - Whether the patch was applied successfully
* **output** _string_ (optional) - Human-readable log text (e.g., results or error messages)

#### [Custom Tool](#custom-tool)

The OpenAI Responses API supports [custom tools](https://developers.openai.com/api/docs/guides/function-calling/#custom-tools) through the `openai.tools.customTool` tool. Custom tools return a raw string instead of JSON, optionally constrained to a grammar (regex or Lark syntax). This makes them useful for generating structured text like SQL queries, code snippets, or any output that must match a specific pattern.

```
1import { openai } from '@ai-sdk/openai';2import { generateText, stepCountIs } from 'ai';3
4const result = await generateText({5 model: openai.responses('gpt-5.2-codex'),6 tools: {7 write_sql: openai.tools.customTool({8 name: 'write_sql',9 description: 'Write a SQL SELECT query to answer the user question.',10 format: {11 type: 'grammar',12 syntax: 'regex',13 definition: 'SELECT.+',14 },15 execute: async input => {16 // input is a raw string matching the grammar, e.g. "SELECT * FROM users WHERE age > 25"17 const rows = await db.query(input);18 return JSON.stringify(rows);19 },20 }),21 },22 toolChoice: 'required',23 prompt: 'Write a SQL query to get all users older than 25.',24 stopWhen: stepCountIs(3),25});
```

Custom tools also work with `streamText`:

```
1import { openai } from '@ai-sdk/openai';2import { streamText } from 'ai';3
4const result = streamText({5 model: openai.responses('gpt-5.2-codex'),6 tools: {7 write_sql: openai.tools.customTool({8 name: 'write_sql',9 description: 'Write a SQL SELECT query to answer the user question.',10 format: {11 type: 'grammar',12 syntax: 'regex',13 definition: 'SELECT.+',14 },15 }),16 },17 toolChoice: 'required',18 prompt: 'Write a SQL query to get all users older than 25.',19});20
21for await (const chunk of result.fullStream) {22 if (chunk.type === 'tool-call') {23 console.log(`Tool: ${chunk.toolName}`);24 console.log(`Input: ${chunk.input}`);25 }26}
```

The custom tool can be configured with:

* **name** _string_ (required) - The name of the custom tool. Used to identify the tool in tool calls.
* **description** _string_ (optional) - A description of what the tool does, to help the model understand when to use it.
* **format** _object_ (optional) - The output format constraint. Omit for unconstrained text output.
 * **type** _'grammar' | 'text'_ - The format type. Use `'grammar'` for constrained output or `'text'` for explicit unconstrained text.
 * **syntax** _'regex' | 'lark'_ - (grammar only) The grammar syntax. Use `'regex'` for regular expression patterns or `'lark'` for [Lark parser grammar](https://lark-parser.readthedocs.io/).
 * **definition** _string_ - (grammar only) The grammar definition string (a regex pattern or Lark grammar).
* **execute** _function_ (optional) - An async function that receives the raw string input and returns a string result. Enables multi-turn tool calling.

#### [Image Inputs](#image-inputs)

The OpenAI Responses API supports Image inputs for appropriate models. You can pass Image files as part of the message content using the 'image' type:

```
1const result = await generateText({2 model: openai('gpt-5'),3 messages: [4 {5 role: 'user',6 content: [7 {8 type: 'text',9 text: 'Please describe the image.',10 },11 {12 type: 'image',13 image: readFileSync('./data/image.png'),14 },15 ],16 },17 ],18});
```

The model will have access to the image and will respond to questions about it. The image should be passed using the `image` field.

You can also pass a file-id from the OpenAI Files API.

```
1{2 type: 'image',3 image: 'file-8EFBcWHsQxZV7YGezBC1fq'4}
```

You can also pass the URL of an image.

```
1{2 type: 'image',3 image: 'https://sample.edu/image.png',4}
```

#### [PDF Inputs](#pdf-inputs)

The OpenAI Responses API supports reading PDF files. You can pass PDF files as part of the message content using the `file` type:

```
1const result = await generateText({2 model: openai('gpt-5'),3 messages: [4 {5 role: 'user',6 content: [7 {8 type: 'text',9 text: 'What is an embedding model?',10 },11 {12 type: 'file',13 data: readFileSync('./data/ai.pdf'),14 mediaType: 'application/pdf',15 filename: 'ai.pdf', // optional16 },17 ],18 },19 ],20});
```

You can also pass a file-id from the OpenAI Files API.

```
1{2 type: 'file',3 data: 'file-8EFBcWHsQxZV7YGezBC1fq',4 mediaType: 'application/pdf',5}
```

You can also pass the URL of a pdf.

```
1{2 type: 'file',3 data: 'https://sample.edu/example.pdf',4 mediaType: 'application/pdf',5 filename: 'ai.pdf', // optional6}
```

The model will have access to the contents of the PDF file and respond to questions about it. The PDF file should be passed using the `data` field, and the `mediaType` should be set to `'application/pdf'`.

#### [Structured Outputs](#structured-outputs)

The OpenAI Responses API supports structured outputs. You can use `generateText` or `streamText` with [`Output`](https://ai-sdk.dev/docs/reference/ai-sdk-core/output) to enforce structured outputs.

```
1const result = await generateText({2 model: openai('gpt-4.1'),3 output: Output.object({4 schema: z.object({5 recipe: z.object({6 name: z.string(),7 ingredients: z.array(8 z.object({9 name: z.string(),10 amount: z.string(),11 }),12 ),13 steps: z.array(z.string()),14 }),15 }),16 }),17 prompt: 'Generate a lasagna recipe.',18});
```

#### [Typed providerMetadata in Text Parts](#typed-providermetadata-in-text-parts)

When using the OpenAI Responses API, the SDK attaches OpenAI-specific metadata to output parts via `providerMetadata`.

This metadata can be used on the client side for tasks such as rendering citations or downloading files generated by the Code Interpreter. To enable type-safe handling of this metadata, the AI SDK exports dedicated TypeScript types.

For text parts, when `part.type === 'text'`, the `providerMetadata` is provided in the form of `OpenaiResponsesTextProviderMetadata`.

This metadata includes the following fields:

* `itemId` The ID of the output item in the Responses API.
 
* `annotations` (optional) An array of annotation objects generated by the model. If no annotations are present, this property itself may be omitted (`undefined`).
 
 Each element in `annotations` is a discriminated union with a required `type` field. Supported types include, for example:
 
 * `url_citation`
 * `file_citation`
 * `container_file_citation`
 * `file_path`
 
 These annotations directly correspond to the annotation objects defined by the Responses API and can be used for inline reference rendering or output analysis. For details, see the official OpenAI documentation: [Responses API – output text annotations](https://platform.openai.com/docs/api-reference/responses/object?lang=javascript#responses-object-output-output_message-content-output_text-annotations).
 

```
1import {2 openai,3 type OpenaiResponsesTextProviderMetadata,4} from '@ai-sdk/openai';5import { generateText } from 'ai';6
7const result = await generateText({8 model: openai('gpt-4.1-mini'),9 prompt:10 'Create a program that generates five random numbers between 1 and 100 with two decimal places, and show me the execution results. Also save the result to a file.',11 tools: {12 code_interpreter: openai.tools.codeInterpreter(),13 web_search: openai.tools.webSearch(),14 file_search: openai.tools.fileSearch({ vectorStoreIds: ['vs_1234'] }), // requires a configured vector store15 },16});17
18for (const part of result.content) {19 if (part.type === 'text') {20 const providerMetadata = part.providerMetadata as21 | OpenaiResponsesTextProviderMetadata22 | undefined;23 if (!providerMetadata) continue;24 const { itemId: _itemId, annotations } = providerMetadata.openai;25
26 if (!annotations) continue;27 for (const annotation of annotations) {28 switch (annotation.type) {29 case 'url_citation':30 // url_citation is returned from web_search and provides:31 // properties: type, url, title, start_index and end_index32 break;33 case 'file_citation':34 // file_citation is returned from file_search and provides:35 // properties: type, file_id, filename and index36 break;37 case 'container_file_citation':38 // container_file_citation is returned from code_interpreter and provides:39 // properties: type, container_id, file_id, filename, start_index and end_index40 break;41 case 'file_path':42 // file_path provides:43 // properties: type, file_id and index44 break;45 default: {46 const _exhaustiveCheck: never = annotation;47 throw new Error(48 `Unhandled annotation: ${JSON.stringify(_exhaustiveCheck)}`,49 );50 }51 }52 }53 }54}
```

When implementing file downloads for files generated by the Code Interpreter, the `container_id` and `file_id` available in `providerMetadata` can be used to retrieve the file content. For details, see the [Retrieve container file content](https://platform.openai.com/docs/api-reference/container-files/retrieveContainerFileContent) API.

#### [Typed providerMetadata in Reasoning Parts](#typed-providermetadata-in-reasoning-parts)

When using the OpenAI Responses API, reasoning output parts can include provider metadata. To handle this metadata in a type-safe way, use `OpenaiResponsesReasoningProviderMetadata`.

For reasoning parts, when `part.type === 'reasoning'`, the `providerMetadata` is provided in the form of `OpenaiResponsesReasoningProviderMetadata`.

This metadata includes the following fields:

* `itemId` 
 The ID of the reasoning item in the Responses API.
* `reasoningEncryptedContent` (optional) 
 Encrypted reasoning content (only returned when requested via `include: ['reasoning.encrypted_content']`).

```
1import {2 openai,3 type OpenaiResponsesReasoningProviderMetadata,4 type OpenAILanguageModelResponsesOptions,5} from '@ai-sdk/openai';6import { generateText } from 'ai';7
8const result = await generateText({9 model: openai('gpt-5'),10 prompt: 'How many "r"s are in the word "strawberry"?',11 providerOptions: {12 openai: {13 store: false,14 include: ['reasoning.encrypted_content'],15 } satisfies OpenAILanguageModelResponsesOptions,16 },17});18
19for (const part of result.content) {20 if (part.type === 'reasoning') {21 const providerMetadata = part.providerMetadata as22 | OpenaiResponsesReasoningProviderMetadata23 | undefined;24
25 const { itemId, reasoningEncryptedContent } =26 providerMetadata?.openai ?? {};27 console.log(itemId, reasoningEncryptedContent);28 }29}
```

#### [Typed providerMetadata in Source Document Parts](#typed-providermetadata-in-source-document-parts)

For source document parts, when `part.type === 'source'` and `sourceType === 'document'`, the `providerMetadata` is provided as `OpenaiResponsesSourceDocumentProviderMetadata`.

This metadata is also a discriminated union with a required `type` field. Supported types include:

* `file_citation`
* `container_file_citation`
* `file_path`

Each type includes the identifiers required to work with the referenced resource, such as `fileId` and `containerId`.

```
1import {2 openai,3 type OpenaiResponsesSourceDocumentProviderMetadata,4} from '@ai-sdk/openai';5import { generateText } from 'ai';6
7const result = await generateText({8 model: openai('gpt-4.1-mini'),9 prompt:10 'Create a program that generates five random numbers between 1 and 100 with two decimal places, and show me the execution results. Also save the result to a file.',11 tools: {12 code_interpreter: openai.tools.codeInterpreter(),13 web_search: openai.tools.webSearch(),14 file_search: openai.tools.fileSearch({ vectorStoreIds: ['vs_1234'] }), // requires a configured vector store15 },16});17
18for (const part of result.content) {19 if (part.type === 'source') {20 if (part.sourceType === 'document') {21 const providerMetadata = part.providerMetadata as22 | OpenaiResponsesSourceDocumentProviderMetadata23 | undefined;24 if (!providerMetadata) continue;25 const annotation = providerMetadata.openai;26 switch (annotation.type) {27 case 'file_citation':28 // file_citation is returned from file_search and provides:29 // properties: type, fileId and index30 // The filename can be accessed via part.filename.31 break;32 case 'container_file_citation':33 // container_file_citation is returned from code_interpreter and provides:34 // properties: type, containerId and fileId35 // The filename can be accessed via part.filename.36 break;37 case 'file_path':38 // file_path provides:39 // properties: type, fileId and index40 break;41 default: {42 const _exhaustiveCheck: never = annotation;43 throw new Error(44 `Unhandled annotation: ${JSON.stringify(_exhaustiveCheck)}`,45 );46 }47 }48 }49 }50}
```

Annotations in text parts follow the OpenAI Responses API specification and therefore use snake\_case properties (e.g. `file_id`, `container_id`). In contrast, `providerMetadata` for source document parts is normalized by the SDK to camelCase (e.g. `fileId`, `containerId`). Fields that depend on the original text content, such as `start_index` and `end_index`, are omitted, as are fields like `filename` that are directly available on the source object.

### [Chat Models](#chat-models)

You can create models that call the [OpenAI chat API](https://platform.openai.com/docs/api-reference/chat) using the `.chat()` factory method. The first argument is the model id, e.g. `gpt-4`. The OpenAI chat models support tool calls and some have multi-modal capabilities.

```
1const model = openai.chat('gpt-5');
```

OpenAI chat models support also some model specific provider options that are not part of the [standard call settings](https://ai-sdk.dev/docs/ai-sdk-core/settings). You can pass them in the `providerOptions` argument:

```
1import { openai, type OpenAILanguageModelChatOptions } from '@ai-sdk/openai';2
3const model = openai.chat('gpt-5');4
5await generateText({6 model,7 providerOptions: {8 openai: {9 logitBias: {10 // optional likelihood for specific tokens11 '50256': -100,12 },13 user: 'test-user', // optional unique user identifier14 } satisfies OpenAILanguageModelChatOptions,15 },16});
```

The following optional provider options are available for OpenAI chat models:

* **logitBias** _Record<number, number>_
 
 Modifies the likelihood of specified tokens appearing in the completion.
 
 Accepts a JSON object that maps tokens (specified by their token ID in the GPT tokenizer) to an associated bias value from -100 to 100. You can use this tokenizer tool to convert text to token IDs. Mathematically, the bias is added to the logits generated by the model prior to sampling. The exact effect will vary per model, but values between -1 and 1 should decrease or increase likelihood of selection; values like -100 or 100 should result in a ban or exclusive selection of the relevant token.
 
 As an example, you can pass `{"50256": -100}` to prevent the token from being generated.
 
* **logprobs** _boolean | number_
 
 Return the log probabilities of the tokens. Including logprobs will increase the response size and can slow down response times. However, it can be useful to better understand how the model is behaving.
 
 Setting to true will return the log probabilities of the tokens that were generated.
 
 Setting to a number will return the log probabilities of the top n tokens that were generated.
 
* **parallelToolCalls** _boolean_
 
 Whether to enable parallel function calling during tool use. Defaults to `true`.
 
* **user** _string_
 
 A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse. [Learn more](https://platform.openai.com/docs/guides/safety-best-practices/end-user-ids).
 
* **reasoningEffort** _'minimal' | 'low' | 'medium' | 'high' | 'xhigh'_
 
 Reasoning effort for reasoning models. Defaults to `medium`. If you use `providerOptions` to set the `reasoningEffort` option, this model setting will be ignored.
 
* **maxCompletionTokens** _number_
 
 Maximum number of completion tokens to generate. Useful for reasoning models.
 
* **store** _boolean_
 
 Whether to enable persistence in Responses API.
 
* **metadata** _Record<string, string>_
 
 Metadata to associate with the request.
 
* **prediction** _Record<string, any>_
 
 Parameters for prediction mode.
 
* **serviceTier** _'auto' | 'flex' | 'priority' | 'default'_
 
 Service tier for the request. Set to 'flex' for 50% cheaper processing at the cost of increased latency (available for o3, o4-mini, and gpt-5 models). Set to 'priority' for faster processing with Enterprise access (available for gpt-4, gpt-5, gpt-5-mini, o3, o4-mini; gpt-5-nano is not supported).
 
 Defaults to 'auto'.
 
* **strictJsonSchema** _boolean_
 
 Whether to use strict JSON schema validation. Defaults to `true`.
 
* **textVerbosity** _'low' | 'medium' | 'high'_
 
 Controls the verbosity of the model's responses. Lower values will result in more concise responses, while higher values will result in more verbose responses.
 
* **promptCacheKey** _string_
 
 A cache key for manual prompt caching control. Used by OpenAI to cache responses for similar requests to optimize your cache hit rates.
 
* **promptCacheRetention** _'in\_memory' | '24h'_
 
 The retention policy for the prompt cache. Set to `'24h'` to enable extended prompt caching, which keeps cached prefixes active for up to 24 hours. Defaults to `'in_memory'` for standard prompt caching. Note: `'24h'` is currently only available for the 5.1 series of models.
 
* **safetyIdentifier** _string_
 
 A stable identifier used to help detect users of your application that may be violating OpenAI's usage policies. The IDs should be a string that uniquely identifies each user.
 
* **systemMessageMode** _'system' | 'developer' | 'remove'_
 
 Override the system message mode for this model. If not specified, the mode is automatically determined based on the model. `system` uses the 'system' role for system messages (default for most models); `developer` uses the 'developer' role (used by reasoning models); `remove` removes system messages entirely.
 
* **forceReasoning** _boolean_
 
 Force treating this model as a reasoning model. This is useful for "stealth" reasoning models (e.g. via a custom baseURL) where the model ID is not recognized by the SDK's allowlist. When enabled, the SDK applies reasoning-model parameter compatibility rules and defaults `systemMessageMode` to `developer` unless overridden.
 

#### [Reasoning](#reasoning)

OpenAI has introduced the `o1`,`o3`, and `o4` series of [reasoning models](https://platform.openai.com/docs/guides/reasoning). Currently, `o4-mini`, `o3`, `o3-mini`, and `o1` are available via both the chat and responses APIs. The model `gpt-5.1-codex-mini` is available only via the [responses API](#responses-models).

Reasoning models currently only generate text, have several limitations, and are only supported using `generateText` and `streamText`.

They support additional settings and response metadata:

* You can use `providerOptions` to set
 
 * the `reasoningEffort` option (or alternatively the `reasoningEffort` model setting), which determines the amount of reasoning the model performs.
* You can use response `providerMetadata` to access the number of reasoning tokens that the model generated.
 

```
1import { openai, type OpenAILanguageModelChatOptions } from '@ai-sdk/openai';2import { generateText } from 'ai';3
4const { text, usage, providerMetadata } = await generateText({5 model: openai.chat('gpt-5'),6 prompt: 'Invent a new holiday and describe its traditions.',7 providerOptions: {8 openai: {9 reasoningEffort: 'low',10 } satisfies OpenAILanguageModelChatOptions,11 },12});13
14console.log(text);15console.log('Usage:', {16...usage,17 reasoningTokens: providerMetadata?.openai?.reasoningTokens,18});
```

System messages are automatically converted to OpenAI developer messages for reasoning models when supported.

* You can control how system messages are handled by providerOptions `systemMessageMode`:
 
 * `developer`: treat the prompt as a developer message (default for reasoning models).
 * `system`: keep the system message as a system-level instruction.
 * `remove`: remove the system message from the messages.

```
1import { openai, type OpenAILanguageModelChatOptions } from '@ai-sdk/openai';2import { generateText } from 'ai';3
4const result = await generateText({5 model: openai.chat('gpt-5'),6 messages: [7 { role: 'system', content: 'You are a helpful assistant.' },8 { role: 'user', content: 'Tell me a joke.' },9 ],10 providerOptions: {11 openai: {12 systemMessageMode: 'system',13 } satisfies OpenAILanguageModelChatOptions,14 },15});
```

Reasoning models require additional runtime inference to complete their reasoning phase before generating a response. This introduces longer latency compared to other models.

`maxOutputTokens` is automatically mapped to `max_completion_tokens` for reasoning models.

#### [Strict Structured Outputs](#strict-structured-outputs)

Strict structured outputs are enabled by default. You can disable them by setting the `strictJsonSchema` option to `false`.

```
1import { openai, OpenAILanguageModelChatOptions } from '@ai-sdk/openai';2import { generateText, Output } from 'ai';3import { z } from 'zod';4
5const result = await generateText({6 model: openai.chat('gpt-4o-2024-08-06'),7 providerOptions: {8 openai: {9 strictJsonSchema: false,10 } satisfies OpenAILanguageModelChatOptions,11 },12 output: Output.object({13 schema: z.object({14 name: z.string(),15 ingredients: z.array(16 z.object({17 name: z.string(),18 amount: z.string(),19 }),20 ),21 steps: z.array(z.string()),22 }),23 schemaName: 'recipe',24 schemaDescription: 'A recipe for lasagna.',25 }),26 prompt: 'Generate a lasagna recipe.',27});28
29console.log(JSON.stringify(result.output, null, 2));
```

OpenAI structured outputs have several [limitations](https://openai.com/index/introducing-structured-outputs-in-the-api), in particular around the [supported schemas](https://platform.openai.com/docs/guides/structured-outputs/supported-schemas), and are therefore opt-in.

For example, optional schema properties are not supported. You need to change Zod `.nullish()` and `.optional()` to `.nullable()`.

#### [Logprobs](#logprobs)

OpenAI provides logprobs information for completion/chat models. You can access it in the `providerMetadata` object.

```
1import { openai, type OpenAILanguageModelChatOptions } from '@ai-sdk/openai';2import { generateText } from 'ai';3
4const result = await generateText({5 model: openai.chat('gpt-5'),6 prompt: 'Write a vegetarian lasagna recipe for 4 people.',7 providerOptions: {8 openai: {9 // this can also be a number,10 // refer to logprobs provider options section for more11 logprobs: true,12 } satisfies OpenAILanguageModelChatOptions,13 },14});15
16const openaiMetadata = (await result.providerMetadata)?.openai;17
18const logprobs = openaiMetadata?.logprobs;
```

#### [Image Support](#image-support)

The OpenAI Chat API supports Image inputs for appropriate models. You can pass Image files as part of the message content using the 'image' type:

```
1const result = await generateText({2 model: openai.chat('gpt-5'),3 messages: [4 {5 role: 'user',6 content: [7 {8 type: 'text',9 text: 'Please describe the image.',10 },11 {12 type: 'image',13 image: readFileSync('./data/image.png'),14 },15 ],16 },17 ],18});
```

The model will have access to the image and will respond to questions about it. The image should be passed using the `image` field.

You can also pass the URL of an image.

```
1{2 type: 'image',3 image: 'https://sample.edu/image.png',4}
```

#### [PDF support](#pdf-support)

The OpenAI Chat API supports reading PDF files. You can pass PDF files as part of the message content using the `file` type:

```
1const result = await generateText({2 model: openai.chat('gpt-5'),3 messages: [4 {5 role: 'user',6 content: [7 {8 type: 'text',9 text: 'What is an embedding model?',10 },11 {12 type: 'file',13 data: readFileSync('./data/ai.pdf'),14 mediaType: 'application/pdf',15 filename: 'ai.pdf', // optional16 },17 ],18 },19 ],20});
```

The model will have access to the contents of the PDF file and respond to questions about it. The PDF file should be passed using the `data` field, and the `mediaType` should be set to `'application/pdf'`.

You can also pass a file-id from the OpenAI Files API.

```
1{2 type: 'file',3 data: 'file-8EFBcWHsQxZV7YGezBC1fq',4 mediaType: 'application/pdf',5}
```

You can also pass the URL of a PDF.

```
1{2 type: 'file',3 data: 'https://sample.edu/example.pdf',4 mediaType: 'application/pdf',5 filename: 'ai.pdf', // optional6}
```

#### [Predicted Outputs](#predicted-outputs)

OpenAI supports [predicted outputs](https://platform.openai.com/docs/guides/latency-optimization#use-predicted-outputs) for `gpt-4o` and `gpt-4o-mini`. Predicted outputs help you reduce latency by allowing you to specify a base text that the model should modify. You can enable predicted outputs by adding the `prediction` option to the `providerOptions.openai` object:

```
1const result = streamText({2 model: openai.chat('gpt-5'),3 messages: [4 {5 role: 'user',6 content: 'Replace the Username property with an Email property.',7 },8 {9 role: 'user',10 content: existingCode,11 },12 ],13 providerOptions: {14 openai: {15 prediction: {16 type: 'content',17 content: existingCode,18 },19 } satisfies OpenAILanguageModelChatOptions,20 },21});
```

OpenAI provides usage information for predicted outputs (`acceptedPredictionTokens` and `rejectedPredictionTokens`). You can access it in the `providerMetadata` object.

```
1const openaiMetadata = (await result.providerMetadata)?.openai;2
3const acceptedPredictionTokens = openaiMetadata?.acceptedPredictionTokens;4const rejectedPredictionTokens = openaiMetadata?.rejectedPredictionTokens;
```

OpenAI Predicted Outputs have several [limitations](https://platform.openai.com/docs/guides/predicted-outputs#limitations), e.g. unsupported API parameters and no tool calling support.

#### [Image Detail](#image-detail)

You can use the `openai` provider option to set the [image input detail](https://platform.openai.com/docs/guides/images-vision?api-mode=responses#specify-image-input-detail-level) to `high`, `low`, or `auto`:

```
1const result = await generateText({2 model: openai.chat('gpt-5'),3 messages: [4 {5 role: 'user',6 content: [7 { type: 'text', text: 'Describe the image in detail.' },8 {9 type: 'image',10 image:11 'https://github.com/vercel/ai/blob/main/examples/ai-functions/data/comic-cat.png?raw=true',12
13 // OpenAI specific options - image detail:14 providerOptions: {15 openai: { imageDetail: 'low' },16 },17 },18 ],19 },20 ],21});
```

Because the `UIMessage` type (used by AI SDK UI hooks like `useChat`) does not support the `providerOptions` property, you can use `convertToModelMessages` first before passing the messages to functions like `generateText` or `streamText`. For more details on `providerOptions` usage, see [here](https://ai-sdk.dev/docs/foundations/prompts#provider-options).

#### [Distillation](#distillation)

OpenAI supports model distillation for some models. If you want to store a generation for use in the distillation process, you can add the `store` option to the `providerOptions.openai` object. This will save the generation to the OpenAI platform for later use in distillation.

```
1import { openai, type OpenAILanguageModelChatOptions } from '@ai-sdk/openai';2import { generateText } from 'ai';3import 'dotenv/config';4
5async function main() {6 const { text, usage } = await generateText({7 model: openai.chat('gpt-4o-mini'),8 prompt: 'Who worked on the original macintosh?',9 providerOptions: {10 openai: {11 store: true,12 metadata: {13 custom: 'value',14 },15 } satisfies OpenAILanguageModelChatOptions,16 },17 });18
19 console.log(text);20 console.log();21 console.log('Usage:', usage);22}23
24main().catch(console.error);
```

#### [Prompt Caching](#prompt-caching)

OpenAI has introduced [Prompt Caching](https://platform.openai.com/docs/guides/prompt-caching) for supported models including `gpt-4o` and `gpt-4o-mini`.

* Prompt caching is automatically enabled for these models, when the prompt is 1024 tokens or longer. It does not need to be explicitly enabled.
* You can use response `providerMetadata` to access the number of prompt tokens that were a cache hit.
* Note that caching behavior is dependent on load on OpenAI's infrastructure. Prompt prefixes generally remain in the cache following 5-10 minutes of inactivity before they are evicted, but during off-peak periods they may persist for up to an hour.

```
1import { openai } from '@ai-sdk/openai';2import { generateText } from 'ai';3
4const { text, usage, providerMetadata } = await generateText({5 model: openai.chat('gpt-4o-mini'),6 prompt: `A 1024-token or longer prompt...`,7});8
9console.log(`usage:`, {10...usage,11 cachedPromptTokens: providerMetadata?.openai?.cachedPromptTokens,12});
```

To improve cache hit rates, you can manually control caching using the `promptCacheKey` option:

```
1import { openai, type OpenAILanguageModelChatOptions } from '@ai-sdk/openai';2import { generateText } from 'ai';3
4const { text, usage, providerMetadata } = await generateText({5 model: openai.chat('gpt-5'),6 prompt: `A 1024-token or longer prompt...`,7 providerOptions: {8 openai: {9 promptCacheKey: 'my-custom-cache-key-123',10 } satisfies OpenAILanguageModelChatOptions,11 },12});13
14console.log(`usage:`, {15...usage,16 cachedPromptTokens: providerMetadata?.openai?.cachedPromptTokens,17});
```

For GPT-5.1 models, you can enable extended prompt caching that keeps cached prefixes active for up to 24 hours:

```
1import { openai, type OpenAILanguageModelChatOptions } from '@ai-sdk/openai';2import { generateText } from 'ai';3
4const { text, usage, providerMetadata } = await generateText({5 model: openai.chat('gpt-5.1'),6 prompt: `A 1024-token or longer prompt...`,7 providerOptions: {8 openai: {9 promptCacheKey: 'my-custom-cache-key-123',10 promptCacheRetention: '24h', // Extended caching for GPT-5.111 } satisfies OpenAILanguageModelChatOptions,12 },13});14
15console.log(`usage:`, {16...usage,17 cachedPromptTokens: providerMetadata?.openai?.cachedPromptTokens,18});
```

#### [Audio Input](#audio-input)

With the `gpt-4o-audio-preview` model, you can pass audio files to the model.

The `gpt-4o-audio-preview` model is currently in preview and requires at least some audio inputs. It will not work with non-audio data.

```
1import { openai } from '@ai-sdk/openai';2import { generateText } from 'ai';3
4const result = await generateText({5 model: openai.chat('gpt-4o-audio-preview'),6 messages: [7 {8 role: 'user',9 content: [10 { type: 'text', text: 'What is the audio saying?' },11 {12 type: 'file',13 mediaType: 'audio/mpeg',14 data: readFileSync('./data/galileo.mp3'),15 },16 ],17 },18 ],19});
```

### [Completion Models](#completion-models)

You can create models that call the [OpenAI completions API](https://platform.openai.com/docs/api-reference/completions) using the `.completion()` factory method. The first argument is the model id. Currently only `gpt-3.5-turbo-instruct` is supported.

```
1const model = openai.completion('gpt-3.5-turbo-instruct');
```

OpenAI completion models support also some model specific settings that are not part of the [standard call settings](https://ai-sdk.dev/docs/ai-sdk-core/settings). You can pass them as an options argument:

```
1const model = openai.completion('gpt-3.5-turbo-instruct');2
3await model.doGenerate({4 providerOptions: {5 openai: {6 echo: true, // optional, echo the prompt in addition to the completion7 logitBias: {8 // optional likelihood for specific tokens9 '50256': -100,10 },11 suffix: 'some text', // optional suffix that comes after a completion of inserted text12 user: 'test-user', // optional unique user identifier13 } satisfies OpenAILanguageModelCompletionOptions,14 },15});
```

The following optional provider options are available for OpenAI completion models:

* **echo**: _boolean_
 
 Echo back the prompt in addition to the completion.
 
* **logitBias** _Record<number, number>_
 
 Modifies the likelihood of specified tokens appearing in the completion.
 
 Accepts a JSON object that maps tokens (specified by their token ID in the GPT tokenizer) to an associated bias value from -100 to 100. You can use this tokenizer tool to convert text to token IDs. Mathematically, the bias is added to the logits generated by the model prior to sampling. The exact effect will vary per model, but values between -1 and 1 should decrease or increase likelihood of selection; values like -100 or 100 should result in a ban or exclusive selection of the relevant token.
 
 As an example, you can pass `{"50256": -100}` to prevent the <|endoftext|> token from being generated.
 
* **logprobs** _boolean | number_
 
 Return the log probabilities of the tokens. Including logprobs will increase the response size and can slow down response times. However, it can be useful to better understand how the model is behaving.
 
 Setting to true will return the log probabilities of the tokens that were generated.
 
 Setting to a number will return the log probabilities of the top n tokens that were generated.
 
* **suffix** _string_
 
 The suffix that comes after a completion of inserted text.
 
* **user** _string_
 
 A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse. [Learn more](https://platform.openai.com/docs/guides/safety-best-practices/end-user-ids).
 

### [Model Capabilities](#model-capabilities)

| Model | Image Input | Audio Input | Object Generation | Tool Usage |
| --- | --- | --- | --- | --- |
| `gpt-5.2-pro` | | | | |
| `gpt-5.2-chat-latest` | | | | |
| `gpt-5.2` | | | | |
| `gpt-5.1-codex-mini` | | | | |
| `gpt-5.1-codex` | | | | |
| `gpt-5.1-chat-latest` | | | | |
| `gpt-5.1` | | | | |
| `gpt-5-pro` | | | | |
| `gpt-5` | | | | |
| `gpt-5-mini` | | | | |
| `gpt-5-nano` | | | | |
| `gpt-5-codex` | | | | |
| `gpt-5-chat-latest` | | | | |
| `gpt-4.1` | | | | |
| `gpt-4.1-mini` | | | | |
| `gpt-4.1-nano` | | | | |
| `gpt-4o` | | | | |
| `gpt-4o-mini` | | | | |

The table above lists popular models. Please see the [OpenAI docs](https://platform.openai.com/docs/models) for a full list of available models. The table above lists popular models. You can also pass any available provider model ID as a string if needed.

## [Embedding Models](#embedding-models)

You can create models that call the [OpenAI embeddings API](https://platform.openai.com/docs/api-reference/embeddings) using the `.embedding()` factory method.

```
1const model = openai.embedding('text-embedding-3-large');
```

OpenAI embedding models support several additional provider options. You can pass them as an options argument:

```
1import { openai, type OpenAIEmbeddingModelOptions } from '@ai-sdk/openai';2import { embed } from 'ai';3
4const { embedding } = await embed({5 model: openai.embedding('text-embedding-3-large'),6 value: 'sunny day at the beach',7 providerOptions: {8 openai: {9 dimensions: 512, // optional, number of dimensions for the embedding10 user: 'test-user', // optional unique user identifier11 } satisfies OpenAIEmbeddingModelOptions,12 },13});
```

The following optional provider options are available for OpenAI embedding models:

* **dimensions**: _number_
 
 The number of dimensions the resulting output embeddings should have. Only supported in text-embedding-3 and later models.
 
* **user** _string_
 
 A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse. [Learn more](https://platform.openai.com/docs/guides/safety-best-practices/end-user-ids).
 

### [Model Capabilities](#model-capabilities-1)

| Model | Default Dimensions | Custom Dimensions |
| --- | --- | --- |
| `text-embedding-3-large` | 3072 | |
| `text-embedding-3-small` | 1536 | |
| `text-embedding-ada-002` | 1536 | |

## [Image Models](#image-models)

You can create models that call the [OpenAI image generation API](https://platform.openai.com/docs/api-reference/images) using the `.image()` factory method.

```
1const model = openai.image('dall-e-3');
```

Dall-E models do not support the `aspectRatio` parameter. Use the `size` parameter instead.

### [Image Editing](#image-editing)

OpenAI's `gpt-image-1` model supports powerful image editing capabilities. Pass input images via `prompt.images` to transform, combine, or edit existing images.

#### [Basic Image Editing](#basic-image-editing)

Transform an existing image using text prompts:

```
1const imageBuffer = readFileSync('./input-image.png');2
3const { images } = await generateImage({4 model: openai.image('gpt-image-1'),5 prompt: {6 text: 'Turn the cat into a dog but retain the style of the original image',7 images: [imageBuffer],8 },9});
```

#### [Inpainting with Mask](#inpainting-with-mask)

Edit specific parts of an image using a mask. Transparent areas in the mask indicate where the image should be edited:

```
1const image = readFileSync('./input-image.png');2const mask = readFileSync('./mask.png'); // Transparent areas = edit regions3
4const { images } = await generateImage({5 model: openai.image('gpt-image-1'),6 prompt: {7 text: 'A sunlit indoor lounge area with a pool containing a flamingo',8 images: [image],9 mask: mask,10 },11});
```

#### [Background Removal](#background-removal)

Remove the background from an image by setting `background` to `transparent`:

```
1const imageBuffer = readFileSync('./input-image.png');2
3const { images } = await generateImage({4 model: openai.image('gpt-image-1'),5 prompt: {6 text: 'do not change anything',7 images: [imageBuffer],8 },9 providerOptions: {10 openai: {11 background: 'transparent',12 output_format: 'png',13 },14 },15});
```

#### [Multi-Image Combining](#multi-image-combining)

Combine multiple reference images into a single output. `gpt-image-1` supports up to 16 input images:

```
1const cat = readFileSync('./cat.png');2const dog = readFileSync('./dog.png');3const owl = readFileSync('./owl.png');4const bear = readFileSync('./bear.png');5
6const { images } = await generateImage({7 model: openai.image('gpt-image-1'),8 prompt: {9 text: 'Combine these animals into a group photo, retaining the original style',10 images: [cat, dog, owl, bear],11 },12});
```

Input images can be provided as `Buffer`, `ArrayBuffer`, `Uint8Array`, or base64-encoded strings. For `gpt-image-1`, each image should be a `png`, `webp`, or `jpg` file less than 50MB.

### [Model Capabilities](#model-capabilities-2)

| Model | Sizes |
| --- | --- |
| `gpt-image-1.5` | 1024x1024, 1536x1024, 1024x1536 |
| `gpt-image-1-mini` | 1024x1024, 1536x1024, 1024x1536 |
| `gpt-image-1` | 1024x1024, 1536x1024, 1024x1536 |
| `dall-e-3` | 1024x1024, 1792x1024, 1024x1792 |
| `dall-e-2` | 256x256, 512x512, 1024x1024 |

You can pass optional `providerOptions` to the image model. These are prone to change by OpenAI and are model dependent. For example, the `gpt-image-1` model supports the `quality` option:

```
1const { image, providerMetadata } = await generateImage({2 model: openai.image('gpt-image-1.5'),3 prompt: 'A salamander at sunrise in a forest pond in the Seychelles.',4 providerOptions: {5 openai: { quality: 'high' },6 },7});
```

For more on `generateImage()` see [Image Generation](https://ai-sdk.dev/docs/ai-sdk-core/image-generation).

OpenAI's image models return additional metadata in the response that can be accessed via `providerMetadata.openai`. The following OpenAI-specific metadata is available:

* **images** _Array<object>_
 
 Array of image-specific metadata. Each image object may contain:
 
 * `revisedPrompt` _string_ - The revised prompt that was actually used to generate the image (OpenAI may modify your prompt for safety or clarity)
 * `created` _number_ - The Unix timestamp (in seconds) of when the image was created
 * `size` _string_ - The size of the generated image. One of `1024x1024`, `1024x1536`, or `1536x1024`
 * `quality` _string_ - The quality of the generated image. One of `low`, `medium`, or `high`
 * `background` _string_ - The background parameter used for the image generation. Either `transparent` or `opaque`
 * `outputFormat` _string_ - The output format of the generated image. One of `png`, `webp`, or `jpeg`

For more information on the available OpenAI image model options, see the [OpenAI API reference](https://platform.openai.com/docs/api-reference/images/create).

## [Transcription Models](#transcription-models)

You can create models that call the [OpenAI transcription API](https://platform.openai.com/docs/api-reference/audio/transcribe) using the `.transcription()` factory method.

The first argument is the model id e.g. `whisper-1`.

```
1const model = openai.transcription('whisper-1');
```

You can also pass additional provider-specific options using the `providerOptions` argument. For example, supplying the input language in ISO-639-1 (e.g. `en`) format will improve accuracy and latency.

```
1import { experimental_transcribe as transcribe } from 'ai';2import { openai, type OpenAITranscriptionModelOptions } from '@ai-sdk/openai';3
4const result = await transcribe({5 model: openai.transcription('whisper-1'),6 audio: new Uint8Array([1, 2, 3, 4]),7 providerOptions: {8 openai: { language: 'en' } satisfies OpenAITranscriptionModelOptions,9 },10});
```

To get word-level timestamps, specify the granularity:

```
1import { experimental_transcribe as transcribe } from 'ai';2import { openai, type OpenAITranscriptionModelOptions } from '@ai-sdk/openai';3
4const result = await transcribe({5 model: openai.transcription('whisper-1'),6 audio: new Uint8Array([1, 2, 3, 4]),7 providerOptions: {8 openai: {9 //timestampGranularities: ['word'],10 timestampGranularities: ['segment'],11 } satisfies OpenAITranscriptionModelOptions,12 },13});14
15// Access word-level timestamps16console.log(result.segments); // Array of segments with startSecond/endSecond
```

The following provider options are available:

* **timestampGranularities** _string\[\]_ The granularity of the timestamps in the transcription. Defaults to `['segment']`. Possible values are `['word']`, `['segment']`, and `['word', 'segment']`. Note: There is no additional latency for segment timestamps, but generating word timestamps incurs additional latency.
 
* **language** _string_ The language of the input audio. Supplying the input language in ISO-639-1 format (e.g. 'en') will improve accuracy and latency. Optional.
 
* **prompt** _string_ An optional text to guide the model's style or continue a previous audio segment. The prompt should match the audio language. Optional.
 
* **temperature** _number_ The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. If set to 0, the model will use log probability to automatically increase the temperature until certain thresholds are hit. Defaults to 0. Optional.
 
* **include** _string\[\]_ Additional information to include in the transcription response.
 

### [Model Capabilities](#model-capabilities-3)

| Model | Transcription | Duration | Segments | Language |
| --- | --- | --- | --- | --- |
| `whisper-1` | | | | |
| `gpt-4o-mini-transcribe` | | | | |
| `gpt-4o-transcribe` | | | | |

## [Speech Models](#speech-models)

You can create models that call the [OpenAI speech API](https://platform.openai.com/docs/api-reference/audio/speech) using the `.speech()` factory method.

The first argument is the model id e.g. `tts-1`.

```
1const model = openai.speech('tts-1');
```

The `voice` argument can be set to one of OpenAI's available voices: `alloy`, `ash`, `coral`, `echo`, `fable`, `onyx`, `nova`, `sage`, or `shimmer`.

```
1import { experimental_generateSpeech as generateSpeech } from 'ai';2import { openai } from '@ai-sdk/openai';3
4const result = await generateSpeech({5 model: openai.speech('tts-1'),6 text: 'Hello, world!',7 voice: 'alloy', // OpenAI voice ID8});
```

You can also pass additional provider-specific options using the `providerOptions` argument:

```
1import { experimental_generateSpeech as generateSpeech } from 'ai';2import { openai, type OpenAISpeechModelOptions } from '@ai-sdk/openai';3
4const result = await generateSpeech({5 model: openai.speech('tts-1'),6 text: 'Hello, world!',7 voice: 'alloy',8 providerOptions: {9 openai: {10 speed: 1.2,11 } satisfies OpenAISpeechModelOptions,12 },13});
```

* **instructions** _string_ Control the voice of your generated audio with additional instructions e.g. "Speak in a slow and steady tone". Does not work with `tts-1` or `tts-1-hd`. Optional.
 
* **speed** _number_ The speed of the generated audio. Select a value from 0.25 to 4.0. Defaults to 1.0. Optional.
 

### [Model Capabilities](#model-capabilities-4)

| Model | Instructions |
| --- | --- |
| `tts-1` | |
| `tts-1-hd` | |
| `gpt-4o-mini-tts` | |

---
url: https://ai-sdk.dev/providers/ai-sdk-providers/azure
title: "AI SDK Providers: Azure OpenAI"
description: "Learn how to use the Azure OpenAI provider for the AI SDK."
hash: "eb5fcf6b9664ad8fde09f5fe62adb1c1237db94c51d8c0b98ece8bad7d51c6cf"
crawledAt: 2026-03-07T08:04:22.731Z
depth: 2
---

## [Azure OpenAI Provider](#azure-openai-provider)

The [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service) provider contains language model support for the Azure OpenAI chat API.

## [Setup](#setup)

The Azure OpenAI provider is available in the `@ai-sdk/azure` module. You can install it with

pnpm add @ai-sdk/azure

## [Provider Instance](#provider-instance)

You can import the default provider instance `azure` from `@ai-sdk/azure`:

```
1import { azure } from '@ai-sdk/azure';
```

If you need a customized setup, you can import `createAzure` from `@ai-sdk/azure` and create a provider instance with your settings:

```
1import { createAzure } from '@ai-sdk/azure';2
3const azure = createAzure({4 resourceName: 'your-resource-name', // Azure resource name5 apiKey: 'your-api-key',6});
```

You can use the following optional settings to customize the OpenAI provider instance:

* **resourceName** _string_
 
 Azure resource name. It defaults to the `AZURE_RESOURCE_NAME` environment variable.
 
 The resource name is used in the assembled URL: `https://{resourceName}.openai.azure.com/openai/v1{path}`. You can use `baseURL` instead to specify the URL prefix.
 
* **apiKey** _string_
 
 API key that is being sent using the `api-key` header. It defaults to the `AZURE_API_KEY` environment variable.
 
* **apiVersion** _string_
 
 Sets a custom [api version](https://learn.microsoft.com/en-us/azure/ai-services/openai/api-version-deprecation). Defaults to `v1`.
 
* **baseURL** _string_
 
 Use a different URL prefix for API calls, e.g. to use proxy servers.
 
 Either this or `resourceName` can be used. When a baseURL is provided, the resourceName is ignored.
 
 With a baseURL, the resolved URL is `{baseURL}/v1{path}`.
 
* **headers** _Record<string,string>_
 
 Custom headers to include in the requests.
 
* **fetch** _(input: RequestInfo, init?: RequestInit) => Promise<Response>_
 
 Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation. Defaults to the global `fetch` function. You can use it as a middleware to intercept requests, or to provide a custom fetch implementation for e.g. testing.
 
* **useDeploymentBasedUrls** _boolean_
 
 Use deployment-based URLs for API calls. Set to `true` to use the legacy deployment format: `{baseURL}/deployments/{deploymentId}{path}?api-version={apiVersion}` instead of `{baseURL}/v1{path}?api-version={apiVersion}`. Defaults to `false`.
 
 This option is useful for compatibility with certain Azure OpenAI models or deployments that require the legacy endpoint format.
 

## [Language Models](#language-models)

The Azure OpenAI provider instance is a function that you can invoke to create a language model:

```
1const model = azure('your-deployment-name');
```

You need to pass your deployment name as the first argument.

### [Reasoning Models](#reasoning-models)

Azure exposes the thinking of `DeepSeek-R1` in the generated text using the `<think>` tag. You can use the `extractReasoningMiddleware` to extract this reasoning and expose it as a `reasoning` property on the result:

```
1import { azure } from '@ai-sdk/azure';2import { wrapLanguageModel, extractReasoningMiddleware } from 'ai';3
4const enhancedModel = wrapLanguageModel({5 model: azure('your-deepseek-r1-deployment-name'),6 middleware: extractReasoningMiddleware({ tagName: 'think' }),7});
```

You can then use that enhanced model in functions like `generateText` and `streamText`.

The Azure provider calls the Responses API by default (unless you specify e.g. `azure.chat`).

### [Example](#example)

You can use OpenAI language models to generate text with the `generateText` function:

```
1import { azure } from '@ai-sdk/azure';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: azure('your-deployment-name'),6 prompt: 'Write a vegetarian lasagna recipe for 4 people.',7});
```

OpenAI language models can also be used in the `streamText` function and support structured data generation with [`Output`](https://ai-sdk.dev/docs/reference/ai-sdk-core/output) (see [AI SDK Core](https://ai-sdk.dev/docs/ai-sdk-core)).

### [Provider Options](#provider-options)

When using OpenAI language models on Azure, you can configure provider-specific options using `providerOptions.openai`. More information on available configuration options are on [the OpenAI provider page](https://ai-sdk.dev/providers/ai-sdk-providers/openai#language-models).

```
1import { azure, type OpenAILanguageModelResponsesOptions } from '@ai-sdk/azure';2
3const messages = [4 {5 role: 'user',6 content: [7 {8 type: 'text',9 text: 'What is the capital of the moon?',10 },11 {12 type: 'image',13 image: 'https://example.com/image.png',14 providerOptions: {15 openai: { imageDetail: 'low' },16 },17 },18 ],19 },20];21
22const { text } = await generateText({23 model: azure('your-deployment-name'),24 providerOptions: {25 openai: {26 reasoningEffort: 'low',27 } satisfies OpenAILanguageModelResponsesOptions,28 },29});
```

### [Chat Models](#chat-models)

The URL for calling Azure chat models will be constructed as follows: `https://RESOURCE_NAME.openai.azure.com/openai/v1/chat/completions?api-version=v1`

You can create models that call the Azure OpenAI chat completions API using the `.chat()` factory method:

```
1const model = azure.chat('your-deployment-name');
```

Azure OpenAI chat models support also some model specific settings that are not part of the [standard call settings](https://ai-sdk.dev/docs/ai-sdk-core/settings). You can pass them as an options argument:

```
1import { azure, type OpenAILanguageModelChatOptions } from '@ai-sdk/azure';2import { generateText } from 'ai';3
4const result = await generateText({5 model: azure.chat('your-deployment-name'),6 prompt: 'Write a short story about a robot.',7 providerOptions: {8 openai: {9 logitBias: {10 // optional likelihood for specific tokens11 '50256': -100,12 },13 user: 'test-user', // optional unique user identifier14 } satisfies OpenAILanguageModelChatOptions,15 },16});
```

The following optional provider options are available for OpenAI chat models:

* **logitBias** _Record<number, number>_
 
 Modifies the likelihood of specified tokens appearing in the completion.
 
 Accepts a JSON object that maps tokens (specified by their token ID in the GPT tokenizer) to an associated bias value from -100 to 100. You can use this tokenizer tool to convert text to token IDs. Mathematically, the bias is added to the logits generated by the model prior to sampling. The exact effect will vary per model, but values between -1 and 1 should decrease or increase likelihood of selection; values like -100 or 100 should result in a ban or exclusive selection of the relevant token.
 
 As an example, you can pass `{"50256": -100}` to prevent the token from being generated.
 
* **logprobs** _boolean | number_
 
 Return the log probabilities of the tokens. Including logprobs will increase the response size and can slow down response times. However, it can be useful to better understand how the model is behaving.
 
 Setting to true will return the log probabilities of the tokens that were generated.
 
 Setting to a number will return the log probabilities of the top n tokens that were generated.
 
* **parallelToolCalls** _boolean_
 
 Whether to enable parallel function calling during tool use. Default to true.
 
* **user** _string_
 
 A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse. Learn more.
 

### [Responses Models](#responses-models)

Azure OpenAI uses responses API as default with the `azure(deploymentName)` factory method.

```
1const model = azure('your-deployment-name');
```

Further configuration can be done using OpenAI provider options. You can validate the provider options using the `OpenAILanguageModelResponsesOptions` type.

In the Responses API, use `azure` as the provider name in `providerOptions` instead of `openai`. The `openai` key is still supported for `providerOptions` input.

```
1import { azure, OpenAILanguageModelResponsesOptions } from '@ai-sdk/azure';2import { generateText } from 'ai';3
4const result = await generateText({5 model: azure('your-deployment-name'),6 providerOptions: {7 azure: {8 parallelToolCalls: false,9 store: false,10 user: 'user_123',11 //...12 } satisfies OpenAILanguageModelResponsesOptions,13 },14 //...15});
```

The following provider options are available:

* **parallelToolCalls** _boolean_ Whether to use parallel tool calls. Defaults to `true`.
 
* **store** _boolean_ Whether to store the generation. Defaults to `true`.
 
* **metadata** _Record<string, string>_ Additional metadata to store with the generation.
 
* **previousResponseId** _string_ The ID of the previous response. You can use it to continue a conversation. Defaults to `undefined`.
 
* **instructions** _string_ Instructions for the model. They can be used to change the system or developer message when continuing a conversation using the `previousResponseId` option. Defaults to `undefined`.
 
* **user** _string_ A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse. Defaults to `undefined`.
 
* **reasoningEffort** _'low' | 'medium' | 'high'_ Reasoning effort for reasoning models. Defaults to `medium`. If you use `providerOptions` to set the `reasoningEffort` option, this model setting will be ignored.
 
* **strictJsonSchema** _boolean_ Whether to use strict JSON schema validation. Defaults to `false`.
 

The Azure OpenAI provider also returns provider-specific metadata:

For Responses models (`azure(deploymentName)`), you can type this metadata using `AzureResponsesProviderMetadata`:

```
1import { azure, type AzureResponsesProviderMetadata } from '@ai-sdk/azure';2import { generateText } from 'ai';3
4const result = await generateText({5 model: azure('your-deployment-name'),6});7
8const providerMetadata = result.providerMetadata as9 | AzureResponsesProviderMetadata10 | undefined;11
12const { responseId, logprobs, serviceTier } = providerMetadata?.azure ?? {};13
14// responseId can be used to continue a conversation (previousResponseId).15console.log(responseId);
```

The following Azure-specific metadata may be returned:

* **responseId** _string | null | undefined_ The ID of the response. Can be used to continue a conversation.
* **logprobs** _(optional)_ Log probabilities of output tokens (when enabled).
* **serviceTier** _(optional)_ Service tier information returned by the API.

The providerMetadata is only returned with the default responses API, and is not supported when using 'azure.chat' or 'azure.completion'

#### [Web Search Tool](#web-search-tool)

The Azure OpenAI responses API supports web search(preview) through the `azure.tools.webSearchPreview` tool.

```
1const result = await generateText({2 model: azure('gpt-4.1-mini'),3 prompt: 'What happened in San Francisco last week?',4 tools: {5 web_search_preview: azure.tools.webSearchPreview({6 // optional configuration:7 searchContextSize: 'low',8 userLocation: {9 type: 'approximate',10 city: 'San Francisco',11 region: 'California',12 },13 }),14 },15 // Force web search tool (optional):16 toolChoice: { type: 'tool', toolName: 'web_search_preview' },17});18
19console.log(result.text);20
21// URL sources directly from `results`22const sources = result.sources;23for (const source of sources) {24 console.log('source:', source);25}
```

The tool must be named `web_search_preview` when using Azure OpenAI's web search(preview) functionality. This name is required by Azure OpenAI's API specification and cannot be customized.

The 'web\_search\_preview' tool is only supported with the default responses API, and is not supported when using 'azure.chat' or 'azure.completion'

#### [File Search Tool](#file-search-tool)

The Azure OpenAI provider supports file search through the `azure.tools.fileSearch` tool.

You can force the use of the file search tool by setting the `toolChoice` parameter to `{ type: 'tool', toolName: 'file_search' }`.

```
1const result = await generateText({2 model: azure('gpt-5'),3 prompt: 'What does the document say about user authentication?',4 tools: {5 file_search: azure.tools.fileSearch({6 // optional configuration:7 vectorStoreIds: ['vs_123', 'vs_456'],8 maxNumResults: 10,9 ranking: {10 ranker: 'auto',11 },12 }),13 },14 // Force file search tool:15 toolChoice: { type: 'tool', toolName: 'file_search' },16});
```

The tool must be named `file_search` when using Azure OpenAI's file search functionality. This name is required by Azure OpenAI's API specification and cannot be customized.

The 'file\_search' tool is only supported with the default responses API, and is not supported when using 'azure.chat' or 'azure.completion'

#### [Image Generation Tool](#image-generation-tool)

Azure OpenAI's Responses API supports multi-modal image generation as a provider-defined tool. Availability is restricted to specific models (for example, `gpt-5` variants).

```
1import { createAzure } from '@ai-sdk/azure';2import { generateText } from 'ai';3
4const azure = createAzure({5 headers: {6 'x-ms-oai-image-generation-deployment': 'gpt-image-1', // use your own image model deployment7 },8});9
10const result = await generateText({11 model: azure('gpt-5'),12 prompt:13 'Generate an image of an echidna swimming across the Mozambique channel.',14 tools: {15 image_generation: azure.tools.imageGeneration({ outputFormat: 'png' }),16 },17});18
19for (const toolResult of result.staticToolResults) {20 if (toolResult.toolName === 'image_generation') {21 const base64Image = toolResult.output.result;22 }23}
```

The tool must be named `image_generation` when using Azure OpenAI's image generation functionality. This name is required by Azure OpenAI's API specification and cannot be customized.

The 'image\_generation' tool is only supported with the default responses API, and is not supported when using 'azure.chat' or 'azure.completion'

To use image\_generation, you must first create an image generation model. You must add a deployment specification to the header `x-ms-oai-image-generation-deployment`. Please note that the Responses API model and the image generation model must be in the same resource.

When you set `store: false`, then previously generated images will not be accessible by the model. We recommend using the image generation tool without setting `store: false`.

#### [Code Interpreter Tool](#code-interpreter-tool)

The Azure OpenAI provider supports the code interpreter tool through the `azure.tools.codeInterpreter` tool. This allows models to write and execute Python code.

```
1import { azure } from '@ai-sdk/azure';2import { generateText } from 'ai';3
4const result = await generateText({5 model: azure('gpt-5'),6 prompt: 'Write and run Python code to calculate the factorial of 10',7 tools: {8 code_interpreter: azure.tools.codeInterpreter({9 // optional configuration:10 container: {11 fileIds: ['assistant-123', 'assistant-456'], // optional file IDs to make available12 },13 }),14 },15});
```

The code interpreter tool can be configured with:

* **container**: Either a container ID string or an object with `fileIds` to specify uploaded files that should be available to the code interpreter

The tool must be named `code_interpreter` when using Azure OpenAI's code interpreter functionality. This name is required by Azure OpenAI's API specification and cannot be customized.

The 'code\_interpreter' tool is only supported with the default responses API, and is not supported when using 'azure.chat' or 'azure.completion'

When working with files generated by the Code Interpreter, reference information can be obtained from both [annotations in Text Parts](#typed-providermetadata-in-text-parts) and [`providerMetadata` in Source Document Parts](#typed-providermetadata-in-source-document-parts).

#### [PDF support](#pdf-support)

The Azure OpenAI provider supports reading PDF files. You can pass PDF files as part of the message content using the `file` type:

```
1const result = await generateText({2 model: azure('your-deployment-name'),3 messages: [4 {5 role: 'user',6 content: [7 {8 type: 'text',9 text: 'What is an embedding model?',10 },11 {12 type: 'file',13 data: fs.readFileSync('./data/ai.pdf'),14 mediaType: 'application/pdf',15 filename: 'ai.pdf', // optional16 },17 ],18 },19 ],20});
```

The model will have access to the contents of the PDF file and respond to questions about it. The PDF file should be passed using the `data` field, and the `mediaType` should be set to `'application/pdf'`.

Reading PDF files are only supported with the default responses API, and is not supported when using 'azure.chat' or 'azure.completion'

#### [Typed providerMetadata in Text Parts](#typed-providermetadata-in-text-parts)

When using the Azure OpenAI Responses API, the SDK attaches Azure OpenAI-specific metadata to output parts via `providerMetadata`.

This metadata can be used on the client side for tasks such as rendering citations or downloading files generated by the Code Interpreter. To enable type-safe handling of this metadata, the AI SDK exports dedicated TypeScript types.

For text parts, when `part.type === 'text'`, the `providerMetadata` is provided in the form of `AzureResponsesTextProviderMetadata`.

This metadata includes the following fields:

* `itemId` 
 The ID of the output item in the Responses API.
 
* `annotations` (optional) An array of annotation objects generated by the model. If no annotations are present, this property itself may be omitted (`undefined`).
 
 Each element in `annotations` is a discriminated union with a required `type` field. Supported types include, for example:
 
 * `url_citation`
 * `file_citation`
 * `container_file_citation`
 * `file_path`
 
 These annotations directly correspond to the annotation objects defined by the Responses API and can be used for inline reference rendering or output analysis. For details, see the official OpenAI documentation: [Responses API – output text annotations](https://platform.openai.com/docs/api-reference/responses/object?lang=javascript#responses-object-output-output_message-content-output_text-annotations).
 

```
1import { azure, type AzureResponsesTextProviderMetadata } from '@ai-sdk/azure';2import { generateText } from 'ai';3
4const result = await generateText({5 model: azure('gpt-4.1-mini'),6 prompt:7 'Create a program that generates five random numbers between 1 and 100 with two decimal places, and show me the execution results. Also save the result to a file.',8 tools: {9 code_interpreter: azure.tools.codeInterpreter(),10 web_search_preview: azure.tools.webSearchPreview({}),11 file_search: azure.tools.fileSearch({ vectorStoreIds: ['vs_1234'] }), // requires a configured vector store12 },13});14
15for (const part of result.content) {16 if (part.type === 'text') {17 const providerMetadata = part.providerMetadata as18 | AzureResponsesTextProviderMetadata19 | undefined;20 if (!providerMetadata) continue;21 const { itemId: _itemId, annotations } = providerMetadata.azure;22
23 if (!annotations) continue;24 for (const annotation of annotations) {25 switch (annotation.type) {26 case 'url_citation':27 // url_citation is returned from web_search and provides:28 // properties: type, url, title, start_index and end_index29 break;30 case 'file_citation':31 // file_citation is returned from file_search and provides:32 // properties: type, file_id, filename and index33 break;34 case 'container_file_citation':35 // container_file_citation is returned from code_interpreter and provides:36 // properties: type, container_id, file_id, filename, start_index and end_index37 break;38 case 'file_path':39 // file_path provides:40 // properties: type, file_id and index41 break;42 default: {43 const _exhaustiveCheck: never = annotation;44 throw new Error(45 `Unhandled annotation: ${JSON.stringify(_exhaustiveCheck)}`,46 );47 }48 }49 }50 }51}
```

When implementing file downloads for files generated by the Code Interpreter, the `container_id` and `file_id` available in `providerMetadata` can be used to retrieve the file content. For details, see the [Retrieve container file content](https://platform.openai.com/docs/api-reference/container-files/retrieveContainerFileContent) API.

#### [Typed providerMetadata in Reasoning Parts](#typed-providermetadata-in-reasoning-parts)

When using the Azure OpenAI Responses API, reasoning output parts can include provider metadata. To handle this metadata in a type-safe way, use `AzureResponsesReasoningProviderMetadata`.

For reasoning parts, when `part.type === 'reasoning'`, the `providerMetadata` is provided in the form of `AzureResponsesReasoningProviderMetadata`.

This metadata includes the following fields:

* `itemId` 
 The ID of the reasoning item in the Responses API.
* `reasoningEncryptedContent` (optional) 
 Encrypted reasoning content (only returned when requested via `include: ['reasoning.encrypted_content']`).

```
1import {2 azure,3 type AzureResponsesReasoningProviderMetadata,4 type OpenAILanguageModelResponsesOptions,5} from '@ai-sdk/azure';6import { generateText } from 'ai';7
8const result = await generateText({9 model: azure('your-deployment-name'),10 prompt: 'How many "r"s are in the word "strawberry"?',11 providerOptions: {12 azure: {13 store: false,14 include: ['reasoning.encrypted_content'],15 } satisfies OpenAILanguageModelResponsesOptions,16 },17});18
19for (const part of result.content) {20 if (part.type === 'reasoning') {21 const providerMetadata = part.providerMetadata as22 | AzureResponsesReasoningProviderMetadata23 | undefined;24
25 const { itemId, reasoningEncryptedContent } = providerMetadata?.azure ?? {};26 console.log(itemId, reasoningEncryptedContent);27 }28}
```

#### [Typed providerMetadata in Source Document Parts](#typed-providermetadata-in-source-document-parts)

For source document parts, when `part.type === 'source'` and `sourceType === 'document'`, the `providerMetadata` is provided as `AzureResponsesSourceDocumentProviderMetadata`.

This metadata is also a discriminated union with a required `type` field. Supported types include:

* `file_citation`
* `container_file_citation`
* `file_path`

Each type includes the identifiers required to work with the referenced resource, such as `fileId` and `containerId`.

```
1import {2 azure,3 type AzureResponsesSourceDocumentProviderMetadata,4} from '@ai-sdk/azure';5import { generateText } from 'ai';6
7const result = await generateText({8 model: azure('gpt-4.1-mini'),9 prompt:10 'Create a program that generates five random numbers between 1 and 100 with two decimal places, and show me the execution results. Also save the result to a file.',11 tools: {12 code_interpreter: azure.tools.codeInterpreter(),13 web_search_preview: azure.tools.webSearchPreview({}),14 file_search: azure.tools.fileSearch({ vectorStoreIds: ['vs_1234'] }), // requires a configured vector store15 },16});17
18for (const part of result.content) {19 if (part.type === 'source') {20 if (part.sourceType === 'document') {21 const providerMetadata = part.providerMetadata as22 | AzureResponsesSourceDocumentProviderMetadata23 | undefined;24 if (!providerMetadata) continue;25 const annotation = providerMetadata.azure;26 switch (annotation.type) {27 case 'file_citation':28 // file_citation is returned from file_search and provides:29 // properties: type, fileId and index30 // The filename can be accessed via part.filename.31 break;32 case 'container_file_citation':33 // container_file_citation is returned from code_interpreter and provides:34 // properties: type, containerId and fileId35 // The filename can be accessed via part.filename.36 break;37 case 'file_path':38 // file_path provides:39 // properties: type, fileId and index40 break;41 default: {42 const _exhaustiveCheck: never = annotation;43 throw new Error(44 `Unhandled annotation: ${JSON.stringify(_exhaustiveCheck)}`,45 );46 }47 }48 }49 }50}
```

Annotations in text parts follow the OpenAI Responses API specification and therefore use snake\_case properties (e.g. `file_id`, `container_id`). In contrast, `providerMetadata` for source document parts is normalized by the SDK to camelCase (e.g. `fileId`, `containerId`). Fields that depend on the original text content, such as `start_index` and `end_index`, are omitted, as are fields like `filename` that are directly available on the source object.

### [Completion Models](#completion-models)

You can create models that call the completions API using the `.completion()` factory method. The first argument is the model id. Currently only `gpt-35-turbo-instruct` is supported.

```
1const model = azure.completion('your-gpt-35-turbo-instruct-deployment');
```

OpenAI completion models support also some model specific settings that are not part of the [standard call settings](https://ai-sdk.dev/docs/ai-sdk-core/settings). You can pass them as an options argument:

```
1import {2 azure,3 type OpenAILanguageModelCompletionOptions,4} from '@ai-sdk/azure';5import { generateText } from 'ai';6
7const result = await generateText({8 model: azure.completion('your-gpt-35-turbo-instruct-deployment'),9 prompt: 'Write a haiku about coding.',10 providerOptions: {11 openai: {12 echo: true, // optional, echo the prompt in addition to the completion13 logitBias: {14 // optional likelihood for specific tokens15 '50256': -100,16 },17 suffix: 'some text', // optional suffix that comes after a completion of inserted text18 user: 'test-user', // optional unique user identifier19 } satisfies OpenAILanguageModelCompletionOptions,20 },21});
```

The following optional provider options are available for Azure OpenAI completion models:

* **echo**: _boolean_
 
 Echo back the prompt in addition to the completion.
 
* **logitBias** _Record<number, number>_
 
 Modifies the likelihood of specified tokens appearing in the completion.
 
 Accepts a JSON object that maps tokens (specified by their token ID in the GPT tokenizer) to an associated bias value from -100 to 100. You can use this tokenizer tool to convert text to token IDs. Mathematically, the bias is added to the logits generated by the model prior to sampling. The exact effect will vary per model, but values between -1 and 1 should decrease or increase likelihood of selection; values like -100 or 100 should result in a ban or exclusive selection of the relevant token.
 
 As an example, you can pass `{"50256": -100}` to prevent the <|endoftext|> token from being generated.
 
* **logprobs** _boolean | number_
 
 Return the log probabilities of the tokens. Including logprobs will increase the response size and can slow down response times. However, it can be useful to better understand how the model is behaving.
 
 Setting to true will return the log probabilities of the tokens that were generated.
 
 Setting to a number will return the log probabilities of the top n tokens that were generated.
 
* **suffix** _string_
 
 The suffix that comes after a completion of inserted text.
 
* **user** _string_
 
 A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse. Learn more.
 

## [Embedding Models](#embedding-models)

You can create models that call the Azure OpenAI embeddings API using the `.embedding()` factory method.

```
1const model = azure.embedding('your-embedding-deployment');
```

Azure OpenAI embedding models support several additional settings. You can pass them as an options argument:

```
1import { azure, type OpenAIEmbeddingModelOptions } from '@ai-sdk/azure';2import { embed } from 'ai';3
4const { embedding } = await embed({5 model: azure.embedding('your-embedding-deployment'),6 value: 'sunny day at the beach',7 providerOptions: {8 openai: {9 dimensions: 512, // optional, number of dimensions for the embedding10 user: 'test-user', // optional unique user identifier11 } satisfies OpenAIEmbeddingModelOptions,12 },13});
```

The following optional provider options are available for Azure OpenAI embedding models:

* **dimensions**: _number_
 
 The number of dimensions the resulting output embeddings should have. Only supported in text-embedding-3 and later models.
 
* **user** _string_
 
 A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse. Learn more.
 

## [Image Models](#image-models)

You can create models that call the Azure OpenAI image generation API (DALL-E) using the `.image()` factory method. The first argument is your deployment name for the DALL-E model.

```
1const model = azure.image('your-dalle-deployment-name');
```

Azure OpenAI image models support several additional settings. You can pass them as `providerOptions.openai` when generating the image:

```
1await generateImage({2 model: azure.image('your-dalle-deployment-name'),3 prompt: 'A photorealistic image of a cat astronaut floating in space',4 size: '1024x1024', // '1024x1024', '1792x1024', or '1024x1792' for DALL-E 35 providerOptions: {6 openai: {7 user: 'test-user', // optional unique user identifier8 responseFormat: 'url', // 'url' or 'b64_json', defaults to 'url'9 },10 },11});
```

### [Example](#example-1)

You can use Azure OpenAI image models to generate images with the `generateImage` function:

```
1import { azure } from '@ai-sdk/azure';2import { generateImage } from 'ai';3
4const { image } = await generateImage({5 model: azure.image('your-dalle-deployment-name'),6 prompt: 'A photorealistic image of a cat astronaut floating in space',7 size: '1024x1024', // '1024x1024', '1792x1024', or '1024x1792' for DALL-E 38});9
10// image contains the URL or base64 data of the generated image11console.log(image);
```

### [Model Capabilities](#model-capabilities)

Azure OpenAI supports DALL-E 2 and DALL-E 3 models through deployments. The capabilities depend on which model version your deployment is using:

| Model Version | Sizes |
| --- | --- |
| DALL-E 3 | 1024x1024, 1792x1024, 1024x1792 |
| DALL-E 2 | 256x256, 512x512, 1024x1024 |

DALL-E models do not support the `aspectRatio` parameter. Use the `size` parameter instead.

When creating your Azure OpenAI deployment, make sure to set the DALL-E model version you want to use.

## [Transcription Models](#transcription-models)

You can create models that call the Azure OpenAI transcription API using the `.transcription()` factory method.

The first argument is the model id e.g. `whisper-1`.

```
1const model = azure.transcription('whisper-1');
```

If you encounter a "DeploymentNotFound" error with transcription models, try enabling deployment-based URLs:

```
1const azure = createAzure({2 useDeploymentBasedUrls: true,3 apiVersion: '2025-04-01-preview',4});
```

This uses the legacy endpoint format which may be required for certain Azure OpenAI deployments. When using useDeploymentBasedUrls, the default api-version is not valid. You must set it to `2025-04-01-preview` or an earlier value.

You can also pass additional provider-specific options using the `providerOptions` argument. For example, supplying the input language in ISO-639-1 (e.g. `en`) format will improve accuracy and latency.

```
1import { experimental_transcribe as transcribe } from 'ai';2import { azure, type OpenAITranscriptionModelOptions } from '@ai-sdk/azure';3import { readFile } from 'fs/promises';4
5const result = await transcribe({6 model: azure.transcription('whisper-1'),7 audio: await readFile('audio.mp3'),8 providerOptions: {9 openai: {10 language: 'en',11 } satisfies OpenAITranscriptionModelOptions,12 },13});
```

The following provider options are available:

* **timestampGranularities** _string\[\]_ The granularity of the timestamps in the transcription. Defaults to `['segment']`. Possible values are `['word']`, `['segment']`, and `['word', 'segment']`. Note: There is no additional latency for segment timestamps, but generating word timestamps incurs additional latency.
 
* **language** _string_ The language of the input audio. Supplying the input language in ISO-639-1 format (e.g. 'en') will improve accuracy and latency. Optional.
 
* **prompt** _string_ An optional text to guide the model's style or continue a previous audio segment. The prompt should match the audio language. Optional.
 
* **temperature** _number_ The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. If set to 0, the model will use log probability to automatically increase the temperature until certain thresholds are hit. Defaults to 0. Optional.
 
* **include** _string\[\]_ Additional information to include in the transcription response.
 

### [Model Capabilities](#model-capabilities-1)

| Model | Transcription | Duration | Segments | Language |
| --- | --- | --- | --- | --- |
| `whisper-1` | | | | |
| `gpt-4o-mini-transcribe` | | | | |
| `gpt-4o-transcribe` | | | | |

## [Speech Models](#speech-models)

You can create models that call the Azure OpenAI speech API using the `.speech()` factory method.

The first argument is your deployment name for the text-to-speech model (e.g., `tts-1`).

```
1const model = azure.speech('your-tts-deployment-name');
```

### [Example](#example-2)

```
1import { azure } from '@ai-sdk/azure';2import { experimental_generateSpeech as generateSpeech } from 'ai';3
4const result = await generateSpeech({5 model: azure.speech('your-tts-deployment-name'),6 text: 'Hello, world!',7 voice: 'alloy', // OpenAI voice ID8});
```

You can also pass additional provider-specific options using the `providerOptions` argument:

```
1import { azure, type OpenAISpeechModelOptions } from '@ai-sdk/azure';2import { experimental_generateSpeech as generateSpeech } from 'ai';3
4const result = await generateSpeech({5 model: azure.speech('your-tts-deployment-name'),6 text: 'Hello, world!',7 voice: 'alloy',8 providerOptions: {9 openai: {10 speed: 1.2,11 } satisfies OpenAISpeechModelOptions,12 },13});
```

The following provider options are available:

* **instructions** _string_ Control the voice of your generated audio with additional instructions e.g. "Speak in a slow and steady tone". Does not work with `tts-1` or `tts-1-hd`. Optional.
 
* **speed** _number_ The speed of the generated audio. Select a value from 0.25 to 4.0. Defaults to 1.0. Optional.
 

### [Model Capabilities](#model-capabilities-2)

Azure OpenAI supports TTS models through deployments. The capabilities depend on which model version your deployment is using:

| Model Version | Instructions |
| --- | --- |
| `tts-1` | |
| `tts-1-hd` | |
| `gpt-4o-mini-tts` | |

---
url: https://ai-sdk.dev/providers/ai-sdk-providers/anthropic
title: "AI SDK Providers: Anthropic"
description: "Learn how to use the Anthropic provider for the AI SDK."
hash: "74d6911d575d8f93f43f0af92f2270a18b1f29e869f9c5a4296b9ca269461f78"
crawledAt: 2026-03-07T08:04:29.013Z
depth: 2
---

## [Anthropic Provider](#anthropic-provider)

The [Anthropic](https://www.anthropic.com/) provider contains language model support for the [Anthropic Messages API](https://docs.anthropic.com/claude/reference/messages_post).

## [Setup](#setup)

The Anthropic provider is available in the `@ai-sdk/anthropic` module. You can install it with

pnpm add @ai-sdk/anthropic

## [Provider Instance](#provider-instance)

You can import the default provider instance `anthropic` from `@ai-sdk/anthropic`:

```
1import { anthropic } from '@ai-sdk/anthropic';
```

If you need a customized setup, you can import `createAnthropic` from `@ai-sdk/anthropic` and create a provider instance with your settings:

```
1import { createAnthropic } from '@ai-sdk/anthropic';2
3const anthropic = createAnthropic({4 // custom settings5});
```

You can use the following optional settings to customize the Anthropic provider instance:

* **baseURL** _string_
 
 Use a different URL prefix for API calls, e.g. to use proxy servers. The default prefix is `https://api.anthropic.com/v1`.
 
* **apiKey** _string_
 
 API key that is being sent using the `x-api-key` header. It defaults to the `ANTHROPIC_API_KEY` environment variable. Only one of `apiKey` or `authToken` is required.
 
* **authToken** _string_
 
 Auth token that is being sent using the `Authorization: Bearer` header. It defaults to the `ANTHROPIC_AUTH_TOKEN` environment variable. Only one of `apiKey` or `authToken` is required.
 
* **headers** _Record<string,string>_
 
 Custom headers to include in the requests.
 
* **fetch** _(input: RequestInfo, init?: RequestInit) => Promise<Response>_
 
 Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation. Defaults to the global `fetch` function. You can use it as a middleware to intercept requests, or to provide a custom fetch implementation for e.g. testing.
 

## [Language Models](#language-models)

You can create models that call the [Anthropic Messages API](https://docs.anthropic.com/claude/reference/messages_post) using the provider instance. The first argument is the model id, e.g. `claude-3-haiku-20240307`. Some models have multi-modal capabilities.

```
1const model = anthropic('claude-3-haiku-20240307');
```

You can also use the following aliases for model creation:

* `anthropic.languageModel('claude-3-haiku-20240307')` - Creates a language model
* `anthropic.chat('claude-3-haiku-20240307')` - Alias for `languageModel`
* `anthropic.messages('claude-3-haiku-20240307')` - Alias for `languageModel`

You can use Anthropic language models to generate text with the `generateText` function:

```
1import { anthropic } from '@ai-sdk/anthropic';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: anthropic('claude-3-haiku-20240307'),6 prompt: 'Write a vegetarian lasagna recipe for 4 people.',7});
```

Anthropic language models can also be used in the `streamText` function and support structured data generation with [`Output`](https://ai-sdk.dev/docs/reference/ai-sdk-core/output) (see [AI SDK Core](https://ai-sdk.dev/docs/ai-sdk-core)).

The following optional provider options are available for Anthropic models:

* `disableParallelToolUse` _boolean_
 
 Optional. Disables the use of parallel tool calls. Defaults to `false`.
 
 When set to `true`, the model will only call one tool at a time instead of potentially calling multiple tools in parallel.
 
* `sendReasoning` _boolean_
 
 Optional. Include reasoning content in requests sent to the model. Defaults to `true`.
 
 If you are experiencing issues with the model handling requests involving reasoning content, you can set this to `false` to omit them from the request.
 
* `effort` _"high" | "medium" | "low"_
 
 Optional. See [Effort section](#effort) for more details.
 
* `speed` _"fast" | "standard"_
 
 Optional. See [Fast Mode section](#fast-mode) for more details.
 
* `thinking` _object_
 
 Optional. See [Reasoning section](#reasoning) for more details.
 
* `toolStreaming` _boolean_
 
 Whether to enable tool streaming (and structured output streaming). Default to `true`.
 
* `structuredOutputMode` _"outputFormat" | "jsonTool" | "auto"_
 
 Determines how structured outputs are generated. Optional.
 
 * `"outputFormat"`: Use the `output_format` parameter to specify the structured output format.
 * `"jsonTool"`: Use a special `"json"` tool to specify the structured output format.
 * `"auto"`: Use `"outputFormat"` when supported, otherwise fall back to `"jsonTool"` (default).

### [Structured Outputs and Tool Input Streaming](#structured-outputs-and-tool-input-streaming)

Tool call streaming is enabled by default. You can opt out by setting the `toolStreaming` provider option to `false`.

```
1import { anthropic } from '@ai-sdk/anthropic';2import { streamText, tool } from 'ai';3import { z } from 'zod';4
5const result = streamText({6 model: anthropic('claude-sonnet-4-20250514'),7 tools: {8 writeFile: tool({9 description: 'Write content to a file',10 inputSchema: z.object({11 path: z.string(),12 content: z.string(),13 }),14 execute: async ({ path, content }) => {15 // Implementation16 return { success: true };17 },18 }),19 },20 prompt: 'Write a short story to story.txt',21});
```

### [Effort](#effort)

Anthropic introduced an `effort` option with `claude-opus-4-5` that affects thinking, text responses, and function calls. Effort defaults to `high` and you can set it to `medium` or `low` to save tokens and to lower time-to-last-token latency (TTLT).

```
1import { anthropic, AnthropicLanguageModelOptions } from '@ai-sdk/anthropic';2import { generateText } from 'ai';3
4const { text, usage } = await generateText({5 model: anthropic('claude-opus-4-20250514'),6 prompt: 'How many people will live in the world in 2040?',7 providerOptions: {8 anthropic: {9 effort: 'low',10 } satisfies AnthropicLanguageModelOptions,11 },12});13
14console.log(text); // resulting text15console.log(usage); // token usage
```

### [Fast Mode](#fast-mode)

Anthropic supports a [`speed` option](https://code.claude.com/docs/en/fast-mode) for `claude-opus-4-6` that enables faster inference with approximately 2.5x faster output token speeds.

```
1import { anthropic, AnthropicLanguageModelOptions } from '@ai-sdk/anthropic';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: anthropic('claude-opus-4-6'),6 prompt: 'Write a short poem about the sea.',7 providerOptions: {8 anthropic: {9 speed: 'fast',10 } satisfies AnthropicLanguageModelOptions,11 },12});
```

The `speed` option accepts `'fast'` or `'standard'` (default behavior).

### [Reasoning](#reasoning)

Anthropic has reasoning support for `claude-opus-4-20250514`, `claude-sonnet-4-20250514`, and `claude-sonnet-4-5-20250929` models.

You can enable it using the `thinking` provider option and specifying a thinking budget in tokens.

```
1import { anthropic, AnthropicLanguageModelOptions } from '@ai-sdk/anthropic';2import { generateText } from 'ai';3
4const { text, reasoningText, reasoning } = await generateText({5 model: anthropic('claude-opus-4-20250514'),6 prompt: 'How many people will live in the world in 2040?',7 providerOptions: {8 anthropic: {9 thinking: { type: 'enabled', budgetTokens: 12000 },10 } satisfies AnthropicLanguageModelOptions,11 },12});13
14console.log(reasoningText); // reasoning text15console.log(reasoning); // reasoning details including redacted reasoning16console.log(text); // text response
```

See [AI SDK UI: Chatbot](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot#reasoning) for more details on how to integrate reasoning into your chatbot.

### [Context Management](#context-management)

Anthropic's Context Management feature allows you to automatically manage conversation context by clearing tool uses or thinking content when certain conditions are met. This helps optimize token usage and manage long conversations more efficiently.

You can configure context management using the `contextManagement` provider option:

```
1import { anthropic, AnthropicLanguageModelOptions } from '@ai-sdk/anthropic';2import { generateText } from 'ai';3
4const result = await generateText({5 model: anthropic('claude-sonnet-4-5-20250929'),6 prompt: 'Continue our conversation...',7 providerOptions: {8 anthropic: {9 contextManagement: {10 edits: [11 {12 type: 'clear_tool_uses_20250919',13 trigger: { type: 'input_tokens', value: 10000 },14 keep: { type: 'tool_uses', value: 5 },15 clearAtLeast: { type: 'input_tokens', value: 1000 },16 clearToolInputs: true,17 excludeTools: ['important_tool'],18 },19 ],20 },21 } satisfies AnthropicLanguageModelOptions,22 },23});24
25// Check what was cleared26console.log(result.providerMetadata?.anthropic?.contextManagement);
```

#### [Context Editing](#context-editing)

Context editing strategies selectively remove specific content types from earlier in the conversation to reduce token usage without losing the overall conversation flow.

##### [Clear Tool Uses](#clear-tool-uses)

The `clear_tool_uses_20250919` edit type removes old tool call/result pairs from the conversation history:

* **trigger** - Condition that triggers the clearing (e.g., `{ type: 'input_tokens', value: 10000 }` or `{ type: 'tool_uses', value: 10 }`)
* **keep** - How many recent tool uses to preserve (e.g., `{ type: 'tool_uses', value: 5 }`)
* **clearAtLeast** - Minimum amount to clear (e.g., `{ type: 'input_tokens', value: 1000 }`)
* **clearToolInputs** - Whether to clear tool input parameters (boolean)
* **excludeTools** - Array of tool names to never clear

##### [Clear Thinking](#clear-thinking)

The `clear_thinking_20251015` edit type removes thinking/reasoning blocks from earlier turns, keeping only the most recent ones:

* **keep** - How many recent thinking turns to preserve (e.g., `{ type: 'thinking_turns', value: 2 }`) or `'all'` to keep everything

```
1const result = await generateText({2 model: anthropic('claude-opus-4-20250514'),3 prompt: 'Continue reasoning...',4 providerOptions: {5 anthropic: {6 thinking: { type: 'enabled', budgetTokens: 12000 },7 contextManagement: {8 edits: [9 {10 type: 'clear_thinking_20251015',11 keep: { type: 'thinking_turns', value: 2 },12 },13 ],14 },15 } satisfies AnthropicLanguageModelOptions,16 },17});
```

#### [Compaction](#compaction)

The `compact_20260112` edit type automatically summarizes earlier conversation context when token limits are reached. This is useful for long-running conversations where you want to preserve the essence of earlier exchanges while staying within token limits.

```
1import { anthropic, AnthropicLanguageModelOptions } from '@ai-sdk/anthropic';2import { streamText } from 'ai';3
4const result = streamText({5 model: anthropic('claude-opus-4-6'),6 messages: conversationHistory,7 providerOptions: {8 anthropic: {9 contextManagement: {10 edits: [11 {12 type: 'compact_20260112',13 trigger: {14 type: 'input_tokens',15 value: 50000, // trigger compaction when input exceeds 50k tokens16 },17 instructions:18 'Summarize the conversation concisely, preserving key decisions and context.',19 pauseAfterCompaction: false,20 },21 ],22 },23 } satisfies AnthropicLanguageModelOptions,24 },25});
```

**Configuration:**

* **trigger** - Condition that triggers compaction (e.g., `{ type: 'input_tokens', value: 50000 }`)
* **instructions** - Custom instructions for how the model should summarize the conversation. Use this to guide the compaction summary towards specific aspects of the conversation you want to preserve.
* **pauseAfterCompaction** - When `true`, the model will pause after generating the compaction summary, allowing you to inspect or process it before continuing. Defaults to `false`.

When compaction occurs, the model generates a summary of the earlier context. This summary appears as a text block with special provider metadata.

##### [Detecting Compaction in Streams](#detecting-compaction-in-streams)

When using `streamText`, you can detect compaction summaries by checking the `providerMetadata` on `text-start` events:

```
1for await (const part of result.fullStream) {2 switch (part.type) {3 case 'text-start': {4 const isCompaction =5 part.providerMetadata?.anthropic?.type === 'compaction';6 if (isCompaction) {7 console.log('[COMPACTION SUMMARY START]');8 }9 break;10 }11 case 'text-delta': {12 process.stdout.write(part.text);13 break;14 }15 }16}
```

##### [Compaction in UI Applications](#compaction-in-ui-applications)

When using `useChat` or other UI hooks, compaction summaries appear as regular text parts with `providerMetadata`. You can style them differently in your UI:

```
1{2 message.parts.map((part, index) => {3 if (part.type === 'text') {4 const isCompaction =5 (part.providerMetadata?.anthropic as { type?: string } | undefined)6 ?.type === 'compaction';7
8 if (isCompaction) {9 return (10 <div11 key={index}12 className="bg-yellow-100 border-l-4 border-yellow-500 p-2"13 >14 <span className="font-bold">[Compaction Summary]</span>15 <div>{part.text}</div>16 </div>17 );18 }19 return <div key={index}>{part.text}</div>;20 }21 });22}
```

#### [Applied Edits Metadata](#applied-edits-metadata)

After generation, you can check which edits were applied in the provider metadata:

```
1const metadata = result.providerMetadata?.anthropic?.contextManagement;2
3if (metadata?.appliedEdits) {4 metadata.appliedEdits.forEach(edit => {5 if (edit.type === 'clear_tool_uses_20250919') {6 console.log(`Cleared ${edit.clearedToolUses} tool uses`);7 console.log(`Freed ${edit.clearedInputTokens} tokens`);8 } else if (edit.type === 'clear_thinking_20251015') {9 console.log(`Cleared ${edit.clearedThinkingTurns} thinking turns`);10 console.log(`Freed ${edit.clearedInputTokens} tokens`);11 } else if (edit.type === 'compact_20260112') {12 console.log('Compaction was applied');13 }14 });15}
```

For more details, see [Anthropic's Context Management documentation](https://docs.anthropic.com/en/docs/build-with-claude/context-management).

### [Cache Control](#cache-control)

In the messages and message parts, you can use the `providerOptions` property to set cache control breakpoints. You need to set the `anthropic` property in the `providerOptions` object to `{ cacheControl: { type: 'ephemeral' } }` to set a cache control breakpoint.

The cache creation input tokens are then returned in the `providerMetadata` object for `generateText`, again under the `anthropic` property. When you use `streamText`, the response contains a promise that resolves to the metadata. Alternatively you can receive it in the `onFinish` callback.

```
1import { anthropic } from '@ai-sdk/anthropic';2import { generateText } from 'ai';3
4const errorMessage = '... long error message...';5
6const result = await generateText({7 model: anthropic('claude-sonnet-4-5'),8 messages: [9 {10 role: 'user',11 content: [12 { type: 'text', text: 'You are a JavaScript expert.' },13 {14 type: 'text',15 text: `Error message: ${errorMessage}`,16 providerOptions: {17 anthropic: { cacheControl: { type: 'ephemeral' } },18 },19 },20 { type: 'text', text: 'Explain the error message.' },21 ],22 },23 ],24});25
26console.log(result.text);27console.log(result.providerMetadata?.anthropic);28// e.g. { cacheCreationInputTokens: 2118 }
```

You can also use cache control on system messages by providing multiple system messages at the head of your messages array:

```
1const result = await generateText({2 model: anthropic('claude-sonnet-4-5'),3 messages: [4 {5 role: 'system',6 content: 'Cached system message part',7 providerOptions: {8 anthropic: { cacheControl: { type: 'ephemeral' } },9 },10 },11 {12 role: 'system',13 content: 'Uncached system message part',14 },15 {16 role: 'user',17 content: 'User prompt',18 },19 ],20});
```

Cache control for tools:

```
1const result = await generateText({2 model: anthropic('claude-haiku-4-5'),3 tools: {4 cityAttractions: tool({5 inputSchema: z.object({ city: z.string() }),6 providerOptions: {7 anthropic: {8 cacheControl: { type: 'ephemeral' },9 },10 },11 }),12 },13 messages: [14 {15 role: 'user',16 content: 'User prompt',17 },18 ],19});
```

#### [Longer cache TTL](#longer-cache-ttl)

Anthropic also supports a longer 1-hour cache duration.

Here's an example:

```
1const result = await generateText({2 model: anthropic('claude-haiku-4-5'),3 messages: [4 {5 role: 'user',6 content: [7 {8 type: 'text',9 text: 'Long cached message',10 providerOptions: {11 anthropic: {12 cacheControl: { type: 'ephemeral', ttl: '1h' },13 },14 },15 },16 ],17 },18 ],19});
```

#### [Limitations](#limitations)

The minimum cacheable prompt length is:

* 4096 tokens for Claude Opus 4.5
* 1024 tokens for Claude Opus 4.1, Claude Opus 4, Claude Sonnet 4.5, Claude Sonnet 4, Claude Sonnet 3.7, and Claude Opus 3
* 4096 tokens for Claude Haiku 4.5
* 2048 tokens for Claude Haiku 3.5 and Claude Haiku 3

Shorter prompts cannot be cached, even if marked with `cacheControl`. Any requests to cache fewer than this number of tokens will be processed without caching.

For more on prompt caching with Anthropic, see [Anthropic's Cache Control documentation](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching).

Because the `UIMessage` type (used by AI SDK UI hooks like `useChat`) does not support the `providerOptions` property, you can use `convertToModelMessages` first before passing the messages to functions like `generateText` or `streamText`. For more details on `providerOptions` usage, see [here](https://ai-sdk.dev/docs/foundations/prompts#provider-options).

### [Bash Tool](#bash-tool)

The Bash Tool allows running bash commands. Here's how to create and use it:

```
1const bashTool = anthropic.tools.bash_20250124({2 execute: async ({ command, restart }) => {3 // Implement your bash command execution logic here4 // Return the result of the command execution5 },6});
```

Parameters:

* `command` (string): The bash command to run. Required unless the tool is being restarted.
* `restart` (boolean, optional): Specifying true will restart this tool.

Two versions are available: `bash_20250124` (recommended) and `bash_20241022`. Only certain Claude versions are supported.

### [Memory Tool](#memory-tool)

The [Memory Tool](https://docs.claude.com/en/docs/agents-and-tools/tool-use/memory-tool) allows Claude to use a local memory, e.g. in the filesystem. Here's how to create it:

```
1const memory = anthropic.tools.memory_20250818({2 execute: async action => {3 // Implement your memory command execution logic here4 // Return the result of the command execution5 },6});
```

Only certain Claude versions are supported.

### [Text Editor Tool](#text-editor-tool)

The Text Editor Tool provides functionality for viewing and editing text files.

```
1const tools = {2 str_replace_based_edit_tool: anthropic.tools.textEditor_20250728({3 maxCharacters: 10000, // optional4 async execute({ command, path, old_str, new_str, insert_text }) {5 //...6 },7 }),8} satisfies ToolSet;
```

Different models support different versions of the tool:

* `textEditor_20250728` - For Claude Sonnet 4, Opus 4, and Opus 4.1 (recommended)
* `textEditor_20250124` - For Claude Sonnet 3.7
* `textEditor_20241022` - For Claude Sonnet 3.5

Note: `textEditor_20250429` is deprecated. Use `textEditor_20250728` instead.

Parameters:

* `command` ('view' | 'create' | 'str\_replace' | 'insert' | 'undo\_edit'): The command to run. Note: `undo_edit` is only available in Claude 3.5 Sonnet and earlier models.
* `path` (string): Absolute path to file or directory, e.g. `/repo/file.py` or `/repo`.
* `file_text` (string, optional): Required for `create` command, with the content of the file to be created.
* `insert_line` (number, optional): Required for `insert` command. The line number after which to insert the new string.
* `new_str` (string, optional): New string for `str_replace` command.
* `insert_text` (string, optional): Required for `insert` command, containing the text to insert.
* `old_str` (string, optional): Required for `str_replace` command, containing the string to replace.
* `view_range` (number\[\], optional): Optional for `view` command to specify line range to show.

### [Computer Tool](#computer-tool)

The Computer Tool enables control of keyboard and mouse actions on a computer:

```
1const computerTool = anthropic.tools.computer_20251124({2 displayWidthPx: 1920,3 displayHeightPx: 1080,4 displayNumber: 0, // Optional, for X11 environments5 enableZoom: true, // Optional, enables the zoom action6
7 execute: async ({ action, coordinate, text, region }) => {8 // Implement your computer control logic here9 // Return the result of the action10
11 // Example code:12 switch (action) {13 case 'screenshot': {14 // multipart result:15 return {16 type: 'image',17 data: fs18.readFileSync('./data/screenshot-editor.png')19.toString('base64'),20 };21 }22 case 'zoom': {23 // region is [x1, y1, x2, y2] defining the area to zoom into24 return {25 type: 'image',26 data: fs.readFileSync('./data/zoomed-region.png').toString('base64'),27 };28 }29 default: {30 console.log('Action:', action);31 console.log('Coordinate:', coordinate);32 console.log('Text:', text);33 return `executed ${action}`;34 }35 }36 },37
38 // map to tool result content for LLM consumption:39 toModelOutput({ output }) {40 return typeof output === 'string'41 ? [{ type: 'text', text: output }]42 : [{ type: 'image', data: output.data, mediaType: 'image/png' }];43 },44});
```

Use `computer_20251124` for Claude Opus 4.5 which supports the zoom action. Use `computer_20250124` for Claude Sonnet 4.5, Haiku 4.5, Opus 4.1, Sonnet 4, Opus 4, and Sonnet 3.7.

Parameters:

* `action` ('key' | 'type' | 'mouse\_move' | 'left\_click' | 'left\_click\_drag' | 'right\_click' | 'middle\_click' | 'double\_click' | 'screenshot' | 'cursor\_position' | 'zoom'): The action to perform. The `zoom` action is only available with `computer_20251124`.
* `coordinate` (number\[\], optional): Required for `mouse_move` and `left_click_drag` actions. Specifies the (x, y) coordinates.
* `text` (string, optional): Required for `type` and `key` actions.
* `region` (number\[\], optional): Required for `zoom` action. Specifies `[x1, y1, x2, y2]` coordinates for the area to inspect.
* `displayWidthPx` (number): The width of the display in pixels.
* `displayHeightPx` (number): The height of the display in pixels.
* `displayNumber` (number, optional): The display number for X11 environments.
* `enableZoom` (boolean, optional): Enable the zoom action. Only available with `computer_20251124`. Default: `false`.

### [Web Search Tool](#web-search-tool)

Anthropic provides a provider-defined web search tool that gives Claude direct access to real-time web content, allowing it to answer questions with up-to-date information beyond its knowledge cutoff.

You can enable web search using the provider-defined web search tool:

```
1import { anthropic } from '@ai-sdk/anthropic';2import { generateText } from 'ai';3
4const webSearchTool = anthropic.tools.webSearch_20250305({5 maxUses: 5,6});7
8const result = await generateText({9 model: anthropic('claude-opus-4-20250514'),10 prompt: 'What are the latest developments in AI?',11 tools: {12 web_search: webSearchTool,13 },14});
```

#### [Configuration Options](#configuration-options)

The web search tool supports several configuration options:

* **maxUses** _number_
 
 Maximum number of web searches Claude can perform during the conversation.
 
* **allowedDomains** _string\[\]_
 
 Optional list of domains that Claude is allowed to search. If provided, searches will be restricted to these domains.
 
* **blockedDomains** _string\[\]_
 
 Optional list of domains that Claude should avoid when searching.
 
* **userLocation** _object_
 
 Optional user location information to provide geographically relevant search results.
 

```
1const webSearchTool = anthropic.tools.webSearch_20250305({2 maxUses: 3,3 allowedDomains: ['techcrunch.com', 'wired.com'],4 blockedDomains: ['example-spam-site.com'],5 userLocation: {6 type: 'approximate',7 country: 'US',8 region: 'California',9 city: 'San Francisco',10 timezone: 'America/Los_Angeles',11 },12});13
14const result = await generateText({15 model: anthropic('claude-opus-4-20250514'),16 prompt: 'Find local news about technology',17 tools: {18 web_search: webSearchTool,19 },20});
```

### [Web Fetch Tool](#web-fetch-tool)

Anthropic provides a provider-defined web fetch tool that allows Claude to retrieve content from specific URLs. This is useful when you want Claude to analyze or reference content from a particular webpage or document.

You can enable web fetch using the provider-defined web fetch tool:

```
1import { anthropic } from '@ai-sdk/anthropic';2import { generateText } from 'ai';3
4const result = await generateText({5 model: anthropic('claude-sonnet-4-0'),6 prompt:7 'What is this page about? https://en.wikipedia.org/wiki/Maglemosian_culture',8 tools: {9 web_fetch: anthropic.tools.webFetch_20250910({ maxUses: 1 }),10 },11});
```

### [Tool Search](#tool-search)

Anthropic provides provider-defined tool search tools that enable Claude to work with hundreds or thousands of tools by dynamically discovering and loading them on-demand. Instead of loading all tool definitions into the context window upfront, Claude searches your tool catalog and loads only the tools it needs.

There are two variants:

* **BM25 Search** - Uses natural language queries to find tools
* **Regex Search** - Uses regex patterns (Python `re.search()` syntax) to find tools

#### [Basic Usage](#basic-usage)

```
1import { anthropic } from '@ai-sdk/anthropic';2import { generateText, tool } from 'ai';3import { z } from 'zod';4
5const result = await generateText({6 model: anthropic('claude-sonnet-4-5'),7 prompt: 'What is the weather in San Francisco?',8 tools: {9 toolSearch: anthropic.tools.toolSearchBm25_20251119(),10
11 get_weather: tool({12 description: 'Get the current weather at a specific location',13 inputSchema: z.object({14 location: z.string().describe('The city and state'),15 }),16 execute: async ({ location }) => ({17 location,18 temperature: 72,19 condition: 'Sunny',20 }),21 // Defer tool here - Claude discovers these via the tool search tool22 providerOptions: {23 anthropic: { deferLoading: true },24 },25 }),26 },27});
```

#### [Using Regex Search](#using-regex-search)

For more precise tool matching, you can use the regex variant:

```
1const result = await generateText({2 model: anthropic('claude-sonnet-4-5'),3 prompt: 'Get the weather data',4 tools: {5 toolSearch: anthropic.tools.toolSearchRegex_20251119(),6 //... deferred tools7 },8});
```

Claude will construct regex patterns like `weather|temperature|forecast` to find matching tools.

#### [Custom Tool Search](#custom-tool-search)

You can implement your own tool search logic (e.g., using embeddings or semantic search) by returning `tool-reference` content blocks via `toModelOutput`:

```
1import { anthropic } from '@ai-sdk/anthropic';2import { generateText, tool } from 'ai';3import { z } from 'zod';4
5const result = await generateText({6 model: anthropic('claude-sonnet-4-5'),7 prompt: 'What is the weather in San Francisco?',8 tools: {9 // Custom search tool10 searchTools: tool({11 description: 'Search for tools by keyword',12 inputSchema: z.object({ query: z.string() }),13 execute: async ({ query }) => {14 // Your custom search logic (embeddings, fuzzy match, etc.)15 const allTools = ['get_weather', 'get_forecast', 'get_temperature'];16 return allTools.filter(name => name.includes(query.toLowerCase()));17 },18 toModelOutput: ({ output }) => ({19 type: 'content',20 value: (output as string[]).map(toolName => ({21 type: 'custom' as const,22 providerOptions: {23 anthropic: {24 type: 'tool-reference',25 toolName,26 },27 },28 })),29 }),30 }),31
32 // Deferred tools33 get_weather: tool({34 description: 'Get the current weather',35 inputSchema: z.object({ location: z.string() }),36 execute: async ({ location }) => ({ location, temperature: 72 }),37 providerOptions: {38 anthropic: { deferLoading: true },39 },40 }),41 },42});
```

This sends `tool_reference` blocks to Anthropic, which loads the corresponding deferred tool schemas into Claude's context.

### [MCP Connectors](#mcp-connectors)

Anthropic supports connecting to [MCP servers](https://docs.claude.com/en/docs/agents-and-tools/mcp-connector) as part of their execution.

You can enable this feature with the `mcpServers` provider option:

```
1import { anthropic, AnthropicLanguageModelOptions } from '@ai-sdk/anthropic';2import { generateText } from 'ai';3
4const result = await generateText({5 model: anthropic('claude-sonnet-4-5'),6 prompt: `Call the echo tool with "hello world". what does it respond with back?`,7 providerOptions: {8 anthropic: {9 mcpServers: [10 {11 type: 'url',12 name: 'echo',13 url: 'https://echo.mcp.inevitable.fyi/mcp',14 // optional: authorization token15 authorizationToken: mcpAuthToken,16 // optional: tool configuration17 toolConfiguration: {18 enabled: true,19 allowedTools: ['echo'],20 },21 },22 ],23 } satisfies AnthropicLanguageModelOptions,24 },25});
```

The tool calls and results are dynamic, i.e. the input and output schemas are not known.

#### [Configuration Options](#configuration-options-1)

The web fetch tool supports several configuration options:

* **maxUses** _number_
 
 The maxUses parameter limits the number of web fetches performed.
 
* **allowedDomains** _string\[\]_
 
 Only fetch from these domains.
 
* **blockedDomains** _string\[\]_
 
 Never fetch from these domains.
 
* **citations** _object_
 
 Unlike web search where citations are always enabled, citations are optional for web fetch. Set `"citations": {"enabled": true}` to enable Claude to cite specific passages from fetched documents.
 
* **maxContentTokens** _number_
 
 The maxContentTokens parameter limits the amount of content that will be included in the context.
 

#### [Error Handling](#error-handling)

Web search errors are handled differently depending on whether you're using streaming or non-streaming:

**Non-streaming (`generateText`):** Web search errors throw exceptions that you can catch:

```
1try {2 const result = await generateText({3 model: anthropic('claude-opus-4-20250514'),4 prompt: 'Search for something',5 tools: {6 web_search: webSearchTool,7 },8 });9} catch (error) {10 if (error.message.includes('Web search failed')) {11 console.log('Search error:', error.message);12 // Handle search error appropriately13 }14}
```

**Streaming (`streamText`):** Web search errors are delivered as error parts in the stream:

```
1const result = await streamText({2 model: anthropic('claude-opus-4-20250514'),3 prompt: 'Search for something',4 tools: {5 web_search: webSearchTool,6 },7});8
9for await (const part of result.textStream) {10 if (part.type === 'error') {11 console.log('Search error:', part.error);12 // Handle search error appropriately13 }14}
```

## [Code Execution](#code-execution)

Anthropic provides a provider-defined code execution tool that gives Claude direct access to a real Python environment allowing it to execute code to inform its responses.

You can enable code execution using the provider-defined code execution tool:

```
1import { anthropic } from '@ai-sdk/anthropic';2import { generateText } from 'ai';3
4const codeExecutionTool = anthropic.tools.codeExecution_20260120();5
6const result = await generateText({7 model: anthropic('claude-opus-4-20250514'),8 prompt:9 'Calculate the mean and standard deviation of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]',10 tools: {11 code_execution: codeExecutionTool,12 },13});
```

Three versions are available: `codeExecution_20260120` (recommended, does not require a beta header, supports Claude Opus 4.6, Sonnet 4.6, Sonnet 4.5, and Opus 4.5), `codeExecution_20250825` (supports Python and Bash with enhanced file operations), and `codeExecution_20250522` (supports Bash only).

#### [Error Handling](#error-handling-1)

Code execution errors are handled differently depending on whether you're using streaming or non-streaming:

**Non-streaming (`generateText`):** Code execution errors are delivered as tool result parts in the response:

```
1const result = await generateText({2 model: anthropic('claude-opus-4-20250514'),3 prompt: 'Execute some Python script',4 tools: {5 code_execution: codeExecutionTool,6 },7});8
9const toolErrors = result.content?.filter(10 content => content.type === 'tool-error',11);12
13toolErrors?.forEach(error => {14 console.error('Tool execution error:', {15 toolName: error.toolName,16 toolCallId: error.toolCallId,17 error: error.error,18 });19});
```

**Streaming (`streamText`):** Code execution errors are delivered as error parts in the stream:

```
1const result = await streamText({2 model: anthropic('claude-opus-4-20250514'),3 prompt: 'Execute some Python script',4 tools: {5 code_execution: codeExecutionTool,6 },7});8for await (const part of result.textStream) {9 if (part.type === 'error') {10 console.log('Code execution error:', part.error);11 // Handle code execution error appropriately12 }13}
```

### [Programmatic Tool Calling](#programmatic-tool-calling)

[Programmatic Tool Calling](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/programmatic-tool-calling) allows Claude to write code that calls your tools programmatically within a code execution container, rather than requiring round trips through the model for each tool invocation. This reduces latency for multi-tool workflows and decreases token consumption.

To enable programmatic tool calling, use the `allowedCallers` provider option on tools that you want to be callable from within code execution:

```
1import {2 anthropic,3 forwardAnthropicContainerIdFromLastStep,4} from '@ai-sdk/anthropic';5import { generateText, tool, stepCountIs } from 'ai';6import { z } from 'zod';7
8const result = await generateText({9 model: anthropic('claude-sonnet-4-5'),10 stopWhen: stepCountIs(10),11 prompt:12 'Get the weather for Tokyo, Sydney, and London, then calculate the average temperature.',13 tools: {14 code_execution: anthropic.tools.codeExecution_20260120(),15
16 getWeather: tool({17 description: 'Get current weather data for a city.',18 inputSchema: z.object({19 city: z.string().describe('Name of the city'),20 }),21 execute: async ({ city }) => {22 // Your weather API implementation23 return { temp: 22, condition: 'Sunny' };24 },25 // Enable this tool to be called from within code execution26 providerOptions: {27 anthropic: {28 allowedCallers: ['code_execution_20260120'],29 },30 },31 }),32 },33
34 // Propagate container ID between steps for code execution continuity35 prepareStep: forwardAnthropicContainerIdFromLastStep,36});
```

In this flow:

1. Claude writes Python code that calls your `getWeather` tool multiple times in parallel
2. The SDK automatically executes your tool and returns results to the code execution container
3. Claude processes the results in code and generates the final response

Programmatic tool calling requires `claude-sonnet-4-6`, `claude-sonnet-4-5`, `claude-opus-4-6`, or `claude-opus-4-5` models and uses the `code_execution_20260120` or `code_execution_20250825` tool.

#### [Container Persistence](#container-persistence)

When using programmatic tool calling across multiple steps, you need to preserve the container ID between steps using `prepareStep`. You can use the `forwardAnthropicContainerIdFromLastStep` helper function to do this automatically. The container ID is available in `providerMetadata.anthropic.container.id` after each step completes.

## [Agent Skills](#agent-skills)

[Anthropic Agent Skills](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview) enable Claude to perform specialized tasks like document processing (PPTX, DOCX, PDF, XLSX) and data analysis. Skills run in a sandboxed container and require the code execution tool to be enabled.

### [Using Built-in Skills](#using-built-in-skills)

Anthropic provides several built-in skills:

* **pptx** - Create and edit PowerPoint presentations
* **docx** - Create and edit Word documents
* **pdf** - Process and analyze PDF files
* **xlsx** - Work with Excel spreadsheets

To use skills, you need to:

1. Enable the code execution tool
2. Specify the container with skills in `providerOptions`

```
1import { anthropic, AnthropicLanguageModelOptions } from '@ai-sdk/anthropic';2import { generateText } from 'ai';3
4const result = await generateText({5 model: anthropic('claude-sonnet-4-5'),6 tools: {7 code_execution: anthropic.tools.codeExecution_20260120(),8 },9 prompt: 'Create a presentation about renewable energy with 5 slides',10 providerOptions: {11 anthropic: {12 container: {13 skills: [14 {15 type: 'anthropic',16 skillId: 'pptx',17 version: 'latest', // optional18 },19 ],20 },21 } satisfies AnthropicLanguageModelOptions,22 },23});
```

### [Custom Skills](#custom-skills)

You can also use custom skills by specifying `type: 'custom'`:

```
1const result = await generateText({2 model: anthropic('claude-sonnet-4-5'),3 tools: {4 code_execution: anthropic.tools.codeExecution_20260120(),5 },6 prompt: 'Use my custom skill to process this data',7 providerOptions: {8 anthropic: {9 container: {10 skills: [11 {12 type: 'custom',13 skillId: 'my-custom-skill-id',14 version: '1.0', // optional15 },16 ],17 },18 } satisfies AnthropicLanguageModelOptions,19 },20});
```

Skills use progressive context loading and execute within a sandboxed container with code execution capabilities.

### [PDF support](#pdf-support)

Anthropic Claude models support reading PDF files. You can pass PDF files as part of the message content using the `file` type:

Option 1: URL-based PDF document

```
1const result = await generateText({2 model: anthropic('claude-sonnet-4-5'),3 messages: [4 {5 role: 'user',6 content: [7 {8 type: 'text',9 text: 'What is an embedding model according to this document?',10 },11 {12 type: 'file',13 data: new URL(14 'https://github.com/vercel/ai/blob/main/examples/ai-functions/data/ai.pdf?raw=true',15 ),16 mimeType: 'application/pdf',17 },18 ],19 },20 ],21});
```

Option 2: Base64-encoded PDF document

```
1const result = await generateText({2 model: anthropic('claude-sonnet-4-5'),3 messages: [4 {5 role: 'user',6 content: [7 {8 type: 'text',9 text: 'What is an embedding model according to this document?',10 },11 {12 type: 'file',13 data: fs.readFileSync('./data/ai.pdf'),14 mediaType: 'application/pdf',15 },16 ],17 },18 ],19});
```

The model will have access to the contents of the PDF file and respond to questions about it. The PDF file should be passed using the `data` field, and the `mediaType` should be set to `'application/pdf'`.

### [Model Capabilities](#model-capabilities)

| Model | Image Input | Object Generation | Tool Usage | Computer Use | Web Search | Tool Search | Compaction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `claude-opus-4-6` | | | | | | | |
| `claude-sonnet-4-6` | | | | | | | |
| `claude-opus-4-5` | | | | | | | |
| `claude-haiku-4-5` | | | | | | | |
| `claude-sonnet-4-5` | | | | | | | |
| `claude-opus-4-1` | | | | | | | |
| `claude-opus-4-0` | | | | | | | |
| `claude-sonnet-4-0` | | | | | | | |

The table above lists popular models. Please see the [Anthropic docs](https://docs.anthropic.com/en/docs/about-claude/models) for a full list of available models. The table above lists popular models. You can also pass any available provider model ID as a string if needed.

---
url: https://ai-sdk.dev/providers/ai-sdk-providers/open-responses
title: "AI SDK Providers: Open Responses"
description: "Learn how to use the Open Responses provider for the AI SDK."
hash: "2ed481daa41009db34fa0c4fe221ba78164e0ff845b9b9803ff77060853976fd"
crawledAt: 2026-03-07T08:04:34.816Z
depth: 2
---

## [Open Responses Provider](#open-responses-provider)

The [Open Responses](https://www.openresponses.org/) provider contains language model support for Open Responses compatible APIs.

## [Setup](#setup)

The Open Responses provider is available in the `@ai-sdk/open-responses` module. You can install it with

pnpm add @ai-sdk/open-responses

## [Provider Instance](#provider-instance)

Create an Open Responses provider instance using `createOpenResponses`:

```
1import { createOpenResponses } from '@ai-sdk/open-responses';2
3const openResponses = createOpenResponses({4 name: 'aProvider',5 url: 'http://localhost:1234/v1/responses',6});
```

The `name` and `url` options are required:

* **name** _string_
 
 Provider name. Used as the key for provider options and metadata.
 
* **url** _string_
 
 URL for the Open Responses API POST endpoint.
 

You can use the following optional settings to customize the Open Responses provider instance:

* **apiKey** _string_
 
 API key that is being sent using the `Authorization` header.
 
* **headers** _Record<string,string>_
 
 Custom headers to include in the requests.
 
* **fetch** _(input: RequestInfo, init?: RequestInit) => Promise<Response>_
 
 Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation. Defaults to the global `fetch` function.
 

## [Language Models](#language-models)

The Open Responses provider instance is a function that you can invoke to create a language model:

```
1const model = openResponses('mistralai/ministral-3-14b-reasoning');
```

You can use Open Responses models with the `generateText` and `streamText` functions, and they support structured data generation with [`Output`](https://ai-sdk.dev/docs/reference/ai-sdk-core/output) (see [AI SDK Core](https://ai-sdk.dev/docs/ai-sdk-core)).

### [Example](#example)

```
1import { createOpenResponses } from '@ai-sdk/open-responses';2import { generateText } from 'ai';3
4const openResponses = createOpenResponses({5 name: 'aProvider',6 url: 'http://localhost:1234/v1/responses',7});8
9const { text } = await generateText({10 model: openResponses('mistralai/ministral-3-14b-reasoning'),11 prompt: 'Invent a new holiday and describe its traditions.',12});
```

## [Notes](#notes)

* Stop sequences, `topK`, and `seed` are not supported and are ignored with warnings.
* Image inputs are supported for user messages with `file` parts using image media types.

---
url: https://ai-sdk.dev/providers/ai-sdk-providers/amazon-bedrock
title: "AI SDK Providers: Amazon Bedrock"
description: "Learn how to use the Amazon Bedrock provider."
hash: "6d5a9193dfdbf447aa040c9e8c3a4d5e1fbc2dbb76297b56e52abd3420b53556"
crawledAt: 2026-03-07T08:04:41.672Z
depth: 2
---

## [Amazon Bedrock Provider](#amazon-bedrock-provider)

The Amazon Bedrock provider for the [AI SDK](https://ai-sdk.dev/docs) contains language model support for the [Amazon Bedrock](https://aws.amazon.com/bedrock) APIs.

## [Setup](#setup)

The Bedrock provider is available in the `@ai-sdk/amazon-bedrock` module. You can install it with

pnpm add @ai-sdk/amazon-bedrock

### [Prerequisites](#prerequisites)

Access to Amazon Bedrock foundation models isn't granted by default. In order to gain access to a foundation model, an IAM user with sufficient permissions needs to request access to it through the console. Once access is provided to a model, it is available for all users in the account.

See the [Model Access Docs](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html) for more information.

### [Authentication](#authentication)

#### [Using IAM Access Key and Secret Key](#using-iam-access-key-and-secret-key)

**Step 1: Creating AWS Access Key and Secret Key**

To get started, you'll need to create an AWS access key and secret key. Here's how:

**Login to AWS Management Console**

* Go to the [AWS Management Console](https://console.aws.amazon.com/) and log in with your AWS account credentials.

**Create an IAM User**

* Navigate to the [IAM dashboard](https://console.aws.amazon.com/iam/home) and click on "Users" in the left-hand navigation menu.
* Click on "Create user" and fill in the required details to create a new IAM user.
* Make sure to select "Programmatic access" as the access type.
* The user account needs the `AmazonBedrockFullAccess` policy attached to it.

**Create Access Key**

* Click on the "Security credentials" tab and then click on "Create access key".
* Click "Create access key" to generate a new access key pair.
* Download the `.csv` file containing the access key ID and secret access key.

**Step 2: Configuring the Access Key and Secret Key**

Within your project add a `.env` file if you don't already have one. This file will be used to set the access key and secret key as environment variables. Add the following lines to the `.env` file:

```
1AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID2AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY3AWS_REGION=YOUR_REGION
```

Many frameworks such as [Next.js](https://nextjs.org/) load the `.env` file automatically. If you're using a different framework, you may need to load the `.env` file manually using a package like [`dotenv`](https://github.com/motdotla/dotenv).

Remember to replace `YOUR_ACCESS_KEY_ID`, `YOUR_SECRET_ACCESS_KEY`, and `YOUR_REGION` with the actual values from your AWS account.

#### [Using AWS SDK Credentials Chain (instance profiles, instance roles, ECS roles, EKS Service Accounts, etc.)](#using-aws-sdk-credentials-chain-instance-profiles-instance-roles-ecs-roles-eks-service-accounts-etc)

When using AWS SDK, the SDK will automatically use the credentials chain to determine the credentials to use. This includes instance profiles, instance roles, ECS roles, EKS Service Accounts, etc. A similar behavior is possible using the AI SDK by not specifying the `accessKeyId` and `secretAccessKey`, `sessionToken` properties in the provider settings and instead passing a `credentialProvider` property.

_Usage:_

`@aws-sdk/credential-providers` package provides a set of credential providers that can be used to create a credential provider chain.

pnpm add @aws-sdk/credential-providers

```
1import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';2import { fromNodeProviderChain } from '@aws-sdk/credential-providers';3
4const bedrock = createAmazonBedrock({5 region: 'us-east-1',6 credentialProvider: fromNodeProviderChain(),7});
```

## [Provider Instance](#provider-instance)

You can import the default provider instance `bedrock` from `@ai-sdk/amazon-bedrock`:

```
1import { bedrock } from '@ai-sdk/amazon-bedrock';
```

If you need a customized setup, you can import `createAmazonBedrock` from `@ai-sdk/amazon-bedrock` and create a provider instance with your settings:

```
1import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';2
3const bedrock = createAmazonBedrock({4 region: 'us-east-1',5 accessKeyId: 'xxxxxxxxx',6 secretAccessKey: 'xxxxxxxxx',7 sessionToken: 'xxxxxxxxx',8});
```

The credentials settings fall back to environment variable defaults described below. These may be set by your serverless environment without your awareness, which can lead to merged/conflicting credential values and provider errors around failed authentication. If you're experiencing issues be sure you are explicitly specifying all settings (even if `undefined`) to avoid any defaults.

You can use the following optional settings to customize the Amazon Bedrock provider instance:

* **region** _string_
 
 The AWS region that you want to use for the API calls. It uses the `AWS_REGION` environment variable by default.
 
* **accessKeyId** _string_
 
 The AWS access key ID that you want to use for the API calls. It uses the `AWS_ACCESS_KEY_ID` environment variable by default.
 
* **secretAccessKey** _string_
 
 The AWS secret access key that you want to use for the API calls. It uses the `AWS_SECRET_ACCESS_KEY` environment variable by default.
 
* **sessionToken** _string_
 
 Optional. The AWS session token that you want to use for the API calls. It uses the `AWS_SESSION_TOKEN` environment variable by default.
 
* **credentialProvider** _() => Promise<{ accessKeyId: string; secretAccessKey: string; sessionToken?: string; }>_
 
 Optional. The AWS credential provider chain that you want to use for the API calls. It uses the specified credentials by default.
 
* **apiKey** _string_
 
 Optional. API key for authenticating requests using Bearer token authentication. When provided, this will be used instead of AWS SigV4 authentication. It uses the `AWS_BEARER_TOKEN_BEDROCK` environment variable by default.
 
* **baseURL** _string_
 
 Optional. Base URL for the Bedrock API calls. Useful for custom endpoints or proxy configurations.
 
* **headers** _Record<string, string>_
 
 Optional. Custom headers to include in the requests.
 
* **fetch** _(input: RequestInfo, init?: RequestInit) => Promise<Response>_
 
 Optional. Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation. You can use it as a middleware to intercept requests, or to provide a custom fetch implementation for e.g. testing.
 

## [Language Models](#language-models)

You can create models that call the Bedrock API using the provider instance. The first argument is the model id, e.g. `meta.llama3-70b-instruct-v1:0`.

```
1const model = bedrock('meta.llama3-70b-instruct-v1:0');
```

Amazon Bedrock models also support some model specific provider options that are not part of the [standard call settings](https://ai-sdk.dev/docs/ai-sdk-core/settings). You can pass them in the `providerOptions` argument:

```
1const model = bedrock('anthropic.claude-3-sonnet-20240229-v1:0');2
3await generateText({4 model,5 providerOptions: {6 anthropic: {7 additionalModelRequestFields: { top_k: 350 },8 },9 },10});
```

Documentation for additional settings based on the selected model can be found within the [Amazon Bedrock Inference Parameter Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters.html).

You can use Amazon Bedrock language models to generate text with the `generateText` function:

```
1import { bedrock } from '@ai-sdk/amazon-bedrock';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: bedrock('meta.llama3-70b-instruct-v1:0'),6 prompt: 'Write a vegetarian lasagna recipe for 4 people.',7});
```

Amazon Bedrock language models can also be used in the `streamText` function (see [AI SDK Core](https://ai-sdk.dev/docs/ai-sdk-core)).

### [File Inputs](#file-inputs)

Amazon Bedrock supports file inputs in combination with specific models, e.g. `anthropic.claude-3-haiku-20240307-v1:0`.

The Amazon Bedrock provider supports file inputs, e.g. PDF files.

```
1import { bedrock } from '@ai-sdk/amazon-bedrock';2import { generateText } from 'ai';3
4const result = await generateText({5 model: bedrock('anthropic.claude-3-haiku-20240307-v1:0'),6 messages: [7 {8 role: 'user',9 content: [10 { type: 'text', text: 'Describe the pdf in detail.' },11 {12 type: 'file',13 data: readFileSync('./data/ai.pdf'),14 mediaType: 'application/pdf',15 },16 ],17 },18 ],19});
```

### [Guardrails](#guardrails)

You can use the `bedrock` provider options to utilize [Amazon Bedrock Guardrails](https://aws.amazon.com/bedrock/guardrails/):

```
1import { type AmazonBedrockLanguageModelOptions } from '@ai-sdk/amazon-bedrock';2
3const result = await generateText({4 model: bedrock('anthropic.claude-3-sonnet-20240229-v1:0'),5 prompt: 'Write a story about space exploration.',6 providerOptions: {7 bedrock: {8 guardrailConfig: {9 guardrailIdentifier: '1abcd2ef34gh',10 guardrailVersion: '1',11 trace: 'enabled' as const,12 streamProcessingMode: 'async',13 },14 } satisfies AmazonBedrockLanguageModelOptions,15 },16});
```

Tracing information will be returned in the provider metadata if you have tracing enabled.

```
1if (result.providerMetadata?.bedrock.trace) {2 //...3}
```

See the [Amazon Bedrock Guardrails documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html) for more information.

### [Citations](#citations)

Amazon Bedrock supports citations for document-based inputs across compatible models. When enabled:

* Some models can read documents with visual understanding, not just extracting text
* Models can cite specific parts of documents you provide, making it easier to trace information back to its source (Not Supported Yet)

```
1import { bedrock } from '@ai-sdk/amazon-bedrock';2import { generateText, Output } from 'ai';3import { z } from 'zod';4import fs from 'fs';5
6const result = await generateText({7 model: bedrock('apac.anthropic.claude-sonnet-4-20250514-v1:0'),8 output: Output.object({9 schema: z.object({10 summary: z.string().describe('Summary of the PDF document'),11 keyPoints: z.array(z.string()).describe('Key points from the PDF'),12 }),13 }),14 messages: [15 {16 role: 'user',17 content: [18 {19 type: 'text',20 text: 'Summarize this PDF and provide key points.',21 },22 {23 type: 'file',24 data: readFileSync('./document.pdf'),25 mediaType: 'application/pdf',26 providerOptions: {27 bedrock: {28 citations: { enabled: true },29 },30 },31 },32 ],33 },34 ],35});36
37console.log('Response:', result.output);
```

### [Cache Points](#cache-points)

In messages, you can use the `providerOptions` property to set cache points. Set the `bedrock` property in the `providerOptions` object to `{ cachePoint: { type: 'default' } }` to create a cache point.

You can also specify a TTL (time-to-live) for cache points using the `ttl` property. Supported values are `'5m'` (5 minutes, default) and `'1h'` (1 hour). The 1-hour TTL is only supported by Claude Opus 4.5, Claude Haiku 4.5, and Claude Sonnet 4.5.

```
1providerOptions: {2 bedrock: { cachePoint: { type: 'default', ttl: '1h' } },3}
```

When using multiple cache points with different TTLs, cache entries with longer TTL must appear before shorter TTLs (i.e., 1-hour cache entries must come before 5-minute cache entries).

Cache usage information is returned in the `providerMetadata` object. See examples below.

Cache points have model-specific token minimums and limits. For example, Claude 3.5 Sonnet v2 requires at least 1,024 tokens for a cache point and allows up to 4 cache points. See the [Amazon Bedrock prompt caching documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html) for details on supported models, regions, and limits.

```
1import { bedrock } from '@ai-sdk/amazon-bedrock';2import { generateText } from 'ai';3
4const cyberpunkAnalysis =5 '... literary analysis of cyberpunk themes and concepts...';6
7const result = await generateText({8 model: bedrock('anthropic.claude-3-5-sonnet-20241022-v2:0'),9 messages: [10 {11 role: 'system',12 content: `You are an expert on William Gibson's cyberpunk literature and themes. You have access to the following academic analysis: ${cyberpunkAnalysis}`,13 providerOptions: {14 bedrock: { cachePoint: { type: 'default' } },15 },16 },17 {18 role: 'user',19 content:20 'What are the key cyberpunk themes that Gibson explores in Neuromancer?',21 },22 ],23});24
25console.log(result.text);26console.log(result.providerMetadata?.bedrock?.usage);27// Shows cache read/write token usage, e.g.:28// {29// cacheReadInputTokens: 1337,30// cacheWriteInputTokens: 42,31// }
```

Cache points also work with streaming responses:

```
1import { bedrock } from '@ai-sdk/amazon-bedrock';2import { streamText } from 'ai';3
4const cyberpunkAnalysis =5 '... literary analysis of cyberpunk themes and concepts...';6
7const result = streamText({8 model: bedrock('anthropic.claude-3-5-sonnet-20241022-v2:0'),9 messages: [10 {11 role: 'assistant',12 content: [13 { type: 'text', text: 'You are an expert on cyberpunk literature.' },14 { type: 'text', text: `Academic analysis: ${cyberpunkAnalysis}` },15 ],16 providerOptions: { bedrock: { cachePoint: { type: 'default' } } },17 },18 {19 role: 'user',20 content:21 'How does Gibson explore the relationship between humanity and technology?',22 },23 ],24});25
26for await (const textPart of result.textStream) {27 process.stdout.write(textPart);28}29
30console.log(31 'Cache token usage:',32 (await result.providerMetadata)?.bedrock?.usage,33);34// Shows cache read/write token usage, e.g.:35// {36// cacheReadInputTokens: 1337,37// cacheWriteInputTokens: 42,38// }
```

### [Provider Metadata](#provider-metadata)

The following Bedrock-specific metadata may be returned in `providerMetadata.bedrock`:

* **trace** _(optional)_ Guardrail tracing information (when tracing is enabled).
* **performanceConfig** _(optional)_ Performance configuration, e.g. `{ latency: 'optimized' }`.
* **serviceTier** _(optional)_ Service tier information, e.g. `{ type: 'on-demand' }`.
* **usage** _(optional)_ Cache token usage details including `cacheWriteInputTokens` and `cacheDetails`.
* **stopSequence** _string | null_ The stop sequence that triggered the stop, if any.

## [Reasoning](#reasoning)

Amazon Bedrock supports model creator-specific reasoning features:

* Anthropic (e.g. `claude-sonnet-4-5-20250929`): enable via the `reasoningConfig` provider option and specifying a thinking budget in tokens (minimum: `1024`, maximum: `64000`).
* Amazon (e.g. `us.amazon.nova-2-lite-v1:0`): enable via the `reasoningConfig` provider option and specifying a maximum reasoning effort level (`'low' | 'medium' | 'high'`).

```
1import {2 bedrock,3 type AmazonBedrockLanguageModelOptions,4} from '@ai-sdk/amazon-bedrock';5import { generateText } from 'ai';6
7// Anthropic example8const anthropicResult = await generateText({9 model: bedrock('us.anthropic.claude-sonnet-4-5-20250929-v1:0'),10 prompt: 'How many people will live in the world in 2040?',11 providerOptions: {12 bedrock: {13 reasoningConfig: { type: 'enabled', budgetTokens: 1024 },14 } satisfies AmazonBedrockLanguageModelOptions,15 },16});17
18console.log(anthropicResult.reasoningText); // reasoning text19console.log(anthropicResult.text); // text response20
21// Nova 2 example22const amazonResult = await generateText({23 model: bedrock('us.amazon.nova-2-lite-v1:0'),24 prompt: 'How many people will live in the world in 2040?',25 providerOptions: {26 bedrock: {27 reasoningConfig: { type: 'enabled', maxReasoningEffort: 'medium' },28 } satisfies AmazonBedrockLanguageModelOptions,29 },30});31
32console.log(amazonResult.reasoningText); // reasoning text33console.log(amazonResult.text); // text response
```

See [AI SDK UI: Chatbot](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot#reasoning) for more details on how to integrate reasoning into your chatbot.

## [Extended Context Window](#extended-context-window)

Claude Sonnet 4 models on Amazon Bedrock support an extended context window of up to 1 million tokens when using the `context-1m-2025-08-07` beta feature.

```
1import {2 bedrock,3 type AmazonBedrockLanguageModelOptions,4} from '@ai-sdk/amazon-bedrock';5import { generateText } from 'ai';6
7const result = await generateText({8 model: bedrock('us.anthropic.claude-sonnet-4-20250514-v1:0'),9 prompt: 'analyze this large document...',10 providerOptions: {11 bedrock: {12 anthropicBeta: ['context-1m-2025-08-07'],13 } satisfies AmazonBedrockLanguageModelOptions,14 },15});
```

## [Computer Use](#computer-use)

Via Anthropic, Amazon Bedrock provides three provider-defined tools that can be used to interact with external systems:

1. **Bash Tool**: Allows running bash commands.
2. **Text Editor Tool**: Provides functionality for viewing and editing text files.
3. **Computer Tool**: Enables control of keyboard and mouse actions on a computer.

They are available via the `tools` property of the provider instance.

### [Bash Tool](#bash-tool)

The Bash Tool allows running bash commands. Here's how to create and use it:

```
1const bashTool = bedrock.tools.bash_20241022({2 execute: async ({ command, restart }) => {3 // Implement your bash command execution logic here4 // Return the result of the command execution5 },6});
```

Parameters:

* `command` (string): The bash command to run. Required unless the tool is being restarted.
* `restart` (boolean, optional): Specifying true will restart this tool.

### [Text Editor Tool](#text-editor-tool)

The Text Editor Tool provides functionality for viewing and editing text files.

**For Claude 4 models (Opus & Sonnet):**

```
1const textEditorTool = bedrock.tools.textEditor_20250429({2 execute: async ({3 command,4 path,5 file_text,6 insert_line,7 new_str,8 insert_text,9 old_str,10 view_range,11 }) => {12 // Implement your text editing logic here13 // Return the result of the text editing operation14 },15});
```

**For Claude 3.5 Sonnet and earlier models:**

```
1const textEditorTool = bedrock.tools.textEditor_20241022({2 execute: async ({3 command,4 path,5 file_text,6 insert_line,7 new_str,8 insert_text,9 old_str,10 view_range,11 }) => {12 // Implement your text editing logic here13 // Return the result of the text editing operation14 },15});
```

Parameters:

* `command` ('view' | 'create' | 'str\_replace' | 'insert' | 'undo\_edit'): The command to run. Note: `undo_edit` is only available in Claude 3.5 Sonnet and earlier models.
* `path` (string): Absolute path to file or directory, e.g. `/repo/file.py` or `/repo`.
* `file_text` (string, optional): Required for `create` command, with the content of the file to be created.
* `insert_line` (number, optional): Required for `insert` command. The line number after which to insert the new string.
* `new_str` (string, optional): New string for `str_replace` command.
* `insert_text` (string, optional): Required for `insert` command, containing the text to insert.
* `old_str` (string, optional): Required for `str_replace` command, containing the string to replace.
* `view_range` (number\[\], optional): Optional for `view` command to specify line range to show.

When using the Text Editor Tool, make sure to name the key in the tools object correctly:

* **Claude 4 models**: Use `str_replace_based_edit_tool`
* **Claude 3.5 Sonnet and earlier**: Use `str_replace_editor`

```
1// For Claude 4 models2const response = await generateText({3 model: bedrock('us.anthropic.claude-sonnet-4-20250514-v1:0'),4 prompt:5 "Create a new file called example.txt, write 'Hello World' to it, and run 'cat example.txt' in the terminal",6 tools: {7 str_replace_based_edit_tool: textEditorTool, // Claude 4 tool name8 },9});10
11// For Claude 3.5 Sonnet and earlier12const response = await generateText({13 model: bedrock('anthropic.claude-3-5-sonnet-20241022-v2:0'),14 prompt:15 "Create a new file called example.txt, write 'Hello World' to it, and run 'cat example.txt' in the terminal",16 tools: {17 str_replace_editor: textEditorTool, // Earlier models tool name18 },19});
```

### [Computer Tool](#computer-tool)

The Computer Tool enables control of keyboard and mouse actions on a computer:

```
1const computerTool = bedrock.tools.computer_20241022({2 displayWidthPx: 1920,3 displayHeightPx: 1080,4 displayNumber: 0, // Optional, for X11 environments5
6 execute: async ({ action, coordinate, text }) => {7 // Implement your computer control logic here8 // Return the result of the action9
10 // Example code:11 switch (action) {12 case 'screenshot': {13 // multipart result:14 return {15 type: 'image',16 data: fs17.readFileSync('./data/screenshot-editor.png')18.toString('base64'),19 };20 }21 default: {22 console.log('Action:', action);23 console.log('Coordinate:', coordinate);24 console.log('Text:', text);25 return `executed ${action}`;26 }27 }28 },29
30 // map to tool result content for LLM consumption:31 toModelOutput({ output }) {32 return typeof output === 'string'33 ? [{ type: 'text', text: output }]34 : [{ type: 'image', data: output.data, mediaType: 'image/png' }];35 },36});
```

Parameters:

* `action` ('key' | 'type' | 'mouse\_move' | 'left\_click' | 'left\_click\_drag' | 'right\_click' | 'middle\_click' | 'double\_click' | 'screenshot' | 'cursor\_position'): The action to perform.
* `coordinate` (number\[\], optional): Required for `mouse_move` and `left_click_drag` actions. Specifies the (x, y) coordinates.
* `text` (string, optional): Required for `type` and `key` actions.

These tools can be used in conjunction with the `anthropic.claude-3-5-sonnet-20240620-v1:0` model to enable more complex interactions and tasks.

### [Model Capabilities](#model-capabilities)

| Model | Image Input | Object Generation | Tool Usage | Tool Streaming |
| --- | --- | --- | --- | --- |
| `amazon.titan-tg1-large` | | | | |
| `amazon.titan-text-express-v1` | | | | |
| `amazon.titan-text-lite-v1` | | | | |
| `us.amazon.nova-premier-v1:0` | | | | |
| `us.amazon.nova-pro-v1:0` | | | | |
| `us.amazon.nova-lite-v1:0` | | | | |
| `us.amazon.nova-micro-v1:0` | | | | |
| `anthropic.claude-haiku-4-5-20251001-v1:0` | | | | |
| `anthropic.claude-sonnet-4-20250514-v1:0` | | | | |
| `anthropic.claude-sonnet-4-5-20250929-v1:0` | | | | |
| `anthropic.claude-opus-4-20250514-v1:0` | | | | |
| `anthropic.claude-opus-4-1-20250805-v1:0` | | | | |
| `anthropic.claude-3-5-sonnet-20241022-v2:0` | | | | |
| `anthropic.claude-3-5-sonnet-20240620-v1:0` | | | | |
| `anthropic.claude-3-opus-20240229-v1:0` | | | | |
| `anthropic.claude-3-sonnet-20240229-v1:0` | | | | |
| `anthropic.claude-3-haiku-20240307-v1:0` | | | | |
| `us.anthropic.claude-sonnet-4-20250514-v1:0` | | | | |
| `us.anthropic.claude-sonnet-4-5-20250929-v1:0` | | | | |
| `us.anthropic.claude-opus-4-20250514-v1:0` | | | | |
| `us.anthropic.claude-opus-4-1-20250805-v1:0` | | | | |
| `us.anthropic.claude-3-5-sonnet-20241022-v2:0` | | | | |
| `us.anthropic.claude-3-5-sonnet-20240620-v1:0` | | | | |
| `us.anthropic.claude-3-sonnet-20240229-v1:0` | | | | |
| `us.anthropic.claude-3-opus-20240229-v1:0` | | | | |
| `us.anthropic.claude-3-haiku-20240307-v1:0` | | | | |
| `anthropic.claude-v2` | | | | |
| `anthropic.claude-v2:1` | | | | |
| `anthropic.claude-instant-v1` | | | | |
| `cohere.command-text-v14` | | | | |
| `cohere.command-light-text-v14` | | | | |
| `cohere.command-r-v1:0` | | | | |
| `cohere.command-r-plus-v1:0` | | | | |
| `us.deepseek.r1-v1:0` | | | | |
| `meta.llama3-8b-instruct-v1:0` | | | | |
| `meta.llama3-70b-instruct-v1:0` | | | | |
| `meta.llama3-1-8b-instruct-v1:0` | | | | |
| `meta.llama3-1-70b-instruct-v1:0` | | | | |
| `meta.llama3-1-405b-instruct-v1:0` | | | | |
| `meta.llama3-2-1b-instruct-v1:0` | | | | |
| `meta.llama3-2-3b-instruct-v1:0` | | | | |
| `meta.llama3-2-11b-instruct-v1:0` | | | | |
| `meta.llama3-2-90b-instruct-v1:0` | | | | |
| `us.meta.llama3-2-1b-instruct-v1:0` | | | | |
| `us.meta.llama3-2-3b-instruct-v1:0` | | | | |
| `us.meta.llama3-2-11b-instruct-v1:0` | | | | |
| `us.meta.llama3-2-90b-instruct-v1:0` | | | | |
| `us.meta.llama3-1-8b-instruct-v1:0` | | | | |
| `us.meta.llama3-1-70b-instruct-v1:0` | | | | |
| `us.meta.llama3-3-70b-instruct-v1:0` | | | | |
| `us.meta.llama4-scout-17b-instruct-v1:0` | | | | |
| `us.meta.llama4-maverick-17b-instruct-v1:0` | | | | |
| `mistral.mistral-7b-instruct-v0:2` | | | | |
| `mistral.mixtral-8x7b-instruct-v0:1` | | | | |
| `mistral.mistral-large-2402-v1:0` | | | | |
| `mistral.mistral-small-2402-v1:0` | | | | |
| `us.mistral.pixtral-large-2502-v1:0` | | | | |
| `openai.gpt-oss-120b-1:0` | | | | |
| `openai.gpt-oss-20b-1:0` | | | | |

The table above lists popular models. Please see the [Amazon Bedrock docs](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference-supported-models-features.html) for a full list of available models. You can also pass any available provider model ID as a string if needed.

## [Embedding Models](#embedding-models)

You can create models that call the Bedrock API [Bedrock API](https://docs.aws.amazon.com/bedrock/latest/userguide/titan-embedding-models.html) using the `.embedding()` factory method.

```
1const model = bedrock.embedding('amazon.titan-embed-text-v1');
```

Bedrock Titan embedding model amazon.titan-embed-text-v2:0 supports several additional settings. You can pass them as an options argument:

```
1import { bedrock } from '@ai-sdk/amazon-bedrock';2import { type AmazonBedrockEmbeddingModelOptions } from '@ai-sdk/amazon-bedrock';3import { embed } from 'ai';4
5const model = bedrock.embedding('amazon.titan-embed-text-v2:0');6
7const { embedding } = await embed({8 model,9 value: 'sunny day at the beach',10 providerOptions: {11 bedrock: {12 dimensions: 512, // optional, number of dimensions for the embedding13 normalize: true, // optional, normalize the output embeddings14 } satisfies AmazonBedrockEmbeddingModelOptions,15 },16});
```

The following optional provider options are available for Bedrock Titan embedding models:

* **dimensions**: _number_
 
 The number of dimensions the output embeddings should have. The following values are accepted: 1024 (default), 512, 256.
 
* **normalize** _boolean_
 
 Flag indicating whether or not to normalize the output embeddings. Defaults to true.
 

### [Nova Embedding Models](#nova-embedding-models)

Amazon Nova embedding models support additional provider options:

```
1import { bedrock } from '@ai-sdk/amazon-bedrock';2import { type AmazonBedrockEmbeddingModelOptions } from '@ai-sdk/amazon-bedrock';3import { embed } from 'ai';4
5const { embedding } = await embed({6 model: bedrock.embedding('amazon.nova-embed-text-v2:0'),7 value: 'sunny day at the beach',8 providerOptions: {9 bedrock: {10 embeddingDimension: 1024, // optional, number of dimensions11 embeddingPurpose: 'TEXT_RETRIEVAL', // optional, purpose of embedding12 truncate: 'END', // optional, truncation behavior13 } satisfies AmazonBedrockEmbeddingModelOptions,14 },15});
```

The following optional provider options are available for Nova embedding models:

* **embeddingDimension** _number_
 
 The number of dimensions for the output embeddings. Supported values: 256, 384, 1024 (default), 3072.
 
* **embeddingPurpose** _string_
 
 The purpose of the embedding. Accepts: `GENERIC_INDEX` (default), `TEXT_RETRIEVAL`, `IMAGE_RETRIEVAL`, `VIDEO_RETRIEVAL`, `DOCUMENT_RETRIEVAL`, `AUDIO_RETRIEVAL`, `GENERIC_RETRIEVAL`, `CLASSIFICATION`, `CLUSTERING`.
 
* **truncate** _string_
 
 Truncation behavior when input exceeds the model's context length. Accepts: `NONE`, `START`, `END` (default).
 

### [Cohere Embedding Models](#cohere-embedding-models)

Cohere embedding models on Bedrock require an `inputType` and support truncation:

```
1import { bedrock } from '@ai-sdk/amazon-bedrock';2import { type AmazonBedrockEmbeddingModelOptions } from '@ai-sdk/amazon-bedrock';3import { embed } from 'ai';4
5const { embedding } = await embed({6 model: bedrock.embedding('cohere.embed-english-v3'),7 value: 'sunny day at the beach',8 providerOptions: {9 bedrock: {10 inputType: 'search_document', // required for Cohere11 truncate: 'END', // optional, truncation behavior12 } satisfies AmazonBedrockEmbeddingModelOptions,13 },14});
```

The following provider options are available for Cohere embedding models:

* **inputType** _string_
 
 Input type for Cohere embedding models. Accepts: `search_document`, `search_query` (default), `classification`, `clustering`.
 
* **truncate** _string_
 
 Truncation behavior when input exceeds the model's context length. Accepts: `NONE`, `START`, `END`.
 

### [Model Capabilities](#model-capabilities-1)

| Model | Default Dimensions | Custom Dimensions |
| --- | --- | --- |
| `amazon.titan-embed-text-v1` | 1536 | |
| `amazon.titan-embed-text-v2:0` | 1024 | |
| `amazon.nova-embed-text-v2:0` | 1024 | |
| `cohere.embed-english-v3` | 1024 | |
| `cohere.embed-multilingual-v3` | 1024 | |

## [Reranking Models](#reranking-models)

You can create models that call the [Bedrock Rerank API](https://docs.aws.amazon.com/bedrock/latest/userguide/rerank-api.html) using the `.reranking()` factory method.

```
1const model = bedrock.reranking('cohere.rerank-v3-5:0');
```

You can use Amazon Bedrock reranking models to rerank documents with the `rerank` function:

```
1import { bedrock } from '@ai-sdk/amazon-bedrock';2import { rerank } from 'ai';3
4const documents = [5 'sunny day at the beach',6 'rainy afternoon in the city',7 'snowy night in the mountains',8];9
10const { ranking } = await rerank({11 model: bedrock.reranking('cohere.rerank-v3-5:0'),12 documents,13 query: 'talk about rain',14 topN: 2,15});16
17console.log(ranking);18// [19// { originalIndex: 1, score: 0.9, document: 'rainy afternoon in the city' },20// { originalIndex: 0, score: 0.3, document: 'sunny day at the beach' }21// ]
```

Amazon Bedrock reranking models support additional provider options that can be passed via `providerOptions.bedrock`:

```
1import { bedrock } from '@ai-sdk/amazon-bedrock';2import { rerank } from 'ai';3
4const { ranking } = await rerank({5 model: bedrock.reranking('cohere.rerank-v3-5:0'),6 documents: ['sunny day at the beach', 'rainy afternoon in the city'],7 query: 'talk about rain',8 providerOptions: {9 bedrock: {10 nextToken: 'pagination_token_here',11 },12 },13});
```

The following provider options are available:

* **nextToken** _string_
 
 Token for pagination of results.
 
* **additionalModelRequestFields** _Record<string, unknown>_
 
 Additional model-specific request fields.
 

### [Model Capabilities](#model-capabilities-2)

| Model |
| --- |
| `amazon.rerank-v1:0` |
| `cohere.rerank-v3-5:0` |

## [Image Models](#image-models)

You can create models that call the Bedrock API [Bedrock API](https://docs.aws.amazon.com/nova/latest/userguide/image-generation.html) using the `.image()` factory method.

For more on the Amazon Nova Canvas image model, see the [Nova Canvas Overview](https://docs.aws.amazon.com/ai/responsible-ai/nova-canvas/overview.html).

The `amazon.nova-canvas-v1:0` model is available in the `us-east-1`, `eu-west-1`, and `ap-northeast-1` regions.

```
1const model = bedrock.image('amazon.nova-canvas-v1:0');
```

You can then generate images with the `generateImage` function:

```
1import { bedrock } from '@ai-sdk/amazon-bedrock';2import { generateImage } from 'ai';3
4const { image } = await generateImage({5 model: bedrock.image('amazon.nova-canvas-v1:0'),6 prompt: 'A beautiful sunset over a calm ocean',7 size: '512x512',8 seed: 42,9});
```

You can also pass the `providerOptions` object to the `generateImage` function to customize the generation behavior:

```
1import { bedrock } from '@ai-sdk/amazon-bedrock';2import { generateImage } from 'ai';3
4const { image } = await generateImage({5 model: bedrock.image('amazon.nova-canvas-v1:0'),6 prompt: 'A beautiful sunset over a calm ocean',7 size: '512x512',8 seed: 42,9 providerOptions: {10 bedrock: {11 quality: 'premium',12 negativeText: 'blurry, low quality',13 cfgScale: 7.5,14 style: 'PHOTOREALISM',15 },16 },17});
```

The following optional provider options are available for Amazon Nova Canvas:

* **quality** _string_
 
 The quality level for image generation. Accepts `'standard'` or `'premium'`.
 
* **negativeText** _string_
 
 Text describing what you don't want in the generated image.
 
* **cfgScale** _number_
 
 Controls how closely the generated image adheres to the prompt. Higher values result in images that are more closely aligned to the prompt.
 
* **style** _string_
 
 Predefined visual style for image generation. Accepts one of: `3D_ANIMATED_FAMILY_FILM` · `DESIGN_SKETCH` · `FLAT_VECTOR_ILLUSTRATION` · `GRAPHIC_NOVEL_ILLUSTRATION` · `MAXIMALISM` · `MIDCENTURY_RETRO` · `PHOTOREALISM` · `SOFT_DIGITAL_PAINTING`.
 

Documentation for additional settings can be found within the [Amazon Bedrock User Guide for Amazon Nova Documentation](https://docs.aws.amazon.com/nova/latest/userguide/image-gen-req-resp-structure.html).

### [Image Editing](#image-editing)

Amazon Nova Canvas supports several image editing task types. When you provide input images via `prompt.images`, the model automatically detects the appropriate editing mode, or you can explicitly specify the `taskType` in provider options.

#### [Image Variation](#image-variation)

Create variations of an existing image while maintaining its core characteristics:

```
1const imageBuffer = readFileSync('./input-image.png');2
3const { images } = await generateImage({4 model: bedrock.image('amazon.nova-canvas-v1:0'),5 prompt: {6 text: 'Modernize the style, photo-realistic, 8k, hdr',7 images: [imageBuffer],8 },9 providerOptions: {10 bedrock: {11 taskType: 'IMAGE_VARIATION',12 similarityStrength: 0.7, // 0-1, higher = closer to original13 negativeText: 'bad quality, low resolution',14 },15 },16});
```

* **similarityStrength** _number_
 
 Controls how similar the output is to the input image. Values range from 0 to 1, where higher values produce results closer to the original.
 

#### [Inpainting](#inpainting)

Edit specific parts of an image. You can define the area to modify using either a mask image or a text prompt:

**Using a mask prompt (text-based selection):**

```
1const imageBuffer = readFileSync('./input-image.png');2
3const { images } = await generateImage({4 model: bedrock.image('amazon.nova-canvas-v1:0'),5 prompt: {6 text: 'a cute corgi dog in the same style',7 images: [imageBuffer],8 },9 providerOptions: {10 bedrock: {11 maskPrompt: 'cat', // Describe what to replace12 },13 },14 seed: 42,15});
```

**Using a mask image:**

```
1const image = readFileSync('./input-image.png');2const mask = readFileSync('./mask.png'); // White pixels = area to change3
4const { images } = await generateImage({5 model: bedrock.image('amazon.nova-canvas-v1:0'),6 prompt: {7 text: 'A sunlit indoor lounge area with a pool containing a flamingo',8 images: [image],9 mask: mask,10 },11});
```

* **maskPrompt** _string_
 
 A text description of the area to modify. The model will automatically identify and mask the described region.
 

#### [Outpainting](#outpainting)

Extend an image beyond its original boundaries:

```
1const imageBuffer = readFileSync('./input-image.png');2
3const { images } = await generateImage({4 model: bedrock.image('amazon.nova-canvas-v1:0'),5 prompt: {6 text: 'A beautiful sunset landscape with mountains',7 images: [imageBuffer],8 },9 providerOptions: {10 bedrock: {11 taskType: 'OUTPAINTING',12 maskPrompt: 'background',13 outPaintingMode: 'DEFAULT', // or 'PRECISE'14 },15 },16});
```

* **outPaintingMode** _string_
 
 Controls how the outpainting is performed. Accepts `'DEFAULT'` or `'PRECISE'`.
 

#### [Background Removal](#background-removal)

Remove the background from an image:

```
1const imageBuffer = readFileSync('./input-image.png');2
3const { images } = await generateImage({4 model: bedrock.image('amazon.nova-canvas-v1:0'),5 prompt: {6 images: [imageBuffer],7 },8 providerOptions: {9 bedrock: {10 taskType: 'BACKGROUND_REMOVAL',11 },12 },13});
```

Background removal does not require a text prompt - only the input image is needed.

#### [Image Editing Provider Options](#image-editing-provider-options)

The following additional provider options are available for image editing:

* **taskType** _string_
 
 Explicitly set the editing task type. Accepts `'TEXT_IMAGE'` (default for text-only), `'IMAGE_VARIATION'`, `'INPAINTING'`, `'OUTPAINTING'`, or `'BACKGROUND_REMOVAL'`. When images are provided without an explicit taskType, the model defaults to `'IMAGE_VARIATION'` (or `'INPAINTING'` if a mask is provided).
 
* **maskPrompt** _string_
 
 Text description of the area to modify (for inpainting/outpainting). Alternative to providing a mask image.
 
* **similarityStrength** _number_
 
 For `IMAGE_VARIATION`: Controls similarity to the original (0-1).
 
* **outPaintingMode** _string_
 
 For `OUTPAINTING`: Controls the outpainting behavior (`'DEFAULT'` or `'PRECISE'`).
 

### [Image Model Settings](#image-model-settings)

You can customize the generation behavior with optional options:

```
1await generateImage({2 model: bedrock.image('amazon.nova-canvas-v1:0'),3 prompt: 'A beautiful sunset over a calm ocean',4 size: '512x512',5 seed: 42,6 maxImagesPerCall: 1, // Maximum number of images to generate per API call7});
```

* **maxImagesPerCall** _number_
 
 Override the maximum number of images generated per API call. Default can vary by model, with 5 as a common default.
 

### [Model Capabilities](#model-capabilities-3)

The Amazon Nova Canvas model supports custom sizes with constraints as follows:

* Each side must be between 320-4096 pixels, inclusive.
* Each side must be evenly divisible by 16.
* The aspect ratio must be between 1:4 and 4:1. That is, one side can't be more than 4 times longer than the other side.
* The total pixel count must be less than 4,194,304.

For more, see [Image generation access and usage](https://docs.aws.amazon.com/nova/latest/userguide/image-gen-access.html).

| Model | Sizes |
| --- | --- |
| `amazon.nova-canvas-v1:0` | Custom sizes: 320-4096px per side (must be divisible by 16), aspect ratio 1:4 to 4:1, max 4.2M pixels |

The Amazon Bedrock provider will return the response headers associated with network requests made of the Bedrock servers.

```
1import { bedrock } from '@ai-sdk/amazon-bedrock';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: bedrock('meta.llama3-70b-instruct-v1:0'),6 prompt: 'Write a vegetarian lasagna recipe for 4 people.',7});8
9console.log(result.response.headers);
```

Below is sample output where you can see the `x-amzn-requestid` header. This can be useful for correlating Bedrock API calls with requests made by the AI SDK:

```
1{2 connection: 'keep-alive',3 'content-length': '2399',4 'content-type': 'application/json',5 date: 'Fri, 07 Feb 2025 04:28:30 GMT',6 'x-amzn-requestid': 'c9f3ace4-dd5d-49e5-9807-39aedfa47c8e'7}
```

This information is also available with `streamText`:

```
1import { bedrock } from '@ai-sdk/amazon-bedrock';2import { streamText } from 'ai';3
4const result = streamText({5 model: bedrock('meta.llama3-70b-instruct-v1:0'),6 prompt: 'Write a vegetarian lasagna recipe for 4 people.',7});8for await (const textPart of result.textStream) {9 process.stdout.write(textPart);10}11console.log('Response headers:', (await result.response).headers);
```

With sample output as:

```
1{2 connection: 'keep-alive',3 'content-type': 'application/vnd.amazon.eventstream',4 date: 'Fri, 07 Feb 2025 04:33:37 GMT',5 'transfer-encoding': 'chunked',6 'x-amzn-requestid': 'a976e3fc-0e45-4241-9954-b9bdd80ab407'7}
```

## [Bedrock Anthropic Provider Usage](#bedrock-anthropic-provider-usage)

The Bedrock Anthropic provider offers support for Anthropic's Claude models through Amazon Bedrock's native InvokeModel API. This provides full feature parity with the [Anthropic API](https://platform.claude.com/docs/en/build-with-claude/overview), including features that may not be available through the Converse API (such as `stop_sequence` in streaming responses).

For more information on Claude models available on Amazon Bedrock, see [Claude on Amazon Bedrock](https://platform.claude.com/docs/en/build-with-claude/claude-on-amazon-bedrock).

### [Provider Instance](#provider-instance-1)

You can import the default provider instance `bedrockAnthropic` from `@ai-sdk/amazon-bedrock/anthropic`:

```
1import { bedrockAnthropic } from '@ai-sdk/amazon-bedrock/anthropic';
```

If you need a customized setup, you can import `createBedrockAnthropic` from `@ai-sdk/amazon-bedrock/anthropic` and create a provider instance with your settings:

```
1import { createBedrockAnthropic } from '@ai-sdk/amazon-bedrock/anthropic';2
3const bedrockAnthropic = createBedrockAnthropic({4 region: 'us-east-1', // optional5 accessKeyId: 'xxxxxxxxx', // optional6 secretAccessKey: 'xxxxxxxxx', // optional7 sessionToken: 'xxxxxxxxx', // optional8});
```

#### [Provider Settings](#provider-settings)

You can use the following optional settings to customize the Bedrock Anthropic provider instance:

* **region** _string_
 
 The AWS region that you want to use for the API calls. It uses the `AWS_REGION` environment variable by default.
 
* **accessKeyId** _string_
 
 The AWS access key ID that you want to use for the API calls. It uses the `AWS_ACCESS_KEY_ID` environment variable by default.
 
* **secretAccessKey** _string_
 
 The AWS secret access key that you want to use for the API calls. It uses the `AWS_SECRET_ACCESS_KEY` environment variable by default.
 
* **sessionToken** _string_
 
 Optional. The AWS session token that you want to use for the API calls. It uses the `AWS_SESSION_TOKEN` environment variable by default.
 
* **apiKey** _string_
 
 API key for authenticating requests using Bearer token authentication. When provided, this will be used instead of AWS SigV4 authentication. It uses the `AWS_BEARER_TOKEN_BEDROCK` environment variable by default.
 
* **baseURL** _string_
 
 Base URL for the Bedrock API calls. Useful for custom endpoints or proxy configurations.
 
* **headers** _Resolvable<Record<string, string | undefined>>_
 
 Headers to include in the requests.
 
* **fetch** _(input: RequestInfo, init?: RequestInit) => Promise<Response>_
 
 Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation. You can use it as a middleware to intercept requests, or to provide a custom fetch implementation for e.g. testing.
 
* **credentialProvider** _() => PromiseLike<BedrockCredentials>_
 
 The AWS credential provider to use for the Bedrock provider to get dynamic credentials similar to the AWS SDK. Setting a provider here will cause its credential values to be used instead of the `accessKeyId`, `secretAccessKey`, and `sessionToken` settings.
 

### [Language Models](#language-models-1)

You can create models that call the [Anthropic Messages API](https://docs.anthropic.com/claude/reference/messages_post) using the provider instance. The first argument is the model id, e.g. `us.anthropic.claude-3-5-sonnet-20241022-v2:0`.

```
1const model = bedrockAnthropic('us.anthropic.claude-3-5-sonnet-20241022-v2:0');
```

You can use Bedrock Anthropic language models to generate text with the `generateText` function:

```
1import { bedrockAnthropic } from '@ai-sdk/amazon-bedrock/anthropic';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: bedrockAnthropic('us.anthropic.claude-3-5-sonnet-20241022-v2:0'),6 prompt: 'Write a vegetarian lasagna recipe for 4 people.',7});
```

### [Cache Control](#cache-control)

In the messages and message parts, you can use the `providerOptions` property to set cache control breakpoints. You need to set the `anthropic` property in the `providerOptions` object to `{ cacheControl: { type: 'ephemeral' } }` to set a cache control breakpoint.

```
1import { bedrockAnthropic } from '@ai-sdk/amazon-bedrock/anthropic';2import { generateText } from 'ai';3
4const result = await generateText({5 model: bedrockAnthropic('us.anthropic.claude-sonnet-4-5-20250929-v1:0'),6 messages: [7 {8 role: 'system',9 content: 'You are an expert assistant.',10 providerOptions: {11 anthropic: { cacheControl: { type: 'ephemeral' } },12 },13 },14 {15 role: 'user',16 content: 'Explain quantum computing.',17 },18 ],19});
```

### [Computer Use](#computer-use-1)

The Bedrock Anthropic provider supports Anthropic's computer use tools:

1. **Bash Tool**: Allows running bash commands.
2. **Text Editor Tool**: Provides functionality for viewing and editing text files.
3. **Computer Tool**: Enables control of keyboard and mouse actions on a computer.

They are available via the `tools` property of the provider instance.

Computer use tools require Claude 3.7 Sonnet or newer models. Claude 3.5 Sonnet v2 does not support these tools.

#### [Bash Tool](#bash-tool-1)

```
1import { bedrockAnthropic } from '@ai-sdk/amazon-bedrock/anthropic';2import { generateText, stepCountIs } from 'ai';3
4const result = await generateText({5 model: bedrockAnthropic('us.anthropic.claude-sonnet-4-5-20250929-v1:0'),6 tools: {7 bash: bedrockAnthropic.tools.bash_20241022({8 execute: async ({ command }) => {9 // Implement your bash command execution logic here10 return [{ type: 'text', text: `Executed: ${command}` }];11 },12 }),13 },14 prompt: 'List the files in my directory.',15 stopWhen: stepCountIs(2),16});
```

#### [Text Editor Tool](#text-editor-tool-1)

```
1import { bedrockAnthropic } from '@ai-sdk/amazon-bedrock/anthropic';2import { generateText, stepCountIs } from 'ai';3
4const result = await generateText({5 model: bedrockAnthropic('us.anthropic.claude-sonnet-4-5-20250929-v1:0'),6 tools: {7 str_replace_editor: bedrockAnthropic.tools.textEditor_20241022({8 execute: async ({ command, path, old_str, new_str, insert_text }) => {9 // Implement your text editing logic here10 return 'File updated successfully';11 },12 }),13 },14 prompt: 'Update my README file.',15 stopWhen: stepCountIs(5),16});
```

#### [Computer Tool](#computer-tool-1)

```
1import { bedrockAnthropic } from '@ai-sdk/amazon-bedrock/anthropic';2import { generateText, stepCountIs } from 'ai';3import fs from 'fs';4
5const result = await generateText({6 model: bedrockAnthropic('us.anthropic.claude-sonnet-4-5-20250929-v1:0'),7 tools: {8 computer: bedrockAnthropic.tools.computer_20241022({9 displayWidthPx: 1024,10 displayHeightPx: 768,11 execute: async ({ action, coordinate, text }) => {12 if (action === 'screenshot') {13 return {14 type: 'image',15 data: fs.readFileSync('./screenshot.png').toString('base64'),16 };17 }18 return `executed ${action}`;19 },20 toModelOutput({ output }) {21 return {22 type: 'content',23 value: [24 typeof output === 'string'25 ? { type: 'text', text: output }26 : {27 type: 'image-data',28 data: output.data,29 mediaType: 'image/png',30 },31 ],32 };33 },34 }),35 },36 prompt: 'Take a screenshot.',37 stopWhen: stepCountIs(3),38});
```

### [Reasoning](#reasoning-1)

Anthropic has reasoning support for Claude 3.7 and Claude 4 models on Bedrock, including:

* `us.anthropic.claude-opus-4-6-v1`
* `us.anthropic.claude-opus-4-5-20251101-v1:0`
* `us.anthropic.claude-sonnet-4-5-20250929-v1:0`
* `us.anthropic.claude-opus-4-20250514-v1:0`
* `us.anthropic.claude-sonnet-4-20250514-v1:0`
* `us.anthropic.claude-opus-4-1-20250805-v1:0`
* `us.anthropic.claude-haiku-4-5-20251001-v1:0`

You can enable it using the `thinking` provider option and specifying a thinking budget in tokens.

```
1import { bedrockAnthropic } from '@ai-sdk/amazon-bedrock/anthropic';2import { generateText } from 'ai';3
4const { text, reasoningText, reasoning } = await generateText({5 model: bedrockAnthropic('us.anthropic.claude-sonnet-4-5-20250929-v1:0'),6 prompt: 'How many people will live in the world in 2040?',7 providerOptions: {8 anthropic: {9 thinking: { type: 'enabled', budgetTokens: 12000 },10 },11 },12});13
14console.log(reasoningText); // reasoning text15console.log(reasoning); // reasoning details including redacted reasoning16console.log(text); // text response
```

See [AI SDK UI: Chatbot](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot#reasoning) for more details on how to integrate reasoning into your chatbot.

### [Model Capabilities](#model-capabilities-4)

| Model | Image Input | Object Generation | Tool Usage | Computer Use | Reasoning |
| --- | --- | --- | --- | --- | --- |
| `us.anthropic.claude-opus-4-6-v1` | | | | | |
| `us.anthropic.claude-opus-4-5-20251101-v1:0` | | | | | |
| `us.anthropic.claude-sonnet-4-5-20250929-v1:0` | | | | | |
| `us.anthropic.claude-opus-4-20250514-v1:0` | | | | | |
| `us.anthropic.claude-sonnet-4-20250514-v1:0` | | | | | |
| `us.anthropic.claude-opus-4-1-20250805-v1:0` | | | | | |
| `us.anthropic.claude-haiku-4-5-20251001-v1:0` | | | | | |
| `us.anthropic.claude-3-5-sonnet-20241022-v2:0` | | | | | |

The Bedrock Anthropic provider uses the native InvokeModel API and supports all features available in the Anthropic API, except for the Files API and MCP Connector which are not supported on Bedrock.

## [Migrating to `@ai-sdk/amazon-bedrock` 2.x](#migrating-to-ai-sdkamazon-bedrock-2x)

The Amazon Bedrock provider was rewritten in version 2.x to remove the dependency on the `@aws-sdk/client-bedrock-runtime` package.

The `bedrockOptions` provider setting previously available has been removed. If you were using the `bedrockOptions` object, you should now use the `region`, `accessKeyId`, `secretAccessKey`, and `sessionToken` settings directly instead.

Note that you may need to set all of these explicitly, e.g. even if you're not using `sessionToken`, set it to `undefined`. If you're running in a serverless environment, there may be default environment variables set by your containing environment that the Amazon Bedrock provider will then pick up and could conflict with the ones you're intending to use.

---
url: https://ai-sdk.dev/providers/ai-sdk-providers/groq
title: "AI SDK Providers: Groq"
description: "Learn how to use Groq."
hash: "a932b825677d0c87c63d1f790b6bf337d21410932bb3e824d17b44d076f1791f"
crawledAt: 2026-03-07T08:04:47.416Z
depth: 2
---

## [Groq Provider](#groq-provider)

The [Groq](https://groq.com/) provider contains language model support for the Groq API.

## [Setup](#setup)

The Groq provider is available via the `@ai-sdk/groq` module. You can install it with

pnpm add @ai-sdk/groq

## [Provider Instance](#provider-instance)

You can import the default provider instance `groq` from `@ai-sdk/groq`:

```
1import { groq } from '@ai-sdk/groq';
```

If you need a customized setup, you can import `createGroq` from `@ai-sdk/groq` and create a provider instance with your settings:

```
1import { createGroq } from '@ai-sdk/groq';2
3const groq = createGroq({4 // custom settings5});
```

You can use the following optional settings to customize the Groq provider instance:

* **baseURL** _string_
 
 Use a different URL prefix for API calls, e.g. to use proxy servers. The default prefix is `https://api.groq.com/openai/v1`.
 
* **apiKey** _string_
 
 API key that is being sent using the `Authorization` header. It defaults to the `GROQ_API_KEY` environment variable.
 
* **headers** _Record<string,string>_
 
 Custom headers to include in the requests.
 
* **fetch** _(input: RequestInfo, init?: RequestInit) => Promise<Response>_
 
 Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation. Defaults to the global `fetch` function. You can use it as a middleware to intercept requests, or to provide a custom fetch implementation for e.g. testing.
 

## [Language Models](#language-models)

You can create [Groq models](https://console.groq.com/docs/models) using a provider instance. The first argument is the model id, e.g. `gemma2-9b-it`.

```
1const model = groq('gemma2-9b-it');
```

### [Reasoning Models](#reasoning-models)

Groq offers several reasoning models such as `qwen-qwq-32b` and `deepseek-r1-distill-llama-70b`. You can configure how the reasoning is exposed in the generated text by using the `reasoningFormat` option. It supports the options `parsed`, `hidden`, and `raw`.

```
1import { groq, type GroqLanguageModelOptions } from '@ai-sdk/groq';2import { generateText } from 'ai';3
4const result = await generateText({5 model: groq('qwen/qwen3-32b'),6 providerOptions: {7 groq: {8 reasoningFormat: 'parsed',9 reasoningEffort: 'default',10 parallelToolCalls: true, // Enable parallel function calling (default: true)11 user: 'user-123', // Unique identifier for end-user (optional)12 serviceTier: 'flex', // Use flex tier for higher throughput (optional)13 } satisfies GroqLanguageModelOptions,14 },15 prompt: 'How many "r"s are in the word "strawberry"?',16});
```

The following optional provider options are available for Groq language models:

* **reasoningFormat** _'parsed' | 'raw' | 'hidden'_
 
 Controls how reasoning is exposed in the generated text. Only supported by reasoning models like `qwen-qwq-32b` and `deepseek-r1-distill-*` models.
 
 For a complete list of reasoning models and their capabilities, see [Groq's reasoning models documentation](https://console.groq.com/docs/reasoning).
 
* **reasoningEffort** _'low' | 'medium' | 'high' | 'none' | 'default'_
 
 Controls the level of effort the model will put into reasoning.
 
 * `qwen/qwen3-32b`
 * Supported values:
 * `none`: Disable reasoning. The model will not use any reasoning tokens.
 * `default`: Enable reasoning.
 * `gpt-oss20b/gpt-oss120b`
 * Supported values:
 * `low`: Use a low level of reasoning effort.
 * `medium`: Use a medium level of reasoning effort.
 * `high`: Use a high level of reasoning effort.
 
 Defaults to `default` for `qwen/qwen3-32b.`
 
* **structuredOutputs** _boolean_
 
 Whether to use structured outputs.
 
 Defaults to `true`.
 
 When enabled, object generation will use the `json_schema` format instead of `json_object` format, providing more reliable structured outputs.
 
* **strictJsonSchema** _boolean_
 
 Whether to use strict JSON schema validation. When `true`, the model uses constrained decoding to guarantee schema compliance.
 
 Defaults to `true`.
 
 Only used when `structuredOutputs` is enabled and a schema is provided. See [Groq's Structured Outputs documentation](https://console.groq.com/docs/structured-outputs) for details on strict mode limitations.
 
* **parallelToolCalls** _boolean_
 
 Whether to enable parallel function calling during tool use. Defaults to `true`.
 
* **user** _string_
 
 A unique identifier representing your end-user, which can help with monitoring and abuse detection.
 
* **serviceTier** _'on\_demand' | 'flex' | 'auto'_
 
 Service tier for the request. Defaults to `'on_demand'`.
 
 * `'on_demand'`: Default tier with consistent performance and fairness
 * `'flex'`: Higher throughput tier (10x rate limits) optimized for workloads that can handle occasional request failures
 * `'auto'`: Uses on\_demand rate limits first, then falls back to flex tier if exceeded
 
 For more details about service tiers and their benefits, see [Groq's Flex Processing documentation](https://console.groq.com/docs/flex-processing).
 

Only Groq reasoning models support the `reasoningFormat` option.

#### [Structured Outputs](#structured-outputs)

Structured outputs are enabled by default for Groq models. You can disable them by setting the `structuredOutputs` option to `false`.

```
1import { groq } from '@ai-sdk/groq';2import { generateText, Output } from 'ai';3import { z } from 'zod';4
5const result = await generateText({6 model: groq('moonshotai/kimi-k2-instruct-0905'),7 output: Output.object({8 schema: z.object({9 recipe: z.object({10 name: z.string(),11 ingredients: z.array(z.string()),12 instructions: z.array(z.string()),13 }),14 }),15 }),16 prompt: 'Generate a simple pasta recipe.',17});18
19console.log(JSON.stringify(result.output, null, 2));
```

You can disable structured outputs for models that don't support them:

```
1import { groq, type GroqLanguageModelOptions } from '@ai-sdk/groq';2import { generateText, Output } from 'ai';3import { z } from 'zod';4
5const result = await generateText({6 model: groq('gemma2-9b-it'),7 providerOptions: {8 groq: {9 structuredOutputs: false,10 } satisfies GroqLanguageModelOptions,11 },12 output: Output.object({13 schema: z.object({14 recipe: z.object({15 name: z.string(),16 ingredients: z.array(z.string()),17 instructions: z.array(z.string()),18 }),19 }),20 }),21 prompt: 'Generate a simple pasta recipe in JSON format.',22});23
24console.log(JSON.stringify(result.output, null, 2));
```

Structured outputs are only supported by newer Groq models like `moonshotai/kimi-k2-instruct-0905`. For unsupported models, you can disable structured outputs by setting `structuredOutputs: false`. When disabled, Groq uses the `json_object` format which requires the word "JSON" to be included in your messages.

### [Example](#example)

You can use Groq language models to generate text with the `generateText` function:

```
1import { groq } from '@ai-sdk/groq';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: groq('gemma2-9b-it'),6 prompt: 'Write a vegetarian lasagna recipe for 4 people.',7});
```

### [Image Input](#image-input)

Groq's multi-modal models like `meta-llama/llama-4-scout-17b-16e-instruct` support image inputs. You can include images in your messages using either URLs or base64-encoded data:

```
1import { groq } from '@ai-sdk/groq';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: groq('meta-llama/llama-4-scout-17b-16e-instruct'),6 messages: [7 {8 role: 'user',9 content: [10 { type: 'text', text: 'What do you see in this image?' },11 {12 type: 'image',13 image: 'https://example.com/image.jpg',14 },15 ],16 },17 ],18});
```

You can also use base64-encoded images:

```
1import { groq } from '@ai-sdk/groq';2import { generateText } from 'ai';3import { readFileSync } from 'fs';4
5const imageData = readFileSync('path/to/image.jpg', 'base64');6
7const { text } = await generateText({8 model: groq('meta-llama/llama-4-scout-17b-16e-instruct'),9 messages: [10 {11 role: 'user',12 content: [13 { type: 'text', text: 'Describe this image in detail.' },14 {15 type: 'image',16 image: `data:image/jpeg;base64,${imageData}`,17 },18 ],19 },20 ],21});
```

## [Model Capabilities](#model-capabilities)

| Model | Image Input | Object Generation | Tool Usage | Tool Streaming |
| --- | --- | --- | --- | --- |
| `gemma2-9b-it` | | | | |
| `llama-3.1-8b-instant` | | | | |
| `llama-3.3-70b-versatile` | | | | |
| `meta-llama/llama-guard-4-12b` | | | | |
| `deepseek-r1-distill-llama-70b` | | | | |
| `meta-llama/llama-4-maverick-17b-128e-instruct` | | | | |
| `meta-llama/llama-4-scout-17b-16e-instruct` | | | | |
| `meta-llama/llama-prompt-guard-2-22m` | | | | |
| `meta-llama/llama-prompt-guard-2-86m` | | | | |
| `moonshotai/kimi-k2-instruct-0905` | | | | |
| `qwen/qwen3-32b` | | | | |
| `llama-guard-3-8b` | | | | |
| `llama3-70b-8192` | | | | |
| `llama3-8b-8192` | | | | |
| `mixtral-8x7b-32768` | | | | |
| `qwen-qwq-32b` | | | | |
| `qwen-2.5-32b` | | | | |
| `deepseek-r1-distill-qwen-32b` | | | | |
| `openai/gpt-oss-20b` | | | | |
| `openai/gpt-oss-120b` | | | | |

The tables above list the most commonly used models. Please see the [Groq docs](https://console.groq.com/docs/models) for a complete list of available models. You can also pass any available provider model ID as a string if needed.

## [Browser Search Tool](#browser-search-tool)

Groq provides a browser search tool that offers interactive web browsing capabilities. Unlike traditional web search, browser search navigates websites interactively, providing more detailed and comprehensive results.

### [Supported Models](#supported-models)

Browser search is only available for these specific models:

* `openai/gpt-oss-20b`
* `openai/gpt-oss-120b`

Browser search will only work with the supported models listed above. Using it with other models will generate a warning and the tool will be ignored.

### [Basic Usage](#basic-usage)

```
1import { groq } from '@ai-sdk/groq';2import { generateText } from 'ai';3
4const result = await generateText({5 model: groq('openai/gpt-oss-120b'), // Must use supported model6 prompt:7 'What are the latest developments in AI? Please search for recent news.',8 tools: {9 browser_search: groq.tools.browserSearch({}),10 },11 toolChoice: 'required', // Ensure the tool is used12});13
14console.log(result.text);
```

### [Streaming Example](#streaming-example)

```
1import { groq } from '@ai-sdk/groq';2import { streamText } from 'ai';3
4const result = streamText({5 model: groq('openai/gpt-oss-120b'),6 prompt: 'Search for the latest tech news and summarize it.',7 tools: {8 browser_search: groq.tools.browserSearch({}),9 },10 toolChoice: 'required',11});12
13for await (const delta of result.fullStream) {14 if (delta.type === 'text-delta') {15 process.stdout.write(delta.text);16 }17}
```

### [Key Features](#key-features)

* **Interactive Browsing**: Navigates websites like a human user
* **Comprehensive Results**: More detailed than traditional search snippets
* **Server-side Execution**: Runs on Groq's infrastructure, no setup required
* **Powered by Exa**: Uses Exa search engine for optimal results
* **Currently Free**: Available at no additional charge during beta

### [Best Practices](#best-practices)

* Use `toolChoice: 'required'` to ensure the browser search is activated
* Only supported on `openai/gpt-oss-20b` and `openai/gpt-oss-120b` models
* The tool works automatically - no configuration parameters needed
* Server-side execution means no additional API keys or setup required

### [Model Validation](#model-validation)

The provider automatically validates model compatibility:

```
1// ✅ Supported - will work2const result = await generateText({3 model: groq('openai/gpt-oss-120b'),4 tools: { browser_search: groq.tools.browserSearch({}) },5});6
7// ❌ Unsupported - will show warning and ignore tool8const result = await generateText({9 model: groq('gemma2-9b-it'),10 tools: { browser_search: groq.tools.browserSearch({}) },11});12// Warning: "Browser search is only supported on models: openai/gpt-oss-20b, openai/gpt-oss-120b"
```

## [Transcription Models](#transcription-models)

You can create models that call the [Groq transcription API](https://console.groq.com/docs/speech-to-text) using the `.transcription()` factory method.

The first argument is the model id e.g. `whisper-large-v3`.

```
1const model = groq.transcription('whisper-large-v3');
```

You can also pass additional provider-specific options using the `providerOptions` argument. For example, supplying the input language in ISO-639-1 (e.g. `en`) format will improve accuracy and latency.

```
1import { experimental_transcribe as transcribe } from 'ai';2import { groq, type GroqTranscriptionModelOptions } from '@ai-sdk/groq';3import { readFile } from 'fs/promises';4
5const result = await transcribe({6 model: groq.transcription('whisper-large-v3'),7 audio: await readFile('audio.mp3'),8 providerOptions: {9 groq: { language: 'en' } satisfies GroqTranscriptionModelOptions,10 },11});
```

The following provider options are available:

* **timestampGranularities** _string\[\]_ The granularity of the timestamps in the transcription. Defaults to `['segment']`. Possible values are `['word']`, `['segment']`, and `['word', 'segment']`. Note: There is no additional latency for segment timestamps, but generating word timestamps incurs additional latency. **Important:** Requires `responseFormat` to be set to `'verbose_json'`.
 
* **responseFormat** _string_ The format of the response. Set to `'verbose_json'` to receive timestamps for audio segments and enable `timestampGranularities`. Set to `'text'` to return only the transcribed text. Optional.
 
* **language** _string_ The language of the input audio. Supplying the input language in ISO-639-1 format (e.g. 'en') will improve accuracy and latency. Optional.
 
* **prompt** _string_ An optional text to guide the model's style or continue a previous audio segment. The prompt should match the audio language. Optional.
 
* **temperature** _number_ The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. If set to 0, the model will use log probability to automatically increase the temperature until certain thresholds are hit. Defaults to 0. Optional.
 

### [Model Capabilities](#model-capabilities-1)

| Model | Transcription | Duration | Segments | Language |
| --- | --- | --- | --- | --- |
| `whisper-large-v3` | | | | |
| `whisper-large-v3-turbo` | | | | |

---
url: https://ai-sdk.dev/providers/ai-sdk-providers/fal
title: "AI SDK Providers: Fal"
description: "Learn how to use Fal AI models with the AI SDK."
hash: "5e93efeb682a2c1c57255e3a8009a180b4d8a99f7bad65edc6bad3e20db2053f"
crawledAt: 2026-03-07T08:04:52.833Z
depth: 2
---

## [Fal Provider](#fal-provider)

[Fal AI](https://fal.ai/) provides a generative media platform for developers with lightning-fast inference capabilities. Their platform offers optimized performance for running diffusion models, with speeds up to 4x faster than alternatives.

## [Setup](#setup)

The Fal provider is available via the `@ai-sdk/fal` module. You can install it with

pnpm add @ai-sdk/fal

## [Provider Instance](#provider-instance)

You can import the default provider instance `fal` from `@ai-sdk/fal`:

```
1import { fal } from '@ai-sdk/fal';
```

If you need a customized setup, you can import `createFal` and create a provider instance with your settings:

```
1import { createFal } from '@ai-sdk/fal';2
3const fal = createFal({4 apiKey: 'your-api-key', // optional, defaults to FAL_API_KEY environment variable, falling back to FAL_KEY5 baseURL: 'custom-url', // optional6 headers: {7 /* custom headers */8 }, // optional9});
```

You can use the following optional settings to customize the Fal provider instance:

* **baseURL** _string_
 
 Use a different URL prefix for API calls, e.g. to use proxy servers. The default prefix is `https://fal.run`.
 
* **apiKey** _string_
 
 API key that is being sent using the `Authorization` header. It defaults to the `FAL_API_KEY` environment variable, falling back to `FAL_KEY`.
 
* **headers** _Record<string,string>_
 
 Custom headers to include in the requests.
 
* **fetch** _(input: RequestInfo, init?: RequestInit) => Promise<Response>_
 
 Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation. You can use it as a middleware to intercept requests, or to provide a custom fetch implementation for e.g. testing.
 

## [Image Models](#image-models)

You can create Fal image models using the `.image()` factory method. For more on image generation with the AI SDK see [generateImage()](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-image).

### [Basic Usage](#basic-usage)

```
1import { fal } from '@ai-sdk/fal';2import { generateImage } from 'ai';3import fs from 'fs';4
5const { image, providerMetadata } = await generateImage({6 model: fal.image('fal-ai/flux/dev'),7 prompt: 'A serene mountain landscape at sunset',8});9
10const filename = `image-${Date.now()}.png`;11fs.writeFileSync(filename, image.uint8Array);12console.log(`Image saved to ${filename}`);
```

Fal image models may return additional information for the images and the request.

Here are some examples of properties that may be set for each image

```
1providerMetadata.fal.images[0].nsfw; // boolean, image is not safe for work2providerMetadata.fal.images[0].width; // number, image width3providerMetadata.fal.images[0].height; // number, image height4providerMetadata.fal.images[0].contentType; // string, mime type of the image
```

### [Model Capabilities](#model-capabilities)

Fal offers many models optimized for different use cases. Here are a few popular examples. For a full list of models, see the [Fal AI Search Page](https://fal.ai/explore/search).

| Model | Description |
| --- | --- |
| `fal-ai/flux/dev` | FLUX.1 \[dev\] model for high-quality image generation |
| `fal-ai/flux-pro/kontext` | FLUX.1 Kontext \[pro\] handles both text and reference images as inputs, enabling targeted edits and complex transformations |
| `fal-ai/flux-pro/kontext/max` | FLUX.1 Kontext \[max\] with improved prompt adherence and typography generation |
| `fal-ai/flux-lora` | Super fast endpoint for FLUX.1 with LoRA support |
| `fal-ai/ideogram/character` | Generate consistent character appearances across multiple images. Maintain facial features, proportions, and distinctive traits |
| `fal-ai/qwen-image` | Qwen-Image foundation model with significant advances in complex text rendering and precise image editing |
| `fal-ai/omnigen-v2` | Unified image generation model for Image Editing, Personalized Image Generation, Virtual Try-On, Multi Person Generation and more |
| `fal-ai/bytedance/dreamina/v3.1/text-to-image` | Dreamina showcases superior picture effects with improvements in aesthetics, precise and diverse styles, and rich details |
| `fal-ai/recraft/v3/text-to-image` | SOTA in image generation with vector art and brand style capabilities |
| `fal-ai/wan/v2.2-a14b/text-to-image` | High-resolution, photorealistic images with fine-grained detail |

Fal models support the following aspect ratios:

* 1:1 (square HD)
* 16:9 (landscape)
* 9:16 (portrait)
* 4:3 (landscape)
* 3:4 (portrait)
* 16:10 (1280x800)
* 10:16 (800x1280)
* 21:9 (2560x1080)
* 9:21 (1080x2560)

Key features of Fal models include:

* Up to 4x faster inference speeds compared to alternatives
* Optimized by the Fal Inference Engine™
* Support for real-time infrastructure
* Cost-effective scaling with pay-per-use pricing
* LoRA training capabilities for model personalization

#### [Modify Image](#modify-image)

Transform existing images using text prompts.

```
1await generateImage({2 model: fal.image('fal-ai/flux-pro/kontext/max'),3 prompt: {4 text: 'Put a donut next to the flour.',5 images: [6 'https://v3.fal.media/files/rabbit/rmgBxhwGYb2d3pl3x9sKf_output.png',7 ],8 },9});
```

Images can also be passed as base64-encoded string, a `Uint8Array`, an `ArrayBuffer`, or a `Buffer`. A mask can be passed as well

```
1await generateImage({2 model: fal.image('fal-ai/flux-pro/kontext/max'),3 prompt: {4 text: 'Put a donut next to the flour.',5 images: [imageBuffer],6 mask: maskBuffer,7 },8});
```

### [Provider Options](#provider-options)

Fal image models support flexible provider options through the `providerOptions.fal` object. You can pass any parameters supported by the specific Fal model's API. Common options include:

* **imageUrl** - Reference image URL for image-to-image generation (deprecated, use `prompt.images` instead)
* **strength** - Controls how much the output differs from the input image
* **guidanceScale** - Controls adherence to the prompt (range: 1-20)
* **numInferenceSteps** - Number of denoising steps (range: 1-50)
* **enableSafetyChecker** - Enable/disable safety filtering
* **outputFormat** - Output format: 'jpeg' or 'png'
* **syncMode** - Wait for completion before returning response
* **acceleration** - Speed of generation: 'none', 'regular', or 'high'
* **safetyTolerance** - Content safety filtering level (1-6, where 1 is strictest)
* **useMultipleImages** - When true, converts multiple input images to `image_urls` array for models that support multiple images (e.g., fal-ai/flux-2/edit)

**Deprecation Notice**: snake\_case parameter names (e.g., `image_url`, `guidance_scale`) are deprecated and will be removed in a future version. Please use camelCase names (e.g., `imageUrl`, `guidanceScale`) instead.

Refer to the [Fal AI model documentation](https://fal.ai/models) for model-specific parameters.

### [Advanced Features](#advanced-features)

Fal's platform offers several advanced capabilities:

* **Private Model Inference**: Run your own diffusion transformer models with up to 50% faster inference
* **LoRA Training**: Train and personalize models in under 5 minutes
* **Real-time Infrastructure**: Enable new user experiences with fast inference times
* **Scalable Architecture**: Scale to thousands of GPUs when needed

For more details about Fal's capabilities and features, visit the [Fal AI documentation](https://fal.ai/docs).

## [Transcription Models](#transcription-models)

You can create models that call the [Fal transcription API](https://docs.fal.ai/guides/convert-speech-to-text) using the `.transcription()` factory method.

The first argument is the model id without the `fal-ai/` prefix e.g. `wizper`.

```
1const model = fal.transcription('wizper');
```

You can also pass additional provider-specific options using the `providerOptions` argument. For example, supplying the `batchSize` option will increase the number of audio chunks processed in parallel.

```
1import { experimental_transcribe as transcribe } from 'ai';2import { fal, type FalTranscriptionModelOptions } from '@ai-sdk/fal';3import { readFile } from 'fs/promises';4
5const result = await transcribe({6 model: fal.transcription('wizper'),7 audio: await readFile('audio.mp3'),8 providerOptions: {9 fal: { batchSize: 10 } satisfies FalTranscriptionModelOptions,10 },11});
```

The following provider options are available:

* **language** _string_ Language of the audio file. Defaults to 'en'. If set to null, the language will be automatically detected. Accepts ISO language codes like 'en', 'fr', 'zh', etc. Optional.
 
* **diarize** _boolean_ Whether to diarize the audio file (identify different speakers). Defaults to true. Optional.
 
* **chunkLevel** _string_ Level of the chunks to return. Either 'segment' or 'word'. Default value: "segment" Optional.
 
* **version** _string_ Version of the model to use. All models are Whisper large variants. Default value: "3" Optional.
 
* **batchSize** _number_ Batch size for processing. Default value: 64 Optional.
 
* **numSpeakers** _number_ Number of speakers in the audio file. If not provided, the number of speakers will be automatically detected. Optional.
 

### [Model Capabilities](#model-capabilities-1)

| Model | Transcription | Duration | Segments | Language |
| --- | --- | --- | --- | --- |
| `whisper` | | | | |
| `wizper` | | | | |

## [Speech Models](#speech-models)

You can create models that call Fal text-to-speech endpoints using the `.speech()` factory method.

### [Basic Usage](#basic-usage-1)

```
1import { experimental_generateSpeech as generateSpeech } from 'ai';2import { fal } from '@ai-sdk/fal';3
4const result = await generateSpeech({5 model: fal.speech('fal-ai/minimax/speech-02-hd'),6 text: 'Hello from the AI SDK!',7});
```

### [Model Capabilities](#model-capabilities-2)

| Model | Description |
| --- | --- |
| `fal-ai/minimax/voice-clone` | Clone a voice from a sample audio and generate speech from text prompts |
| `fal-ai/minimax/voice-design` | Design a personalized voice from a text description and generate speech from text prompts |
| `fal-ai/dia-tts/voice-clone` | Clone dialog voices from a sample audio and generate dialogs from text prompts |
| `fal-ai/minimax/speech-02-hd` | Generate speech from text prompts and different voices |
| `fal-ai/minimax/speech-02-turbo` | Generate fast speech from text prompts and different voices |
| `fal-ai/dia-tts` | Directly generates realistic dialogue from transcripts with audio conditioning for emotion control. Produces natural nonverbals like laughter and throat clearing |
| `resemble-ai/chatterboxhd/text-to-speech` | Generate expressive, natural speech with Resemble AI's Chatterbox. Features unique emotion control, instant voice cloning from short audio, and built-in watermarking |

### [Provider Options](#provider-options-1)

Pass provider-specific options via `providerOptions.fal` depending on the model:

* **voice\_setting** _object_
 
 * `voice_id` (string): predefined voice ID
 * `speed` (number): 0.5–2.0
 * `vol` (number): 0–10
 * `pitch` (number): -12–12
 * `emotion` (enum): happy | sad | angry | fearful | disgusted | surprised | neutral
 * `english_normalization` (boolean)
* **audio\_setting** _object_ Audio configuration settings specific to the model.
 
* **language\_boost** _enum_ Chinese | Chinese,Yue | English | Arabic | Russian | Spanish | French | Portuguese | German | Turkish | Dutch | Ukrainian | Vietnamese | Indonesian | Japanese | Italian | Korean | Thai | Polish | Romanian | Greek | Czech | Finnish | Hindi | auto
 
* **pronunciation\_dict** _object_ Custom pronunciation dictionary for specific words.
 

Model-specific parameters (e.g., `audio_url`, `prompt`, `preview_text`, `ref_audio_url`, `ref_text`) can be passed directly under `providerOptions.fal` and will be forwarded to the Fal API.

---
url: https://ai-sdk.dev/providers/ai-sdk-providers/deepinfra
title: "AI SDK Providers: DeepInfra"
description: "Learn how to use DeepInfra's models with the AI SDK."
hash: "ab1240436c0710a709de06af61eed75a2fc6c4636caba83e3928a3bd41596be0"
crawledAt: 2026-03-07T08:04:59.068Z
depth: 2
---

## [DeepInfra Provider](#deepinfra-provider)

The [DeepInfra](https://deepinfra.com/) provider contains support for state-of-the-art models through the DeepInfra API, including Llama 3, Mixtral, Qwen, and many other popular open-source models.

## [Setup](#setup)

The DeepInfra provider is available via the `@ai-sdk/deepinfra` module. You can install it with:

pnpm add @ai-sdk/deepinfra

## [Provider Instance](#provider-instance)

You can import the default provider instance `deepinfra` from `@ai-sdk/deepinfra`:

```
1import { deepinfra } from '@ai-sdk/deepinfra';
```

If you need a customized setup, you can import `createDeepInfra` from `@ai-sdk/deepinfra` and create a provider instance with your settings:

```
1import { createDeepInfra } from '@ai-sdk/deepinfra';2
3const deepinfra = createDeepInfra({4 apiKey: process.env.DEEPINFRA_API_KEY ?? '',5});
```

You can use the following optional settings to customize the DeepInfra provider instance:

* **baseURL** _string_
 
 Use a different URL prefix for API calls, e.g. to use proxy servers. The default prefix is `https://api.deepinfra.com/v1`.
 
 Note: Language models and embeddings use OpenAI-compatible endpoints at `{baseURL}/openai`, while image models use `{baseURL}/inference`.
 
* **apiKey** _string_
 
 API key that is being sent using the `Authorization` header. It defaults to the `DEEPINFRA_API_KEY` environment variable.
 
* **headers** _Record<string,string>_
 
 Custom headers to include in the requests.
 
* **fetch** _(input: RequestInfo, init?: RequestInit) => Promise<Response>_
 
 Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation. Defaults to the global `fetch` function. You can use it as a middleware to intercept requests, or to provide a custom fetch implementation for e.g. testing.
 

## [Language Models](#language-models)

You can create language models using a provider instance. The first argument is the model ID, for example:

```
1import { deepinfra } from '@ai-sdk/deepinfra';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: deepinfra('meta-llama/Meta-Llama-3.1-70B-Instruct'),6 prompt: 'Write a vegetarian lasagna recipe for 4 people.',7});
```

DeepInfra language models can also be used in the `streamText` function (see [AI SDK Core](https://ai-sdk.dev/docs/ai-sdk-core)).

## [Model Capabilities](#model-capabilities)

| Model | Image Input | Object Generation | Tool Usage | Tool Streaming |
| --- | --- | --- | --- | --- |
| `meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | | | | |
| `meta-llama/Llama-4-Scout-17B-16E-Instruct` | | | | |
| `meta-llama/Llama-3.3-70B-Instruct-Turbo` | | | | |
| `meta-llama/Llama-3.3-70B-Instruct` | | | | |
| `meta-llama/Meta-Llama-3.1-405B-Instruct` | | | | |
| `meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo` | | | | |
| `meta-llama/Meta-Llama-3.1-70B-Instruct` | | | | |
| `meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo` | | | | |
| `meta-llama/Meta-Llama-3.1-8B-Instruct` | | | | |
| `meta-llama/Llama-3.2-11B-Vision-Instruct` | | | | |
| `meta-llama/Llama-3.2-90B-Vision-Instruct` | | | | |
| `mistralai/Mixtral-8x7B-Instruct-v0.1` | | | | |
| `deepseek-ai/DeepSeek-V3` | | | | |
| `deepseek-ai/DeepSeek-R1` | | | | |
| `deepseek-ai/DeepSeek-R1-Distill-Llama-70B` | | | | |
| `deepseek-ai/DeepSeek-R1-Turbo` | | | | |
| `nvidia/Llama-3.1-Nemotron-70B-Instruct` | | | | |
| `Qwen/Qwen2-7B-Instruct` | | | | |
| `Qwen/Qwen2.5-72B-Instruct` | | | | |
| `Qwen/Qwen2.5-Coder-32B-Instruct` | | | | |
| `Qwen/QwQ-32B-Preview` | | | | |
| `google/codegemma-7b-it` | | | | |
| `google/gemma-2-9b-it` | | | | |
| `microsoft/WizardLM-2-8x22B` | | | | |

The table above lists popular models. Please see the [DeepInfra docs](https://deepinfra.com/) for a full list of available models. You can also pass any available provider model ID as a string if needed.

## [Image Models](#image-models)

You can create DeepInfra image models using the `.image()` factory method. For more on image generation with the AI SDK see [generateImage()](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-image).

```
1import { deepinfra } from '@ai-sdk/deepinfra';2import { generateImage } from 'ai';3
4const { image } = await generateImage({5 model: deepinfra.image('stabilityai/sd3.5'),6 prompt: 'A futuristic cityscape at sunset',7 aspectRatio: '16:9',8});
```

Model support for `size` and `aspectRatio` parameters varies by model. Please check the individual model documentation on [DeepInfra's models page](https://deepinfra.com/models/text-to-image) for supported options and additional parameters.

### [Model-specific options](#model-specific-options)

You can pass model-specific parameters using the `providerOptions.deepinfra` field:

```
1import { deepinfra } from '@ai-sdk/deepinfra';2import { generateImage } from 'ai';3
4const { image } = await generateImage({5 model: deepinfra.image('stabilityai/sd3.5'),6 prompt: 'A futuristic cityscape at sunset',7 aspectRatio: '16:9',8 providerOptions: {9 deepinfra: {10 num_inference_steps: 30, // Control the number of denoising steps (1-50)11 },12 },13});
```

### [Image Editing](#image-editing)

DeepInfra supports image editing through models like `Qwen/Qwen-Image-Edit`. Pass input images via `prompt.images` to transform or edit existing images.

#### [Basic Image Editing](#basic-image-editing)

Transform an existing image using text prompts:

```
1const imageBuffer = readFileSync('./input-image.png');2
3const { images } = await generateImage({4 model: deepinfra.image('Qwen/Qwen-Image-Edit'),5 prompt: {6 text: 'Turn the cat into a golden retriever dog',7 images: [imageBuffer],8 },9 size: '1024x1024',10});
```

#### [Inpainting with Mask](#inpainting-with-mask)

Edit specific parts of an image using a mask. Transparent areas in the mask indicate where the image should be edited:

```
1const image = readFileSync('./input-image.png');2const mask = readFileSync('./mask.png');3
4const { images } = await generateImage({5 model: deepinfra.image('Qwen/Qwen-Image-Edit'),6 prompt: {7 text: 'A sunlit indoor lounge area with a pool containing a flamingo',8 images: [image],9 mask: mask,10 },11});
```

#### [Multi-Image Combining](#multi-image-combining)

Combine multiple reference images into a single output:

```
1const cat = readFileSync('./cat.png');2const dog = readFileSync('./dog.png');3
4const { images } = await generateImage({5 model: deepinfra.image('Qwen/Qwen-Image-Edit'),6 prompt: {7 text: 'Create a scene with both animals together, playing as friends',8 images: [cat, dog],9 },10});
```

Input images can be provided as `Buffer`, `ArrayBuffer`, `Uint8Array`, or base64-encoded strings. DeepInfra uses an OpenAI-compatible image editing API at `https://api.deepinfra.com/v1/openai/images/edits`.

### [Model Capabilities](#model-capabilities-1)

For models supporting aspect ratios, the following ratios are typically supported: `1:1 (default), 16:9, 1:9, 3:2, 2:3, 4:5, 5:4, 9:16, 9:21`

For models supporting size parameters, dimensions must typically be:

* Multiples of 32
* Width and height between 256 and 1440 pixels
* Default size is 1024x1024

| Model | Dimensions Specification | Notes |
| --- | --- | --- |
| `stabilityai/sd3.5` | Aspect Ratio | Premium quality base model, 8B parameters |
| `black-forest-labs/FLUX-1.1-pro` | Size | Latest state-of-art model with superior prompt following |
| `black-forest-labs/FLUX-1-schnell` | Size | Fast generation in 1-4 steps |
| `black-forest-labs/FLUX-1-dev` | Size | Optimized for anatomical accuracy |
| `black-forest-labs/FLUX-pro` | Size | Flagship Flux model |
| `black-forest-labs/FLUX.1-Kontext-dev` | Size | Image editing and transformation model |
| `black-forest-labs/FLUX.1-Kontext-pro` | Size | Professional image editing and transformation |
| `stabilityai/sd3.5-medium` | Aspect Ratio | Balanced 2.5B parameter model |
| `stabilityai/sdxl-turbo` | Aspect Ratio | Optimized for fast generation |

For more details and pricing information, see the [DeepInfra text-to-image models page](https://deepinfra.com/models/text-to-image).

## [Embedding Models](#embedding-models)

You can create DeepInfra embedding models using the `.embeddingModel()` factory method. For more on embedding models with the AI SDK see [embed()](https://ai-sdk.dev/docs/reference/ai-sdk-core/embed).

```
1import { deepinfra } from '@ai-sdk/deepinfra';2import { embed } from 'ai';3
4const { embedding } = await embed({5 model: deepinfra.embeddingModel('BAAI/bge-large-en-v1.5'),6 value: 'sunny day at the beach',7});
```

### [Model Capabilities](#model-capabilities-2)

| Model | Dimensions | Max Tokens |
| --- | --- | --- |
| `BAAI/bge-base-en-v1.5` | 768 | 512 |
| `BAAI/bge-large-en-v1.5` | 1024 | 512 |
| `BAAI/bge-m3` | 1024 | 8192 |
| `intfloat/e5-base-v2` | 768 | 512 |
| `intfloat/e5-large-v2` | 1024 | 512 |
| `intfloat/multilingual-e5-large` | 1024 | 512 |
| `sentence-transformers/all-MiniLM-L12-v2` | 384 | 256 |
| `sentence-transformers/all-MiniLM-L6-v2` | 384 | 256 |
| `sentence-transformers/all-mpnet-base-v2` | 768 | 384 |
| `sentence-transformers/clip-ViT-B-32` | 512 | 77 |
| `sentence-transformers/clip-ViT-B-32-multilingual-v1` | 512 | 77 |
| `sentence-transformers/multi-qa-mpnet-base-dot-v1` | 768 | 512 |
| `sentence-transformers/paraphrase-MiniLM-L6-v2` | 384 | 128 |
| `shibing624/text2vec-base-chinese` | 768 | 512 |
| `thenlper/gte-base` | 768 | 512 |
| `thenlper/gte-large` | 1024 | 512 |

---
url: https://ai-sdk.dev/providers/ai-sdk-providers/black-forest-labs
title: "AI SDK Providers: Black Forest Labs"
description: "Learn how to use Black Forest Labs models with the AI SDK."
hash: "a70c8de42b6cd1d40f976768c8e9d34bb8a7236e8189e3a811b1fa6d1bdd147d"
crawledAt: 2026-03-07T08:05:05.219Z
depth: 2
---

## [Black Forest Labs Provider](#black-forest-labs-provider)

[Black Forest Labs](https://bfl.ai/) provides a generative image platform for developers with FLUX-based models. Their platform offers fast, high quality, and in-context image generation and editing with precise and coherent results.

## [Setup](#setup)

The Black Forest Labs provider is available via the `@ai-sdk/black-forest-labs` module. You can install it with

pnpm add @ai-sdk/black-forest-labs

## [Provider Instance](#provider-instance)

You can import the default provider instance `blackForestLabs` from `@ai-sdk/black-forest-labs`:

```
1import { blackForestLabs } from '@ai-sdk/black-forest-labs';
```

If you need a customized setup, you can import `createBlackForestLabs` and create a provider instance with your settings:

```
1import { createBlackForestLabs } from '@ai-sdk/black-forest-labs';2
3const blackForestLabs = createBlackForestLabs({4 apiKey: 'your-api-key', // optional, defaults to BFL_API_KEY environment variable5 baseURL: 'custom-url', // optional6 headers: {7 /* custom headers */8 }, // optional9});
```

You can use the following optional settings to customize the Black Forest Labs provider instance:

* **baseURL** _string_
 
 Use a different URL prefix for API calls, e.g. to use a regional endpoint. The default prefix is `https://api.bfl.ai/v1`.
 
* **apiKey** _string_
 
 API key that is being sent using the `x-key` header. It defaults to the `BFL_API_KEY` environment variable.
 
* **headers** _Record<string,string>_
 
 Custom headers to include in the requests.
 
* **fetch** _(input: RequestInfo, init?: RequestInit) => Promise<Response>_
 
 Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation. You can use it as a middleware to intercept requests, or to provide a custom fetch implementation for e.g. testing.
 
* **pollIntervalMillis** _number_
 
 Interval in milliseconds between polling attempts when waiting for image generation to complete. Defaults to 500ms.
 
* **pollTimeoutMillis** _number_
 
 Overall timeout in milliseconds for polling before giving up. Defaults to 60000ms (60 seconds).
 

## [Image Models](#image-models)

You can create Black Forest Labs image models using the `.image()` factory method. For more on image generation with the AI SDK see [generateImage()](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-image).

### [Basic Usage](#basic-usage)

```
1import { writeFileSync } from 'node:fs';2import { blackForestLabs } from '@ai-sdk/black-forest-labs';3import { generateImage } from 'ai';4
5const { image, providerMetadata } = await generateImage({6 model: blackForestLabs.image('flux-pro-1.1'),7 prompt: 'A serene mountain landscape at sunset',8});9
10const filename = `image-${Date.now()}.png`;11writeFileSync(filename, image.uint8Array);12console.log(`Image saved to ${filename}`);
```

### [Model Capabilities](#model-capabilities)

Black Forest Labs offers many models optimized for different use cases. Here are a few popular examples. For a full list of models, see the [Black Forest Labs Models Page](https://bfl.ai/models).

| Model | Description |
| --- | --- |
| `flux-kontext-pro` | FLUX.1 Kontext \[pro\] handles both text and reference images as inputs, enabling targeted edits and complex transformations |
| `flux-kontext-max` | FLUX.1 Kontext \[max\] with improved prompt adherence and typography generation |
| `flux-pro-1.1-ultra` | Ultra-fast, ultra high-resolution image creation |
| `flux-pro-1.1` | Fast, high-quality image generation from text. |
| `flux-pro-1.0-fill` | Inpainting model for filling masked regions of images with new content |

Black Forest Labs models support aspect ratios from 3:7 (portrait) to 7:3 (landscape).

### [Image Editing](#image-editing)

Black Forest Labs Kontext models support powerful image editing capabilities using reference images. Pass input images via `prompt.images` to transform, combine, or edit existing images.

#### [Single Image Editing](#single-image-editing)

Transform an existing image using text prompts:

```
1import {2 blackForestLabs,3 BlackForestLabsImageModelOptions,4} from '@ai-sdk/black-forest-labs';5import { generateImage } from 'ai';6
7const { images } = await generateImage({8 model: blackForestLabs.image('flux-kontext-pro'),9 prompt: {10 text: 'A baby elephant with a shirt that has the logo from the input image.',11 images: [12 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png',13 ],14 },15 providerOptions: {16 blackForestLabs: {17 width: 1024,18 height: 768,19 } satisfies BlackForestLabsImageModelOptions,20 },21});
```

#### [Multi-Reference Editing](#multi-reference-editing)

Combine multiple reference images for complex transformations. Black Forest Labs supports up to 10 input images:

```
1import { blackForestLabs } from '@ai-sdk/black-forest-labs';2import { generateImage } from 'ai';3
4const { images } = await generateImage({5 model: blackForestLabs.image('flux-kontext-pro'),6 prompt: {7 text: 'Combine the style of image 1 with the subject of image 2',8 images: [9 'https://example.com/style-reference.jpg',10 'https://example.com/subject-reference.jpg',11 ],12 },13});
```

Input images can be provided as URLs or base64-encoded strings. They support up to 20MB or 20 megapixels per image.

#### [Inpainting](#inpainting)

The `flux-pro-1.0-fill` model supports inpainting, which allows you to fill masked regions of an image with new content. Pass the source image via `prompt.images` and a mask image via `prompt.mask`:

```
1import { blackForestLabs } from '@ai-sdk/black-forest-labs';2import { generateImage } from 'ai';3
4const { images } = await generateImage({5 model: blackForestLabs.image('flux-pro-1.0-fill'),6 prompt: {7 text: 'A beautiful garden with flowers',8 images: ['https://example.com/source-image.jpg'],9 mask: 'https://example.com/mask-image.png',10 },11});
```

The mask image should be a grayscale image where white areas indicate regions to be filled and black areas indicate regions to preserve.

### [Provider Options](#provider-options)

Black Forest Labs image models support flexible provider options through the `providerOptions.blackForestLabs` object. The supported parameters depend on the used model ID:

* **width** _number_ - Output width in pixels (256–1920). When set, this overrides any width derived from `size`.
* **height** _number_ - Output height in pixels (256–1920). When set, this overrides any height derived from `size`.
* **outputFormat** _string_ - Desired format of the output image (`"jpeg"` or `"png"`).
* **steps** _number_ - Number of inference steps. Higher values may improve quality but increase generation time.
* **guidance** _number_ - Guidance scale for generation. Higher values follow the prompt more closely.
* **imagePrompt** _string_ - Base64-encoded image to use as additional visual context for generation.
* **imagePromptStrength** _number_ - Strength of the image prompt influence on generation (0.0 to 1.0).
* **promptUpsampling** _boolean_ - If true, performs upsampling on the prompt.
* **raw** _boolean_ - Enable raw mode for more natural, authentic aesthetics.
* **safetyTolerance** _number_ - Moderation level for inputs and outputs (0 = most strict, 6 = more permissive).
* **pollIntervalMillis** _number_ - Interval in milliseconds between polling attempts (default 500ms).
* **pollTimeoutMillis** _number_ - Overall timeout in milliseconds for polling before timing out (default 60s).
* **webhookUrl** _string_ - URL for asynchronous completion notification. Must be a valid HTTP/HTTPS URL.
* **webhookSecret** _string_ - Secret for webhook signature verification, sent in the `X-Webhook-Secret` header.

To pass reference images for editing, use `prompt.images` instead of provider options. This supports up to 10 images as URLs or base64-encoded strings.

### [Provider Metadata](#provider-metadata)

The `generateImage` response includes provider-specific metadata in `providerMetadata.blackForestLabs.images[]`. Each image object may contain the following properties:

* **seed** _number_ - The seed used for generation. Useful for reproducing results.
* **start\_time** _number_ - Unix timestamp when generation started.
* **end\_time** _number_ - Unix timestamp when generation completed.
* **duration** _number_ - Generation duration in seconds.
* **cost** _number_ - Cost of the generation request.
* **inputMegapixels** _number_ - Input image size in megapixels.
* **outputMegapixels** _number_ - Output image size in megapixels.

```
1import { blackForestLabs } from '@ai-sdk/black-forest-labs';2import { generateImage } from 'ai';3
4const { image, providerMetadata } = await generateImage({5 model: blackForestLabs.image('flux-pro-1.1'),6 prompt: 'A serene mountain landscape at sunset',7});8
9// Access provider metadata10const metadata = providerMetadata?.blackForestLabs?.images?.[0];11console.log('Seed:', metadata?.seed);12console.log('Cost:', metadata?.cost);13console.log('Duration:', metadata?.duration);
```

### [Regional Endpoints](#regional-endpoints)

By default, requests are sent to `https://api.bfl.ai/v1`. You can select a [regional endpoint](https://docs.bfl.ai/api_integration/integration_guidelines#regional-endpoints) by setting `baseURL` when creating the provider instance:

```
1import { createBlackForestLabs } from '@ai-sdk/black-forest-labs';2
3const blackForestLabs = createBlackForestLabs({4 baseURL: 'https://api.eu.bfl.ai/v1', // or https://api.us.bfl.ai/v15});
```

---
url: https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai
title: "AI SDK Providers: Google Generative AI"
description: "Learn how to use Google Generative AI Provider."
hash: "cc32a2d3551499e5cdf20f6aaac3d758ed99d198ba6a572aa3a88445343c4898"
crawledAt: 2026-03-07T08:05:12.404Z
depth: 2
---

## [Google Generative AI Provider](#google-generative-ai-provider)

The [Google Generative AI](https://ai.google.dev/) provider contains language and embedding model support for the [Google Generative AI](https://ai.google.dev/api/rest) APIs.

## [Setup](#setup)

The Google provider is available in the `@ai-sdk/google` module. You can install it with

pnpm add @ai-sdk/google

## [Provider Instance](#provider-instance)

You can import the default provider instance `google` from `@ai-sdk/google`:

```
1import { google } from '@ai-sdk/google';
```

If you need a customized setup, you can import `createGoogleGenerativeAI` from `@ai-sdk/google` and create a provider instance with your settings:

```
1import { createGoogleGenerativeAI } from '@ai-sdk/google';2
3const google = createGoogleGenerativeAI({4 // custom settings5});
```

You can use the following optional settings to customize the Google Generative AI provider instance:

* **baseURL** _string_
 
 Use a different URL prefix for API calls, e.g. to use proxy servers. The default prefix is `https://generativelanguage.googleapis.com/v1beta`.
 
* **apiKey** _string_
 
 API key that is being sent using the `x-goog-api-key` header. It defaults to the `GOOGLE_GENERATIVE_AI_API_KEY` environment variable.
 
* **headers** _Record<string,string>_
 
 Custom headers to include in the requests.
 
* **fetch** _(input: RequestInfo, init?: RequestInit) => Promise<Response>_
 
 Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation. Defaults to the global `fetch` function. You can use it as a middleware to intercept requests, or to provide a custom fetch implementation for e.g. testing.
 
* **generateId** _() => string_
 
 Optional function to generate unique IDs for each request. Defaults to the SDK's built-in ID generator.
 
* **name** _string_
 
 Custom provider name. Defaults to `'google.generative-ai'`.
 

## [Language Models](#language-models)

You can create models that call the [Google Generative AI API](https://ai.google.dev/api/rest) using the provider instance. The first argument is the model id, e.g. `gemini-2.5-flash`. The models support tool calls and some have multi-modal capabilities.

```
1const model = google('gemini-2.5-flash');
```

You can use Google Generative AI language models to generate text with the `generateText` function:

```
1import { google } from '@ai-sdk/google';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: google('gemini-2.5-flash'),6 prompt: 'Write a vegetarian lasagna recipe for 4 people.',7});
```

Google Generative AI language models can also be used in the `streamText` function and support structured data generation with [`Output`](https://ai-sdk.dev/docs/reference/ai-sdk-core/output) (see [AI SDK Core](https://ai-sdk.dev/docs/ai-sdk-core)).

Google Generative AI also supports some model specific settings that are not part of the [standard call settings](https://ai-sdk.dev/docs/ai-sdk-core/settings). You can pass them as an options argument:

```
1import { google, type GoogleLanguageModelOptions } from '@ai-sdk/google';2
3const model = google('gemini-2.5-flash');4
5await generateText({6 model,7 providerOptions: {8 google: {9 safetySettings: [10 {11 category: 'HARM_CATEGORY_UNSPECIFIED',12 threshold: 'BLOCK_LOW_AND_ABOVE',13 },14 ],15 } satisfies GoogleLanguageModelOptions,16 },17});
```

The following optional provider options are available for Google Generative AI models:

* **cachedContent** _string_
 
 Optional. The name of the cached content used as context to serve the prediction. Format: cachedContents/{cachedContent}
 
* **structuredOutputs** _boolean_
 
 Optional. Enable structured output. Default is true.
 
 This is useful when the JSON Schema contains elements that are not supported by the OpenAPI schema version that Google Generative AI uses. You can use this to disable structured outputs if you need to.
 
 See [Troubleshooting: Schema Limitations](#schema-limitations) for more details.
 
* **safetySettings** _Array<{ category: string; threshold: string }>_
 
 Optional. Safety settings for the model.
 
 * **category** _string_
 
 The category of the safety setting. Can be one of the following:
 
 * `HARM_CATEGORY_UNSPECIFIED`
 * `HARM_CATEGORY_HATE_SPEECH`
 * `HARM_CATEGORY_DANGEROUS_CONTENT`
 * `HARM_CATEGORY_HARASSMENT`
 * `HARM_CATEGORY_SEXUALLY_EXPLICIT`
 * `HARM_CATEGORY_CIVIC_INTEGRITY`
 * **threshold** _string_
 
 The threshold of the safety setting. Can be one of the following:
 
 * `HARM_BLOCK_THRESHOLD_UNSPECIFIED`
 * `BLOCK_LOW_AND_ABOVE`
 * `BLOCK_MEDIUM_AND_ABOVE`
 * `BLOCK_ONLY_HIGH`
 * `BLOCK_NONE`
 * `OFF`
* **responseModalities** _string\[\]_ The modalities to use for the response. The following modalities are supported: `TEXT`, `IMAGE`. When not defined or empty, the model defaults to returning only text.
 
* **thinkingConfig** _{ thinkingLevel?: 'minimal' | 'low' | 'medium' | 'high'; thinkingBudget?: number; includeThoughts?: boolean }_
 
 Optional. Configuration for the model's thinking process. Only supported by specific [Google Generative AI models](https://ai.google.dev/gemini-api/docs/thinking).
 
 * **thinkingLevel** _'minimal' | 'low' | 'medium' | 'high'_
 
 Optional. Controls the thinking depth for Gemini 3 models. Gemini 3.1 Pro supports 'low', 'medium', and 'high', Gemini 3 Pro supports 'low' and 'high', while Gemini 3 Flash supports all four levels: 'minimal', 'low', 'medium', and 'high'. Only supported by Gemini 3 models.
 
 * **thinkingBudget** _number_
 
 Optional. Gives the model guidance on the number of thinking tokens it can use when generating a response. Setting it to 0 disables thinking, if the model supports it. For more information about the possible value ranges for each model see [Google Generative AI thinking documentation](https://ai.google.dev/gemini-api/docs/thinking#set-budget).
 
 This option is for Gemini 2.5 models. Gemini 3 models should use `thinkingLevel` instead.
 
 * **includeThoughts** _boolean_
 
 Optional. If set to true, thought summaries are returned, which are synthesized versions of the model's raw thoughts and offer insights into the model's internal reasoning process.
 
* **imageConfig** _{ aspectRatio?: string, imageSize?: string }_
 
 Optional. Configuration for the models image generation. Only supported by specific [Google Generative AI models](https://ai.google.dev/gemini-api/docs/image-generation).
 
 * **aspectRatio** _string_
 
 Model defaults to generate 1:1 squares, or to matching the output image size to that of your input image. Can be one of the following:
 
 * 1:1
 * 2:3
 * 3:2
 * 3:4
 * 4:3
 * 4:5
 * 5:4
 * 9:16
 * 16:9
 * 21:9
 * **imageSize** _string_
 
 Controls the output image resolution. Defaults to 1K. Can be one of the following:
 
 * 1K
 * 2K
 * 4K
* **audioTimestamp** _boolean_
 
 Optional. Enables timestamp understanding for audio-only files. See [Google Cloud audio understanding documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/audio-understanding).
 
* **mediaResolution** _string_
 
 Optional. If specified, the media resolution specified will be used. Can be one of the following:
 
 * `MEDIA_RESOLUTION_UNSPECIFIED`
 * `MEDIA_RESOLUTION_LOW`
 * `MEDIA_RESOLUTION_MEDIUM`
 * `MEDIA_RESOLUTION_HIGH`
 
 See [Google API MediaResolution documentation](https://ai.google.dev/api/generate-content#MediaResolution).
 
* **labels** _Record<string, string>_
 
 Optional. Defines labels used in billing reports. Available on Vertex AI only. See [Google Cloud labels documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/add-labels-to-api-calls).
 
* **threshold** _string_
 
 Optional. Standalone threshold setting that can be used independently of `safetySettings`. Uses the same values as the `safetySettings` threshold.
 

### [Thinking](#thinking)

The Gemini 2.5 and Gemini 3 series models use an internal "thinking process" that significantly improves their reasoning and multi-step planning abilities, making them highly effective for complex tasks such as coding, advanced mathematics, and data analysis. For more information see [Google Generative AI thinking documentation](https://ai.google.dev/gemini-api/docs/thinking).

#### [Gemini 3 Models](#gemini-3-models)

For Gemini 3 models, use the `thinkingLevel` parameter to control the depth of reasoning:

```
1import { google, GoogleLanguageModelOptions } from '@ai-sdk/google';2import { generateText } from 'ai';3
4const model = google('gemini-3.1-pro-preview');5
6const { text, reasoning } = await generateText({7 model: model,8 prompt: 'What is the sum of the first 10 prime numbers?',9 providerOptions: {10 google: {11 thinkingConfig: {12 thinkingLevel: 'high',13 includeThoughts: true,14 },15 } satisfies GoogleLanguageModelOptions,16 },17});18
19console.log(text);20
21console.log(reasoning); // Reasoning summary
```

#### [Gemini 2.5 Models](#gemini-25-models)

For Gemini 2.5 models, use the `thinkingBudget` parameter to control the number of thinking tokens:

```
1import { google, GoogleLanguageModelOptions } from '@ai-sdk/google';2import { generateText } from 'ai';3
4const model = google('gemini-2.5-flash');5
6const { text, reasoning } = await generateText({7 model: model,8 prompt: 'What is the sum of the first 10 prime numbers?',9 providerOptions: {10 google: {11 thinkingConfig: {12 thinkingBudget: 8192,13 includeThoughts: true,14 },15 } satisfies GoogleLanguageModelOptions,16 },17});18
19console.log(text);20
21console.log(reasoning); // Reasoning summary
```

### [File Inputs](#file-inputs)

The Google Generative AI provider supports file inputs, e.g. PDF files.

```
1import { google } from '@ai-sdk/google';2import { generateText } from 'ai';3
4const result = await generateText({5 model: google('gemini-2.5-flash'),6 messages: [7 {8 role: 'user',9 content: [10 {11 type: 'text',12 text: 'What is an embedding model according to this document?',13 },14 {15 type: 'file',16 data: fs.readFileSync('./data/ai.pdf'),17 mediaType: 'application/pdf',18 },19 ],20 },21 ],22});
```

You can also use YouTube URLs directly:

```
1import { google } from '@ai-sdk/google';2import { generateText } from 'ai';3
4const result = await generateText({5 model: google('gemini-2.5-flash'),6 messages: [7 {8 role: 'user',9 content: [10 {11 type: 'text',12 text: 'Summarize this video',13 },14 {15 type: 'file',16 data: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',17 mediaType: 'video/mp4',18 },19 ],20 },21 ],22});
```

The AI SDK will automatically download URLs if you pass them as data, except for `https://generativelanguage.googleapis.com/v1beta/files/` and YouTube URLs. You can use the Google Generative AI Files API to upload larger files to that location. YouTube URLs (public or unlisted videos) are supported directly

* you can specify one YouTube video URL per request.

See [File Parts](https://ai-sdk.dev/docs/foundations/prompts#file-parts) for details on how to use files in prompts.

### [Cached Content](#cached-content)

Google Generative AI supports both explicit and implicit caching to help reduce costs on repetitive content.

#### [Implicit Caching](#implicit-caching)

Gemini 2.5 models automatically provide cache cost savings without needing to create an explicit cache. When you send requests that share common prefixes with previous requests, you'll receive a 75% token discount on cached content.

To maximize cache hits with implicit caching:

* Keep content at the beginning of requests consistent
* Add variable content (like user questions) at the end of prompts
* Ensure requests meet minimum token requirements:
 * Gemini 2.5 Flash: 1024 tokens minimum
 * Gemini 2.5 Pro: 2048 tokens minimum

```
1import { google } from '@ai-sdk/google';2import { generateText } from 'ai';3
4// Structure prompts with consistent content at the beginning5const baseContext =6 'You are a cooking assistant with expertise in Italian cuisine. Here are 1000 lasagna recipes for reference...';7
8const { text: veggieLasagna } = await generateText({9 model: google('gemini-2.5-pro'),10 prompt: `${baseContext}\n\nWrite a vegetarian lasagna recipe for 4 people.`,11});12
13// Second request with same prefix - eligible for cache hit14const { text: meatLasagna, providerMetadata } = await generateText({15 model: google('gemini-2.5-pro'),16 prompt: `${baseContext}\n\nWrite a meat lasagna recipe for 12 people.`,17});18
19// Check cached token count in usage metadata20console.log('Cached tokens:', providerMetadata.google);21// e.g.22// {23// groundingMetadata: null,24// safetyRatings: null,25// usageMetadata: {26// cachedContentTokenCount: 2027,27// thoughtsTokenCount: 702,28// promptTokenCount: 2152,29// candidatesTokenCount: 710,30// totalTokenCount: 356431// }32// }
```

Usage metadata was added to `providerMetadata` in `@ai-sdk/google@1.2.23`. If you are using an older version, usage metadata is available in the raw HTTP `response` body returned as part of the return value from `generateText`.

#### [Explicit Caching](#explicit-caching)

For guaranteed cost savings, you can still use explicit caching with Gemini 2.5 and 2.0 models. See the [models page](https://ai.google.dev/gemini-api/docs/models) to check if caching is supported for the used model:

```
1import { google, type GoogleLanguageModelOptions } from '@ai-sdk/google';2import { GoogleGenAI } from '@google/genai';3import { generateText } from 'ai';4
5const ai = new GoogleGenAI({6 apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,7});8
9const model = 'gemini-2.5-pro';10
11// Create a cache with the content you want to reuse12const cache = await ai.caches.create({13 model,14 config: {15 contents: [16 {17 role: 'user',18 parts: [{ text: '1000 Lasagna Recipes...' }],19 },20 ],21 ttl: '300s', // Cache expires after 5 minutes22 },23});24
25const { text: veggieLasagnaRecipe } = await generateText({26 model: google(model),27 prompt: 'Write a vegetarian lasagna recipe for 4 people.',28 providerOptions: {29 google: {30 cachedContent: cache.name,31 } satisfies GoogleLanguageModelOptions,32 },33});34
35const { text: meatLasagnaRecipe } = await generateText({36 model: google(model),37 prompt: 'Write a meat lasagna recipe for 12 people.',38 providerOptions: {39 google: {40 cachedContent: cache.name,41 } satisfies GoogleLanguageModelOptions,42 },43});
```

### [Code Execution](#code-execution)

With [Code Execution](https://ai.google.dev/gemini-api/docs/code-execution), certain models can generate and execute Python code to perform calculations, solve problems, or provide more accurate information.

You can enable code execution by adding the `code_execution` tool to your request.

```
1import { google } from '@ai-sdk/google';2import { googleTools } from '@ai-sdk/google/internal';3import { generateText } from 'ai';4
5const { text, toolCalls, toolResults } = await generateText({6 model: google('gemini-2.5-pro'),7 tools: { code_execution: google.tools.codeExecution({}) },8 prompt: 'Use python to calculate the 20th fibonacci number.',9});
```

The response will contain the tool calls and results from the code execution.

### [Google Search](#google-search)

With [Google Search grounding](https://ai.google.dev/gemini-api/docs/google-search), the model has access to the latest information using Google Search.

```
1import { google } from '@ai-sdk/google';2import { GoogleGenerativeAIProviderMetadata } from '@ai-sdk/google';3import { generateText } from 'ai';4
5const { text, sources, providerMetadata } = await generateText({6 model: google('gemini-2.5-flash'),7 tools: {8 google_search: google.tools.googleSearch({}),9 },10 prompt:11 'List the top 5 San Francisco news from the past week.' +12 'You must include the date of each article.',13});14
15// access the grounding metadata. Casting to the provider metadata type16// is optional but provides autocomplete and type safety.17const metadata = providerMetadata?.google as18 | GoogleGenerativeAIProviderMetadata19 | undefined;20const groundingMetadata = metadata?.groundingMetadata;21const safetyRatings = metadata?.safetyRatings;
```

The `googleSearch` tool accepts the following optional configuration options:

* **searchTypes** _object_
 
 Enables specific search types. Both can be combined.
 
 * `webSearch`: Enable web search grounding (pass `{}` to enable). This is the default.
 * `imageSearch`: Enable [image search grounding](https://ai.google.dev/gemini-api/docs/image-generation#image-search) (pass `{}` to enable).
* **timeRangeFilter** _object_
 
 Restricts search results to a specific time range. Both `startTime` and `endTime` are required.
 
 * `startTime`: Start time in ISO 8601 format (e.g. `'2025-01-01T00:00:00Z'`).
 * `endTime`: End time in ISO 8601 format (e.g. `'2025-12-31T23:59:59Z'`).

```
1google.tools.googleSearch({2 searchTypes: { webSearch: {} },3 timeRangeFilter: {4 startTime: '2025-01-01T00:00:00Z',5 endTime: '2025-12-31T23:59:59Z',6 },7});
```

When Google Search grounding is enabled, the model will include sources in the response.

Additionally, the grounding metadata includes detailed information about how search results were used to ground the model's response. Here are the available fields:

* **`webSearchQueries`** (`string[] | null`)
 
 * Array of search queries used to retrieve information
 * Example: `["What's the weather in Chicago this weekend?"]`
* **`searchEntryPoint`** (`{ renderedContent: string } | null`)
 
 * Contains the main search result content used as an entry point
 * The `renderedContent` field contains the formatted content
* **`groundingSupports`** (Array of support objects | null)
 
 * Contains details about how specific response parts are supported by search results
 * Each support object includes:
 * **`segment`**: Information about the grounded text segment
 * `text`: The actual text segment
 * `startIndex`: Starting position in the response
 * `endIndex`: Ending position in the response
 * **`groundingChunkIndices`**: References to supporting search result chunks
 * **`confidenceScores`**: Confidence scores (0-1) for each supporting chunk

Example response:

```
1{2 "groundingMetadata": {3 "webSearchQueries": ["What's the weather in Chicago this weekend?"],4 "searchEntryPoint": {5 "renderedContent": "..."6 },7 "groundingSupports": [8 {9 "segment": {10 "startIndex": 0,11 "endIndex": 65,12 "text": "Chicago weather changes rapidly, so layers let you adjust easily."13 },14 "groundingChunkIndices": [0],15 "confidenceScores": [0.99]16 }17 ]18 }19}
```

### [Enterprise Web Search](#enterprise-web-search)

With [Enterprise Web Search](https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/web-grounding-enterprise), the model has access to a compliance-focused web index designed for highly-regulated industries such as finance, healthcare, and public sector.

Enterprise Web Search is only available on Vertex AI. You must use the Google Vertex provider (`@ai-sdk/google-vertex`) instead of the standard Google provider (`@ai-sdk/google`) to use this feature. Requires Gemini 2.0 or newer models.

```
1import { createVertex } from '@ai-sdk/google-vertex';2import { generateText } from 'ai';3
4const vertex = createVertex({5 project: 'my-project',6 location: 'us-central1',7});8
9const { text, sources, providerMetadata } = await generateText({10 model: vertex('gemini-2.5-flash'),11 tools: {12 enterprise_web_search: vertex.tools.enterpriseWebSearch({}),13 },14 prompt: 'What are the latest regulatory updates for financial services?',15});
```

Enterprise Web Search provides the following benefits:

* Does not log customer data
* Supports VPC service controls
* Compliance-focused web index for regulated industries

### [File Search](#file-search)

The [File Search tool](https://ai.google.dev/gemini-api/docs/file-search) lets Gemini retrieve context from your own documents that you have indexed in File Search stores. Only Gemini 2.5 and Gemini 3 models support this feature.

```
1import { google } from '@ai-sdk/google';2import { generateText } from 'ai';3
4const { text, sources } = await generateText({5 model: google('gemini-2.5-pro'),6 tools: {7 file_search: google.tools.fileSearch({8 fileSearchStoreNames: [9 'projects/my-project/locations/us/fileSearchStores/my-store',10 ],11 metadataFilter: 'author = "Robert Graves"',12 topK: 8,13 }),14 },15 prompt: "Summarise the key themes of 'I, Claudius'.",16});
```

File Search responses include citations via the normal `sources` field and expose raw [grounding metadata](#google-search) in `providerMetadata.google.groundingMetadata`.

### [URL Context](#url-context)

Google provides a provider-defined URL context tool.

The URL context tool allows you to provide specific URLs that you want the model to analyze directly in from the prompt.

```
1import { google } from '@ai-sdk/google';2import { generateText } from 'ai';3
4const { text, sources, providerMetadata } = await generateText({5 model: google('gemini-2.5-flash'),6 prompt: `Based on the document: https://ai.google.dev/gemini-api/docs/url-context.7 Answer this question: How many links we can consume in one request?`,8 tools: {9 url_context: google.tools.urlContext({}),10 },11});12
13const metadata = providerMetadata?.google as14 | GoogleGenerativeAIProviderMetadata15 | undefined;16const groundingMetadata = metadata?.groundingMetadata;17const urlContextMetadata = metadata?.urlContextMetadata;
```

The URL context metadata includes detailed information about how the model used the URL context to generate the response. Here are the available fields:

* **`urlMetadata`** (`{ retrievedUrl: string; urlRetrievalStatus: string; }[] | null`)
 
 * Array of URL context metadata
 * Each object includes:
 * **`retrievedUrl`**: The URL of the context
 * **`urlRetrievalStatus`**: The status of the URL retrieval

Example response:

```
1{2 "urlMetadata": [3 {4 "retrievedUrl": "https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai",5 "urlRetrievalStatus": "URL_RETRIEVAL_STATUS_SUCCESS"6 }7 ]8}
```

With the URL context tool, you will also get the `groundingMetadata`.

```
1"groundingMetadata": {2 "groundingChunks": [3 {4 "web": {5 "uri": "https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai",6 "title": "Google Generative AI - AI SDK Providers"7 }8 }9 ],10 "groundingSupports": [11 {12 "segment": {13 "startIndex": 67,14 "endIndex": 157,15 "text": "**Installation**: Install the `@ai-sdk/google` module using your preferred package manager"16 },17 "groundingChunkIndices": [18 019 ]20 },21 ]22}
```

You can add up to 20 URLs per request.

#### [Combine URL Context with Search Grounding](#combine-url-context-with-search-grounding)

You can combine the URL context tool with search grounding to provide the model with the latest information from the web.

```
1import { google } from '@ai-sdk/google';2import { generateText } from 'ai';3
4const { text, sources, providerMetadata } = await generateText({5 model: google('gemini-2.5-flash'),6 prompt: `Based on this context: https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai, tell me how to use Gemini with AI SDK.7 Also, provide the latest news about AI SDK V5.`,8 tools: {9 google_search: google.tools.googleSearch({}),10 url_context: google.tools.urlContext({}),11 },12});13
14const metadata = providerMetadata?.google as15 | GoogleGenerativeAIProviderMetadata16 | undefined;17const groundingMetadata = metadata?.groundingMetadata;18const urlContextMetadata = metadata?.urlContextMetadata;
```

### [Google Maps Grounding](#google-maps-grounding)

With [Google Maps grounding](https://ai.google.dev/gemini-api/docs/maps-grounding), the model has access to Google Maps data for location-aware responses. This enables providing local data and geospatial context, such as finding nearby restaurants.

```
1import { google, type GoogleLanguageModelOptions } from '@ai-sdk/google';2import { GoogleGenerativeAIProviderMetadata } from '@ai-sdk/google';3import { generateText } from 'ai';4
5const { text, sources, providerMetadata } = await generateText({6 model: google('gemini-2.5-flash'),7 tools: {8 google_maps: google.tools.googleMaps({}),9 },10 providerOptions: {11 google: {12 retrievalConfig: {13 latLng: { latitude: 34.090199, longitude: -117.881081 },14 },15 } satisfies GoogleLanguageModelOptions,16 },17 prompt:18 'What are the best Italian restaurants within a 15-minute walk from here?',19});20
21const metadata = providerMetadata?.google as22 | GoogleGenerativeAIProviderMetadata23 | undefined;24const groundingMetadata = metadata?.groundingMetadata;
```

The optional `retrievalConfig.latLng` provider option provides location context for queries about nearby places. This configuration applies to any grounding tools that support location context, including Google Maps and Google Search.

When Google Maps grounding is enabled, the model's response will include sources pointing to Google Maps URLs. The grounding metadata includes `maps` chunks with place information:

```
1{2 "groundingMetadata": {3 "groundingChunks": [4 {5 "maps": {6 "uri": "https://maps.google.com/?cid=12345",7 "title": "Restaurant Name",8 "placeId": "places/ChIJ..."9 }10 }11 ]12 }13}
```

Google Maps grounding is supported on Gemini 2.0 and newer models.

### [RAG Engine Grounding](#rag-engine-grounding)

With [RAG Engine Grounding](https://cloud.google.com/vertex-ai/generative-ai/docs/rag-engine/use-vertexai-search#generate-content-using-gemini-api), the model has access to your custom knowledge base using the Vertex RAG Engine. This enables the model to provide answers based on your specific data sources and documents.

RAG Engine Grounding is only supported with Vertex Gemini models. You must use the Google Vertex provider (`@ai-sdk/google-vertex`) instead of the standard Google provider (`@ai-sdk/google`) to use this feature.

```
1import { createVertex } from '@ai-sdk/google-vertex';2import { GoogleGenerativeAIProviderMetadata } from '@ai-sdk/google';3import { generateText } from 'ai';4
5const vertex = createVertex({6 project: 'my-project',7 location: 'us-central1',8});9
10const { text, sources, providerMetadata } = await generateText({11 model: vertex('gemini-2.5-flash'),12 tools: {13 vertex_rag_store: vertex.tools.vertexRagStore({14 ragCorpus:15 'projects/my-project/locations/us-central1/ragCorpora/my-rag-corpus',16 topK: 5,17 }),18 },19 prompt:20 'What are the key features of our product according to our documentation?',21});22
23// access the grounding metadata. Casting to the provider metadata type24// is optional but provides autocomplete and type safety.25const metadata = providerMetadata?.google as26 | GoogleGenerativeAIProviderMetadata27 | undefined;28const groundingMetadata = metadata?.groundingMetadata;29const safetyRatings = metadata?.safetyRatings;
```

When RAG Engine Grounding is enabled, the model will include sources from your RAG corpus in the response.

Additionally, the grounding metadata includes detailed information about how RAG results were used to ground the model's response. Here are the available fields:

* **`groundingChunks`** (Array of chunk objects | null)
 
 * Contains the retrieved context chunks from your RAG corpus
 * Each chunk includes:
 * **`retrievedContext`**: Information about the retrieved context
 * `uri`: The URI or identifier of the source document
 * `title`: The title of the source document (optional)
 * `text`: The actual text content of the chunk
* **`groundingSupports`** (Array of support objects | null)
 
 * Contains details about how specific response parts are supported by RAG results
 * Each support object includes:
 * **`segment`**: Information about the grounded text segment
 * `text`: The actual text segment
 * `startIndex`: Starting position in the response
 * `endIndex`: Ending position in the response
 * **`groundingChunkIndices`**: References to supporting RAG result chunks
 * **`confidenceScores`**: Confidence scores (0-1) for each supporting chunk

Example response:

```
1{2 "groundingMetadata": {3 "groundingChunks": [4 {5 "retrievedContext": {6 "uri": "gs://my-bucket/docs/product-guide.pdf",7 "title": "Product User Guide",8 "text": "Our product includes advanced AI capabilities, real-time processing, and enterprise-grade security features."9 }10 }11 ],12 "groundingSupports": [13 {14 "segment": {15 "startIndex": 0,16 "endIndex": 45,17 "text": "Our product includes advanced AI capabilities and real-time processing."18 },19 "groundingChunkIndices": [0],20 "confidenceScores": [0.95]21 }22 ]23 }24}
```

#### [Configuration Options](#configuration-options)

The `vertexRagStore` tool accepts the following configuration options:

* **`ragCorpus`** (`string`, required)
 
 * The RagCorpus resource name in the format: `projects/{project}/locations/{location}/ragCorpora/{rag_corpus}`
 * This identifies your specific RAG corpus to search against
* **`topK`** (`number`, optional)
 
 * The number of top contexts to retrieve from your RAG corpus
 * Defaults to the corpus configuration if not specified

### [Image Outputs](#image-outputs)

Gemini models with image generation capabilities (e.g. `gemini-2.5-flash-image`) support generating images as part of a multimodal response. Images are exposed as files in the response.

```
1import { google } from '@ai-sdk/google';2import { generateText } from 'ai';3
4const result = await generateText({5 model: google('gemini-2.5-flash-image'),6 prompt:7 'Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme',8});9
10for (const file of result.files) {11 if (file.mediaType.startsWith('image/')) {12 console.log('Generated image:', file);13 }14}
```

If you primarily want to generate images without text output, you can also use Gemini image models with the `generateImage()` function. See [Gemini Image Models](#gemini-image-models) for details.

### [Safety Ratings](#safety-ratings)

The safety ratings provide insight into the safety of the model's response. See [Google AI documentation on safety settings](https://ai.google.dev/gemini-api/docs/safety-settings).

Example response excerpt:

```
1{2 "safetyRatings": [3 {4 "category": "HARM_CATEGORY_HATE_SPEECH",5 "probability": "NEGLIGIBLE",6 "probabilityScore": 0.11027937,7 "severity": "HARM_SEVERITY_LOW",8 "severityScore": 0.284874359 },10 {11 "category": "HARM_CATEGORY_DANGEROUS_CONTENT",12 "probability": "HIGH",13 "blocked": true,14 "probabilityScore": 0.95422274,15 "severity": "HARM_SEVERITY_MEDIUM",16 "severityScore": 0.4339814517 },18 {19 "category": "HARM_CATEGORY_HARASSMENT",20 "probability": "NEGLIGIBLE",21 "probabilityScore": 0.11085559,22 "severity": "HARM_SEVERITY_NEGLIGIBLE",23 "severityScore": 0.1902722324 },25 {26 "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",27 "probability": "NEGLIGIBLE",28 "probabilityScore": 0.22901751,29 "severity": "HARM_SEVERITY_NEGLIGIBLE",30 "severityScore": 0.0908967531 }32 ]33}
```

### [Troubleshooting](#troubleshooting)

#### [Schema Limitations](#schema-limitations)

The Google Generative AI API uses a subset of the OpenAPI 3.0 schema, which does not support features such as unions. The errors that you get in this case look like this:

`GenerateContentRequest.generation_config.response_schema.properties[occupation].type: must be specified`

By default, structured outputs are enabled (and for tool calling they are required). You can disable structured outputs for object generation as a workaround:

```
1const { output } = await generateText({2 model: google('gemini-2.5-flash'),3 providerOptions: {4 google: {5 structuredOutputs: false,6 } satisfies GoogleLanguageModelOptions,7 },8 output: Output.object({9 schema: z.object({10 name: z.string(),11 age: z.number(),12 contact: z.union([13 z.object({14 type: z.literal('email'),15 value: z.string(),16 }),17 z.object({18 type: z.literal('phone'),19 value: z.string(),20 }),21 ]),22 }),23 }),24 prompt: 'Generate an example person for testing.',25});
```

The following Zod features are known to not work with Google Generative AI:

* `z.union`
* `z.record`

### [Model Capabilities](#model-capabilities)

| Model | Image Input | Object Generation | Tool Usage | Tool Streaming | Google Search | URL Context |
| --- | --- | --- | --- | --- | --- | --- |
| `gemini-3.1-pro-preview` | | | | | | |
| `gemini-3.1-flash-image-preview` | | | | | | |
| `gemini-3.1-flash-lite-preview` | | | | | | |
| `gemini-3-pro-preview` | | | | | | |
| `gemini-3-pro-image-preview` | | | | | | |
| `gemini-3-flash-preview` | | | | | | |
| `gemini-2.5-pro` | | | | | | |
| `gemini-2.5-flash` | | | | | | |
| `gemini-2.5-flash-lite` | | | | | | |
| `gemini-2.5-flash-lite-preview-06-17` | | | | | | |
| `gemini-2.0-flash` | | | | | | |

The table above lists popular models. Please see the [Google Generative AI docs](https://ai.google.dev/gemini-api/docs/models/) for a full list of available models. The table above lists popular models. You can also pass any available provider model ID as a string if needed.

## [Gemma Models](#gemma-models)

You can use [Gemma models](https://deepmind.google/models/gemma/) with the Google Generative AI API. The following Gemma models are available:

* `gemma-3-27b-it`
* `gemma-3-12b-it`

Gemma models don't natively support the `systemInstruction` parameter, but the provider automatically handles system instructions by prepending them to the first user message. This allows you to use system instructions with Gemma models seamlessly:

```
1import { google } from '@ai-sdk/google';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: google('gemma-3-27b-it'),6 system: 'You are a helpful assistant that responds concisely.',7 prompt: 'What is machine learning?',8});
```

The system instruction is automatically formatted and included in the conversation, so Gemma models can follow the guidance without any additional configuration.

## [Embedding Models](#embedding-models)

You can create models that call the [Google Generative AI embeddings API](https://ai.google.dev/gemini-api/docs/embeddings) using the `.embedding()` factory method.

```
1const model = google.embedding('gemini-embedding-001');
```

The Google Generative AI provider sends API calls to the right endpoint based on the type of embedding:

* **Single embeddings**: When embedding a single value with `embed()`, the provider uses the single `:embedContent` endpoint, which typically has higher rate limits compared to the batch endpoint.
* **Batch embeddings**: When embedding multiple values with `embedMany()` or multiple values in `embed()`, the provider uses the `:batchEmbedContents` endpoint.

Google Generative AI embedding models support additional settings. You can pass them as an options argument:

```
1import { google, type GoogleEmbeddingModelOptions } from '@ai-sdk/google';2import { embed } from 'ai';3
4const model = google.embedding('gemini-embedding-001');5
6const { embedding } = await embed({7 model,8 value: 'sunny day at the beach',9 providerOptions: {10 google: {11 outputDimensionality: 512, // optional, number of dimensions for the embedding12 taskType: 'SEMANTIC_SIMILARITY', // optional, specifies the task type for generating embeddings13 } satisfies GoogleEmbeddingModelOptions,14 },15});
```

The following optional provider options are available for Google Generative AI embedding models:

* **outputDimensionality**: _number_
 
 Optional reduced dimension for the output embedding. If set, excessive values in the output embedding are truncated from the end.
 
* **taskType**: _string_
 
 Optional. Specifies the task type for generating embeddings. Supported task types include:
 
 * `SEMANTIC_SIMILARITY`: Optimized for text similarity.
 * `CLASSIFICATION`: Optimized for text classification.
 * `CLUSTERING`: Optimized for clustering texts based on similarity.
 * `RETRIEVAL_DOCUMENT`: Optimized for document retrieval.
 * `RETRIEVAL_QUERY`: Optimized for query-based retrieval.
 * `QUESTION_ANSWERING`: Optimized for answering questions.
 * `FACT_VERIFICATION`: Optimized for verifying factual information.
 * `CODE_RETRIEVAL_QUERY`: Optimized for retrieving code blocks based on natural language queries.

### [Model Capabilities](#model-capabilities-1)

| Model | Default Dimensions | Custom Dimensions |
| --- | --- | --- |
| `gemini-embedding-001` | 3072 | |

## [Image Models](#image-models)

You can create image models that call the Google Generative AI API using the `.image()` factory method. For more on image generation with the AI SDK see [generateImage()](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-image).

The Google provider supports two types of image models:

* **Imagen models**: Dedicated image generation models using the `:predict` API
* **Gemini image models**: Multimodal language models with image output capabilities using the `:generateContent` API

### [Imagen Models](#imagen-models)

[Imagen](https://ai.google.dev/gemini-api/docs/imagen) models are dedicated image generation models.

```
1import { google } from '@ai-sdk/google';2import { generateImage } from 'ai';3
4const { image } = await generateImage({5 model: google.image('imagen-4.0-generate-001'),6 prompt: 'A futuristic cityscape at sunset',7 aspectRatio: '16:9',8});
```

Further configuration can be done using Google provider options. You can validate the provider options using the `GoogleImageModelOptions` type.

```
1import { google } from '@ai-sdk/google';2import { GoogleImageModelOptions } from '@ai-sdk/google';3import { generateImage } from 'ai';4
5const { image } = await generateImage({6 model: google.image('imagen-4.0-generate-001'),7 providerOptions: {8 google: {9 personGeneration: 'dont_allow',10 } satisfies GoogleImageModelOptions,11 },12 //...13});
```

The following provider options are available for Imagen models:

* **personGeneration** `allow_adult` | `allow_all` | `dont_allow` Whether to allow person generation. Defaults to `allow_adult`.

Imagen models do not support the `size` parameter. Use the `aspectRatio` parameter instead.

#### [Imagen Model Capabilities](#imagen-model-capabilities)

| Model | Aspect Ratios |
| --- | --- |
| `imagen-4.0-generate-001` | 1:1, 3:4, 4:3, 9:16, 16:9 |
| `imagen-4.0-ultra-generate-001` | 1:1, 3:4, 4:3, 9:16, 16:9 |
| `imagen-4.0-fast-generate-001` | 1:1, 3:4, 4:3, 9:16, 16:9 |

### [Gemini Image Models](#gemini-image-models)

[Gemini image models](https://ai.google.dev/gemini-api/docs/image-generation) (e.g. `gemini-2.5-flash-image`) are technically multimodal output language models, but they can be used with the `generateImage()` function for a simpler image generation experience. Internally, the provider calls the language model API with `responseModalities: ['IMAGE']`.

```
1import { google } from '@ai-sdk/google';2import { generateImage } from 'ai';3
4const { image } = await generateImage({5 model: google.image('gemini-2.5-flash-image'),6 prompt: 'A photorealistic image of a cat wearing a wizard hat',7 aspectRatio: '1:1',8});
```

Gemini image models also support image editing by providing input images:

```
1import { google } from '@ai-sdk/google';2import { generateImage } from 'ai';3import fs from 'node:fs';4
5const sourceImage = fs.readFileSync('./cat.png');6
7const { image } = await generateImage({8 model: google.image('gemini-2.5-flash-image'),9 prompt: {10 text: 'Add a small wizard hat to this cat',11 images: [sourceImage],12 },13});
```

You can also use URLs for input images:

```
1import { google } from '@ai-sdk/google';2import { generateImage } from 'ai';3
4const { image } = await generateImage({5 model: google.image('gemini-2.5-flash-image'),6 prompt: {7 text: 'Add a small wizard hat to this cat',8 images: ['https://example.com/cat.png'],9 },10});
```

Gemini image models do not support the `size` or `n` parameters. Use `aspectRatio` instead of `size`. Mask-based inpainting is also not supported.

For more advanced use cases where you need both text and image outputs, or want more control over the generation process, you can use Gemini image models directly with `generateText()`. See [Image Outputs](#image-outputs) for details.

#### [Gemini Image Model Capabilities](#gemini-image-model-capabilities)

| Model | Image Generation | Image Editing | Aspect Ratios |
| --- | --- | --- | --- |
| `gemini-2.5-flash-image` | | | 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9 |
| `gemini-3-pro-image-preview` | | | 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9 |
| `gemini-3.1-flash-image-preview` | | | 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9 |

`gemini-3-pro-image-preview` supports additional features including up to 14 reference images for editing (6 objects, 5 humans), resolution options (1K, 2K, 4K via `providerOptions.google.imageConfig.imageSize`), and Google Search grounding.

---
url: https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex
title: "AI SDK Providers: Google Vertex AI"
description: "Learn how to use the Google Vertex AI provider."
hash: "049a5c660a12ea0e6d88cd6b7f5e408263a525ab70e7cfce8c6ccfa4ea0cd307"
crawledAt: 2026-03-07T08:05:18.987Z
depth: 2
---

## [Google Vertex Provider](#google-vertex-provider)

The Google Vertex provider for the [AI SDK](https://ai-sdk.dev/docs) contains language model support for the [Google Vertex AI](https://cloud.google.com/vertex-ai) APIs. This includes support for [Google's Gemini models](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models) and [Anthropic's Claude partner models](https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/use-claude).

The Google Vertex provider is compatible with both Node.js and Edge runtimes. The Edge runtime is supported through the `@ai-sdk/google-vertex/edge` sub-module. More details can be found in the [Google Vertex Edge Runtime](#google-vertex-edge-runtime) and [Google Vertex Anthropic Edge Runtime](#google-vertex-anthropic-edge-runtime) sections below.

## [Setup](#setup)

The Google Vertex and Google Vertex Anthropic providers are both available in the `@ai-sdk/google-vertex` module. You can install it with

pnpm add @ai-sdk/google-vertex

## [Google Vertex Provider Usage](#google-vertex-provider-usage)

The Google Vertex provider instance is used to create model instances that call the Vertex AI API. The models available with this provider include [Google's Gemini models](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models). If you're looking to use [Anthropic's Claude models](https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/use-claude), see the [Google Vertex Anthropic Provider](#google-vertex-anthropic-provider-usage) section below.

### [Provider Instance](#provider-instance)

You can import the default provider instance `vertex` from `@ai-sdk/google-vertex`:

```
1import { vertex } from '@ai-sdk/google-vertex';
```

If you need a customized setup, you can import `createVertex` from `@ai-sdk/google-vertex` and create a provider instance with your settings:

```
1import { createVertex } from '@ai-sdk/google-vertex';2
3const vertex = createVertex({4 project: 'my-project', // optional5 location: 'us-central1', // optional6});
```

Google Vertex supports multiple authentication methods depending on your runtime environment and requirements.

#### [Node.js Runtime](#nodejs-runtime)

The Node.js runtime is the default runtime supported by the AI SDK. It supports all standard Google Cloud authentication options through the [`google-auth-library`](https://github.com/googleapis/google-auth-library-nodejs?tab=readme-ov-file#ways-to-authenticate). Typical use involves setting a path to a json credentials file in the `GOOGLE_APPLICATION_CREDENTIALS` environment variable. The credentials file can be obtained from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

If you want to customize the Google authentication options you can pass them as options to the `createVertex` function, for example:

```
1import { createVertex } from '@ai-sdk/google-vertex';2
3const vertex = createVertex({4 googleAuthOptions: {5 credentials: {6 client_email: 'my-email',7 private_key: 'my-private-key',8 },9 },10});
```

##### [Optional Provider Settings](#optional-provider-settings)

You can use the following optional settings to customize the provider instance:

* **project** _string_
 
 The Google Cloud project ID that you want to use for the API calls. It uses the `GOOGLE_VERTEX_PROJECT` environment variable by default.
 
* **location** _string_
 
 The Google Cloud location that you want to use for the API calls, e.g. `us-central1`. It uses the `GOOGLE_VERTEX_LOCATION` environment variable by default.
 
* **googleAuthOptions** _object_
 
 Optional. The Authentication options used by the [Google Auth Library](https://github.com/googleapis/google-auth-library-nodejs/). See also the [GoogleAuthOptions](https://github.com/googleapis/google-auth-library-nodejs/blob/08978822e1b7b5961f0e355df51d738e012be392/src/auth/googleauth.ts#L87C18-L87C35) interface.
 
 * **authClient** _object_ An `AuthClient` to use.
 
 * **keyFilename** _string_ Path to a.json,.pem, or.p12 key file.
 
 * **keyFile** _string_ Path to a.json,.pem, or.p12 key file.
 
 * **credentials** _object_ Object containing client\_email and private\_key properties, or the external account client options.
 
 * **clientOptions** _object_ Options object passed to the constructor of the client.
 
 * **scopes** _string | string\[\]_ Required scopes for the desired API request.
 
 * **projectId** _string_ Your project ID.
 
 * **universeDomain** _string_ The default service domain for a given Cloud universe.
 
* **headers** _Resolvable<Record<string, string | undefined>>_
 
 Headers to include in the requests. Can be provided in multiple formats:
 
 * A record of header key-value pairs: `Record<string, string | undefined>`
 * A function that returns headers: `() => Record<string, string | undefined>`
 * An async function that returns headers: `async () => Record<string, string | undefined>`
 * A promise that resolves to headers: `Promise<Record<string, string | undefined>>`
* **fetch** _(input: RequestInfo, init?: RequestInit) => Promise<Response>_
 
 Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation. Defaults to the global `fetch` function. You can use it as a middleware to intercept requests, or to provide a custom fetch implementation for e.g. testing.
 
* **baseURL** _string_
 
 Optional. Base URL for the Google Vertex API calls e.g. to use proxy servers. By default, it is constructed using the location and project: `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google`
 

#### [Edge Runtime](#edge-runtime)

Edge runtimes (like Vercel Edge Functions and Cloudflare Workers) are lightweight JavaScript environments that run closer to users at the network edge. They only provide a subset of the standard Node.js APIs. For example, direct file system access is not available, and many Node.js-specific libraries (including the standard Google Auth library) are not compatible.

The Edge runtime version of the Google Vertex provider supports Google's [Application Default Credentials](https://github.com/googleapis/google-auth-library-nodejs?tab=readme-ov-file#application-default-credentials) through environment variables. The values can be obtained from a json credentials file from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

You can import the default provider instance `vertex` from `@ai-sdk/google-vertex/edge`:

```
1import { vertex } from '@ai-sdk/google-vertex/edge';
```

The `/edge` sub-module is included in the `@ai-sdk/google-vertex` package, so you don't need to install it separately. You must import from `@ai-sdk/google-vertex/edge` to differentiate it from the Node.js provider.

If you need a customized setup, you can import `createVertex` from `@ai-sdk/google-vertex/edge` and create a provider instance with your settings:

```
1import { createVertex } from '@ai-sdk/google-vertex/edge';2
3const vertex = createVertex({4 project: 'my-project', // optional5 location: 'us-central1', // optional6});
```

For Edge runtime authentication, you'll need to set these environment variables from your Google Default Application Credentials JSON file:

* `GOOGLE_CLIENT_EMAIL`
* `GOOGLE_PRIVATE_KEY`
* `GOOGLE_PRIVATE_KEY_ID` (optional)

These values can be obtained from a service account JSON file from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

##### [Optional Provider Settings](#optional-provider-settings-1)

You can use the following optional settings to customize the provider instance:

* **project** _string_
 
 The Google Cloud project ID that you want to use for the API calls. It uses the `GOOGLE_VERTEX_PROJECT` environment variable by default.
 
* **location** _string_
 
 The Google Cloud location that you want to use for the API calls, e.g. `us-central1`. It uses the `GOOGLE_VERTEX_LOCATION` environment variable by default.
 
* **googleCredentials** _object_
 
 Optional. The credentials used by the Edge provider for authentication. These credentials are typically set through environment variables and are derived from a service account JSON file.
 
 * **clientEmail** _string_ The client email from the service account JSON file. Defaults to the contents of the `GOOGLE_CLIENT_EMAIL` environment variable.
 
 * **privateKey** _string_ The private key from the service account JSON file. Defaults to the contents of the `GOOGLE_PRIVATE_KEY` environment variable.
 
 * **privateKeyId** _string_ The private key ID from the service account JSON file (optional). Defaults to the contents of the `GOOGLE_PRIVATE_KEY_ID` environment variable.
 
* **headers** _Resolvable<Record<string, string | undefined>>_
 
 Headers to include in the requests. Can be provided in multiple formats:
 
 * A record of header key-value pairs: `Record<string, string | undefined>`
 * A function that returns headers: `() => Record<string, string | undefined>`
 * An async function that returns headers: `async () => Record<string, string | undefined>`
 * A promise that resolves to headers: `Promise<Record<string, string | undefined>>`
* **fetch** _(input: RequestInfo, init?: RequestInit) => Promise<Response>_
 
 Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation. Defaults to the global `fetch` function. You can use it as a middleware to intercept requests, or to provide a custom fetch implementation for e.g. testing.
 

#### [Express Mode](#express-mode)

Express mode provides a simplified authentication method using an API key instead of OAuth or service account credentials. When using express mode, the `project` and `location` settings are not required.

```
1import { createVertex } from '@ai-sdk/google-vertex';2
3const vertex = createVertex({4 apiKey: process.env.GOOGLE_VERTEX_API_KEY,5});
```

##### [Optional Provider Settings](#optional-provider-settings-2)

* **apiKey** _string_
 
 The API key for Google Vertex AI. When provided, the provider uses express mode with API key authentication instead of OAuth. It uses the `GOOGLE_VERTEX_API_KEY` environment variable by default.
 

### [Language Models](#language-models)

You can create models that call the Vertex API using the provider instance. The first argument is the model id, e.g. `gemini-2.5-pro`.

```
1const model = vertex('gemini-2.5-pro');
```

If you are using [your own models](https://cloud.google.com/vertex-ai/docs/training-overview), the name of your model needs to start with `projects/`.

Google Vertex models support also some model specific settings that are not part of the [standard call settings](https://ai-sdk.dev/docs/ai-sdk-core/settings). You can pass them as an options argument:

```
1import { vertex } from '@ai-sdk/google-vertex';2import { type GoogleLanguageModelOptions } from '@ai-sdk/google';3
4const model = vertex('gemini-2.5-pro');5
6await generateText({7 model,8 providerOptions: {9 vertex: {10 safetySettings: [11 {12 category: 'HARM_CATEGORY_UNSPECIFIED',13 threshold: 'BLOCK_LOW_AND_ABOVE',14 },15 ],16 } satisfies GoogleLanguageModelOptions,17 },18});
```

The following optional provider options are available for Google Vertex models:

* **cachedContent** _string_
 
 Optional. The name of the cached content used as context to serve the prediction. Format: projects/{project}/locations/{location}/cachedContents/{cachedContent}
 
* **structuredOutputs** _boolean_
 
 Optional. Enable structured output. Default is true.
 
 This is useful when the JSON Schema contains elements that are not supported by the OpenAPI schema version that Google Vertex uses. You can use this to disable structured outputs if you need to.
 
 See [Troubleshooting: Schema Limitations](#schema-limitations) for more details.
 
* **safetySettings** _Array<{ category: string; threshold: string }>_
 
 Optional. Safety settings for the model.
 
 * **category** _string_
 
 The category of the safety setting. Can be one of the following:
 
 * `HARM_CATEGORY_UNSPECIFIED`
 * `HARM_CATEGORY_HATE_SPEECH`
 * `HARM_CATEGORY_DANGEROUS_CONTENT`
 * `HARM_CATEGORY_HARASSMENT`
 * `HARM_CATEGORY_SEXUALLY_EXPLICIT`
 * `HARM_CATEGORY_CIVIC_INTEGRITY`
 * **threshold** _string_
 
 The threshold of the safety setting. Can be one of the following:
 
 * `HARM_BLOCK_THRESHOLD_UNSPECIFIED`
 * `BLOCK_LOW_AND_ABOVE`
 * `BLOCK_MEDIUM_AND_ABOVE`
 * `BLOCK_ONLY_HIGH`
 * `BLOCK_NONE`
* **audioTimestamp** _boolean_
 
 Optional. Enables timestamp understanding for audio files. Defaults to false.
 
 This is useful for generating transcripts with accurate timestamps. Consult [Google's Documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/audio-understanding) for usage details.
 
* **labels** _object_
 
 Optional. Defines labels used in billing reports.
 
 Consult [Google's Documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/add-labels-to-api-calls) for usage details.
 

You can use Google Vertex language models to generate text with the `generateText` function:

```
1import { vertex } from '@ai-sdk/google-vertex';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: vertex('gemini-2.5-pro'),6 prompt: 'Write a vegetarian lasagna recipe for 4 people.',7});
```

Google Vertex language models can also be used in the `streamText` function (see [AI SDK Core](https://ai-sdk.dev/docs/ai-sdk-core)).

#### [Code Execution](#code-execution)

With [Code Execution](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/code-execution), certain Gemini models on Vertex AI can generate and execute Python code. This allows the model to perform calculations, data manipulation, and other programmatic tasks to enhance its responses.

You can enable code execution by adding the `code_execution` tool to your request.

```
1import { vertex } from '@ai-sdk/google-vertex';2import { generateText } from 'ai';3
4const result = await generateText({5 model: vertex('gemini-2.5-pro'),6 tools: { code_execution: vertex.tools.codeExecution({}) },7 prompt:8 'Use python to calculate 20th fibonacci number. Then find the nearest palindrome to it.',9});
```

The response will contain `tool-call` and `tool-result` parts for the executed code.

#### [URL Context](#url-context)

URL Context allows Gemini models to retrieve and analyze content from URLs. Supported models: Gemini 2.5 Flash-Lite, 2.5 Pro, 2.5 Flash, 2.0 Flash.

```
1import { vertex } from '@ai-sdk/google-vertex';2import { generateText } from 'ai';3
4const result = await generateText({5 model: vertex('gemini-2.5-pro'),6 tools: { url_context: vertex.tools.urlContext({}) },7 prompt: 'What are the key points from https://example.com/article?',8});
```

#### [Google Search](#google-search)

Google Search enables Gemini models to access real-time web information. Supported models: Gemini 2.5 Flash-Lite, 2.5 Flash, 2.0 Flash, 2.5 Pro.

```
1import { vertex } from '@ai-sdk/google-vertex';2import { generateText } from 'ai';3
4const result = await generateText({5 model: vertex('gemini-2.5-pro'),6 tools: { google_search: vertex.tools.googleSearch({}) },7 prompt: 'What are the latest developments in AI?',8});
```

#### [Enterprise Web Search](#enterprise-web-search)

[Enterprise Web Search](https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/web-grounding-enterprise) provides grounding using a compliance-focused web index designed for highly-regulated industries such as finance, healthcare, and the public sector. Unlike standard Google Search grounding, Enterprise Web Search does not log customer data and supports VPC service controls. Supported models: Gemini 2.0 and newer.

```
1import { vertex } from '@ai-sdk/google-vertex';2import { generateText } from 'ai';3
4const result = await generateText({5 model: vertex('gemini-2.5-flash'),6 tools: {7 enterprise_web_search: vertex.tools.enterpriseWebSearch({}),8 },9 prompt: 'What are the latest FDA regulations for clinical trials?',10});
```

#### [Google Maps](#google-maps)

Google Maps grounding enables Gemini models to access Google Maps data for location-aware responses. Supported models: Gemini 2.5 Flash-Lite, 2.5 Flash, 2.0 Flash, 2.5 Pro, 3.0 Pro.

```
1import { vertex } from '@ai-sdk/google-vertex';2import { type GoogleLanguageModelOptions } from '@ai-sdk/google';3import { generateText } from 'ai';4
5const result = await generateText({6 model: vertex('gemini-2.5-flash'),7 tools: {8 google_maps: vertex.tools.googleMaps({}),9 },10 providerOptions: {11 vertex: {12 retrievalConfig: {13 latLng: { latitude: 34.090199, longitude: -117.881081 },14 },15 } satisfies GoogleLanguageModelOptions,16 },17 prompt: 'What are the best Italian restaurants nearby?',18});
```

The optional `retrievalConfig.latLng` provider option provides location context for queries about nearby places. This configuration applies to any grounding tools that support location context.

#### [Reasoning (Thinking Tokens)](#reasoning-thinking-tokens)

Google Vertex AI, through its support for Gemini models, can also emit "thinking" tokens, representing the model's reasoning process. The AI SDK exposes these as reasoning information.

To enable thinking tokens for compatible Gemini models via Vertex, set `includeThoughts: true` in the `thinkingConfig` provider option. These options are passed through `providerOptions.vertex`:

```
1import { vertex } from '@ai-sdk/google-vertex';2import { type GoogleLanguageModelOptions } from '@ai-sdk/google';3import { generateText, streamText } from 'ai';4
5// For generateText:6const { text, reasoningText, reasoning } = await generateText({7 model: vertex('gemini-2.0-flash-001'), // Or other supported model via Vertex8 providerOptions: {9 vertex: {10 thinkingConfig: {11 includeThoughts: true,12 // thinkingBudget: 2048, // Optional13 },14 } satisfies GoogleLanguageModelOptions,15 },16 prompt: 'Explain quantum computing in simple terms.',17});18
19console.log('Reasoning:', reasoningText);20console.log('Reasoning Details:', reasoning);21console.log('Final Text:', text);22
23// For streamText:24const result = streamText({25 model: vertex('gemini-2.0-flash-001'), // Or other supported model via Vertex26 providerOptions: {27 vertex: {28 thinkingConfig: {29 includeThoughts: true,30 // thinkingBudget: 2048, // Optional31 },32 } satisfies GoogleLanguageModelOptions,33 },34 prompt: 'Explain quantum computing in simple terms.',35});36
37for await (const part of result.fullStream) {38 if (part.type === 'reasoning') {39 process.stdout.write(`THOUGHT: ${part.textDelta}\n`);40 } else if (part.type === 'text-delta') {41 process.stdout.write(part.textDelta);42 }43}
```

When `includeThoughts` is true, parts of the API response marked with `thought: true` will be processed as reasoning.

* In `generateText`, these contribute to the `reasoningText` (string) and `reasoning` (array) fields.
* In `streamText`, these are emitted as `reasoning` stream parts.

#### [File Inputs](#file-inputs)

The Google Vertex provider supports file inputs, e.g. PDF files.

```
1import { vertex } from '@ai-sdk/google-vertex';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: vertex('gemini-2.5-pro'),6 messages: [7 {8 role: 'user',9 content: [10 {11 type: 'text',12 text: 'What is an embedding model according to this document?',13 },14 {15 type: 'file',16 data: fs.readFileSync('./data/ai.pdf'),17 mediaType: 'application/pdf',18 },19 ],20 },21 ],22});
```

The AI SDK will automatically download URLs if you pass them as data, except for `gs://` URLs. You can use the Google Cloud Storage API to upload larger files to that location.

See [File Parts](https://ai-sdk.dev/docs/foundations/prompts#file-parts) for details on how to use files in prompts.

### [Cached Content](#cached-content)

Google Vertex AI supports both explicit and implicit caching to help reduce costs on repetitive content.

#### [Implicit Caching](#implicit-caching)

```
1import { vertex } from '@ai-sdk/google-vertex';2import { generateText } from 'ai';3
4// Structure prompts with consistent content at the beginning5const baseContext =6 'You are a cooking assistant with expertise in Italian cuisine. Here are 1000 lasagna recipes for reference...';7
8const { text: veggieLasagna } = await generateText({9 model: vertex('gemini-2.5-pro'),10 prompt: `${baseContext}\n\nWrite a vegetarian lasagna recipe for 4 people.`,11});12
13// Second request with same prefix - eligible for cache hit14const { text: meatLasagna, providerMetadata } = await generateText({15 model: vertex('gemini-2.5-pro'),16 prompt: `${baseContext}\n\nWrite a meat lasagna recipe for 12 people.`,17});18
19// Check cached token count in usage metadata20console.log('Cached tokens:', providerMetadata.vertex);21// e.g.22// {23// groundingMetadata: null,24// safetyRatings: null,25// usageMetadata: {26// cachedContentTokenCount: 2027,27// thoughtsTokenCount: 702,28// promptTokenCount: 2152,29// candidatesTokenCount: 710,30// totalTokenCount: 356431// }32// }
```

#### [Explicit Caching](#explicit-caching)

You can use explicit caching with Gemini models. See the [Vertex AI context caching documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/context-cache/context-cache-overview) to check if caching is supported for your model.

First, create a cache using the Google GenAI SDK with Vertex mode enabled:

```
1import { GoogleGenAI } from '@google/genai';2
3const ai = new GoogleGenAI({4 vertexai: true,5 project: process.env.GOOGLE_VERTEX_PROJECT,6 location: process.env.GOOGLE_VERTEX_LOCATION,7});8
9const model = 'gemini-2.5-pro';10
11// Create a cache with the content you want to reuse12const cache = await ai.caches.create({13 model,14 config: {15 contents: [16 {17 role: 'user',18 parts: [{ text: '1000 Lasagna Recipes...' }],19 },20 ],21 ttl: '300s', // Cache expires after 5 minutes22 },23});24
25console.log('Cache created:', cache.name);26// e.g. projects/my-project/locations/us-central1/cachedContents/abc123
```

Then use the cache with the AI SDK:

```
1import { vertex } from '@ai-sdk/google-vertex';2import { type GoogleLanguageModelOptions } from '@ai-sdk/google';3import { generateText } from 'ai';4
5const { text: veggieLasagnaRecipe } = await generateText({6 model: vertex('gemini-2.5-pro'),7 prompt: 'Write a vegetarian lasagna recipe for 4 people.',8 providerOptions: {9 vertex: {10 cachedContent: cache.name,11 } satisfies GoogleLanguageModelOptions,12 },13});14
15const { text: meatLasagnaRecipe } = await generateText({16 model: vertex('gemini-2.5-pro'),17 prompt: 'Write a meat lasagna recipe for 12 people.',18 providerOptions: {19 vertex: {20 cachedContent: cache.name,21 } satisfies GoogleLanguageModelOptions,22 },23});
```

### [Safety Ratings](#safety-ratings)

The safety ratings provide insight into the safety of the model's response. See [Google Vertex AI documentation on configuring safety filters](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/configure-safety-filters).

Example response excerpt:

```
1{2 "safetyRatings": [3 {4 "category": "HARM_CATEGORY_HATE_SPEECH",5 "probability": "NEGLIGIBLE",6 "probabilityScore": 0.11027937,7 "severity": "HARM_SEVERITY_LOW",8 "severityScore": 0.284874359 },10 {11 "category": "HARM_CATEGORY_DANGEROUS_CONTENT",12 "probability": "HIGH",13 "blocked": true,14 "probabilityScore": 0.95422274,15 "severity": "HARM_SEVERITY_MEDIUM",16 "severityScore": 0.4339814517 },18 {19 "category": "HARM_CATEGORY_HARASSMENT",20 "probability": "NEGLIGIBLE",21 "probabilityScore": 0.11085559,22 "severity": "HARM_SEVERITY_NEGLIGIBLE",23 "severityScore": 0.1902722324 },25 {26 "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",27 "probability": "NEGLIGIBLE",28 "probabilityScore": 0.22901751,29 "severity": "HARM_SEVERITY_NEGLIGIBLE",30 "severityScore": 0.0908967531 }32 ]33}
```

For more details, see the [Google Vertex AI documentation on grounding with Google Search](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/ground-gemini#ground-to-search).

### [Troubleshooting](#troubleshooting)

#### [Schema Limitations](#schema-limitations)

The Google Vertex API uses a subset of the OpenAPI 3.0 schema, which does not support features such as unions. The errors that you get in this case look like this:

`GenerateContentRequest.generation_config.response_schema.properties[occupation].type: must be specified`

By default, structured outputs are enabled (and for tool calling they are required). You can disable structured outputs for object generation as a workaround:

```
1import { vertex } from '@ai-sdk/google-vertex';2import { type GoogleLanguageModelOptions } from '@ai-sdk/google';3import { generateText, Output } from 'ai';4
5const result = await generateText({6 model: vertex('gemini-2.5-pro'),7 providerOptions: {8 vertex: {9 structuredOutputs: false,10 } satisfies GoogleLanguageModelOptions,11 },12 output: Output.object({13 schema: z.object({14 name: z.string(),15 age: z.number(),16 contact: z.union([17 z.object({18 type: z.literal('email'),19 value: z.string(),20 }),21 z.object({22 type: z.literal('phone'),23 value: z.string(),24 }),25 ]),26 }),27 }),28 prompt: 'Generate an example person for testing.',29});
```

The following Zod features are known to not work with Google Vertex:

* `z.union`
* `z.record`

### [Model Capabilities](#model-capabilities)

| Model | Image Input | Object Generation | Tool Usage | Tool Streaming |
| --- | --- | --- | --- | --- |
| `gemini-3-pro-preview` | | | | |
| `gemini-2.5-pro` | | | | |
| `gemini-2.5-flash` | | | | |
| `gemini-2.0-flash-001` | | | | |

The table above lists popular models. Please see the [Google Vertex AI docs](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/inference#supported-models) for a full list of available models. The table above lists popular models. You can also pass any available provider model ID as a string if needed.

### [Embedding Models](#embedding-models)

You can create models that call the Google Vertex AI embeddings API using the `.embeddingModel()` factory method:

```
1const model = vertex.embeddingModel('text-embedding-005');
```

Google Vertex AI embedding models support additional settings. You can pass them as an options argument:

```
1import {2 vertex,3 type GoogleVertexEmbeddingModelOptions,4} from '@ai-sdk/google-vertex';5import { embed } from 'ai';6
7const model = vertex.embeddingModel('text-embedding-005');8
9const { embedding } = await embed({10 model,11 value: 'sunny day at the beach',12 providerOptions: {13 vertex: {14 outputDimensionality: 512, // optional, number of dimensions for the embedding15 taskType: 'SEMANTIC_SIMILARITY', // optional, specifies the task type for generating embeddings16 autoTruncate: false, // optional17 } satisfies GoogleVertexEmbeddingModelOptions,18 },19});
```

The following optional provider options are available for Google Vertex AI embedding models:

* **outputDimensionality**: _number_
 
 Optional reduced dimension for the output embedding. If set, excessive values in the output embedding are truncated from the end.
 
* **taskType**: _string_
 
 Optional. Specifies the task type for generating embeddings. Supported task types include:
 
 * `SEMANTIC_SIMILARITY`: Optimized for text similarity.
 * `CLASSIFICATION`: Optimized for text classification.
 * `CLUSTERING`: Optimized for clustering texts based on similarity.
 * `RETRIEVAL_DOCUMENT`: Optimized for document retrieval.
 * `RETRIEVAL_QUERY`: Optimized for query-based retrieval.
 * `QUESTION_ANSWERING`: Optimized for answering questions.
 * `FACT_VERIFICATION`: Optimized for verifying factual information.
 * `CODE_RETRIEVAL_QUERY`: Optimized for retrieving code blocks based on natural language queries.
* **title**: _string_
 
 Optional. The title of the document being embedded. This helps the model produce better embeddings by providing additional context. Only valid when `taskType` is set to `'RETRIEVAL_DOCUMENT'`.
 
* **autoTruncate**: _boolean_
 
 Optional. When set to `true`, input text will be truncated if it exceeds the maximum length. When set to `false`, an error is returned if the input text is too long. Defaults to `true`.
 

#### [Model Capabilities](#model-capabilities-1)

| Model | Max Values Per Call | Parallel Calls |
| --- | --- | --- |
| `text-embedding-005` | 2048 | |

The table above lists popular models. You can also pass any available provider model ID as a string if needed.

### [Image Models](#image-models)

You can create image models using the `.image()` factory method. The Google Vertex provider supports both [Imagen](https://cloud.google.com/vertex-ai/generative-ai/docs/image/overview) and [Gemini image models](https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-flash-image). For more on image generation with the AI SDK see [generateImage()](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-image).

#### [Imagen Models](#imagen-models)

[Imagen models](https://cloud.google.com/vertex-ai/generative-ai/docs/image/generate-images) generate images using the Imagen on Vertex AI API.

```
1import { vertex } from '@ai-sdk/google-vertex';2import { generateImage } from 'ai';3
4const { image } = await generateImage({5 model: vertex.image('imagen-4.0-generate-001'),6 prompt: 'A futuristic cityscape at sunset',7 aspectRatio: '16:9',8});
```

Further configuration can be done using Google Vertex provider options. You can validate the provider options using the `GoogleVertexImageModelOptions` type.

```
1import { vertex } from '@ai-sdk/google-vertex';2import { GoogleVertexImageModelOptions } from '@ai-sdk/google-vertex';3import { generateImage } from 'ai';4
5const { image } = await generateImage({6 model: vertex.image('imagen-4.0-generate-001'),7 providerOptions: {8 vertex: {9 negativePrompt: 'pixelated, blurry, low-quality',10 } satisfies GoogleVertexImageModelOptions,11 },12 //...13});
```

The following provider options are available:

* **negativePrompt** _string_ A description of what to discourage in the generated images.
 
* **personGeneration** `allow_adult` | `allow_all` | `dont_allow` Whether to allow person generation. Defaults to `allow_adult`.
 
* **safetySetting** `block_low_and_above` | `block_medium_and_above` | `block_only_high` | `block_none` Whether to block unsafe content. Defaults to `block_medium_and_above`.
 
* **addWatermark** _boolean_ Whether to add an invisible watermark to the generated images. Defaults to `true`.
 
* **storageUri** _string_ Cloud Storage URI to store the generated images.
 

Imagen models do not support the `size` parameter. Use the `aspectRatio` parameter instead.

Additional information about the images can be retrieved using Google Vertex meta data.

```
1import { vertex } from '@ai-sdk/google-vertex';2import { GoogleVertexImageModelOptions } from '@ai-sdk/google-vertex';3import { generateImage } from 'ai';4
5const { image, providerMetadata } = await generateImage({6 model: vertex.image('imagen-4.0-generate-001'),7 prompt: 'A futuristic cityscape at sunset',8 aspectRatio: '16:9',9});10
11console.log(12 `Revised prompt: ${providerMetadata.vertex.images[0].revisedPrompt}`,13);
```

##### [Image Editing](#image-editing)

Google Vertex Imagen models support image editing through inpainting, outpainting, and other edit modes. Pass input images via `prompt.images` and optionally a mask via `prompt.mask`.

Image editing is supported by `imagen-3.0-capability-001`. The `imagen-4.0-generate-001` model does not currently support editing operations.

###### [Inpainting (Insert Objects)](#inpainting-insert-objects)

Insert or replace objects in specific areas using a mask:

```
1import { vertex, GoogleVertexImageModelOptions } from '@ai-sdk/google-vertex';2import { generateImage } from 'ai';3import fs from 'fs';4
5const image = fs.readFileSync('./input-image.png');6const mask = fs.readFileSync('./mask.png'); // White = edit area7
8const { images } = await generateImage({9 model: vertex.image('imagen-3.0-capability-001'),10 prompt: {11 text: 'A sunlit indoor lounge area with a pool containing a flamingo',12 images: [image],13 mask,14 },15 providerOptions: {16 vertex: {17 edit: {18 baseSteps: 50,19 mode: 'EDIT_MODE_INPAINT_INSERTION',20 maskMode: 'MASK_MODE_USER_PROVIDED',21 maskDilation: 0.01,22 },23 } satisfies GoogleVertexImageModelOptions,24 },25});
```

###### [Outpainting (Extend Image)](#outpainting-extend-image)

Extend an image beyond its original boundaries:

```
1import { vertex, GoogleVertexImageModelOptions } from '@ai-sdk/google-vertex';2import { generateImage } from 'ai';3import fs from 'fs';4
5const image = fs.readFileSync('./input-image.png');6const mask = fs.readFileSync('./outpaint-mask.png'); // White = extend area7
8const { images } = await generateImage({9 model: vertex.image('imagen-3.0-capability-001'),10 prompt: {11 text: 'Extend the scene with more of the forest background',12 images: [image],13 mask,14 },15 providerOptions: {16 vertex: {17 edit: {18 baseSteps: 50,19 mode: 'EDIT_MODE_OUTPAINT',20 maskMode: 'MASK_MODE_USER_PROVIDED',21 },22 } satisfies GoogleVertexImageModelOptions,23 },24});
```

###### [Edit Provider Options](#edit-provider-options)

The following options are available under `providerOptions.vertex.edit`:

* **mode** - The edit mode to use:
 
 * `EDIT_MODE_INPAINT_INSERTION` - Insert objects into masked areas
 * `EDIT_MODE_INPAINT_REMOVAL` - Remove objects from masked areas
 * `EDIT_MODE_OUTPAINT` - Extend image beyond boundaries
 * `EDIT_MODE_CONTROLLED_EDITING` - Controlled editing
 * `EDIT_MODE_PRODUCT_IMAGE` - Product image editing
 * `EDIT_MODE_BGSWAP` - Background swap
* **baseSteps** _number_ - Number of sampling steps (35-75). Higher values = better quality but slower.
 
* **maskMode** - How to interpret the mask:
 
 * `MASK_MODE_USER_PROVIDED` - Use the provided mask directly
 * `MASK_MODE_DEFAULT` - Default mask mode
 * `MASK_MODE_DETECTION_BOX` - Mask from detected bounding boxes
 * `MASK_MODE_CLOTHING_AREA` - Mask from clothing segmentation
 * `MASK_MODE_PARSED_PERSON` - Mask from person parsing
* **maskDilation** _number_ - Percentage (0-1) to grow the mask. Recommended: 0.01.
 

Input images must be provided as `Buffer`, `ArrayBuffer`, `Uint8Array`, or base64-encoded strings. URL-based images are not supported for Google Vertex image editing.

##### [Imagen Model Capabilities](#imagen-model-capabilities)

| Model | Aspect Ratios |
| --- | --- |
| `imagen-3.0-generate-001` | 1:1, 3:4, 4:3, 9:16, 16:9 |
| `imagen-3.0-generate-002` | 1:1, 3:4, 4:3, 9:16, 16:9 |
| `imagen-3.0-fast-generate-001` | 1:1, 3:4, 4:3, 9:16, 16:9 |
| `imagen-4.0-generate-001` | 1:1, 3:4, 4:3, 9:16, 16:9 |
| `imagen-4.0-fast-generate-001` | 1:1, 3:4, 4:3, 9:16, 16:9 |
| `imagen-4.0-ultra-generate-001` | 1:1, 3:4, 4:3, 9:16, 16:9 |

#### [Gemini Image Models](#gemini-image-models)

[Gemini image models](https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-flash-image) (e.g. `gemini-2.5-flash-image`) are multimodal output language models that can be used with `generateImage()` for a simpler image generation experience. Internally, the provider calls the language model API with `responseModalities: ['IMAGE']`.

```
1import { vertex } from '@ai-sdk/google-vertex';2import { generateImage } from 'ai';3
4const { image } = await generateImage({5 model: vertex.image('gemini-2.5-flash-image'),6 prompt: 'A photorealistic image of a cat wearing a wizard hat',7 aspectRatio: '1:1',8});
```

Gemini image models also support image editing by providing input images:

```
1import { vertex } from '@ai-sdk/google-vertex';2import { generateImage } from 'ai';3import fs from 'node:fs';4
5const sourceImage = fs.readFileSync('./cat.png');6
7const { image } = await generateImage({8 model: vertex.image('gemini-2.5-flash-image'),9 prompt: {10 text: 'Add a small wizard hat to this cat',11 images: [sourceImage],12 },13});
```

You can also use URLs (including `gs://` Cloud Storage URIs) for input images:

```
1import { vertex } from '@ai-sdk/google-vertex';2import { generateImage } from 'ai';3
4const { image } = await generateImage({5 model: vertex.image('gemini-2.5-flash-image'),6 prompt: {7 text: 'Add a small wizard hat to this cat',8 images: ['https://example.com/cat.png'],9 },10});
```

Gemini image models do not support the `size` or `n` parameters. Use `aspectRatio` instead of `size`. Mask-based inpainting is also not supported.

Gemini image models are multimodal output models that can generate both text and images. For more advanced use cases where you need both text and image outputs, or want more control over the generation process, you can use them directly with `generateText()`.

##### [Gemini Image Model Capabilities](#gemini-image-model-capabilities)

| Model | Image Generation | Image Editing | Aspect Ratios |
| --- | --- | --- | --- |
| `gemini-3.1-flash-image-preview` | | | 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9 |
| `gemini-3-pro-image-preview` | | | 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9 |
| `gemini-2.5-flash-image` | | | 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9 |

`gemini-3-pro-image-preview` supports additional features including up to 14 reference images for editing (6 objects, 5 humans), resolution options (1K, 2K, 4K via `providerOptions.vertex.imageConfig.imageSize`), and Google Search grounding.

### [Video Models](#video-models)

You can create [Veo](https://cloud.google.com/vertex-ai/generative-ai/docs/video/overview) video models that call the Vertex AI API using the `.video()` factory method. For more on video generation with the AI SDK see [generateVideo()](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-video).

```
1import { vertex } from '@ai-sdk/google-vertex';2import { experimental_generateVideo as generateVideo } from 'ai';3
4const { video } = await generateVideo({5 model: vertex.video('veo-3.1-generate-001'),6 prompt:7 'A pangolin curled on a mossy stone in a glowing bioluminescent forest',8 aspectRatio: '16:9',9});
```

You can configure resolution and duration:

```
1import { vertex } from '@ai-sdk/google-vertex';2import { experimental_generateVideo as generateVideo } from 'ai';3
4const { video } = await generateVideo({5 model: vertex.video('veo-3.1-generate-001'),6 prompt: 'A serene mountain landscape at sunset',7 aspectRatio: '16:9',8 resolution: '1920x1080',9 duration: 8,10});
```

#### [Provider Options](#provider-options)

Further configuration can be done using Google Vertex provider options. You can validate the provider options using the `GoogleVertexVideoModelOptions` type.

```
1import { vertex } from '@ai-sdk/google-vertex';2import { GoogleVertexVideoModelOptions } from '@ai-sdk/google-vertex';3import { experimental_generateVideo as generateVideo } from 'ai';4
5const { video } = await generateVideo({6 model: vertex.video('veo-3.1-generate-001'),7 prompt: 'A serene mountain landscape at sunset',8 aspectRatio: '16:9',9 providerOptions: {10 vertex: {11 generateAudio: true,12 personGeneration: 'allow_adult',13 } satisfies GoogleVertexVideoModelOptions,14 },15});
```

The following provider options are available:

* **generateAudio** _boolean_
 
 Whether to generate audio along with the video.
 
* **personGeneration** `'dont_allow'` | `'allow_adult'` | `'allow_all'`
 
 Whether to allow person generation in the video.
 
* **negativePrompt** _string_
 
 A description of what to discourage in the generated video.
 
* **gcsOutputDirectory** _string_
 
 Cloud Storage URI to store the generated videos.
 
* **referenceImages** _Array<{ bytesBase64Encoded?: string; gcsUri?: string }>_
 
 Reference images for style or asset guidance.
 
* **pollIntervalMs** _number_
 
 Polling interval in milliseconds for checking task status.
 
* **pollTimeoutMs** _number_
 
 Maximum wait time in milliseconds for video generation.
 

Video generation is an asynchronous process that can take several minutes. For longer videos or higher resolutions, consider setting `pollTimeoutMs` to at least 10 minutes (600000ms).

#### [Model Capabilities](#model-capabilities-2)

| Model | Audio Support |
| --- | --- |
| `veo-3.1-generate-001` | Yes |
| `veo-3.1-fast-generate-001` | Yes |
| `veo-3.0-generate-001` | Yes |
| `veo-3.0-fast-generate-001` | Yes |
| `veo-2.0-generate-001` | No |

The table above lists popular models. You can also pass any available provider model ID as a string if needed.

## [Google Vertex Anthropic Provider Usage](#google-vertex-anthropic-provider-usage)

The Google Vertex Anthropic provider for the [AI SDK](https://ai-sdk.dev/docs) offers support for Anthropic's Claude models through the Google Vertex AI APIs. This section provides details on how to set up and use the Google Vertex Anthropic provider.

### [Provider Instance](#provider-instance-1)

You can import the default provider instance `vertexAnthropic` from `@ai-sdk/google-vertex/anthropic`:

```
1import { vertexAnthropic } from '@ai-sdk/google-vertex/anthropic';
```

If you need a customized setup, you can import `createVertexAnthropic` from `@ai-sdk/google-vertex/anthropic` and create a provider instance with your settings:

```
1import { createVertexAnthropic } from '@ai-sdk/google-vertex/anthropic';2
3const vertexAnthropic = createVertexAnthropic({4 project: 'my-project', // optional5 location: 'us-central1', // optional6});
```

#### [Node.js Runtime](#nodejs-runtime-1)

For Node.js environments, the Google Vertex Anthropic provider supports all standard Google Cloud authentication options through the `google-auth-library`. You can customize the authentication options by passing them to the `createVertexAnthropic` function:

```
1import { createVertexAnthropic } from '@ai-sdk/google-vertex/anthropic';2
3const vertexAnthropic = createVertexAnthropic({4 googleAuthOptions: {5 credentials: {6 client_email: 'my-email',7 private_key: 'my-private-key',8 },9 },10});
```

##### [Optional Provider Settings](#optional-provider-settings-3)

You can use the following optional settings to customize the Google Vertex Anthropic provider instance:

* **project** _string_
 
 The Google Cloud project ID that you want to use for the API calls. It uses the `GOOGLE_VERTEX_PROJECT` environment variable by default.
 
* **location** _string_
 
 The Google Cloud location that you want to use for the API calls, e.g. `us-central1`. It uses the `GOOGLE_VERTEX_LOCATION` environment variable by default.
 
* **googleAuthOptions** _object_
 
 Optional. The Authentication options used by the [Google Auth Library](https://github.com/googleapis/google-auth-library-nodejs/). See also the [GoogleAuthOptions](https://github.com/googleapis/google-auth-library-nodejs/blob/08978822e1b7b5961f0e355df51d738e012be392/src/auth/googleauth.ts#L87C18-L87C35) interface.
 
 * **authClient** _object_ An `AuthClient` to use.
 
 * **keyFilename** _string_ Path to a.json,.pem, or.p12 key file.
 
 * **keyFile** _string_ Path to a.json,.pem, or.p12 key file.
 
 * **credentials** _object_ Object containing client\_email and private\_key properties, or the external account client options.
 
 * **clientOptions** _object_ Options object passed to the constructor of the client.
 
 * **scopes** _string | string\[\]_ Required scopes for the desired API request.
 
 * **projectId** _string_ Your project ID.
 
 * **universeDomain** _string_ The default service domain for a given Cloud universe.
 
* **headers** _Resolvable<Record<string, string | undefined>>_
 
 Headers to include in the requests. Can be provided in multiple formats:
 
 * A record of header key-value pairs: `Record<string, string | undefined>`
 * A function that returns headers: `() => Record<string, string | undefined>`
 * An async function that returns headers: `async () => Record<string, string | undefined>`
 * A promise that resolves to headers: `Promise<Record<string, string | undefined>>`
* **fetch** _(input: RequestInfo, init?: RequestInit) => Promise<Response>_
 
 Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation. Defaults to the global `fetch` function. You can use it as a middleware to intercept requests, or to provide a custom fetch implementation for e.g. testing.
 

#### [Edge Runtime](#edge-runtime-1)

Edge runtimes (like Vercel Edge Functions and Cloudflare Workers) are lightweight JavaScript environments that run closer to users at the network edge. They only provide a subset of the standard Node.js APIs. For example, direct file system access is not available, and many Node.js-specific libraries (including the standard Google Auth library) are not compatible.

The Edge runtime version of the Google Vertex Anthropic provider supports Google's [Application Default Credentials](https://github.com/googleapis/google-auth-library-nodejs?tab=readme-ov-file#application-default-credentials) through environment variables. The values can be obtained from a json credentials file from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

For Edge runtimes, you can import the provider instance from `@ai-sdk/google-vertex/anthropic/edge`:

```
1import { vertexAnthropic } from '@ai-sdk/google-vertex/anthropic/edge';
```

To customize the setup, use `createVertexAnthropic` from the same module:

```
1import { createVertexAnthropic } from '@ai-sdk/google-vertex/anthropic/edge';2
3const vertexAnthropic = createVertexAnthropic({4 project: 'my-project', // optional5 location: 'us-central1', // optional6});
```

For Edge runtime authentication, set these environment variables from your Google Default Application Credentials JSON file:

* `GOOGLE_CLIENT_EMAIL`
* `GOOGLE_PRIVATE_KEY`
* `GOOGLE_PRIVATE_KEY_ID` (optional)

##### [Optional Provider Settings](#optional-provider-settings-4)

You can use the following optional settings to customize the provider instance:

* **project** _string_
 
 The Google Cloud project ID that you want to use for the API calls. It uses the `GOOGLE_VERTEX_PROJECT` environment variable by default.
 
* **location** _string_
 
 The Google Cloud location that you want to use for the API calls, e.g. `us-central1`. It uses the `GOOGLE_VERTEX_LOCATION` environment variable by default.
 
* **googleCredentials** _object_
 
 Optional. The credentials used by the Edge provider for authentication. These credentials are typically set through environment variables and are derived from a service account JSON file.
 
 * **clientEmail** _string_ The client email from the service account JSON file. Defaults to the contents of the `GOOGLE_CLIENT_EMAIL` environment variable.
 
 * **privateKey** _string_ The private key from the service account JSON file. Defaults to the contents of the `GOOGLE_PRIVATE_KEY` environment variable.
 
 * **privateKeyId** _string_ The private key ID from the service account JSON file (optional). Defaults to the contents of the `GOOGLE_PRIVATE_KEY_ID` environment variable.
 
* **headers** _Resolvable<Record<string, string | undefined>>_
 
 Headers to include in the requests. Can be provided in multiple formats:
 
 * A record of header key-value pairs: `Record<string, string | undefined>`
 * A function that returns headers: `() => Record<string, string | undefined>`
 * An async function that returns headers: `async () => Record<string, string | undefined>`
 * A promise that resolves to headers: `Promise<Record<string, string | undefined>>`
* **fetch** _(input: RequestInfo, init?: RequestInit) => Promise<Response>_
 
 Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation. Defaults to the global `fetch` function. You can use it as a middleware to intercept requests, or to provide a custom fetch implementation for e.g. testing.
 

### [Language Models](#language-models-1)

You can create models that call the [Anthropic Messages API](https://docs.anthropic.com/claude/reference/messages_post) using the provider instance. The first argument is the model id, e.g. `claude-3-haiku-20240307`. Some models have multi-modal capabilities.

```
1const model = anthropic('claude-3-haiku-20240307');
```

You can use Anthropic language models to generate text with the `generateText` function:

```
1import { vertexAnthropic } from '@ai-sdk/google-vertex/anthropic';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: vertexAnthropic('claude-3-haiku-20240307'),6 prompt: 'Write a vegetarian lasagna recipe for 4 people.',7});
```

Anthropic language models can also be used in the `streamText` function and support structured data generation with [`Output`](https://ai-sdk.dev/docs/reference/ai-sdk-core/output) (see [AI SDK Core](https://ai-sdk.dev/docs/ai-sdk-core)).

The Anthropic API returns streaming tool calls all at once after a delay. This causes structured output generation to complete fully after a delay instead of streaming incrementally.

The following optional provider options are available for Anthropic models:

* `sendReasoning` _boolean_
 
 Optional. Include reasoning content in requests sent to the model. Defaults to `true`.
 
 If you are experiencing issues with the model handling requests involving reasoning content, you can set this to `false` to omit them from the request.
 
* `thinking` _object_
 
 Optional. See [Reasoning section](#reasoning) for more details.
 

### [Reasoning](#reasoning)

Anthropic has reasoning support for the `claude-3-7-sonnet@20250219` model.

You can enable it using the `thinking` provider option and specifying a thinking budget in tokens.

```
1import { vertexAnthropic } from '@ai-sdk/google-vertex/anthropic';2import { generateText } from 'ai';3
4const { text, reasoningText, reasoning } = await generateText({5 model: vertexAnthropic('claude-3-7-sonnet@20250219'),6 prompt: 'How many people will live in the world in 2040?',7 providerOptions: {8 anthropic: {9 thinking: { type: 'enabled', budgetTokens: 12000 },10 },11 },12});13
14console.log(reasoningText); // reasoning text15console.log(reasoning); // reasoning details including redacted reasoning16console.log(text); // text response
```

See [AI SDK UI: Chatbot](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot#reasoning) for more details on how to integrate reasoning into your chatbot.

#### [Cache Control](#cache-control)

In the messages and message parts, you can use the `providerOptions` property to set cache control breakpoints. You need to set the `anthropic` property in the `providerOptions` object to `{ cacheControl: { type: 'ephemeral' } }` to set a cache control breakpoint.

The cache creation input tokens are then returned in the `providerMetadata` object for `generateText`, again under the `anthropic` property. When you use `streamText`, the response contains a promise that resolves to the metadata. Alternatively you can receive it in the `onFinish` callback.

```
1import { vertexAnthropic } from '@ai-sdk/google-vertex/anthropic';2import { generateText } from 'ai';3
4const errorMessage = '... long error message...';5
6const result = await generateText({7 model: vertexAnthropic('claude-3-5-sonnet-20240620'),8 messages: [9 {10 role: 'user',11 content: [12 { type: 'text', text: 'You are a JavaScript expert.' },13 {14 type: 'text',15 text: `Error message: ${errorMessage}`,16 providerOptions: {17 anthropic: { cacheControl: { type: 'ephemeral' } },18 },19 },20 { type: 'text', text: 'Explain the error message.' },21 ],22 },23 ],24});25
26console.log(result.text);27console.log(result.providerMetadata?.anthropic);28// e.g. { cacheCreationInputTokens: 2118, cacheReadInputTokens: 0 }
```

You can also use cache control on system messages by providing multiple system messages at the head of your messages array:

```
1const result = await generateText({2 model: vertexAnthropic('claude-3-5-sonnet-20240620'),3 messages: [4 {5 role: 'system',6 content: 'Cached system message part',7 providerOptions: {8 anthropic: { cacheControl: { type: 'ephemeral' } },9 },10 },11 {12 role: 'system',13 content: 'Uncached system message part',14 },15 {16 role: 'user',17 content: 'User prompt',18 },19 ],20});
```

For more on prompt caching with Anthropic, see [Google Vertex AI's Claude prompt caching documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/claude-prompt-caching) and [Anthropic's Cache Control documentation](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching).

### [Tools](#tools)

Google Vertex Anthropic supports a subset of Anthropic's built-in tools. The following tools are available via the `tools` property of the provider instance:

1. **Bash Tool**: Allows running bash commands.
2. **Text Editor Tool**: Provides functionality for viewing and editing text files.
3. **Computer Tool**: Enables control of keyboard and mouse actions on a computer.
4. **Web Search Tool**: Provides access to real-time web content.

Only a subset of Anthropic tools are supported on Google Vertex. Tools like Code Execution, Memory, and Web Fetch are not available. Use the regular `@ai-sdk/anthropic` provider if you need access to all Anthropic tools.

For more background on Anthropic tools, see [Anthropic's documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview).

#### [Bash Tool](#bash-tool)

The Bash Tool allows running bash commands. Here's how to create and use it:

```
1const bashTool = vertexAnthropic.tools.bash_20250124({2 execute: async ({ command, restart }) => {3 // Implement your bash command execution logic here4 // Return the result of the command execution5 },6});
```

Parameters:

* `command` (string): The bash command to run. Required unless the tool is being restarted.
* `restart` (boolean, optional): Specifying true will restart this tool.

#### [Text Editor Tool](#text-editor-tool)

The Text Editor Tool provides functionality for viewing and editing text files:

```
1const textEditorTool = vertexAnthropic.tools.textEditor_20250124({2 execute: async ({3 command,4 path,5 file_text,6 insert_line,7 new_str,8 insert_text,9 old_str,10 view_range,11 }) => {12 // Implement your text editing logic here13 // Return the result of the text editing operation14 },15});
```

Parameters:

* `command` ('view' | 'create' | 'str\_replace' | 'insert' | 'undo\_edit'): The command to run. Note: `undo_edit` is not supported in `textEditor_20250429` and `textEditor_20250728`.
* `path` (string): Absolute path to file or directory, e.g. `/repo/file.py` or `/repo`.
* `file_text` (string, optional): Required for `create` command, with the content of the file to be created.
* `insert_line` (number, optional): Required for `insert` command. The line number after which to insert the new string.
* `new_str` (string, optional): New string for `str_replace` command.
* `insert_text` (string, optional): Required for `insert` command, containing the text to insert.
* `old_str` (string, optional): Required for `str_replace` command, containing the string to replace.
* `view_range` (number\[\], optional): Optional for `view` command to specify line range to show.
* `max_characters` (number, optional): Optional maximum number of characters to view in the file (only available in `textEditor_20250728`).

#### [Computer Tool](#computer-tool)

The Computer Tool enables control of keyboard and mouse actions on a computer:

```
1const computerTool = vertexAnthropic.tools.computer_20241022({2 displayWidthPx: 1920,3 displayHeightPx: 1080,4 displayNumber: 0, // Optional, for X11 environments5
6 execute: async ({ action, coordinate, text }) => {7 // Implement your computer control logic here8 // Return the result of the action9
10 // Example code:11 switch (action) {12 case 'screenshot': {13 // multipart result:14 return {15 type: 'image',16 data: fs17.readFileSync('./data/screenshot-editor.png')18.toString('base64'),19 };20 }21 default: {22 console.log('Action:', action);23 console.log('Coordinate:', coordinate);24 console.log('Text:', text);25 return `executed ${action}`;26 }27 }28 },29
30 // map to tool result content for LLM consumption:31 toModelOutput({ output }) {32 return typeof output === 'string'33 ? [{ type: 'text', text: output }]34 : [{ type: 'image', data: output.data, mediaType: 'image/png' }];35 },36});
```

Parameters:

* `action` ('key' | 'type' | 'mouse\_move' | 'left\_click' | 'left\_click\_drag' | 'right\_click' | 'middle\_click' | 'double\_click' | 'screenshot' | 'cursor\_position'): The action to perform.
* `coordinate` (number\[\], optional): Required for `mouse_move` and `left_click_drag` actions. Specifies the (x, y) coordinates.
* `text` (string, optional): Required for `type` and `key` actions.

#### [Web Search Tool](#web-search-tool)

The Web Search Tool provides Claude with direct access to real-time web content:

```
1const webSearchTool = vertexAnthropic.tools.webSearch_20250305({2 maxUses: 5, // Optional: Maximum number of web searches Claude can perform3 allowedDomains: ['example.com'], // Optional: Only search these domains4 blockedDomains: ['spam.com'], // Optional: Never search these domains5 userLocation: {6 // Optional: Provide location for geographically relevant results7 type: 'approximate',8 city: 'San Francisco',9 region: 'CA',10 country: 'US',11 timezone: 'America/Los_Angeles',12 },13});
```

Parameters:

* `maxUses` (number, optional): Maximum number of web searches Claude can perform during the conversation.
* `allowedDomains` (string\[\], optional): Optional list of domains that Claude is allowed to search.
* `blockedDomains` (string\[\], optional): Optional list of domains that Claude should avoid when searching.
* `userLocation` (object, optional): Optional user location information to provide geographically relevant search results.
 * `type` ('approximate'): The type of location (must be approximate).
 * `city` (string, optional): The city name.
 * `region` (string, optional): The region or state.
 * `country` (string, optional): The country.
 * `timezone` (string, optional): The IANA timezone ID.

These tools can be used in conjunction with supported Claude models to enable more complex interactions and tasks.

### [Model Capabilities](#model-capabilities-3)

The latest Anthropic model list on Vertex AI is available [here](https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/use-claude#model-list). See also [Anthropic Model Comparison](https://docs.anthropic.com/en/docs/about-claude/models#model-comparison).

| Model | Image Input | Object Generation | Tool Usage | Tool Streaming | Computer Use |
| --- | --- | --- | --- | --- | --- |
| `claude-3-7-sonnet@20250219` | | | | | |
| `claude-3-5-sonnet-v2@20241022` | | | | | |
| `claude-3-5-sonnet@20240620` | | | | | |
| `claude-3-5-haiku@20241022` | | | | | |
| `claude-3-sonnet@20240229` | | | | | |
| `claude-3-haiku@20240307` | | | | | |
| `claude-3-opus@20240229` | | | | | |

The table above lists popular models. You can also pass any available provider model ID as a string if needed.

---
url: https://ai-sdk.dev/providers/ai-sdk-providers/mistral
title: "AI SDK Providers: Mistral AI"
description: "Learn how to use Mistral."
hash: "1e0340aa908b5596787626a4a12490cc813aeb2701d28fb623b4cf8e8dc30e7c"
crawledAt: 2026-03-07T08:05:24.459Z
depth: 2
---

## [Mistral AI Provider](#mistral-ai-provider)

The [Mistral AI](https://mistral.ai/) provider contains language model support for the Mistral chat API.

## [Setup](#setup)

The Mistral provider is available in the `@ai-sdk/mistral` module. You can install it with

pnpm add @ai-sdk/mistral

## [Provider Instance](#provider-instance)

You can import the default provider instance `mistral` from `@ai-sdk/mistral`:

```
1import { mistral } from '@ai-sdk/mistral';
```

If you need a customized setup, you can import `createMistral` from `@ai-sdk/mistral` and create a provider instance with your settings:

```
1import { createMistral } from '@ai-sdk/mistral';2
3const mistral = createMistral({4 // custom settings5});
```

You can use the following optional settings to customize the Mistral provider instance:

* **baseURL** _string_
 
 Use a different URL prefix for API calls, e.g. to use proxy servers. The default prefix is `https://api.mistral.ai/v1`.
 
* **apiKey** _string_
 
 API key that is being sent using the `Authorization` header. It defaults to the `MISTRAL_API_KEY` environment variable.
 
* **headers** _Record<string,string>_
 
 Custom headers to include in the requests.
 
* **fetch** _(input: RequestInfo, init?: RequestInit) => Promise<Response>_
 
 Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation. Defaults to the global `fetch` function. You can use it as a middleware to intercept requests, or to provide a custom fetch implementation for e.g. testing.
 

## [Language Models](#language-models)

You can create models that call the [Mistral chat API](https://docs.mistral.ai/api/#operation/createChatCompletion) using a provider instance. The first argument is the model id, e.g. `mistral-large-latest`. Some Mistral chat models support tool calls.

```
1const model = mistral('mistral-large-latest');
```

Mistral chat models also support additional model settings that are not part of the [standard call settings](https://ai-sdk.dev/docs/ai-sdk-core/settings). You can pass them as an options argument and utilize `MistralLanguageModelOptions` for typing:

```
1import { mistral, type MistralLanguageModelOptions } from '@ai-sdk/mistral';2const model = mistral('mistral-large-latest');3
4await generateText({5 model,6 providerOptions: {7 mistral: {8 safePrompt: true, // optional safety prompt injection9 parallelToolCalls: false, // disable parallel tool calls (one tool per response)10 } satisfies MistralLanguageModelOptions,11 },12});
```

The following optional provider options are available for Mistral models:

* **safePrompt** _boolean_
 
 Whether to inject a safety prompt before all conversations.
 
 Defaults to `false`.
 
* **documentImageLimit** _number_
 
 Maximum number of images to process in a document.
 
* **documentPageLimit** _number_
 
 Maximum number of pages to process in a document.
 
* **strictJsonSchema** _boolean_
 
 Whether to use strict JSON schema validation for structured outputs. Only applies when a schema is provided and only sets the [`strict` flag](https://docs.mistral.ai/api/#tag/chat/operation/chat_completion_v1_chat_completions_post) in addition to using [Custom Structured Outputs](https://docs.mistral.ai/capabilities/structured-output/custom_structured_output/), which is used by default if a schema is provided.
 
 Defaults to `false`.
 
* **structuredOutputs** _boolean_
 
 Whether to use [structured outputs](#structured-outputs). When enabled, tool calls and object generation will be strict and follow the provided schema.
 
 Defaults to `true`.
 
* **parallelToolCalls** _boolean_
 
 Whether to enable parallel function calling during tool use. When set to false, the model will use at most one tool per response.
 
 Defaults to `true`.
 

### [Document OCR](#document-ocr)

Mistral chat models support document OCR for PDF files. You can optionally set image and page limits using the provider options.

```
1import { mistral, type MistralLanguageModelOptions } from '@ai-sdk/mistral';2import { generateText } from 'ai';3
4const result = await generateText({5 model: mistral('mistral-small-latest'),6 messages: [7 {8 role: 'user',9 content: [10 {11 type: 'text',12 text: 'What is an embedding model according to this document?',13 },14 {15 type: 'file',16 data: new URL(17 'https://github.com/vercel/ai/blob/main/examples/ai-functions/data/ai.pdf?raw=true',18 ),19 mediaType: 'application/pdf',20 },21 ],22 },23 ],24 // optional settings:25 providerOptions: {26 mistral: {27 documentImageLimit: 8,28 documentPageLimit: 64,29 } satisfies MistralLanguageModelOptions,30 },31});
```

### [Reasoning Models](#reasoning-models)

Mistral offers reasoning models that provide step-by-step thinking capabilities:

* **magistral-small-2507**: Smaller reasoning model for efficient step-by-step thinking
* **magistral-medium-2507**: More powerful reasoning model balancing performance and cost

These models return structured reasoning content that the AI SDK extracts automatically. The reasoning is available via the `reasoningText` property in the result:

```
1import { mistral } from '@ai-sdk/mistral';2import { generateText } from 'ai';3
4const result = await generateText({5 model: mistral('magistral-small-2507'),6 prompt: 'What is 15 * 24?',7});8
9console.log('REASONING:', result.reasoningText);10// Output: "Let me calculate this step by step..."11
12console.log('ANSWER:', result.text);13// Output: "360"
```

The SDK automatically parses Mistral's native reasoning format and provides separate `reasoningText` and `text` properties in the result. No middleware is needed.

### [Example](#example)

You can use Mistral language models to generate text with the `generateText` function:

```
1import { mistral } from '@ai-sdk/mistral';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: mistral('mistral-large-latest'),6 prompt: 'Write a vegetarian lasagna recipe for 4 people.',7});
```

Mistral language models can also be used in the `streamText` function and support structured data generation with [`Output`](https://ai-sdk.dev/docs/reference/ai-sdk-core/output) (see [AI SDK Core](https://ai-sdk.dev/docs/ai-sdk-core)).

#### [Structured Outputs](#structured-outputs)

Mistral chat models support structured outputs using JSON Schema. You can use `generateText` or `streamText` with [`Output`](https://ai-sdk.dev/docs/reference/ai-sdk-core/output) and Zod, Valibot, or raw JSON Schema. The SDK sends your schema via Mistral's `response_format: { type: 'json_schema' }`.

```
1import { mistral } from '@ai-sdk/mistral';2import { generateText, Output } from 'ai';3import { z } from 'zod';4
5const result = await generateText({6 model: mistral('mistral-large-latest'),7 output: Output.object({8 schema: z.object({9 recipe: z.object({10 name: z.string(),11 ingredients: z.array(z.string()),12 instructions: z.array(z.string()),13 }),14 }),15 }),16 prompt: 'Generate a simple pasta recipe.',17});18
19console.log(JSON.stringify(result.output, null, 2));
```

You can enable strict JSON Schema validation using a provider option:

```
1import { mistral, type MistralLanguageModelOptions } from '@ai-sdk/mistral';2import { generateText, Output } from 'ai';3import { z } from 'zod';4
5const result = await generateText({6 model: mistral('mistral-large-latest'),7 providerOptions: {8 mistral: {9 strictJsonSchema: true,10 } satisfies MistralLanguageModelOptions,11 },12 output: Output.object({13 schema: z.object({14 title: z.string(),15 items: z.array(16 z.object({ id: z.string(), qty: z.number().int().min(1) }),17 ),18 }),19 }),20 prompt: 'Generate a small shopping list.',21});
```

When using structured outputs, the SDK no longer injects an extra "answer with JSON" instruction. It relies on Mistral's native `json_schema`/`json_object` response formats instead. You can customize the schema name/description via the standard structured-output APIs.

### [Model Capabilities](#model-capabilities)

| Model | Image Input | Object Generation | Tool Usage | Tool Streaming |
| --- | --- | --- | --- | --- |
| `pixtral-large-latest` | | | | |
| `mistral-large-latest` | | | | |
| `mistral-medium-latest` | | | | |
| `mistral-medium-2508` | | | | |
| `mistral-medium-2505` | | | | |
| `mistral-small-latest` | | | | |
| `magistral-small-2507` | | | | |
| `magistral-medium-2507` | | | | |
| `magistral-small-2506` | | | | |
| `magistral-medium-2506` | | | | |
| `ministral-3b-latest` | | | | |
| `ministral-8b-latest` | | | | |
| `pixtral-12b-2409` | | | | |
| `open-mistral-7b` | | | | |
| `open-mixtral-8x7b` | | | | |
| `open-mixtral-8x22b` | | | | |

The table above lists popular models. Please see the [Mistral docs](https://docs.mistral.ai/getting-started/models/models_overview/) for a full list of available models. The table above lists popular models. You can also pass any available provider model ID as a string if needed.

## [Embedding Models](#embedding-models)

You can create models that call the [Mistral embeddings API](https://docs.mistral.ai/api/#operation/createEmbedding) using the `.embedding()` factory method.

```
1const model = mistral.embedding('mistral-embed');
```

You can use Mistral embedding models to generate embeddings with the `embed` function:

```
1import { mistral } from '@ai-sdk/mistral';2import { embed } from 'ai';3
4const { embedding } = await embed({5 model: mistral.embedding('mistral-embed'),6 value: 'sunny day at the beach',7});
```

### [Model Capabilities](#model-capabilities-1)

| Model | Default Dimensions |
| --- | --- |
| `mistral-embed` | 1024 |

---
url: https://ai-sdk.dev/providers/ai-sdk-providers/togetherai
title: "AI SDK Providers: Together.ai"
description: "Learn how to use Together.ai's models with the AI SDK."
hash: "27127176802fd537be86eba78a48934891557df969316675edfccdaa6d84fff7"
crawledAt: 2026-03-07T08:05:30.781Z
depth: 2
---

## [Together.ai Provider](#togetherai-provider)

The [Together.ai](https://together.ai/) provider contains support for 200+ open-source models through the [Together.ai API](https://docs.together.ai/reference).

## [Setup](#setup)

The Together.ai provider is available via the `@ai-sdk/togetherai` module. You can install it with

pnpm add @ai-sdk/togetherai

## [Provider Instance](#provider-instance)

You can import the default provider instance `togetherai` from `@ai-sdk/togetherai`:

```
1import { togetherai } from '@ai-sdk/togetherai';
```

If you need a customized setup, you can import `createTogetherAI` from `@ai-sdk/togetherai` and create a provider instance with your settings:

```
1import { createTogetherAI } from '@ai-sdk/togetherai';2
3const togetherai = createTogetherAI({4 apiKey: process.env.TOGETHER_API_KEY ?? '',5});
```

You can use the following optional settings to customize the Together.ai provider instance:

* **baseURL** _string_
 
 Use a different URL prefix for API calls, e.g. to use proxy servers. The default prefix is `https://api.together.xyz/v1`.
 
* **apiKey** _string_
 
 API key that is being sent using the `Authorization` header. It defaults to the `TOGETHER_API_KEY` environment variable.
 
* **headers** _Record<string,string>_
 
 Custom headers to include in the requests.
 
* **fetch** _(input: RequestInfo, init?: RequestInit) => Promise<Response>_
 
 Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation. Defaults to the global `fetch` function. You can use it as a middleware to intercept requests, or to provide a custom fetch implementation for e.g. testing.
 

## [Language Models](#language-models)

You can create [Together.ai models](https://docs.together.ai/docs/serverless-models) using a provider instance. The first argument is the model id, e.g. `google/gemma-2-9b-it`.

```
1const model = togetherai('google/gemma-2-9b-it');
```

### [Reasoning Models](#reasoning-models)

Together.ai exposes the thinking of `deepseek-ai/DeepSeek-R1` in the generated text using the `<think>` tag. You can use the `extractReasoningMiddleware` to extract this reasoning and expose it as a `reasoning` property on the result:

```
1import { togetherai } from '@ai-sdk/togetherai';2import { wrapLanguageModel, extractReasoningMiddleware } from 'ai';3
4const enhancedModel = wrapLanguageModel({5 model: togetherai('deepseek-ai/DeepSeek-R1'),6 middleware: extractReasoningMiddleware({ tagName: 'think' }),7});
```

You can then use that enhanced model in functions like `generateText` and `streamText`.

### [Example](#example)

You can use Together.ai language models to generate text with the `generateText` function:

```
1import { togetherai } from '@ai-sdk/togetherai';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: togetherai('meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo'),6 prompt: 'Write a vegetarian lasagna recipe for 4 people.',7});
```

Together.ai language models can also be used in the `streamText` function (see [AI SDK Core](https://ai-sdk.dev/docs/ai-sdk-core)).

The Together.ai provider also supports [completion models](https://docs.together.ai/docs/serverless-models#language-models) via (following the above example code) `togetherai.completionModel()` and [embedding models](https://docs.together.ai/docs/serverless-models#embedding-models) via `togetherai.embeddingModel()`.

## [Model Capabilities](#model-capabilities)

| Model | Image Input | Object Generation | Tool Usage | Tool Streaming |
| --- | --- | --- | --- | --- |
| `moonshotai/Kimi-K2.5` | | | | |
| `Qwen/Qwen3.5-397B-A17B` | | | | |
| `MiniMaxAI/MiniMax-M2.5` | | | | |
| `zai-org/GLM-5` | | | | |
| `deepseek-ai/DeepSeek-V3.1` | | | | |
| `openai/gpt-oss-120b` | | | | |
| `openai/gpt-oss-20b` | | | | |
| `meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | | | | |

The table above lists popular models. Please see the [Together.ai docs](https://docs.together.ai/docs/serverless-models) for a full list of available models. You can also pass any available provider model ID as a string if needed.

## [Image Models](#image-models)

You can create Together.ai image models using the `.image()` factory method. For more on image generation with the AI SDK see [generateImage()](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-image).

```
1import { togetherai } from '@ai-sdk/togetherai';2import { generateImage } from 'ai';3
4const { images } = await generateImage({5 model: togetherai.image('black-forest-labs/FLUX.1-dev'),6 prompt: 'A delighted resplendent quetzal mid flight amidst raindrops',7});
```

You can pass optional provider-specific request parameters using the `providerOptions` argument.

```
1import {2 togetherai,3 type TogetherAIImageModelOptions,4} from '@ai-sdk/togetherai';5import { generateImage } from 'ai';6
7const { images } = await generateImage({8 model: togetherai.image('black-forest-labs/FLUX.1-dev'),9 prompt: 'A delighted resplendent quetzal mid flight amidst raindrops',10 size: '512x512',11 // Optional additional provider-specific request parameters12 providerOptions: {13 togetherai: {14 steps: 40,15 } satisfies TogetherAIImageModelOptions,16 },17});
```

The following provider options are available:

* **steps** _number_
 
 Number of generation steps. Higher values can improve quality.
 
* **guidance** _number_
 
 Guidance scale for image generation.
 
* **negative\_prompt** _string_
 
 Negative prompt to guide what to avoid.
 
* **disable\_safety\_checker** _boolean_
 
 Disable the safety checker for image generation. When true, the API will not reject images flagged as potentially NSFW. Not available for Flux Schnell Free and Flux Pro models.
 

### [Image Editing](#image-editing)

Together AI supports image editing through FLUX Kontext models. Pass input images via `prompt.images` to transform or edit existing images.

Together AI does not support mask-based inpainting. Instead, use descriptive prompts to specify what you want to change in the image.

#### [Basic Image Editing](#basic-image-editing)

Transform an existing image using text prompts:

```
1const imageBuffer = readFileSync('./input-image.png');2
3const { images } = await generateImage({4 model: togetherai.image('black-forest-labs/FLUX.1-kontext-pro'),5 prompt: {6 text: 'Turn the cat into a golden retriever dog',7 images: [imageBuffer],8 },9 size: '1024x1024',10 providerOptions: {11 togetherai: {12 steps: 28,13 } satisfies TogetherAIImageModelOptions,14 },15});
```

#### [Editing with URL Reference](#editing-with-url-reference)

You can also pass image URLs directly:

```
1const { images } = await generateImage({2 model: togetherai.image('black-forest-labs/FLUX.1-kontext-pro'),3 prompt: {4 text: 'Make the background a lush rainforest',5 images: ['https://example.com/photo.png'],6 },7 size: '1024x1024',8 providerOptions: {9 togetherai: {10 steps: 28,11 } satisfies TogetherAIImageModelOptions,12 },13});
```

Input images can be provided as `Buffer`, `ArrayBuffer`, `Uint8Array`, base64-encoded strings, or URLs. Together AI only supports a single input image per request.

#### [Supported Image Editing Models](#supported-image-editing-models)

| Model | Description |
| --- | --- |
| `black-forest-labs/FLUX.1-kontext-pro` | Production quality, balanced speed |
| `black-forest-labs/FLUX.1-kontext-max` | Maximum image fidelity |
| `black-forest-labs/FLUX.1-kontext-dev` | Development and experimentation |

### [Model Capabilities](#model-capabilities-1)

Together.ai image models support various image dimensions that vary by model. Common sizes include 512x512, 768x768, and 1024x1024, with some models supporting up to 1792x1792. The default size is 1024x1024.

| Available Models |
| --- |
| `stabilityai/stable-diffusion-xl-base-1.0` |
| `black-forest-labs/FLUX.1-dev` |
| `black-forest-labs/FLUX.1-dev-lora` |
| `black-forest-labs/FLUX.1-schnell` |
| `black-forest-labs/FLUX.1-canny` |
| `black-forest-labs/FLUX.1-depth` |
| `black-forest-labs/FLUX.1-redux` |
| `black-forest-labs/FLUX.1.1-pro` |
| `black-forest-labs/FLUX.1-pro` |
| `black-forest-labs/FLUX.1-schnell-Free` |
| `black-forest-labs/FLUX.1-kontext-pro` |
| `black-forest-labs/FLUX.1-kontext-max` |
| `black-forest-labs/FLUX.1-kontext-dev` |

## [Embedding Models](#embedding-models)

You can create Together.ai embedding models using the `.embeddingModel()` factory method. For more on embedding models with the AI SDK see [embed()](https://ai-sdk.dev/docs/reference/ai-sdk-core/embed).

```
1import { togetherai } from '@ai-sdk/togetherai';2import { embed } from 'ai';3
4const { embedding } = await embed({5 model: togetherai.embeddingModel('togethercomputer/m2-bert-80M-2k-retrieval'),6 value: 'sunny day at the beach',7});
```

### [Model Capabilities](#model-capabilities-2)

| Model | Dimensions | Max Tokens |
| --- | --- | --- |
| `BAAI/bge-large-en-v1.5` | 1024 | 512 |
| `Alibaba-NLP/gte-modernbert-base` | 768 | 8192 |
| `intfloat/multilingual-e5-large-instruct` | 1024 | 514 |

## [Reranking Models](#reranking-models)

You can create Together.ai reranking models using the `.reranking()` factory method. For more on reranking with the AI SDK see [rerank()](https://ai-sdk.dev/docs/reference/ai-sdk-core/rerank).

```
1import { togetherai } from '@ai-sdk/togetherai';2import { rerank } from 'ai';3
4const documents = [5 'sunny day at the beach',6 'rainy afternoon in the city',7 'snowy night in the mountains',8];9
10const { ranking } = await rerank({11 model: togetherai.reranking('mixedbread-ai/Mxbai-Rerank-Large-V2'),12 documents,13 query: 'talk about rain',14 topN: 2,15});16
17console.log(ranking);18// [19// { originalIndex: 1, score: 0.9, document: 'rainy afternoon in the city' },20// { originalIndex: 0, score: 0.3, document: 'sunny day at the beach' }21// ]
```

Together.ai reranking models support additional provider options for object documents. You can specify which fields to use for ranking:

```
1import {2 togetherai,3 type TogetherAIRerankingModelOptions,4} from '@ai-sdk/togetherai';5import { rerank } from 'ai';6
7const documents = [8 {9 from: 'Paul Doe',10 subject: 'Follow-up',11 text: 'We are happy to give you a discount of 20%.',12 },13 {14 from: 'John McGill',15 subject: 'Missing Info',16 text: 'Here is the pricing from Oracle: $5000/month',17 },18];19
20const { ranking } = await rerank({21 model: togetherai.reranking('mixedbread-ai/Mxbai-Rerank-Large-V2'),22 documents,23 query: 'Which pricing did we get from Oracle?',24 providerOptions: {25 togetherai: {26 rankFields: ['from', 'subject', 'text'], // Specify which fields to rank by27 } satisfies TogetherAIRerankingModelOptions,28 },29});
```

The following provider options are available:

* **rankFields** _string\[\]_
 
 Array of field names to use for ranking when documents are JSON objects. If not specified, all fields are used.
 

### [Model Capabilities](#model-capabilities-3)

| Model |
| --- |
| `mixedbread-ai/Mxbai-Rerank-Large-V2` |

---
url: https://ai-sdk.dev/providers/ai-sdk-providers/cohere
title: "AI SDK Providers: Cohere"
description: "Learn how to use the Cohere provider for the AI SDK."
hash: "c7faf299e97a0a2c7f7098a41d13e02e7b8d9a1b4deb6dddae9d9b4aeefd7477"
crawledAt: 2026-03-07T08:05:38.361Z
depth: 2
---

## [Cohere Provider](#cohere-provider)

The [Cohere](https://cohere.com/) provider contains language and embedding model support for the Cohere chat API.

## [Setup](#setup)

The Cohere provider is available in the `@ai-sdk/cohere` module. You can install it with

pnpm add @ai-sdk/cohere

## [Provider Instance](#provider-instance)

You can import the default provider instance `cohere` from `@ai-sdk/cohere`:

```
1import { cohere } from '@ai-sdk/cohere';
```

If you need a customized setup, you can import `createCohere` from `@ai-sdk/cohere` and create a provider instance with your settings:

```
1import { createCohere } from '@ai-sdk/cohere';2
3const cohere = createCohere({4 // custom settings5});
```

You can use the following optional settings to customize the Cohere provider instance:

* **baseURL** _string_
 
 Use a different URL prefix for API calls, e.g. to use proxy servers. The default prefix is `https://api.cohere.com/v2`.
 
* **apiKey** _string_
 
 API key that is being sent using the `Authorization` header. It defaults to the `COHERE_API_KEY` environment variable.
 
* **headers** _Record<string,string>_
 
 Custom headers to include in the requests.
 
* **fetch** _(input: RequestInfo, init?: RequestInit) => Promise<Response>_
 
 Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation. Defaults to the global `fetch` function. You can use it as a middleware to intercept requests, or to provide a custom fetch implementation for e.g. testing.
 
* **generateId** _() => string_
 
 Optional function to generate unique IDs for each request. Defaults to the SDK's built-in ID generator.
 

## [Language Models](#language-models)

You can create models that call the [Cohere chat API](https://docs.cohere.com/v2/docs/chat-api) using a provider instance. The first argument is the model id, e.g. `command-r-plus`. Some Cohere chat models support tool calls.

```
1const model = cohere('command-r-plus');
```

### [Example](#example)

You can use Cohere language models to generate text with the `generateText` function:

```
1import { cohere } from '@ai-sdk/cohere';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: cohere('command-r-plus'),6 prompt: 'Write a vegetarian lasagna recipe for 4 people.',7});
```

Cohere language models can also be used in the `streamText` function and support structured data generation with [`Output`](https://ai-sdk.dev/docs/reference/ai-sdk-core/output) (see [AI SDK Core](https://ai-sdk.dev/docs/ai-sdk-core)).

### [Model Capabilities](#model-capabilities)

| Model | Image Input | Object Generation | Tool Usage | Tool Streaming |
| --- | --- | --- | --- | --- |
| `command-a-03-2025` | | | | |
| `command-a-reasoning-08-2025` | | | | |
| `command-r7b-12-2024` | | | | |
| `command-r-plus-04-2024` | | | | |
| `command-r-plus` | | | | |
| `command-r-08-2024` | | | | |
| `command-r-03-2024` | | | | |
| `command-r` | | | | |
| `command` | | | | |
| `command-nightly` | | | | |
| `command-light` | | | | |
| `command-light-nightly` | | | | |

The table above lists popular models. Please see the [Cohere docs](https://docs.cohere.com/v2/docs/models#command) for a full list of available models. You can also pass any available provider model ID as a string if needed.

#### [Reasoning](#reasoning)

Cohere has introduced reasoning with the `command-a-reasoning-08-2025` model. You can learn more at [https://docs.cohere.com/docs/reasoning](https://docs.cohere.com/docs/reasoning).

```
1import { cohere, type CohereLanguageModelOptions } from '@ai-sdk/cohere';2import { generateText } from 'ai';3
4async function main() {5 const { text, reasoning } = await generateText({6 model: cohere('command-a-reasoning-08-2025'),7 prompt:8 "Alice has 3 brothers and she also has 2 sisters. How many sisters does Alice's brother have?",9 // optional: reasoning options10 providerOptions: {11 cohere: {12 thinking: {13 type: 'enabled',14 tokenBudget: 100,15 },16 } satisfies CohereLanguageModelOptions,17 },18 });19
20 console.log(reasoning);21 console.log(text);22}23
24main().catch(console.error);
```

## [Embedding Models](#embedding-models)

You can create models that call the [Cohere embed API](https://docs.cohere.com/v2/reference/embed) using the `.embedding()` factory method.

```
1const model = cohere.embedding('embed-english-v3.0');
```

You can use Cohere embedding models to generate embeddings with the `embed` function:

```
1import { cohere, type CohereEmbeddingModelOptions } from '@ai-sdk/cohere';2import { embed } from 'ai';3
4const { embedding } = await embed({5 model: cohere.embedding('embed-english-v3.0'),6 value: 'sunny day at the beach',7 providerOptions: {8 cohere: {9 inputType: 'search_document',10 } satisfies CohereEmbeddingModelOptions,11 },12});
```

Cohere embedding models support additional provider options that can be passed via `providerOptions.cohere`:

```
1import { cohere, type CohereEmbeddingModelOptions } from '@ai-sdk/cohere';2import { embed } from 'ai';3
4const { embedding } = await embed({5 model: cohere.embedding('embed-english-v3.0'),6 value: 'sunny day at the beach',7 providerOptions: {8 cohere: {9 inputType: 'search_document',10 truncate: 'END',11 } satisfies CohereEmbeddingModelOptions,12 },13});
```

The following provider options are available:

* **inputType** _'search\_document' | 'search\_query' | 'classification' | 'clustering'_
 
 Specifies the type of input passed to the model. Default is `search_query`.
 
 * `search_document`: Used for embeddings stored in a vector database for search use-cases.
 * `search_query`: Used for embeddings of search queries run against a vector DB to find relevant documents.
 * `classification`: Used for embeddings passed through a text classifier.
 * `clustering`: Used for embeddings run through a clustering algorithm.
* **truncate** _'NONE' | 'START' | 'END'_
 
 Specifies how the API will handle inputs longer than the maximum token length. Default is `END`.
 
 * `NONE`: If selected, when the input exceeds the maximum input token length will return an error.
 * `START`: Will discard the start of the input until the remaining input is exactly the maximum input token length for the model.
 * `END`: Will discard the end of the input until the remaining input is exactly the maximum input token length for the model.

### [Model Capabilities](#model-capabilities-1)

| Model | Embedding Dimensions |
| --- | --- |
| `embed-english-v3.0` | 1024 |
| `embed-multilingual-v3.0` | 1024 |
| `embed-english-light-v3.0` | 384 |
| `embed-multilingual-light-v3.0` | 384 |
| `embed-english-v2.0` | 4096 |
| `embed-english-light-v2.0` | 1024 |
| `embed-multilingual-v2.0` | 768 |

## [Reranking Models](#reranking-models)

You can create models that call the [Cohere rerank API](https://docs.cohere.com/v2/reference/rerank) using the `.reranking()` factory method.

```
1const model = cohere.reranking('rerank-v3.5');
```

You can use Cohere reranking models to rerank documents with the `rerank` function:

```
1import { cohere } from '@ai-sdk/cohere';2import { rerank } from 'ai';3
4const documents = [5 'sunny day at the beach',6 'rainy afternoon in the city',7 'snowy night in the mountains',8];9
10const { ranking } = await rerank({11 model: cohere.reranking('rerank-v3.5'),12 documents,13 query: 'talk about rain',14 topN: 2,15});16
17console.log(ranking);18// [19// { originalIndex: 1, score: 0.9, document: 'rainy afternoon in the city' },20// { originalIndex: 0, score: 0.3, document: 'sunny day at the beach' }21// ]
```

Cohere reranking models support additional provider options that can be passed via `providerOptions.cohere`:

```
1import { cohere, type CohereRerankingModelOptions } from '@ai-sdk/cohere';2import { rerank } from 'ai';3
4const { ranking } = await rerank({5 model: cohere.reranking('rerank-v3.5'),6 documents: ['sunny day at the beach', 'rainy afternoon in the city'],7 query: 'talk about rain',8 providerOptions: {9 cohere: {10 maxTokensPerDoc: 1000,11 priority: 1,12 } satisfies CohereRerankingModelOptions,13 },14});
```

The following provider options are available:

* **maxTokensPerDoc** _number_
 
 Maximum number of tokens per document. Default is `4096`.
 
* **priority** _number_
 
 Priority of the request. Default is `0`.
 

### [Model Capabilities](#model-capabilities-2)

| Model |
| --- |
| `rerank-v3.5` |
| `rerank-english-v3.0` |
| `rerank-multilingual-v3.0` |

---
url: https://ai-sdk.dev/providers/ai-sdk-providers/fireworks
title: "AI SDK Providers: Fireworks"
description: "Learn how to use Fireworks models with the AI SDK."
hash: "9585e81813c0ca641c2e5854d2e6821c83ad273546594cc182b48348042bc778"
crawledAt: 2026-03-07T08:05:44.377Z
depth: 2
---

## [Fireworks Provider](#fireworks-provider)

[Fireworks](https://fireworks.ai/) is a platform for running and testing LLMs through their [API](https://readme.fireworks.ai/).

## [Setup](#setup)

The Fireworks provider is available via the `@ai-sdk/fireworks` module. You can install it with

pnpm add @ai-sdk/fireworks

## [Provider Instance](#provider-instance)

You can import the default provider instance `fireworks` from `@ai-sdk/fireworks`:

```
1import { fireworks } from '@ai-sdk/fireworks';
```

If you need a customized setup, you can import `createFireworks` from `@ai-sdk/fireworks` and create a provider instance with your settings:

```
1import { createFireworks } from '@ai-sdk/fireworks';2
3const fireworks = createFireworks({4 apiKey: process.env.FIREWORKS_API_KEY ?? '',5});
```

You can use the following optional settings to customize the Fireworks provider instance:

* **baseURL** _string_
 
 Use a different URL prefix for API calls, e.g. to use proxy servers. The default prefix is `https://api.fireworks.ai/inference/v1`.
 
* **apiKey** _string_
 
 API key that is being sent using the `Authorization` header. It defaults to the `FIREWORKS_API_KEY` environment variable.
 
* **headers** _Record<string,string>_
 
 Custom headers to include in the requests.
 
* **fetch** _(input: RequestInfo, init?: RequestInit) => Promise<Response>_
 
 Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation.
 

## [Language Models](#language-models)

You can create [Fireworks models](https://fireworks.ai/models) using a provider instance. The first argument is the model id, e.g. `accounts/fireworks/models/firefunction-v1`:

```
1const model = fireworks('accounts/fireworks/models/firefunction-v1');
```

### [Reasoning Models](#reasoning-models)

Fireworks exposes the thinking of `deepseek-r1` in the generated text using the `<think>` tag. You can use the `extractReasoningMiddleware` to extract this reasoning and expose it as a `reasoning` property on the result:

```
1import { fireworks } from '@ai-sdk/fireworks';2import { wrapLanguageModel, extractReasoningMiddleware } from 'ai';3
4const enhancedModel = wrapLanguageModel({5 model: fireworks('accounts/fireworks/models/deepseek-r1'),6 middleware: extractReasoningMiddleware({ tagName: 'think' }),7});
```

You can then use that enhanced model in functions like `generateText` and `streamText`.

### [Example](#example)

You can use Fireworks language models to generate text with the `generateText` function:

```
1import { fireworks } from '@ai-sdk/fireworks';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: fireworks('accounts/fireworks/models/firefunction-v1'),6 prompt: 'Write a vegetarian lasagna recipe for 4 people.',7});
```

Fireworks language models can also be used in the `streamText` function (see [AI SDK Core](https://ai-sdk.dev/docs/ai-sdk-core)).

### [Provider Options](#provider-options)

Fireworks chat models support additional provider options that are not part of the [standard call settings](https://ai-sdk.dev/docs/ai-sdk-core/settings). You can pass them in the `providerOptions` argument:

```
1import {2 fireworks,3 type FireworksLanguageModelOptions,4} from '@ai-sdk/fireworks';5import { generateText } from 'ai';6
7const { text, reasoningText } = await generateText({8 model: fireworks('accounts/fireworks/models/kimi-k2p5'),9 providerOptions: {10 fireworks: {11 thinking: { type: 'enabled', budgetTokens: 4096 },12 reasoningHistory: 'interleaved',13 } satisfies FireworksLanguageModelOptions,14 },15 prompt: 'How many "r"s are in the word "strawberry"?',16});
```

The following optional provider options are available for Fireworks chat models:

* **thinking** _object_
 
 Configuration for thinking/reasoning models like Kimi K2.5.
 
 * **type** _'enabled' | 'disabled'_
 
 Whether to enable thinking mode.
 
 * **budgetTokens** _number_
 
 Maximum number of tokens for thinking (minimum 1024).
 
* **reasoningHistory** _'disabled' | 'interleaved' | 'preserved'_
 
 Controls how reasoning history is handled in multi-turn conversations:
 
 * `'disabled'`: Remove reasoning from history
 * `'interleaved'`: Include reasoning between tool calls within a single turn
 * `'preserved'`: Keep all reasoning in history

### [Completion Models](#completion-models)

You can create models that call the Fireworks completions API using the `.completionModel()` factory method:

```
1const model = fireworks.completionModel(2 'accounts/fireworks/models/firefunction-v1',3);
```

### [Model Capabilities](#model-capabilities)

| Model | Image Input | Object Generation | Tool Usage | Tool Streaming |
| --- | --- | --- | --- | --- |
| `accounts/fireworks/models/firefunction-v1` | | | | |
| `accounts/fireworks/models/deepseek-r1` | | | | |
| `accounts/fireworks/models/deepseek-v3` | | | | |
| `accounts/fireworks/models/llama-v3p1-405b-instruct` | | | | |
| `accounts/fireworks/models/llama-v3p1-8b-instruct` | | | | |
| `accounts/fireworks/models/llama-v3p2-3b-instruct` | | | | |
| `accounts/fireworks/models/llama-v3p3-70b-instruct` | | | | |
| `accounts/fireworks/models/mixtral-8x7b-instruct` | | | | |
| `accounts/fireworks/models/mixtral-8x7b-instruct-hf` | | | | |
| `accounts/fireworks/models/mixtral-8x22b-instruct` | | | | |
| `accounts/fireworks/models/qwen2p5-coder-32b-instruct` | | | | |
| `accounts/fireworks/models/qwen2p5-72b-instruct` | | | | |
| `accounts/fireworks/models/qwen-qwq-32b-preview` | | | | |
| `accounts/fireworks/models/qwen2-vl-72b-instruct` | | | | |
| `accounts/fireworks/models/llama-v3p2-11b-vision-instruct` | | | | |
| `accounts/fireworks/models/qwq-32b` | | | | |
| `accounts/fireworks/models/yi-large` | | | | |
| `accounts/fireworks/models/kimi-k2-instruct` | | | | |
| `accounts/fireworks/models/kimi-k2-thinking` | | | | |
| `accounts/fireworks/models/kimi-k2p5` | | | | |
| `accounts/fireworks/models/minimax-m2` | | | | |

The table above lists popular models. Please see the [Fireworks models page](https://fireworks.ai/models) for a full list of available models.

## [Embedding Models](#embedding-models)

You can create models that call the Fireworks embeddings API using the `.embeddingModel()` factory method:

```
1const model = fireworks.embeddingModel('nomic-ai/nomic-embed-text-v1.5');
```

You can use Fireworks embedding models to generate embeddings with the `embed` function:

```
1import { fireworks } from '@ai-sdk/fireworks';2import { embed } from 'ai';3
4const { embedding } = await embed({5 model: fireworks.embeddingModel('nomic-ai/nomic-embed-text-v1.5'),6 value: 'sunny day at the beach',7});
```

### [Model Capabilities](#model-capabilities-1)

| Model | Dimensions | Max Tokens |
| --- | --- | --- |
| `nomic-ai/nomic-embed-text-v1.5` | 768 | 8192 |

## [Image Models](#image-models)

You can create Fireworks image models using the `.image()` factory method. For more on image generation with the AI SDK see [generateImage()](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-image).

```
1import { fireworks } from '@ai-sdk/fireworks';2import { generateImage } from 'ai';3
4const { image } = await generateImage({5 model: fireworks.image('accounts/fireworks/models/flux-1-dev-fp8'),6 prompt: 'A futuristic cityscape at sunset',7 aspectRatio: '16:9',8});
```

Model support for `size` and `aspectRatio` parameters varies. See the [Model Capabilities](#model-capabilities-1) section below for supported dimensions, or check the model's documentation on [Fireworks models page](https://fireworks.ai/models) for more details.

### [Image Editing](#image-editing)

Fireworks supports image editing through FLUX Kontext models (`flux-kontext-pro` and `flux-kontext-max`). Pass input images via `prompt.images` to transform or edit existing images.

Fireworks Kontext models do not support explicit masks. Editing is prompt-driven — describe what you want to change in the text prompt.

#### [Basic Image Editing](#basic-image-editing)

Transform an existing image using text prompts:

```
1const imageBuffer = readFileSync('./input-image.png');2
3const { images } = await generateImage({4 model: fireworks.image('accounts/fireworks/models/flux-kontext-pro'),5 prompt: {6 text: 'Turn the cat into a golden retriever dog',7 images: [imageBuffer],8 },9 providerOptions: {10 fireworks: {11 output_format: 'jpeg',12 },13 },14});
```

#### [Style Transfer](#style-transfer)

Apply artistic styles to an image:

```
1const imageBuffer = readFileSync('./input-image.png');2
3const { images } = await generateImage({4 model: fireworks.image('accounts/fireworks/models/flux-kontext-pro'),5 prompt: {6 text: 'Transform this into a watercolor painting style',7 images: [imageBuffer],8 },9 aspectRatio: '1:1',10});
```

Input images can be provided as `Buffer`, `ArrayBuffer`, `Uint8Array`, or base64-encoded strings. Fireworks only supports a single input image per request.

### [Model Capabilities](#model-capabilities-2)

For all models supporting aspect ratios, the following aspect ratios are supported:

`1:1 (default), 2:3, 3:2, 4:5, 5:4, 16:9, 9:16, 9:21, 21:9`

For all models supporting size, the following sizes are supported:

`640 x 1536, 768 x 1344, 832 x 1216, 896 x 1152, 1024x1024 (default), 1152 x 896, 1216 x 832, 1344 x 768, 1536 x 640`

| Model | Dimensions Specification | Image Editing |
| --- | --- | --- |
| `accounts/fireworks/models/flux-kontext-pro` | Aspect Ratio | |
| `accounts/fireworks/models/flux-kontext-max` | Aspect Ratio | |
| `accounts/fireworks/models/flux-1-dev-fp8` | Aspect Ratio | |
| `accounts/fireworks/models/flux-1-schnell-fp8` | Aspect Ratio | |
| `accounts/fireworks/models/playground-v2-5-1024px-aesthetic` | Size | |
| `accounts/fireworks/models/japanese-stable-diffusion-xl` | Size | |
| `accounts/fireworks/models/playground-v2-1024px-aesthetic` | Size | |
| `accounts/fireworks/models/SSD-1B` | Size | |
| `accounts/fireworks/models/stable-diffusion-xl-1024-v1-0` | Size | |

For more details, see the [Fireworks models page](https://fireworks.ai/models).

#### [Stability AI Models](#stability-ai-models)

Fireworks also presents several Stability AI models backed by Stability AI API keys and endpoint. The AI SDK Fireworks provider does not currently include support for these models:

| Model ID |
| --- |
| `accounts/stability/models/sd3-turbo` |
| `accounts/stability/models/sd3-medium` |
| `accounts/stability/models/sd3` |