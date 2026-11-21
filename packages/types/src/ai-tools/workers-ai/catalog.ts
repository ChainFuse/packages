export const workersAiCatalog = {
	modelGroups: {
		'Voice Activity Detection': {
			id: '0811effd-24c2-4e38-bf2d-d7f06f6421cb',
			description: null,
			models: [
				{
					id: 'fe8904cf-e20e-4884-b829-ed7cec0a01cb',
					source: 1,
					name: '@cf/pipecat-ai/smart-turn-v2',
					description: 'An open source, community-driven, native audio turn detection model in 2nd version',
					created_at: '2025-08-04 10:08:04.219',
					tags: [],
					properties: {
						async_queue: true,
						price: [
							{
								unit: 'per audio minute',
								price: 0.000338,
								currency: 'USD',
							},
						],
						realtime: true,
					},
				},
			],
		},
		'Text Generation': {
			id: 'c329a1f9-323d-4e91-b2aa-582dd4188d34',
			description: 'Family of generative text models, such as large language models (LLM), that can be adapted for a variety of natural language tasks.',
			models: [
				{
					id: 'fd81c856-07a9-4965-9241-a124f369826c',
					source: 1,
					name: '@cf/thinkingmachines/inkling-2-small',
					description: 'Inkling 2 Small is a multimodal Mixture-of-Experts model from Thinking Machines Lab with 594B total and 18B active parameters and up to 1M tokens of context. It accepts text and image inputs and generates text, with built-in reasoning and tool calling.',
					created_at: '2026-11-09 23:34:25.355',
					tags: [],
					properties: {
						require_workers_paid: true,
						context_window: 1048576,
						function_calling: true,
						reasoning: true,
						reasoning_effort: {
							supported_efforts: ['max', 'high', 'medium', 'low', 'minimal', 'none'],
							default_effort: 'high',
							default_enabled: true,
							mandatory: false,
							normalizes_to: {
								null: 'high',
								auto: 'high',
								xhigh: 'max',
							},
						},
						terms: 'https://www.apache.org/licenses/LICENSE-2.0',
						vision: true,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.3,
								currency: 'USD',
							},
							{
								unit: 'per M output tokens',
								price: 1,
								currency: 'USD',
							},
							{
								unit: 'per M cached input tokens',
								price: 0.1,
								currency: 'USD',
							},
						],
					},
				},
				{
					id: 'f9f2250b-1048-4a52-9910-d0bf976616a1',
					source: 1,
					name: '@cf/openai/gpt-oss-120b',
					description: 'OpenAI’s open-weight models designed for powerful reasoning, agentic tasks, and versatile developer use cases – gpt-oss-120b is for production, general purpose, high reasoning use-cases.',
					created_at: '2025-08-05 10:27:29.131',
					tags: [],
					properties: {
						async_queue: true,
						context_window: 128000,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.35,
								currency: 'USD',
							},
							{
								unit: 'per M output tokens',
								price: 0.75,
								currency: 'USD',
							},
						],
						function_calling: true,
						reasoning: true,
						reasoning_effort: {
							supported_efforts: ['high', 'medium', 'low'],
							default_effort: 'medium',
							mandatory: true,
							default_enabled: true,
						},
					},
				},
				{
					id: 'd27e5c9c-9bbb-41b7-9ef9-6beceeeb07ef',
					source: 1,
					name: '@cf/cloudflare/clairic-flash',
					description: 'Clairic is a System One-style model that can extract, compute, estimate, and forecast values from inputs. It is strongly typed and outputs confidence scores and probabilities against its outputs. This model is in early research preview from the Cloudflare Workers AI team.',
					created_at: '2026-10-29 20:16:58.443',
					tags: [],
					properties: {
						context_window: 65536,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.1,
								currency: 'USD',
							},
						],
						vision: true,
					},
				},
				{
					id: 'cc80437b-9a8d-4f1a-9c77-9aaf0d226922',
					source: 1,
					name: '@cf/meta/llama-guard-3-8b',
					description: 'Llama Guard 3 is a Llama-3.1-8B pretrained model, fine-tuned for content safety classification. Similar to previous versions, it can be used to classify content in both LLM inputs (prompt classification) and in LLM responses (response classification). It acts as an LLM – it generates text in its output that indicates whether a given prompt or response is safe or unsafe, and if unsafe, it also lists the content categories violated.',
					created_at: '2025-01-22 23:26:23.495',
					tags: ['moderation', 'safety', 'content-filtering', 'guardrails'],
					properties: {
						context_window: 131072,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.484,
								currency: 'USD',
							},
							{
								unit: 'per M output tokens',
								price: 0.03,
								currency: 'USD',
							},
						],
						lora: true,
					},
				},
				{
					id: 'c58c317b-0c15-4bda-abb6-93e275f282d9',
					source: 1,
					name: '@cf/mistral/mistral-7b-instruct-v0.2-lora',
					description: 'The Mistral-7B-Instruct-v0.2 Large Language Model (LLM) is an instruct fine-tuned version of the Mistral-7B-v0.2.',
					created_at: '2024-04-01 22:14:40.529',
					tags: [],
					properties: {
						context_window: 15000,
						lora: true,
					},
				},
				{
					id: 'c05fea67-c5a9-49ca-a7ab-446a0d62cb7a',
					source: 1,
					name: '@cf/zai-org/glm-5.3',
					description: "GLM-5.3 is Z.ai's flagship agentic coding model, pairing a 1M-token context window with reasoning, function calling, and structured outputs to power multi-step, tool-driven development workflows.",
					created_at: '2026-08-14 12:07:32.346',
					tags: [],
					properties: {
						require_workers_paid: true,
						context_window: 1048576,
						function_calling: true,
						reasoning: true,
						reasoning_effort: {
							supported_efforts: ['max', 'high', 'low'],
							default_effort: 'max',
							normalizes_to: {
								none: 'max',
								minimal: 'max',
								medium: 'max',
								xhigh: 'max',
								null: 'max',
							},
							mandatory: true,
							default_enabled: true,
						},
						price: [
							{
								unit: 'per M input tokens',
								price: 1.4,
								currency: 'USD',
							},
							{
								unit: 'per M output tokens',
								price: 4.4,
								currency: 'USD',
							},
							{
								unit: 'per M cached input tokens',
								price: 0.26,
								currency: 'USD',
							},
						],
					},
				},
				{
					id: 'bf419b23-844f-4a2c-8111-89dbd63152eb',
					source: 1,
					name: '@cf/utter-project/eurollm-9b-it',
					description: 'EuroLLM-9B is a 9B parameter model trained on 4 trillion tokens divided across the considered languages and several data sources: Web data, parallel data (en-xx and xx-en), and high-quality datasets. For access, please fill out this form: https://forms.gle/kgvmkr6ucHN3xNuH6',
					created_at: '2026-09-30 14:09:31.518',
					tags: [],
					properties: {
						context_window: 32000,
						function_calling: true,
						languages: 'Bulgarian,Croatian,Czech,Danish,Dutch,English,Estonian,Finnish,French,German,Greek,Hungarian,Irish,Italian,Latvian,Lithuanian,Maltese,Polish,Portuguese,Romanian,Slovak,Slovenian,Spanish,Swedish,Arabic,Catalan,Chinese,Galician,Hindi,Japanese,Korean,Norwegian,Russian,Turkish,Ukrainian',
					},
				},
				{
					id: '87f39d62-116c-4b26-b2cd-562a9ba01f2f',
					source: 1,
					name: '@cf/cloudflare/clef',
					description: 'Clef is a 27B multimodal decision model that turns a state and a schema of typed questions into decisions. It reads the state as text, JSON, images, or video, and returns a probability for every allowed option of every question.',
					created_at: '2026-09-29 14:05:24.552',
					tags: [],
					properties: {
						context_window: 65536,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.24,
								currency: 'USD',
							},
						],
						info: 'https://huggingface.co/Cloudflare/clef',
						terms: 'https://huggingface.co/Cloudflare/clef/blob/main/LICENSE',
						vision: true,
					},
				},
				{
					id: '86b3e51a-4b05-43fa-a403-0f27821919d2',
					source: 1,
					name: '@cf/zai-org/glm-4.7-flash',
					description: 'GLM-4.7-Flash is a fast and efficient multilingual text generation model with a 131,072 token context window. Optimized for dialogue, instruction-following, and multi-turn tool calling across 100+ languages.',
					created_at: '2026-01-28 16:04:39.346',
					tags: [],
					properties: {
						context_window: 131072,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.0605,
								currency: 'USD',
							},
							{
								unit: 'per M output tokens',
								price: 0.4,
								currency: 'USD',
							},
						],
						function_calling: true,
						reasoning: true,
						reasoning_effort: {
							mandatory: false,
							default_enabled: true,
						},
					},
				},
				{
					id: '7a143886-c9bb-4a1c-be95-377b1973bc3b',
					source: 1,
					name: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
					description: 'Llama 3.3 70B quantized to fp8 precision, optimized to be faster.',
					created_at: '2024-12-06 17:09:18.338',
					tags: [],
					properties: {
						async_queue: true,
						context_window: 24000,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.293,
								currency: 'USD',
							},
							{
								unit: 'per M output tokens',
								price: 2.253,
								currency: 'USD',
							},
						],
						function_calling: true,
						terms: 'https://github.com/meta-llama/llama-models/blob/main/models/llama3_3/LICENSE',
					},
				},
				{
					id: '7952d0cc-cb00-4e10-be02-667565c2ee0f',
					source: 1,
					name: '@cf/ibm-granite/granite-4.0-h-micro',
					description: 'Granite 4.0 instruct models deliver strong performance across benchmarks, achieving industry-leading results in key agentic tasks like instruction following and function calling. These efficiencies make the models well-suited for a wide range of use cases like retrieval-augmented generation (RAG), multi-agent workflows, and edge deployments.',
					created_at: '2025-10-07 18:46:29.436',
					tags: [],
					properties: {
						context_window: 131000,
						function_calling: true,
					},
				},
				{
					id: '6b0b79c1-25e6-4498-bb62-5161df39f0ef',
					source: 1,
					name: '@cf/cloudflare/clairic',
					description: 'Clairic is a System One-style model that can extract, compute, estimate, and forecast values from inputs. It is strongly typed and outputs confidence scores and probabilities against its outputs. This model is in early research preview from the Cloudflare Workers AI team.',
					created_at: '2026-10-14 05:34:04.680',
					tags: [],
					properties: {
						context_window: 65536,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.1,
								currency: 'USD',
							},
						],
						vision: true,
					},
				},
				{
					id: '56482a5b-020e-488d-9c56-11a3ed40719c',
					source: 1,
					name: '@cf/swiss-ai/apertus-v1.5-8b',
					description: 'Apertus 1.5 is an 8B parameter language model designed to advance the state of multilingual, multimodal, fully open, and transparent AI. The models support a wide range of languages, handle contexts of up to 262,144 tokens, and it uses only fully open training data whilst delivering performance comparable to other models of similar size. For access, please fill out this form: https://forms.gle/kgvmkr6ucHN3xNuH6',
					created_at: '2026-09-30 14:20:40.668',
					tags: [],
					properties: {
						context_window: 262144,
						function_calling: true,
						vision: true,
					},
				},
				{
					id: '543fea3d-dcff-4c3b-af79-b83f601aa1cb',
					source: 1,
					name: '@cf/cloudflare/clef-omni',
					description: 'Clef-omni is a multimodal decision model built on a 30B-parameter mixture-of-experts (3B active) backbone. It turns a state and a schema of typed questions into decisions, reads the state as text, JSON, images, audio, or video, and returns a probability for every allowed option of every question.',
					created_at: '2026-10-09 01:37:45.295',
					tags: [],
					properties: {
						context_window: 65536,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.15,
								currency: 'USD',
							},
						],
						vision: true,
					},
				},
				{
					id: '51b71d5b-8bc0-4489-a107-95e542b69914',
					source: 1,
					name: '@cf/qwen/qwen2.5-coder-32b-instruct',
					description: 'Qwen2.5-Coder is the latest series of Code-Specific Qwen large language models (formerly known as CodeQwen). As of now, Qwen2.5-Coder has covered six mainstream model sizes, 0.5, 1.5, 3, 7, 14, 32 billion parameters, to meet the needs of different developers. Qwen2.5-Coder brings the following improvements upon CodeQwen1.5:',
					created_at: '2025-02-27 00:31:43.829',
					tags: [],
					properties: {
						context_window: 32768,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.66,
								currency: 'USD',
							},
							{
								unit: 'per M output tokens',
								price: 1,
								currency: 'USD',
							},
						],
						lora: true,
					},
				},
				{
					id: '41ca173f-72d5-4420-8915-49e835d2676e',
					source: 1,
					name: '@cf/aisingapore/gemma-sea-lion-v4-27b-it',
					description: 'SEA-LION stands for Southeast Asian Languages In One Network, which is a collection of Large Language Models (LLMs) which have been pretrained and instruct-tuned for the Southeast Asia (SEA) region.',
					created_at: '2025-09-23 19:27:30.468',
					tags: [],
					properties: {
						context_window: 128000,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.351,
								currency: 'USD',
							},
							{
								unit: 'per M output tokens',
								price: 0.555,
								currency: 'USD',
							},
						],
					},
				},
				{
					id: '328adb49-4a7d-43e3-a2d5-802ae8100fe7',
					source: 1,
					name: '@cf/google/gemma-4-26b-a4b-it',
					description: "Gemma 4 is Google's most intelligent family of open models, built from Gemini 3 research to maximize intelligence-per-parameter.",
					created_at: '2026-04-02 15:05:22.642',
					tags: [],
					properties: {
						async_queue: true,
						context_window: 256000,
						function_calling: true,
						reasoning: true,
						reasoning_effort: {
							mandatory: false,
							default_enabled: true,
						},
						terms: 'https://ai.google.dev/gemma/docs/gemma_4_license',
						vision: true,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.1,
								currency: 'USD',
							},
							{
								unit: 'per M output tokens',
								price: 0.3,
								currency: 'USD',
							},
							{
								unit: 'per M cached input tokens',
								price: 0.05,
								currency: 'USD',
							},
						],
					},
				},
				{
					id: '31690291-ebdc-4f98-bcfc-a44844e215b7',
					source: 1,
					name: '@cf/mistralai/mistral-small-3.1-24b-instruct',
					description: 'Building upon Mistral Small 3 (2501), Mistral Small 3.1 (2503) adds state-of-the-art vision understanding and enhances long context capabilities up to 128k tokens without compromising text performance. With 24 billion parameters, this model achieves top-tier capabilities in both text and vision tasks.',
					created_at: '2025-03-18 03:28:37.890',
					tags: [],
					properties: {
						context_window: 128000,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.351,
								currency: 'USD',
							},
							{
								unit: 'per M output tokens',
								price: 0.555,
								currency: 'USD',
							},
						],
						function_calling: true,
						vision: true,
					},
				},
				{
					id: '2cbc033b-ded8-4e02-bbb2-47cf05d5cfe5',
					source: 1,
					name: '@cf/meta/llama-3.2-11b-vision-instruct',
					description: ' The Llama 3.2-Vision instruction-tuned models are optimized for visual recognition, image reasoning, captioning, and answering general questions about an image.',
					created_at: '2024-09-25 05:36:04.547',
					tags: [],
					properties: {
						context_window: 128000,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.0485,
								currency: 'USD',
							},
							{
								unit: 'per M output tokens',
								price: 0.676,
								currency: 'USD',
							},
						],
						lora: true,
						terms: 'https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/LICENSE',
						vision: true,
					},
				},
				{
					id: '2b2b6dfb-2cd0-433f-802c-533d40508d9b',
					source: 1,
					name: '@cf/daily-co/phonellm-mini-alpha-2',
					description: 'PhoneLLM is an open model tuned for voice agents. The model is based on Nemotron Nano 30B base capabilities and excels at typical voice agent tasks with thinking disabled.',
					created_at: '2026-10-13 09:36:59.162',
					tags: [],
					properties: {
						context_window: 262140,
						function_calling: true,
					},
				},
				{
					id: '22338608-b54d-4f04-884e-ab06f3dbbf3e',
					source: 1,
					name: '@cf/qwen/qwen3.8-27b',
					description: "Qwen 3.8 27B is a 27-billion-parameter instruction-tuned language model from Alibaba's Qwen family, designed for vision, efficient general-purpose text generation and agentic workloads.",
					created_at: '2026-08-17 07:13:11.641',
					tags: [],
					properties: {
						async_queue: true,
						context_window: 262144,
						function_calling: true,
						reasoning: true,
						reasoning_effort: {
							supported_efforts: ['xhigh', 'medium', 'low'],
							default_effort: 'xhigh',
							normalizes_to: {
								null: 'xhigh',
							},
							mandatory: false,
							default_enabled: true,
							supports_max_tokens: false,
						},
						vision: true,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.45,
								currency: 'USD',
							},
							{
								unit: 'per M output tokens',
								price: 3.2,
								currency: 'USD',
							},
							{
								unit: 'per M cached input tokens',
								price: 0.05,
								currency: 'USD',
							},
						],
					},
				},
				{
					id: '215ee9cf-aaa0-48bd-a084-00da8da2fbeb',
					source: 1,
					name: '@cf/deepseek-ai/deepseek-v4.1-flash-1017',
					description: 'We introduce DeepSeek-V4.1-Flash, a multimodal Mixture-of-Experts (MoE) model with 552B backbone parameters and support for contexts of up to one million tokens. The model natively processes images and text, and generates text autoregressively.',
					created_at: '2026-10-17 03:51:20.275',
					tags: [],
					properties: {
						require_workers_paid: true,
						context_window: 1048576,
						function_calling: true,
						hugging_face_id: 'deepseek-ai/DeepSeek-V4.1-Flash-1017',
						openrouter_slug: 'deepseek/deepseek-v4.1-flash-1017',
						reasoning: true,
						reasoning_effort: {
							supported_efforts: ['max', 'high', 'low', 'none'],
							default_effort: 'high',
							default_enabled: true,
							mandatory: false,
							normalizes_to: {
								null: 'high',
								auto: 'high',
								minimal: 'none',
								medium: 'high',
								xhigh: 'max',
							},
						},
						terms: 'https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017/blob/main/LICENSE',
						vision: true,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.3,
								currency: 'USD',
							},
							{
								unit: 'per M output tokens',
								price: 1.2,
								currency: 'USD',
							},
							{
								unit: 'per M cached input tokens',
								price: 0.006,
								currency: 'USD',
							},
						],
					},
				},
				{
					id: '188a4e1e-253e-46d0-9616-0bf8c149763f',
					source: 1,
					name: '@cf/openai/gpt-oss-20b',
					description: 'OpenAI’s open-weight models designed for powerful reasoning, agentic tasks, and versatile developer use cases – gpt-oss-20b is for lower latency, and local or specialized use-cases.',
					created_at: '2025-08-05 10:49:53.265',
					tags: [],
					properties: {
						async_queue: true,
						context_window: 128000,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.2,
								currency: 'USD',
							},
							{
								unit: 'per M output tokens',
								price: 0.3,
								currency: 'USD',
							},
						],
						function_calling: true,
						reasoning: true,
						reasoning_effort: {
							supported_efforts: ['high', 'medium', 'low'],
							default_effort: 'medium',
							mandatory: true,
							default_enabled: true,
						},
					},
				},
				{
					id: '06455e78-19f7-487b-93cd-c05a3dd07813',
					source: 1,
					name: '@cf/meta/llama-4-scout-17b-16e-instruct',
					description: "Meta's Llama 4 Scout is a 17 billion parameter model with 16 experts that is natively multimodal. These models leverage a mixture-of-experts architecture to offer industry-leading performance in text and image understanding.",
					created_at: '2025-04-05 20:25:56.137',
					tags: [],
					properties: {
						async_queue: true,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.27,
								currency: 'USD',
							},
							{
								unit: 'per M output tokens',
								price: 0.85,
								currency: 'USD',
							},
						],
						context_window: 131000,
						function_calling: true,
						terms: 'https://github.com/meta-llama/llama-models/blob/main/models/llama4/LICENSE',
						vision: true,
					},
				},
				{
					id: '059de3ad-d350-4cb6-8b31-e4f34847d10a',
					source: 1,
					name: '@cf/cloudflare/clef-flash',
					description: 'Clef-flash is a fast 9B multimodal decision model that turns a state and a schema of typed questions into decisions. It reads the state as text, JSON, images, or video, and returns a probability for every allowed option of every question.',
					created_at: '2026-09-29 09:25:44.258',
					tags: [],
					properties: {
						context_window: 24576,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.038,
								currency: 'USD',
							},
						],
						info: 'https://huggingface.co/Cloudflare/clef-flash',
						terms: 'https://huggingface.co/Cloudflare/clef-flash/blob/main/LICENSE',
						vision: true,
					},
				},
			],
		},
		'Text Embeddings': {
			id: '0137cdcf-162a-4108-94f2-1ca59e8c65ee',
			description: 'Feature extraction models transform raw data into numerical features that can be processed while preserving the information in the original dataset. These models are ideal as part of building vector search applications or Retrieval Augmented Generation workflows with Large Language Models (LLM).',
			models: [
				{
					id: 'eed32bc1-8775-4985-89ce-dd1405508ad8',
					source: 1,
					name: '@cf/baai/bge-m3',
					description: 'Multi-Functionality, Multi-Linguality, and Multi-Granularity embeddings model.',
					created_at: '2024-05-22 19:27:09.781',
					tags: [],
					properties: {
						context_window: 60000,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.0118,
								currency: 'USD',
							},
						],
					},
				},
				{
					id: 'cb254e3b-372b-4d4e-8526-ada79940427a',
					source: 1,
					name: '@cf/qwen/qwen3-embedding-0.6b',
					description: 'The Qwen3 Embedding model series is the latest proprietary model of the Qwen family, specifically designed for text embedding and ranking tasks. ',
					created_at: '2025-06-18 20:23:22.086',
					tags: [],
					properties: {
						context_window: 8192,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.0118,
								currency: 'USD',
							},
						],
					},
				},
				{
					id: 'bc2b61f6-7eb3-4cdf-94f5-ffc128bd6aa4',
					source: 1,
					name: '@cf/pfnet/plamo-embedding-1b',
					description: 'PLaMo-Embedding-1B is a Japanese text embedding model developed by Preferred Networks, Inc.\n\nIt can convert Japanese text input into numerical vectors and can be used for a wide range of applications, including information retrieval, text classification, and clustering.',
					created_at: '2025-09-24 18:42:05.576',
					tags: [],
					properties: {
						price: [
							{
								unit: 'per M input tokens',
								price: 0.0186,
								currency: 'USD',
							},
						],
					},
				},
				{
					id: '57fbd08a-a4c4-411c-910d-b9459ff36c20',
					source: 1,
					name: '@cf/baai/bge-small-en-v1.5',
					description: 'BAAI general embedding (Small) model that transforms any given text into a 384-dimensional vector',
					created_at: '2023-11-07 15:43:58.042',
					tags: [],
					properties: {
						async_queue: true,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.0202,
								currency: 'USD',
							},
						],
						info: 'https://huggingface.co/BAAI/bge-small-en-v1.5',
						max_input_tokens: 512,
						output_dimensions: 384,
					},
				},
				{
					id: '429b9e8b-d99e-44de-91ad-706cf8183658',
					source: 1,
					name: '@cf/baai/bge-base-en-v1.5',
					description: 'BAAI general embedding (Base) model that transforms any given text into a 768-dimensional vector',
					created_at: '2023-09-25 19:21:11.898',
					tags: [],
					properties: {
						async_queue: true,
						context_window: 153600,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.0666,
								currency: 'USD',
							},
						],
						info: 'https://huggingface.co/BAAI/bge-base-en-v1.5',
						max_input_tokens: 512,
						output_dimensions: 768,
					},
				},
				{
					id: '01bc2fb0-4bca-4598-b985-d2584a3f46c0',
					source: 1,
					name: '@cf/baai/bge-large-en-v1.5',
					description: 'BAAI general embedding (Large) model that transforms any given text into a 1024-dimensional vector',
					created_at: '2023-11-07 15:43:58.042',
					tags: [],
					properties: {
						async_queue: true,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.204,
								currency: 'USD',
							},
						],
						info: 'https://huggingface.co/BAAI/bge-large-en-v1.5',
						max_input_tokens: 512,
						output_dimensions: 1024,
					},
				},
			],
		},
		'Text Classification': {
			id: '19606750-23ed-4371-aab2-c20349b53a60',
			description: 'Sentiment analysis or text classification is a common NLP task that classifies a text input into labels or classes.',
			models: [
				{
					id: 'eaf31752-a074-441f-8b70-d593255d2811',
					source: 1,
					name: '@cf/huggingface/distilbert-sst-2-int8',
					description: 'Distilled BERT model that was finetuned on SST-2 for sentiment classification',
					created_at: '2023-09-25 19:21:11.898',
					tags: [],
					properties: {
						price: [
							{
								unit: 'per M input tokens',
								price: 0.0263,
								currency: 'USD',
							},
						],
						info: 'https://huggingface.co/Intel/distilbert-base-uncased-finetuned-sst-2-english-int8-static',
					},
				},
				{
					id: '145337e7-cec3-4ebb-8e78-16ddfc75e580',
					source: 1,
					name: '@cf/baai/bge-reranker-base',
					description: 'Different from embedding model, reranker uses question and document as input and directly output similarity instead of embedding. You can get a relevance score by inputting query and passage to the reranker. And the score can be mapped to a float value in [0,1] by sigmoid function.\n\n',
					created_at: '2025-02-14 12:28:19.009',
					tags: [],
					properties: {
						price: [
							{
								unit: 'per M input tokens',
								price: 0.00311,
								currency: 'USD',
							},
						],
					},
				},
			],
		},
		'Text-to-Image': {
			id: '3d6e1f35-341b-4915-a6c8-9a7142a9033a',
			description: 'Generates images from input text. These models can be used to generate and modify images based on text prompts.',
			models: [
				{
					id: 'e580c765-810c-4da3-936c-a2808892f14c',
					source: 1,
					name: '@cf/black-forest-labs/flux-2-klein-9b',
					description: 'FLUX.2 [klein] 9B is a 9 billion parameter model that can generate images from text descriptions and supports multi-reference editing capabilities.',
					created_at: '2026-01-14 12:55:54.294',
					tags: [],
					properties: {
						partner: true,
						terms: 'https://bfl.ai/legal/terms-of-service',
					},
				},
				{
					id: '9e087485-23dc-47fa-997d-f5bfafc0c7cc',
					source: 1,
					name: '@cf/black-forest-labs/flux-1-schnell',
					description: 'FLUX.1 [schnell] is a 12 billion parameter rectified flow transformer capable of generating images from text descriptions. ',
					created_at: '2024-08-29 16:37:39.541',
					tags: [],
					properties: {
						terms: 'https://bfl.ai/legal/terms-of-service',
					},
				},
				{
					id: '724608fa-983e-495d-b95c-340d6b7e78be',
					source: 1,
					name: '@cf/leonardo/phoenix-1.0',
					description: 'Phoenix 1.0 is a model by Leonardo.Ai that generates images with exceptional prompt adherence and coherent text.',
					created_at: '2025-08-25 18:12:18.073',
					tags: [],
					properties: {
						price: [
							{
								unit: 'per 512 by 512 tile',
								price: 0.00583,
								currency: 'USD',
							},
							{
								unit: 'per step',
								price: 0.00011,
								currency: 'USD',
							},
						],
						partner: true,
						terms: 'https://leonardo.ai/terms-of-service/',
					},
				},
				{
					id: '5cdffa8e-1b1e-48e8-85f1-ab9b943cdd32',
					source: 1,
					name: '@cf/black-forest-labs/flux-2-klein-4b',
					description: 'FLUX.2 [klein] is an ultra-fast, distilled image model. It unifies image generation and editing in a single model, delivering state-of-the-art quality enabling interactive workflows, real-time previews, and latency-critical applications.',
					created_at: '2026-01-14 12:54:55.024',
					tags: [],
					properties: {
						partner: true,
						terms: 'https://bfl.ai/legal/terms-of-service',
					},
				},
				{
					id: '3ae8936e-593e-4fb2-85ee-95dd8a057588',
					source: 1,
					name: '@cf/black-forest-labs/flux-2-dev',
					description: 'FLUX.2 [dev] is an image model from Black Forest Labs where you can generate highly realistic and detailed images, with multi-reference support.',
					created_at: '2025-11-24 15:44:06.050',
					tags: [],
					properties: {
						partner: true,
						terms: 'https://bfl.ai/legal/terms-of-service',
					},
				},
				{
					id: '0e372c11-8720-46c9-a02d-666188a22dae',
					source: 1,
					name: '@cf/leonardo/lucid-origin',
					description: "Lucid Origin from Leonardo.AI is their most adaptable and prompt-responsive model to date. Whether you're generating images with sharp graphic design, stunning full-HD renders, or highly specific creative direction, it adheres closely to your prompts, renders text with accuracy, and supports a wide array of visual styles and aesthetics – from stylized concept art to crisp product mockups.\n",
					created_at: '2025-08-25 19:21:28.770',
					tags: [],
					properties: {
						price: [
							{
								unit: 'per 512 by 512 tile',
								price: 0.007,
								currency: 'USD',
							},
							{
								unit: 'per step',
								price: 0.000132,
								currency: 'USD',
							},
						],
						partner: true,
						terms: 'https://leonardo.ai/terms-of-service/',
					},
				},
			],
		},
		'Text-to-Speech': {
			id: 'b52660a1-9a95-4ab2-8b1d-f232be34604a',
			description: 'Text-to-Speech (TTS) is the task of generating natural sounding speech given text input. TTS models can be extended to have a single model that generates speech for multiple speakers and multiple languages.',
			models: [
				{
					id: 'c5255b94-2161-4779-bd25-54f061829a2a',
					source: 1,
					name: '@cf/deepgram/aura-2-es',
					description: 'Aura-2 is a context-aware text-to-speech (TTS) model that applies natural pacing, expressiveness, and fillers based on the context of the provided text. The quality of your text input directly impacts the naturalness of the audio output.',
					created_at: '2025-10-09 22:42:37.002',
					tags: [],
					properties: {
						async_queue: true,
						price: [
							{
								unit: 'per 1k characters',
								price: 0.03,
								currency: 'USD',
							},
						],
						partner: true,
						terms: 'https://deepgram.com/terms',
						realtime: true,
					},
				},
				{
					id: '1f55679f-009e-4456-aa4f-049a62b4b6a0',
					source: 1,
					name: '@cf/deepgram/aura-1',
					description: 'Aura is a context-aware text-to-speech (TTS) model that applies natural pacing, expressiveness, and fillers based on the context of the provided text. The quality of your text input directly impacts the naturalness of the audio output.',
					created_at: '2025-08-27 01:18:18.880',
					tags: [],
					properties: {
						async_queue: true,
						price: [
							{
								unit: 'per 1k characters',
								price: 0.015,
								currency: 'USD',
							},
						],
						partner: true,
						terms: 'https://deepgram.com/terms',
						realtime: true,
					},
				},
				{
					id: '01564c52-8717-47dc-8efd-907a2ca18301',
					source: 1,
					name: '@cf/deepgram/aura-2-en',
					description: 'Aura-2 is a context-aware text-to-speech (TTS) model that applies natural pacing, expressiveness, and fillers based on the context of the provided text. The quality of your text input directly impacts the naturalness of the audio output.',
					created_at: '2025-10-09 22:19:34.483',
					tags: [],
					properties: {
						async_queue: true,
						price: [
							{
								unit: 'per 1k characters',
								price: 0.03,
								currency: 'USD',
							},
						],
						partner: true,
						terms: 'https://deepgram.com/terms',
						realtime: true,
					},
				},
			],
		},
		'Automatic Speech Recognition': {
			id: 'dfce1c48-2a81-462e-a7fd-de97ce985207',
			description: 'Automatic speech recognition (ASR) models convert a speech signal, typically an audio input, to text.',
			models: [
				{
					id: 'c1c12ce4-c36a-4aa6-8da4-f63ba4b8984d',
					source: 1,
					name: '@cf/openai/whisper',
					description: 'Whisper is a general-purpose speech recognition model. It is trained on a large dataset of diverse audio and is also a multitasking model that can perform multilingual speech recognition, speech translation, and language identification.',
					created_at: '2023-09-25 19:21:11.898',
					tags: [],
					properties: {
						info: 'https://openai.com/research/whisper',
					},
				},
				{
					id: 'a2a2afba-b609-4325-8c41-5791ce962239',
					source: 1,
					name: '@cf/deepgram/flux',
					description: 'Flux is the first conversational speech recognition model built specifically for voice agents.',
					created_at: '2025-09-29 21:07:55.114',
					tags: [],
					properties: {
						price: [
							{
								unit: 'per audio minute (websocket)',
								price: 0.0077,
								currency: 'USD',
							},
						],
						partner: true,
						terms: 'https://deepgram.com/terms',
						realtime: true,
					},
				},
				{
					id: 'a226909f-eef8-4265-a3a0-90db0422762e',
					source: 1,
					name: '@cf/deepgram/nova-3',
					description: 'Transcribe audio using Deepgram’s speech-to-text model',
					created_at: '2025-06-05 16:05:15.199',
					tags: [],
					properties: {
						async_queue: true,
						price: [
							{
								unit: 'per audio minute',
								price: 0.0052,
								currency: 'USD',
							},
							{
								unit: 'per audio minute (websocket)',
								price: 0.0092,
								currency: 'USD',
							},
						],
						partner: true,
						terms: 'https://deepgram.com/terms',
						realtime: true,
					},
				},
				{
					id: '200f0812-148c-48c1-915d-fb3277a94a08',
					source: 1,
					name: '@cf/openai/whisper-large-v3-turbo',
					description: 'Whisper is a pre-trained model for automatic speech recognition (ASR) and speech translation. ',
					created_at: '2024-05-22 00:02:18.656',
					tags: [],
					properties: {
						async_queue: true,
						price: [
							{
								unit: 'per audio minute',
								price: 0.000513,
								currency: 'USD',
							},
						],
					},
				},
			],
		},
		'Image Classification': {
			id: '00cd182b-bf30-4fc4-8481-84a3ab349657',
			description: 'Image classification models take an image input and assigns it labels or classes.',
			models: [
				{
					id: '7f9a76e1-d120-48dd-a565-101d328bbb02',
					source: 1,
					name: '@cf/microsoft/resnet-50',
					description: '50 layers deep image classification CNN trained on more than 1M images from ImageNet',
					created_at: '2023-09-25 19:21:11.898',
					tags: [],
					properties: {
						price: [
							{
								unit: 'per inference request',
								price: 0.00000251,
								currency: 'USD',
							},
						],
						info: 'https://www.microsoft.com/en-us/research/blog/microsoft-vision-model-resnet-50-combines-web-scale-data-and-multi-task-learning-to-achieve-state-of-the-art/',
					},
				},
			],
		},
		Translation: {
			id: 'f57d07cb-9087-487a-bbbf-bc3e17fecc4b',
			description: 'Translation models convert a sequence of text from one language to another.',
			models: [
				{
					id: '617e7ec3-bf8d-4088-a863-4f89582d91b5',
					source: 1,
					name: '@cf/meta/m2m100-1.2b',
					description: 'Multilingual encoder-decoder (seq-to-seq) model trained for Many-to-Many multilingual translation',
					created_at: '2023-09-25 19:21:11.898',
					tags: [],
					properties: {
						async_queue: true,
						price: [
							{
								unit: 'per M input tokens',
								price: 0.342,
								currency: 'USD',
							},
							{
								unit: 'per M output tokens',
								price: 0.342,
								currency: 'USD',
							},
						],
						info: 'https://github.com/facebookresearch/fairseq/tree/main/examples/m2m_100',
						languages: 'english, chinese, french, spanish, arabic, russian, german, japanese, portuguese, hindi',
						terms: 'https://github.com/facebookresearch/fairseq/blob/main/LICENSE',
					},
				},
				{
					id: '60920ed4-cf72-449a-a0f3-a38456b78262',
					source: 1,
					name: '@cf/ai4bharat/indictrans2-en-indic-1B',
					description: 'IndicTrans2 is the first open-source transformer-based multilingual NMT model that supports high-quality translations across all the 22 scheduled Indic languages',
					created_at: '2025-09-23 18:19:17.382',
					tags: [],
					properties: {
						price: [
							{
								unit: 'per M input tokens',
								price: 0.342,
								currency: 'USD',
							},
							{
								unit: 'per M output tokens',
								price: 0.342,
								currency: 'USD',
							},
						],
					},
				},
			],
		},
		'Image-to-Text': {
			id: '882a91d1-c331-4eec-bdad-834c919942a8',
			description: 'Image to text models output a text from a given image. Image captioning or optical character recognition can be considered as the most common applications of image to text.',
			models: [
				{
					id: '1161560b-87f9-4795-afb3-a905cf21bcf8',
					source: 1,
					name: '@cf/moondream/moondream3.1-9B-A2B',
					description: 'Moondream 3 is a fast, efficient 9B mixture-of-experts vision language model (2B active parameters) that delivers frontier-level visual reasoning for tasks like object detection, pointing, OCR, and structured output.',
					created_at: '2026-07-07 14:39:02.726',
					tags: [],
					properties: {
						price: [
							{
								unit: 'per M input tokens',
								price: 0.3,
								currency: 'USD',
							},
							{
								unit: 'per M output tokens',
								price: 1,
								currency: 'USD',
							},
						],
						terms: 'https://moondream.ai/licenses/model/1.0',
						vision: true,
					},
				},
			],
		},
		'Multimodal Embeddings': {
			id: 'e8fd402c-337b-4c7a-b6f8-5f596805378b',
			description: 'Multimodal embeddings represent data from different sources, like text and images, in a shared vector space, enabling semantic understanding across modalities.',
			models: [
				{
					id: '0446c408-a932-495f-9ab6-9744760dbbe8',
					source: 1,
					name: '@cf/google/embeddinggemma-2',
					description: 'EmbeddingGemma 2 is an open multimodal embedding model built by Google DeepMind which maps text (incl. code), images, video, and audio inputs—and combinations thereof—into a single, unified 768-dimensional vector space.',
					created_at: '2026-10-08 12:39:40.122',
					tags: [],
					properties: {},
				},
			],
		},
	},
	loras: [
		{
			public: true,
			id: '39fb185c-762a-4633-a2ad-7a4462940608',
			name: 'cf-public-magicoder',
			description: 'LoRA adapter that enables Mistral to generate code',
			created_at: '2024-05-08 02:23:55.897',
			modified_at: '2024-05-08 02:23:55.897',
			model: '@cf/mistral/mistral-7b-instruct-v0.2-lora',
		},
		{
			public: true,
			id: '911a83cf-d947-4c96-b4d2-a86c2c6d2b7f',
			name: 'cf-public-cnn-summarization',
			description: 'LoRA adapter that enables Mistral to summarize articles. https://huggingface.co/predibase/cnn',
			created_at: '2024-05-09 02:11:12.386',
			modified_at: '2024-05-09 02:11:12.386',
			model: '@cf/mistral/mistral-7b-instruct-v0.2-lora',
		},
		{
			public: true,
			id: 'c0b52d28-530b-4751-b7d9-afbdb4795990',
			name: 'cf-public-jigsaw-classification',
			description: 'LoRA adapter that enables Mistral to detect and classify toxic comments. https://huggingface.co/predibase/jigsaw',
			created_at: '2024-05-09 02:19:48.750',
			modified_at: '2024-05-09 02:19:48.750',
			model: '@cf/mistral/mistral-7b-instruct-v0.2-lora',
		},
	],
} as const;
