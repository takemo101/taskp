---
url: https://ai-sdk.dev/docs/ai-sdk-core
title: "AI SDK Core"
description: "Learn about AI SDK Core."
hash: "8dea714e13ca1c269a3cfe38bb218f432d97230bbaaefd3b93e041f4f7448a65"
crawledAt: 2026-03-07T07:59:25.388Z
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
url: https://ai-sdk.dev/docs/ai-sdk-core/overview
title: "AI SDK Core: Overview"
description: "An overview of AI SDK Core."
hash: "ca575d1c8723a317139a1aece54b4b27080e38c12ecc02ab3f16a319ca28b312"
crawledAt: 2026-03-07T07:59:30.632Z
depth: 2
---

## [AI SDK Core](#ai-sdk-core)

Large Language Models (LLMs) are advanced programs that can understand, create, and engage with human language on a large scale. They are trained on vast amounts of written material to recognize patterns in language and predict what might come next in a given piece of text.

AI SDK Core **simplifies working with LLMs by offering a standardized way of integrating them into your app** - so you can focus on building great AI applications for your users, not waste time on technical details.

For example, here’s how you can generate text with various models using the AI SDK:

```
1import { generateText } from "ai";2
3const { text } = await generateText({4 model: "anthropic/claude-sonnet-4.5",5 prompt: "What is love?",6});
```

Love is a complex and multifaceted emotion that can be felt and expressed in many different ways. It involves deep affection, care, compassion, and connection towards another person or thing.

## [AI SDK Core Functions](#ai-sdk-core-functions)

AI SDK Core has various functions designed for [text generation](https://ai-sdk.dev/docs/ai-sdk-core/generating-text), [structured data generation](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data), and [tool usage](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling). These functions take a standardized approach to setting up [prompts](https://ai-sdk.dev/docs/ai-sdk-core/prompts) and [settings](https://ai-sdk.dev/docs/ai-sdk-core/settings), making it easier to work with different models.

* [`generateText`](https://ai-sdk.dev/docs/ai-sdk-core/generating-text): Generates text and [tool calls](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling). This function is ideal for non-interactive use cases such as automation tasks where you need to write text (e.g. drafting email or summarizing web pages) and for agents that use tools.
* [`streamText`](https://ai-sdk.dev/docs/ai-sdk-core/generating-text): Stream text and tool calls. You can use the `streamText` function for interactive use cases such as [chat bots](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot) and [content streaming](https://ai-sdk.dev/docs/ai-sdk-ui/completion).

Both `generateText` and `streamText` support [structured output](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) via the `output` property (e.g. `Output.object()`, `Output.array()`), allowing you to generate typed, schema-validated data for information extraction, synthetic data generation, classification tasks, and [streaming generated UIs](https://ai-sdk.dev/docs/ai-sdk-ui/object-generation).

## [API Reference](#api-reference)

Please check out the [AI SDK Core API Reference](https://ai-sdk.dev/docs/reference/ai-sdk-core) for more details on each function.

---
url: https://ai-sdk.dev/docs/ai-sdk-core/generating-text
title: "AI SDK Core: Generating Text"
description: "Learn how to generate text with the AI SDK."
hash: "c7780e11573b3b977d0c760ca3786eef6c5b3e50cb7fa3aeb5defc54e40552ad"
crawledAt: 2026-03-07T07:59:36.418Z
depth: 2
---

## [Generating and Streaming Text](#generating-and-streaming-text)

Large language models (LLMs) can generate text in response to a prompt, which can contain instructions and information to process. For example, you can ask a model to come up with a recipe, draft an email, or summarize a document.

The AI SDK Core provides two functions to generate text and stream it from LLMs:

* [`generateText`](#generatetext): Generates text for a given prompt and model.
* [`streamText`](#streamtext): Streams text from a given prompt and model.

Advanced LLM features such as [tool calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling) and [structured data generation](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) are built on top of text generation.

## [`generateText`](#generatetext)

You can generate text using the [`generateText`](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text) function. This function is ideal for non-interactive use cases where you need to write text (e.g. drafting email or summarizing web pages) and for agents that use tools.

```
1import { generateText } from 'ai';2
3const { text } = await generateText({4 model: "anthropic/claude-sonnet-4.5",5 prompt: 'Write a vegetarian lasagna recipe for 4 people.',6});
```

You can use more [advanced prompts](https://ai-sdk.dev/docs/ai-sdk-core/prompts) to generate text with more complex instructions and content:

```
1import { generateText } from 'ai';2
3const { text } = await generateText({4 model: "anthropic/claude-sonnet-4.5",5 system:6 'You are a professional writer. ' +7 'You write simple, clear, and concise content.',8 prompt: `Summarize the following article in 3-5 sentences: ${article}`,9});
```

The result object of `generateText` contains several promises that resolve when all required data is available:

* `result.content`: The content that was generated in the last step.
* `result.text`: The generated text.
* `result.reasoning`: The full reasoning that the model has generated in the last step.
* `result.reasoningText`: The reasoning text of the model (only available for some models).
* `result.files`: The files that were generated in the last step.
* `result.sources`: Sources that have been used as references in the last step (only available for some models).
* `result.toolCalls`: The tool calls that were made in the last step.
* `result.toolResults`: The results of the tool calls from the last step.
* `result.finishReason`: The reason the model finished generating text.
* `result.rawFinishReason`: The raw reason why the generation finished (from the provider).
* `result.usage`: The usage of the model during the final step of text generation.
* `result.totalUsage`: The total usage across all steps (for multi-step generations).
* `result.warnings`: Warnings from the model provider (e.g. unsupported settings).
* `result.request`: Additional request information.
* `result.response`: Additional response information, including response messages and body.
* `result.providerMetadata`: Additional provider-specific metadata.
* `result.steps`: Details for all steps, useful for getting information about intermediate steps.
* `result.output`: The generated structured output using the `output` specification.

### [Accessing response headers & body](#accessing-response-headers--body)

Sometimes you need access to the full response from the model provider, e.g. to access some provider-specific headers or body content.

You can access the raw response headers and body using the `response` property:

```
1import { generateText } from 'ai';2
3const result = await generateText({4 //...5});6
7console.log(JSON.stringify(result.response.headers, null, 2));8console.log(JSON.stringify(result.response.body, null, 2));
```

### [`onFinish` callback](#onfinish-callback)

When using `generateText`, you can provide an `onFinish` callback that is triggered after the last step is finished ( [API Reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text#on-finish) ). It contains the text, usage information, finish reason, messages, steps, total usage, and more:

```
1import { generateText } from 'ai';2
3const result = await generateText({4 model: "anthropic/claude-sonnet-4.5",5 prompt: 'Invent a new holiday and describe its traditions.',6 onFinish({ text, finishReason, usage, response, steps, totalUsage }) {7 // your own logic, e.g. for saving the chat history or recording usage8
9 const messages = response.messages; // messages that were generated10 },11});
```

### [Lifecycle callbacks (experimental)](#lifecycle-callbacks-experimental)

Experimental callbacks are subject to breaking changes in incremental package releases.

`generateText` provides several experimental lifecycle callbacks that let you hook into different phases of the generation process. These are useful for logging, observability, debugging, and custom telemetry. Errors thrown inside these callbacks are silently caught and do not break the generation flow.

```
1import { generateText } from 'ai';2
3const result = await generateText({4 model: "anthropic/claude-sonnet-4.5",5 prompt: 'What is the weather in San Francisco?',6 tools: {7 //... your tools8 },9
10 experimental_onStart({ model, settings, functionId }) {11 console.log('Generation started', { model, functionId });12 },13
14 experimental_onStepStart({ stepNumber, model, promptMessages }) {15 console.log(`Step ${stepNumber} starting`, { model: model.modelId });16 },17
18 experimental_onToolCallStart({ toolName, toolCallId, input }) {19 console.log(`Tool call starting: ${toolName}`, { toolCallId });20 },21
22 experimental_onToolCallFinish({ toolName, durationMs, error }) {23 console.log(`Tool call finished: ${toolName} (${durationMs}ms)`, {24 success: !error,25 });26 },27
28 onStepFinish({ stepNumber, finishReason, usage }) {29 console.log(`Step ${stepNumber} finished`, { finishReason, usage });30 },31});
```

The available lifecycle callbacks are:

* **`experimental_onStart`**: Called once when the `generateText` operation begins, before any LLM calls. Receives model info, prompt, settings, and telemetry metadata.
* **`experimental_onStepStart`**: Called before each step (LLM call). Receives the step number, model, prompt messages being sent, tools, and prior steps.
* **`experimental_onToolCallStart`**: Called right before a tool's `execute` function runs. Receives the tool name, call ID, and input.
* **`experimental_onToolCallFinish`**: Called right after a tool's `execute` function completes or errors. Receives the tool name, call ID, input, output (or undefined on error), error (or undefined on success), and `durationMs`.
* **`onStepFinish`**: Called after each step finishes. Now also includes `stepNumber` (zero-based index of the completed step).

## [`streamText`](#streamtext)

Depending on your model and prompt, it can take a large language model (LLM) up to a minute to finish generating its response. This delay can be unacceptable for interactive use cases such as chatbots or real-time applications, where users expect immediate responses.

AI SDK Core provides the [`streamText`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text) function which simplifies streaming text from LLMs:

```
1import { streamText } from 'ai';2
3const result = streamText({4 model: "anthropic/claude-sonnet-4.5",5 prompt: 'Invent a new holiday and describe its traditions.',6});7
8// example: use textStream as an async iterable9for await (const textPart of result.textStream) {10 console.log(textPart);11}
```

`result.textStream` is both a `ReadableStream` and an `AsyncIterable`.

`streamText` immediately starts streaming and suppresses errors to prevent server crashes. Use the `onError` callback to log errors.

You can use `streamText` on its own or in combination with [AI SDK UI](https://ai-sdk.dev/examples/next-pages/basics/streaming-text-generation) and [AI SDK RSC](https://ai-sdk.dev/examples/next-app/basics/streaming-text-generation). The result object contains several helper functions to make the integration into [AI SDK UI](https://ai-sdk.dev/docs/ai-sdk-ui) easier:

* `result.toUIMessageStreamResponse()`: Creates a UI Message stream HTTP response (with tool calls etc.) that can be used in a Next.js App Router API route.
* `result.pipeUIMessageStreamToResponse()`: Writes UI Message stream delta output to a Node.js response-like object.
* `result.toTextStreamResponse()`: Creates a simple text stream HTTP response.
* `result.pipeTextStreamToResponse()`: Writes text delta output to a Node.js response-like object.

`streamText` is using backpressure and only generates tokens as they are requested. You need to consume the stream in order for it to finish.

It also provides several promises that resolve when the stream is finished:

* `result.content`: The content that was generated in the last step.
* `result.text`: The generated text.
* `result.reasoning`: The full reasoning that the model has generated.
* `result.reasoningText`: The reasoning text of the model (only available for some models).
* `result.files`: Files that have been generated by the model in the last step.
* `result.sources`: Sources that have been used as references in the last step (only available for some models).
* `result.toolCalls`: The tool calls that have been executed in the last step.
* `result.toolResults`: The tool results that have been generated in the last step.
* `result.finishReason`: The reason the model finished generating text.
* `result.rawFinishReason`: The raw reason why the generation finished (from the provider).
* `result.usage`: The usage of the model during the final step of text generation.
* `result.totalUsage`: The total usage across all steps (for multi-step generations).
* `result.warnings`: Warnings from the model provider (e.g. unsupported settings).
* `result.steps`: Details for all steps, useful for getting information about intermediate steps.
* `result.request`: Additional request information from the last step.
* `result.response`: Additional response information from the last step.
* `result.providerMetadata`: Additional provider-specific metadata from the last step.

### [`onError` callback](#onerror-callback)

`streamText` immediately starts streaming to enable sending data without waiting for the model. Errors become part of the stream and are not thrown to prevent e.g. servers from crashing.

To log errors, you can provide an `onError` callback that is triggered when an error occurs.

```
1import { streamText } from 'ai';2
3const result = streamText({4 model: "anthropic/claude-sonnet-4.5",5 prompt: 'Invent a new holiday and describe its traditions.',6 onError({ error }) {7 console.error(error); // your error logging logic here8 },9});
```

### [`onChunk` callback](#onchunk-callback)

When using `streamText`, you can provide an `onChunk` callback that is triggered for each chunk of the stream.

It receives the following chunk types:

* `text`
* `reasoning`
* `source`
* `tool-call`
* `tool-input-start`
* `tool-input-delta`
* `tool-result`
* `raw`

```
1import { streamText } from 'ai';2
3const result = streamText({4 model: "anthropic/claude-sonnet-4.5",5 prompt: 'Invent a new holiday and describe its traditions.',6 onChunk({ chunk }) {7 // implement your own logic here, e.g.:8 if (chunk.type === 'text') {9 console.log(chunk.text);10 }11 },12});
```

### [`onFinish` callback](#onfinish-callback-1)

When using `streamText`, you can provide an `onFinish` callback that is triggered when the stream is finished ( [API Reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text#on-finish) ). It contains the text, usage information, finish reason, messages, steps, total usage, and more:

```
1import { streamText } from 'ai';2
3const result = streamText({4 model: "anthropic/claude-sonnet-4.5",5 prompt: 'Invent a new holiday and describe its traditions.',6 onFinish({ text, finishReason, usage, response, steps, totalUsage }) {7 // your own logic, e.g. for saving the chat history or recording usage8
9 const messages = response.messages; // messages that were generated10 },11});
```

### [Lifecycle callbacks (experimental)](#lifecycle-callbacks-experimental-1)

Experimental callbacks are subject to breaking changes in incremental package releases.

`streamText` provides several experimental lifecycle callbacks that let you hook into different phases of the streaming process. These are useful for logging, observability, debugging, and custom telemetry. Errors thrown inside these callbacks are silently caught and do not break the streaming flow.

```
1import { streamText } from 'ai';2
3const result = streamText({4 model: "anthropic/claude-sonnet-4.5",5 prompt: 'What is the weather in San Francisco?',6 tools: {7 //... your tools8 },9
10 experimental_onStart({ model, system, prompt, messages }) {11 console.log('Streaming started', { model, prompt });12 },13
14 experimental_onStepStart({ stepNumber, model, messages }) {15 console.log(`Step ${stepNumber} starting`, { model: model.modelId });16 },17
18 experimental_onToolCallStart({ toolCall }) {19 console.log(`Tool call starting: ${toolCall.toolName}`, {20 toolCallId: toolCall.toolCallId,21 });22 },23
24 experimental_onToolCallFinish({ toolCall, durationMs, success, error }) {25 console.log(`Tool call finished: ${toolCall.toolName} (${durationMs}ms)`, {26 success,27 });28 },29
30 onStepFinish({ finishReason, usage }) {31 console.log('Step finished', { finishReason, usage });32 },33});
```

The available lifecycle callbacks are:

* **`experimental_onStart`**: Called once when the `streamText` operation begins, before any LLM calls. Receives model info, prompt, settings, and telemetry metadata.
* **`experimental_onStepStart`**: Called before each step (LLM call). Receives the step number, model, messages being sent, tools, and prior steps.
* **`experimental_onToolCallStart`**: Called right before a tool's `execute` function runs. Receives the tool call object, messages, and context.
* **`experimental_onToolCallFinish`**: Called right after a tool's `execute` function completes or errors. Receives the tool call object, `durationMs`, and a discriminated union with `success`/`output` or `success`/`error`.
* **`onStepFinish`**: Called after each step finishes. Receives the finish reason, usage, and other step details.

### [`fullStream` property](#fullstream-property)

You can read a stream with all events using the `fullStream` property. This can be useful if you want to implement your own UI or handle the stream in a different way. Here is an example of how to use the `fullStream` property:

```
1import { streamText } from 'ai';2import { z } from 'zod';3
4const result = streamText({5 model: "anthropic/claude-sonnet-4.5",6 tools: {7 cityAttractions: {8 inputSchema: z.object({ city: z.string() }),9 execute: async ({ city }) => ({10 attractions: ['attraction1', 'attraction2', 'attraction3'],11 }),12 },13 },14 prompt: 'What are some San Francisco tourist attractions?',15});16
17for await (const part of result.fullStream) {18 switch (part.type) {19 case 'start': {20 // handle start of stream21 break;22 }23 case 'start-step': {24 // handle start of step25 break;26 }27 case 'text-start': {28 // handle text start29 break;30 }31 case 'text-delta': {32 // handle text delta here33 break;34 }35 case 'text-end': {36 // handle text end37 break;38 }39 case 'reasoning-start': {40 // handle reasoning start41 break;42 }43 case 'reasoning-delta': {44 // handle reasoning delta here45 break;46 }47 case 'reasoning-end': {48 // handle reasoning end49 break;50 }51 case 'source': {52 // handle source here53 break;54 }55 case 'file': {56 // handle file here57 break;58 }59 case 'tool-call': {60 switch (part.toolName) {61 case 'cityAttractions': {62 // handle tool call here63 break;64 }65 }66 break;67 }68 case 'tool-input-start': {69 // handle tool input start70 break;71 }72 case 'tool-input-delta': {73 // handle tool input delta74 break;75 }76 case 'tool-input-end': {77 // handle tool input end78 break;79 }80 case 'tool-result': {81 switch (part.toolName) {82 case 'cityAttractions': {83 // handle tool result here84 break;85 }86 }87 break;88 }89 case 'tool-error': {90 // handle tool error91 break;92 }93 case 'finish-step': {94 // handle finish step95 break;96 }97 case 'finish': {98 // handle finish here99 break;100 }101 case 'error': {102 // handle error here103 break;104 }105 case 'raw': {106 // handle raw value107 break;108 }109 }110}
```

### [Stream transformation](#stream-transformation)

You can use the `experimental_transform` option to transform the stream. This is useful for e.g. filtering, changing, or smoothing the text stream.

The transformations are applied before the callbacks are invoked and the promises are resolved. If you e.g. have a transformation that changes all text to uppercase, the `onFinish` callback will receive the transformed text.

#### [Smoothing streams](#smoothing-streams)

The AI SDK Core provides a [`smoothStream` function](https://ai-sdk.dev/docs/reference/ai-sdk-core/smooth-stream) that can be used to smooth out text and reasoning streaming.

```
1import { smoothStream, streamText } from 'ai';2
3const result = streamText({4 model,5 prompt,6 experimental_transform: smoothStream(),7});
```

#### [Custom transformations](#custom-transformations)

You can also implement your own custom transformations. The transformation function receives the tools that are available to the model, and returns a function that is used to transform the stream. Tools can either be generic or limited to the tools that you are using.

Here is an example of how to implement a custom transformation that converts all text to uppercase:

```
1import { streamText, type TextStreamPart, type ToolSet } from 'ai';2
3const upperCaseTransform =4 <TOOLS extends ToolSet>() =>5 (options: { tools: TOOLS; stopStream: () => void }) =>6 new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({7 transform(chunk, controller) {8 controller.enqueue(9 // for text-delta chunks, convert the text to uppercase:10 chunk.type === 'text-delta'11 ? {...chunk, text: chunk.text.toUpperCase() }12 : chunk,13 );14 },15 });
```

You can also stop the stream using the `stopStream` function. This is e.g. useful if you want to stop the stream when model guardrails are violated, e.g. by generating inappropriate content.

When you invoke `stopStream`, it is important to simulate the `finish-step` and `finish` events to guarantee that a well-formed stream is returned and all callbacks are invoked.

```
1import { streamText, type TextStreamPart, type ToolSet } from 'ai';2
3const stopWordTransform =4 <TOOLS extends ToolSet>() =>5 ({ stopStream }: { stopStream: () => void }) =>6 new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({7 // note: this is a simplified transformation for testing;8 // in a real-world version more there would need to be9 // stream buffering and scanning to correctly emit prior text10 // and to detect all STOP occurrences.11 transform(chunk, controller) {12 if (chunk.type !== 'text-delta') {13 controller.enqueue(chunk);14 return;15 }16
17 if (chunk.text.includes('STOP')) {18 // stop the stream19 stopStream();20
21 // simulate the finish-step event22 controller.enqueue({23 type: 'finish-step',24 finishReason: 'stop',25 rawFinishReason: 'stop',26 usage: {27 completionTokens: NaN,28 promptTokens: NaN,29 totalTokens: NaN,30 },31 response: {32 id: 'response-id',33 modelId: 'mock-model-id',34 timestamp: new Date(0),35 },36 providerMetadata: undefined,37 });38
39 // simulate the finish event40 controller.enqueue({41 type: 'finish',42 finishReason: 'stop',43 rawFinishReason: 'stop',44 totalUsage: {45 completionTokens: NaN,46 promptTokens: NaN,47 totalTokens: NaN,48 },49 });50
51 return;52 }53
54 controller.enqueue(chunk);55 },56 });
```

#### [Multiple transformations](#multiple-transformations)

You can also provide multiple transformations. They are applied in the order they are provided.

```
1const result = streamText({2 model,3 prompt,4 experimental_transform: [firstTransform, secondTransform],5});
```

## [Sources](#sources)

Some providers such as [Perplexity](https://ai-sdk.dev/providers/ai-sdk-providers/perplexity#sources) and [Google Generative AI](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai#sources) include sources in the response.

Currently sources are limited to web pages that ground the response. You can access them using the `sources` property of the result.

Each `url` source contains the following properties:

* `id`: The ID of the source.
* `url`: The URL of the source.
* `title`: The optional title of the source.
* `providerMetadata`: Provider metadata for the source.

When you use `generateText`, you can access the sources using the `sources` property:

```
1const result = await generateText({2 model: 'google/gemini-2.5-flash',3 tools: {4 google_search: google.tools.googleSearch({}),5 },6 prompt: 'List the top 5 San Francisco news from the past week.',7});8
9for (const source of result.sources) {10 if (source.sourceType === 'url') {11 console.log('ID:', source.id);12 console.log('Title:', source.title);13 console.log('URL:', source.url);14 console.log('Provider metadata:', source.providerMetadata);15 console.log();16 }17}
```

When you use `streamText`, you can access the sources using the `fullStream` property:

```
1const result = streamText({2 model: 'google/gemini-2.5-flash',3 tools: {4 google_search: google.tools.googleSearch({}),5 },6 prompt: 'List the top 5 San Francisco news from the past week.',7});8
9for await (const part of result.fullStream) {10 if (part.type === 'source' && part.sourceType === 'url') {11 console.log('ID:', part.id);12 console.log('Title:', part.title);13 console.log('URL:', part.url);14 console.log('Provider metadata:', part.providerMetadata);15 console.log();16 }17}
```

The sources are also available in the `result.sources` promise.

## [Examples](#examples)

You can see `generateText` and `streamText` in action using various frameworks in the following examples:

### [`generateText`](#generatetext-1)

### [`streamText`](#streamtext-1)

---
url: https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
title: "AI SDK Core: Generating Structured Data"
description: "Learn how to generate structured data with the AI SDK."
hash: "7eaf8005d8b95679af0b6c0b1b62d3e7a606b9cc4d0ef393b9e4de4bc8ef1e4f"
crawledAt: 2026-03-07T07:59:43.006Z
depth: 2
---

While text generation can be useful, your use case will likely call for generating structured data. For example, you might want to extract information from text, classify data, or generate synthetic data.

Many language models are capable of generating structured data, often defined as using "JSON modes" or "tools". However, you need to manually provide schemas and then validate the generated data as LLMs can produce incorrect or incomplete structured data.

The AI SDK standardises structured object generation across model providers using the `output` property on [`generateText`](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text) and [`streamText`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text). You can use [Zod schemas](https://ai-sdk.dev/docs/reference/ai-sdk-core/zod-schema), [Valibot](https://ai-sdk.dev/docs/reference/ai-sdk-core/valibot-schema), or [JSON schemas](https://ai-sdk.dev/docs/reference/ai-sdk-core/json-schema) to specify the shape of the data that you want, and the AI model will generate data that conforms to that structure.

Structured output generation is part of the `generateText` and `streamText` flow. This means you can combine it with tool calling in the same request.

## [Generating Structured Outputs](#generating-structured-outputs)

Use `generateText` with `Output.object()` to generate structured data from a prompt. The schema is also used to validate the generated data, ensuring type safety and correctness.

```
1import { generateText, Output } from 'ai';2import { z } from 'zod';3
4const { output } = await generateText({5 model: "anthropic/claude-sonnet-4.5",6 output: Output.object({7 schema: z.object({8 recipe: z.object({9 name: z.string(),10 ingredients: z.array(11 z.object({ name: z.string(), amount: z.string() }),12 ),13 steps: z.array(z.string()),14 }),15 }),16 }),17 prompt: 'Generate a lasagna recipe.',18});
```

Structured output generation counts as a step in the AI SDK's multi-turn execution model (where each model call or tool execution is one step). When combining with tools, account for this in your `stopWhen` configuration.

### [Accessing response headers & body](#accessing-response-headers--body)

Sometimes you need access to the full response from the model provider, e.g. to access some provider-specific headers or body content.

You can access the raw response headers and body using the `response` property:

```
1import { generateText, Output } from 'ai';2
3const result = await generateText({4 //...5 output: Output.object({ schema }),6});7
8console.log(JSON.stringify(result.response.headers, null, 2));9console.log(JSON.stringify(result.response.body, null, 2));
```

## [Stream Structured Outputs](#stream-structured-outputs)

Given the added complexity of returning structured data, model response time can be unacceptable for your interactive use case. With `streamText` and `output`, you can stream the model's structured response as it is generated.

```
1import { streamText, Output } from 'ai';2import { z } from 'zod';3
4const { partialOutputStream } = streamText({5 model: "anthropic/claude-sonnet-4.5",6 output: Output.object({7 schema: z.object({8 recipe: z.object({9 name: z.string(),10 ingredients: z.array(11 z.object({ name: z.string(), amount: z.string() }),12 ),13 steps: z.array(z.string()),14 }),15 }),16 }),17 prompt: 'Generate a lasagna recipe.',18});19
20// use partialOutputStream as an async iterable21for await (const partialObject of partialOutputStream) {22 console.log(partialObject);23}
```

You can consume the structured output on the client with the [`useObject`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-object) hook.

### [Error Handling in Streams](#error-handling-in-streams)

`streamText` starts streaming immediately. When errors occur during streaming, they become part of the stream rather than thrown exceptions (to prevent stream crashes).

To handle errors, provide an `onError` callback:

```
1import { streamText, Output } from 'ai';2
3const result = streamText({4 //...5 output: Output.object({ schema }),6 onError({ error }) {7 console.error(error); // log to your error tracking service8 },9});
```

For non-streaming error handling with `generateText`, see the [Error Handling](#error-handling) section below.

## [Output Types](#output-types)

The AI SDK supports multiple ways of specifying the expected structure of generated data via the `Output` object. You can select from various strategies for structured/text generation and validation.

### [`Output.text()`](#outputtext)

Use `Output.text()` to generate plain text from a model. This option doesn't enforce any schema on the result: you simply receive the model's text as a string. This is the default behavior when no `output` is specified.

```
1import { generateText, Output } from 'ai';2
3const { output } = await generateText({4 //...5 output: Output.text(),6 prompt: 'Tell me a joke.',7});8// output will be a string (the joke)
```

### [`Output.object()`](#outputobject)

Use `Output.object({ schema })` to generate a structured object based on a schema (for example, a Zod schema). The output is type-validated to ensure the returned result matches the schema.

```
1import { generateText, Output } from 'ai';2import { z } from 'zod';3
4const { output } = await generateText({5 //...6 output: Output.object({7 schema: z.object({8 name: z.string(),9 age: z.number().nullable(),10 labels: z.array(z.string()),11 }),12 }),13 prompt: 'Generate information for a test user.',14});15// output will be an object matching the schema above
```

Partial outputs streamed via `streamText` cannot be validated against your provided schema, as incomplete data may not yet conform to the expected structure.

### [`Output.array()`](#outputarray)

Use `Output.array({ element })` to specify that you expect an array of typed objects from the model, where each element should conform to a schema (defined in the `element` property).

```
1import { generateText, Output } from 'ai';2import { z } from 'zod';3
4const { output } = await generateText({5 //...6 output: Output.array({7 element: z.object({8 location: z.string(),9 temperature: z.number(),10 condition: z.string(),11 }),12 }),13 prompt: 'List the weather for San Francisco and Paris.',14});15// output will be an array of objects like:16// [17// { location: 'San Francisco', temperature: 70, condition: 'Sunny' },18// { location: 'Paris', temperature: 65, condition: 'Cloudy' },19// ]
```

When streaming arrays with `streamText`, you can use `elementStream` to receive each completed element as it is generated:

```
1import { streamText, Output } from 'ai';2import { z } from 'zod';3
4const { elementStream } = streamText({5 //...6 output: Output.array({7 element: z.object({8 name: z.string(),9 class: z.string(),10 description: z.string(),11 }),12 }),13 prompt: 'Generate 3 hero descriptions for a fantasy role playing game.',14});15
16for await (const hero of elementStream) {17 console.log(hero); // Each hero is complete and validated18}
```

Each element emitted by `elementStream` is complete and validated against your element schema. This differs from `partialOutputStream`, which streams the entire partial array including incomplete elements.

### [`Output.choice()`](#outputchoice)

Use `Output.choice({ options })` when you expect the model to choose from a specific set of string options, such as for classification or fixed-enum answers.

```
1import { generateText, Output } from 'ai';2
3const { output } = await generateText({4 //...5 output: Output.choice({6 options: ['sunny', 'rainy', 'snowy'],7 }),8 prompt: 'Is the weather sunny, rainy, or snowy today?',9});10// output will be one of: 'sunny', 'rainy', or 'snowy'
```

You can provide any set of string options, and the output will always be a single string value that matches one of the specified options. The AI SDK validates that the result matches one of your options, and will throw if the model returns something invalid.

This is especially useful for making classification-style generations or forcing valid values for API compatibility.

### [`Output.json()`](#outputjson)

Use `Output.json()` when you want to generate and parse unstructured JSON values from the model, without enforcing a specific schema. This is useful if you want to capture arbitrary objects, flexible structures, or when you want to rely on the model's natural output rather than rigid validation.

```
1import { generateText, Output } from 'ai';2
3const { output } = await generateText({4 //...5 output: Output.json(),6 prompt:7 'For each city, return the current temperature and weather condition as a JSON object.',8});9
10// output could be any valid JSON, for example:11// {12// "San Francisco": { "temperature": 70, "condition": "Sunny" },13// "Paris": { "temperature": 65, "condition": "Cloudy" }14// }
```

With `Output.json`, the AI SDK only checks that the response is valid JSON; it doesn't validate the structure or types of the values. If you need schema validation, use the `.object` or `.array` outputs instead.

For more advanced validation or different structures, see [the Output API reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/output).

## [Generating Structured Outputs with Tools](#generating-structured-outputs-with-tools)

One of the key advantages of using structured output with `generateText` and `streamText` is the ability to combine it with tool calling.

```
1import { generateText, Output, tool, stepCountIs } from 'ai';2import { z } from 'zod';3
4const { output } = await generateText({5 model: "anthropic/claude-sonnet-4.5",6 tools: {7 weather: tool({8 description: 'Get the weather for a location',9 inputSchema: z.object({ location: z.string() }),10 execute: async ({ location }) => {11 // fetch weather data12 return { temperature: 72, condition: 'sunny' };13 },14 }),15 },16 output: Output.object({17 schema: z.object({18 summary: z.string(),19 recommendation: z.string(),20 }),21 }),22 stopWhen: stepCountIs(5),23 prompt: 'What should I wear in San Francisco today?',24});
```

When using tools with structured output, remember that generating the structured output counts as a step. Configure `stopWhen` to allow enough steps for both tool execution and output generation.

## [Property Descriptions](#property-descriptions)

You can add `.describe("...")` to individual schema properties to give the model hints about what each property is for. This helps improve the quality and accuracy of generated structured data:

```
1import { generateText, Output } from 'ai';2import { z } from 'zod';3
4const { output } = await generateText({5 model: "anthropic/claude-sonnet-4.5",6 output: Output.object({7 schema: z.object({8 name: z.string().describe('The name of the recipe'),9 ingredients: z10.array(11 z.object({12 name: z.string(),13 amount: z14.string()15.describe('The amount of the ingredient (grams or ml)'),16 }),17 )18.describe('List of ingredients with amounts'),19 steps: z.array(z.string()).describe('Step-by-step cooking instructions'),20 }),21 }),22 prompt: 'Generate a lasagna recipe.',23});
```

Property descriptions are particularly useful for:

* Clarifying ambiguous property names
* Specifying expected formats or conventions
* Providing context for complex nested structures

## [Output Name and Description](#output-name-and-description)

You can optionally specify a `name` and `description` for the output. These are used by some providers for additional LLM guidance, e.g. via tool or schema name.

```
1import { generateText, Output } from 'ai';2import { z } from 'zod';3
4const { output } = await generateText({5 model: "anthropic/claude-sonnet-4.5",6 output: Output.object({7 name: 'Recipe',8 description: 'A recipe for a dish.',9 schema: z.object({10 name: z.string(),11 ingredients: z.array(z.object({ name: z.string(), amount: z.string() })),12 steps: z.array(z.string()),13 }),14 }),15 prompt: 'Generate a lasagna recipe.',16});
```

This works with all output types that support structured generation:

* `Output.object({ name, description, schema })`
* `Output.array({ name, description, element })`
* `Output.choice({ name, description, options })`
* `Output.json({ name, description })`

## [Accessing Reasoning](#accessing-reasoning)

You can access the reasoning used by the language model to generate the object via the `reasoning` property on the result. This property contains a string with the model's thought process, if available.

```
1import { generateText, Output } from 'ai';2import { z } from 'zod';3
4const result = await generateText({5 model: "anthropic/claude-sonnet-4.5", // must be a reasoning model6 output: Output.object({7 schema: z.object({8 recipe: z.object({9 name: z.string(),10 ingredients: z.array(11 z.object({12 name: z.string(),13 amount: z.string(),14 }),15 ),16 steps: z.array(z.string()),17 }),18 }),19 }),20 prompt: 'Generate a lasagna recipe.',21});22
23console.log(result.reasoningText);
```

## [Error Handling](#error-handling)

When `generateText` with structured output cannot generate a valid object, it throws a [`AI_NoObjectGeneratedError`](https://ai-sdk.dev/docs/reference/ai-sdk-errors/ai-no-object-generated-error).

This error occurs when the AI provider fails to generate a parsable object that conforms to the schema. It can arise due to the following reasons:

* The model failed to generate a response.
* The model generated a response that could not be parsed.
* The model generated a response that could not be validated against the schema.

The error preserves the following information to help you log the issue:

* `text`: The text that was generated by the model. This can be the raw text or the tool call text, depending on the object generation mode.
* `response`: Metadata about the language model response, including response id, timestamp, and model.
* `usage`: Request token usage.
* `cause`: The cause of the error (e.g. a JSON parsing error). You can use this for more detailed error handling.

```
1import { generateText, Output, NoObjectGeneratedError } from 'ai';2
3try {4 await generateText({5 model,6 output: Output.object({ schema }),7 prompt,8 });9} catch (error) {10 if (NoObjectGeneratedError.isInstance(error)) {11 console.log('NoObjectGeneratedError');12 console.log('Cause:', error.cause);13 console.log('Text:', error.text);14 console.log('Response:', error.response);15 console.log('Usage:', error.usage);16 }17}
```

## [More Examples](#more-examples)

You can see structured output generation in action using various frameworks in the following examples:

### [`generateText` with Output](#generatetext-with-output)

### [`streamText` with Output](#streamtext-with-output)

---
url: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
title: "AI SDK Core: Tool Calling"
description: "Learn about tool calling and multi-step calls (using stopWhen) with AI SDK Core."
hash: "dee57cfb3df7fef0b94e22ce741c59f664483880fdef43d65d6ebb170e12f100"
crawledAt: 2026-03-07T07:59:49.249Z
depth: 2
---

As covered under Foundations, [tools](https://ai-sdk.dev/docs/foundations/tools) are objects that can be called by the model to perform a specific task. AI SDK Core tools contain several core elements:

* **`description`**: An optional description of the tool that can influence when the tool is picked.
* **`inputSchema`**: A [Zod schema](https://ai-sdk.dev/docs/foundations/tools#schemas) or a [JSON schema](https://ai-sdk.dev/docs/reference/ai-sdk-core/json-schema) that defines the input parameters. The schema is consumed by the LLM, and also used to validate the LLM tool calls.
* **`execute`**: An optional async function that is called with the inputs from the tool call. It produces a value of type `RESULT` (generic type). It is optional because you might want to forward tool calls to the client or to a queue instead of executing them in the same process.
* **`strict`**: _(optional, boolean)_ Enables strict tool calling when supported by the provider

The `tools` parameter of `generateText` and `streamText` is an object that has the tool names as keys and the tools as values:

```
1import { z } from 'zod';2import { generateText, tool, stepCountIs } from 'ai';3
4const result = await generateText({5 model: "anthropic/claude-sonnet-4.5",6 tools: {7 weather: tool({8 description: 'Get the weather in a location',9 inputSchema: z.object({10 location: z.string().describe('The location to get the weather for'),11 }),12 execute: async ({ location }) => ({13 location,14 temperature: 72 + Math.floor(Math.random() * 21) - 10,15 }),16 }),17 },18 stopWhen: stepCountIs(5),19 prompt: 'What is the weather in San Francisco?',20});
```

When a model uses a tool, it is called a "tool call" and the output of the tool is called a "tool result".

Tool calling is not restricted to only text generation. You can also use it to render user interfaces (Generative UI).

## [Strict Mode](#strict-mode)

When enabled, language model providers that support strict tool calling will only generate tool calls that are valid according to your defined `inputSchema`. This increases the reliability of tool calling. However, not all schemas may be supported in strict mode, and what is supported depends on the specific provider.

By default, strict mode is disabled. You can enable it per-tool by setting `strict: true`:

```
1tool({2 description: 'Get the weather in a location',3 inputSchema: z.object({4 location: z.string(),5 }),6 strict: true, // Enable strict validation for this tool7 execute: async ({ location }) => ({8 //...9 }),10});
```

Not all providers or models support strict mode. For those that do not, this option is ignored.

## [Input Examples](#input-examples)

You can specify example inputs for your tools to help guide the model on how input data should be structured. When supported by providers, input examples can help when JSON schema itself does not fully specify the intended usage or when there are optional values.

```
1tool({2 description: 'Get the weather in a location',3 inputSchema: z.object({4 location: z.string().describe('The location to get the weather for'),5 }),6 inputExamples: [7 { input: { location: 'San Francisco' } },8 { input: { location: 'London' } },9 ],10 execute: async ({ location }) => {11 //...12 },13});
```

Only the Anthropic providers supports tool input examples natively. Other providers ignore the setting.

## [Tool Execution Approval](#tool-execution-approval)

By default, tools with an `execute` function run automatically as the model calls them. You can require approval before execution by setting `needsApproval`:

```
1import { tool } from 'ai';2import { z } from 'zod';3
4const runCommand = tool({5 description: 'Run a shell command',6 inputSchema: z.object({7 command: z.string().describe('The shell command to execute'),8 }),9 needsApproval: true,10 execute: async ({ command }) => {11 // your command execution logic here12 },13});
```

This is useful for tools that perform sensitive operations like executing commands, processing payments, modifying data, and more potentially dangerous actions.

### [How It Works](#how-it-works)

When a tool requires approval, `generateText` and `streamText` don't pause execution. Instead, they complete and return `tool-approval-request` parts in the result content. This means the approval flow requires two calls to the model: the first returns the approval request, and the second (after receiving the approval response) either executes the tool or informs the model that approval was denied.

Here's the complete flow:

1. Call `generateText` with a tool that has `needsApproval: true`
2. Model generates a tool call
3. `generateText` returns with `tool-approval-request` parts in `result.content`
4. Your app requests an approval and collects the user's decision
5. Add a `tool-approval-response` to the messages array
6. Call `generateText` again with the updated messages
7. If approved, the tool runs and returns a result. If denied, the model sees the denial and responds accordingly.

### [Handling Approval Requests](#handling-approval-requests)

After calling `generateText` or `streamText`, check `result.content` for `tool-approval-request` parts:

```
1import { type ModelMessage, generateText } from 'ai';2
3const messages: ModelMessage[] = [4 { role: 'user', content: 'Remove the most recent file' },5];6const result = await generateText({7 model: "anthropic/claude-sonnet-4.5",8 tools: { runCommand },9 messages,10});11
12messages.push(...result.response.messages);13
14for (const part of result.content) {15 if (part.type === 'tool-approval-request') {16 console.log(part.approvalId); // Unique ID for this approval request17 console.log(part.toolCall); // Contains toolName, input, etc.18 }19}
```

To respond, create a `tool-approval-response` and add it to your messages:

```
1import { type ToolApprovalResponse } from 'ai';2
3const approvals: ToolApprovalResponse[] = [];4
5for (const part of result.content) {6 if (part.type === 'tool-approval-request') {7 const response: ToolApprovalResponse = {8 type: 'tool-approval-response',9 approvalId: part.approvalId,10 approved: true, // or false to deny11 reason: 'User confirmed the command', // Optional context for the model12 };13 approvals.push(response);14 }15}16
17// add approvals to messages18messages.push({ role: 'tool', content: approvals });
```

Then call `generateText` again with the updated messages. If approved, the tool executes. If denied, the model receives the denial and can respond accordingly.

When a tool execution is denied, consider adding a system instruction like "When a tool execution is not approved, do not retry it" to prevent the model from attempting the same call again.

### [Dynamic Approval](#dynamic-approval)

You can make approval decisions based on tool input by providing an async function:

```
1const paymentTool = tool({2 description: 'Process a payment',3 inputSchema: z.object({4 amount: z.number(),5 recipient: z.string(),6 }),7 needsApproval: async ({ amount }) => amount > 1000,8 execute: async ({ amount, recipient }) => {9 return await processPayment(amount, recipient);10 },11});
```

In this example, only transactions over $1000 require approval. Smaller transactions execute automatically.

### [Tool Execution Approval with useChat](#tool-execution-approval-with-usechat)

When using `useChat`, the approval flow is handled through UI state. See [Chatbot Tool Usage](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage#tool-execution-approval) for details on handling approvals in your UI with `addToolApprovalResponse`.

## [Multi-Step Calls (using stopWhen)](#multi-step-calls-using-stopwhen)

With the `stopWhen` setting, you can enable multi-step calls in `generateText` and `streamText`. When `stopWhen` is set and the model generates a tool call, the AI SDK will trigger a new generation passing in the tool result until there are no further tool calls or the stopping condition is met.

The `stopWhen` conditions are only evaluated when the last step contains tool results.

By default, when you use `generateText` or `streamText`, it triggers a single generation. This works well for many use cases where you can rely on the model's training data to generate a response. However, when you provide tools, the model now has the choice to either generate a normal text response, or generate a tool call. If the model generates a tool call, its generation is complete and that step is finished.

You may want the model to generate text after the tool has been executed, either to summarize the tool results in the context of the users query. In many cases, you may also want the model to use multiple tools in a single response. This is where multi-step calls come in.

You can think of multi-step calls in a similar way to a conversation with a human. When you ask a question, if the person does not have the requisite knowledge in their common knowledge (a model's training data), the person may need to look up information (use a tool) before they can provide you with an answer. In the same way, the model may need to call a tool to get the information it needs to answer your question where each generation (tool call or text generation) is a step.

### [Example](#example)

In the following example, there are two steps:

1. **Step 1**
 1. The prompt `'What is the weather in San Francisco?'` is sent to the model.
 2. The model generates a tool call.
 3. The tool call is executed.
2. **Step 2**
 1. The tool result is sent to the model.
 2. The model generates a response considering the tool result.

```
1import { z } from 'zod';2import { generateText, tool, stepCountIs } from 'ai';3
4const { text, steps } = await generateText({5 model: "anthropic/claude-sonnet-4.5",6 tools: {7 weather: tool({8 description: 'Get the weather in a location',9 inputSchema: z.object({10 location: z.string().describe('The location to get the weather for'),11 }),12 execute: async ({ location }) => ({13 location,14 temperature: 72 + Math.floor(Math.random() * 21) - 10,15 }),16 }),17 },18 stopWhen: stepCountIs(5), // stop after a maximum of 5 steps if tools were called19 prompt: 'What is the weather in San Francisco?',20});
```

You can use `streamText` in a similar way.

### [Steps](#steps)

To access intermediate tool calls and results, you can use the `steps` property in the result object or the `streamText` `onFinish` callback. It contains all the text, tool calls, tool results, and more from each step.

```
1import { generateText } from 'ai';2
3const { steps } = await generateText({4 model: "anthropic/claude-sonnet-4.5",5 stopWhen: stepCountIs(10),6 //...7});8
9// extract all tool calls from the steps:10const allToolCalls = steps.flatMap(step => step.toolCalls);
```

### [`onStepFinish` callback](#onstepfinish-callback)

When using `generateText` or `streamText`, you can provide an `onStepFinish` callback that is triggered when a step is finished, i.e. all text deltas, tool calls, and tool results for the step are available. When you have multiple steps, the callback is triggered for each step.

The callback receives a `stepNumber` (zero-based) to identify which step just completed:

```
1import { generateText } from 'ai';2
3const result = await generateText({4 //...5 onStepFinish({6 stepNumber,7 text,8 toolCalls,9 toolResults,10 finishReason,11 usage,12 }) {13 console.log(`Step ${stepNumber} finished (${finishReason})`);14 // your own logic, e.g. for saving the chat history or recording usage15 },16});
```

### [Tool execution lifecycle callbacks](#tool-execution-lifecycle-callbacks)

You can use `experimental_onToolCallStart` and `experimental_onToolCallFinish` to observe tool execution. These callbacks are called right before and after each tool's `execute` function, giving you visibility into tool execution timing, inputs, outputs, and errors:

```
1import { generateText } from 'ai';2
3const result = await generateText({4 //... model, tools, prompt5 experimental_onToolCallStart({ toolName, toolCallId, input }) {6 console.log(`Calling tool: ${toolName}`, { toolCallId, input });7 },8 experimental_onToolCallFinish({9 toolName,10 toolCallId,11 output,12 error,13 durationMs,14 }) {15 if (error) {16 console.error(`Tool ${toolName} failed after ${durationMs}ms:`, error);17 } else {18 console.log(`Tool ${toolName} completed in ${durationMs}ms`, { output });19 }20 },21});
```

Errors thrown inside these callbacks are silently caught and do not break the generation flow.

### [`prepareStep` callback](#preparestep-callback)

The `prepareStep` callback is called before a step is started.

It is called with the following parameters:

* `model`: The model that was passed into `generateText`.
* `stopWhen`: The stopping condition that was passed into `generateText`.
* `stepNumber`: The number of the step that is being executed.
* `steps`: The steps that have been executed so far.
* `messages`: The messages that will be sent to the model for the current step.
* `experimental_context`: The context passed via the `experimental_context` setting (experimental).

You can use it to provide different settings for a step, including modifying the input messages.

```
1import { generateText } from 'ai';2
3const result = await generateText({4 //...5 prepareStep: async ({ model, stepNumber, steps, messages }) => {6 if (stepNumber === 0) {7 return {8 // use a different model for this step:9 model: modelForThisParticularStep,10 // force a tool choice for this step:11 toolChoice: { type: 'tool', toolName: 'tool1' },12 // limit the tools that are available for this step:13 activeTools: ['tool1'],14 };15 }16
17 // when nothing is returned, the default settings are used18 },19});
```

#### [Message Modification for Longer Agentic Loops](#message-modification-for-longer-agentic-loops)

In longer agentic loops, you can use the `messages` parameter to modify the input messages for each step. This is particularly useful for prompt compression:

```
1prepareStep: async ({ stepNumber, steps, messages }) => {2 // Compress conversation history for longer loops3 if (messages.length > 20) {4 return {5 messages: messages.slice(-10),6 };7 }8
9 return {};10},
```

#### [Provider Options for Step Configuration](#provider-options-for-step-configuration)

You can use `providerOptions` in `prepareStep` to pass provider-specific configuration for each step. This is useful for features like Anthropic's code execution container persistence:

```
1import { forwardAnthropicContainerIdFromLastStep } from '@ai-sdk/anthropic';2
3// Propagate container ID from previous step for code execution continuity4prepareStep: forwardAnthropicContainerIdFromLastStep,
```

## [Response Messages](#response-messages)

Adding the generated assistant and tool messages to your conversation history is a common task, especially if you are using multi-step tool calls.

Both `generateText` and `streamText` have a `response.messages` property that you can use to add the assistant and tool messages to your conversation history. It is also available in the `onFinish` callback of `streamText`.

The `response.messages` property contains an array of `ModelMessage` objects that you can add to your conversation history:

```
1import { generateText, ModelMessage } from 'ai';2
3const messages: ModelMessage[] = [4 //...5];6
7const { response } = await generateText({8 //...9 messages,10});11
12// add the response messages to your conversation history:13messages.push(...response.messages); // streamText:...((await response).messages)
```

## [Dynamic Tools](#dynamic-tools)

AI SDK Core supports dynamic tools for scenarios where tool schemas are not known at compile time. This is useful for:

* MCP (Model Context Protocol) tools without schemas
* User-defined functions at runtime
* Tools loaded from external sources

### [Using dynamicTool](#using-dynamictool)

The `dynamicTool` helper creates tools with unknown input/output types:

```
1import { dynamicTool } from 'ai';2import { z } from 'zod';3
4const customTool = dynamicTool({5 description: 'Execute a custom function',6 inputSchema: z.object({}),7 execute: async input => {8 // input is typed as 'unknown'9 // You need to validate/cast it at runtime10 const { action, parameters } = input as any;11
12 // Execute your dynamic logic13 return { result: `Executed ${action}` };14 },15});
```

### [Type-Safe Handling](#type-safe-handling)

When using both static and dynamic tools, use the `dynamic` flag for type narrowing:

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 tools: {4 // Static tool with known types5 weather: weatherTool,6 // Dynamic tool7 custom: dynamicTool({8 /*... */9 }),10 },11 onStepFinish: ({ toolCalls, toolResults }) => {12 // Type-safe iteration13 for (const toolCall of toolCalls) {14 if (toolCall.dynamic) {15 // Dynamic tool: input is 'unknown'16 console.log('Dynamic:', toolCall.toolName, toolCall.input);17 continue;18 }19
20 // Static tool: full type inference21 switch (toolCall.toolName) {22 case 'weather':23 console.log(toolCall.input.location); // typed as string24 break;25 }26 }27 },28});
```

## [Preliminary Tool Results](#preliminary-tool-results)

You can return an `AsyncIterable` over multiple results. In this case, the last value from the iterable is the final tool result.

This can be used in combination with generator functions to e.g. stream status information during the tool execution:

```
1tool({2 description: 'Get the current weather.',3 inputSchema: z.object({4 location: z.string(),5 }),6 async *execute({ location }) {7 yield {8 status: 'loading' as const,9 text: `Getting weather for ${location}`,10 weather: undefined,11 };12
13 await new Promise(resolve => setTimeout(resolve, 3000));14
15 const temperature = 72 + Math.floor(Math.random() * 21) - 10;16
17 yield {18 status: 'success' as const,19 text: `The weather in ${location} is ${temperature}°F`,20 temperature,21 };22 },23});
```

## [Tool Choice](#tool-choice)

You can use the `toolChoice` setting to influence when a tool is selected. It supports the following settings:

* `auto` (default): the model can choose whether and which tools to call.
* `required`: the model must call a tool. It can choose which tool to call.
* `none`: the model must not call tools
* `{ type: 'tool', toolName: string (typed) }`: the model must call the specified tool

```
1import { z } from 'zod';2import { generateText, tool } from 'ai';3
4const result = await generateText({5 model: "anthropic/claude-sonnet-4.5",6 tools: {7 weather: tool({8 description: 'Get the weather in a location',9 inputSchema: z.object({10 location: z.string().describe('The location to get the weather for'),11 }),12 execute: async ({ location }) => ({13 location,14 temperature: 72 + Math.floor(Math.random() * 21) - 10,15 }),16 }),17 },18 toolChoice: 'required', // force the model to call a tool19 prompt: 'What is the weather in San Francisco?',20});
```

## [Tool Execution Options](#tool-execution-options)

When tools are called, they receive additional options as a second parameter.

### [Tool Call ID](#tool-call-id)

The ID of the tool call is forwarded to the tool execution. You can use it e.g. when sending tool-call related information with stream data.

```
1import {2 streamText,3 tool,4 createUIMessageStream,5 createUIMessageStreamResponse,6} from 'ai';7
8export async function POST(req: Request) {9 const { messages } = await req.json();10
11 const stream = createUIMessageStream({12 execute: ({ writer }) => {13 const result = streamText({14 //...15 messages,16 tools: {17 myTool: tool({18 //...19 execute: async (args, { toolCallId }) => {20 // return e.g. custom status for tool call21 writer.write({22 type: 'data-tool-status',23 id: toolCallId,24 data: {25 name: 'myTool',26 status: 'in-progress',27 },28 });29 //...30 },31 }),32 },33 });34
35 writer.merge(result.toUIMessageStream());36 },37 });38
39 return createUIMessageStreamResponse({ stream });40}
```

### [Messages](#messages)

The messages that were sent to the language model to initiate the response that contained the tool call are forwarded to the tool execution. You can access them in the second parameter of the `execute` function. In multi-step calls, the messages contain the text, tool calls, and tool results from all previous steps.

```
1import { generateText, tool } from 'ai';2
3const result = await generateText({4 //...5 tools: {6 myTool: tool({7 //...8 execute: async (args, { messages }) => {9 // use the message history in e.g. calls to other language models10 return {... };11 },12 }),13 },14});
```

### [Abort Signals](#abort-signals)

The abort signals from `generateText` and `streamText` are forwarded to the tool execution. You can access them in the second parameter of the `execute` function and e.g. abort long-running computations or forward them to fetch calls inside tools.

```
1import { z } from 'zod';2import { generateText, tool } from 'ai';3
4const result = await generateText({5 model: "anthropic/claude-sonnet-4.5",6 abortSignal: myAbortSignal, // signal that will be forwarded to tools7 tools: {8 weather: tool({9 description: 'Get the weather in a location',10 inputSchema: z.object({ location: z.string() }),11 execute: async ({ location }, { abortSignal }) => {12 return fetch(13 `https://api.weatherapi.com/v1/current.json?q=${location}`,14 { signal: abortSignal }, // forward the abort signal to fetch15 );16 },17 }),18 },19 prompt: 'What is the weather in San Francisco?',20});
```

### [Context (experimental)](#context-experimental)

You can pass in arbitrary context from `generateText` or `streamText` via the `experimental_context` setting. This context is available in the `experimental_context` tool execution option.

```
1const result = await generateText({2 //...3 tools: {4 someTool: tool({5 //...6 execute: async (input, { experimental_context: context }) => {7 const typedContext = context as { example: string }; // or use type validation library8 //...9 },10 }),11 },12 experimental_context: { example: '123' },13});
```

## [Tool Input Lifecycle Hooks](#tool-input-lifecycle-hooks)

The following tool input lifecycle hooks are available:

* **`onInputStart`**: Called when the model starts generating the input (arguments) for the tool call
* **`onInputDelta`**: Called for each chunk of text as the input is streamed
* **`onInputAvailable`**: Called when the complete input is available and validated

`onInputStart` and `onInputDelta` are only called in streaming contexts (when using `streamText`). They are not called when using `generateText`.

### [Example](#example-1)

```
1import { streamText, tool } from 'ai';2import { z } from 'zod';3
4const result = streamText({5 model: "anthropic/claude-sonnet-4.5",6 tools: {7 getWeather: tool({8 description: 'Get the weather in a location',9 inputSchema: z.object({10 location: z.string().describe('The location to get the weather for'),11 }),12 execute: async ({ location }) => ({13 temperature: 72 + Math.floor(Math.random() * 21) - 10,14 }),15 onInputStart: () => {16 console.log('Tool call starting');17 },18 onInputDelta: ({ inputTextDelta }) => {19 console.log('Received input chunk:', inputTextDelta);20 },21 onInputAvailable: ({ input }) => {22 console.log('Complete input:', input);23 },24 }),25 },26 prompt: 'What is the weather in San Francisco?',27});
```

## [Types](#types)

Modularizing your code often requires defining types to ensure type safety and reusability. To enable this, the AI SDK provides several helper types for tools, tool calls, and tool results.

You can use them to strongly type your variables, function parameters, and return types in parts of the code that are not directly related to `streamText` or `generateText`.

Each tool call is typed with `ToolCall<NAME extends string, ARGS>`, depending on the tool that has been invoked. Similarly, the tool results are typed with `ToolResult<NAME extends string, ARGS, RESULT>`.

The tools in `streamText` and `generateText` are defined as a `ToolSet`. The type inference helpers `TypedToolCall<TOOLS extends ToolSet>` and `TypedToolResult<TOOLS extends ToolSet>` can be used to extract the tool call and tool result types from the tools.

```
1import { TypedToolCall, TypedToolResult, generateText, tool } from 'ai';2import { z } from 'zod';3
4const myToolSet = {5 firstTool: tool({6 description: 'Greets the user',7 inputSchema: z.object({ name: z.string() }),8 execute: async ({ name }) => `Hello, ${name}!`,9 }),10 secondTool: tool({11 description: 'Tells the user their age',12 inputSchema: z.object({ age: z.number() }),13 execute: async ({ age }) => `You are ${age} years old!`,14 }),15};16
17type MyToolCall = TypedToolCall<typeof myToolSet>;18type MyToolResult = TypedToolResult<typeof myToolSet>;19
20async function generateSomething(prompt: string): Promise<{21 text: string;22 toolCalls: Array<MyToolCall>; // typed tool calls23 toolResults: Array<MyToolResult>; // typed tool results24}> {25 return generateText({26 model: "anthropic/claude-sonnet-4.5",27 tools: myToolSet,28 prompt,29 });30}
```

## [Handling Errors](#handling-errors)

The AI SDK has three tool-call related errors:

* [`NoSuchToolError`](https://ai-sdk.dev/docs/reference/ai-sdk-errors/ai-no-such-tool-error): the model tries to call a tool that is not defined in the tools object
* [`InvalidToolInputError`](https://ai-sdk.dev/docs/reference/ai-sdk-errors/ai-invalid-tool-input-error): the model calls a tool with inputs that do not match the tool's input schema
* [`ToolCallRepairError`](https://ai-sdk.dev/docs/reference/ai-sdk-errors/ai-tool-call-repair-error): an error that occurred during tool call repair

When tool execution fails (errors thrown by your tool's `execute` function), the AI SDK adds them as `tool-error` content parts to enable automated LLM roundtrips in multi-step scenarios.

### [`generateText`](#generatetext)

`generateText` throws errors for tool schema validation issues and other errors, and can be handled using a `try`/`catch` block. Tool execution errors appear as `tool-error` parts in the result steps:

```
1try {2 const result = await generateText({3 //...4 });5} catch (error) {6 if (NoSuchToolError.isInstance(error)) {7 // handle the no such tool error8 } else if (InvalidToolInputError.isInstance(error)) {9 // handle the invalid tool inputs error10 } else {11 // handle other errors12 }13}
```

Tool execution errors are available in the result steps:

```
1const { steps } = await generateText({2 //...3});4
5// check for tool errors in the steps6const toolErrors = steps.flatMap(step =>7 step.content.filter(part => part.type === 'tool-error'),8);9
10toolErrors.forEach(toolError => {11 console.log('Tool error:', toolError.error);12 console.log('Tool name:', toolError.toolName);13 console.log('Tool input:', toolError.input);14});
```

### [`streamText`](#streamtext)

`streamText` sends errors as part of the full stream. Tool execution errors appear as `tool-error` parts, while other errors appear as `error` parts.

When using `toUIMessageStreamResponse`, you can pass an `onError` function to extract the error message from the error part and forward it as part of the stream response:

```
1const result = streamText({2 //...3});4
5return result.toUIMessageStreamResponse({6 onError: error => {7 if (NoSuchToolError.isInstance(error)) {8 return 'The model tried to call a unknown tool.';9 } else if (InvalidToolInputError.isInstance(error)) {10 return 'The model called a tool with invalid inputs.';11 } else {12 return 'An unknown error occurred.';13 }14 },15});
```

## [Tool Call Repair](#tool-call-repair)

The tool call repair feature is experimental and may change in the future.

Language models sometimes fail to generate valid tool calls, especially when the input schema is complex or the model is smaller.

If you use multiple steps, those failed tool calls will be sent back to the LLM in the next step to give it an opportunity to fix it. However, you may want to control how invalid tool calls are repaired without requiring additional steps that pollute the message history.

You can use the `experimental_repairToolCall` function to attempt to repair the tool call with a custom function.

You can use different strategies to repair the tool call:

* Use a model with structured outputs to generate the inputs.
* Send the messages, system prompt, and tool schema to a stronger model to generate the inputs.
* Provide more specific repair instructions based on which tool was called.

### [Example: Use a model with structured outputs for repair](#example-use-a-model-with-structured-outputs-for-repair)

```
1import { openai } from '@ai-sdk/openai';2import { generateText, NoSuchToolError, Output, tool } from 'ai';3
4const result = await generateText({5 model,6 tools,7 prompt,8
9 experimental_repairToolCall: async ({10 toolCall,11 tools,12 inputSchema,13 error,14 }) => {15 if (NoSuchToolError.isInstance(error)) {16 return null; // do not attempt to fix invalid tool names17 }18
19 const tool = tools[toolCall.toolName as keyof typeof tools];20
21 const { output: repairedArgs } = await generateText({22 model: "anthropic/claude-sonnet-4.5",23 output: Output.object({ schema: tool.inputSchema }),24 prompt: [25 `The model tried to call the tool "${toolCall.toolName}"` +26 ` with the following inputs:`,27 JSON.stringify(toolCall.input),28 `The tool accepts the following schema:`,29 JSON.stringify(inputSchema(toolCall)),30 'Please fix the inputs.',31 ].join('\n'),32 });33
34 return {...toolCall, input: JSON.stringify(repairedArgs) };35 },36});
```

### [Example: Use the re-ask strategy for repair](#example-use-the-re-ask-strategy-for-repair)

```
1import { openai } from '@ai-sdk/openai';2import { generateText, NoSuchToolError, tool } from 'ai';3
4const result = await generateText({5 model,6 tools,7 prompt,8
9 experimental_repairToolCall: async ({10 toolCall,11 tools,12 error,13 messages,14 system,15 }) => {16 const result = await generateText({17 model,18 system,19 messages: [20...messages,21 {22 role: 'assistant',23 content: [24 {25 type: 'tool-call',26 toolCallId: toolCall.toolCallId,27 toolName: toolCall.toolName,28 input: toolCall.input,29 },30 ],31 },32 {33 role: 'tool' as const,34 content: [35 {36 type: 'tool-result',37 toolCallId: toolCall.toolCallId,38 toolName: toolCall.toolName,39 output: error.message,40 },41 ],42 },43 ],44 tools,45 });46
47 const newToolCall = result.toolCalls.find(48 newToolCall => newToolCall.toolName === toolCall.toolName,49 );50
51 return newToolCall != null52 ? {53 type: 'tool-call' as const,54 toolCallId: toolCall.toolCallId,55 toolName: toolCall.toolName,56 input: JSON.stringify(newToolCall.input),57 }58 : null;59 },60});
```

## [Active Tools](#active-tools)

Language models can only handle a limited number of tools at a time, depending on the model. To allow for static typing using a large number of tools and limiting the available tools to the model at the same time, the AI SDK provides the `activeTools` property.

It is an array of tool names that are currently active. By default, the value is `undefined` and all tools are active.

```
1import { openai } from '@ai-sdk/openai';2import { generateText } from 'ai';3
4const { text } = await generateText({5 model: "anthropic/claude-sonnet-4.5",6 tools: myToolSet,7 activeTools: ['firstTool'],8});
```

## [Multi-modal Tool Results](#multi-modal-tool-results)

Multi-modal tool results are experimental and only supported by Anthropic and OpenAI.

In order to send multi-modal tool results, e.g. screenshots, back to the model, they need to be converted into a specific format.

AI SDK Core tools have an optional `toModelOutput` function that converts the tool result into a content part.

Here is an example for converting a screenshot into a content part:

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 tools: {4 computer: anthropic.tools.computer_20241022({5 //...6 async execute({ action, coordinate, text }) {7 switch (action) {8 case 'screenshot': {9 return {10 type: 'image',11 data: fs12.readFileSync('./data/screenshot-editor.png')13.toString('base64'),14 };15 }16 default: {17 return `executed ${action}`;18 }19 }20 },21
22 // map to tool result content for LLM consumption:23 toModelOutput({ output }) {24 return {25 type: 'content',26 value:27 typeof output === 'string'28 ? [{ type: 'text', text: output }]29 : [{ type: 'media', data: output.data, mediaType: 'image/png' }],30 };31 },32 }),33 },34 //...35});
```

Once you start having many tools, you might want to extract them into separate files. The `tool` helper function is crucial for this, because it ensures correct type inference.

Here is an example of an extracted tool:

```
1import { tool } from 'ai';2import { z } from 'zod';3
4// the `tool` helper function ensures correct type inference:5export const weatherTool = tool({6 description: 'Get the weather in a location',7 inputSchema: z.object({8 location: z.string().describe('The location to get the weather for'),9 }),10 execute: async ({ location }) => ({11 location,12 temperature: 72 + Math.floor(Math.random() * 21) - 10,13 }),14});
```

## [MCP Tools](#mcp-tools)

The AI SDK supports connecting to Model Context Protocol (MCP) servers to access their tools. MCP enables your AI applications to discover and use tools across various services through a standardized interface.

For detailed information about MCP tools, including initialization, transport options, and usage patterns, see the [MCP Tools documentation](https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools).

### [AI SDK Tools vs MCP Tools](#ai-sdk-tools-vs-mcp-tools)

In most cases, you should define your own AI SDK tools for production applications. They provide full control, type safety, and optimal performance. MCP tools are best suited for rapid development iteration and scenarios where users bring their own tools.

| Aspect | AI SDK Tools | MCP Tools |
| --- | --- | --- |
| **Type Safety** | Full static typing end-to-end | Dynamic discovery at runtime |
| **Execution** | Same process as your request (low latency) | Separate server (network overhead) |
| **Prompt Control** | Full control over descriptions and schemas | Controlled by MCP server owner |
| **Schema Control** | You define and optimize for your model | Controlled by MCP server owner |
| **Version Management** | Full visibility over updates | Can update independently (version skew risk) |
| **Authentication** | Same process, no additional auth required | Separate server introduces additional auth complexity |
| **Best For** | Production applications requiring control and performance | Development iteration, user-provided tools |

## [Examples](#examples)

You can see tools in action using various frameworks in the following examples:

---
url: https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools
title: "AI SDK Core: Model Context Protocol (MCP)"
description: "Learn how to connect to Model Context Protocol (MCP) servers and use their tools with AI SDK Core."
hash: "70eeac6c7053a53eb0c515423ddfe85f688917254499756af26cb99edbd87c18"
crawledAt: 2026-03-07T07:59:54.684Z
depth: 2
---

The AI SDK supports connecting to [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers to access their tools, resources, and prompts. This enables your AI applications to discover and use capabilities across various services through a standardized interface.

If you're using OpenAI's Responses API, you can also use the built-in `openai.tools.mcp` tool, which provides direct MCP server integration without needing to convert tools. See the [OpenAI provider documentation](https://ai-sdk.dev/providers/ai-sdk-providers/openai#mcp-tool) for details.

## [Initializing an MCP Client](#initializing-an-mcp-client)

We recommend using HTTP transport (like `StreamableHTTPClientTransport`) for production deployments. The stdio transport should only be used for connecting to local servers as it cannot be deployed to production environments.

Create an MCP client using one of the following transport options:

* **HTTP transport (Recommended)**: Either configure HTTP directly via the client using `transport: { type: 'http',... }`, or use MCP's official TypeScript SDK `StreamableHTTPClientTransport`
* SSE (Server-Sent Events): An alternative HTTP-based transport
* `stdio`: For local development only. Uses standard input/output streams for local MCP servers

### [HTTP Transport (Recommended)](#http-transport-recommended)

For production deployments, we recommend using the HTTP transport. You can configure it directly on the client:

```
1import { createMCPClient } from '@ai-sdk/mcp';2
3const mcpClient = await createMCPClient({4 transport: {5 type: 'http',6 url: 'https://your-server.com/mcp',7
8 // optional: configure HTTP headers9 headers: { Authorization: 'Bearer my-api-key' },10
11 // optional: provide an OAuth client provider for automatic authorization12 authProvider: myOAuthClientProvider,13 },14});
```

Alternatively, you can use `StreamableHTTPClientTransport` from MCP's official TypeScript SDK:

```
1import { createMCPClient } from '@ai-sdk/mcp';2import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';3
4const url = new URL('https://your-server.com/mcp');5const mcpClient = await createMCPClient({6 transport: new StreamableHTTPClientTransport(url, {7 sessionId: 'session_123',8 }),9});
```

### [SSE Transport](#sse-transport)

SSE provides an alternative HTTP-based transport option. Configure it with a `type` and `url` property. You can also provide an `authProvider` for OAuth:

```
1import { createMCPClient } from '@ai-sdk/mcp';2
3const mcpClient = await createMCPClient({4 transport: {5 type: 'sse',6 url: 'https://my-server.com/sse',7
8 // optional: configure HTTP headers9 headers: { Authorization: 'Bearer my-api-key' },10
11 // optional: provide an OAuth client provider for automatic authorization12 authProvider: myOAuthClientProvider,13 },14});
```

### [Stdio Transport (Local Servers)](#stdio-transport-local-servers)

The stdio transport should only be used for local servers.

The Stdio transport can be imported from either the MCP SDK or the AI SDK:

```
1import { createMCPClient } from '@ai-sdk/mcp';2import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';3// Or use the AI SDK's stdio transport:4// import { Experimental_StdioMCPTransport as StdioClientTransport } from '@ai-sdk/mcp/mcp-stdio';5
6const mcpClient = await createMCPClient({7 transport: new StdioClientTransport({8 command: 'node',9 args: ['src/stdio/dist/server.js'],10 }),11});
```

### [Custom Transport](#custom-transport)

You can also bring your own transport by implementing the `MCPTransport` interface for specific requirements not covered by the standard transports.

The client returned by the `createMCPClient` function is a lightweight client intended for use in tool conversion. It currently does not support all features of the full MCP client, such as: session management, resumable streams, and receiving notifications.

Authorization via OAuth is supported when using the AI SDK MCP HTTP or SSE transports by providing an `authProvider`.

### [Closing the MCP Client](#closing-the-mcp-client)

After initialization, you should close the MCP client based on your usage pattern:

* For short-lived usage (e.g., single requests), close the client when the response is finished
* For long-running clients (e.g., command line apps), keep the client open but ensure it's closed when the application terminates

When streaming responses, you can close the client when the LLM response has finished. For example, when using `streamText`, you should use the `onFinish` callback:

```
1const mcpClient = await createMCPClient({2 //...3});4
5const tools = await mcpClient.tools();6
7const result = await streamText({8 model: "anthropic/claude-sonnet-4.5",9 tools,10 prompt: 'What is the weather in Brooklyn, New York?',11 onFinish: async () => {12 await mcpClient.close();13 },14});
```

When generating responses without streaming, you can use try/finally or cleanup functions in your framework:

```
1import { createMCPClient, type MCPClient } from '@ai-sdk/mcp';2
3let mcpClient: MCPClient | undefined;4
5try {6 mcpClient = await createMCPClient({7 //...8 });9} finally {10 await mcpClient?.close();11}
```

## [Using MCP Tools](#using-mcp-tools)

The client's `tools` method acts as an adapter between MCP tools and AI SDK tools. It supports two approaches for working with tool schemas:

### [Schema Discovery](#schema-discovery)

With schema discovery, all tools offered by the server are automatically listed, and input parameter types are inferred based on the schemas provided by the server:

```
1const tools = await mcpClient.tools();
```

This approach is simpler to implement and automatically stays in sync with server changes. However, you won't have TypeScript type safety during development, and all tools from the server will be loaded

### [Schema Definition](#schema-definition)

For better type safety and control, you can define the tools and their input schemas explicitly in your client code:

```
1import { z } from 'zod';2
3const tools = await mcpClient.tools({4 schemas: {5 'get-data': {6 inputSchema: z.object({7 query: z.string().describe('The data query'),8 format: z.enum(['json', 'text']).optional(),9 }),10 },11 // For tools with zero inputs, you should use an empty object:12 'tool-with-no-args': {13 inputSchema: z.object({}),14 },15 },16});
```

This approach provides full TypeScript type safety and IDE autocompletion, letting you catch parameter mismatches during development. When you define `schemas`, the client only pulls the explicitly defined tools, keeping your application focused on the tools it needs

### [Typed Tool Outputs](#typed-tool-outputs)

When MCP servers return `structuredContent` (per the [MCP specification](https://modelcontextprotocol.io/specification/2025-06-18/server/tools#structured-content)), you can define an `outputSchema` to get typed tool results:

```
1import { z } from 'zod';2
3const tools = await mcpClient.tools({4 schemas: {5 'get-weather': {6 inputSchema: z.object({7 location: z.string(),8 }),9 // Define outputSchema for typed results10 outputSchema: z.object({11 temperature: z.number(),12 conditions: z.string(),13 humidity: z.number(),14 }),15 },16 },17});18
19const result = await tools['get-weather'].execute(20 { location: 'New York' },21 { messages: [], toolCallId: 'weather-1' },22);23
24console.log(`Temperature: ${result.temperature}°C`);
```

When `outputSchema` is provided:

* The client extracts `structuredContent` from the tool result
* The output is validated against your schema at runtime
* You get full TypeScript type safety for the result

If the server doesn't return `structuredContent`, the client falls back to parsing JSON from the text content. If neither is available or validation fails, an error is thrown.

Without `outputSchema`, the tool returns the raw `CallToolResult` object containing `content` and optional `isError` fields.

## [Using MCP Resources](#using-mcp-resources)

According to the [MCP specification](https://modelcontextprotocol.io/docs/learn/server-concepts#resources), resources are **application-driven** data sources that provide context to the model. Unlike tools (which are model-controlled), your application decides when to fetch and pass resources as context.

The MCP client provides three methods for working with resources:

### [Listing Resources](#listing-resources)

List all available resources from the MCP server:

```
1const resources = await mcpClient.listResources();
```

### [Reading Resource Contents](#reading-resource-contents)

Read the contents of a specific resource by its URI:

```
1const resourceData = await mcpClient.readResource({2 uri: 'file:///example/document.txt',3});
```

### [Listing Resource Templates](#listing-resource-templates)

Resource templates are dynamic URI patterns that allow flexible queries. List all available templates:

```
1const templates = await mcpClient.listResourceTemplates();
```

## [Using MCP Prompts](#using-mcp-prompts)

MCP Prompts is an experimental feature and may change in the future.

According to the MCP specification, prompts are user-controlled templates that servers expose for clients to list and retrieve with optional arguments.

### [Listing Prompts](#listing-prompts)

```
1const prompts = await mcpClient.experimental_listPrompts();
```

### [Getting a Prompt](#getting-a-prompt)

Retrieve prompt messages, optionally passing arguments defined by the server:

```
1const prompt = await mcpClient.experimental_getPrompt({2 name: 'code_review',3 arguments: { code: 'function add(a, b) { return a + b; }' },4});
```

## [Handling Elicitation Requests](#handling-elicitation-requests)

Elicitation is a mechanism where MCP servers can request additional information from the client during tool execution. For example, a server might need user input to complete a registration form or confirmation for a sensitive operation.

It is up to the client application to handle elicitation requests properly. The MCP client simply surfaces these requests from the server to your application code.

### [Enabling Elicitation Support](#enabling-elicitation-support)

To enable elicitation, you need to advertise the capability when creating the MCP client:

```
1const mcpClient = await createMCPClient({2 transport: {3 type: 'sse',4 url: 'https://your-server.com/sse',5 },6 capabilities: {7 elicitation: {},8 },9});
```

### [Registering an Elicitation Handler](#registering-an-elicitation-handler)

Use the `onElicitationRequest` method to register a handler that will be called when the server requests input:

```
1import { ElicitationRequestSchema } from '@ai-sdk/mcp';2
3mcpClient.onElicitationRequest(ElicitationRequestSchema, async request => {4 // request.params.message: A message describing what input is needed5 // request.params.requestedSchema: JSON schema defining the expected input structure6
7 // Get input from the user (implement according to your application's needs)8 const userInput = await getInputFromUser(9 request.params.message,10 request.params.requestedSchema,11 );12
13 // Return the result with one of three actions:14 return {15 action: 'accept', // or 'decline' or 'cancel'16 content: userInput, // only required when action is 'accept'17 };18});
```

### [Elicitation Response Actions](#elicitation-response-actions)

Your handler must return an object with an `action` field that can be one of:

* `'accept'`: User provided the requested information. Must include `content` with the data.
* `'decline'`: User chose not to provide the information.
* `'cancel'`: User cancelled the operation entirely.

## [Examples](#examples)

You can see MCP in action in the following examples:

---
url: https://ai-sdk.dev/docs/ai-sdk-core/prompt-engineering
title: "AI SDK Core: Prompt Engineering"
description: "Learn how to develop prompts with AI SDK Core."
hash: "5551d2e5bbe9bb9ed4e3b11c2d7cee5bb47b710ac27066f6b03d0178bdffaa4b"
crawledAt: 2026-03-07T07:59:59.970Z
depth: 2
---

## [Tips](#tips)

### [Prompts for Tools](#prompts-for-tools)

When you create prompts that include tools, getting good results can be tricky as the number and complexity of your tools increases.

Here are a few tips to help you get the best results:

1. Use a model that is strong at tool calling, such as `gpt-5` or `gpt-4.1`. Weaker models will often struggle to call tools effectively and flawlessly.
2. Keep the number of tools low, e.g. to 5 or less.
3. Keep the complexity of the tool parameters low. Complex Zod schemas with many nested and optional elements, unions, etc. can be challenging for the model to work with.
4. Use semantically meaningful names for your tools, parameters, parameter properties, etc. The more information you pass to the model, the better it can understand what you want.
5. Add `.describe("...")` to your Zod schema properties to give the model hints about what a particular property is for.
6. When the output of a tool might be unclear to the model and there are dependencies between tools, use the `description` field of a tool to provide information about the output of the tool execution.
7. You can include example input/outputs of tool calls in your prompt to help the model understand how to use the tools. Keep in mind that the tools work with JSON objects, so the examples should use JSON.

In general, the goal should be to give the model all information it needs in a clear way.

### [Tool & Structured Data Schemas](#tool--structured-data-schemas)

The mapping from Zod schemas to LLM inputs (typically JSON schema) is not always straightforward, since the mapping is not one-to-one.

#### [Zod Dates](#zod-dates)

Zod expects JavaScript Date objects, but models return dates as strings. You can specify and validate the date format using `z.string().datetime()` or `z.string().date()`, and then use a Zod transformer to convert the string to a Date object.

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 output: Output.object({4 schema: z.object({5 events: z.array(6 z.object({7 event: z.string(),8 date: z9.string()10.date()11.transform(value => new Date(value)),12 }),13 ),14 }),15 }),16 prompt: 'List 5 important events from the year 2000.',17});
```

#### [Optional Parameters](#optional-parameters)

When working with tools that have optional parameters, you may encounter compatibility issues with certain providers that use strict schema validation.

This is particularly relevant for OpenAI models with structured outputs (strict mode).

For maximum compatibility, optional parameters should use `.nullable()` instead of `.optional()`:

```
1// This may fail with strict schema validation2const failingTool = tool({3 description: 'Execute a command',4 inputSchema: z.object({5 command: z.string(),6 workdir: z.string().optional(), // This can cause errors7 timeout: z.string().optional(),8 }),9});10
11// This works with strict schema validation12const workingTool = tool({13 description: 'Execute a command',14 inputSchema: z.object({15 command: z.string(),16 workdir: z.string().nullable(), // Use nullable instead17 timeout: z.string().nullable(),18 }),19});
```

#### [Temperature Settings](#temperature-settings)

For tool calls and object generation, it's recommended to use `temperature: 0` to ensure deterministic and consistent results:

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 temperature: 0, // Recommended for tool calls4 tools: {5 myTool: tool({6 description: 'Execute a command',7 inputSchema: z.object({8 command: z.string(),9 }),10 }),11 },12 prompt: 'Execute the ls command',13});
```

Lower temperature values reduce randomness in model outputs, which is particularly important when the model needs to:

* Generate structured data with specific formats
* Make precise tool calls with correct parameters
* Follow strict schemas consistently

## [Debugging](#debugging)

### [Inspecting Warnings](#inspecting-warnings)

Not all providers support all AI SDK features. Providers either throw exceptions or return warnings when they do not support a feature. To check if your prompt, tools, and settings are handled correctly by the provider, you can check the call warnings:

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 prompt: 'Hello, world!',4});5
6console.log(result.warnings);
```

### [HTTP Request Bodies](#http-request-bodies)

You can inspect the raw HTTP request bodies for models that expose them, e.g. [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai). This allows you to inspect the exact payload that is sent to the model provider in the provider-specific way.

Request bodies are available via the `request.body` property of the response:

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 prompt: 'Hello, world!',4});5
6console.log(result.request.body);
```

---
url: https://ai-sdk.dev/docs/ai-sdk-core/settings
title: "AI SDK Core: Settings"
description: "Learn how to configure the AI SDK."
hash: "ecf7f336e83129ee41bfda4de90635e433869cbce45741ea97fe7ca1d082ac6c"
crawledAt: 2026-03-07T08:00:05.391Z
depth: 2
---

Large language models (LLMs) typically provide settings to augment their output.

All AI SDK functions support the following common settings in addition to the model, the [prompt](https://ai-sdk.dev/docs/ai-sdk-core/prompts), and additional provider-specific settings:

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 maxOutputTokens: 512,4 temperature: 0.3,5 maxRetries: 5,6 prompt: 'Invent a new holiday and describe its traditions.',7});
```

Some providers do not support all common settings. If you use a setting with a provider that does not support it, a warning will be generated. You can check the `warnings` property in the result object to see if any warnings were generated.

### [`maxOutputTokens`](#maxoutputtokens)

Maximum number of tokens to generate.

### [`temperature`](#temperature)

Temperature setting.

The value is passed through to the provider. The range depends on the provider and model. For most providers, `0` means almost deterministic results, and higher values mean more randomness.

It is recommended to set either `temperature` or `topP`, but not both.

In AI SDK 5.0, temperature is no longer set to `0` by default.

### [`topP`](#topp)

Nucleus sampling.

The value is passed through to the provider. The range depends on the provider and model. For most providers, nucleus sampling is a number between 0 and 1. E.g. 0.1 would mean that only tokens with the top 10% probability mass are considered.

It is recommended to set either `temperature` or `topP`, but not both.

### [`topK`](#topk)

Only sample from the top K options for each subsequent token.

Used to remove "long tail" low probability responses. Recommended for advanced use cases only. You usually only need to use `temperature`.

### [`presencePenalty`](#presencepenalty)

The presence penalty affects the likelihood of the model to repeat information that is already in the prompt.

The value is passed through to the provider. The range depends on the provider and model. For most providers, `0` means no penalty.

### [`frequencyPenalty`](#frequencypenalty)

The frequency penalty affects the likelihood of the model to repeatedly use the same words or phrases.

The value is passed through to the provider. The range depends on the provider and model. For most providers, `0` means no penalty.

### [`stopSequences`](#stopsequences)

The stop sequences to use for stopping the text generation.

If set, the model will stop generating text when one of the stop sequences is generated. Providers may have limits on the number of stop sequences.

### [`seed`](#seed)

It is the seed (integer) to use for random sampling. If set and supported by the model, calls will generate deterministic results.

### [`maxRetries`](#maxretries)

Maximum number of retries. Set to 0 to disable retries. Default: `2`.

### [`abortSignal`](#abortsignal)

An optional abort signal that can be used to cancel the call.

The abort signal can e.g. be forwarded from a user interface to cancel the call, or to define a timeout using `AbortSignal.timeout`.

#### [Example: AbortSignal.timeout](#example-abortsignaltimeout)

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 prompt: 'Invent a new holiday and describe its traditions.',4 abortSignal: AbortSignal.timeout(5000), // 5 seconds5});
```

### [`timeout`](#timeout)

An optional timeout in milliseconds. The call will be aborted if it takes longer than the specified duration.

This is a convenience parameter that creates an abort signal internally. It can be used alongside `abortSignal` - if both are provided, the call will abort when either condition is met.

You can specify the timeout either as a number (milliseconds) or as an object with `totalMs`, `stepMs`, and/or `chunkMs` properties:

* `totalMs`: The total timeout for the entire call including all steps.
* `stepMs`: The timeout for each individual step (LLM call). This is useful for multi-step generations where you want to limit the time spent on each step independently.
* `chunkMs`: The timeout between stream chunks (streaming only). The call will abort if no new chunk is received within this duration. This is useful for detecting stalled streams.

#### [Example: 5 second timeout (number format)](#example-5-second-timeout-number-format)

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 prompt: 'Invent a new holiday and describe its traditions.',4 timeout: 5000, // 5 seconds5});
```

#### [Example: 5 second total timeout (object format)](#example-5-second-total-timeout-object-format)

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 prompt: 'Invent a new holiday and describe its traditions.',4 timeout: { totalMs: 5000 }, // 5 seconds5});
```

#### [Example: 10 second step timeout](#example-10-second-step-timeout)

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 prompt: 'Invent a new holiday and describe its traditions.',4 timeout: { stepMs: 10000 }, // 10 seconds per step5});
```

#### [Example: Combined total and step timeout](#example-combined-total-and-step-timeout)

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 prompt: 'Invent a new holiday and describe its traditions.',4 timeout: {5 totalMs: 60000, // 60 seconds total6 stepMs: 10000, // 10 seconds per step7 },8});
```

#### [Example: Per-chunk timeout for streaming (streamText only)](#example-per-chunk-timeout-for-streaming-streamtext-only)

```
1const result = streamText({2 model: "anthropic/claude-sonnet-4.5",3 prompt: 'Invent a new holiday and describe its traditions.',4 timeout: { chunkMs: 5000 }, // abort if no chunk received for 5 seconds5});
```

Additional HTTP headers to be sent with the request. Only applicable for HTTP-based providers.

You can use the request headers to provide additional information to the provider, depending on what the provider supports. For example, some observability providers support headers such as `Prompt-Id`.

```
1import { generateText } from 'ai';2
3const result = await generateText({4 model: "anthropic/claude-sonnet-4.5",5 prompt: 'Invent a new holiday and describe its traditions.',6 headers: {7 'Prompt-Id': 'my-prompt-id',8 },9});
```

The `headers` setting is for request-specific headers. You can also set `headers` in the provider configuration. These headers will be sent with every request made by the provider.

---
url: https://ai-sdk.dev/docs/ai-sdk-core/embeddings
title: "AI SDK Core: Embeddings"
description: "Learn how to embed values with the AI SDK."
hash: "7c3fe5791d09588ba4f623cfa9818429acae9f390689fd9a6101eabec833b715"
crawledAt: 2026-03-07T08:00:10.768Z
depth: 2
---

Embeddings are a way to represent words, phrases, or images as vectors in a high-dimensional space. In this space, similar words are close to each other, and the distance between words can be used to measure their similarity.

## [Embedding a Single Value](#embedding-a-single-value)

The AI SDK provides the [`embed`](https://ai-sdk.dev/docs/reference/ai-sdk-core/embed) function to embed single values, which is useful for tasks such as finding similar words or phrases or clustering text. You can use it with embeddings models, e.g. `openai.embeddingModel('text-embedding-3-large')` or `mistral.embeddingModel('mistral-embed')`.

```
1import { embed } from 'ai';2import { openai } from '@ai-sdk/openai';3
4// 'embedding' is a single embedding object (number[])5const { embedding } = await embed({6 model: 'openai/text-embedding-3-small',7 value: 'sunny day at the beach',8});
```

## [Embedding Many Values](#embedding-many-values)

When loading data, e.g. when preparing a data store for retrieval-augmented generation (RAG), it is often useful to embed many values at once (batch embedding).

The AI SDK provides the [`embedMany`](https://ai-sdk.dev/docs/reference/ai-sdk-core/embed-many) function for this purpose. Similar to `embed`, you can use it with embeddings models, e.g. `openai.embeddingModel('text-embedding-3-large')` or `mistral.embeddingModel('mistral-embed')`.

```
1import { openai } from '@ai-sdk/openai';2import { embedMany } from 'ai';3
4// 'embeddings' is an array of embedding objects (number[][]).5// It is sorted in the same order as the input values.6const { embeddings } = await embedMany({7 model: 'openai/text-embedding-3-small',8 values: [9 'sunny day at the beach',10 'rainy afternoon in the city',11 'snowy night in the mountains',12 ],13});
```

## [Embedding Similarity](#embedding-similarity)

After embedding values, you can calculate the similarity between them using the [`cosineSimilarity`](https://ai-sdk.dev/docs/reference/ai-sdk-core/cosine-similarity) function. This is useful to e.g. find similar words or phrases in a dataset. You can also rank and filter related items based on their similarity.

```
1import { openai } from '@ai-sdk/openai';2import { cosineSimilarity, embedMany } from 'ai';3
4const { embeddings } = await embedMany({5 model: 'openai/text-embedding-3-small',6 values: ['sunny day at the beach', 'rainy afternoon in the city'],7});8
9console.log(10 `cosine similarity: ${cosineSimilarity(embeddings[0], embeddings[1])}`,11);
```

## [Token Usage](#token-usage)

Many providers charge based on the number of tokens used to generate embeddings. Both `embed` and `embedMany` provide token usage information in the `usage` property of the result object:

```
1import { openai } from '@ai-sdk/openai';2import { embed } from 'ai';3
4const { embedding, usage } = await embed({5 model: 'openai/text-embedding-3-small',6 value: 'sunny day at the beach',7});8
9console.log(usage); // { tokens: 10 }
```

## [Settings](#settings)

### [Provider Options](#provider-options)

Embedding model settings can be configured using `providerOptions` for provider-specific parameters:

```
1import { openai } from '@ai-sdk/openai';2import { embed } from 'ai';3
4const { embedding } = await embed({5 model: 'openai/text-embedding-3-small',6 value: 'sunny day at the beach',7 providerOptions: {8 openai: {9 dimensions: 512, // Reduce embedding dimensions10 },11 },12});
```

### [Parallel Requests](#parallel-requests)

The `embedMany` function now supports parallel processing with configurable `maxParallelCalls` to optimize performance:

```
1import { openai } from '@ai-sdk/openai';2import { embedMany } from 'ai';3
4const { embeddings, usage } = await embedMany({5 maxParallelCalls: 2, // Limit parallel requests6 model: 'openai/text-embedding-3-small',7 values: [8 'sunny day at the beach',9 'rainy afternoon in the city',10 'snowy night in the mountains',11 ],12});
```

### [Retries](#retries)

Both `embed` and `embedMany` accept an optional `maxRetries` parameter of type `number` that you can use to set the maximum number of retries for the embedding process. It defaults to `2` retries (3 attempts in total). You can set it to `0` to disable retries.

```
1import { openai } from '@ai-sdk/openai';2import { embed } from 'ai';3
4const { embedding } = await embed({5 model: 'openai/text-embedding-3-small',6 value: 'sunny day at the beach',7 maxRetries: 0, // Disable retries8});
```

### [Abort Signals and Timeouts](#abort-signals-and-timeouts)

Both `embed` and `embedMany` accept an optional `abortSignal` parameter of type [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) that you can use to abort the embedding process or set a timeout.

```
1import { openai } from '@ai-sdk/openai';2import { embed } from 'ai';3
4const { embedding } = await embed({5 model: 'openai/text-embedding-3-small',6 value: 'sunny day at the beach',7 abortSignal: AbortSignal.timeout(1000), // Abort after 1 second8});
```

Both `embed` and `embedMany` accept an optional `headers` parameter of type `Record<string, string>` that you can use to add custom headers to the embedding request.

```
1import { openai } from '@ai-sdk/openai';2import { embed } from 'ai';3
4const { embedding } = await embed({5 model: 'openai/text-embedding-3-small',6 value: 'sunny day at the beach',7 headers: { 'X-Custom-Header': 'custom-value' },8});
```

## [Response Information](#response-information)

Both `embed` and `embedMany` return response information that includes the raw provider response:

```
1import { openai } from '@ai-sdk/openai';2import { embed } from 'ai';3
4const { embedding, response } = await embed({5 model: 'openai/text-embedding-3-small',6 value: 'sunny day at the beach',7});8
9console.log(response); // Raw provider response
```

## [Embedding Middleware](#embedding-middleware)

You can enhance embedding models, e.g. to set default values, using `wrapEmbeddingModel` and `EmbeddingModelMiddleware`.

Here is an example that uses the built-in `defaultEmbeddingSettingsMiddleware`:

```
1import {2 defaultEmbeddingSettingsMiddleware,3 embed,4 wrapEmbeddingModel,5 gateway,6} from 'ai';7
8const embeddingModelWithDefaults = wrapEmbeddingModel({9 model: gateway.embeddingModel('google/gemini-embedding-001'),10 middleware: defaultEmbeddingSettingsMiddleware({11 settings: {12 providerOptions: {13 google: {14 outputDimensionality: 256,15 taskType: 'CLASSIFICATION',16 },17 },18 },19 }),20});
```

## [Embedding Providers & Models](#embedding-providers--models)

Several providers offer embedding models:

| Provider | Model | Embedding Dimensions |
| --- | --- | --- |
| [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai#embedding-models) | `text-embedding-3-large` | 3072 |
| [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai#embedding-models) | `text-embedding-3-small` | 1536 |
| [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai#embedding-models) | `text-embedding-ada-002` | 1536 |
| [Google Generative AI](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai#embedding-models) | `gemini-embedding-001` | 3072 |
| [Mistral](https://ai-sdk.dev/providers/ai-sdk-providers/mistral#embedding-models) | `mistral-embed` | 1024 |
| [Cohere](https://ai-sdk.dev/providers/ai-sdk-providers/cohere#embedding-models) | `embed-english-v3.0` | 1024 |
| [Cohere](https://ai-sdk.dev/providers/ai-sdk-providers/cohere#embedding-models) | `embed-multilingual-v3.0` | 1024 |
| [Cohere](https://ai-sdk.dev/providers/ai-sdk-providers/cohere#embedding-models) | `embed-english-light-v3.0` | 384 |
| [Cohere](https://ai-sdk.dev/providers/ai-sdk-providers/cohere#embedding-models) | `embed-multilingual-light-v3.0` | 384 |
| [Cohere](https://ai-sdk.dev/providers/ai-sdk-providers/cohere#embedding-models) | `embed-english-v2.0` | 4096 |
| [Cohere](https://ai-sdk.dev/providers/ai-sdk-providers/cohere#embedding-models) | `embed-english-light-v2.0` | 1024 |
| [Cohere](https://ai-sdk.dev/providers/ai-sdk-providers/cohere#embedding-models) | `embed-multilingual-v2.0` | 768 |
| [Amazon Bedrock](https://ai-sdk.dev/providers/ai-sdk-providers/amazon-bedrock#embedding-models) | `amazon.titan-embed-text-v1` | 1536 |
| [Amazon Bedrock](https://ai-sdk.dev/providers/ai-sdk-providers/amazon-bedrock#embedding-models) | `amazon.titan-embed-text-v2:0` | 1024 |

---
url: https://ai-sdk.dev/docs/ai-sdk-core/reranking
title: "AI SDK Core: Reranking"
description: "Learn how to rerank documents with the AI SDK."
hash: "158c89306417982ab221f4233913802d3cfd7da277a6cab8acb181c38ed85aae"
crawledAt: 2026-03-07T08:00:17.178Z
depth: 2
---

Reranking is a technique used to improve search relevance by reordering a set of documents based on their relevance to a query. Unlike embedding-based similarity search, reranking models are specifically trained to understand the relationship between queries and documents, often producing more accurate relevance scores.

## [Reranking Documents](#reranking-documents)

The AI SDK provides the [`rerank`](https://ai-sdk.dev/docs/reference/ai-sdk-core/rerank) function to rerank documents based on their relevance to a query. You can use it with reranking models, e.g. `cohere.reranking('rerank-v3.5')` or `bedrock.reranking('cohere.rerank-v3-5:0')`.

```
1import { rerank } from 'ai';2import { cohere } from '@ai-sdk/cohere';3
4const documents = [5 'sunny day at the beach',6 'rainy afternoon in the city',7 'snowy night in the mountains',8];9
10const { ranking } = await rerank({11 model: cohere.reranking('rerank-v3.5'),12 documents,13 query: 'talk about rain',14 topN: 2, // Return top 2 most relevant documents15});16
17console.log(ranking);18// [19// { originalIndex: 1, score: 0.9, document: 'rainy afternoon in the city' },20// { originalIndex: 0, score: 0.3, document: 'sunny day at the beach' }21// ]
```

## [Working with Object Documents](#working-with-object-documents)

Reranking also supports structured documents (JSON objects), making it ideal for searching through databases, emails, or other structured content:

```
1import { rerank } from 'ai';2import { cohere } from '@ai-sdk/cohere';3
4const documents = [5 {6 from: 'Paul Doe',7 subject: 'Follow-up',8 text: 'We are happy to give you a discount of 20% on your next order.',9 },10 {11 from: 'John McGill',12 subject: 'Missing Info',13 text: 'Sorry, but here is the pricing information from Oracle: $5000/month',14 },15];16
17const { ranking, rerankedDocuments } = await rerank({18 model: cohere.reranking('rerank-v3.5'),19 documents,20 query: 'Which pricing did we get from Oracle?',21 topN: 1,22});23
24console.log(rerankedDocuments[0]);25// { from: 'John McGill', subject: 'Missing Info', text: '...' }
```

## [Understanding the Results](#understanding-the-results)

The `rerank` function returns a comprehensive result object:

```
1import { cohere } from '@ai-sdk/cohere';2import { rerank } from 'ai';3
4const { ranking, rerankedDocuments, originalDocuments } = await rerank({5 model: cohere.reranking('rerank-v3.5'),6 documents: ['sunny day at the beach', 'rainy afternoon in the city'],7 query: 'talk about rain',8});9
10// ranking: sorted array of { originalIndex, score, document }11// rerankedDocuments: documents sorted by relevance (convenience property)12// originalDocuments: original documents array
```

Each item in the `ranking` array contains:

* `originalIndex`: Position in the original documents array
* `score`: Relevance score (typically 0-1, where higher is more relevant)
* `document`: The original document

## [Settings](#settings)

### [Top-N Results](#top-n-results)

Use `topN` to limit the number of results returned. This is useful for retrieving only the most relevant documents:

```
1import { cohere } from '@ai-sdk/cohere';2import { rerank } from 'ai';3
4const { ranking } = await rerank({5 model: cohere.reranking('rerank-v3.5'),6 documents: ['doc1', 'doc2', 'doc3', 'doc4', 'doc5'],7 query: 'relevant information',8 topN: 3, // Return only top 3 most relevant documents9});
```

### [Provider Options](#provider-options)

Reranking model settings can be configured using `providerOptions` for provider-specific parameters:

```
1import { cohere } from '@ai-sdk/cohere';2import { rerank } from 'ai';3
4const { ranking } = await rerank({5 model: cohere.reranking('rerank-v3.5'),6 documents: ['sunny day at the beach', 'rainy afternoon in the city'],7 query: 'talk about rain',8 providerOptions: {9 cohere: {10 maxTokensPerDoc: 1000, // Limit tokens per document11 },12 },13});
```

### [Retries](#retries)

The `rerank` function accepts an optional `maxRetries` parameter of type `number` that you can use to set the maximum number of retries for the reranking process. It defaults to `2` retries (3 attempts in total). You can set it to `0` to disable retries.

```
1import { cohere } from '@ai-sdk/cohere';2import { rerank } from 'ai';3
4const { ranking } = await rerank({5 model: cohere.reranking('rerank-v3.5'),6 documents: ['sunny day at the beach', 'rainy afternoon in the city'],7 query: 'talk about rain',8 maxRetries: 0, // Disable retries9});
```

### [Abort Signals and Timeouts](#abort-signals-and-timeouts)

The `rerank` function accepts an optional `abortSignal` parameter of type [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) that you can use to abort the reranking process or set a timeout.

```
1import { cohere } from '@ai-sdk/cohere';2import { rerank } from 'ai';3
4const { ranking } = await rerank({5 model: cohere.reranking('rerank-v3.5'),6 documents: ['sunny day at the beach', 'rainy afternoon in the city'],7 query: 'talk about rain',8 abortSignal: AbortSignal.timeout(5000), // Abort after 5 seconds9});
```

The `rerank` function accepts an optional `headers` parameter of type `Record<string, string>` that you can use to add custom headers to the reranking request.

```
1import { cohere } from '@ai-sdk/cohere';2import { rerank } from 'ai';3
4const { ranking } = await rerank({5 model: cohere.reranking('rerank-v3.5'),6 documents: ['sunny day at the beach', 'rainy afternoon in the city'],7 query: 'talk about rain',8 headers: { 'X-Custom-Header': 'custom-value' },9});
```

## [Response Information](#response-information)

The `rerank` function returns response information that includes the raw provider response:

```
1import { cohere } from '@ai-sdk/cohere';2import { rerank } from 'ai';3
4const { ranking, response } = await rerank({5 model: cohere.reranking('rerank-v3.5'),6 documents: ['sunny day at the beach', 'rainy afternoon in the city'],7 query: 'talk about rain',8});9
10console.log(response); // { id, timestamp, modelId, headers, body }
```

## [Reranking Providers & Models](#reranking-providers--models)

Several providers offer reranking models:

| Provider | Model |
| --- | --- |
| [Cohere](https://ai-sdk.dev/providers/ai-sdk-providers/cohere#reranking-models) | `rerank-v3.5` |
| [Cohere](https://ai-sdk.dev/providers/ai-sdk-providers/cohere#reranking-models) | `rerank-english-v3.0` |
| [Cohere](https://ai-sdk.dev/providers/ai-sdk-providers/cohere#reranking-models) | `rerank-multilingual-v3.0` |
| [Amazon Bedrock](https://ai-sdk.dev/providers/ai-sdk-providers/amazon-bedrock#reranking-models) | `amazon.rerank-v1:0` |
| [Amazon Bedrock](https://ai-sdk.dev/providers/ai-sdk-providers/amazon-bedrock#reranking-models) | `cohere.rerank-v3-5:0` |
| [Together.ai](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai#reranking-models) | `Salesforce/Llama-Rank-v1` |
| [Together.ai](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai#reranking-models) | `mixedbread-ai/Mxbai-Rerank-Large-V2` |

---
url: https://ai-sdk.dev/docs/ai-sdk-core/image-generation
title: "AI SDK Core: Image Generation"
description: "Learn how to generate images with the AI SDK."
hash: "b99f201bb97868e75f92eea714ecf3ae54e004fc530a9c55f17adf269b3dafc9"
crawledAt: 2026-03-07T08:00:22.689Z
depth: 2
---

[xAI Grok](https://ai-sdk.dev/providers/ai-sdk-providers/xai#image-models)`grok-2-image``1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`, `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`, `auto`[xAI Grok](https://ai-sdk.dev/providers/ai-sdk-providers/xai#image-models)`grok-imagine-image``1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`, `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`, `auto`[OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai#image-models)`gpt-image-1`1024x1024, 1536x1024, 1024x1536[OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai#image-models)`dall-e-3`1024x1024, 1792x1024, 1024x1792[OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai#image-models)`dall-e-2`256x256, 512x512, 1024x1024[Amazon Bedrock](https://ai-sdk.dev/providers/ai-sdk-providers/amazon-bedrock#image-models)`amazon.nova-canvas-v1:0`320-4096 (multiples of 16), 1:4 to 4:1, max 4.2M pixels[Fal](https://ai-sdk.dev/providers/ai-sdk-providers/fal#image-models)`fal-ai/flux/dev`1:1, 3:4, 4:3, 9:16, 16:9, 9:21, 21:9[Fal](https://ai-sdk.dev/providers/ai-sdk-providers/fal#image-models)`fal-ai/flux-lora`1:1, 3:4, 4:3, 9:16, 16:9, 9:21, 21:9[Fal](https://ai-sdk.dev/providers/ai-sdk-providers/fal#image-models)`fal-ai/fast-sdxl`1:1, 3:4, 4:3, 9:16, 16:9, 9:21, 21:9[Fal](https://ai-sdk.dev/providers/ai-sdk-providers/fal#image-models)`fal-ai/flux-pro/v1.1-ultra`1:1, 3:4, 4:3, 9:16, 16:9, 9:21, 21:9[Fal](https://ai-sdk.dev/providers/ai-sdk-providers/fal#image-models)`fal-ai/ideogram/v2`1:1, 3:4, 4:3, 9:16, 16:9, 9:21, 21:9[Fal](https://ai-sdk.dev/providers/ai-sdk-providers/fal#image-models)`fal-ai/recraft-v3`1:1, 3:4, 4:3, 9:16, 16:9, 9:21, 21:9[Fal](https://ai-sdk.dev/providers/ai-sdk-providers/fal#image-models)`fal-ai/stable-diffusion-3.5-large`1:1, 3:4, 4:3, 9:16, 16:9, 9:21, 21:9[Fal](https://ai-sdk.dev/providers/ai-sdk-providers/fal#image-models)`fal-ai/hyper-sdxl`1:1, 3:4, 4:3, 9:16, 16:9, 9:21, 21:9[DeepInfra](https://ai-sdk.dev/providers/ai-sdk-providers/deepinfra#image-models)`stabilityai/sd3.5`1:1, 16:9, 1:9, 3:2, 2:3, 4:5, 5:4, 9:16, 9:21[DeepInfra](https://ai-sdk.dev/providers/ai-sdk-providers/deepinfra#image-models)`black-forest-labs/FLUX-1.1-pro`256-1440 (multiples of 32)[DeepInfra](https://ai-sdk.dev/providers/ai-sdk-providers/deepinfra#image-models)`black-forest-labs/FLUX-1-schnell`256-1440 (multiples of 32)[DeepInfra](https://ai-sdk.dev/providers/ai-sdk-providers/deepinfra#image-models)`black-forest-labs/FLUX-1-dev`256-1440 (multiples of 32)[DeepInfra](https://ai-sdk.dev/providers/ai-sdk-providers/deepinfra#image-models)`black-forest-labs/FLUX-pro`256-1440 (multiples of 32)[DeepInfra](https://ai-sdk.dev/providers/ai-sdk-providers/deepinfra#image-models)`stabilityai/sd3.5-medium`1:1, 16:9, 1:9, 3:2, 2:3, 4:5, 5:4, 9:16, 9:21[DeepInfra](https://ai-sdk.dev/providers/ai-sdk-providers/deepinfra#image-models)`stabilityai/sdxl-turbo`1:1, 16:9, 1:9, 3:2, 2:3, 4:5, 5:4, 9:16, 9:21[Replicate](https://ai-sdk.dev/providers/ai-sdk-providers/replicate)`black-forest-labs/flux-schnell`1:1, 2:3, 3:2, 4:5, 5:4, 16:9, 9:16, 9:21, 21:9[Replicate](https://ai-sdk.dev/providers/ai-sdk-providers/replicate)`recraft-ai/recraft-v3`1024x1024, 1365x1024, 1024x1365, 1536x1024, 1024x1536, 1820x1024, 1024x1820, 1024x2048, 2048x1024, 1434x1024, 1024x1434, 1024x1280, 1280x1024, 1024x1707, 1707x1024[Google](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai#image-models)`imagen-4.0-generate-001`1:1, 3:4, 4:3, 9:16, 16:9[Google](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai#image-models)`imagen-4.0-fast-generate-001`1:1, 3:4, 4:3, 9:16, 16:9[Google](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai#image-models)`imagen-4.0-ultra-generate-001`1:1, 3:4, 4:3, 9:16, 16:9[Google Vertex](https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex#image-models)`imagen-4.0-generate-001`1:1, 3:4, 4:3, 9:16, 16:9[Google Vertex](https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex#image-models)`imagen-4.0-fast-generate-001`1:1, 3:4, 4:3, 9:16, 16:9[Google Vertex](https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex#image-models)`imagen-4.0-ultra-generate-001`1:1, 3:4, 4:3, 9:16, 16:9[Google Vertex](https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex#image-models)`imagen-3.0-fast-generate-001`1:1, 3:4, 4:3, 9:16, 16:9[Fireworks](https://ai-sdk.dev/providers/ai-sdk-providers/fireworks#image-models)`accounts/fireworks/models/flux-1-dev-fp8`1:1, 2:3, 3:2, 4:5, 5:4, 16:9, 9:16, 9:21, 21:9[Fireworks](https://ai-sdk.dev/providers/ai-sdk-providers/fireworks#image-models)`accounts/fireworks/models/flux-1-schnell-fp8`1:1, 2:3, 3:2, 4:5, 5:4, 16:9, 9:16, 9:21, 21:9[Fireworks](https://ai-sdk.dev/providers/ai-sdk-providers/fireworks#image-models)`accounts/fireworks/models/playground-v2-5-1024px-aesthetic`640x1536, 768x1344, 832x1216, 896x1152, 1024x1024, 1152x896, 1216x832, 1344x768, 1536x640[Fireworks](https://ai-sdk.dev/providers/ai-sdk-providers/fireworks#image-models)`accounts/fireworks/models/japanese-stable-diffusion-xl`640x1536, 768x1344, 832x1216, 896x1152, 1024x1024, 1152x896, 1216x832, 1344x768, 1536x640[Fireworks](https://ai-sdk.dev/providers/ai-sdk-providers/fireworks#image-models)`accounts/fireworks/models/playground-v2-1024px-aesthetic`640x1536, 768x1344, 832x1216, 896x1152, 1024x1024, 1152x896, 1216x832, 1344x768, 1536x640[Fireworks](https://ai-sdk.dev/providers/ai-sdk-providers/fireworks#image-models)`accounts/fireworks/models/SSD-1B`640x1536, 768x1344, 832x1216, 896x1152, 1024x1024, 1152x896, 1216x832, 1344x768, 1536x640[Fireworks](https://ai-sdk.dev/providers/ai-sdk-providers/fireworks#image-models)`accounts/fireworks/models/stable-diffusion-xl-1024-v1-0`640x1536, 768x1344, 832x1216, 896x1152, 1024x1024, 1152x896, 1216x832, 1344x768, 1536x640[Luma](https://ai-sdk.dev/providers/ai-sdk-providers/luma#image-models)`photon-1`1:1, 3:4, 4:3, 9:16, 16:9, 9:21, 21:9[Luma](https://ai-sdk.dev/providers/ai-sdk-providers/luma#image-models)`photon-flash-1`1:1, 3:4, 4:3, 9:16, 16:9, 9:21, 21:9[Together.ai](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai#image-models)`stabilityai/stable-diffusion-xl-base-1.0`512x512, 768x768, 1024x1024[Together.ai](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai#image-models)`black-forest-labs/FLUX.1-dev`512x512, 768x768, 1024x1024[Together.ai](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai#image-models)`black-forest-labs/FLUX.1-dev-lora`512x512, 768x768, 1024x1024[Together.ai](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai#image-models)`black-forest-labs/FLUX.1-schnell`512x512, 768x768, 1024x1024[Together.ai](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai#image-models)`black-forest-labs/FLUX.1-canny`512x512, 768x768, 1024x1024[Together.ai](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai#image-models)`black-forest-labs/FLUX.1-depth`512x512, 768x768, 1024x1024[Together.ai](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai#image-models)`black-forest-labs/FLUX.1-redux`512x512, 768x768, 1024x1024[Together.ai](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai#image-models)`black-forest-labs/FLUX.1.1-pro`512x512, 768x768, 1024x1024[Together.ai](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai#image-models)`black-forest-labs/FLUX.1-pro`512x512, 768x768, 1024x1024[Together.ai](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai#image-models)`black-forest-labs/FLUX.1-schnell-Free`512x512, 768x768, 1024x1024[Black Forest Labs](https://ai-sdk.dev/providers/ai-sdk-providers/black-forest-labs#image-models)`flux-kontext-pro`From 3:7 (portrait) to 7:3 (landscape)[Black Forest Labs](https://ai-sdk.dev/providers/ai-sdk-providers/black-forest-labs#image-models)`flux-kontext-max`From 3:7 (portrait) to 7:3 (landscape)[Black Forest Labs](https://ai-sdk.dev/providers/ai-sdk-providers/black-forest-labs#image-models)`flux-pro-1.1-ultra`From 3:7 (portrait) to 7:3 (landscape)[Black Forest Labs](https://ai-sdk.dev/providers/ai-sdk-providers/black-forest-labs#image-models)`flux-pro-1.1`From 3:7 (portrait) to 7:3 (landscape)[Black Forest Labs](https://ai-sdk.dev/providers/ai-sdk-providers/black-forest-labs#image-models)`flux-pro-1.0-fill`From 3:7 (portrait) to 7:3 (landscape)

---
url: https://ai-sdk.dev/docs/ai-sdk-core/transcription
title: "AI SDK Core: Transcription"
description: "Learn how to transcribe audio with the AI SDK."
hash: "e88cfebb10aea83c3cf069e4ba26d89922d9110f703313e60261331fc0fea694"
crawledAt: 2026-03-07T08:00:29.185Z
depth: 2
---

Transcription is an experimental feature.

The AI SDK provides the [`transcribe`](https://ai-sdk.dev/docs/reference/ai-sdk-core/transcribe) function to transcribe audio using a transcription model.

```
1import { experimental_transcribe as transcribe } from 'ai';2import { openai } from '@ai-sdk/openai';3import { readFile } from 'fs/promises';4
5const transcript = await transcribe({6 model: openai.transcription('whisper-1'),7 audio: await readFile('audio.mp3'),8});
```

The `audio` property can be a `Uint8Array`, `ArrayBuffer`, `Buffer`, `string` (base64 encoded audio data), or a `URL`.

To access the generated transcript:

```
1const text = transcript.text; // transcript text e.g. "Hello, world!"2const segments = transcript.segments; // array of segments with start and end times, if available3const language = transcript.language; // language of the transcript e.g. "en", if available4const durationInSeconds = transcript.durationInSeconds; // duration of the transcript in seconds, if available
```

## [Settings](#settings)

### [Provider-Specific settings](#provider-specific-settings)

Transcription models often have provider or model-specific settings which you can set using the `providerOptions` parameter.

```
1import { experimental_transcribe as transcribe } from 'ai';2import { openai } from '@ai-sdk/openai';3import { readFile } from 'fs/promises';4
5const transcript = await transcribe({6 model: openai.transcription('whisper-1'),7 audio: await readFile('audio.mp3'),8 providerOptions: {9 openai: {10 timestampGranularities: ['word'],11 },12 },13});
```

### [Download Size Limits](#download-size-limits)

When `audio` is a URL, the SDK downloads the file with a default **2 GiB** size limit. You can customize this using `createDownload`:

```
1import { experimental_transcribe as transcribe, createDownload } from 'ai';2import { openai } from '@ai-sdk/openai';3
4const transcript = await transcribe({5 model: openai.transcription('whisper-1'),6 audio: new URL('https://example.com/audio.mp3'),7 download: createDownload({ maxBytes: 50 * 1024 * 1024 }), // 50 MB limit8});
```

You can also provide a fully custom download function:

```
1import { experimental_transcribe as transcribe } from 'ai';2import { openai } from '@ai-sdk/openai';3
4const transcript = await transcribe({5 model: openai.transcription('whisper-1'),6 audio: new URL('https://example.com/audio.mp3'),7 download: async ({ url }) => {8 const res = await myAuthenticatedFetch(url);9 return {10 data: new Uint8Array(await res.arrayBuffer()),11 mediaType: res.headers.get('content-type') ?? undefined,12 };13 },14});
```

If a download exceeds the size limit, a `DownloadError` is thrown:

```
1import { experimental_transcribe as transcribe, DownloadError } from 'ai';2import { openai } from '@ai-sdk/openai';3
4try {5 await transcribe({6 model: openai.transcription('whisper-1'),7 audio: new URL('https://example.com/audio.mp3'),8 });9} catch (error) {10 if (DownloadError.isInstance(error)) {11 console.log('Download failed:', error.message);12 }13}
```

### [Abort Signals and Timeouts](#abort-signals-and-timeouts)

`transcribe` accepts an optional `abortSignal` parameter of type [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) that you can use to abort the transcription process or set a timeout.

This is particularly useful when combined with URL downloads to prevent long-running requests:

```
1import { openai } from '@ai-sdk/openai';2import { experimental_transcribe as transcribe } from 'ai';3
4const transcript = await transcribe({5 model: openai.transcription('whisper-1'),6 audio: new URL('https://example.com/audio.mp3'),7 abortSignal: AbortSignal.timeout(5000), // Abort after 5 seconds8});
```

`transcribe` accepts an optional `headers` parameter of type `Record<string, string>` that you can use to add custom headers to the transcription request.

```
1import { openai } from '@ai-sdk/openai';2import { experimental_transcribe as transcribe } from 'ai';3import { readFile } from 'fs/promises';4
5const transcript = await transcribe({6 model: openai.transcription('whisper-1'),7 audio: await readFile('audio.mp3'),8 headers: { 'X-Custom-Header': 'custom-value' },9});
```

### [Warnings](#warnings)

Warnings (e.g. unsupported parameters) are available on the `warnings` property.

```
1import { openai } from '@ai-sdk/openai';2import { experimental_transcribe as transcribe } from 'ai';3import { readFile } from 'fs/promises';4
5const transcript = await transcribe({6 model: openai.transcription('whisper-1'),7 audio: await readFile('audio.mp3'),8});9
10const warnings = transcript.warnings;
```

### [Error Handling](#error-handling)

When `transcribe` cannot generate a valid transcript, it throws a [`AI_NoTranscriptGeneratedError`](https://ai-sdk.dev/docs/reference/ai-sdk-errors/ai-no-transcript-generated-error).

This error can arise for any of the following reasons:

* The model failed to generate a response
* The model generated a response that could not be parsed

The error preserves the following information to help you log the issue:

* `responses`: Metadata about the transcription model responses, including timestamp, model, and headers.
* `cause`: The cause of the error. You can use this for more detailed error handling.

```
1import {2 experimental_transcribe as transcribe,3 NoTranscriptGeneratedError,4} from 'ai';5import { openai } from '@ai-sdk/openai';6import { readFile } from 'fs/promises';7
8try {9 await transcribe({10 model: openai.transcription('whisper-1'),11 audio: await readFile('audio.mp3'),12 });13} catch (error) {14 if (NoTranscriptGeneratedError.isInstance(error)) {15 console.log('NoTranscriptGeneratedError');16 console.log('Cause:', error.cause);17 console.log('Responses:', error.responses);18 }19}
```

## [Transcription Models](#transcription-models)

| Provider | Model |
| --- | --- |
| [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai#transcription-models) | `whisper-1` |
| [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai#transcription-models) | `gpt-4o-transcribe` |
| [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai#transcription-models) | `gpt-4o-mini-transcribe` |
| [ElevenLabs](https://ai-sdk.dev/providers/ai-sdk-providers/elevenlabs#transcription-models) | `scribe_v1` |
| [ElevenLabs](https://ai-sdk.dev/providers/ai-sdk-providers/elevenlabs#transcription-models) | `scribe_v1_experimental` |
| [Groq](https://ai-sdk.dev/providers/ai-sdk-providers/groq#transcription-models) | `whisper-large-v3-turbo` |
| [Groq](https://ai-sdk.dev/providers/ai-sdk-providers/groq#transcription-models) | `whisper-large-v3` |
| [Azure OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/azure#transcription-models) | `whisper-1` |
| [Azure OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/azure#transcription-models) | `gpt-4o-transcribe` |
| [Azure OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/azure#transcription-models) | `gpt-4o-mini-transcribe` |
| [Rev.ai](https://ai-sdk.dev/providers/ai-sdk-providers/revai#transcription-models) | `machine` |
| [Rev.ai](https://ai-sdk.dev/providers/ai-sdk-providers/revai#transcription-models) | `low_cost` |
| [Rev.ai](https://ai-sdk.dev/providers/ai-sdk-providers/revai#transcription-models) | `fusion` |
| [Deepgram](https://ai-sdk.dev/providers/ai-sdk-providers/deepgram#transcription-models) | `base` (+ variants) |
| [Deepgram](https://ai-sdk.dev/providers/ai-sdk-providers/deepgram#transcription-models) | `enhanced` (+ variants) |
| [Deepgram](https://ai-sdk.dev/providers/ai-sdk-providers/deepgram#transcription-models) | `nova` (+ variants) |
| [Deepgram](https://ai-sdk.dev/providers/ai-sdk-providers/deepgram#transcription-models) | `nova-2` (+ variants) |
| [Deepgram](https://ai-sdk.dev/providers/ai-sdk-providers/deepgram#transcription-models) | `nova-3` (+ variants) |
| [Gladia](https://ai-sdk.dev/providers/ai-sdk-providers/gladia#transcription-models) | `default` |
| [AssemblyAI](https://ai-sdk.dev/providers/ai-sdk-providers/assemblyai#transcription-models) | `best` |
| [AssemblyAI](https://ai-sdk.dev/providers/ai-sdk-providers/assemblyai#transcription-models) | `nano` |
| [Fal](https://ai-sdk.dev/providers/ai-sdk-providers/fal#transcription-models) | `whisper` |
| [Fal](https://ai-sdk.dev/providers/ai-sdk-providers/fal#transcription-models) | `wizper` |

Above are a small subset of the transcription models supported by the AI SDK providers. For more, see the respective provider documentation.

---
url: https://ai-sdk.dev/docs/ai-sdk-core/speech
title: "AI SDK Core: Speech"
description: "Learn how to generate speech from text with the AI SDK."
hash: "a2f104c74bd26380cd623b90113feb68f0181757d72271715476b66d78ecbc18"
crawledAt: 2026-03-07T08:00:34.882Z
depth: 2
---

Speech is an experimental feature.

The AI SDK provides the [`generateSpeech`](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-speech) function to generate speech from text using a speech model.

```
1import { experimental_generateSpeech as generateSpeech } from 'ai';2import { openai } from '@ai-sdk/openai';3
4const audio = await generateSpeech({5 model: openai.speech('tts-1'),6 text: 'Hello, world!',7 voice: 'alloy',8});
```

### [Language Setting](#language-setting)

You can specify the language for speech generation (provider support varies):

```
1import { experimental_generateSpeech as generateSpeech } from 'ai';2import { lmnt } from '@ai-sdk/lmnt';3
4const audio = await generateSpeech({5 model: lmnt.speech('aurora'),6 text: 'Hola, mundo!',7 language: 'es', // Spanish8});
```

To access the generated audio:

```
1const audioData = result.audio.uint8Array; // audio data as Uint8Array2// or3const audioBase64 = result.audio.base64; // audio data as base64 string
```

## [Settings](#settings)

### [Provider-Specific settings](#provider-specific-settings)

You can set model-specific settings with the `providerOptions` parameter.

```
1import { experimental_generateSpeech as generateSpeech } from 'ai';2import { openai } from '@ai-sdk/openai';3
4const audio = await generateSpeech({5 model: openai.speech('tts-1'),6 text: 'Hello, world!',7 providerOptions: {8 openai: {9 //...10 },11 },12});
```

### [Abort Signals and Timeouts](#abort-signals-and-timeouts)

`generateSpeech` accepts an optional `abortSignal` parameter of type [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) that you can use to abort the speech generation process or set a timeout.

```
1import { openai } from '@ai-sdk/openai';2import { experimental_generateSpeech as generateSpeech } from 'ai';3
4const audio = await generateSpeech({5 model: openai.speech('tts-1'),6 text: 'Hello, world!',7 abortSignal: AbortSignal.timeout(1000), // Abort after 1 second8});
```

`generateSpeech` accepts an optional `headers` parameter of type `Record<string, string>` that you can use to add custom headers to the speech generation request.

```
1import { openai } from '@ai-sdk/openai';2import { experimental_generateSpeech as generateSpeech } from 'ai';3
4const audio = await generateSpeech({5 model: openai.speech('tts-1'),6 text: 'Hello, world!',7 headers: { 'X-Custom-Header': 'custom-value' },8});
```

### [Warnings](#warnings)

Warnings (e.g. unsupported parameters) are available on the `warnings` property.

```
1import { openai } from '@ai-sdk/openai';2import { experimental_generateSpeech as generateSpeech } from 'ai';3
4const audio = await generateSpeech({5 model: openai.speech('tts-1'),6 text: 'Hello, world!',7});8
9const warnings = audio.warnings;
```

### [Error Handling](#error-handling)

When `generateSpeech` cannot generate a valid audio, it throws a [`AI_NoSpeechGeneratedError`](https://ai-sdk.dev/docs/reference/ai-sdk-errors/ai-no-speech-generated-error).

This error can arise for any of the following reasons:

* The model failed to generate a response
* The model generated a response that could not be parsed

The error preserves the following information to help you log the issue:

* `responses`: Metadata about the speech model responses, including timestamp, model, and headers.
* `cause`: The cause of the error. You can use this for more detailed error handling.

```
1import {2 experimental_generateSpeech as generateSpeech,3 NoSpeechGeneratedError,4} from 'ai';5import { openai } from '@ai-sdk/openai';6
7try {8 await generateSpeech({9 model: openai.speech('tts-1'),10 text: 'Hello, world!',11 });12} catch (error) {13 if (NoSpeechGeneratedError.isInstance(error)) {14 console.log('AI_NoSpeechGeneratedError');15 console.log('Cause:', error.cause);16 console.log('Responses:', error.responses);17 }18}
```

## [Speech Models](#speech-models)

| Provider | Model |
| --- | --- |
| [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai#speech-models) | `tts-1` |
| [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai#speech-models) | `tts-1-hd` |
| [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai#speech-models) | `gpt-4o-mini-tts` |
| [ElevenLabs](https://ai-sdk.dev/providers/ai-sdk-providers/elevenlabs#speech-models) | `eleven_v3` |
| [ElevenLabs](https://ai-sdk.dev/providers/ai-sdk-providers/elevenlabs#speech-models) | `eleven_multilingual_v2` |
| [ElevenLabs](https://ai-sdk.dev/providers/ai-sdk-providers/elevenlabs#speech-models) | `eleven_flash_v2_5` |
| [ElevenLabs](https://ai-sdk.dev/providers/ai-sdk-providers/elevenlabs#speech-models) | `eleven_flash_v2` |
| [ElevenLabs](https://ai-sdk.dev/providers/ai-sdk-providers/elevenlabs#speech-models) | `eleven_turbo_v2_5` |
| [ElevenLabs](https://ai-sdk.dev/providers/ai-sdk-providers/elevenlabs#speech-models) | `eleven_turbo_v2` |
| [LMNT](https://ai-sdk.dev/providers/ai-sdk-providers/lmnt#speech-models) | `aurora` |
| [LMNT](https://ai-sdk.dev/providers/ai-sdk-providers/lmnt#speech-models) | `blizzard` |
| [Hume](https://ai-sdk.dev/providers/ai-sdk-providers/hume#speech-models) | `default` |

Above are a small subset of the speech models supported by the AI SDK providers. For more, see the respective provider documentation.

---
url: https://ai-sdk.dev/docs/ai-sdk-core/video-generation
title: "AI SDK Core: Video Generation"
description: "Learn how to generate videos with the AI SDK."
hash: "2d9eb9f0cff7b8c59593d1f99ae5d2c5f695026ba2388ad9a23cb32222c1b13e"
crawledAt: 2026-03-07T08:00:40.411Z
depth: 2
---

Video generation is an experimental feature. The API may change in future versions.

The AI SDK provides the [`experimental_generateVideo`](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-video) function to generate videos based on a given prompt using a video model.

```
1import { experimental_generateVideo as generateVideo } from 'ai';2import { fal } from '@ai-sdk/fal';3
4const { video } = await generateVideo({5 model: fal.video('luma-dream-machine/ray-2'),6 prompt: 'A cat walking on a treadmill',7});
```

You can access the video data using the `base64` or `uint8Array` properties:

```
1const base64 = video.base64; // base64 video data2const uint8Array = video.uint8Array; // Uint8Array video data
```

## [Settings](#settings)

### [Aspect Ratio](#aspect-ratio)

The aspect ratio is specified as a string in the format `{width}:{height}`. Models only support a few aspect ratios, and the supported aspect ratios are different for each model and provider.

```
1import { experimental_generateVideo as generateVideo } from 'ai';2import { fal } from '@ai-sdk/fal';3
4const { video } = await generateVideo({5 model: fal.video('luma-dream-machine/ray-2'),6 prompt: 'A cat walking on a treadmill',7 aspectRatio: '16:9',8});
```

### [Resolution](#resolution)

The resolution is specified as a string in the format `{width}x{height}`. Models only support specific resolutions, and the supported resolutions are different for each model and provider.

```
1import { experimental_generateVideo as generateVideo } from 'ai';2import { google } from '@ai-sdk/google';3
4const { video } = await generateVideo({5 model: google.video('veo-2.0-generate-001'),6 prompt: 'A serene mountain landscape at sunset',7 resolution: '1280x720',8});
```

### [Duration](#duration)

Some video models support specifying the duration of the generated video in seconds.

```
1import { experimental_generateVideo as generateVideo } from 'ai';2import { fal } from '@ai-sdk/fal';3
4const { video } = await generateVideo({5 model: fal.video('luma-dream-machine/ray-2'),6 prompt: 'A timelapse of clouds moving across the sky',7 duration: 5,8});
```

### [Frames Per Second (FPS)](#frames-per-second-fps)

Some video models allow you to specify the frames per second for the generated video.

```
1import { experimental_generateVideo as generateVideo } from 'ai';2import { fal } from '@ai-sdk/fal';3
4const { video } = await generateVideo({5 model: fal.video('luma-dream-machine/ray-2'),6 prompt: 'A hummingbird in slow motion',7 fps: 24,8});
```

### [Generating Multiple Videos](#generating-multiple-videos)

`experimental_generateVideo` supports generating multiple videos at once:

```
1import { experimental_generateVideo as generateVideo } from 'ai';2import { google } from '@ai-sdk/google';3
4const { videos } = await generateVideo({5 model: google.video('veo-2.0-generate-001'),6 prompt: 'A rocket launching into space',7 n: 3, // number of videos to generate8});
```

`experimental_generateVideo` will automatically call the model as often as needed (in parallel) to generate the requested number of videos.

Each video model has an internal limit on how many videos it can generate in a single API call. The AI SDK manages this automatically by batching requests appropriately when you request multiple videos using the `n` parameter. Most video models only support generating 1 video per call due to computational cost.

If needed, you can override this behavior using the `maxVideosPerCall` setting:

```
1const { videos } = await generateVideo({2 model: google.video('veo-2.0-generate-001'),3 prompt: 'A rocket launching into space',4 maxVideosPerCall: 2, // Override the default batch size5 n: 4, // Will make 2 calls of 2 videos each6});
```

### [Image-to-Video Generation](#image-to-video-generation)

Some video models support generating videos from an input image. You can provide an image using the prompt object:

```
1import { experimental_generateVideo as generateVideo } from 'ai';2import { fal } from '@ai-sdk/fal';3
4const { video } = await generateVideo({5 model: fal.video('hunyuan-video'),6 prompt: {7 image: 'https://example.com/my-image.png',8 text: 'Animate this image with gentle motion',9 },10});
```

You can also provide the image as a base64-encoded string or `Uint8Array`:

```
1const { video } = await generateVideo({2 model: fal.video('hunyuan-video'),3 prompt: {4 image: imageBase64String, // or imageUint8Array5 text: 'Animate this image',6 },7});
```

### [Providing a Seed](#providing-a-seed)

You can provide a seed to the `experimental_generateVideo` function to control the output of the video generation process. If supported by the model, the same seed will always produce the same video.

```
1import { experimental_generateVideo as generateVideo } from 'ai';2import { fal } from '@ai-sdk/fal';3
4const { video } = await generateVideo({5 model: fal.video('luma-dream-machine/ray-2'),6 prompt: 'A cat walking on a treadmill',7 seed: 1234567890,8});
```

### [Provider-specific Settings](#provider-specific-settings)

Video models often have provider- or even model-specific settings. You can pass such settings to the `experimental_generateVideo` function using the `providerOptions` parameter. The options for the provider become request body properties.

```
1import { experimental_generateVideo as generateVideo } from 'ai';2import { fal } from '@ai-sdk/fal';3
4const { video } = await generateVideo({5 model: fal.video('luma-dream-machine/ray-2'),6 prompt: 'A cat walking on a treadmill',7 aspectRatio: '16:9',8 providerOptions: {9 fal: { loop: true, motionStrength: 0.8 },10 },11});
```

### [Abort Signals and Timeouts](#abort-signals-and-timeouts)

`experimental_generateVideo` accepts an optional `abortSignal` parameter of type [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) that you can use to abort the video generation process or set a timeout.

```
1import { fal } from '@ai-sdk/fal';2import { experimental_generateVideo as generateVideo } from 'ai';3
4const { video } = await generateVideo({5 model: fal.video('luma-dream-machine/ray-2'),6 prompt: 'A cat walking on a treadmill',7 abortSignal: AbortSignal.timeout(60000), // Abort after 60 seconds8});
```

Video generation typically takes longer than image generation. Consider using longer timeouts (60 seconds or more) depending on the model and video length.

### [Polling Timeout](#polling-timeout)

Video generation is an asynchronous process that can take several minutes to complete. Most providers use a polling mechanism where the SDK periodically checks if the video is ready. The default polling timeout is typically 5 minutes, which may not be sufficient for longer videos or certain models.

You can configure the polling timeout using provider-specific options. Each provider exports a type for its options that you can use with `satisfies` for type safety:

```
1import { experimental_generateVideo as generateVideo } from 'ai';2import { fal, type FalVideoModelOptions } from '@ai-sdk/fal';3
4const { video } = await generateVideo({5 model: fal.video('luma-dream-machine/ray-2'),6 prompt: 'A cinematic timelapse of a city from dawn to dusk',7 duration: 10,8 providerOptions: {9 fal: {10 pollTimeoutMs: 600000, // 10 minutes11 } satisfies FalVideoModelOptions,12 },13});
```

For production use, we recommend setting `pollTimeoutMs` to at least 10 minutes (600000ms) to account for varying generation times across different models and video lengths.

`experimental_generateVideo` accepts an optional `headers` parameter of type `Record<string, string>` that you can use to add custom headers to the video generation request.

```
1import { fal } from '@ai-sdk/fal';2import { experimental_generateVideo as generateVideo } from 'ai';3
4const { video } = await generateVideo({5 model: fal.video('luma-dream-machine/ray-2'),6 prompt: 'A cat walking on a treadmill',7 headers: { 'X-Custom-Header': 'custom-value' },8});
```

### [Warnings](#warnings)

If the model returns warnings, e.g. for unsupported parameters, they will be available in the `warnings` property of the response.

```
1const { video, warnings } = await generateVideo({2 model: fal.video('luma-dream-machine/ray-2'),3 prompt: 'A cat walking on a treadmill',4});
```

### [Additional Provider-specific Metadata](#additional-provider-specific-metadata)

Some providers expose additional metadata for the result overall or per video.

```
1const prompt = 'A cat walking on a treadmill';2
3const { video, providerMetadata } = await generateVideo({4 model: fal.video('luma-dream-machine/ray-2'),5 prompt,6});7
8// Access provider-specific metadata9const videoMetadata = providerMetadata.fal?.videos[0];10console.log({11 duration: videoMetadata?.duration,12 fps: videoMetadata?.fps,13 width: videoMetadata?.width,14 height: videoMetadata?.height,15});
```

The outer key of the returned `providerMetadata` is the provider name. The inner values are the metadata. A `videos` key is typically present in the metadata and is an array with the same length as the top level `videos` key.

When generating multiple videos with `n > 1`, you can also access per-call metadata through the `responses` array:

```
1const { videos, responses } = await generateVideo({2 model: google.video('veo-2.0-generate-001'),3 prompt: 'A rocket launching into space',4 n: 5, // May require multiple API calls5});6
7// Access metadata from each individual API call8for (const response of responses) {9 console.log({10 timestamp: response.timestamp,11 modelId: response.modelId,12 // Per-call provider metadata (lossless)13 providerMetadata: response.providerMetadata,14 });15}
```

### [Error Handling](#error-handling)

When `experimental_generateVideo` cannot generate a valid video, it throws a [`AI_NoVideoGeneratedError`](https://ai-sdk.dev/docs/reference/ai-sdk-errors/ai-no-video-generated-error).

This error occurs when the AI provider fails to generate a video. It can arise due to the following reasons:

* The model failed to generate a response
* The model generated a response that could not be parsed

The error preserves the following information to help you log the issue:

* `responses`: Metadata about the video model responses, including timestamp, model, and headers.
* `cause`: The cause of the error. You can use this for more detailed error handling

```
1import {2 experimental_generateVideo as generateVideo,3 NoVideoGeneratedError,4} from 'ai';5
6try {7 await generateVideo({ model, prompt });8} catch (error) {9 if (NoVideoGeneratedError.isInstance(error)) {10 console.log('NoVideoGeneratedError');11 console.log('Cause:', error.cause);12 console.log('Responses:', error.responses);13 }14}
```

## [Video Models](#video-models)

| Provider | Model | Features |
| --- | --- | --- |
| [FAL](https://ai-sdk.dev/providers/ai-sdk-providers/fal#video-models) | `luma-dream-machine/ray-2` | Text-to-video, image-to-video |
| [FAL](https://ai-sdk.dev/providers/ai-sdk-providers/fal#video-models) | `minimax-video` | Text-to-video |
| [Google](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai#video-models) | `veo-2.0-generate-001` | Text-to-video, up to 4 videos per call |
| [Google Vertex](https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex#video-models) | `veo-3.1-generate-001` | Text-to-video, audio generation |
| [Google Vertex](https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex#video-models) | `veo-3.1-fast-generate-001` | Text-to-video, audio generation |
| [Google Vertex](https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex#video-models) | `veo-3.0-generate-001` | Text-to-video, audio generation |
| [Google Vertex](https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex#video-models) | `veo-3.0-fast-generate-001` | Text-to-video, audio generation |
| [Google Vertex](https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex#video-models) | `veo-2.0-generate-001` | Text-to-video, up to 4 videos per call |
| [Kling AI](https://ai-sdk.dev/providers/ai-sdk-providers/klingai#video-models) | `kling-v2.6-t2v` | Text-to-video |
| [Kling AI](https://ai-sdk.dev/providers/ai-sdk-providers/klingai#video-models) | `kling-v2.6-i2v` | Image-to-video |
| [Kling AI](https://ai-sdk.dev/providers/ai-sdk-providers/klingai#video-models) | `kling-v2.6-motion-control` | Motion control |
| [Replicate](https://ai-sdk.dev/providers/ai-sdk-providers/replicate#video-models) | `minimax/video-01` | Text-to-video |
| [xAI](https://ai-sdk.dev/providers/ai-sdk-providers/xai#video-models) | `grok-imagine-video` | Text-to-video, image-to-video, editing |

Above are a small subset of the video models supported by the AI SDK providers. For more, see the respective provider documentation.

---
url: https://ai-sdk.dev/docs/ai-sdk-core/middleware
title: "AI SDK Core: Language Model Middleware"
description: "Learn how to use middleware to enhance the behavior of language models"
hash: "ed1774498b22a7273ef06f6166c9dc365b0ceb06497e7c0cb4b15fd2fc8d2a75"
crawledAt: 2026-03-07T08:00:46.122Z
depth: 2
---

Language model middleware is a way to enhance the behavior of language models by intercepting and modifying the calls to the language model.

It can be used to add features like guardrails, RAG, caching, and logging in a language model agnostic way. Such middleware can be developed and distributed independently from the language models that they are applied to.

## [Using Language Model Middleware](#using-language-model-middleware)

You can use language model middleware with the `wrapLanguageModel` function. It takes a language model and a language model middleware and returns a new language model that incorporates the middleware.

```
1import { wrapLanguageModel, streamText } from 'ai';2
3const wrappedLanguageModel = wrapLanguageModel({4 model: yourModel,5 middleware: yourLanguageModelMiddleware,6});
```

The wrapped language model can be used just like any other language model, e.g. in `streamText`:

```
1const result = streamText({2 model: wrappedLanguageModel,3 prompt: 'What cities are in the United States?',4});
```

## [Multiple middlewares](#multiple-middlewares)

You can provide multiple middlewares to the `wrapLanguageModel` function. The middlewares will be applied in the order they are provided.

```
1const wrappedLanguageModel = wrapLanguageModel({2 model: yourModel,3 middleware: [firstMiddleware, secondMiddleware],4});5
6// applied as: firstMiddleware(secondMiddleware(yourModel))
```

## [Built-in Middleware](#built-in-middleware)

The AI SDK comes with several built-in middlewares that you can use to configure language models:

* `extractReasoningMiddleware`: Extracts reasoning information from the generated text and exposes it as a `reasoning` property on the result.
* `extractJsonMiddleware`: Extracts JSON from text content by stripping markdown code fences. Useful when using `Output.object()` with models that wrap JSON responses in code blocks.
* `simulateStreamingMiddleware`: Simulates streaming behavior with responses from non-streaming language models.
* `defaultSettingsMiddleware`: Applies default settings to a language model.
* `addToolInputExamplesMiddleware`: Adds tool input examples to tool descriptions for providers that don't natively support the `inputExamples` property.

Some providers and models expose reasoning information in the generated text using special tags, e.g. <think> and </think>.

The `extractReasoningMiddleware` function can be used to extract this reasoning information and expose it as a `reasoning` property on the result.

```
1import { wrapLanguageModel, extractReasoningMiddleware } from 'ai';2
3const model = wrapLanguageModel({4 model: yourModel,5 middleware: extractReasoningMiddleware({ tagName: 'think' }),6});
```

You can then use that enhanced model in functions like `generateText` and `streamText`.

The `extractReasoningMiddleware` function also includes a `startWithReasoning` option. When set to `true`, the reasoning tag will be prepended to the generated text. This is useful for models that do not include the reasoning tag at the beginning of the response. For more details, see the [DeepSeek R1 guide](https://ai-sdk.dev/cookbook/guides/r1#deepseek-r1-middleware).

Some models wrap JSON responses in markdown code fences (e.g., ` ```json... ``` `) even when you request structured output.

The `extractJsonMiddleware` function strips these code fences from the response, making it compatible with `Output.object()`.

```
1import {2 wrapLanguageModel,3 extractJsonMiddleware,4 Output,5 generateText,6} from 'ai';7import { z } from 'zod';8
9const model = wrapLanguageModel({10 model: yourModel,11 middleware: extractJsonMiddleware(),12});13
14const result = await generateText({15 model,16 output: Output.object({17 schema: z.object({18 name: z.string(),19 ingredients: z.array(z.string()),20 }),21 }),22 prompt: 'Generate a recipe.',23});
```

You can also provide a custom transform function for models that use different formatting:

```
1const model = wrapLanguageModel({2 model: yourModel,3 middleware: extractJsonMiddleware({4 transform: text => text.replace(/^PREFIX/, '').replace(/SUFFIX$/, ''),5 }),6});
```

### [Simulate Streaming](#simulate-streaming)

The `simulateStreamingMiddleware` function can be used to simulate streaming behavior with responses from non-streaming language models. This is useful when you want to maintain a consistent streaming interface even when using models that only provide complete responses.

```
1import { wrapLanguageModel, simulateStreamingMiddleware } from 'ai';2
3const model = wrapLanguageModel({4 model: yourModel,5 middleware: simulateStreamingMiddleware(),6});
```

### [Default Settings](#default-settings)

The `defaultSettingsMiddleware` function can be used to apply default settings to a language model.

```
1import { wrapLanguageModel, defaultSettingsMiddleware } from 'ai';2
3const model = wrapLanguageModel({4 model: yourModel,5 middleware: defaultSettingsMiddleware({6 settings: {7 temperature: 0.5,8 maxOutputTokens: 800,9 providerOptions: { openai: { store: false } },10 },11 }),12});
```

### [Add Tool Input Examples](#add-tool-input-examples)

The `addToolInputExamplesMiddleware` function adds tool input examples to tool descriptions. This is useful for providers that don't natively support the `inputExamples` property on tools. The middleware serializes the examples into the tool's description text so models can still benefit from seeing example inputs.

```
1import { wrapLanguageModel, addToolInputExamplesMiddleware } from 'ai';2
3const model = wrapLanguageModel({4 model: yourModel,5 middleware: addToolInputExamplesMiddleware({6 prefix: 'Input Examples:',7 }),8});
```

When you define a tool with `inputExamples`, the middleware will append them to the tool's description:

```
1import { generateText, tool } from 'ai';2import { z } from 'zod';3
4const result = await generateText({5 model, // wrapped model from above6 tools: {7 weather: tool({8 description: 'Get the weather in a location',9 inputSchema: z.object({10 location: z.string(),11 }),12 inputExamples: [13 { input: { location: 'San Francisco' } },14 { input: { location: 'London' } },15 ],16 }),17 },18 prompt: 'What is the weather in Tokyo?',19});
```

The tool description will be transformed to:

```
1Get the weather in a location2
3Input Examples:4{"location":"San Francisco"}5{"location":"London"}
```

#### [Options](#options)

* `prefix` (optional): A prefix text to prepend before the examples. Default: `'Input Examples:'`.
* `format` (optional): A custom formatter function for each example. Receives the example object and its index. Default: `JSON.stringify(example.input)`.
* `remove` (optional): Whether to remove the `inputExamples` property from the tool after adding them to the description. Default: `true`.

```
1const model = wrapLanguageModel({2 model: yourModel,3 middleware: addToolInputExamplesMiddleware({4 prefix: 'Input Examples:',5 format: (example, index) =>6 `${index + 1}. ${JSON.stringify(example.input)}`,7 remove: true,8 }),9});
```

The AI SDK provides a Language Model Middleware specification. Community members can develop middleware that adheres to this specification, making it compatible with the AI SDK ecosystem.

Here are some community middlewares that you can explore:

### [Custom tool call parser](#custom-tool-call-parser)

The [Custom tool call parser](https://github.com/minpeter/ai-sdk-tool-call-middleware) middleware extends tool call capabilities to models that don't natively support the OpenAI-style `tools` parameter. This includes many self-hosted and third-party models that lack native function calling features.

Using this middleware on models that support native function calls may result in unintended performance degradation, so check whether your model supports native function calls before deciding to use it.

This middleware enables function calling capabilities by converting function schemas into prompt instructions and parsing the model's responses into structured function calls. It works by transforming the JSON function definitions into natural language instructions the model can understand, then analyzing the generated text to extract function call attempts. This approach allows developers to use the same function calling API across different model providers, even with models that don't natively support the OpenAI-style function calling format, providing a consistent function calling experience regardless of the underlying model implementation.

The `@ai-sdk-tool/parser` package offers three middleware variants:

* `createToolMiddleware`: A flexible function for creating custom tool call middleware tailored to specific models
* `hermesToolMiddleware`: Ready-to-use middleware for Hermes & Qwen format function calls
* `gemmaToolMiddleware`: Pre-configured middleware for Gemma 3 model series function call format

Here's how you can enable function calls with Gemma models that don't support them natively:

```
1import { wrapLanguageModel } from 'ai';2import { gemmaToolMiddleware } from '@ai-sdk-tool/parser';3
4const model = wrapLanguageModel({5 model: openrouter('google/gemma-3-27b-it'),6 middleware: gemmaToolMiddleware,7});
```

Find more examples at this [link](https://github.com/minpeter/ai-sdk-tool-call-middleware/tree/main/examples/core/src).

## [Implementing Language Model Middleware](#implementing-language-model-middleware)

You can implement any of the following three function to modify the behavior of the language model:

1. `transformParams`: Transforms the parameters before they are passed to the language model, for both `doGenerate` and `doStream`.
2. `wrapGenerate`: Wraps the `doGenerate` method of the [language model](https://github.com/vercel/ai/blob/v5/packages/provider/src/language-model/v2/language-model-v2.ts). You can modify the parameters, call the language model, and modify the result.
3. `wrapStream`: Wraps the `doStream` method of the [language model](https://github.com/vercel/ai/blob/v5/packages/provider/src/language-model/v2/language-model-v2.ts). You can modify the parameters, call the language model, and modify the result.

Here are some examples of how to implement language model middleware:

## [Examples](#examples)

These examples are not meant to be used in production. They are just to show how you can use middleware to enhance the behavior of language models.

### [Logging](#logging)

This example shows how to log the parameters and generated text of a language model call.

```
1import type {2 LanguageModelV3Middleware,3 LanguageModelV3StreamPart,4} from '@ai-sdk/provider';5
6export const yourLogMiddleware: LanguageModelV3Middleware = {7 wrapGenerate: async ({ doGenerate, params }) => {8 console.log('doGenerate called');9 console.log(`params: ${JSON.stringify(params, null, 2)}`);10
11 const result = await doGenerate();12
13 console.log('doGenerate finished');14 console.log(`generated text: ${result.text}`);15
16 return result;17 },18
19 wrapStream: async ({ doStream, params }) => {20 console.log('doStream called');21 console.log(`params: ${JSON.stringify(params, null, 2)}`);22
23 const { stream,...rest } = await doStream();24
25 let generatedText = '';26 const textBlocks = new Map<string, string>();27
28 const transformStream = new TransformStream<29 LanguageModelV3StreamPart,30 LanguageModelV3StreamPart31 >({32 transform(chunk, controller) {33 switch (chunk.type) {34 case 'text-start': {35 textBlocks.set(chunk.id, '');36 break;37 }38 case 'text-delta': {39 const existing = textBlocks.get(chunk.id) || '';40 textBlocks.set(chunk.id, existing + chunk.delta);41 generatedText += chunk.delta;42 break;43 }44 case 'text-end': {45 console.log(46 `Text block ${chunk.id} completed:`,47 textBlocks.get(chunk.id),48 );49 break;50 }51 }52
53 controller.enqueue(chunk);54 },55
56 flush() {57 console.log('doStream finished');58 console.log(`generated text: ${generatedText}`);59 },60 });61
62 return {63 stream: stream.pipeThrough(transformStream),64...rest,65 };66 },67};
```

### [Caching](#caching)

This example shows how to build a simple cache for the generated text of a language model call.

```
1import type { LanguageModelV3Middleware } from '@ai-sdk/provider';2
3const cache = new Map<string, any>();4
5export const yourCacheMiddleware: LanguageModelV3Middleware = {6 wrapGenerate: async ({ doGenerate, params }) => {7 const cacheKey = JSON.stringify(params);8
9 if (cache.has(cacheKey)) {10 return cache.get(cacheKey);11 }12
13 const result = await doGenerate();14
15 cache.set(cacheKey, result);16
17 return result;18 },19
20 // here you would implement the caching logic for streaming21};
```

### [Retrieval Augmented Generation (RAG)](#retrieval-augmented-generation-rag)

This example shows how to use RAG as middleware.

Helper functions like `getLastUserMessageText` and `findSources` are not part of the AI SDK. They are just used in this example to illustrate the concept of RAG.

```
1import type { LanguageModelV3Middleware } from '@ai-sdk/provider';2
3export const yourRagMiddleware: LanguageModelV3Middleware = {4 transformParams: async ({ params }) => {5 const lastUserMessageText = getLastUserMessageText({6 prompt: params.prompt,7 });8
9 if (lastUserMessageText == null) {10 return params; // do not use RAG (send unmodified parameters)11 }12
13 const instruction =14 'Use the following information to answer the question:\n' +15 findSources({ text: lastUserMessageText })16.map(chunk => JSON.stringify(chunk))17.join('\n');18
19 return addToLastUserMessage({ params, text: instruction });20 },21};
```

### [Guardrails](#guardrails)

Guard rails are a way to ensure that the generated text of a language model call is safe and appropriate. This example shows how to use guardrails as middleware.

```
1import type { LanguageModelV3Middleware } from '@ai-sdk/provider';2
3export const yourGuardrailMiddleware: LanguageModelV3Middleware = {4 wrapGenerate: async ({ doGenerate }) => {5 const { text,...rest } = await doGenerate();6
7 // filtering approach, e.g. for PII or other sensitive information:8 const cleanedText = text?.replace(/badword/g, '<REDACTED>');9
10 return { text: cleanedText,...rest };11 },12
13 // here you would implement the guardrail logic for streaming14 // Note: streaming guardrails are difficult to implement, because15 // you do not know the full content of the stream until it's finished.16};
```

To send and access custom metadata in Middleware, you can use `providerOptions`. This is useful when building logging middleware where you want to pass additional context like user IDs, timestamps, or other contextual data that can help with tracking and debugging.

```
1import { generateText, wrapLanguageModel } from 'ai';2import type { LanguageModelV3Middleware } from '@ai-sdk/provider';3
4export const yourLogMiddleware: LanguageModelV3Middleware = {5 wrapGenerate: async ({ doGenerate, params }) => {6 console.log('METADATA', params?.providerMetadata?.yourLogMiddleware);7 const result = await doGenerate();8 return result;9 },10};11
12const { text } = await generateText({13 model: wrapLanguageModel({14 model: "anthropic/claude-sonnet-4.5",15 middleware: yourLogMiddleware,16 }),17 prompt: 'Invent a new holiday and describe its traditions.',18 providerOptions: {19 yourLogMiddleware: {20 hello: 'world',21 },22 },23});24
25console.log(text);
```

---
url: https://ai-sdk.dev/docs/ai-sdk-core/provider-management
title: "AI SDK Core: Provider & Model Management"
description: "Learn how to work with multiple providers and models"
hash: "07fe8fd59e78cc8bcbc07f14d85a8b8b4707402b9677f6f279bf85a7783f22ce"
crawledAt: 2026-03-07T08:00:52.690Z
depth: 2
---

When you work with multiple providers and models, it is often desirable to manage them in a central place and access the models through simple string ids.

The AI SDK offers [custom providers](https://ai-sdk.dev/docs/reference/ai-sdk-core/custom-provider) and a [provider registry](https://ai-sdk.dev/docs/reference/ai-sdk-core/provider-registry) for this purpose:

* With **custom providers**, you can pre-configure model settings, provide model name aliases, and limit the available models.
* The **provider registry** lets you mix multiple providers and access them through simple string ids.

You can mix and match custom providers, the provider registry, and [middleware](https://ai-sdk.dev/docs/ai-sdk-core/middleware) in your application.

## [Custom Providers](#custom-providers)

You can create a [custom provider](https://ai-sdk.dev/docs/reference/ai-sdk-core/custom-provider) using `customProvider`.

### [Example: custom model settings](#example-custom-model-settings)

You might want to override the default model settings for a provider or provide model name aliases with pre-configured settings.

```
1import {2 gateway,3 customProvider,4 defaultSettingsMiddleware,5 wrapLanguageModel,6} from 'ai';7
8// custom provider with different provider options:9export const openai = customProvider({10 languageModels: {11 // replacement model with custom provider options:12 'gpt-5.1': wrapLanguageModel({13 model: gateway('openai/gpt-5.1'),14 middleware: defaultSettingsMiddleware({15 settings: {16 providerOptions: {17 openai: {18 reasoningEffort: 'high',19 },20 },21 },22 }),23 }),24 // alias model with custom provider options:25 'gpt-5.1-high-reasoning': wrapLanguageModel({26 model: gateway('openai/gpt-5.1'),27 middleware: defaultSettingsMiddleware({28 settings: {29 providerOptions: {30 openai: {31 reasoningEffort: 'high',32 },33 },34 },35 }),36 }),37 },38 fallbackProvider: gateway,39});
```

### [Example: model name alias](#example-model-name-alias)

You can also provide model name aliases, so you can update the model version in one place in the future:

```
1import { customProvider, gateway } from 'ai';2
3// custom provider with alias names:4export const anthropic = customProvider({5 languageModels: {6 opus: gateway('anthropic/claude-opus-4.1'),7 sonnet: gateway('anthropic/claude-sonnet-4.5'),8 haiku: gateway('anthropic/claude-haiku-4.5'),9 },10 fallbackProvider: gateway,11});
```

### [Example: limit available models](#example-limit-available-models)

You can limit the available models in the system, even if you have multiple providers.

```
1import {2 customProvider,3 defaultSettingsMiddleware,4 wrapLanguageModel,5 gateway,6} from 'ai';7
8export const myProvider = customProvider({9 languageModels: {10 'text-medium': gateway('anthropic/claude-3-5-sonnet-20240620'),11 'text-small': gateway('openai/gpt-5-mini'),12 'reasoning-medium': wrapLanguageModel({13 model: gateway('openai/gpt-5.1'),14 middleware: defaultSettingsMiddleware({15 settings: {16 providerOptions: {17 openai: {18 reasoningEffort: 'high',19 },20 },21 },22 }),23 }),24 'reasoning-fast': wrapLanguageModel({25 model: gateway('openai/gpt-5.1'),26 middleware: defaultSettingsMiddleware({27 settings: {28 providerOptions: {29 openai: {30 reasoningEffort: 'low',31 },32 },33 },34 }),35 }),36 },37 embeddingModels: {38 embedding: gateway.embeddingModel('openai/text-embedding-3-small'),39 },40 // no fallback provider41});
```

## [Provider Registry](#provider-registry)

You can create a [provider registry](https://ai-sdk.dev/docs/reference/ai-sdk-core/provider-registry) with multiple providers and models using `createProviderRegistry`.

### [Setup](#setup)

```
1import { anthropic } from '@ai-sdk/anthropic';2import { openai } from '@ai-sdk/openai';3import { createProviderRegistry, gateway } from 'ai';4
5export const registry = createProviderRegistry({6 // register provider with prefix and default setup using gateway:7 gateway,8
9 // register provider with prefix and direct provider import:10 anthropic,11 openai,12});
```

### [Setup with Custom Separator](#setup-with-custom-separator)

By default, the registry uses `:` as the separator between provider and model IDs. You can customize this separator:

```
1import { anthropic } from '@ai-sdk/anthropic';2import { openai } from '@ai-sdk/openai';3import { createProviderRegistry, gateway } from 'ai';4
5export const customSeparatorRegistry = createProviderRegistry(6 {7 gateway,8 anthropic,9 openai,10 },11 { separator: ' > ' },12);
```

### [Example: Use language models](#example-use-language-models)

You can access language models by using the `languageModel` method on the registry. The provider id will become the prefix of the model id: `providerId:modelId`.

```
1import { generateText } from 'ai';2import { registry } from './registry';3
4const { text } = await generateText({5 model: registry.languageModel('openai:gpt-5.1'), // default separator6 // or with custom separator:7 // model: customSeparatorRegistry.languageModel('openai > gpt-5.1'),8 prompt: 'Invent a new holiday and describe its traditions.',9});
```

### [Example: Use text embedding models](#example-use-text-embedding-models)

You can access text embedding models by using the `.embeddingModel` method on the registry. The provider id will become the prefix of the model id: `providerId:modelId`.

```
1import { embed } from 'ai';2import { registry } from './registry';3
4const { embedding } = await embed({5 model: registry.embeddingModel('openai:text-embedding-3-small'),6 value: 'sunny day at the beach',7});
```

### [Example: Use image models](#example-use-image-models)

You can access image models by using the `imageModel` method on the registry. The provider id will become the prefix of the model id: `providerId:modelId`.

```
1import { generateImage } from 'ai';2import { registry } from './registry';3
4const { image } = await generateImage({5 model: registry.imageModel('openai:dall-e-3'),6 prompt: 'A beautiful sunset over a calm ocean',7});
```

## [Combining Custom Providers, Provider Registry, and Middleware](#combining-custom-providers-provider-registry-and-middleware)

The central idea of provider management is to set up a file that contains all the providers and models you want to use. You may want to pre-configure model settings, provide model name aliases, limit the available models, and more.

Here is an example that implements the following concepts:

* pass through gateway with a namespace prefix (here: `gateway > *`)
* pass through a full provider with a namespace prefix (here: `xai > *`)
* setup an OpenAI-compatible provider with custom api key and base URL (here: `custom > *`)
* setup model name aliases (here: `anthropic > fast`, `anthropic > writing`, `anthropic > reasoning`)
* pre-configure model settings (here: `anthropic > reasoning`)
* validate the provider-specific options (here: `AnthropicLanguageModelOptions`)
* use a fallback provider (here: `anthropic > *`)
* limit a provider to certain models without a fallback (here: `groq > gemma2-9b-it`, `groq > qwen-qwq-32b`)
* define a custom separator for the provider registry (here: `>`)

```
1import { anthropic, AnthropicLanguageModelOptions } from '@ai-sdk/anthropic';2import { createOpenAICompatible } from '@ai-sdk/openai-compatible';3import { xai } from '@ai-sdk/xai';4import { groq } from '@ai-sdk/groq';5import {6 createProviderRegistry,7 customProvider,8 defaultSettingsMiddleware,9 gateway,10 wrapLanguageModel,11} from 'ai';12
13export const registry = createProviderRegistry(14 {15 // pass through gateway with a namespace prefix16 gateway,17
18 // pass through full providers with namespace prefixes19 xai,20
21 // access an OpenAI-compatible provider with custom setup22 custom: createOpenAICompatible({23 name: 'provider-name',24 apiKey: process.env.CUSTOM_API_KEY,25 baseURL: 'https://api.custom.com/v1',26 }),27
28 // setup model name aliases29 anthropic: customProvider({30 languageModels: {31 fast: anthropic('claude-haiku-4-5'),32
33 // simple model34 writing: anthropic('claude-sonnet-4-5'),35
36 // extended reasoning model configuration:37 reasoning: wrapLanguageModel({38 model: anthropic('claude-sonnet-4-5'),39 middleware: defaultSettingsMiddleware({40 settings: {41 maxOutputTokens: 100000, // example default setting42 providerOptions: {43 anthropic: {44 thinking: {45 type: 'enabled',46 budgetTokens: 32000,47 },48 } satisfies AnthropicLanguageModelOptions,49 },50 },51 }),52 }),53 },54 fallbackProvider: anthropic,55 }),56
57 // limit a provider to certain models without a fallback58 groq: customProvider({59 languageModels: {60 'gemma2-9b-it': groq('gemma2-9b-it'),61 'qwen-qwq-32b': groq('qwen-qwq-32b'),62 },63 }),64 },65 { separator: ' > ' },66);67
68// usage:69const model = registry.languageModel('anthropic > reasoning');
```

## [Global Provider Configuration](#global-provider-configuration)

The AI SDK 5 includes a global provider feature that allows you to specify a model using just a plain model ID string:

```
1import { streamText } from 'ai';2
3const result = await streamText({4 model: "anthropic/claude-sonnet-4.5", // Uses the global provider (defaults to gateway)5 prompt: 'Invent a new holiday and describe its traditions.',6});
```

By default, the global provider is set to the Vercel AI Gateway.

### [Customizing the Global Provider](#customizing-the-global-provider)

You can set your own preferred global provider:

```
1import { openai } from '@ai-sdk/openai';2
3// Initialize once during startup:4globalThis.AI_SDK_DEFAULT_PROVIDER = openai;
```

```
1import { streamText } from 'ai';2
3const result = await streamText({4 model: 'gpt-5.1', // Uses OpenAI provider without prefix5 prompt: 'Invent a new holiday and describe its traditions.',6});
```

This simplifies provider usage and makes it easier to switch between providers without changing your model references throughout your codebase.

---
url: https://ai-sdk.dev/docs/ai-sdk-core/error-handling
title: "AI SDK Core: Error Handling"
description: "Learn how to handle errors in the AI SDK Core"
hash: "c576ec2c2ce224879e3d306f85d5de21d28789dd89627cc4bf299401d90518ff"
crawledAt: 2026-03-07T08:00:59.735Z
depth: 2
---

## [Handling regular errors](#handling-regular-errors)

Regular errors are thrown and can be handled using the `try/catch` block.

```
1import { generateText } from 'ai';2
3try {4 const { text } = await generateText({5 model: "anthropic/claude-sonnet-4.5",6 prompt: 'Write a vegetarian lasagna recipe for 4 people.',7 });8} catch (error) {9 // handle error10}
```

See [Error Types](https://ai-sdk.dev/docs/reference/ai-sdk-errors) for more information on the different types of errors that may be thrown.

## [Handling streaming errors (simple streams)](#handling-streaming-errors-simple-streams)

When errors occur during streams that do not support error chunks, the error is thrown as a regular error. You can handle these errors using the `try/catch` block.

```
1import { streamText } from 'ai';2
3try {4 const { textStream } = streamText({5 model: "anthropic/claude-sonnet-4.5",6 prompt: 'Write a vegetarian lasagna recipe for 4 people.',7 });8
9 for await (const textPart of textStream) {10 process.stdout.write(textPart);11 }12} catch (error) {13 // handle error14}
```

## [Handling streaming errors (streaming with `error` support)](#handling-streaming-errors-streaming-with-error-support)

Full streams support error parts. You can handle those parts similar to other parts. It is recommended to also add a try-catch block for errors that happen outside of the streaming.

```
1import { streamText } from 'ai';2
3try {4 const { fullStream } = streamText({5 model: "anthropic/claude-sonnet-4.5",6 prompt: 'Write a vegetarian lasagna recipe for 4 people.',7 });8
9 for await (const part of fullStream) {10 switch (part.type) {11 //... handle other part types12
13 case 'error': {14 const error = part.error;15 // handle error16 break;17 }18
19 case 'abort': {20 // handle stream abort21 break;22 }23
24 case 'tool-error': {25 const error = part.error;26 // handle error27 break;28 }29 }30 }31} catch (error) {32 // handle error33}
```

## [Handling stream aborts](#handling-stream-aborts)

When streams are aborted (e.g., via chat stop button), you may want to perform cleanup operations like updating stored messages in your UI. Use the `onAbort` callback to handle these cases.

The `onAbort` callback is called when a stream is aborted via `AbortSignal`, but `onFinish` is not called. This ensures you can still update your UI state appropriately.

```
1import { streamText } from 'ai';2
3const { textStream } = streamText({4 model: "anthropic/claude-sonnet-4.5",5 prompt: 'Write a vegetarian lasagna recipe for 4 people.',6 onAbort: ({ steps }) => {7 // Update stored messages or perform cleanup8 console.log('Stream aborted after', steps.length, 'steps');9 },10 onFinish: ({ steps, totalUsage }) => {11 // This is called on normal completion12 console.log('Stream completed normally');13 },14});15
16for await (const textPart of textStream) {17 process.stdout.write(textPart);18}
```

The `onAbort` callback receives:

* `steps`: An array of all completed steps before the abort

You can also handle abort events directly in the stream:

```
1import { streamText } from 'ai';2
3const { fullStream } = streamText({4 model: "anthropic/claude-sonnet-4.5",5 prompt: 'Write a vegetarian lasagna recipe for 4 people.',6});7
8for await (const chunk of fullStream) {9 switch (chunk.type) {10 case 'abort': {11 // Handle abort directly in stream12 console.log('Stream was aborted');13 break;14 }15 //... handle other part types16 }17}
```

---
url: https://ai-sdk.dev/docs/ai-sdk-core/testing
title: "AI SDK Core: Testing"
description: "Learn how to use AI SDK Core mock providers for testing."
hash: "cdd7c261eabf09f8343148b2dc0b1000b22d15d43312e7b13e072d0e7f7cbe54"
crawledAt: 2026-03-07T08:01:05.185Z
depth: 2
---

Testing language models can be challenging, because they are non-deterministic and calling them is slow and expensive.

To enable you to unit test your code that uses the AI SDK, the AI SDK Core includes mock providers and test helpers. You can import the following helpers from `ai/test`:

* `MockEmbeddingModelV3`: A mock embedding model using the [embedding model v3 specification](https://github.com/vercel/ai/blob/main/packages/provider/src/embedding-model/v3/embedding-model-v3.ts).
* `MockLanguageModelV3`: A mock language model using the [language model v3 specification](https://github.com/vercel/ai/blob/main/packages/provider/src/language-model/v3/language-model-v3.ts).
* `mockId`: Provides an incrementing integer ID.
* `mockValues`: Iterates over an array of values with each call. Returns the last value when the array is exhausted.

You can also import [`simulateReadableStream`](https://ai-sdk.dev/docs/reference/ai-sdk-core/simulate-readable-stream) from `ai` to simulate a readable stream with delays.

With mock providers and test helpers, you can control the output of the AI SDK and test your code in a repeatable and deterministic way without actually calling a language model provider.

## [Examples](#examples)

You can use the test helpers with the AI Core functions in your unit tests:

### [generateText](#generatetext)

```
1import { generateText } from 'ai';2import { MockLanguageModelV3 } from 'ai/test';3
4const result = await generateText({5 model: new MockLanguageModelV3({6 doGenerate: async () => ({7 content: [{ type: 'text', text: `Hello, world!` }],8 finishReason: { unified: 'stop', raw: undefined },9 usage: {10 inputTokens: {11 total: 10,12 noCache: 10,13 cacheRead: undefined,14 cacheWrite: undefined,15 },16 outputTokens: {17 total: 20,18 text: 20,19 reasoning: undefined,20 },21 },22 warnings: [],23 }),24 }),25 prompt: 'Hello, test!',26});
```

### [streamText](#streamtext)

```
1import { streamText, simulateReadableStream } from 'ai';2import { MockLanguageModelV3 } from 'ai/test';3
4const result = streamText({5 model: new MockLanguageModelV3({6 doStream: async () => ({7 stream: simulateReadableStream({8 chunks: [9 { type: 'text-start', id: 'text-1' },10 { type: 'text-delta', id: 'text-1', delta: 'Hello' },11 { type: 'text-delta', id: 'text-1', delta: ', ' },12 { type: 'text-delta', id: 'text-1', delta: 'world!' },13 { type: 'text-end', id: 'text-1' },14 {15 type: 'finish',16 finishReason: { unified: 'stop', raw: undefined },17 logprobs: undefined,18 usage: {19 inputTokens: {20 total: 3,21 noCache: 3,22 cacheRead: undefined,23 cacheWrite: undefined,24 },25 outputTokens: {26 total: 10,27 text: 10,28 reasoning: undefined,29 },30 },31 },32 ],33 }),34 }),35 }),36 prompt: 'Hello, test!',37});
```

### [generateText with Output](#generatetext-with-output)

```
1import { generateText, Output } from 'ai';2import { MockLanguageModelV3 } from 'ai/test';3import { z } from 'zod';4
5const result = await generateText({6 model: new MockLanguageModelV3({7 doGenerate: async () => ({8 content: [{ type: 'text', text: `{"content":"Hello, world!"}` }],9 finishReason: { unified: 'stop', raw: undefined },10 usage: {11 inputTokens: {12 total: 10,13 noCache: 10,14 cacheRead: undefined,15 cacheWrite: undefined,16 },17 outputTokens: {18 total: 20,19 text: 20,20 reasoning: undefined,21 },22 },23 warnings: [],24 }),25 }),26 output: Output.object({ schema: z.object({ content: z.string() }) }),27 prompt: 'Hello, test!',28});
```

### [streamText with Output](#streamtext-with-output)

```
1import { streamText, Output, simulateReadableStream } from 'ai';2import { MockLanguageModelV3 } from 'ai/test';3import { z } from 'zod';4
5const result = streamText({6 model: new MockLanguageModelV3({7 doStream: async () => ({8 stream: simulateReadableStream({9 chunks: [10 { type: 'text-start', id: 'text-1' },11 { type: 'text-delta', id: 'text-1', delta: '{ ' },12 { type: 'text-delta', id: 'text-1', delta: '"content": ' },13 { type: 'text-delta', id: 'text-1', delta: `"Hello, ` },14 { type: 'text-delta', id: 'text-1', delta: `world` },15 { type: 'text-delta', id: 'text-1', delta: `!"` },16 { type: 'text-delta', id: 'text-1', delta: ' }' },17 { type: 'text-end', id: 'text-1' },18 {19 type: 'finish',20 finishReason: { unified: 'stop', raw: undefined },21 logprobs: undefined,22 usage: {23 inputTokens: {24 total: 3,25 noCache: 3,26 cacheRead: undefined,27 cacheWrite: undefined,28 },29 outputTokens: {30 total: 10,31 text: 10,32 reasoning: undefined,33 },34 },35 },36 ],37 }),38 }),39 }),40 output: Output.object({ schema: z.object({ content: z.string() }) }),41 prompt: 'Hello, test!',42});
```

### [Simulate UI Message Stream Responses](#simulate-ui-message-stream-responses)

You can also simulate [UI Message Stream](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol#ui-message-stream) responses for testing, debugging, or demonstration purposes.

Here is a Next example:

route.ts

```
1import { simulateReadableStream } from 'ai';2
3export async function POST(req: Request) {4 return new Response(5 simulateReadableStream({6 initialDelayInMs: 1000, // Delay before the first chunk7 chunkDelayInMs: 300, // Delay between chunks8 chunks: [9 `data: {"type":"start","messageId":"msg-123"}\n\n`,10 `data: {"type":"text-start","id":"text-1"}\n\n`,11 `data: {"type":"text-delta","id":"text-1","delta":"This"}\n\n`,12 `data: {"type":"text-delta","id":"text-1","delta":" is an"}\n\n`,13 `data: {"type":"text-delta","id":"text-1","delta":" example."}\n\n`,14 `data: {"type":"text-end","id":"text-1"}\n\n`,15 `data: {"type":"finish"}\n\n`,16 `data: [DONE]\n\n`,17 ],18 }).pipeThrough(new TextEncoderStream()),19 {20 status: 200,21 headers: {22 'Content-Type': 'text/event-stream',23 'Cache-Control': 'no-cache',24 Connection: 'keep-alive',25 'x-vercel-ai-ui-message-stream': 'v1',26 },27 },28 );29}
```

---
url: https://ai-sdk.dev/docs/ai-sdk-core/telemetry
title: "AI SDK Core: Telemetry"
description: "Using OpenTelemetry with AI SDK Core"
hash: "4c455be92749365b7f573da2fb91a89c4b0ac8863e0a878621dcd52d35d6ae6c"
crawledAt: 2026-03-07T08:01:10.632Z
depth: 2
---

AI SDK Telemetry is experimental and may change in the future.

The AI SDK uses [OpenTelemetry](https://opentelemetry.io/) to collect telemetry data. OpenTelemetry is an open-source observability framework designed to provide standardized instrumentation for collecting telemetry data.

Check out the [AI SDK Observability Integrations](https://ai-sdk.dev/providers/observability) to see providers that offer monitoring and tracing for AI SDK applications.

## [Enabling telemetry](#enabling-telemetry)

For Next.js applications, please follow the [Next.js OpenTelemetry guide](https://nextjs.org/docs/app/building-your-application/optimizing/open-telemetry) to enable telemetry first.

You can then use the `experimental_telemetry` option to enable telemetry on specific function calls while the feature is experimental:

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 prompt: 'Write a short story about a cat.',4 experimental_telemetry: { isEnabled: true },5});
```

When telemetry is enabled, you can also control if you want to record the input values and the output values for the function. By default, both are enabled. You can disable them by setting the `recordInputs` and `recordOutputs` options to `false`.

Disabling the recording of inputs and outputs can be useful for privacy, data transfer, and performance reasons. You might for example want to disable recording inputs if they contain sensitive information.

You can provide a `functionId` to identify the function that the telemetry data is for, and `metadata` to include additional information in the telemetry data.

```
1const result = await generateText({2 model: "anthropic/claude-sonnet-4.5",3 prompt: 'Write a short story about a cat.',4 experimental_telemetry: {5 isEnabled: true,6 functionId: 'my-awesome-function',7 metadata: {8 something: 'custom',9 someOtherThing: 'other-value',10 },11 },12});
```

## [Custom Tracer](#custom-tracer)

You may provide a `tracer` which must return an OpenTelemetry `Tracer`. This is useful in situations where you want your traces to use a `TracerProvider` other than the one provided by the `@opentelemetry/api` singleton.

```
1const tracerProvider = new NodeTracerProvider();2const result = await generateText({3 model: "anthropic/claude-sonnet-4.5",4 prompt: 'Write a short story about a cat.',5 experimental_telemetry: {6 isEnabled: true,7 tracer: tracerProvider.getTracer('ai'),8 },9});
```

## [Telemetry Integrations](#telemetry-integrations)

Telemetry integrations let you hook into the generation lifecycle to build custom observability — logging, analytics, DevTools, or any other monitoring system. Instead of wiring up individual callbacks on every call, you implement a `TelemetryIntegration` once and pass it via `experimental_telemetry.integrations`.

### [Using an integration](#using-an-integration)

Pass one or more integrations to any `generateText` or `streamText` call:

```
1import { streamText } from 'ai';2import { devToolsIntegration } from '@ai-sdk/devtools';3
4const result = streamText({5 model: openai('gpt-4o'),6 prompt: 'Hello!',7 experimental_telemetry: {8 isEnabled: true,9 integrations: [devToolsIntegration()],10 },11});
```

You can combine multiple integrations — they all receive the same lifecycle events:

```
1experimental_telemetry: {2 isEnabled: true,3 integrations: [devToolsIntegration(), otelIntegration(), customLogger()],4},
```

Errors inside integrations are caught and do not break the generation flow.

### [Building a custom integration](#building-a-custom-integration)

Implement the `TelemetryIntegration` interface from the `ai` package. All methods are optional — implement only the lifecycle events you care about:

```
1import type { TelemetryIntegration } from 'ai';2import { bindTelemetryIntegration } from 'ai';3
4class MyIntegration implements TelemetryIntegration {5 async onStart(event) {6 console.log('Generation started:', event.model.modelId);7 }8
9 async onStepFinish(event) {10 console.log(11 `Step ${event.stepNumber} done:`,12 event.usage.totalTokens,13 'tokens',14 );15 }16
17 async onToolCallFinish(event) {18 if (event.success) {19 console.log(20 `Tool "${event.toolCall.toolName}" took ${event.durationMs}ms`,21 );22 } else {23 console.error(`Tool "${event.toolCall.toolName}" failed:`, event.error);24 }25 }26
27 async onFinish(event) {28 console.log('Done. Total tokens:', event.totalUsage.totalTokens);29 }30}31
32export function myIntegration(): TelemetryIntegration {33 return bindTelemetryIntegration(new MyIntegration());34}
```

Use `bindTelemetryIntegration` for class-based integrations to ensure `this` is correctly bound when methods are extracted and called as callbacks.

### [Available lifecycle methods](#available-lifecycle-methods)

### onStart:

(event: OnStartEvent) => void | PromiseLike<void>

Called when the generation operation begins, before any LLM calls.

### onStepStart:

(event: OnStepStartEvent) => void | PromiseLike<void>

Called when a step (LLM call) begins, before the provider is called.

### onToolCallStart:

(event: OnToolCallStartEvent) => void | PromiseLike<void>

Called when a tool's execute function is about to run.

### onToolCallFinish:

(event: OnToolCallFinishEvent) => void | PromiseLike<void>

Called when a tool's execute function completes or errors.

### onStepFinish:

(event: OnStepFinishEvent) => void | PromiseLike<void>

Called when a step (LLM call) completes.

### onFinish:

(event: OnFinishEvent) => void | PromiseLike<void>

Called when the entire generation completes (all steps finished).

The event types for each method are the same as the corresponding [event callbacks](https://ai-sdk.dev/docs/ai-sdk-core/event-listeners). See the event callbacks documentation for the full property reference of each event.

## [Collected Data](#collected-data)

### [generateText function](#generatetext-function)

`generateText` records 3 types of spans:

* `ai.generateText` (span): the full length of the generateText call. It contains 1 or more `ai.generateText.doGenerate` spans. It contains the [basic LLM span information](#basic-llm-span-information) and the following attributes:
 
 * `operation.name`: `ai.generateText` and the functionId that was set through `telemetry.functionId`
 * `ai.operationId`: `"ai.generateText"`
 * `ai.prompt`: the prompt that was used when calling `generateText`
 * `ai.response.text`: the text that was generated
 * `ai.response.toolCalls`: the tool calls that were made as part of the generation (stringified JSON)
 * `ai.response.finishReason`: the reason why the generation finished
 * `ai.settings.maxOutputTokens`: the maximum number of output tokens that were set
* `ai.generateText.doGenerate` (span): a provider doGenerate call. It can contain `ai.toolCall` spans. It contains the [call LLM span information](#call-llm-span-information) and the following attributes:
 
 * `operation.name`: `ai.generateText.doGenerate` and the functionId that was set through `telemetry.functionId`
 * `ai.operationId`: `"ai.generateText.doGenerate"`
 * `ai.prompt.messages`: the messages that were passed into the provider
 * `ai.prompt.tools`: array of stringified tool definitions. The tools can be of type `function` or `provider-defined-client`. Function tools have a `name`, `description` (optional), and `inputSchema` (JSON schema). Provider-defined-client tools have a `name`, `id`, and `input` (Record).
 * `ai.prompt.toolChoice`: the stringified tool choice setting (JSON). It has a `type` property (`auto`, `none`, `required`, `tool`), and if the type is `tool`, a `toolName` property with the specific tool.
 * `ai.response.text`: the text that was generated
 * `ai.response.toolCalls`: the tool calls that were made as part of the generation (stringified JSON)
 * `ai.response.finishReason`: the reason why the generation finished
* `ai.toolCall` (span): a tool call that is made as part of the generateText call. See [Tool call spans](#tool-call-spans) for more details.
 

### [streamText function](#streamtext-function)

`streamText` records 3 types of spans and 2 types of events:

* `ai.streamText` (span): the full length of the streamText call. It contains a `ai.streamText.doStream` span. It contains the [basic LLM span information](#basic-llm-span-information) and the following attributes:
 
 * `operation.name`: `ai.streamText` and the functionId that was set through `telemetry.functionId`
 * `ai.operationId`: `"ai.streamText"`
 * `ai.prompt`: the prompt that was used when calling `streamText`
 * `ai.response.text`: the text that was generated
 * `ai.response.toolCalls`: the tool calls that were made as part of the generation (stringified JSON)
 * `ai.response.finishReason`: the reason why the generation finished
 * `ai.settings.maxOutputTokens`: the maximum number of output tokens that were set
* `ai.streamText.doStream` (span): a provider doStream call. This span contains an `ai.stream.firstChunk` event and `ai.toolCall` spans. It contains the [call LLM span information](#call-llm-span-information) and the following attributes:
 
 * `operation.name`: `ai.streamText.doStream` and the functionId that was set through `telemetry.functionId`
 * `ai.operationId`: `"ai.streamText.doStream"`
 * `ai.prompt.messages`: the messages that were passed into the provider
 * `ai.prompt.tools`: array of stringified tool definitions. The tools can be of type `function` or `provider-defined-client`. Function tools have a `name`, `description` (optional), and `inputSchema` (JSON schema). Provider-defined-client tools have a `name`, `id`, and `input` (Record).
 * `ai.prompt.toolChoice`: the stringified tool choice setting (JSON). It has a `type` property (`auto`, `none`, `required`, `tool`), and if the type is `tool`, a `toolName` property with the specific tool.
 * `ai.response.text`: the text that was generated
 * `ai.response.toolCalls`: the tool calls that were made as part of the generation (stringified JSON)
 * `ai.response.msToFirstChunk`: the time it took to receive the first chunk in milliseconds
 * `ai.response.msToFinish`: the time it took to receive the finish part of the LLM stream in milliseconds
 * `ai.response.avgCompletionTokensPerSecond`: the average number of completion tokens per second
 * `ai.response.finishReason`: the reason why the generation finished
* `ai.toolCall` (span): a tool call that is made as part of the generateText call. See [Tool call spans](#tool-call-spans) for more details.
 
* `ai.stream.firstChunk` (event): an event that is emitted when the first chunk of the stream is received.
 
 * `ai.response.msToFirstChunk`: the time it took to receive the first chunk
* `ai.stream.finish` (event): an event that is emitted when the finish part of the LLM stream is received.
 

It also records a `ai.stream.firstChunk` event when the first chunk of the stream is received.

### [Deprecated object APIs](#deprecated-object-apis)

`generateObject` and `streamObject` are deprecated. Use `generateText` and `streamText` with the `output` property instead.

If you still run deprecated object APIs, you will see legacy span names:

* `generateObject`: `ai.generateObject`, `ai.generateObject.doGenerate`
* `streamObject`: `ai.streamObject`, `ai.streamObject.doStream`, `ai.stream.firstChunk`

Legacy object spans include the same core metadata as other LLM spans, plus object-specific attributes such as `ai.schema.*`, `ai.response.object`, and `ai.settings.output`.

### [embed function](#embed-function)

`embed` records 2 types of spans:

* `ai.embed` (span): the full length of the embed call. It contains 1 `ai.embed.doEmbed` spans. It contains the [basic embedding span information](#basic-embedding-span-information) and the following attributes:
 
 * `operation.name`: `ai.embed` and the functionId that was set through `telemetry.functionId`
 * `ai.operationId`: `"ai.embed"`
 * `ai.value`: the value that was passed into the `embed` function
 * `ai.embedding`: a JSON-stringified embedding
* `ai.embed.doEmbed` (span): a provider doEmbed call. It contains the [basic embedding span information](#basic-embedding-span-information) and the following attributes:
 
 * `operation.name`: `ai.embed.doEmbed` and the functionId that was set through `telemetry.functionId`
 * `ai.operationId`: `"ai.embed.doEmbed"`
 * `ai.values`: the values that were passed into the provider (array)
 * `ai.embeddings`: an array of JSON-stringified embeddings

### [embedMany function](#embedmany-function)

`embedMany` records 2 types of spans:

* `ai.embedMany` (span): the full length of the embedMany call. It contains 1 or more `ai.embedMany.doEmbed` spans. It contains the [basic embedding span information](#basic-embedding-span-information) and the following attributes:
 
 * `operation.name`: `ai.embedMany` and the functionId that was set through `telemetry.functionId`
 * `ai.operationId`: `"ai.embedMany"`
 * `ai.values`: the values that were passed into the `embedMany` function
 * `ai.embeddings`: an array of JSON-stringified embedding
* `ai.embedMany.doEmbed` (span): a provider doEmbed call. It contains the [basic embedding span information](#basic-embedding-span-information) and the following attributes:
 
 * `operation.name`: `ai.embedMany.doEmbed` and the functionId that was set through `telemetry.functionId`
 * `ai.operationId`: `"ai.embedMany.doEmbed"`
 * `ai.values`: the values that were sent to the provider
 * `ai.embeddings`: an array of JSON-stringified embeddings for each value

## [Span Details](#span-details)

### [Basic LLM span information](#basic-llm-span-information)

Many spans that use LLMs (`ai.generateText`, `ai.generateText.doGenerate`, `ai.streamText`, `ai.streamText.doStream`) contain the following attributes:

* `resource.name`: the functionId that was set through `telemetry.functionId`
* `ai.model.id`: the id of the model
* `ai.model.provider`: the provider of the model
* `ai.request.headers.*`: the request headers that were passed in through `headers`
* `ai.response.providerMetadata`: provider specific metadata returned with the generation response
* `ai.settings.maxRetries`: the maximum number of retries that were set
* `ai.telemetry.functionId`: the functionId that was set through `telemetry.functionId`
* `ai.telemetry.metadata.*`: the metadata that was passed in through `telemetry.metadata`
* `ai.usage.completionTokens`: the number of completion tokens that were used
* `ai.usage.promptTokens`: the number of prompt tokens that were used

### [Call LLM span information](#call-llm-span-information)

Spans that correspond to individual LLM calls (`ai.generateText.doGenerate`, `ai.streamText.doStream`) contain [basic LLM span information](#basic-llm-span-information) and the following attributes:

* `ai.response.model`: the model that was used to generate the response. This can be different from the model that was requested if the provider supports aliases.
* `ai.response.id`: the id of the response. Uses the ID from the provider when available.
* `ai.response.timestamp`: the timestamp of the response. Uses the timestamp from the provider when available.
* [Semantic Conventions for GenAI operations](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/)
 * `gen_ai.system`: the provider that was used
 * `gen_ai.request.model`: the model that was requested
 * `gen_ai.request.temperature`: the temperature that was set
 * `gen_ai.request.max_tokens`: the maximum number of tokens that were set
 * `gen_ai.request.frequency_penalty`: the frequency penalty that was set
 * `gen_ai.request.presence_penalty`: the presence penalty that was set
 * `gen_ai.request.top_k`: the topK parameter value that was set
 * `gen_ai.request.top_p`: the topP parameter value that was set
 * `gen_ai.request.stop_sequences`: the stop sequences
 * `gen_ai.response.finish_reasons`: the finish reasons that were returned by the provider
 * `gen_ai.response.model`: the model that was used to generate the response. This can be different from the model that was requested if the provider supports aliases.
 * `gen_ai.response.id`: the id of the response. Uses the ID from the provider when available.
 * `gen_ai.usage.input_tokens`: the number of prompt tokens that were used
 * `gen_ai.usage.output_tokens`: the number of completion tokens that were used

### [Basic embedding span information](#basic-embedding-span-information)

Many spans that use embedding models (`ai.embed`, `ai.embed.doEmbed`, `ai.embedMany`, `ai.embedMany.doEmbed`) contain the following attributes:

* `ai.model.id`: the id of the model
* `ai.model.provider`: the provider of the model
* `ai.request.headers.*`: the request headers that were passed in through `headers`
* `ai.settings.maxRetries`: the maximum number of retries that were set
* `ai.telemetry.functionId`: the functionId that was set through `telemetry.functionId`
* `ai.telemetry.metadata.*`: the metadata that was passed in through `telemetry.metadata`
* `ai.usage.tokens`: the number of tokens that were used
* `resource.name`: the functionId that was set through `telemetry.functionId`

### [Tool call spans](#tool-call-spans)

Tool call spans (`ai.toolCall`) contain the following attributes:

* `operation.name`: `"ai.toolCall"`
* `ai.operationId`: `"ai.toolCall"`
* `ai.toolCall.name`: the name of the tool
* `ai.toolCall.id`: the id of the tool call
* `ai.toolCall.args`: the input parameters of the tool call
* `ai.toolCall.result`: the output result of the tool call. Only available if the tool call is successful and the result is serializable.

---
url: https://ai-sdk.dev/docs/ai-sdk-core/devtools
title: "AI SDK Core: DevTools"
description: "Debug and inspect AI SDK applications with DevTools"
hash: "1a62d7cacd3035f44ff620e081ca0e03ff6179fb1fd6c8d74e03177d460b2a09"
crawledAt: 2026-03-07T08:01:17.764Z
depth: 2
---

AI SDK DevTools is experimental and intended for local development only. Do not use in production environments.

AI SDK DevTools gives you full visibility over your AI SDK calls with [`generateText`](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text), [`streamText`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text), and [`ToolLoopAgent`](https://ai-sdk.dev/docs/reference/ai-sdk-core/tool-loop-agent). It helps you debug and inspect LLM requests, responses, tool calls, and multi-step interactions through a web-based UI.

DevTools is composed of two parts:

1. **Middleware**: Captures runs and steps from your AI SDK calls
2. **Viewer**: A web UI to inspect the captured data

## [Installation](#installation)

Install the DevTools package:

```
1pnpm add @ai-sdk/devtools
```

## [Requirements](#requirements)

* AI SDK v6 beta (`ai@^6.0.0-beta.0`)
* Node.js compatible runtime

## [Using DevTools](#using-devtools)

### [Add the middleware](#add-the-middleware)

Wrap your language model with the DevTools middleware using [`wrapLanguageModel`](https://ai-sdk.dev/docs/ai-sdk-core/middleware):

```
1import { wrapLanguageModel, gateway } from 'ai';2import { devToolsMiddleware } from '@ai-sdk/devtools';3
4const model = wrapLanguageModel({5 model: gateway('anthropic/claude-sonnet-4.5'),6 middleware: devToolsMiddleware(),7});
```

The wrapped model can be used with any AI SDK Core function:

```
1import { generateText } from 'ai';2
3const result = await generateText({4 model, // wrapped model with DevTools5 prompt: 'What cities are in the United States?',6});
```

### [Launch the viewer](#launch-the-viewer)

Start the DevTools viewer:

```
1npx @ai-sdk/devtools
```

Open [http://localhost:4983](http://localhost:4983/) to view your AI SDK interactions.

## [Captured data](#captured-data)

The DevTools middleware captures the following information from your AI SDK calls:

* **Input parameters and prompts**: View the complete input sent to your LLM
* **Output content and tool calls**: Inspect generated text and tool invocations
* **Token usage and timing**: Monitor resource consumption and performance
* **Raw provider data**: Access complete request and response payloads

### [Runs and steps](#runs-and-steps)

DevTools organizes captured data into runs and steps:

* **Run**: A complete multi-step AI interaction, grouped by the initial prompt
* **Step**: A single LLM call within a run (e.g., one `generateText` or `streamText` call)

Multi-step interactions, such as those created by tool calling or agent loops, are grouped together as a single run with multiple steps.

## [How it works](#how-it-works)

The DevTools middleware intercepts all `generateText` and `streamText` calls through the [language model middleware](https://ai-sdk.dev/docs/ai-sdk-core/middleware) system. Captured data is stored locally in a JSON file (`.devtools/generations.json`) and served through a web UI built with Hono and React.

The middleware automatically adds `.devtools` to your `.gitignore` file. Verify that `.devtools` is in your `.gitignore` to ensure you don't commit sensitive AI interaction data to your repository.

## [Security considerations](#security-considerations)

DevTools stores all AI interactions locally in plain text files, including:

* User prompts and messages
* LLM responses
* Tool call arguments and results
* API request and response data

**Only use DevTools in local development environments.** Do not enable DevTools in production or when handling sensitive data.

---
url: https://ai-sdk.dev/docs/ai-sdk-core/event-listeners
title: "AI SDK Core: Event Callbacks"
description: "Subscribe to lifecycle events in generateText and streamText calls"
hash: "60e34067214a3e974f407eed6e644e7150f32990732dcad87d8d48752318d148"
crawledAt: 2026-03-07T08:01:24.015Z
depth: 2
---

The AI SDK provides per-call event callbacks that you can pass to `generateText` and `streamText` to observe lifecycle events. This is useful for building observability tools, logging systems, analytics, and debugging utilities.

## [Basic Usage](#basic-usage)

Pass callbacks directly to `generateText` or `streamText`:

```
1import { generateText } from 'ai';2
3const result = await generateText({4 model: openai('gpt-4o'),5 prompt: 'What is the weather in San Francisco?',6 experimental_onStart: event => {7 console.log('Generation started:', event.model.modelId);8 },9 onFinish: event => {10 console.log('Generation finished:', event.totalUsage);11 },12});
```

## [Available Callbacks](#available-callbacks)

### experimental\_onStart:

(event: OnStartEvent) => void | Promise<void>

Called when generation begins, before any LLM calls.

### experimental\_onStepStart:

(event: OnStepStartEvent) => void | Promise<void>

Called when a step (LLM call) begins, before the provider is called.

### experimental\_onToolCallStart:

(event: OnToolCallStartEvent) => void | Promise<void>

Called when a tool's execute function is about to run.

### experimental\_onToolCallFinish:

(event: OnToolCallFinishEvent) => void | Promise<void>

Called when a tool's execute function completes or errors.

### onStepFinish:

(event: OnStepFinishEvent) => void | Promise<void>

Called when a step (LLM call) completes.

### onFinish:

(event: OnFinishEvent) => void | Promise<void>

Called when the entire generation completes (all steps finished).

## [Event Reference](#event-reference)

### [`experimental_onStart`](#experimental_onstart)

Called when the generation operation begins, before any LLM calls are made.

```
1const result = await generateText({2 model: openai('gpt-4o'),3 prompt: 'Hello!',4 experimental_onStart: event => {5 console.log('Model:', event.model.modelId);6 console.log('Temperature:', event.temperature);7 },8});
```

### model:

{ provider: string; modelId: string }

The model being used for generation.

### system:

string | SystemModelMessage | Array<SystemModelMessage> | undefined

The system message(s) provided to the model.

### prompt:

string | Array<ModelMessage> | undefined

The prompt string or array of messages if using the prompt option.

### messages:

Array<ModelMessage> | undefined

The messages array if using the messages option.

### tools:

ToolSet | undefined

The tools available for this generation.

### toolChoice:

ToolChoice | undefined

The tool choice strategy for this generation.

### activeTools:

Array<keyof TOOLS> | undefined

Limits which tools are available for the model to call.

### maxOutputTokens:

number | undefined

Maximum number of tokens to generate.

### temperature:

number | undefined

Sampling temperature for generation.

### topP:

number | undefined

Top-p (nucleus) sampling parameter.

### topK:

number | undefined

Top-k sampling parameter.

### presencePenalty:

number | undefined

Presence penalty for generation.

### frequencyPenalty:

number | undefined

Frequency penalty for generation.

### stopSequences:

string\[\] | undefined

Sequences that will stop generation.

### seed:

number | undefined

Random seed for reproducible generation.

### maxRetries:

number

Maximum number of retries for failed requests.

### timeout:

TimeoutConfiguration | undefined

Timeout configuration for the generation.

### providerOptions:

ProviderOptions | undefined

Additional provider-specific options.

### stopWhen:

StopCondition | Array<StopCondition> | undefined

Condition(s) for stopping the generation.

### output:

Output | undefined

The output specification for structured outputs.

### abortSignal:

AbortSignal | undefined

Abort signal for cancelling the operation.

### include:

{ requestBody?: boolean; responseBody?: boolean } | undefined

Settings for controlling what data is included in step results.

### functionId:

string | undefined

Identifier from telemetry settings for grouping related operations.

### experimental\_context:

unknown

User-defined context object that flows through the entire generation lifecycle.

### [`experimental_onStepStart`](#experimental_onstepstart)

Called before each step (LLM call) begins. Useful for tracking multi-step generations.

```
1const result = await generateText({2 model: openai('gpt-4o'),3 prompt: 'Hello!',4 experimental_onStepStart: event => {5 console.log('Step:', event.stepNumber);6 console.log('Messages:', event.messages.length);7 },8});
```

### stepNumber:

number

Zero-based index of the current step.

### model:

{ provider: string; modelId: string }

The model being used for this step.

### system:

string | SystemModelMessage | Array<SystemModelMessage> | undefined

The system message for this step.

### messages:

Array<ModelMessage>

The messages that will be sent to the model for this step.

### tools:

ToolSet | undefined

The tools available for this generation.

### toolChoice:

LanguageModelV3ToolChoice | undefined

The tool choice configuration for this step.

### activeTools:

Array<keyof TOOLS> | undefined

Limits which tools are available for this step.

### steps:

ReadonlyArray<StepResult>

Array of results from previous steps (empty for first step).

### providerOptions:

ProviderOptions | undefined

Additional provider-specific options for this step.

### timeout:

TimeoutConfiguration | undefined

Timeout configuration for the generation.

### stopWhen:

StopCondition | Array<StopCondition> | undefined

Condition(s) for stopping the generation.

### output:

Output | undefined

The output specification for structured outputs.

### abortSignal:

AbortSignal | undefined

Abort signal for cancelling the operation.

### include:

{ requestBody?: boolean; responseBody?: boolean } | undefined

Settings for controlling what data is included in step results.

### functionId:

string | undefined

Identifier from telemetry settings for grouping related operations.

### experimental\_context:

unknown

User-defined context object. May be updated from prepareStep between steps.

### [`experimental_onToolCallStart`](#experimental_ontoolcallstart)

Called before a tool's `execute` function runs.

```
1const result = await generateText({2 model: openai('gpt-4o'),3 prompt: 'What is the weather?',4 tools: { getWeather },5 experimental_onToolCallStart: event => {6 console.log('Tool:', event.toolCall.toolName);7 console.log('Input:', event.toolCall.input);8 },9});
```

### stepNumber:

number | undefined

Zero-based index of the current step where this tool call occurs.

### model:

{ provider: string; modelId: string } | undefined

The model being used for this step.

### toolCall:

TypedToolCall

The full tool call object.

TypedToolCall

### type:

'tool-call'

The type of the call.

### toolCallId:

string

Unique identifier for this tool call.

### toolName:

string

Name of the tool being called.

### input:

unknown

Input arguments passed to the tool.

### messages:

Array<ModelMessage>

The conversation messages available at tool execution time.

### abortSignal:

AbortSignal | undefined

Signal for cancelling the operation.

### functionId:

string | undefined

Identifier from telemetry settings for grouping related operations.

### experimental\_context:

unknown

User-defined context object flowing through the generation.

### [`experimental_onToolCallFinish`](#experimental_ontoolcallfinish)

Called after a tool's `execute` function completes or errors. Uses a discriminated union on the `success` field.

```
1const result = await generateText({2 model: openai('gpt-4o'),3 prompt: 'What is the weather?',4 tools: { getWeather },5 experimental_onToolCallFinish: event => {6 console.log('Tool:', event.toolCall.toolName);7 console.log('Duration:', event.durationMs, 'ms');8
9 if (event.success) {10 console.log('Output:', event.output);11 } else {12 console.error('Error:', event.error);13 }14 },15});
```

### stepNumber:

number | undefined

Zero-based index of the current step where this tool call occurred.

### model:

{ provider: string; modelId: string } | undefined

The model being used for this step.

### toolCall:

TypedToolCall

The full tool call object.

TypedToolCall

### type:

'tool-call'

The type of the call.

### toolCallId:

string

Unique identifier for this tool call.

### toolName:

string

Name of the tool that was called.

### input:

unknown

Input arguments passed to the tool.

### messages:

Array<ModelMessage>

The conversation messages available at tool execution time.

### abortSignal:

AbortSignal | undefined

Signal for cancelling the operation.

### durationMs:

number

Execution time of the tool call in milliseconds.

### functionId:

string | undefined

Identifier from telemetry settings for grouping related operations.

### experimental\_context:

unknown

User-defined context object flowing through the generation.

### success:

boolean

Discriminator indicating whether the tool call succeeded. When true, output is available. When false, error is available.

### output:

unknown

The tool's return value (only present when success is true).

### error:

unknown

The error that occurred during tool execution (only present when success is false).

### [`onStepFinish`](#onstepfinish)

Called after each step (LLM call) completes. Provides the full `StepResult`.

```
1const result = await generateText({2 model: openai('gpt-4o'),3 prompt: 'Hello!',4 onStepFinish: event => {5 console.log('Step:', event.stepNumber);6 console.log('Finish reason:', event.finishReason);7 console.log('Tokens:', event.usage.totalTokens);8 },9});
```

### stepNumber:

number

Zero-based index of this step.

### model:

{ provider: string; modelId: string }

Information about the model that produced this step.

### finishReason:

'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other'

The unified reason why the generation finished.

### usage:

LanguageModelUsage

The token usage of the generated text.

LanguageModelUsage

### inputTokens:

number | undefined

The total number of input (prompt) tokens used.

### outputTokens:

number | undefined

The number of output (completion) tokens used.

### totalTokens:

number | undefined

The total number of tokens used.

### text:

string

The generated text.

### toolCalls:

Array<TypedToolCall>

The tool calls that were made during the generation.

### toolResults:

Array<TypedToolResult>

The results of the tool calls.

### content:

Array<ContentPart>

The content that was generated in this step.

### reasoning:

Array<ReasoningPart>

The reasoning that was generated during the generation.

### reasoningText:

string | undefined

The reasoning text that was generated.

### files:

Array<GeneratedFile>

The files that were generated during the generation.

### sources:

Array<Source>

The sources that were used to generate the text.

### warnings:

CallWarning\[\] | undefined

Warnings from the model provider.

### request:

LanguageModelRequestMetadata

Additional request information.

### response:

LanguageModelResponseMetadata

Additional response information including id, modelId, timestamp, headers, and messages.

### functionId:

string | undefined

Identifier from telemetry settings for grouping related operations.

### experimental\_context:

unknown

User-defined context object flowing through the generation.

### [`onFinish`](#onfinish)

Called when the entire generation completes (all steps finished). Includes aggregated data.

```
1const result = await generateText({2 model: openai('gpt-4o'),3 prompt: 'Hello!',4 onFinish: event => {5 console.log('Total steps:', event.steps.length);6 console.log('Total tokens:', event.totalUsage.totalTokens);7 console.log('Final text:', event.text);8 },9});
```

### steps:

Array<StepResult>

Array containing results from all steps in the generation.

### totalUsage:

LanguageModelUsage

Aggregated token usage across all steps.

LanguageModelUsage

### inputTokens:

number | undefined

The total number of input tokens used across all steps.

### outputTokens:

number | undefined

The total number of output tokens used across all steps.

### totalTokens:

number | undefined

The total number of tokens used across all steps.

### stepNumber:

number

Zero-based index of the final step.

### model:

{ provider: string; modelId: string }

Information about the model that produced the final step.

### finishReason:

'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other'

The unified reason why the generation finished.

### usage:

LanguageModelUsage

The token usage from the final step only (not aggregated).

### text:

string

The full text that has been generated.

### toolCalls:

Array<TypedToolCall>

The tool calls that were made in the final step.

### toolResults:

Array<TypedToolResult>

The results of the tool calls from the final step.

### content:

Array<ContentPart>

The content that was generated in the final step.

### reasoning:

Array<ReasoningPart>

The reasoning that was generated.

### reasoningText:

string | undefined

The reasoning text that was generated.

### files:

Array<GeneratedFile>

Files that were generated in the final step.

### sources:

Array<Source>

Sources that have been used as input to generate the response.

### warnings:

CallWarning\[\] | undefined

Warnings from the model provider.

### request:

LanguageModelRequestMetadata

Additional request information from the final step.

### response:

LanguageModelResponseMetadata

Additional response information from the final step.

### functionId:

string | undefined

Identifier from telemetry settings for grouping related operations.

### experimental\_context:

unknown

The final state of the user-defined context object.

## [Use Cases](#use-cases)

### [Logging and Debugging](#logging-and-debugging)

```
1import { generateText } from 'ai';2
3const result = await generateText({4 model: openai('gpt-4o'),5 prompt: 'Hello!',6 experimental_onStart: event => {7 console.log(`[${new Date().toISOString()}] Generation started`, {8 model: event.model.modelId,9 provider: event.model.provider,10 });11 },12 onStepFinish: event => {13 console.log(14 `[${new Date().toISOString()}] Step ${event.stepNumber} finished`,15 {16 finishReason: event.finishReason,17 tokens: event.usage.totalTokens,18 },19 );20 },21 onFinish: event => {22 console.log(`[${new Date().toISOString()}] Generation complete`, {23 totalSteps: event.steps.length,24 totalTokens: event.totalUsage.totalTokens,25 });26 },27});
```

### [Tool Execution Monitoring](#tool-execution-monitoring)

```
1import { generateText } from 'ai';2
3const result = await generateText({4 model: openai('gpt-4o'),5 prompt: 'What is the weather?',6 tools: { getWeather },7 experimental_onToolCallStart: event => {8 console.log(`Tool "${event.toolCall.toolName}" starting...`);9 },10 experimental_onToolCallFinish: event => {11 if (event.success) {12 console.log(13 `Tool "${event.toolCall.toolName}" completed in ${event.durationMs}ms`,14 );15 } else {16 console.error(`Tool "${event.toolCall.toolName}" failed:`, event.error);17 }18 },19});
```

## [Error Handling](#error-handling)

Errors thrown inside callbacks are caught and do not break the generation flow. This ensures that monitoring code cannot disrupt your application:

```
1const result = await generateText({2 model: openai('gpt-4o'),3 prompt: 'Hello!',4 experimental_onStart: () => {5 throw new Error('This error is caught internally');6 // Generation continues normally7 },8});
```