---
url: https://ai-sdk.dev/docs/advanced/why-streaming
title: "Foundations: Streaming"
description: "Why use streaming for AI applications?"
hash: "328a6e8c2188d2801bb42dad5177dbd4bcfec4e4051ebaacf2c363d7db30e70c"
crawledAt: 2026-03-07T07:57:01.568Z
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
url: https://ai-sdk.dev/docs/advanced
title: "Advanced"
description: "Learn how to use advanced functionality within the AI SDK and RSC API."
hash: "cbe2eddbdcf65c978d83690c9245cb2483897698831816a29737561399a43d6c"
crawledAt: 2026-03-07T08:02:58.362Z
depth: 2
---

Advanced

This section covers advanced topics and concepts for the AI SDK and RSC API. Working with LLMs often requires a different mental model compared to traditional software development.

After these concepts, you should have a better understanding of the paradigms behind the AI SDK and RSC API, and how to use them to build more AI applications.

[Previous

Migrating from RSC to UI

](https://ai-sdk.dev/docs/ai-sdk-rsc/migrating-to-ui)[Next

Prompt Engineering

](https://ai-sdk.dev/docs/advanced/prompt-engineering)

On this page

[Advanced](#advanced)

Deploy and Scale AI Apps with Vercel

Deliver AI experiences globally with one push.

Trusted by industry leaders:

* OpenAI
* Photoroom
* ![leonardo-ai Logo](https://ai-sdk.dev/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fleonardo-ai-light.c7c240a2.svg&w=384&q=75&dpl=dpl_m9N5rp3hnJw2StkSiCk6WZjEEEC1)![leonardo-ai Logo](https://ai-sdk.dev/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fleonardo-ai-dark.98769390.svg&w=384&q=75&dpl=dpl_m9N5rp3hnJw2StkSiCk6WZjEEEC1)
* ![zapier Logo](https://ai-sdk.dev/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fzapier-light.5dde0542.svg&w=256&q=75&dpl=dpl_m9N5rp3hnJw2StkSiCk6WZjEEEC1)![zapier Logo](https://ai-sdk.dev/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fzapier-dark.828a0308.svg&w=256&q=75&dpl=dpl_m9N5rp3hnJw2StkSiCk6WZjEEEC1)

---
url: https://ai-sdk.dev/docs/migration-guides
title: "Migration Guides"
description: "Learn how to upgrade between Vercel AI versions."
hash: "8dea714e13ca1c269a3cfe38bb218f432d97230bbaaefd3b93e041f4f7448a65"
crawledAt: 2026-03-07T08:03:37.021Z
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
url: https://ai-sdk.dev/docs/troubleshooting
title: "Troubleshooting"
description: "Troubleshooting information for common issues encountered with the AI SDK."
hash: "628a96a9bf6e4d5fdfa2269df912171b4dc143b62b886d617742d99f856493c0"
crawledAt: 2026-03-07T08:03:45.501Z
depth: 2
---

Troubleshooting

This section is designed to help you quickly identify and resolve common issues encountered with the AI SDK, ensuring a smoother and more efficient development experience.

Report Issues

Found a bug? We'd love to hear about it in our GitHub issues.

[

Open GitHub Issue

](https://github.com/vercel/ai/issues/new?assignees=&labels=&projects=&template=1.bug_report.yml)

Feature Requests

Want to suggest a new feature? Share it with us and the community.

[

Request Feature

](https://github.com/vercel/ai/issues/new?assignees=&labels=&projects=&template=2.feature_request.yml)

Ask the Community

Join our GitHub discussions to browse for help and best practices.

[

Ask a question

](https://github.com/vercel/ai/discussions)

Migration Guides

Check out our migration guides to help you upgrade to the latest version.

[

Migration Guides

](https://ai-sdk.dev/docs/migration-guides)

On this page

Deploy and Scale AI Apps with Vercel

Deliver AI experiences globally with one push.

Trusted by industry leaders: