---
url: https://ai-sdk.dev/docs/getting-started
title: "Getting Started"
description: "Welcome to the AI SDK documentation!"
hash: "8dea714e13ca1c269a3cfe38bb218f432d97230bbaaefd3b93e041f4f7448a65"
crawledAt: 2026-03-07T07:56:56.287Z
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
url: https://ai-sdk.dev/docs/getting-started/choosing-a-provider
title: "Getting Started: Choosing a Provider"
description: "Learn how to configure and authenticate with AI providers in the AI SDK."
hash: "fcf6389fedd7be86909315edaa1a019d4a31f640bcf6c04142a3f0bf76917f8e"
crawledAt: 2026-03-07T07:57:45.001Z
depth: 2
---

The AI SDK supports dozens of model providers through [first-party](https://ai-sdk.dev/providers/ai-sdk-providers), [OpenAI-compatible](https://ai-sdk.dev/providers/openai-compatible-providers), and [community](https://ai-sdk.dev/providers/community-providers) packages.

```
1import { generateText } from 'ai';2
3const { text } = await generateText({4 model: "anthropic/claude-sonnet-4.5",5 prompt: 'What is love?',6});
```

## [AI Gateway](#ai-gateway)

The [Vercel AI Gateway](https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway) is the fastest way to get started with the AI SDK. Access models from OpenAI, Anthropic, Google, and other providers. Authenticate with [OIDC](https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway#oidc-authentication-vercel-deployments) or an AI Gateway API key

Add your API key to your environment:

```
1AI_GATEWAY_API_KEY=your_api_key_here
```

The AI Gateway is the default [global provider](https://ai-sdk.dev/docs/ai-sdk-core/provider-management#global-provider-configuration), so you can access models using a simple string:

```
1import { generateText } from 'ai';2
3const { text } = await generateText({4 model: 'anthropic/claude-sonnet-4.5',5 prompt: 'What is love?',6});
```

You can also explicitly import and use the gateway provider:

```
1// Option 1: Import from 'ai' package (included by default)2import { gateway } from 'ai';3model: gateway('anthropic/claude-sonnet-4.5');4
5// Option 2: Install and import from '@ai-sdk/gateway' package6import { gateway } from '@ai-sdk/gateway';7model: gateway('anthropic/claude-sonnet-4.5');
```

## [Using Dedicated Providers](#using-dedicated-providers)

You can also use [first-party](https://ai-sdk.dev/providers/ai-sdk-providers), [OpenAI-compatible](https://ai-sdk.dev/providers/openai-compatible-providers), and [community](https://ai-sdk.dev/providers/community-providers) provider packages directly. Install the package and create a provider instance. For example, to use Anthropic:

pnpm add @ai-sdk/anthropic

```
1import { anthropic } from '@ai-sdk/anthropic';2
3model: anthropic('claude-sonnet-4-5');
```

You can change the default global provider so string model references use your preferred provider everywhere in your application. Learn more about [provider management](https://ai-sdk.dev/docs/ai-sdk-core/provider-management#global-provider-configuration).

See [available providers](https://ai-sdk.dev/providers/ai-sdk-providers) for setup instructions for each provider.

## [Custom Providers](#custom-providers)

You can build your own provider to integrate any service with the AI SDK. The AI SDK provides a [Language Model Specification](https://github.com/vercel/ai/tree/main/packages/provider/src/language-model/v3) that ensures compatibility across providers.

```
1import { generateText } from 'ai';2import { yourProvider } from 'your-custom-provider';3
4const { text } = await generateText({5 model: yourProvider('your-model-id'),6 prompt: 'What is love?',7});
```

See [Writing a Custom Provider](https://ai-sdk.dev/providers/community-providers/custom-providers) for a complete guide.

---
url: https://ai-sdk.dev/docs/getting-started/navigating-the-library
title: "Getting Started: Navigating the Library"
description: "Learn how to navigate the AI SDK."
hash: "82c49f6c9ae70132d55cf3676fb69983f720e28dde2a0c248c56f14ad8cea016"
crawledAt: 2026-03-07T07:57:51.325Z
depth: 2
---

The AI SDK is a powerful toolkit for building AI applications. This page will help you pick the right tools for your requirements.

Let’s start with a quick overview of the AI SDK, which is comprised of three parts:

* **[AI SDK Core](https://ai-sdk.dev/docs/ai-sdk-core/overview):** A unified, provider agnostic API for generating text, structured objects, and tool calls with LLMs.
* **[AI SDK UI](https://ai-sdk.dev/docs/ai-sdk-ui/overview):** A set of framework-agnostic hooks for building chat and generative user interfaces.
* [AI SDK RSC](https://ai-sdk.dev/docs/ai-sdk-rsc/overview): Stream generative user interfaces with React Server Components (RSC). Development is currently experimental and we recommend using [AI SDK UI](https://ai-sdk.dev/docs/ai-sdk-ui/overview).

## [Choosing the Right Tool for Your Environment](#choosing-the-right-tool-for-your-environment)

When deciding which part of the AI SDK to use, your first consideration should be the environment and existing stack you are working with. Different components of the SDK are tailored to specific frameworks and environments.

| Library | Purpose | Environment Compatibility |
| --- | --- | --- |
| [AI SDK Core](https://ai-sdk.dev/docs/ai-sdk-core/overview) | Call any LLM with unified API (e.g. [generateText](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text) and [streamText](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text)) | Any JS environment (e.g. Node.js, Deno, Browser) |
| [AI SDK UI](https://ai-sdk.dev/docs/ai-sdk-ui/overview) | Build streaming chat and generative UIs (e.g. [useChat](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat)) | React & Next.js, Vue & Nuxt, Svelte & SvelteKit |
| [AI SDK RSC](https://ai-sdk.dev/docs/ai-sdk-rsc/overview) | Stream generative UIs from Server to Client (e.g. [streamUI](https://ai-sdk.dev/docs/reference/ai-sdk-rsc/stream-ui)). Development is currently experimental and we recommend using [AI SDK UI](https://ai-sdk.dev/docs/ai-sdk-ui/overview). | Any framework that supports React Server Components (e.g. Next.js) |

## [Environment Compatibility](#environment-compatibility)

These tools have been designed to work seamlessly with each other and it's likely that you will be using them together. Let's look at how you could decide which libraries to use based on your application environment, existing stack, and requirements.

The following table outlines AI SDK compatibility based on environment:

| Environment | [AI SDK Core](https://ai-sdk.dev/docs/ai-sdk-core/overview) | [AI SDK UI](https://ai-sdk.dev/docs/ai-sdk-ui/overview) | [AI SDK RSC](https://ai-sdk.dev/docs/ai-sdk-rsc/overview) |
| --- | --- | --- | --- |
| None / Node.js / Deno | | | |
| Vue / Nuxt | | | |
| Svelte / SvelteKit | | | |
| Next.js Pages Router | | | |
| Next.js App Router | | | |

## [When to use AI SDK UI](#when-to-use-ai-sdk-ui)

AI SDK UI provides a set of framework-agnostic hooks for quickly building **production-ready AI-native applications**. It offers:

* Full support for streaming chat and client-side generative UI
* Utilities for handling common AI interaction patterns (i.e. chat, completion, assistant)
* Production-tested reliability and performance
* Compatibility across popular frameworks

## [AI SDK UI Framework Compatibility](#ai-sdk-ui-framework-compatibility)

AI SDK UI supports the following frameworks: [React](https://react.dev/), [Svelte](https://svelte.dev/), and [Vue.js](https://vuejs.org/). Here is a comparison of the supported functions across these frameworks:

| Function | React | Svelte | Vue.js |
| --- | --- | --- | --- |
| [useChat](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat) | | | |
| [useChat](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat) tool calling | | | |
| [useCompletion](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-completion) | | | |
| [useObject](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-object) | | | |

[Contributions](https://github.com/vercel/ai/blob/main/CONTRIBUTING.md) are welcome to implement missing features for non-React frameworks.

## [When to use AI SDK RSC](#when-to-use-ai-sdk-rsc)

AI SDK RSC is currently experimental. We recommend using [AI SDK UI](https://ai-sdk.dev/docs/ai-sdk-ui/overview) for production. For guidance on migrating from RSC to UI, see our [migration guide](https://ai-sdk.dev/docs/ai-sdk-rsc/migrating-to-ui).

[React Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components) (RSCs) provide a new approach to building React applications that allow components to render on the server, fetch data directly, and stream the results to the client, reducing bundle size and improving performance. They also introduce a new way to call server-side functions from anywhere in your application called [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations).

AI SDK RSC provides a number of utilities that allow you to stream values and UI directly from the server to the client. However, **it's important to be aware of current limitations**:

* **Cancellation**: currently, it is not possible to abort a stream using Server Actions. This will be improved in future releases of React and Next.js.
* **Increased Data Transfer**: using [`createStreamableUI`](https://ai-sdk.dev/docs/reference/ai-sdk-rsc/create-streamable-ui) can lead to quadratic data transfer (quadratic to the length of generated text). You can avoid this using [`createStreamableValue`](https://ai-sdk.dev/docs/reference/ai-sdk-rsc/create-streamable-value) instead, and rendering the component client-side.
* **Re-mounting Issue During Streaming**: when using `createStreamableUI`, components re-mount on `.done()`, causing [flickering](https://github.com/vercel/ai/issues/2232).

Given these limitations, **we recommend using [AI SDK UI](https://ai-sdk.dev/docs/ai-sdk-ui/overview) for production applications**.

---
url: https://ai-sdk.dev/docs/getting-started/nextjs-app-router
title: "Getting Started: Next.js App Router"
description: "Learn how to build your first agent with the AI SDK and Next.js App Router."
hash: "b288c2fbd18ceb8fa8cfe10cc68357edc0297d11d43333471d713e1bfcb44481"
crawledAt: 2026-03-07T07:57:57.066Z
depth: 2
---

## [Next.js App Router Quickstart](#nextjs-app-router-quickstart)

The AI SDK is a powerful TypeScript library designed to help developers build AI-powered applications.

In this quickstart tutorial, you'll build a simple agent with a streaming chat user interface. Along the way, you'll learn key concepts and techniques that are fundamental to using the AI SDK in your own projects.

If you are unfamiliar with the concepts of [Prompt Engineering](https://ai-sdk.dev/docs/advanced/prompt-engineering) and [HTTP Streaming](https://ai-sdk.dev/docs/foundations/streaming), you can optionally read these documents first.

## [Prerequisites](#prerequisites)

To follow this quickstart, you'll need:

* Node.js 18+ and pnpm installed on your local development machine.
* A [Vercel AI Gateway](https://vercel.com/ai-gateway) API key.

If you haven't obtained your Vercel AI Gateway API key, you can do so by [signing up](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai&title=Go+to+AI+Gateway) on the Vercel website.

## [Create Your Application](#create-your-application)

Start by creating a new Next.js application. This command will create a new directory named `my-ai-app` and set up a basic Next.js application inside it.

Be sure to select yes when prompted to use the App Router and Tailwind CSS. If you are looking for the Next.js Pages Router quickstart guide, you can find it [here](https://ai-sdk.dev/docs/getting-started/nextjs-pages-router).

pnpm create next-app@latest my-ai-app

Navigate to the newly created directory:

cd my-ai-app

### [Install dependencies](#install-dependencies)

Install `ai` and `@ai-sdk/react`, the AI package and AI SDK's React hooks. The AI SDK's [Vercel AI Gateway provider](https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway) ships with the `ai` package. You'll also install `zod`, a schema validation library used for defining tool inputs.

This guide uses the Vercel AI Gateway provider so you can access hundreds of models from different providers with one API key, but you can switch to any provider or model by installing its package. Check out available [AI SDK providers](https://ai-sdk.dev/providers/ai-sdk-providers) for more information.

pnpm add ai @ai-sdk/react zod

### [Configure your AI Gateway API key](#configure-your-ai-gateway-api-key)

Create a `.env.local` file in your project root and add your AI Gateway API key. This key authenticates your application with Vercel AI Gateway.

touch.env.local

Edit the `.env.local` file:

```
1AI_GATEWAY_API_KEY=xxxxxxxxx
```

Replace `xxxxxxxxx` with your actual Vercel AI Gateway API key.

The AI SDK's Vercel AI Gateway Provider will default to using the `AI_GATEWAY_API_KEY` environment variable.

## [Create a Route Handler](#create-a-route-handler)

Create a route handler, `app/api/chat/route.ts` and add the following code:

```
1import { streamText, UIMessage, convertToModelMessages } from 'ai';2
3export async function POST(req: Request) {4 const { messages }: { messages: UIMessage[] } = await req.json();5
6 const result = streamText({7 model: "anthropic/claude-sonnet-4.5",8 messages: await convertToModelMessages(messages),9 });10
11 return result.toUIMessageStreamResponse();12}
```

Let's take a look at what is happening in this code:

1. Define an asynchronous `POST` request handler and extract `messages` from the body of the request. The `messages` variable contains a history of the conversation between you and the chatbot and provides the chatbot with the necessary context to make the next generation. The `messages` are of UIMessage type, which are designed for use in application UI - they contain the entire message history and associated metadata like timestamps.
2. Call [`streamText`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text), which is imported from the `ai` package. This function accepts a configuration object that contains a `model` provider and `messages` (defined in step 1). You can pass additional [settings](https://ai-sdk.dev/docs/ai-sdk-core/settings) to further customize the model's behavior. The `messages` key expects a `ModelMessage[]` array. This type is different from `UIMessage` in that it does not include metadata, such as timestamps or sender information. To convert between these types, we use the `convertToModelMessages` function, which strips the UI-specific metadata and transforms the `UIMessage[]` array into the `ModelMessage[]` format that the model expects.
3. The `streamText` function returns a [`StreamTextResult`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text#result-object). This result object contains the [`toUIMessageStreamResponse`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text#to-ui-message-stream-response) function which converts the result to a streamed response object.
4. Finally, return the result to the client to stream the response.

This Route Handler creates a POST request endpoint at `/api/chat`.

## [Choosing a Provider](#choosing-a-provider)

The AI SDK supports dozens of model providers through [first-party](https://ai-sdk.dev/providers/ai-sdk-providers), [OpenAI-compatible](https://ai-sdk.dev/providers/openai-compatible-providers), and [community](https://ai-sdk.dev/providers/community-providers) packages.

This quickstart uses the [Vercel AI Gateway](https://vercel.com/ai-gateway) provider, which is the default [global provider](https://ai-sdk.dev/docs/ai-sdk-core/provider-management#global-provider-configuration). This means you can access models using a simple string in the model configuration:

```
1model: "anthropic/claude-sonnet-4.5";
```

You can also explicitly import and use the gateway provider in two other equivalent ways:

```
1// Option 1: Import from 'ai' package (included by default)2import { gateway } from 'ai';3model: gateway('anthropic/claude-sonnet-4.5');4
5// Option 2: Install and import from '@ai-sdk/gateway' package6import { gateway } from '@ai-sdk/gateway';7model: gateway('anthropic/claude-sonnet-4.5');
```

### [Using other providers](#using-other-providers)

To use a different provider, install its package and create a provider instance. For example, to use OpenAI directly:

pnpm add @ai-sdk/openai

```
1import { openai } from '@ai-sdk/openai';2
3model: openai('gpt-5.1');
```

#### [Updating the global provider](#updating-the-global-provider)

You can change the default global provider so string model references use your preferred provider everywhere in your application. Learn more about [provider management](https://ai-sdk.dev/docs/ai-sdk-core/provider-management#global-provider-configuration).

Pick the approach that best matches how you want to manage providers across your application.

## [Wire up the UI](#wire-up-the-ui)

Now that you have a Route Handler that can query an LLM, it's time to setup your frontend. The AI SDK's [UI](https://ai-sdk.dev/docs/ai-sdk-ui) package abstracts the complexity of a chat interface into one hook, [`useChat`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat).

Update your root page (`app/page.tsx`) with the following code to show a list of chat messages and provide a user message input:

```
1'use client';2
3import { useChat } from '@ai-sdk/react';4import { useState } from 'react';5
6export default function Chat() {7 const [input, setInput] = useState('');8 const { messages, sendMessage } = useChat();9 return (10 <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">11 {messages.map(message => (12 <div key={message.id} className="whitespace-pre-wrap">13 {message.role === 'user' ? 'User: ' : 'AI: '}14 {message.parts.map((part, i) => {15 switch (part.type) {16 case 'text':17 return <div key={`${message.id}-${i}`}>{part.text}</div>;18 }19 })}20 </div>21 ))}22
23 <form24 onSubmit={e => {25 e.preventDefault();26 sendMessage({ text: input });27 setInput('');28 }}29 >30 <input31 className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"32 value={input}33 placeholder="Say something..."34 onChange={e => setInput(e.currentTarget.value)}35 />36 </form>37 </div>38 );39}
```

Make sure you add the `"use client"` directive to the top of your file. This allows you to add interactivity with JavaScript.

This page utilizes the `useChat` hook, which will, by default, use the `POST` API route you created earlier (`/api/chat`). The hook provides functions and state for handling user input and form submission. The `useChat` hook provides multiple utility functions and state variables:

* `messages` - the current chat messages (an array of objects with `id`, `role`, and `parts` properties).
* `sendMessage` - a function to send a message to the chat API.

The component uses local state (`useState`) to manage the input field value, and handles form submission by calling `sendMessage` with the input text and then clearing the input field.

The LLM's response is accessed through the message `parts` array. Each message contains an ordered array of `parts` that represents everything the model generated in its response. These parts can include plain text, reasoning tokens, and more that you will see later. The `parts` array preserves the sequence of the model's outputs, allowing you to display or process each component in the order it was generated.

## [Running Your Application](#running-your-application)

With that, you have built everything you need for your chatbot! To start your application, use the command:

pnpm run dev

Head to your browser and open [http://localhost:3000](http://localhost:3000/). You should see an input field. Test it out by entering a message and see the AI chatbot respond in real-time! The AI SDK makes it fast and easy to build AI chat interfaces with Next.js.

## [Enhance Your Chatbot with Tools](#enhance-your-chatbot-with-tools)

While large language models (LLMs) have incredible generation capabilities, they struggle with discrete tasks (e.g. mathematics) and interacting with the outside world (e.g. getting the weather). This is where [tools](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling) come in.

Tools are actions that an LLM can invoke. The results of these actions can be reported back to the LLM to be considered in the next response.

For example, if a user asks about the current weather, without tools, the model would only be able to provide general information based on its training data. But with a weather tool, it can fetch and provide up-to-date, location-specific weather information.

Let's enhance your chatbot by adding a simple weather tool.

### [Update Your Route Handler](#update-your-route-handler)

Modify your `app/api/chat/route.ts` file to include the new weather tool:

```
1import { streamText, UIMessage, convertToModelMessages, tool } from 'ai';2import { z } from 'zod';3
4export async function POST(req: Request) {5 const { messages }: { messages: UIMessage[] } = await req.json();6
7 const result = streamText({8 model: "anthropic/claude-sonnet-4.5",9 messages: await convertToModelMessages(messages),10 tools: {11 weather: tool({12 description: 'Get the weather in a location (fahrenheit)',13 inputSchema: z.object({14 location: z.string().describe('The location to get the weather for'),15 }),16 execute: async ({ location }) => {17 const temperature = Math.round(Math.random() * (90 - 32) + 32);18 return {19 location,20 temperature,21 };22 },23 }),24 },25 });26
27 return result.toUIMessageStreamResponse();28}
```

In this updated code:

1. You import the `tool` function from the `ai` package and `z` from `zod` for schema validation.
 
2. You define a `tools` object with a `weather` tool. This tool:
 
 * Has a description that helps the model understand when to use it.
 * Defines `inputSchema` using a Zod schema, specifying that it requires a `location` string to execute this tool. The model will attempt to extract this input from the context of the conversation. If it can't, it will ask the user for the missing information.
 * Defines an `execute` function that simulates getting weather data (in this case, it returns a random temperature). This is an asynchronous function running on the server so you can fetch real data from an external API.

Now your chatbot can "fetch" weather information for any location the user asks about. When the model determines it needs to use the weather tool, it will generate a tool call with the necessary input. The `execute` function will then be automatically run, and the tool output will be added to the `messages` as a `tool` message.

Try asking something like "What's the weather in New York?" and see how the model uses the new tool.

Notice the blank response in the UI? This is because instead of generating a text response, the model generated a tool call. You can access the tool call and subsequent tool result on the client via the `tool-weather` part of the `message.parts` array.

Tool parts are always named `tool-{toolName}`, where `{toolName}` is the key you used when defining the tool. In this case, since we defined the tool as `weather`, the part type is `tool-weather`.

### [Update the UI](#update-the-ui)

To display the tool invocation in your UI, update your `app/page.tsx` file:

```
1'use client';2
3import { useChat } from '@ai-sdk/react';4import { useState } from 'react';5
6export default function Chat() {7 const [input, setInput] = useState('');8 const { messages, sendMessage } = useChat();9 return (10 <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">11 {messages.map(message => (12 <div key={message.id} className="whitespace-pre-wrap">13 {message.role === 'user' ? 'User: ' : 'AI: '}14 {message.parts.map((part, i) => {15 switch (part.type) {16 case 'text':17 return <div key={`${message.id}-${i}`}>{part.text}</div>;18 case 'tool-weather':19 return (20 <pre key={`${message.id}-${i}`}>21 {JSON.stringify(part, null, 2)}22 </pre>23 );24 }25 })}26 </div>27 ))}28
29 <form30 onSubmit={e => {31 e.preventDefault();32 sendMessage({ text: input });33 setInput('');34 }}35 >36 <input37 className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"38 value={input}39 placeholder="Say something..."40 onChange={e => setInput(e.currentTarget.value)}41 />42 </form>43 </div>44 );45}
```

With this change, you're updating the UI to handle different message parts. For text parts, you display the text content as before. For weather tool invocations, you display a JSON representation of the tool call and its result.

Now, when you ask about the weather, you'll see the tool call and its result displayed in your chat interface.

## [Enabling Multi-Step Tool Calls](#enabling-multi-step-tool-calls)

You may have noticed that while the tool is now visible in the chat interface, the model isn't using this information to answer your original query. This is because once the model generates a tool call, it has technically completed its generation.

To solve this, you can enable multi-step tool calls using `stopWhen`. By default, `stopWhen` is set to `stepCountIs(1)`, which means generation stops after the first step when there are tool results. By changing this condition, you can allow the model to automatically send tool results back to itself to trigger additional generations until your specified stopping condition is met. In this case, you want the model to continue generating so it can use the weather tool results to answer your original question.

### [Update Your Route Handler](#update-your-route-handler-1)

Modify your `app/api/chat/route.ts` file to include the `stopWhen` condition:

```
1import {2 streamText,3 UIMessage,4 convertToModelMessages,5 tool,6 stepCountIs,7} from 'ai';8import { z } from 'zod';9
10export async function POST(req: Request) {11 const { messages }: { messages: UIMessage[] } = await req.json();12
13 const result = streamText({14 model: "anthropic/claude-sonnet-4.5",15 messages: await convertToModelMessages(messages),16 stopWhen: stepCountIs(5),17 tools: {18 weather: tool({19 description: 'Get the weather in a location (fahrenheit)',20 inputSchema: z.object({21 location: z.string().describe('The location to get the weather for'),22 }),23 execute: async ({ location }) => {24 const temperature = Math.round(Math.random() * (90 - 32) + 32);25 return {26 location,27 temperature,28 };29 },30 }),31 },32 onStepFinish: ({ toolResults }) => {33 console.log(toolResults);34 },35 });36
37 return result.toUIMessageStreamResponse();38}
```

In this updated code:

1. You set `stopWhen` to be when `stepCountIs` 5, allowing the model to use up to 5 "steps" for any given generation.
2. You add an `onStepFinish` callback to log any `toolResults` from each step of the interaction, helping you understand the model's tool usage.

Head back to the browser and ask about the weather in a location. You should now see the model using the weather tool results to answer your question.

By setting `stopWhen: stepCountIs(5)`, you're allowing the model to use up to 5 "steps" for any given generation. This enables more complex interactions and allows the model to gather and process information over several steps if needed. You can see this in action by adding another tool to convert the temperature from Celsius to Fahrenheit.

### [Add another tool](#add-another-tool)

Update your `app/api/chat/route.ts` file to add a new tool to convert the temperature from Fahrenheit to Celsius:

```
1import {2 streamText,3 UIMessage,4 convertToModelMessages,5 tool,6 stepCountIs,7} from 'ai';8import { z } from 'zod';9
10export async function POST(req: Request) {11 const { messages }: { messages: UIMessage[] } = await req.json();12
13 const result = streamText({14 model: "anthropic/claude-sonnet-4.5",15 messages: await convertToModelMessages(messages),16 stopWhen: stepCountIs(5),17 tools: {18 weather: tool({19 description: 'Get the weather in a location (fahrenheit)',20 inputSchema: z.object({21 location: z.string().describe('The location to get the weather for'),22 }),23 execute: async ({ location }) => {24 const temperature = Math.round(Math.random() * (90 - 32) + 32);25 return {26 location,27 temperature,28 };29 },30 }),31 convertFahrenheitToCelsius: tool({32 description: 'Convert a temperature in fahrenheit to celsius',33 inputSchema: z.object({34 temperature: z35.number()36.describe('The temperature in fahrenheit to convert'),37 }),38 execute: async ({ temperature }) => {39 const celsius = Math.round((temperature - 32) * (5 / 9));40 return {41 celsius,42 };43 },44 }),45 },46 });47
48 return result.toUIMessageStreamResponse();49}
```

### [Update Your Frontend](#update-your-frontend)

update your `app/page.tsx` file to render the new temperature conversion tool:

```
1'use client';2
3import { useChat } from '@ai-sdk/react';4import { useState } from 'react';5
6export default function Chat() {7 const [input, setInput] = useState('');8 const { messages, sendMessage } = useChat();9 return (10 <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">11 {messages.map(message => (12 <div key={message.id} className="whitespace-pre-wrap">13 {message.role === 'user' ? 'User: ' : 'AI: '}14 {message.parts.map((part, i) => {15 switch (part.type) {16 case 'text':17 return <div key={`${message.id}-${i}`}>{part.text}</div>;18 case 'tool-weather':19 case 'tool-convertFahrenheitToCelsius':20 return (21 <pre key={`${message.id}-${i}`}>22 {JSON.stringify(part, null, 2)}23 </pre>24 );25 }26 })}27 </div>28 ))}29
30 <form31 onSubmit={e => {32 e.preventDefault();33 sendMessage({ text: input });34 setInput('');35 }}36 >37 <input38 className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"39 value={input}40 placeholder="Say something..."41 onChange={e => setInput(e.currentTarget.value)}42 />43 </form>44 </div>45 );46}
```

This update handles the new `tool-convertFahrenheitToCelsius` part type, displaying the temperature conversion tool calls and results in the UI.

Now, when you ask "What's the weather in New York in celsius?", you should see a more complete interaction:

1. The model will call the weather tool for New York.
2. You'll see the tool output displayed.
3. It will then call the temperature conversion tool to convert the temperature from Fahrenheit to Celsius.
4. The model will then use that information to provide a natural language response about the weather in New York.

This multi-step approach allows the model to gather information and use it to provide more accurate and contextual responses, making your chatbot considerably more useful.

This simple example demonstrates how tools can expand your model's capabilities. You can create more complex tools to integrate with real APIs, databases, or any other external systems, allowing the model to access and process real-world data in real-time. Tools bridge the gap between the model's knowledge cutoff and current information.

## [Where to Next?](#where-to-next)

You've built an AI chatbot using the AI SDK! From here, you have several paths to explore:

* To learn more about the AI SDK, read through the [documentation](https://ai-sdk.dev/docs).
* If you're interested in diving deeper with guides, check out the [RAG (retrieval-augmented generation)](https://ai-sdk.dev/cookbook/guides/rag-chatbot) and [multi-modal chatbot](https://ai-sdk.dev/cookbook/guides/multi-modal-chatbot) guides.
* To jumpstart your first AI project, explore available [templates](https://vercel.com/templates?type=ai).

---
url: https://ai-sdk.dev/docs/getting-started/nextjs-pages-router
title: "Getting Started: Next.js Pages Router"
description: "Learn how to build your first agent with the AI SDK and Next.js Pages Router."
hash: "3eed96dbdb4ddd6a5e5947ac6f08e2fef721c0f49f3447f50b88e1c8c47f9279"
crawledAt: 2026-03-07T07:58:02.734Z
depth: 2
---

## [Next.js Pages Router Quickstart](#nextjs-pages-router-quickstart)

The AI SDK is a powerful TypeScript library designed to help developers build AI-powered applications.

In this quickstart tutorial, you'll build a simple agent with a streaming chat user interface. Along the way, you'll learn key concepts and techniques that are fundamental to using the AI SDK in your own projects.

If you are unfamiliar with the concepts of [Prompt Engineering](https://ai-sdk.dev/docs/advanced/prompt-engineering) and [HTTP Streaming](https://ai-sdk.dev/docs/foundations/streaming), you can optionally read these documents first.

## [Prerequisites](#prerequisites)

To follow this quickstart, you'll need:

* Node.js 18+ and pnpm installed on your local development machine.
* A [Vercel AI Gateway](https://vercel.com/ai-gateway) API key.

If you haven't obtained your Vercel AI Gateway API key, you can do so by [signing up](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai&title=Go+to+AI+Gateway) on the Vercel website.

## [Setup Your Application](#setup-your-application)

Start by creating a new Next.js application. This command will create a new directory named `my-ai-app` and set up a basic Next.js application inside it.

Be sure to select no when prompted to use the App Router. If you are looking for the Next.js App Router quickstart guide, you can find it [here](https://ai-sdk.dev/docs/getting-started/nextjs-app-router).

pnpm create next-app@latest my-ai-app

Navigate to the newly created directory:

cd my-ai-app

### [Install dependencies](#install-dependencies)

Install `ai` and `@ai-sdk/react`, the AI package and AI SDK's React hooks. The AI SDK's [Vercel AI Gateway provider](https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway) ships with the `ai` package. You'll also install `zod`, a schema validation library used for defining tool inputs.

This guide uses the Vercel AI Gateway provider so you can access hundreds of models from different providers with one API key, but you can switch to any provider or model by installing its package. Check out available [AI SDK providers](https://ai-sdk.dev/providers/ai-sdk-providers) for more information.

pnpm add ai @ai-sdk/react zod

### [Configure your AI Gateway API key](#configure-your-ai-gateway-api-key)

Create a `.env.local` file in your project root and add your AI Gateway API key. This key authenticates your application with the Vercel AI Gateway.

touch.env.local

Edit the `.env.local` file:

```
1AI_GATEWAY_API_KEY=xxxxxxxxx
```

Replace `xxxxxxxxx` with your actual Vercel AI Gateway API key.

The AI SDK's Vercel AI Gateway Provider will default to using the `AI_GATEWAY_API_KEY` environment variable.

## [Create a Route Handler](#create-a-route-handler)

As long as you are on Next.js 13+, you can use Route Handlers (using the App Router) alongside the Pages Router. This is recommended to enable you to use the Web APIs interface/signature and to better support streaming.

Create a Route Handler (`app/api/chat/route.ts`) and add the following code:

```
1import { streamText, UIMessage, convertToModelMessages } from 'ai';2
3export async function POST(req: Request) {4 const { messages }: { messages: UIMessage[] } = await req.json();5
6 const result = streamText({7 model: "anthropic/claude-sonnet-4.5",8 messages: await convertToModelMessages(messages),9 });10
11 return result.toUIMessageStreamResponse();12}
```

Let's take a look at what is happening in this code:

1. Define an asynchronous `POST` request handler and extract `messages` from the body of the request. The `messages` variable contains a history of the conversation between you and the chatbot and provides the chatbot with the necessary context to make the next generation. The `messages` are of UIMessage type, which are designed for use in application UI - they contain the entire message history and associated metadata like timestamps.
2. Call [`streamText`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text), which is imported from the `ai` package. This function accepts a configuration object that contains a `model` provider and `messages` (defined in step 1). You can pass additional [settings](https://ai-sdk.dev/docs/ai-sdk-core/settings) to further customize the model's behavior. The `messages` key expects a `ModelMessage[]` array. This type is different from `UIMessage` in that it does not include metadata, such as timestamps or sender information. To convert between these types, we use the `convertToModelMessages` function, which strips the UI-specific metadata and transforms the `UIMessage[]` array into the `ModelMessage[]` format that the model expects.
3. The `streamText` function returns a [`StreamTextResult`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text#result-object). This result object contains the [`toUIMessageStreamResponse`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text#to-ui-message-stream-response) function which converts the result to a streamed response object.
4. Finally, return the result to the client to stream the response.

This Route Handler creates a POST request endpoint at `/api/chat`.

## [Choosing a Provider](#choosing-a-provider)

The AI SDK supports dozens of model providers through [first-party](https://ai-sdk.dev/providers/ai-sdk-providers), [OpenAI-compatible](https://ai-sdk.dev/providers/openai-compatible-providers), and [community](https://ai-sdk.dev/providers/community-providers) packages.

This quickstart uses the [Vercel AI Gateway](https://vercel.com/ai-gateway) provider, which is the default [global provider](https://ai-sdk.dev/docs/ai-sdk-core/provider-management#global-provider-configuration). This means you can access models using a simple string in the model configuration:

```
1model: "anthropic/claude-sonnet-4.5";
```

You can also explicitly import and use the gateway provider in two other equivalent ways:

```
1// Option 1: Import from 'ai' package (included by default)2import { gateway } from 'ai';3model: gateway('anthropic/claude-sonnet-4.5');4
5// Option 2: Install and import from '@ai-sdk/gateway' package6import { gateway } from '@ai-sdk/gateway';7model: gateway('anthropic/claude-sonnet-4.5');
```

### [Using other providers](#using-other-providers)

To use a different provider, install its package and create a provider instance. For example, to use OpenAI directly:

pnpm add @ai-sdk/openai

```
1import { openai } from '@ai-sdk/openai';2
3model: openai('gpt-5.1');
```

#### [Updating the global provider](#updating-the-global-provider)

You can change the default global provider so string model references use your preferred provider everywhere in your application. Learn more about [provider management](https://ai-sdk.dev/docs/ai-sdk-core/provider-management#global-provider-configuration).

Pick the approach that best matches how you want to manage providers across your application.

## [Wire up the UI](#wire-up-the-ui)

Now that you have an API route that can query an LLM, it's time to setup your frontend. The AI SDK's [UI](https://ai-sdk.dev/docs/ai-sdk-ui) package abstract the complexity of a chat interface into one hook, [`useChat`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat).

Update your root page (`pages/index.tsx`) with the following code to show a list of chat messages and provide a user message input:

```
1import { useChat } from '@ai-sdk/react';2import { useState } from 'react';3
4export default function Chat() {5 const [input, setInput] = useState('');6 const { messages, sendMessage } = useChat();7 return (8 <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">9 {messages.map(message => (10 <div key={message.id} className="whitespace-pre-wrap">11 {message.role === 'user' ? 'User: ' : 'AI: '}12 {message.parts.map((part, i) => {13 switch (part.type) {14 case 'text':15 return <div key={`${message.id}-${i}`}>{part.text}</div>;16 }17 })}18 </div>19 ))}20
21 <form22 onSubmit={e => {23 e.preventDefault();24 sendMessage({ text: input });25 setInput('');26 }}27 >28 <input29 className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"30 value={input}31 placeholder="Say something..."32 onChange={e => setInput(e.currentTarget.value)}33 />34 </form>35 </div>36 );37}
```

This page utilizes the `useChat` hook, which will, by default, use the `POST` API route you created earlier (`/api/chat`). The hook provides functions and state for handling user input and form submission. The `useChat` hook provides multiple utility functions and state variables:

* `messages` - the current chat messages (an array of objects with `id`, `role`, and `parts` properties).
* `sendMessage` - a function to send a message to the chat API.

The component uses local state (`useState`) to manage the input field value, and handles form submission by calling `sendMessage` with the input text and then clearing the input field.

The LLM's response is accessed through the message `parts` array. Each message contains an ordered array of `parts` that represents everything the model generated in its response. These parts can include plain text, reasoning tokens, and more that you will see later. The `parts` array preserves the sequence of the model's outputs, allowing you to display or process each component in the order it was generated.

## [Running Your Application](#running-your-application)

With that, you have built everything you need for your chatbot! To start your application, use the command:

pnpm run dev

Head to your browser and open [http://localhost:3000](http://localhost:3000/). You should see an input field. Test it out by entering a message and see the AI chatbot respond in real-time! The AI SDK makes it fast and easy to build AI chat interfaces with Next.js.

## [Enhance Your Chatbot with Tools](#enhance-your-chatbot-with-tools)

While large language models (LLMs) have incredible generation capabilities, they struggle with discrete tasks (e.g. mathematics) and interacting with the outside world (e.g. getting the weather). This is where [tools](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling) come in.

Tools are actions that an LLM can invoke. The results of these actions can be reported back to the LLM to be considered in the next response.

For example, if a user asks about the current weather, without tools, the model would only be able to provide general information based on its training data. But with a weather tool, it can fetch and provide up-to-date, location-specific weather information.

### [Update Your Route Handler](#update-your-route-handler)

Let's start by giving your chatbot a weather tool. Update your Route Handler (`app/api/chat/route.ts`):

```
1import { streamText, UIMessage, convertToModelMessages, tool } from 'ai';2import { z } from 'zod';3
4export async function POST(req: Request) {5 const { messages }: { messages: UIMessage[] } = await req.json();6
7 const result = streamText({8 model: "anthropic/claude-sonnet-4.5",9 messages: await convertToModelMessages(messages),10 tools: {11 weather: tool({12 description: 'Get the weather in a location (fahrenheit)',13 inputSchema: z.object({14 location: z.string().describe('The location to get the weather for'),15 }),16 execute: async ({ location }) => {17 const temperature = Math.round(Math.random() * (90 - 32) + 32);18 return {19 location,20 temperature,21 };22 },23 }),24 },25 });26
27 return result.toUIMessageStreamResponse();28}
```

In this updated code:

1. You import the `tool` function from the `ai` package and `z` from `zod` for schema validation.
 
2. You define a `tools` object with a `weather` tool. This tool:
 
 * Has a description that helps the model understand when to use it.
 * Defines `inputSchema` using a Zod schema, specifying that it requires a `location` string to execute this tool. The model will attempt to extract this input from the context of the conversation. If it can't, it will ask the user for the missing information.
 * Defines an `execute` function that simulates getting weather data (in this case, it returns a random temperature). This is an asynchronous function running on the server so you can fetch real data from an external API.

Now your chatbot can "fetch" weather information for any location the user asks about. When the model determines it needs to use the weather tool, it will generate a tool call with the necessary input. The `execute` function will then be automatically run, and the tool output will be added to the `messages` as a `tool` message.

Try asking something like "What's the weather in New York?" and see how the model uses the new tool.

Notice the blank response in the UI? This is because instead of generating a text response, the model generated a tool call. You can access the tool call and subsequent tool result on the client via the `tool-weather` part of the `message.parts` array.

Tool parts are always named `tool-{toolName}`, where `{toolName}` is the key you used when defining the tool. In this case, since we defined the tool as `weather`, the part type is `tool-weather`.

### [Update the UI](#update-the-ui)

To display the tool invocations in your UI, update your `pages/index.tsx` file:

```
1import { useChat } from '@ai-sdk/react';2import { useState } from 'react';3
4export default function Chat() {5 const [input, setInput] = useState('');6 const { messages, sendMessage } = useChat();7 return (8 <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">9 {messages.map(message => (10 <div key={message.id} className="whitespace-pre-wrap">11 {message.role === 'user' ? 'User: ' : 'AI: '}12 {message.parts.map((part, i) => {13 switch (part.type) {14 case 'text':15 return <div key={`${message.id}-${i}`}>{part.text}</div>;16 case 'tool-weather':17 return (18 <pre key={`${message.id}-${i}`}>19 {JSON.stringify(part, null, 2)}20 </pre>21 );22 }23 })}24 </div>25 ))}26
27 <form28 onSubmit={e => {29 e.preventDefault();30 sendMessage({ text: input });31 setInput('');32 }}33 >34 <input35 className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"36 value={input}37 placeholder="Say something..."38 onChange={e => setInput(e.currentTarget.value)}39 />40 </form>41 </div>42 );43}
```

With this change, you're updating the UI to handle different message parts. For text parts, you display the text content as before. For weather tool invocations, you display a JSON representation of the tool call and its result.

Now, when you ask about the weather, you'll see the tool call and its result displayed in your chat interface.

## [Enabling Multi-Step Tool Calls](#enabling-multi-step-tool-calls)

You may have noticed that while the tool is now visible in the chat interface, the model isn't using this information to answer your original query. This is because once the model generates a tool call, it has technically completed its generation.

To solve this, you can enable multi-step tool calls using `stopWhen`. By default, `stopWhen` is set to `stepCountIs(1)`, which means generation stops after the first step when there are tool results. By changing this condition, you can allow the model to automatically send tool results back to itself to trigger additional generations until your specified stopping condition is met. In this case, you want the model to continue generating so it can use the weather tool results to answer your original question.

### [Update Your Route Handler](#update-your-route-handler-1)

Modify your `app/api/chat/route.ts` file to include the `stopWhen` condition:

```
1import {2 streamText,3 UIMessage,4 convertToModelMessages,5 tool,6 stepCountIs,7} from 'ai';8import { z } from 'zod';9
10export async function POST(req: Request) {11 const { messages }: { messages: UIMessage[] } = await req.json();12
13 const result = streamText({14 model: "anthropic/claude-sonnet-4.5",15 messages: await convertToModelMessages(messages),16 stopWhen: stepCountIs(5),17 tools: {18 weather: tool({19 description: 'Get the weather in a location (fahrenheit)',20 inputSchema: z.object({21 location: z.string().describe('The location to get the weather for'),22 }),23 execute: async ({ location }) => {24 const temperature = Math.round(Math.random() * (90 - 32) + 32);25 return {26 location,27 temperature,28 };29 },30 }),31 },32 });33
34 return result.toUIMessageStreamResponse();35}
```

Head back to the browser and ask about the weather in a location. You should now see the model using the weather tool results to answer your question.

By setting `stopWhen: stepCountIs(5)`, you're allowing the model to use up to 5 "steps" for any given generation. This enables more complex interactions and allows the model to gather and process information over several steps if needed. You can see this in action by adding another tool to convert the temperature from Celsius to Fahrenheit.

### [Add another tool](#add-another-tool)

Update your `app/api/chat/route.ts` file to add a new tool to convert the temperature from Fahrenheit to Celsius:

```
1import {2 streamText,3 UIMessage,4 convertToModelMessages,5 tool,6 stepCountIs,7} from 'ai';8import { z } from 'zod';9
10export async function POST(req: Request) {11 const { messages }: { messages: UIMessage[] } = await req.json();12
13 const result = streamText({14 model: "anthropic/claude-sonnet-4.5",15 messages: await convertToModelMessages(messages),16 stopWhen: stepCountIs(5),17 tools: {18 weather: tool({19 description: 'Get the weather in a location (fahrenheit)',20 inputSchema: z.object({21 location: z.string().describe('The location to get the weather for'),22 }),23 execute: async ({ location }) => {24 const temperature = Math.round(Math.random() * (90 - 32) + 32);25 return {26 location,27 temperature,28 };29 },30 }),31 convertFahrenheitToCelsius: tool({32 description: 'Convert a temperature in fahrenheit to celsius',33 inputSchema: z.object({34 temperature: z35.number()36.describe('The temperature in fahrenheit to convert'),37 }),38 execute: async ({ temperature }) => {39 const celsius = Math.round((temperature - 32) * (5 / 9));40 return {41 celsius,42 };43 },44 }),45 },46 });47
48 return result.toUIMessageStreamResponse();49}
```

### [Update Your Frontend](#update-your-frontend)

Update your `pages/index.tsx` file to render the new temperature conversion tool:

```
1import { useChat } from '@ai-sdk/react';2import { useState } from 'react';3
4export default function Chat() {5 const [input, setInput] = useState('');6 const { messages, sendMessage } = useChat();7 return (8 <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">9 {messages.map(message => (10 <div key={message.id} className="whitespace-pre-wrap">11 {message.role === 'user' ? 'User: ' : 'AI: '}12 {message.parts.map((part, i) => {13 switch (part.type) {14 case 'text':15 return <div key={`${message.id}-${i}`}>{part.text}</div>;16 case 'tool-weather':17 case 'tool-convertFahrenheitToCelsius':18 return (19 <pre key={`${message.id}-${i}`}>20 {JSON.stringify(part, null, 2)}21 </pre>22 );23 }24 })}25 </div>26 ))}27
28 <form29 onSubmit={e => {30 e.preventDefault();31 sendMessage({ text: input });32 setInput('');33 }}34 >35 <input36 className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"37 value={input}38 placeholder="Say something..."39 onChange={e => setInput(e.currentTarget.value)}40 />41 </form>42 </div>43 );44}
```

This update handles the new `tool-convertFahrenheitToCelsius` part type, displaying the temperature conversion tool calls and results in the UI.

Now, when you ask "What's the weather in New York in celsius?", you should see a more complete interaction:

1. The model will call the weather tool for New York.
2. You'll see the tool output displayed.
3. It will then call the temperature conversion tool to convert the temperature from Fahrenheit to Celsius.
4. The model will then use that information to provide a natural language response about the weather in New York.

This multi-step approach allows the model to gather information and use it to provide more accurate and contextual responses, making your chatbot considerably more useful.

This simple example demonstrates how tools can expand your model's capabilities. You can create more complex tools to integrate with real APIs, databases, or any other external systems, allowing the model to access and process real-world data in real-time. Tools bridge the gap between the model's knowledge cutoff and current information.

## [Where to Next?](#where-to-next)

You've built an AI chatbot using the AI SDK! From here, you have several paths to explore:

* To learn more about the AI SDK, read through the [documentation](https://ai-sdk.dev/docs).
* If you're interested in diving deeper with guides, check out the [RAG (retrieval-augmented generation)](https://ai-sdk.dev/cookbook/guides/rag-chatbot) and [multi-modal chatbot](https://ai-sdk.dev/cookbook/guides/multi-modal-chatbot) guides.
* To jumpstart your first AI project, explore available [templates](https://vercel.com/templates?type=ai).

---
url: https://ai-sdk.dev/docs/getting-started/svelte
title: "Getting Started: Svelte"
description: "Learn how to build your first agent with the AI SDK and Svelte."
hash: "64b3ea2f4a85730c3a33a6e9ec2ec347780168223da82140b7be7c1bc8c4315a"
crawledAt: 2026-03-07T07:58:08.406Z
depth: 2
---

## [Svelte Quickstart](#svelte-quickstart)

The AI SDK is a powerful TypeScript library designed to help developers build AI-powered applications.

In this quickstart tutorial, you'll build a simple agent with a streaming chat user interface. Along the way, you'll learn key concepts and techniques that are fundamental to using the SDK in your own projects.

If you are unfamiliar with the concepts of [Prompt Engineering](https://ai-sdk.dev/docs/advanced/prompt-engineering) and [HTTP Streaming](https://ai-sdk.dev/docs/foundations/streaming), you can optionally read these documents first.

## [Prerequisites](#prerequisites)

To follow this quickstart, you'll need:

* Node.js 18+ and pnpm installed on your local development machine.
* A [Vercel AI Gateway](https://vercel.com/ai-gateway) API key.

If you haven't obtained your Vercel AI Gateway API key, you can do so by [signing up](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai&title=Go+to+AI+Gateway) on the Vercel website.

## [Set Up Your Application](#set-up-your-application)

Start by creating a new SvelteKit application. This command will create a new directory named `my-ai-app` and set up a basic SvelteKit application inside it.

npx sv create my-ai-app

Navigate to the newly created directory:

cd my-ai-app

### [Install Dependencies](#install-dependencies)

Install `ai` and `@ai-sdk/svelte`, the AI package and AI SDK's Svelte bindings. The AI SDK's [Vercel AI Gateway provider](https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway) ships with the `ai` package. You'll also install `zod`, a schema validation library used for defining tool inputs.

This guide uses the Vercel AI Gateway provider so you can access hundreds of models from different providers with one API key, but you can switch to any provider or model by installing its package. Check out available [AI SDK providers](https://ai-sdk.dev/providers/ai-sdk-providers) for more information.

pnpm add -D ai @ai-sdk/svelte zod

### [Configure your AI Gateway API key](#configure-your-ai-gateway-api-key)

Create a `.env.local` file in your project root and add your AI Gateway API key. This key authenticates your application with the Vercel AI Gateway.

touch.env.local

Edit the `.env.local` file:

```
1AI_GATEWAY_API_KEY=xxxxxxxxx
```

Replace `xxxxxxxxx` with your actual Vercel AI Gateway API key.

The AI SDK's Vercel AI Gateway Provider will default to using the `AI_GATEWAY_API_KEY` environment variable. Vite does not automatically load environment variables onto `process.env`, so you'll need to import `AI_GATEWAY_API_KEY` from `$env/static/private` in your code (see below).

## [Create an API route](#create-an-api-route)

Create a SvelteKit Endpoint, `src/routes/api/chat/+server.ts` and add the following code:

```
1import {2 streamText,3 type UIMessage,4 convertToModelMessages,5 createGateway,6} from 'ai';7
8import { AI_GATEWAY_API_KEY } from '$env/static/private';9
10const gateway = createGateway({11 apiKey: AI_GATEWAY_API_KEY,12});13
14export async function POST({ request }) {15 const { messages }: { messages: UIMessage[] } = await request.json();16
17 const result = streamText({18 model: gateway('anthropic/claude-sonnet-4.5'),19 messages: await convertToModelMessages(messages),20 });21
22 return result.toUIMessageStreamResponse();23}
```

If you see type errors with `AI_GATEWAY_API_KEY` or your `POST` function, run the dev server.

Let's take a look at what is happening in this code:

1. Create a gateway provider instance with the `createGateway` function from the `ai` package.
2. Define a `POST` request handler and extract `messages` from the body of the request. The `messages` variable contains a history of the conversation between you and the chatbot and provides the chatbot with the necessary context to make the next generation. The `messages` are of UIMessage type, which are designed for use in application UI - they contain the entire message history and associated metadata like timestamps.
3. Call [`streamText`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text), which is imported from the `ai` package. This function accepts a configuration object that contains a `model` provider (defined in step 1) and `messages` (defined in step 2). You can pass additional [settings](https://ai-sdk.dev/docs/ai-sdk-core/settings) to further customize the model's behavior. The `messages` key expects a `ModelMessage[]` array. This type is different from `UIMessage` in that it does not include metadata, such as timestamps or sender information. To convert between these types, we use the `convertToModelMessages` function, which strips the UI-specific metadata and transforms the `UIMessage[]` array into the `ModelMessage[]` format that the model expects.
4. The `streamText` function returns a [`StreamTextResult`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text#result-object). This result object contains the [`toUIMessageStreamResponse`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text#to-ui-message-stream-response) function which converts the result to a streamed response object.
5. Return the result to the client to stream the response.

## [Choosing a Provider](#choosing-a-provider)

The AI SDK supports dozens of model providers through [first-party](https://ai-sdk.dev/providers/ai-sdk-providers), [OpenAI-compatible](https://ai-sdk.dev/providers/openai-compatible-providers), and [community](https://ai-sdk.dev/providers/community-providers) packages.

This quickstart uses the [Vercel AI Gateway](https://vercel.com/ai-gateway) provider, which is the default [global provider](https://ai-sdk.dev/docs/ai-sdk-core/provider-management#global-provider-configuration). This means you can access models using a simple string in the model configuration:

```
1model: "anthropic/claude-sonnet-4.5";
```

You can also explicitly import and use the gateway provider in two other equivalent ways:

```
1// Option 1: Import from 'ai' package (included by default)2import { gateway } from 'ai';3model: gateway('anthropic/claude-sonnet-4.5');4
5// Option 2: Install and import from '@ai-sdk/gateway' package6import { gateway } from '@ai-sdk/gateway';7model: gateway('anthropic/claude-sonnet-4.5');
```

### [Using other providers](#using-other-providers)

To use a different provider, install its package and create a provider instance. For example, to use OpenAI directly:

pnpm add @ai-sdk/openai

```
1import { openai } from '@ai-sdk/openai';2
3model: openai('gpt-5.1');
```

#### [Updating the global provider](#updating-the-global-provider)

You can change the default global provider so string model references use your preferred provider everywhere in your application. Learn more about [provider management](https://ai-sdk.dev/docs/ai-sdk-core/provider-management#global-provider-configuration).

Pick the approach that best matches how you want to manage providers across your application.

## [Wire up the UI](#wire-up-the-ui)

Now that you have an API route that can query an LLM, it's time to set up your frontend. The AI SDK's [UI](https://ai-sdk.dev/docs/ai-sdk-ui) package abstracts the complexity of a chat interface into one class, `Chat`. Its properties and API are largely the same as React's [`useChat`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat).

Update your root page (`src/routes/+page.svelte`) with the following code to show a list of chat messages and provide a user message input:

```
1<script lang="ts">2 import { Chat } from '@ai-sdk/svelte';3
4 let input = '';5 const chat = new Chat({});6
7 function handleSubmit(event: SubmitEvent) {8 event.preventDefault();9 chat.sendMessage({ text: input });10 input = '';11 }12</script>13
14<main>15 <ul>16 {#each chat.messages as message, messageIndex (messageIndex)}17 <li>18 <div>{message.role}</div>19 <div>20 {#each message.parts as part, partIndex (partIndex)}21 {#if part.type === 'text'}22 <div>{part.text}</div>23 {/if}24 {/each}25 </div>26 </li>27 {/each}28 </ul>29 <form onsubmit={handleSubmit}>30 <input bind:value={input} />31 <button type="submit">Send</button>32 </form>33</main>
```

This page utilizes the `Chat` class, which will, by default, use the `POST` route handler you created earlier. The class provides functions and state for handling user input and form submission. The `Chat` class provides multiple utility functions and state variables:

* `messages` - the current chat messages (an array of objects with `id`, `role`, and `parts` properties).
* `sendMessage` - a function to send a message to the chat API.

The component uses local state to manage the input field value, and handles form submission by calling `sendMessage` with the input text and then clearing the input field.

The LLM's response is accessed through the message `parts` array. Each message contains an ordered array of `parts` that represents everything the model generated in its response. These parts can include plain text, reasoning tokens, and more that you will see later. The `parts` array preserves the sequence of the model's outputs, allowing you to display or process each component in the order it was generated.

## [Running Your Application](#running-your-application)

With that, you have built everything you need for your chatbot! To start your application, use the command:

pnpm run dev

Head to your browser and open [http://localhost:5173](http://localhost:5173/). You should see an input field. Test it out by entering a message and see the AI chatbot respond in real-time! The AI SDK makes it fast and easy to build AI chat interfaces with Svelte.

## [Enhance Your Chatbot with Tools](#enhance-your-chatbot-with-tools)

While large language models (LLMs) have incredible generation capabilities, they struggle with discrete tasks (e.g. mathematics) and interacting with the outside world (e.g. getting the weather). This is where [tools](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling) come in.

Tools are actions that an LLM can invoke. The results of these actions can be reported back to the LLM to be considered in the next response.

For example, if a user asks about the current weather, without tools, the model would only be able to provide general information based on its training data. But with a weather tool, it can fetch and provide up-to-date, location-specific weather information.

Let's enhance your chatbot by adding a simple weather tool.

### [Update Your API Route](#update-your-api-route)

Modify your `src/routes/api/chat/+server.ts` file to include the new weather tool:

```
1import {2 createGateway,3 streamText,4 type UIMessage,5 convertToModelMessages,6 tool,7 stepCountIs,8} from 'ai';9import { z } from 'zod';10
11import { AI_GATEWAY_API_KEY } from '$env/static/private';12
13const gateway = createGateway({14 apiKey: AI_GATEWAY_API_KEY,15});16
17export async function POST({ request }) {18 const { messages }: { messages: UIMessage[] } = await request.json();19
20 const result = streamText({21 model: gateway('anthropic/claude-sonnet-4.5'),22 messages: await convertToModelMessages(messages),23 tools: {24 weather: tool({25 description: 'Get the weather in a location (fahrenheit)',26 inputSchema: z.object({27 location: z.string().describe('The location to get the weather for'),28 }),29 execute: async ({ location }) => {30 const temperature = Math.round(Math.random() * (90 - 32) + 32);31 return {32 location,33 temperature,34 };35 },36 }),37 },38 });39
40 return result.toUIMessageStreamResponse();41}
```

In this updated code:

1. You import the `tool` function from the `ai` package and `z` from `zod` for schema validation.
 
2. You define a `tools` object with a `weather` tool. This tool:
 
 * Has a description that helps the model understand when to use it.
 * Defines `inputSchema` using a Zod schema, specifying that it requires a `location` string to execute this tool. The model will attempt to extract this input from the context of the conversation. If it can't, it will ask the user for the missing information.
 * Defines an `execute` function that simulates getting weather data (in this case, it returns a random temperature). This is an asynchronous function running on the server so you can fetch real data from an external API.

Now your chatbot can "fetch" weather information for any location the user asks about. When the model determines it needs to use the weather tool, it will generate a tool call with the necessary input. The `execute` function will then be automatically run, and the tool output will be added to the `messages` as a `tool` message.

Try asking something like "What's the weather in New York?" and see how the model uses the new tool.

Notice the blank response in the UI? This is because instead of generating a text response, the model generated a tool call. You can access the tool call and subsequent tool result on the client via the `tool-weather` part of the `message.parts` array.

Tool parts are always named `tool-{toolName}`, where `{toolName}` is the key you used when defining the tool. In this case, since we defined the tool as `weather`, the part type is `tool-weather`.

### [Update the UI](#update-the-ui)

To display the tool invocation in your UI, update your `src/routes/+page.svelte` file:

```
1<script lang="ts">2 import { Chat } from '@ai-sdk/svelte';3
4 let input = '';5 const chat = new Chat({});6
7 function handleSubmit(event: SubmitEvent) {8 event.preventDefault();9 chat.sendMessage({ text: input });10 input = '';11 }12</script>13
14<main>15 <ul>16 {#each chat.messages as message, messageIndex (messageIndex)}17 <li>18 <div>{message.role}</div>19 <div>20 {#each message.parts as part, partIndex (partIndex)}21 {#if part.type === 'text'}22 <div>{part.text}</div>23 {:else if part.type === 'tool-weather'}24 <pre>{JSON.stringify(part, null, 2)}</pre>25 {/if}26 {/each}27 </div>28 </li>29 {/each}30 </ul>31 <form onsubmit={handleSubmit}>32 <input bind:value={input} />33 <button type="submit">Send</button>34 </form>35</main>
```

With this change, you're updating the UI to handle different message parts. For text parts, you display the text content as before. For weather tool invocations, you display a JSON representation of the tool call and its result.

Now, when you ask about the weather, you'll see the tool call and its result displayed in your chat interface.

## [Enabling Multi-Step Tool Calls](#enabling-multi-step-tool-calls)

You may have noticed that while the tool is now visible in the chat interface, the model isn't using this information to answer your original query. This is because once the model generates a tool call, it has technically completed its generation.

To solve this, you can enable multi-step tool calls using `stopWhen`. By default, `stopWhen` is set to `stepCountIs(1)`, which means generation stops after the first step when there are tool results. By changing this condition, you can allow the model to automatically send tool results back to itself to trigger additional generations until your specified stopping condition is met. In this case, you want the model to continue generating so it can use the weather tool results to answer your original question.

### [Update Your API Route](#update-your-api-route-1)

Modify your `src/routes/api/chat/+server.ts` file to include the `stopWhen` condition:

```
1import {2 createGateway,3 streamText,4 type UIMessage,5 convertToModelMessages,6 tool,7 stepCountIs,8} from 'ai';9import { z } from 'zod';10
11import { AI_GATEWAY_API_KEY } from '$env/static/private';12
13const gateway = createGateway({14 apiKey: AI_GATEWAY_API_KEY,15});16
17export async function POST({ request }) {18 const { messages }: { messages: UIMessage[] } = await request.json();19
20 const result = streamText({21 model: gateway('anthropic/claude-sonnet-4.5'),22 messages: await convertToModelMessages(messages),23 stopWhen: stepCountIs(5),24 tools: {25 weather: tool({26 description: 'Get the weather in a location (fahrenheit)',27 inputSchema: z.object({28 location: z.string().describe('The location to get the weather for'),29 }),30 execute: async ({ location }) => {31 const temperature = Math.round(Math.random() * (90 - 32) + 32);32 return {33 location,34 temperature,35 };36 },37 }),38 },39 });40
41 return result.toUIMessageStreamResponse();42}
```

Head back to the browser and ask about the weather in a location. You should now see the model using the weather tool results to answer your question.

By setting `stopWhen: stepCountIs(5)`, you're allowing the model to use up to 5 "steps" for any given generation. This enables more complex interactions and allows the model to gather and process information over several steps if needed. You can see this in action by adding another tool to convert the temperature from Fahrenheit to Celsius.

### [Add another tool](#add-another-tool)

Update your `src/routes/api/chat/+server.ts` file to add a new tool to convert the temperature from Fahrenheit to Celsius:

```
1import {2 createGateway,3 streamText,4 type UIMessage,5 convertToModelMessages,6 tool,7 stepCountIs,8} from 'ai';9import { z } from 'zod';10
11import { AI_GATEWAY_API_KEY } from '$env/static/private';12
13const gateway = createGateway({14 apiKey: AI_GATEWAY_API_KEY,15});16
17export async function POST({ request }) {18 const { messages }: { messages: UIMessage[] } = await request.json();19
20 const result = streamText({21 model: gateway('anthropic/claude-sonnet-4.5'),22 messages: await convertToModelMessages(messages),23 stopWhen: stepCountIs(5),24 tools: {25 weather: tool({26 description: 'Get the weather in a location (fahrenheit)',27 inputSchema: z.object({28 location: z.string().describe('The location to get the weather for'),29 }),30 execute: async ({ location }) => {31 const temperature = Math.round(Math.random() * (90 - 32) + 32);32 return {33 location,34 temperature,35 };36 },37 }),38 convertFahrenheitToCelsius: tool({39 description: 'Convert a temperature in fahrenheit to celsius',40 inputSchema: z.object({41 temperature: z42.number()43.describe('The temperature in fahrenheit to convert'),44 }),45 execute: async ({ temperature }) => {46 const celsius = Math.round((temperature - 32) * (5 / 9));47 return {48 celsius,49 };50 },51 }),52 },53 });54
55 return result.toUIMessageStreamResponse();56}
```

### [Update Your Frontend](#update-your-frontend)

Update your UI to handle the new temperature conversion tool by modifying the tool part handling:

```
1<script lang="ts">2 import { Chat } from '@ai-sdk/svelte';3
4 let input = '';5 const chat = new Chat({});6
7 function handleSubmit(event: SubmitEvent) {8 event.preventDefault();9 chat.sendMessage({ text: input });10 input = '';11 }12</script>13
14<main>15 <ul>16 {#each chat.messages as message, messageIndex (messageIndex)}17 <li>18 <div>{message.role}</div>19 <div>20 {#each message.parts as part, partIndex (partIndex)}21 {#if part.type === 'text'}22 <div>{part.text}</div>23 {:else if part.type === 'tool-weather' || part.type === 'tool-convertFahrenheitToCelsius'}24 <pre>{JSON.stringify(part, null, 2)}</pre>25 {/if}26 {/each}27 </div>28 </li>29 {/each}30 </ul>31 <form onsubmit={handleSubmit}>32 <input bind:value={input} />33 <button type="submit">Send</button>34 </form>35</main>
```

This update handles the new `tool-convertFahrenheitToCelsius` part type, displaying the temperature conversion tool calls and results in the UI.

Now, when you ask "What's the weather in New York in celsius?", you should see a more complete interaction:

1. The model will call the weather tool for New York.
2. You'll see the tool output displayed.
3. It will then call the temperature conversion tool to convert the temperature from Fahrenheit to Celsius.
4. The model will then use that information to provide a natural language response about the weather in New York.

This multi-step approach allows the model to gather information and use it to provide more accurate and contextual responses, making your chatbot considerably more useful.

This simple example demonstrates how tools can expand your model's capabilities. You can create more complex tools to integrate with real APIs, databases, or any other external systems, allowing the model to access and process real-world data in real-time. Tools bridge the gap between the model's knowledge cutoff and current information.

## [How does `@ai-sdk/svelte` differ from `@ai-sdk/react`?](#how-does-ai-sdksvelte-differ-from-ai-sdkreact)

The surface-level difference is that Svelte uses classes to manage state, whereas React uses hooks, so `useChat` in React is `Chat` in Svelte. Other than that, there are a few things to keep in mind:

### [1\. Arguments to classes aren't reactive by default](#1-arguments-to-classes-arent-reactive-by-default)

Unlike in React, where hooks are rerun any time their containing component is invalidated, code in the `script` block of a Svelte component is only run once when the component is created. This means that, if you want arguments to your class to be reactive, you need to make sure you pass a _reference_ into the class, rather than a value:

```
1<script>2 import { Chat } from '@ai-sdk/svelte';3
4 let { id } = $props();5
6 // won't work; the class instance will be created once, `id` will be copied by value, and won't update when $props.id changes7 let chat = new Chat({ id });8
9 // will work; passes `id` by reference, so `Chat` always has the latest value10 let chat = new Chat({11 get id() {12 return id;13 },14 });15</script>
```

Keep in mind that this normally doesn't matter; most parameters you'll pass into the Chat class are static (for example, you typically wouldn't expect your `onError` handler to change).

### [2\. You can't destructure class properties](#2-you-cant-destructure-class-properties)

In vanilla JavaScript, destructuring class properties copies them by value and "disconnects" them from their class instance:

```
1const classInstance = new Whatever();2classInstance.foo = 'bar';3const { foo } = classInstance;4classInstance.foo = 'baz';5
6console.log(foo); // 'bar'
```

The same is true of classes in Svelte:

```
1<script>2 import { Chat } from '@ai-sdk/svelte';3
4 const chat = new Chat({});5 let { messages } = chat;6
7 chat.sendMessage({ text: 'Hello, world!' }).then(() => {8 console.log(messages); // []9 console.log(chat.messages); // [{ id: '...', role: 'user', parts: [{ type: 'text', text: 'Hello, world!' }] }]10 });11</script>
```

### [3\. Instance synchronization requires context](#3-instance-synchronization-requires-context)

In React, hook instances with the same `id` are synchronized -- so two instances of `useChat` will have the same `messages`, `status`, etc. if they have the same `id`. For most use cases, you probably don't need this behavior -- but if you do, you can create a context in your root layout file using `createAIContext`:

```
1<script>2 import { createAIContext } from '@ai-sdk/svelte';3
4 let { children } = $props();5
6 createAIContext();7 // all hooks created after this or in components that are children of this component8 // will have synchronized state9</script>10
11{@render children()}
```

## [Where to Next?](#where-to-next)

You've built an AI chatbot using the AI SDK! From here, you have several paths to explore:

* To learn more about the AI SDK, read through the [documentation](https://ai-sdk.dev/docs).
* If you're interested in diving deeper with guides, check out the [RAG (retrieval-augmented generation)](https://ai-sdk.dev/cookbook/guides/rag-chatbot) and [multi-modal chatbot](https://ai-sdk.dev/cookbook/guides/multi-modal-chatbot) guides.
* To jumpstart your first AI project, explore available [templates](https://vercel.com/templates?type=ai).
* To learn more about Svelte, check out the [official documentation](https://svelte.dev/docs/svelte).

---
url: https://ai-sdk.dev/docs/getting-started/nuxt
title: "Getting Started: Vue.js (Nuxt)"
description: "Learn how to build your first agent with the AI SDK and Vue.js (Nuxt)."
hash: "786004000513cea7ebbc00d00fbeaddb6d7caf0e473bbc1b702026756cead49e"
crawledAt: 2026-03-07T07:58:14.022Z
depth: 2
---

## [Vue.js (Nuxt) Quickstart](#vuejs-nuxt-quickstart)

The AI SDK is a powerful TypeScript library designed to help developers build AI-powered applications.

In this quickstart tutorial, you'll build a simple agent with a streaming chat user interface. Along the way, you'll learn key concepts and techniques that are fundamental to using the SDK in your own projects.

If you are unfamiliar with the concepts of [Prompt Engineering](https://ai-sdk.dev/docs/advanced/prompt-engineering) and [HTTP Streaming](https://ai-sdk.dev/docs/foundations/streaming), you can optionally read these documents first.

## [Prerequisites](#prerequisites)

To follow this quickstart, you'll need:

* Node.js 18+ and pnpm installed on your local development machine.
* A [Vercel AI Gateway](https://vercel.com/ai-gateway) API key.

If you haven't obtained your Vercel AI Gateway API key, you can do so by [signing up](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai&title=Go+to+AI+Gateway) on the Vercel website.

## [Setup Your Application](#setup-your-application)

Start by creating a new Nuxt application. This command will create a new directory named `my-ai-app` and set up a basic Nuxt application inside it.

pnpm create nuxt my-ai-app

Navigate to the newly created directory:

cd my-ai-app

### [Install dependencies](#install-dependencies)

Install `ai` and `@ai-sdk/vue`. The Vercel AI Gateway provider ships with the `ai` package.

pnpm add ai @ai-sdk/vue zod

### [Configure Vercel AI Gateway API key](#configure-vercel-ai-gateway-api-key)

Create a `.env` file in your project root and add your Vercel AI Gateway API Key. This key is used to authenticate your application with the Vercel AI Gateway service.

touch.env

Edit the `.env` file:

```
1NUXT_AI_GATEWAY_API_KEY=xxxxxxxxx
```

Replace `xxxxxxxxx` with your actual Vercel AI Gateway API key and configure the environment variable in `nuxt.config.ts`:

```
1export default defineNuxtConfig({2 // rest of your nuxt config3 runtimeConfig: {4 aiGatewayApiKey: '',5 },6});
```

This guide uses Nuxt's runtime config to manage the API key. The `NUXT_` prefix in the environment variable allows Nuxt to automatically load it into the runtime config. While the AI Gateway Provider also supports a default `AI_GATEWAY_API_KEY` environment variable, this approach provides better integration with Nuxt's configuration system.

## [Create an API route](#create-an-api-route)

Create an API route, `server/api/chat.ts` and add the following code:

```
1import {2 streamText,3 UIMessage,4 convertToModelMessages,5 createGateway,6} from 'ai';7
8export default defineLazyEventHandler(async () => {9 const apiKey = useRuntimeConfig().aiGatewayApiKey;10 if (!apiKey) throw new Error('Missing AI Gateway API key');11 const gateway = createGateway({12 apiKey: apiKey,13 });14
15 return defineEventHandler(async (event: any) => {16 const { messages }: { messages: UIMessage[] } = await readBody(event);17
18 const result = streamText({19 model: gateway('anthropic/claude-sonnet-4.5'),20 messages: await convertToModelMessages(messages),21 });22
23 return result.toUIMessageStreamResponse();24 });25});
```

Let's take a look at what is happening in this code:

1. Create a gateway provider instance with the `createGateway` function from the `ai` package.
2. Define an Event Handler and extract `messages` from the body of the request. The `messages` variable contains a history of the conversation between you and the chatbot and provides the chatbot with the necessary context to make the next generation. The `messages` are of UIMessage type, which are designed for use in application UI - they contain the entire message history and associated metadata like timestamps.
3. Call [`streamText`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text), which is imported from the `ai` package. This function accepts a configuration object that contains a `model` provider (defined in step 1) and `messages` (defined in step 2). You can pass additional [settings](https://ai-sdk.dev/docs/ai-sdk-core/settings) to further customize the model's behavior. The `messages` key expects a `ModelMessage[]` array. This type is different from `UIMessage` in that it does not include metadata, such as timestamps or sender information. To convert between these types, we use the `convertToModelMessages` function, which strips the UI-specific metadata and transforms the `UIMessage[]` array into the `ModelMessage[]` format that the model expects.
4. The `streamText` function returns a [`StreamTextResult`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text#result). This result object contains the [`toUIMessageStreamResponse`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text#to-ui-message-stream-response) function which converts the result to a streamed response object.
5. Return the result to the client to stream the response.

## [Choosing a Provider](#choosing-a-provider)

The AI SDK supports dozens of model providers through [first-party](https://ai-sdk.dev/providers/ai-sdk-providers), [OpenAI-compatible](https://ai-sdk.dev/providers/openai-compatible-providers), and [community](https://ai-sdk.dev/providers/community-providers) packages.

This quickstart uses the [Vercel AI Gateway](https://vercel.com/ai-gateway) provider, which is the default [global provider](https://ai-sdk.dev/docs/ai-sdk-core/provider-management#global-provider-configuration). This means you can access models using a simple string in the model configuration:

```
1model: "anthropic/claude-sonnet-4.5";
```

You can also explicitly import and use the gateway provider in two other equivalent ways:

```
1// Option 1: Import from 'ai' package (included by default)2import { gateway } from 'ai';3model: gateway('anthropic/claude-sonnet-4.5');4
5// Option 2: Install and import from '@ai-sdk/gateway' package6import { gateway } from '@ai-sdk/gateway';7model: gateway('anthropic/claude-sonnet-4.5');
```

### [Using other providers](#using-other-providers)

To use a different provider, install its package and create a provider instance. For example, to use OpenAI directly:

pnpm add @ai-sdk/openai

```
1import { openai } from '@ai-sdk/openai';2
3model: openai('gpt-5.1');
```

## [Wire up the UI](#wire-up-the-ui)

Now that you have an API route that can query an LLM, it's time to setup your frontend. The AI SDK's [UI](https://ai-sdk.dev/docs/ai-sdk-ui/overview) package abstract the complexity of a chat interface into one hook, [`useChat`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat).

Update your root page (`pages/index.vue`) with the following code to show a list of chat messages and provide a user message input:

```
1<script setup lang="ts">2import { Chat } from "@ai-sdk/vue";3import { ref } from "vue";4
5const input = ref("");6const chat = new Chat({});7
8const handleSubmit = (e: Event) => {9 e.preventDefault();10 chat.sendMessage({ text: input.value });11 input.value = "";12};13</script>14
15<template>16 <div>17 <div v-for="(m, index) in chat.messages" :key="m.id ? m.id : index">18 {{ m.role === "user" ? "User: " : "AI: " }}19 <div20 v-for="(part, index) in m.parts"21 :key="`${m.id}-${part.type}-${index}`"22 >23 <div v-if="part.type === 'text'">{{ part.text }}</div>24 </div>25 </div>26
27 <form @submit="handleSubmit">28 <input v-model="input" placeholder="Say something..." />29 </form>30 </div>31</template>
```

If your project has `app.vue` instead of `pages/index.vue`, delete the `app.vue` file and create a new `pages/index.vue` file with the code above.

This page utilizes the `useChat` hook, which will, by default, use the API route you created earlier (`/api/chat`). The hook provides functions and state for handling user input and form submission. The `useChat` hook provides multiple utility functions and state variables:

* `messages` - the current chat messages (an array of objects with `id`, `role`, and `parts` properties).
* `sendMessage` - a function to send a message to the chat API.

The component uses local state (`ref`) to manage the input field value, and handles form submission by calling `sendMessage` with the input text and then clearing the input field.

The LLM's response is accessed through the message `parts` array. Each message contains an ordered array of `parts` that represents everything the model generated in its response. These parts can include plain text, reasoning tokens, and more that you will see later. The `parts` array preserves the sequence of the model's outputs, allowing you to display or process each component in the order it was generated.

## [Running Your Application](#running-your-application)

With that, you have built everything you need for your chatbot! To start your application, use the command:

pnpm run dev

Head to your browser and open [http://localhost:3000](http://localhost:3000/). You should see an input field. Test it out by entering a message and see the AI chatbot respond in real-time! The AI SDK makes it fast and easy to build AI chat interfaces with Nuxt.

## [Enhance Your Chatbot with Tools](#enhance-your-chatbot-with-tools)

While large language models (LLMs) have incredible generation capabilities, they struggle with discrete tasks (e.g. mathematics) and interacting with the outside world (e.g. getting the weather). This is where [tools](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling) come in.

Tools are actions that an LLM can invoke. The results of these actions can be reported back to the LLM to be considered in the next response.

For example, if a user asks about the current weather, without tools, the model would only be able to provide general information based on its training data. But with a weather tool, it can fetch and provide up-to-date, location-specific weather information.

Let's enhance your chatbot by adding a simple weather tool.

### [Update Your API Route](#update-your-api-route)

Modify your `server/api/chat.ts` file to include the new weather tool:

```
1import {2 createGateway,3 streamText,4 UIMessage,5 convertToModelMessages,6 tool,7} from 'ai';8import { z } from 'zod';9
10export default defineLazyEventHandler(async () => {11 const apiKey = useRuntimeConfig().aiGatewayApiKey;12 if (!apiKey) throw new Error('Missing AI Gateway API key');13 const gateway = createGateway({14 apiKey: apiKey,15 });16
17 return defineEventHandler(async (event: any) => {18 const { messages }: { messages: UIMessage[] } = await readBody(event);19
20 const result = streamText({21 model: gateway('anthropic/claude-sonnet-4.5'),22 messages: await convertToModelMessages(messages),23 tools: {24 weather: tool({25 description: 'Get the weather in a location (fahrenheit)',26 inputSchema: z.object({27 location: z28.string()29.describe('The location to get the weather for'),30 }),31 execute: async ({ location }) => {32 const temperature = Math.round(Math.random() * (90 - 32) + 32);33 return {34 location,35 temperature,36 };37 },38 }),39 },40 });41
42 return result.toUIMessageStreamResponse();43 });44});
```

In this updated code:

1. You import the `tool` function from the `ai` package and `z` from `zod` for schema validation.
 
2. You define a `tools` object with a `weather` tool. This tool:
 
 * Has a description that helps the model understand when to use it.
 * Defines `inputSchema` using a Zod schema, specifying that it requires a `location` string to execute this tool. The model will attempt to extract this input from the context of the conversation. If it can't, it will ask the user for the missing information.
 * Defines an `execute` function that simulates getting weather data (in this case, it returns a random temperature). This is an asynchronous function running on the server so you can fetch real data from an external API.

Now your chatbot can "fetch" weather information for any location the user asks about. When the model determines it needs to use the weather tool, it will generate a tool call with the necessary input. The `execute` function will then be automatically run, and the tool output will be added to the `messages` as a `tool` message.

Try asking something like "What's the weather in New York?" and see how the model uses the new tool.

Notice the blank response in the UI? This is because instead of generating a text response, the model generated a tool call. You can access the tool call and subsequent tool result on the client via the `tool-weather` part of the `message.parts` array.

Tool parts are always named `tool-{toolName}`, where `{toolName}` is the key you used when defining the tool. In this case, since we defined the tool as `weather`, the part type is `tool-weather`.

### [Update the UI](#update-the-ui)

To display the tool invocation in your UI, update your `pages/index.vue` file:

```
1<script setup lang="ts">2import { Chat } from "@ai-sdk/vue";3import { ref } from "vue";4
5const input = ref("");6const chat = new Chat({});7
8const handleSubmit = (e: Event) => {9 e.preventDefault();10 chat.sendMessage({ text: input.value });11 input.value = "";12};13</script>14
15<template>16 <div>17 <div v-for="(m, index) in chat.messages" :key="m.id ? m.id : index">18 {{ m.role === "user" ? "User: " : "AI: " }}19 <div20 v-for="(part, index) in m.parts"21 :key="`${m.id}-${part.type}-${index}`"22 >23 <div v-if="part.type === 'text'">{{ part.text }}</div>24 <pre v-if="part.type === 'tool-weather'">{{ JSON.stringify(part, null, 2) }}</pre>25 </div>26 </div>27
28 <form @submit="handleSubmit">29 <input v-model="input" placeholder="Say something..." />30 </form>31 </div>32</template>
```

With this change, you're updating the UI to handle different message parts. For text parts, you display the text content as before. For weather tool invocations, you display a JSON representation of the tool call and its result.

Now, when you ask about the weather, you'll see the tool call and its result displayed in your chat interface.

## [Enabling Multi-Step Tool Calls](#enabling-multi-step-tool-calls)

You may have noticed that while the tool is now visible in the chat interface, the model isn't using this information to answer your original query. This is because once the model generates a tool call, it has technically completed its generation.

To solve this, you can enable multi-step tool calls using `stopWhen`. By default, `stopWhen` is set to `stepCountIs(1)`, which means generation stops after the first step when there are tool results. By changing this condition, you can allow the model to automatically send tool results back to itself to trigger additional generations until your specified stopping condition is met. In this case, you want the model to continue generating so it can use the weather tool results to answer your original question.

### [Update Your API Route](#update-your-api-route-1)

Modify your `server/api/chat.ts` file to include the `stopWhen` condition:

```
1import {2 createGateway,3 streamText,4 UIMessage,5 convertToModelMessages,6 tool,7 stepCountIs,8} from 'ai';9import { z } from 'zod';10
11export default defineLazyEventHandler(async () => {12 const apiKey = useRuntimeConfig().aiGatewayApiKey;13 if (!apiKey) throw new Error('Missing AI Gateway API key');14 const gateway = createGateway({15 apiKey: apiKey,16 });17
18 return defineEventHandler(async (event: any) => {19 const { messages }: { messages: UIMessage[] } = await readBody(event);20
21 const result = streamText({22 model: gateway('anthropic/claude-sonnet-4.5'),23 messages: await convertToModelMessages(messages),24 stopWhen: stepCountIs(5),25 tools: {26 weather: tool({27 description: 'Get the weather in a location (fahrenheit)',28 inputSchema: z.object({29 location: z30.string()31.describe('The location to get the weather for'),32 }),33 execute: async ({ location }) => {34 const temperature = Math.round(Math.random() * (90 - 32) + 32);35 return {36 location,37 temperature,38 };39 },40 }),41 },42 });43
44 return result.toUIMessageStreamResponse();45 });46});
```

Head back to the browser and ask about the weather in a location. You should now see the model using the weather tool results to answer your question.

By setting `stopWhen: stepCountIs(5)`, you're allowing the model to use up to 5 "steps" for any given generation. This enables more complex interactions and allows the model to gather and process information over several steps if needed. You can see this in action by adding another tool to convert the temperature from Fahrenheit to Celsius.

### [Add another tool](#add-another-tool)

Update your `server/api/chat.ts` file to add a new tool to convert the temperature from Fahrenheit to Celsius:

```
1import {2 createGateway,3 streamText,4 UIMessage,5 convertToModelMessages,6 tool,7 stepCountIs,8} from 'ai';9import { z } from 'zod';10
11export default defineLazyEventHandler(async () => {12 const apiKey = useRuntimeConfig().aiGatewayApiKey;13 if (!apiKey) throw new Error('Missing AI Gateway API key');14 const gateway = createGateway({15 apiKey: apiKey,16 });17
18 return defineEventHandler(async (event: any) => {19 const { messages }: { messages: UIMessage[] } = await readBody(event);20
21 const result = streamText({22 model: gateway('anthropic/claude-sonnet-4.5'),23 messages: await convertToModelMessages(messages),24 stopWhen: stepCountIs(5),25 tools: {26 weather: tool({27 description: 'Get the weather in a location (fahrenheit)',28 inputSchema: z.object({29 location: z30.string()31.describe('The location to get the weather for'),32 }),33 execute: async ({ location }) => {34 const temperature = Math.round(Math.random() * (90 - 32) + 32);35 return {36 location,37 temperature,38 };39 },40 }),41 convertFahrenheitToCelsius: tool({42 description: 'Convert a temperature in fahrenheit to celsius',43 inputSchema: z.object({44 temperature: z45.number()46.describe('The temperature in fahrenheit to convert'),47 }),48 execute: async ({ temperature }) => {49 const celsius = Math.round((temperature - 32) * (5 / 9));50 return {51 celsius,52 };53 },54 }),55 },56 });57
58 return result.toUIMessageStreamResponse();59 });60});
```

### [Update Your Frontend](#update-your-frontend)

Update your UI to handle the new temperature conversion tool by modifying the tool part handling:

```
1<script setup lang="ts">2import { Chat } from "@ai-sdk/vue";3import { ref } from "vue";4
5const input = ref("");6const chat = new Chat({});7
8const handleSubmit = (e: Event) => {9 e.preventDefault();10 chat.sendMessage({ text: input.value });11 input.value = "";12};13</script>14
15<template>16 <div>17 <div v-for="(m, index) in chat.messages" :key="m.id ? m.id : index">18 {{ m.role === "user" ? "User: " : "AI: " }}19 <div20 v-for="(part, index) in m.parts"21 :key="`${m.id}-${part.type}-${index}`"22 >23 <div v-if="part.type === 'text'">{{ part.text }}</div>24 <pre25 v-if="26 part.type === 'tool-weather' ||27 part.type === 'tool-convertFahrenheitToCelsius'28 "29 >{{ JSON.stringify(part, null, 2) }}</pre30 >31 </div>32 </div>33
34 <form @submit="handleSubmit">35 <input v-model="input" placeholder="Say something..." />36 </form>37 </div>38</template>
```

This update handles the new `tool-convertFahrenheitToCelsius` part type, displaying the temperature conversion tool calls and results in the UI.

Now, when you ask "What's the weather in New York in celsius?", you should see a more complete interaction:

1. The model will call the weather tool for New York.
2. You'll see the tool output displayed.
3. It will then call the temperature conversion tool to convert the temperature from Fahrenheit to Celsius.
4. The model will then use that information to provide a natural language response about the weather in New York.

This multi-step approach allows the model to gather information and use it to provide more accurate and contextual responses, making your chatbot considerably more useful.

This simple example demonstrates how tools can expand your model's capabilities. You can create more complex tools to integrate with real APIs, databases, or any other external systems, allowing the model to access and process real-world data in real-time. Tools bridge the gap between the model's knowledge cutoff and current information.

## [Where to Next?](#where-to-next)

You've built an AI chatbot using the AI SDK! From here, you have several paths to explore:

* To learn more about the AI SDK, read through the [documentation](https://ai-sdk.dev/docs).
* If you're interested in diving deeper with guides, check out the [RAG (retrieval-augmented generation)](https://ai-sdk.dev/cookbook/guides/rag-chatbot) and [multi-modal chatbot](https://ai-sdk.dev/cookbook/guides/multi-modal-chatbot) guides.
* To jumpstart your first AI project, explore available [templates](https://vercel.com/templates?type=ai).

---
url: https://ai-sdk.dev/docs/getting-started/nodejs
title: "Getting Started: Node.js"
description: "Learn how to build your first agent with the AI SDK and Node.js."
hash: "f58c7cfff37ca83e18c863d41f276c1853ac6d22450f5fe877f12a2d16a283af"
crawledAt: 2026-03-07T07:58:19.633Z
depth: 2
---

## [Node.js Quickstart](#nodejs-quickstart)

The AI SDK is a powerful TypeScript library designed to help developers build AI-powered applications.

In this quickstart tutorial, you'll build a simple agent with a streaming chat user interface. Along the way, you'll learn key concepts and techniques that are fundamental to using the SDK in your own projects.

If you are unfamiliar with the concepts of [Prompt Engineering](https://ai-sdk.dev/docs/advanced/prompt-engineering) and [HTTP Streaming](https://ai-sdk.dev/docs/foundations/streaming), you can optionally read these documents first.

## [Prerequisites](#prerequisites)

To follow this quickstart, you'll need:

* Node.js 18+ and pnpm installed on your local development machine.
* A [Vercel AI Gateway](https://vercel.com/ai-gateway) API key.

If you haven't obtained your Vercel AI Gateway API key, you can do so by [signing up](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai&title=Go+to+AI+Gateway) on the Vercel website.

## [Setup Your Application](#setup-your-application)

Start by creating a new directory using the `mkdir` command. Change into your new directory and then run the `pnpm init` command. This will create a `package.json` in your new directory.

```
1mkdir my-ai-app2cd my-ai-app3pnpm init
```

### [Install Dependencies](#install-dependencies)

Install `ai`, the AI SDK, along with other necessary dependencies.

```
1pnpm add ai zod dotenv2pnpm add -D @types/node tsx typescript
```

The `ai` package contains the AI SDK. You will use `zod` to define type-safe schemas that you will pass to the large language model (LLM). You will use `dotenv` to access environment variables (your Vercel AI Gateway key) within your application. There are also three development dependencies, installed with the `-D` flag, that are necessary to run your TypeScript code.

### [Configure Vercel AI Gateway API key](#configure-vercel-ai-gateway-api-key)

Create a `.env` file in your project's root directory and add your Vercel AI Gateway API Key. This key is used to authenticate your application with the Vercel AI Gateway service.

touch.env

Edit the `.env` file:

```
1AI_GATEWAY_API_KEY=xxxxxxxxx
```

Replace `xxxxxxxxx` with your actual Vercel AI Gateway API key.

The AI SDK will use the `AI_GATEWAY_API_KEY` environment variable to authenticate with Vercel AI Gateway.

## [Create Your Application](#create-your-application)

Create an `index.ts` file in the root of your project and add the following code:

```
1import { ModelMessage, streamText } from 'ai';2import 'dotenv/config';3import * as readline from 'node:readline/promises';4
5const terminal = readline.createInterface({6 input: process.stdin,7 output: process.stdout,8});9
10const messages: ModelMessage[] = [];11
12async function main() {13 while (true) {14 const userInput = await terminal.question('You: ');15
16 messages.push({ role: 'user', content: userInput });17
18 const result = streamText({19 model: "anthropic/claude-sonnet-4.5",20 messages,21 });22
23 let fullResponse = '';24 process.stdout.write('\nAssistant: ');25 for await (const delta of result.textStream) {26 fullResponse += delta;27 process.stdout.write(delta);28 }29 process.stdout.write('\n\n');30
31 messages.push({ role: 'assistant', content: fullResponse });32 }33}34
35main().catch(console.error);
```

Let's take a look at what is happening in this code:

1. Set up a readline interface to take input from the terminal, enabling interactive sessions directly from the command line.
2. Initialize an array called `messages` to store the history of your conversation. This history allows the agent to maintain context in ongoing dialogues.
3. In the `main` function:

* Prompt for and capture user input, storing it in `userInput`.
* Add user input to the `messages` array as a user message.
* Call [`streamText`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text), which is imported from the `ai` package. This function accepts a configuration object that contains a `model` provider and `messages`.
* Iterate over the text stream returned by the `streamText` function (`result.textStream`) and print the contents of the stream to the terminal.
* Add the assistant's response to the `messages` array.

## [Running Your Application](#running-your-application)

With that, you have built everything you need for your agent! To start your application, use the command:

pnpm tsx index.ts

You should see a prompt in your terminal. Test it out by entering a message and see the AI agent respond in real-time! The AI SDK makes it fast and easy to build AI chat interfaces with Node.js.

## [Choosing a Provider](#choosing-a-provider)

The AI SDK supports dozens of model providers through [first-party](https://ai-sdk.dev/providers/ai-sdk-providers), [OpenAI-compatible](https://ai-sdk.dev/providers/openai-compatible-providers), and [community](https://ai-sdk.dev/providers/community-providers) packages.

This quickstart uses the [Vercel AI Gateway](https://vercel.com/ai-gateway) provider, which is the default [global provider](https://ai-sdk.dev/docs/ai-sdk-core/provider-management#global-provider-configuration). This means you can access models using a simple string in the model configuration:

```
1model: "anthropic/claude-sonnet-4.5";
```

You can also explicitly import and use the gateway provider in two other equivalent ways:

```
1// Option 1: Import from 'ai' package (included by default)2import { gateway } from 'ai';3model: gateway('anthropic/claude-sonnet-4.5');4
5// Option 2: Install and import from '@ai-sdk/gateway' package6import { gateway } from '@ai-sdk/gateway';7model: gateway('anthropic/claude-sonnet-4.5');
```

### [Using other providers](#using-other-providers)

To use a different provider, install its package and create a provider instance. For example, to use OpenAI directly:

pnpm add @ai-sdk/openai

```
1import { openai } from '@ai-sdk/openai';2
3model: openai('gpt-5.1');
```

## [Enhance Your Agent with Tools](#enhance-your-agent-with-tools)

While large language models (LLMs) have incredible generation capabilities, they struggle with discrete tasks (e.g. mathematics) and interacting with the outside world (e.g. getting the weather). This is where [tools](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling) come in.

Tools are actions that an LLM can invoke. The results of these actions can be reported back to the LLM to be considered in the next response.

For example, if a user asks about the current weather, without tools, the agent would only be able to provide general information based on its training data. But with a weather tool, it can fetch and provide up-to-date, location-specific weather information.

Let's enhance your agent by adding a simple weather tool.

### [Update Your Application](#update-your-application)

Modify your `index.ts` file to include the new weather tool:

```
1import { ModelMessage, streamText, tool } from 'ai';2import 'dotenv/config';3import { z } from 'zod';4import * as readline from 'node:readline/promises';5
6const terminal = readline.createInterface({7 input: process.stdin,8 output: process.stdout,9});10
11const messages: ModelMessage[] = [];12
13async function main() {14 while (true) {15 const userInput = await terminal.question('You: ');16
17 messages.push({ role: 'user', content: userInput });18
19 const result = streamText({20 model: "anthropic/claude-sonnet-4.5",21 messages,22 tools: {23 weather: tool({24 description: 'Get the weather in a location (fahrenheit)',25 inputSchema: z.object({26 location: z27.string()28.describe('The location to get the weather for'),29 }),30 execute: async ({ location }) => {31 const temperature = Math.round(Math.random() * (90 - 32) + 32);32 return {33 location,34 temperature,35 };36 },37 }),38 },39 });40
41 let fullResponse = '';42 process.stdout.write('\nAssistant: ');43 for await (const delta of result.textStream) {44 fullResponse += delta;45 process.stdout.write(delta);46 }47 process.stdout.write('\n\n');48
49 messages.push({ role: 'assistant', content: fullResponse });50 }51}52
53main().catch(console.error);
```

In this updated code:

1. You import the `tool` function from the `ai` package.
 
2. You define a `tools` object with a `weather` tool. This tool:
 
 * Has a description that helps the agent understand when to use it.
 * Defines `inputSchema` using a Zod schema, specifying that it requires a `location` string to execute this tool. The agent will attempt to extract this input from the context of the conversation. If it can't, it will ask the user for the missing information.
 * Defines an `execute` function that simulates getting weather data (in this case, it returns a random temperature). This is an asynchronous function running on the server so you can fetch real data from an external API.

Now your agent can "fetch" weather information for any location the user asks about. When the agent determines it needs to use the weather tool, it will generate a tool call with the necessary parameters. The `execute` function will then be automatically run, and the results will be used by the agent to generate its response.

Try asking something like "What's the weather in New York?" and see how the agent uses the new tool.

Notice the blank "assistant" response? This is because instead of generating a text response, the agent generated a tool call. You can access the tool call and subsequent tool result in the `toolCall` and `toolResult` keys of the result object.

```
1import { ModelMessage, streamText, tool } from 'ai';2import 'dotenv/config';3import { z } from 'zod';4import * as readline from 'node:readline/promises';5
6const terminal = readline.createInterface({7 input: process.stdin,8 output: process.stdout,9});10
11const messages: ModelMessage[] = [];12
13async function main() {14 while (true) {15 const userInput = await terminal.question('You: ');16
17 messages.push({ role: 'user', content: userInput });18
19 const result = streamText({20 model: "anthropic/claude-sonnet-4.5",21 messages,22 tools: {23 weather: tool({24 description: 'Get the weather in a location (fahrenheit)',25 inputSchema: z.object({26 location: z27.string()28.describe('The location to get the weather for'),29 }),30 execute: async ({ location }) => {31 const temperature = Math.round(Math.random() * (90 - 32) + 32);32 return {33 location,34 temperature,35 };36 },37 }),38 },39 });40
41 let fullResponse = '';42 process.stdout.write('\nAssistant: ');43 for await (const delta of result.textStream) {44 fullResponse += delta;45 process.stdout.write(delta);46 }47 process.stdout.write('\n\n');48
49 console.log(await result.toolCalls);50 console.log(await result.toolResults);51 messages.push({ role: 'assistant', content: fullResponse });52 }53}54
55main().catch(console.error);
```

Now, when you ask about the weather, you'll see the tool call and its result displayed in your chat interface.

## [Enabling Multi-Step Tool Calls](#enabling-multi-step-tool-calls)

You may have noticed that while the tool results are visible in the chat interface, the agent isn't using this information to answer your original query. This is because once the agent generates a tool call, it has technically completed its generation.

To solve this, you can enable multi-step tool calls using `stopWhen`. This feature will automatically send tool results back to the agent to trigger an additional generation until the stopping condition you define is met. In this case, you want the agent to answer your question using the results from the weather tool.

### [Update Your Application](#update-your-application-1)

Modify your `index.ts` file to configure stopping conditions with `stopWhen`:

```
1import { ModelMessage, streamText, tool, stepCountIs } from 'ai';2import 'dotenv/config';3import { z } from 'zod';4import * as readline from 'node:readline/promises';5
6const terminal = readline.createInterface({7 input: process.stdin,8 output: process.stdout,9});10
11const messages: ModelMessage[] = [];12
13async function main() {14 while (true) {15 const userInput = await terminal.question('You: ');16
17 messages.push({ role: 'user', content: userInput });18
19 const result = streamText({20 model: "anthropic/claude-sonnet-4.5",21 messages,22 tools: {23 weather: tool({24 description: 'Get the weather in a location (fahrenheit)',25 inputSchema: z.object({26 location: z27.string()28.describe('The location to get the weather for'),29 }),30 execute: async ({ location }) => {31 const temperature = Math.round(Math.random() * (90 - 32) + 32);32 return {33 location,34 temperature,35 };36 },37 }),38 },39 stopWhen: stepCountIs(5),40 onStepFinish: async ({ toolResults }) => {41 if (toolResults.length) {42 console.log(JSON.stringify(toolResults, null, 2));43 }44 },45 });46
47 let fullResponse = '';48 process.stdout.write('\nAssistant: ');49 for await (const delta of result.textStream) {50 fullResponse += delta;51 process.stdout.write(delta);52 }53 process.stdout.write('\n\n');54
55 messages.push({ role: 'assistant', content: fullResponse });56 }57}58
59main().catch(console.error);
```

In this updated code:

1. You set `stopWhen` to be when `stepCountIs` 5, allowing the agent to use up to 5 "steps" for any given generation.
2. You add an `onStepFinish` callback to log any `toolResults` from each step of the interaction, helping you understand the agent's tool usage. This means we can also delete the `toolCall` and `toolResult` `console.log` statements from the previous example.

Now, when you ask about the weather in a location, you should see the agent using the weather tool results to answer your question.

By setting `stopWhen: stepCountIs(5)`, you're allowing the agent to use up to 5 "steps" for any given generation. This enables more complex interactions and allows the agent to gather and process information over several steps if needed. You can see this in action by adding another tool to convert the temperature from Celsius to Fahrenheit.

### [Adding a second tool](#adding-a-second-tool)

Update your `index.ts` file to add a new tool to convert the temperature from Celsius to Fahrenheit:

```
1import { ModelMessage, streamText, tool, stepCountIs } from 'ai';2import 'dotenv/config';3import { z } from 'zod';4import * as readline from 'node:readline/promises';5
6const terminal = readline.createInterface({7 input: process.stdin,8 output: process.stdout,9});10
11const messages: ModelMessage[] = [];12
13async function main() {14 while (true) {15 const userInput = await terminal.question('You: ');16
17 messages.push({ role: 'user', content: userInput });18
19 const result = streamText({20 model: "anthropic/claude-sonnet-4.5",21 messages,22 tools: {23 weather: tool({24 description: 'Get the weather in a location (fahrenheit)',25 inputSchema: z.object({26 location: z27.string()28.describe('The location to get the weather for'),29 }),30 execute: async ({ location }) => {31 const temperature = Math.round(Math.random() * (90 - 32) + 32);32 return {33 location,34 temperature,35 };36 },37 }),38 convertFahrenheitToCelsius: tool({39 description: 'Convert a temperature in fahrenheit to celsius',40 inputSchema: z.object({41 temperature: z42.number()43.describe('The temperature in fahrenheit to convert'),44 }),45 execute: async ({ temperature }) => {46 const celsius = Math.round((temperature - 32) * (5 / 9));47 return {48 celsius,49 };50 },51 }),52 },53 stopWhen: stepCountIs(5),54 onStepFinish: async ({ toolResults }) => {55 if (toolResults.length) {56 console.log(JSON.stringify(toolResults, null, 2));57 }58 },59 });60
61 let fullResponse = '';62 process.stdout.write('\nAssistant: ');63 for await (const delta of result.textStream) {64 fullResponse += delta;65 process.stdout.write(delta);66 }67 process.stdout.write('\n\n');68
69 messages.push({ role: 'assistant', content: fullResponse });70 }71}72
73main().catch(console.error);
```

Now, when you ask "What's the weather in New York in celsius?", you should see a more complete interaction:

1. The agent will call the weather tool for New York.
2. You'll see the tool result logged.
3. It will then call the temperature conversion tool to convert the temperature from Fahrenheit to Celsius.
4. The agent will then use that information to provide a natural language response about the weather in New York.

This multi-step approach allows the agent to gather information and use it to provide more accurate and contextual responses, making your agent considerably more useful.

This example demonstrates how tools can expand your agent's capabilities. You can create more complex tools to integrate with real APIs, databases, or any other external systems, allowing the agent to access and process real-world data in real-time and perform actions that interact with the outside world. Tools bridge the gap between the agent's knowledge cutoff and current information, while also enabling it to take meaningful actions beyond just generating text responses.

## [Where to Next?](#where-to-next)

You've built an AI agent using the AI SDK! From here, you have several paths to explore:

* To learn more about the AI SDK, read through the [documentation](https://ai-sdk.dev/docs).
* If you're interested in diving deeper with guides, check out the [RAG (retrieval-augmented generation)](https://ai-sdk.dev/cookbook/guides/rag-chatbot) and [multi-modal chatbot](https://ai-sdk.dev/cookbook/guides/multi-modal-chatbot) guides.
* To jumpstart your first AI project, explore available [templates](https://vercel.com/templates?type=ai).

---
url: https://ai-sdk.dev/docs/getting-started/expo
title: "Getting Started: Expo"
description: "Learn how to build your first agent with the AI SDK and Expo."
hash: "34bd91a484bcb4212c37e649ebf9df177233ae9e55f5660b492f394b882d15ed"
crawledAt: 2026-03-07T07:58:25.476Z
depth: 2
---

## [Expo Quickstart](#expo-quickstart)

In this quickstart tutorial, you'll build a simple agent with a streaming chat user interface with [Expo](https://expo.dev/). Along the way, you'll learn key concepts and techniques that are fundamental to using the SDK in your own projects.

If you are unfamiliar with the concepts of [Prompt Engineering](https://ai-sdk.dev/docs/advanced/prompt-engineering) and [HTTP Streaming](https://ai-sdk.dev/docs/foundations/streaming), you can optionally read these documents first.

## [Prerequisites](#prerequisites)

To follow this quickstart, you'll need:

* Node.js 18+ and pnpm installed on your local development machine.
* A [Vercel AI Gateway](https://vercel.com/ai-gateway) API key.

If you haven't obtained your Vercel AI Gateway API key, you can do so by [signing up](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai&title=Go+to+AI+Gateway) on the Vercel website.

## [Create Your Application](#create-your-application)

Start by creating a new Expo application. This command will create a new directory named `my-ai-app` and set up a basic Expo application inside it.

pnpm create expo-app@latest my-ai-app

Navigate to the newly created directory:

cd my-ai-app

This guide requires Expo 52 or higher.

### [Install dependencies](#install-dependencies)

Install `ai` and `@ai-sdk/react`, the AI package and AI SDK's React hooks. The AI SDK's [Vercel AI Gateway provider](https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway) ships with the `ai` package. You'll also install `zod`, a schema validation library used for defining tool inputs.

This guide uses the Vercel AI Gateway provider so you can access hundreds of models from different providers with one API key, but you can switch to any provider or model by installing its package. Check out available [AI SDK providers](https://ai-sdk.dev/providers/ai-sdk-providers) for more information.

pnpm add ai @ai-sdk/react zod

### [Configure your AI Gateway API key](#configure-your-ai-gateway-api-key)

Create a `.env.local` file in your project root and add your AI Gateway API key. This key authenticates your application with the Vercel AI Gateway.

touch.env.local

Edit the `.env.local` file:

```
1AI_GATEWAY_API_KEY=xxxxxxxxx
```

Replace `xxxxxxxxx` with your actual Vercel AI Gateway API key.

The AI SDK's Vercel AI Gateway Provider will default to using the `AI_GATEWAY_API_KEY` environment variable.

## [Create an API Route](#create-an-api-route)

Create a route handler, `app/api/chat+api.ts` and add the following code:

```
1import { streamText, UIMessage, convertToModelMessages } from 'ai';2
3export async function POST(req: Request) {4 const { messages }: { messages: UIMessage[] } = await req.json();5
6 const result = streamText({7 model: "anthropic/claude-sonnet-4.5",8 messages: await convertToModelMessages(messages),9 });10
11 return result.toUIMessageStreamResponse({12 headers: {13 'Content-Type': 'application/octet-stream',14 'Content-Encoding': 'none',15 },16 });17}
```

Let's take a look at what is happening in this code:

1. Define an asynchronous `POST` request handler and extract `messages` from the body of the request. The `messages` variable contains a history of the conversation between you and the chatbot and provides the chatbot with the necessary context to make the next generation.
2. Call [`streamText`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text), which is imported from the `ai` package. This function accepts a configuration object that contains a `model` provider (imported from `ai`) and `messages` (defined in step 1). You can pass additional [settings](https://ai-sdk.dev/docs/ai-sdk-core/settings) to further customize the model's behavior.
3. The `streamText` function returns a [`StreamTextResult`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text#result-object). This result object contains the [`toUIMessageStreamResponse`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text#to-ui-message-stream-response) function which converts the result to a streamed response object.
4. Finally, return the result to the client to stream the response.

This API route creates a POST request endpoint at `/api/chat`.

## [Choosing a Provider](#choosing-a-provider)

The AI SDK supports dozens of model providers through [first-party](https://ai-sdk.dev/providers/ai-sdk-providers), [OpenAI-compatible](https://ai-sdk.dev/providers/openai-compatible-providers), and [community](https://ai-sdk.dev/providers/community-providers) packages.

This quickstart uses the [Vercel AI Gateway](https://vercel.com/ai-gateway) provider, which is the default [global provider](https://ai-sdk.dev/docs/ai-sdk-core/provider-management#global-provider-configuration). This means you can access models using a simple string in the model configuration:

```
1model: "anthropic/claude-sonnet-4.5";
```

You can also explicitly import and use the gateway provider in two other equivalent ways:

```
1// Option 1: Import from 'ai' package (included by default)2import { gateway } from 'ai';3model: gateway('anthropic/claude-sonnet-4.5');4
5// Option 2: Install and import from '@ai-sdk/gateway' package6import { gateway } from '@ai-sdk/gateway';7model: gateway('anthropic/claude-sonnet-4.5');
```

### [Using other providers](#using-other-providers)

To use a different provider, install its package and create a provider instance. For example, to use OpenAI directly:

pnpm add @ai-sdk/openai

```
1import { openai } from '@ai-sdk/openai';2
3model: openai('gpt-5.1');
```

#### [Updating the global provider](#updating-the-global-provider)

You can change the default global provider so string model references use your preferred provider everywhere in your application. Learn more about [provider management](https://ai-sdk.dev/docs/ai-sdk-core/provider-management#global-provider-configuration).

Pick the approach that best matches how you want to manage providers across your application.

## [Wire up the UI](#wire-up-the-ui)

Now that you have an API route that can query an LLM, it's time to setup your frontend. The AI SDK's [UI](https://ai-sdk.dev/docs/ai-sdk-ui) package abstracts the complexity of a chat interface into one hook, [`useChat`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat).

Update your root page (`app/(tabs)/index.tsx`) with the following code to show a list of chat messages and provide a user message input:

```
1import { generateAPIUrl } from '@/utils';2import { useChat } from '@ai-sdk/react';3import { DefaultChatTransport } from 'ai';4import { fetch as expoFetch } from 'expo/fetch';5import { useState } from 'react';6import { View, TextInput, ScrollView, Text, SafeAreaView } from 'react-native';7
8export default function App() {9 const [input, setInput] = useState('');10 const { messages, error, sendMessage } = useChat({11 transport: new DefaultChatTransport({12 fetch: expoFetch as unknown as typeof globalThis.fetch,13 api: generateAPIUrl('/api/chat'),14 }),15 onError: error => console.error(error, 'ERROR'),16 });17
18 if (error) return <Text>{error.message}</Text>;19
20 return (21 <SafeAreaView style={{ height: '100%' }}>22 <View23 style={{24 height: '95%',25 display: 'flex',26 flexDirection: 'column',27 paddingHorizontal: 8,28 }}29 >30 <ScrollView style={{ flex: 1 }}>31 {messages.map(m => (32 <View key={m.id} style={{ marginVertical: 8 }}>33 <View>34 <Text style={{ fontWeight: 700 }}>{m.role}</Text>35 {m.parts.map((part, i) => {36 switch (part.type) {37 case 'text':38 return <Text key={`${m.id}-${i}`}>{part.text}</Text>;39 }40 })}41 </View>42 </View>43 ))}44 </ScrollView>45
46 <View style={{ marginTop: 8 }}>47 <TextInput48 style={{ backgroundColor: 'white', padding: 8 }}49 placeholder="Say something..."50 value={input}51 onChange={e => setInput(e.nativeEvent.text)}52 onSubmitEditing={e => {53 e.preventDefault();54 sendMessage({ text: input });55 setInput('');56 }}57 autoFocus={true}58 />59 </View>60 </View>61 </SafeAreaView>62 );63}
```

This page utilizes the `useChat` hook, which will, by default, use the `POST` API route you created earlier (`/api/chat`). The hook provides functions and state for handling user input and form submission. The `useChat` hook provides multiple utility functions and state variables:

* `messages` - the current chat messages (an array of objects with `id`, `role`, and `parts` properties).
* `sendMessage` - a function to send a message to the chat API.

The component uses local state (`useState`) to manage the input field value, and handles form submission by calling `sendMessage` with the input text and then clearing the input field.

The LLM's response is accessed through the message `parts` array. Each message contains an ordered array of `parts` that represents everything the model generated in its response. These parts can include plain text, reasoning tokens, and more that you will see later. The `parts` array preserves the sequence of the model's outputs, allowing you to display or process each component in the order it was generated.

You use the expo/fetch function instead of the native node fetch to enable streaming of chat responses. This requires Expo 52 or higher.

### [Create the API URL Generator](#create-the-api-url-generator)

Because you're using expo/fetch for streaming responses instead of the native fetch function, you'll need an API URL generator to ensure you are using the correct base url and format depending on the client environment (e.g. web or mobile). Create a new file called `utils.ts` in the root of your project and add the following code:

```
1import Constants from 'expo-constants';2
3export const generateAPIUrl = (relativePath: string) => {4 const origin = Constants.experienceUrl.replace('exp://', 'http://');5
6 const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;7
8 if (process.env.NODE_ENV === 'development') {9 return origin.concat(path);10 }11
12 if (!process.env.EXPO_PUBLIC_API_BASE_URL) {13 throw new Error(14 'EXPO_PUBLIC_API_BASE_URL environment variable is not defined',15 );16 }17
18 return process.env.EXPO_PUBLIC_API_BASE_URL.concat(path);19};
```

This utility function handles URL generation for both development and production environments, ensuring your API calls work correctly across different devices and configurations.

Before deploying to production, you must set the `EXPO_PUBLIC_API_BASE_URL` environment variable in your production environment. This variable should point to the base URL of your API server.

## [Running Your Application](#running-your-application)

With that, you have built everything you need for your chatbot! To start your application, use the command:

pnpm expo

Head to your browser and open [http://localhost:8081](http://localhost:8081/). You should see an input field. Test it out by entering a message and see the AI chatbot respond in real-time! The AI SDK makes it fast and easy to build AI chat interfaces with Expo.

If you experience "Property `structuredClone` doesn't exist" errors on mobile, add the [polyfills described below](#polyfills).

## [Enhance Your Chatbot with Tools](#enhance-your-chatbot-with-tools)

While large language models (LLMs) have incredible generation capabilities, they struggle with discrete tasks (e.g. mathematics) and interacting with the outside world (e.g. getting the weather). This is where [tools](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling) come in.

Tools are actions that an LLM can invoke. The results of these actions can be reported back to the LLM to be considered in the next response.

For example, if a user asks about the current weather, without tools, the model would only be able to provide general information based on its training data. But with a weather tool, it can fetch and provide up-to-date, location-specific weather information.

Let's enhance your chatbot by adding a simple weather tool.

### [Update Your API route](#update-your-api-route)

Modify your `app/api/chat+api.ts` file to include the new weather tool:

```
1import { streamText, UIMessage, convertToModelMessages, tool } from 'ai';2import { z } from 'zod';3
4export async function POST(req: Request) {5 const { messages }: { messages: UIMessage[] } = await req.json();6
7 const result = streamText({8 model: "anthropic/claude-sonnet-4.5",9 messages: await convertToModelMessages(messages),10 tools: {11 weather: tool({12 description: 'Get the weather in a location (fahrenheit)',13 inputSchema: z.object({14 location: z.string().describe('The location to get the weather for'),15 }),16 execute: async ({ location }) => {17 const temperature = Math.round(Math.random() * (90 - 32) + 32);18 return {19 location,20 temperature,21 };22 },23 }),24 },25 });26
27 return result.toUIMessageStreamResponse({28 headers: {29 'Content-Type': 'application/octet-stream',30 'Content-Encoding': 'none',31 },32 });33}
```

In this updated code:

1. You import the `tool` function from the `ai` package and `z` from `zod` for schema validation.
 
2. You define a `tools` object with a `weather` tool. This tool:
 
 * Has a description that helps the model understand when to use it.
 * Defines `inputSchema` using a Zod schema, specifying that it requires a `location` string to execute this tool. The model will attempt to extract this input from the context of the conversation. If it can't, it will ask the user for the missing information.
 * Defines an `execute` function that simulates getting weather data (in this case, it returns a random temperature). This is an asynchronous function running on the server so you can fetch real data from an external API.

Now your chatbot can "fetch" weather information for any location the user asks about. When the model determines it needs to use the weather tool, it will generate a tool call with the necessary input. The `execute` function will then be automatically run, and the tool output will be added to the `messages` as a `tool` message.

You may need to restart your development server for the changes to take effect.

Try asking something like "What's the weather in New York?" and see how the model uses the new tool.

Notice the blank response in the UI? This is because instead of generating a text response, the model generated a tool call. You can access the tool call and subsequent tool result on the client via the `tool-weather` part of the `message.parts` array.

Tool parts are always named `tool-{toolName}`, where `{toolName}` is the key you used when defining the tool. In this case, since we defined the tool as `weather`, the part type is `tool-weather`.

### [Update the UI](#update-the-ui)

To display the weather tool invocation in your UI, update your `app/(tabs)/index.tsx` file:

```
1import { generateAPIUrl } from '@/utils';2import { useChat } from '@ai-sdk/react';3import { DefaultChatTransport } from 'ai';4import { fetch as expoFetch } from 'expo/fetch';5import { useState } from 'react';6import { View, TextInput, ScrollView, Text, SafeAreaView } from 'react-native';7
8export default function App() {9 const [input, setInput] = useState('');10 const { messages, error, sendMessage } = useChat({11 transport: new DefaultChatTransport({12 fetch: expoFetch as unknown as typeof globalThis.fetch,13 api: generateAPIUrl('/api/chat'),14 }),15 onError: error => console.error(error, 'ERROR'),16 });17
18 if (error) return <Text>{error.message}</Text>;19
20 return (21 <SafeAreaView style={{ height: '100%' }}>22 <View23 style={{24 height: '95%',25 display: 'flex',26 flexDirection: 'column',27 paddingHorizontal: 8,28 }}29 >30 <ScrollView style={{ flex: 1 }}>31 {messages.map(m => (32 <View key={m.id} style={{ marginVertical: 8 }}>33 <View>34 <Text style={{ fontWeight: 700 }}>{m.role}</Text>35 {m.parts.map((part, i) => {36 switch (part.type) {37 case 'text':38 return <Text key={`${m.id}-${i}`}>{part.text}</Text>;39 case 'tool-weather':40 return (41 <Text key={`${m.id}-${i}`}>42 {JSON.stringify(part, null, 2)}43 </Text>44 );45 }46 })}47 </View>48 </View>49 ))}50 </ScrollView>51
52 <View style={{ marginTop: 8 }}>53 <TextInput54 style={{ backgroundColor: 'white', padding: 8 }}55 placeholder="Say something..."56 value={input}57 onChange={e => setInput(e.nativeEvent.text)}58 onSubmitEditing={e => {59 e.preventDefault();60 sendMessage({ text: input });61 setInput('');62 }}63 autoFocus={true}64 />65 </View>66 </View>67 </SafeAreaView>68 );69}
```

You may need to restart your development server for the changes to take effect.

With this change, you're updating the UI to handle different message parts. For text parts, you display the text content as before. For weather tool invocations, you display a JSON representation of the tool call and its result.

Now, when you ask about the weather, you'll see the tool call and its result displayed in your chat interface.

## [Enabling Multi-Step Tool Calls](#enabling-multi-step-tool-calls)

You may have noticed that while the tool results are visible in the chat interface, the model isn't using this information to answer your original query. This is because once the model generates a tool call, it has technically completed its generation.

To solve this, you can enable multi-step tool calls using `stopWhen`. By default, `stopWhen` is set to `stepCountIs(1)`, which means generation stops after the first step when there are tool results. By changing this condition, you can allow the model to automatically send tool results back to itself to trigger additional generations until your specified stopping condition is met. In this case, you want the model to continue generating so it can use the weather tool results to answer your original question.

### [Update Your API Route](#update-your-api-route-1)

Modify your `app/api/chat+api.ts` file to include the `stopWhen` condition:

```
1import {2 streamText,3 UIMessage,4 convertToModelMessages,5 tool,6 stepCountIs,7} from 'ai';8import { z } from 'zod';9
10export async function POST(req: Request) {11 const { messages }: { messages: UIMessage[] } = await req.json();12
13 const result = streamText({14 model: "anthropic/claude-sonnet-4.5",15 messages: await convertToModelMessages(messages),16 stopWhen: stepCountIs(5),17 tools: {18 weather: tool({19 description: 'Get the weather in a location (fahrenheit)',20 inputSchema: z.object({21 location: z.string().describe('The location to get the weather for'),22 }),23 execute: async ({ location }) => {24 const temperature = Math.round(Math.random() * (90 - 32) + 32);25 return {26 location,27 temperature,28 };29 },30 }),31 },32 });33
34 return result.toUIMessageStreamResponse({35 headers: {36 'Content-Type': 'application/octet-stream',37 'Content-Encoding': 'none',38 },39 });40}
```

You may need to restart your development server for the changes to take effect.

Head back to the Expo app and ask about the weather in a location. You should now see the model using the weather tool results to answer your question.

By setting `stopWhen: stepCountIs(5)`, you're allowing the model to use up to 5 "steps" for any given generation. This enables more complex interactions and allows the model to gather and process information over several steps if needed. You can see this in action by adding another tool to convert the temperature from Fahrenheit to Celsius.

### [Add More Tools](#add-more-tools)

Update your `app/api/chat+api.ts` file to add a new tool to convert the temperature from Fahrenheit to Celsius:

```
1import {2 streamText,3 UIMessage,4 convertToModelMessages,5 tool,6 stepCountIs,7} from 'ai';8import { z } from 'zod';9
10export async function POST(req: Request) {11 const { messages }: { messages: UIMessage[] } = await req.json();12
13 const result = streamText({14 model: "anthropic/claude-sonnet-4.5",15 messages: await convertToModelMessages(messages),16 stopWhen: stepCountIs(5),17 tools: {18 weather: tool({19 description: 'Get the weather in a location (fahrenheit)',20 inputSchema: z.object({21 location: z.string().describe('The location to get the weather for'),22 }),23 execute: async ({ location }) => {24 const temperature = Math.round(Math.random() * (90 - 32) + 32);25 return {26 location,27 temperature,28 };29 },30 }),31 convertFahrenheitToCelsius: tool({32 description: 'Convert a temperature in fahrenheit to celsius',33 inputSchema: z.object({34 temperature: z35.number()36.describe('The temperature in fahrenheit to convert'),37 }),38 execute: async ({ temperature }) => {39 const celsius = Math.round((temperature - 32) * (5 / 9));40 return {41 celsius,42 };43 },44 }),45 },46 });47
48 return result.toUIMessageStreamResponse({49 headers: {50 'Content-Type': 'application/octet-stream',51 'Content-Encoding': 'none',52 },53 });54}
```

You may need to restart your development server for the changes to take effect.

### [Update the UI for the new tool](#update-the-ui-for-the-new-tool)

To display the temperature conversion tool invocation in your UI, update your `app/(tabs)/index.tsx` file to handle the new tool part:

```
1import { generateAPIUrl } from '@/utils';2import { useChat } from '@ai-sdk/react';3import { DefaultChatTransport } from 'ai';4import { fetch as expoFetch } from 'expo/fetch';5import { useState } from 'react';6import { View, TextInput, ScrollView, Text, SafeAreaView } from 'react-native';7
8export default function App() {9 const [input, setInput] = useState('');10 const { messages, error, sendMessage } = useChat({11 transport: new DefaultChatTransport({12 fetch: expoFetch as unknown as typeof globalThis.fetch,13 api: generateAPIUrl('/api/chat'),14 }),15 onError: error => console.error(error, 'ERROR'),16 });17
18 if (error) return <Text>{error.message}</Text>;19
20 return (21 <SafeAreaView style={{ height: '100%' }}>22 <View23 style={{24 height: '95%',25 display: 'flex',26 flexDirection: 'column',27 paddingHorizontal: 8,28 }}29 >30 <ScrollView style={{ flex: 1 }}>31 {messages.map(m => (32 <View key={m.id} style={{ marginVertical: 8 }}>33 <View>34 <Text style={{ fontWeight: 700 }}>{m.role}</Text>35 {m.parts.map((part, i) => {36 switch (part.type) {37 case 'text':38 return <Text key={`${m.id}-${i}`}>{part.text}</Text>;39 case 'tool-weather':40 case 'tool-convertFahrenheitToCelsius':41 return (42 <Text key={`${m.id}-${i}`}>43 {JSON.stringify(part, null, 2)}44 </Text>45 );46 }47 })}48 </View>49 </View>50 ))}51 </ScrollView>52
53 <View style={{ marginTop: 8 }}>54 <TextInput55 style={{ backgroundColor: 'white', padding: 8 }}56 placeholder="Say something..."57 value={input}58 onChange={e => setInput(e.nativeEvent.text)}59 onSubmitEditing={e => {60 e.preventDefault();61 sendMessage({ text: input });62 setInput('');63 }}64 autoFocus={true}65 />66 </View>67 </View>68 </SafeAreaView>69 );70}
```

You may need to restart your development server for the changes to take effect.

Now, when you ask "What's the weather in New York in celsius?", you should see a more complete interaction:

1. The model will call the weather tool for New York.
2. You'll see the tool result displayed.
3. It will then call the temperature conversion tool to convert the temperature from Fahrenheit to Celsius.
4. The model will then use that information to provide a natural language response about the weather in New York.

This multi-step approach allows the model to gather information and use it to provide more accurate and contextual responses, making your chatbot considerably more useful.

This simple example demonstrates how tools can expand your model's capabilities. You can create more complex tools to integrate with real APIs, databases, or any other external systems, allowing the model to access and process real-world data in real-time. Tools bridge the gap between the model's knowledge cutoff and current information.

## [Polyfills](#polyfills)

Several functions that are internally used by the AI SDK might not available in the Expo runtime depending on your configuration and the target platform.

First, install the following packages:

pnpm add @ungap/structured-clone @stardazed/streams-text-encoding

Then create a new file in the root of your project with the following polyfills:

```
1import { Platform } from 'react-native';2import structuredClone from '@ungap/structured-clone';3
4if (Platform.OS !== 'web') {5 const setupPolyfills = async () => {6 const { polyfillGlobal } = await import(7 'react-native/Libraries/Utilities/PolyfillFunctions'8 );9
10 const { TextEncoderStream, TextDecoderStream } = await import(11 '@stardazed/streams-text-encoding'12 );13
14 if (!('structuredClone' in global)) {15 polyfillGlobal('structuredClone', () => structuredClone);16 }17
18 polyfillGlobal('TextEncoderStream', () => TextEncoderStream);19 polyfillGlobal('TextDecoderStream', () => TextDecoderStream);20 };21
22 setupPolyfills();23}24
25export {};
```

Finally, import the polyfills in your root `_layout.tsx`:

```
1import '@/polyfills';
```

## [Where to Next?](#where-to-next)

You've built an AI chatbot using the AI SDK! From here, you have several paths to explore:

* To learn more about the AI SDK, read through the [documentation](https://ai-sdk.dev/docs).
* If you're interested in diving deeper with guides, check out the [RAG (retrieval-augmented generation)](https://ai-sdk.dev/cookbook/guides/rag-chatbot) and [multi-modal chatbot](https://ai-sdk.dev/cookbook/guides/multi-modal-chatbot) guides.
* To jumpstart your first AI project, explore available [templates](https://vercel.com/templates?type=ai).

---
url: https://ai-sdk.dev/docs/getting-started/tanstack-start
title: "Getting Started: TanStack Start"
description: "Learn how to build your first agent with the AI SDK and TanStack Start."
hash: "d39e165bd87270b04a04602238e834ebf8cb3cc3dec01f1a2366000f3f5f7cad"
crawledAt: 2026-03-07T07:58:31.188Z
depth: 2
---

## [TanStack Start Quickstart](#tanstack-start-quickstart)

The AI SDK is a powerful TypeScript library designed to help developers build AI-powered applications.

In this quickstart tutorial, you'll build a simple agent with a streaming chat user interface. Along the way, you'll learn key concepts and techniques that are fundamental to using the AI SDK in your own projects.

If you are unfamiliar with the concepts of [Prompt Engineering](https://ai-sdk.dev/docs/advanced/prompt-engineering) and [HTTP Streaming](https://ai-sdk.dev/docs/foundations/streaming), you can optionally read these documents first.

## [Prerequisites](#prerequisites)

To follow this quickstart, you'll need:

* Node.js 18+ and pnpm installed on your local development machine.
* A [Vercel AI Gateway](https://vercel.com/ai-gateway) API key.

If you haven't obtained your Vercel AI Gateway API key, you can do so by [signing up](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai&title=Go+to+AI+Gateway) on the Vercel website.

## [Create Your Application](#create-your-application)

Start by creating a new TanStack Start application. This command will create a new directory named `my-ai-app` and set up a basic TanStack Start application inside it.

pnpm create @tanstack/start@latest my-ai-app

Navigate to the newly created directory:

cd my-ai-app

### [Install dependencies](#install-dependencies)

Install `ai` and `@ai-sdk/react`, the AI package and AI SDK's React hooks. The AI SDK's [Vercel AI Gateway provider](https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway) ships with the `ai` package. You'll also install `zod`, a schema validation library used for defining tool inputs.

This guide uses the Vercel AI Gateway provider so you can access hundreds of models from different providers with one API key, but you can switch to any provider or model by installing its package. Check out available [AI SDK providers](https://ai-sdk.dev/providers/ai-sdk-providers) for more information.

pnpm add ai @ai-sdk/react zod

### [Configure your AI Gateway API key](#configure-your-ai-gateway-api-key)

Create a `.env` file in your project root and add your AI Gateway API key. This key authenticates your application with Vercel AI Gateway.

touch.env

Edit the `.env` file:

```
1AI_GATEWAY_API_KEY=xxxxxxxxx
```

Replace `xxxxxxxxx` with your actual Vercel AI Gateway API key.

The AI SDK's Vercel AI Gateway Provider will default to using the `AI_GATEWAY_API_KEY` environment variable.

## [Create a Route Handler](#create-a-route-handler)

Create a route handler, `src/routes/api/chat.ts` and add the following code:

```
1import { streamText, UIMessage, convertToModelMessages } from 'ai';2import { createFileRoute } from '@tanstack/react-router';3
4export const Route = createFileRoute('/api/chat')({5 server: {6 handlers: {7 POST: async ({ request }) => {8 const { messages }: { messages: UIMessage[] } = await request.json();9
10 const result = streamText({11 model: "anthropic/claude-sonnet-4.5",12 messages: await convertToModelMessages(messages),13 });14
15 return result.toUIMessageStreamResponse();16 },17 },18 },19});
```

Let's take a look at what is happening in this code:

1. Define an asynchronous `POST` request handler using TanStack Start's server routes and extract `messages` from the body of the request. The `messages` variable contains a history of the conversation between you and the chatbot and provides the chatbot with the necessary context to make the next generation. The `messages` are of UIMessage type, which are designed for use in application UI - they contain the entire message history and associated metadata like timestamps.
2. Call [`streamText`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text), which is imported from the `ai` package. This function accepts a configuration object that contains a `model` provider and `messages` (defined in step 1). You can pass additional [settings](https://ai-sdk.dev/docs/ai-sdk-core/settings) to further customize the model's behavior. The `messages` key expects a `ModelMessage[]` array. This type is different from `UIMessage` in that it does not include metadata, such as timestamps or sender information. To convert between these types, we use the `convertToModelMessages` function, which strips the UI-specific metadata and transforms the `UIMessage[]` array into the `ModelMessage[]` format that the model expects.
3. The `streamText` function returns a [`StreamTextResult`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text#result-object). This result object contains the [`toUIMessageStreamResponse`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text#to-ui-message-stream-response) function which converts the result to a streamed response object.
4. Finally, return the result to the client to stream the response.

This Route Handler creates a POST request endpoint at `/api/chat`.

## [Choosing a Provider](#choosing-a-provider)

The AI SDK supports dozens of model providers through [first-party](https://ai-sdk.dev/providers/ai-sdk-providers), [OpenAI-compatible](https://ai-sdk.dev/providers/openai-compatible-providers), and [community](https://ai-sdk.dev/providers/community-providers) packages.

This quickstart uses the [Vercel AI Gateway](https://vercel.com/ai-gateway) provider, which is the default [global provider](https://ai-sdk.dev/docs/ai-sdk-core/provider-management#global-provider-configuration). This means you can access models using a simple string in the model configuration:

```
1model: "anthropic/claude-sonnet-4.5";
```

You can also explicitly import and use the gateway provider in two other equivalent ways:

```
1// Option 1: Import from 'ai' package (included by default)2import { gateway } from 'ai';3model: gateway('anthropic/claude-sonnet-4.5');4
5// Option 2: Install and import from '@ai-sdk/gateway' package6import { gateway } from '@ai-sdk/gateway';7model: gateway('anthropic/claude-sonnet-4.5');
```

### [Using other providers](#using-other-providers)

To use a different provider, install its package and create a provider instance. For example, to use OpenAI directly:

pnpm add @ai-sdk/openai

```
1import { openai } from '@ai-sdk/openai';2
3model: openai('gpt-5.1');
```

#### [Updating the global provider](#updating-the-global-provider)

You can change the default global provider so string model references use your preferred provider everywhere in your application. Learn more about [provider management](https://ai-sdk.dev/docs/ai-sdk-core/provider-management#global-provider-configuration).

Pick the approach that best matches how you want to manage providers across your application.

## [Wire up the UI](#wire-up-the-ui)

Now that you have a Route Handler that can query an LLM, it's time to setup your frontend. The AI SDK's [UI](https://ai-sdk.dev/docs/ai-sdk-ui) package abstracts the complexity of a chat interface into one hook, [`useChat`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat).

Update your index route (`src/routes/index.tsx`) with the following code to show a list of chat messages and provide a user message input:

```
1import { createFileRoute } from '@tanstack/react-router';2import { useChat } from '@ai-sdk/react';3import { useState } from 'react';4
5export const Route = createFileRoute('/')({6 component: Chat,7});8
9function Chat() {10 const [input, setInput] = useState('');11 const { messages, sendMessage } = useChat();12 return (13 <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">14 {messages.map(message => (15 <div key={message.id} className="whitespace-pre-wrap">16 {message.role === 'user' ? 'User: ' : 'AI: '}17 {message.parts.map((part, i) => {18 switch (part.type) {19 case 'text':20 return <div key={`${message.id}-${i}`}>{part.text}</div>;21 }22 })}23 </div>24 ))}25
26 <form27 onSubmit={e => {28 e.preventDefault();29 sendMessage({ text: input });30 setInput('');31 }}32 >33 <input34 className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"35 value={input}36 placeholder="Say something..."37 onChange={e => setInput(e.currentTarget.value)}38 />39 </form>40 </div>41 );42}
```

This page utilizes the `useChat` hook, which will, by default, use the `POST` API route you created earlier (`/api/chat`). The hook provides functions and state for handling user input and form submission. The `useChat` hook provides multiple utility functions and state variables:

* `messages` - the current chat messages (an array of objects with `id`, `role`, and `parts` properties).
* `sendMessage` - a function to send a message to the chat API.

The component uses local state (`useState`) to manage the input field value, and handles form submission by calling `sendMessage` with the input text and then clearing the input field.

The LLM's response is accessed through the message `parts` array. Each message contains an ordered array of `parts` that represents everything the model generated in its response. These parts can include plain text, reasoning tokens, and more that you will see later. The `parts` array preserves the sequence of the model's outputs, allowing you to display or process each component in the order it was generated.

## [Running Your Application](#running-your-application)

With that, you have built everything you need for your chatbot! To start your application, use the command:

pnpm run dev

Head to your browser and open [http://localhost:3000](http://localhost:3000/). You should see an input field. Test it out by entering a message and see the AI chatbot respond in real-time! The AI SDK makes it fast and easy to build AI chat interfaces with TanStack Start.

## [Enhance Your Chatbot with Tools](#enhance-your-chatbot-with-tools)

While large language models (LLMs) have incredible generation capabilities, they struggle with discrete tasks (e.g. mathematics) and interacting with the outside world (e.g. getting the weather). This is where [tools](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling) come in.

Tools are actions that an LLM can invoke. The results of these actions can be reported back to the LLM to be considered in the next response.

For example, if a user asks about the current weather, without tools, the model would only be able to provide general information based on its training data. But with a weather tool, it can fetch and provide up-to-date, location-specific weather information.

Let's enhance your chatbot by adding a simple weather tool.

### [Update Your Route Handler](#update-your-route-handler)

Modify your `src/routes/api/chat.ts` file to include the new weather tool:

```
1import { streamText, UIMessage, convertToModelMessages, tool } from 'ai';2import { createFileRoute } from '@tanstack/react-router';3import { z } from 'zod';4
5export const Route = createFileRoute('/api/chat')({6 server: {7 handlers: {8 POST: async ({ request }) => {9 const { messages }: { messages: UIMessage[] } = await request.json();10
11 const result = streamText({12 model: "anthropic/claude-sonnet-4.5",13 messages: await convertToModelMessages(messages),14 tools: {15 weather: tool({16 description: 'Get the weather in a location (fahrenheit)',17 inputSchema: z.object({18 location: z19.string()20.describe('The location to get the weather for'),21 }),22 execute: async ({ location }) => {23 const temperature = Math.round(Math.random() * (90 - 32) + 32);24 return {25 location,26 temperature,27 };28 },29 }),30 },31 });32
33 return result.toUIMessageStreamResponse();34 },35 },36 },37});
```

In this updated code:

1. You import the `tool` function from the `ai` package and `z` from `zod` for schema validation.
 
2. You define a `tools` object with a `weather` tool. This tool:
 
 * Has a description that helps the model understand when to use it.
 * Defines `inputSchema` using a Zod schema, specifying that it requires a `location` string to execute this tool. The model will attempt to extract this input from the context of the conversation. If it can't, it will ask the user for the missing information.
 * Defines an `execute` function that simulates getting weather data (in this case, it returns a random temperature). This is an asynchronous function running on the server so you can fetch real data from an external API.

Now your chatbot can "fetch" weather information for any location the user asks about. When the model determines it needs to use the weather tool, it will generate a tool call with the necessary input. The `execute` function will then be automatically run, and the tool output will be added to the `messages` as a `tool` message.

Try asking something like "What's the weather in New York?" and see how the model uses the new tool.

Notice the blank response in the UI? This is because instead of generating a text response, the model generated a tool call. You can access the tool call and subsequent tool result on the client via the `tool-weather` part of the `message.parts` array.

Tool parts are always named `tool-{toolName}`, where `{toolName}` is the key you used when defining the tool. In this case, since we defined the tool as `weather`, the part type is `tool-weather`.

### [Update the UI](#update-the-ui)

To display the tool invocation in your UI, update your `src/routes/index.tsx` file:

```
1import { createFileRoute } from '@tanstack/react-router';2import { useChat } from '@ai-sdk/react';3import { useState } from 'react';4
5export const Route = createFileRoute('/')({6 component: Chat,7});8
9function Chat() {10 const [input, setInput] = useState('');11 const { messages, sendMessage } = useChat();12 return (13 <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">14 {messages.map(message => (15 <div key={message.id} className="whitespace-pre-wrap">16 {message.role === 'user' ? 'User: ' : 'AI: '}17 {message.parts.map((part, i) => {18 switch (part.type) {19 case 'text':20 return <div key={`${message.id}-${i}`}>{part.text}</div>;21 case 'tool-weather':22 return (23 <pre key={`${message.id}-${i}`}>24 {JSON.stringify(part, null, 2)}25 </pre>26 );27 }28 })}29 </div>30 ))}31
32 <form33 onSubmit={e => {34 e.preventDefault();35 sendMessage({ text: input });36 setInput('');37 }}38 >39 <input40 className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"41 value={input}42 placeholder="Say something..."43 onChange={e => setInput(e.currentTarget.value)}44 />45 </form>46 </div>47 );48}
```

With this change, you're updating the UI to handle different message parts. For text parts, you display the text content as before. For weather tool invocations, you display a JSON representation of the tool call and its result.

Now, when you ask about the weather, you'll see the tool call and its result displayed in your chat interface.

## [Enabling Multi-Step Tool Calls](#enabling-multi-step-tool-calls)

You may have noticed that while the tool is now visible in the chat interface, the model isn't using this information to answer your original query. This is because once the model generates a tool call, it has technically completed its generation.

To solve this, you can enable multi-step tool calls using `stopWhen`. By default, `stopWhen` is set to `stepCountIs(1)`, which means generation stops after the first step when there are tool results. By changing this condition, you can allow the model to automatically send tool results back to itself to trigger additional generations until your specified stopping condition is met. In this case, you want the model to continue generating so it can use the weather tool results to answer your original question.

### [Update Your Route Handler](#update-your-route-handler-1)

Modify your `src/routes/api/chat.ts` file to include the `stopWhen` condition:

```
1import {2 streamText,3 UIMessage,4 convertToModelMessages,5 tool,6 stepCountIs,7} from 'ai';8import { createFileRoute } from '@tanstack/react-router';9import { z } from 'zod';10
11export const Route = createFileRoute('/api/chat')({12 server: {13 handlers: {14 POST: async ({ request }) => {15 const { messages }: { messages: UIMessage[] } = await request.json();16
17 const result = streamText({18 model: "anthropic/claude-sonnet-4.5",19 messages: await convertToModelMessages(messages),20 stopWhen: stepCountIs(5),21 tools: {22 weather: tool({23 description: 'Get the weather in a location (fahrenheit)',24 inputSchema: z.object({25 location: z26.string()27.describe('The location to get the weather for'),28 }),29 execute: async ({ location }) => {30 const temperature = Math.round(Math.random() * (90 - 32) + 32);31 return {32 location,33 temperature,34 };35 },36 }),37 },38 });39
40 return result.toUIMessageStreamResponse();41 },42 },43 },44});
```

In this updated code, you set `stopWhen` to be when `stepCountIs(5)`, allowing the model to use up to 5 "steps" for any given generation.

Head back to the browser and ask about the weather in a location. You should now see the model using the weather tool results to answer your question.

By setting `stopWhen: stepCountIs(5)`, you're allowing the model to use up to 5 "steps" for any given generation. This enables more complex interactions and allows the model to gather and process information over several steps if needed. You can see this in action by adding another tool to convert the temperature from Celsius to Fahrenheit.

### [Add another tool](#add-another-tool)

Update your `src/routes/api/chat.ts` file to add a new tool to convert the temperature from Fahrenheit to Celsius:

```
1import {2 streamText,3 UIMessage,4 convertToModelMessages,5 tool,6 stepCountIs,7} from 'ai';8import { createFileRoute } from '@tanstack/react-router';9import { z } from 'zod';10
11export const Route = createFileRoute('/api/chat')({12 server: {13 handlers: {14 POST: async ({ request }) => {15 const { messages }: { messages: UIMessage[] } = await request.json();16
17 const result = streamText({18 model: "anthropic/claude-sonnet-4.5",19 messages: await convertToModelMessages(messages),20 stopWhen: stepCountIs(5),21 tools: {22 weather: tool({23 description: 'Get the weather in a location (fahrenheit)',24 inputSchema: z.object({25 location: z26.string()27.describe('The location to get the weather for'),28 }),29 execute: async ({ location }) => {30 const temperature = Math.round(Math.random() * (90 - 32) + 32);31 return {32 location,33 temperature,34 };35 },36 }),37 convertFahrenheitToCelsius: tool({38 description: 'Convert a temperature in fahrenheit to celsius',39 inputSchema: z.object({40 temperature: z41.number()42.describe('The temperature in fahrenheit to convert'),43 }),44 execute: async ({ temperature }) => {45 const celsius = Math.round((temperature - 32) * (5 / 9));46 return {47 celsius,48 };49 },50 }),51 },52 });53
54 return result.toUIMessageStreamResponse();55 },56 },57 },58});
```

### [Update Your Frontend](#update-your-frontend)

update your `src/routes/index.tsx` file to render the new temperature conversion tool:

```
1import { createFileRoute } from '@tanstack/react-router';2import { useChat } from '@ai-sdk/react';3import { useState } from 'react';4
5export const Route = createFileRoute('/')({6 component: Chat,7});8
9function Chat() {10 const [input, setInput] = useState('');11 const { messages, sendMessage } = useChat();12 return (13 <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">14 {messages.map(message => (15 <div key={message.id} className="whitespace-pre-wrap">16 {message.role === 'user' ? 'User: ' : 'AI: '}17 {message.parts.map((part, i) => {18 switch (part.type) {19 case 'text':20 return <div key={`${message.id}-${i}`}>{part.text}</div>;21 case 'tool-weather':22 case 'tool-convertFahrenheitToCelsius':23 return (24 <pre key={`${message.id}-${i}`}>25 {JSON.stringify(part, null, 2)}26 </pre>27 );28 }29 })}30 </div>31 ))}32
33 <form34 onSubmit={e => {35 e.preventDefault();36 sendMessage({ text: input });37 setInput('');38 }}39 >40 <input41 className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"42 value={input}43 placeholder="Say something..."44 onChange={e => setInput(e.currentTarget.value)}45 />46 </form>47 </div>48 );49}
```

This update handles the new `tool-convertFahrenheitToCelsius` part type, displaying the temperature conversion tool calls and results in the UI.

Now, when you ask "What's the weather in New York in celsius?", you should see a more complete interaction:

1. The model will call the weather tool for New York.
2. You'll see the tool output displayed.
3. It will then call the temperature conversion tool to convert the temperature from Fahrenheit to Celsius.
4. The model will then use that information to provide a natural language response about the weather in New York.

This multi-step approach allows the model to gather information and use it to provide more accurate and contextual responses, making your chatbot considerably more useful.

This simple example demonstrates how tools can expand your model's capabilities. You can create more complex tools to integrate with real APIs, databases, or any other external systems, allowing the model to access and process real-world data in real-time. Tools bridge the gap between the model's knowledge cutoff and current information.

## [Where to Next?](#where-to-next)

You've built an AI chatbot using the AI SDK! From here, you have several paths to explore:

* To learn more about the AI SDK, read through the [documentation](https://ai-sdk.dev/docs).
* If you're interested in diving deeper with guides, check out the [RAG (retrieval-augmented generation)](https://ai-sdk.dev/cookbook/guides/rag-chatbot) and [multi-modal chatbot](https://ai-sdk.dev/cookbook/guides/multi-modal-chatbot) guides.
* To jumpstart your first AI project, explore available [templates](https://vercel.com/templates?type=ai).

---
url: https://ai-sdk.dev/docs/getting-started/coding-agents
title: "Getting Started: Coding Agents"
description: "Learn how to set up the AI SDK for use with coding agents, including installing skills, accessing bundled docs, and using DevTools."
hash: "4564c6f77a13fd2967e4148f3088ea63043e7fe58364c22b388d6b012c41dea1"
crawledAt: 2026-03-07T07:58:36.491Z
depth: 2
---

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