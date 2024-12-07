export const workersAiCatalog = {
	modelGroups: {
		'Text Generation': {
			id: 'c329a1f9-323d-4e91-b2aa-582dd4188d34',
			description: 'Family of generative text models, such as large language models (LLM), that can be adapted for a variety of natural language tasks.',
			models: [
				{
					id: 'f8703a00-ed54-4f98-bdc3-cd9a813286f3',
					source: 1,
					name: '@cf/qwen/qwen1.5-0.5b-chat',
					description: 'Qwen1.5 is the improved version of Qwen, the large language model series developed by Alibaba Cloud.',
					tags: [],
					properties: {
						beta: true,
						info: 'https://huggingface.co/qwen/qwen1.5-0.5b-chat',
					},
				},
				{
					id: 'e8e8abe4-a372-4c13-815f-4688ba655c8e',
					source: 1,
					name: '@cf/google/gemma-2b-it-lora',
					description: 'This is a Gemma-2B base model that Cloudflare dedicates for inference with LoRA adapters. Gemma is a family of lightweight, state-of-the-art open models from Google, built from the same research and technology used to create the Gemini models.',
					tags: [],
					properties: {
						beta: true,
						lora: true,
					},
				},
				{
					id: 'e5ca943b-720f-4e66-aa8f-40e3d2770933',
					source: 2,
					name: '@hf/nexusflow/starling-lm-7b-beta',
					description: 'We introduce Starling-LM-7B-beta, an open large language model (LLM) trained by Reinforcement Learning from AI Feedback (RLAIF). Starling-LM-7B-beta is trained from Openchat-3.5-0106 with our new reward model Nexusflow/Starling-RM-34B and policy optimization method Fine-Tuning Language Models from Human Preferences (PPO).',
					tags: [],
					properties: {
						beta: true,
						info: 'https://huggingface.co/Nexusflow/Starling-LM-7B-beta',
						max_batch_prefill_tokens: 8192,
						max_input_length: 3072,
						max_total_tokens: 4096,
					},
				},
				{
					id: 'e11d8f45-7b08-499a-9eeb-71d4d3c8cbf9',
					source: 1,
					name: '@cf/meta/llama-3-8b-instruct',
					description: 'Generation over generation, Meta Llama 3 demonstrates state-of-the-art performance on a wide range of industry benchmarks and offers new capabilities, including improved reasoning.',
					tags: [],
					properties: {
						info: 'https://llama.meta.com',
						terms: 'https://llama.meta.com/llama3/license/#',
					},
				},
				{
					id: 'd9dc8363-66f4-4bb0-8641-464ee7bfc131',
					source: 1,
					name: '@cf/meta/llama-3.2-3b-instruct',
					description: 'The Llama 3.2 instruction-tuned text only models are optimized for multilingual dialogue use cases, including agentic retrieval and summarization tasks.',
					tags: [],
					properties: {
						terms: 'https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/LICENSE',
					},
				},
				{
					id: 'd9b7a55c-cefa-4208-8ab3-11497a2b046c',
					source: 2,
					name: '@hf/thebloke/llamaguard-7b-awq',
					description: 'Llama Guard is a model for classifying the safety of LLM prompts and responses, using a taxonomy of safety risks.\n',
					tags: [],
					properties: {
						beta: true,
					},
				},
				{
					id: 'd2ba5c6b-bbb7-49d6-b466-900654870cd6',
					source: 2,
					name: '@hf/thebloke/neural-chat-7b-v3-1-awq',
					description: 'This model is a fine-tuned 7B parameter LLM on the Intel Gaudi 2 processor from the mistralai/Mistral-7B-v0.1 on the open source dataset Open-Orca/SlimOrca.',
					tags: [],
					properties: {
						beta: true,
					},
				},
				{
					id: 'ca54bcd6-0d98-4739-9b3b-5c8b4402193d',
					source: 1,
					name: '@cf/meta/llama-2-7b-chat-fp16',
					description: 'Full precision (fp16) generative text model with 7 billion parameters from Meta',
					tags: [],
					properties: {
						beta: true,
						info: 'https://ai.meta.com/llama/',
						terms: 'https://ai.meta.com/resources/models-and-libraries/llama-downloads/',
					},
				},
				{
					id: 'c907d0f9-d69d-4e93-b501-4daeb4fd69eb',
					source: 1,
					name: '@cf/mistral/mistral-7b-instruct-v0.1',
					description: 'Instruct fine-tuned version of the Mistral-7b generative text model with 7 billion parameters',
					tags: [],
					properties: {
						beta: true,
						info: 'https://mistral.ai/news/announcing-mistral-7b/',
						lora: true,
					},
				},
				{
					id: 'c58c317b-0c15-4bda-abb6-93e275f282d9',
					source: 1,
					name: '@cf/mistral/mistral-7b-instruct-v0.2-lora',
					description: 'The Mistral-7B-Instruct-v0.2 Large Language Model (LLM) is an instruct fine-tuned version of the Mistral-7B-v0.2.',
					tags: [],
					properties: {
						beta: true,
						lora: true,
					},
				},
				{
					id: 'bf6ddd21-6477-4681-bbbe-24c3d5423e78',
					source: 1,
					name: '@cf/tinyllama/tinyllama-1.1b-chat-v1.0',
					description: 'The TinyLlama project aims to pretrain a 1.1B Llama model on 3 trillion tokens. This is the chat model finetuned on top of TinyLlama/TinyLlama-1.1B-intermediate-step-1431k-3T.',
					tags: [],
					properties: {
						beta: true,
						info: 'https://huggingface.co/TinyLlama/TinyLlama-1.1B-Chat-v1.0',
					},
				},
				{
					id: 'b97d7069-48d9-461c-80dd-445d20a632eb',
					source: 2,
					name: '@hf/mistral/mistral-7b-instruct-v0.2',
					description: 'The Mistral-7B-Instruct-v0.2 Large Language Model (LLM) is an instruct fine-tuned version of the Mistral-7B-v0.2. Mistral-7B-v0.2 has the following changes compared to Mistral-7B-v0.1: 32k context window (vs 8k context in v0.1), rope-theta = 1e6, and no Sliding-Window Attention.',
					tags: [],
					properties: {
						beta: true,
						info: 'https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2',
						lora: true,
						max_batch_prefill_tokens: 8192,
						max_input_length: 3072,
						max_total_tokens: 4096,
					},
				},
				{
					id: 'b7fe7ad2-aeaf-47d2-8bfa-7a5ae22a2ab4',
					source: 1,
					name: '@cf/fblgit/una-cybertron-7b-v2-bf16',
					description: "Cybertron 7B v2 is a 7B MistralAI based model, best on it's series. It was trained with SFT, DPO and UNA (Unified Neural Alignment) on multiple datasets.",
					tags: [],
					properties: {
						beta: true,
					},
				},
				{
					id: '9d2ab560-065e-4d0d-a789-d4bc7468d33e',
					source: 1,
					name: '@cf/thebloke/discolm-german-7b-v1-awq',
					description: 'DiscoLM German 7b is a Mistral-based large language model with a focus on German-language applications. AWQ is an efficient, accurate and blazing-fast low-bit weight quantization method, currently supporting 4-bit quantization.',
					tags: [],
					properties: {
						beta: true,
						info: 'https://huggingface.co/TheBloke/DiscoLM_German_7b_v1-AWQ',
					},
				},
				{
					id: '9c95c39d-45b3-4163-9631-22f0c0dc3b14',
					source: 1,
					name: '@cf/meta/llama-2-7b-chat-int8',
					description: 'Quantized (int8) generative text model with 7 billion parameters from Meta',
					tags: [],
					properties: {},
				},
				{
					id: '9b9c87c6-d4b7-494c-b177-87feab5904db',
					source: 1,
					name: '@cf/meta/llama-3.1-8b-instruct-fp8',
					description: 'Llama 3.1 8B quantized to FP8 precision',
					tags: [],
					properties: {
						terms: 'https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/LICENSE',
					},
				},
				{
					id: '980ec5e9-33c2-483a-a2d8-cd092fdf273f',
					source: 2,
					name: '@hf/thebloke/mistral-7b-instruct-v0.1-awq',
					description: 'Mistral 7B Instruct v0.1 AWQ is an efficient, accurate and blazing-fast low-bit weight quantized Mistral variant.',
					tags: [],
					properties: {
						beta: true,
						info: 'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-AWQ',
					},
				},
				{
					id: '90a20ae7-7cf4-4eb3-8672-8fc4ee580635',
					source: 1,
					name: '@cf/qwen/qwen1.5-7b-chat-awq',
					description: 'Qwen1.5 is the improved version of Qwen, the large language model series developed by Alibaba Cloud. AWQ is an efficient, accurate and blazing-fast low-bit weight quantization method, currently supporting 4-bit quantization.',
					tags: [],
					properties: {
						beta: true,
						info: 'https://huggingface.co/qwen/qwen1.5-7b-chat-awq',
					},
				},
				{
					id: '906a57fd-b018-4d6c-a43e-a296d4cc5839',
					source: 1,
					name: '@cf/meta/llama-3.2-1b-instruct',
					description: 'The Llama 3.2 instruction-tuned text only models are optimized for multilingual dialogue use cases, including agentic retrieval and summarization tasks.',
					tags: [],
					properties: {
						terms: 'https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/LICENSE',
					},
				},
				{
					id: '85c5a3c6-24b0-45e7-b23a-023182578822',
					source: 2,
					name: '@hf/thebloke/llama-2-13b-chat-awq',
					description: 'Llama 2 13B Chat AWQ is an efficient, accurate and blazing-fast low-bit weight quantized Llama 2 variant.',
					tags: [],
					properties: {
						beta: true,
						info: 'https://huggingface.co/TheBloke/Llama-2-13B-chat-AWQ',
					},
				},
				{
					id: '7f180530-2e16-4116-9d26-f49fbed9d372',
					source: 2,
					name: '@hf/thebloke/deepseek-coder-6.7b-base-awq',
					description: 'Deepseek Coder is composed of a series of code language models, each trained from scratch on 2T tokens, with a composition of 87% code and 13% natural language in both English and Chinese.',
					tags: [],
					properties: {
						beta: true,
						terms: 'https://huggingface.co/TheBloke/deepseek-coder-6.7B-base-AWQ',
					},
				},
				{
					id: '7ed8d8e8-6040-4680-843a-aef402d6b013',
					source: 1,
					name: '@cf/meta-llama/llama-2-7b-chat-hf-lora',
					description: 'This is a Llama2 base model that Cloudflare dedicated for inference with LoRA adapters. Llama 2 is a collection of pretrained and fine-tuned generative text models ranging in scale from 7 billion to 70 billion parameters. This is the repository for the 7B fine-tuned model, optimized for dialogue use cases and converted for the Hugging Face Transformers format. ',
					tags: [],
					properties: {
						beta: true,
						lora: true,
					},
				},
				{
					id: '7a143886-c9bb-4a1c-be95-377b1973bc3b',
					source: 1,
					name: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
					description: 'Llama 3.3 70B quantized to fp8 precision, optimized to be faster.',
					tags: [],
					properties: {
						terms: 'https://github.com/meta-llama/llama-models/blob/main/models/llama3_3/LICENSE',
					},
				},
				{
					id: '673c56cc-8553-49a1-b179-dd549ec9209a',
					source: 2,
					name: '@hf/thebloke/openhermes-2.5-mistral-7b-awq',
					description: 'OpenHermes 2.5 Mistral 7B is a state of the art Mistral Fine-tune, a continuation of OpenHermes 2 model, which trained on additional code datasets.',
					tags: [],
					properties: {
						beta: true,
					},
				},
				{
					id: '60474554-f03b-4ff4-8ecc-c1b7c71d7b29',
					source: 2,
					name: '@hf/thebloke/deepseek-coder-6.7b-instruct-awq',
					description: 'Deepseek Coder is composed of a series of code language models, each trained from scratch on 2T tokens, with a composition of 87% code and 13% natural language in both English and Chinese.',
					tags: [],
					properties: {
						beta: true,
						terms: 'https://huggingface.co/TheBloke/deepseek-coder-6.7B-instruct-AWQ',
					},
				},
				{
					id: '4c3a544e-da47-4336-9cea-c7cbfab33f16',
					source: 1,
					name: '@cf/deepseek-ai/deepseek-math-7b-instruct',
					description: 'DeepSeekMath-Instruct 7B is a mathematically instructed tuning model derived from DeepSeekMath-Base 7B. DeepSeekMath is initialized with DeepSeek-Coder-v1.5 7B and continues pre-training on math-related tokens sourced from Common Crawl, together with natural language and code data for 500B tokens.',
					tags: [],
					properties: {
						beta: true,
						info: 'https://huggingface.co/deepseek-ai/deepseek-math-7b-instruct',
						terms: 'https://github.com/deepseek-ai/DeepSeek-Math/blob/main/LICENSE-MODEL',
					},
				},
				{
					id: '48dd2443-0c61-43b2-8894-22abddf1b081',
					source: 1,
					name: '@cf/tiiuae/falcon-7b-instruct',
					description: 'Falcon-7B-Instruct is a 7B parameters causal decoder-only model built by TII based on Falcon-7B and finetuned on a mixture of chat/instruct datasets.',
					tags: [],
					properties: {
						beta: true,
						info: 'https://huggingface.co/tiiuae/falcon-7b-instruct',
					},
				},
				{
					id: '44774b85-08c8-4bb8-8d2a-b06ebc538a79',
					source: 2,
					name: '@hf/nousresearch/hermes-2-pro-mistral-7b',
					description: 'Hermes 2 Pro on Mistral 7B is the new flagship 7B Hermes! Hermes 2 Pro is an upgraded, retrained version of Nous Hermes 2, consisting of an updated and cleaned version of the OpenHermes 2.5 Dataset, as well as a newly introduced Function Calling and JSON Mode dataset developed in-house.',
					tags: [],
					properties: {
						beta: true,
						function_calling: true,
						info: 'https://huggingface.co/NousResearch/Hermes-2-Pro-Mistral-7B',
					},
				},
				{
					id: '41975cc2-c82e-4e98-b7b8-88ffb186a545',
					source: 1,
					name: '@cf/meta/llama-3.1-8b-instruct',
					description: 'The Meta Llama 3.1 collection of multilingual large language models (LLMs) is a collection of pretrained and instruction tuned generative models. The Llama 3.1 instruction tuned text only models are optimized for multilingual dialogue use cases and outperform many of the available open source and closed chat models on common industry benchmarks.',
					tags: [],
					properties: {
						terms: 'https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/LICENSE',
					},
				},
				{
					id: '3dcb4f2d-26a8-412b-b6e3-2a368beff66b',
					source: 1,
					name: '@cf/meta/llama-3.1-8b-instruct-awq',
					description: 'Quantized (int4) generative text model with 8 billion parameters from Meta.\n',
					tags: [],
					properties: {
						terms: 'https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/LICENSE',
					},
				},
				{
					id: '3976bab8-3810-4ad8-8580-ab1e22de7823',
					source: 2,
					name: '@hf/thebloke/zephyr-7b-beta-awq',
					description: 'Zephyr 7B Beta AWQ is an efficient, accurate and blazing-fast low-bit weight quantized Zephyr model variant.',
					tags: [],
					properties: {
						beta: true,
						info: 'https://huggingface.co/TheBloke/zephyr-7B-beta-AWQ',
					},
				},
				{
					id: '337170b7-bd2f-4631-9a57-688b579cf6d3',
					source: 1,
					name: '@cf/google/gemma-7b-it-lora',
					description: '  This is a Gemma-7B base model that Cloudflare dedicates for inference with LoRA adapters. Gemma is a family of lightweight, state-of-the-art open models from Google, built from the same research and technology used to create the Gemini models.',
					tags: [],
					properties: {
						beta: true,
						lora: true,
					},
				},
				{
					id: '3222ddb3-e211-4fd9-9a6d-79a80e47b3a6',
					source: 1,
					name: '@cf/qwen/qwen1.5-1.8b-chat',
					description: 'Qwen1.5 is the improved version of Qwen, the large language model series developed by Alibaba Cloud.',
					tags: [],
					properties: {
						beta: true,
						info: 'https://huggingface.co/qwen/qwen1.5-1.8b-chat',
					},
				},
				{
					id: '31097538-a3ff-4e6e-bb56-ad0e1f428b61',
					source: 1,
					name: '@cf/meta/llama-3-8b-instruct-awq',
					description: 'Quantized (int4) generative text model with 8 billion parameters from Meta.',
					tags: [],
					properties: {
						info: 'https://llama.meta.com',
						terms: 'https://llama.meta.com/llama3/license/#',
					},
				},
				{
					id: '2cbc033b-ded8-4e02-bbb2-47cf05d5cfe5',
					source: 1,
					name: '@cf/meta/llama-3.2-11b-vision-instruct',
					description: ' The Llama 3.2-Vision instruction-tuned models are optimized for visual recognition, image reasoning, captioning, and answering general questions about an image.',
					tags: [],
					properties: {
						terms: 'https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/LICENSE',
					},
				},
				{
					id: '1dc9e589-df6b-4e66-ac9f-ceff42d64983',
					source: 1,
					name: '@cf/defog/sqlcoder-7b-2',
					description: 'This model is intended to be used by non-technical users to understand data inside their SQL databases. ',
					tags: [],
					properties: {
						beta: true,
						info: 'https://huggingface.co/defog/sqlcoder-7b-2',
						terms: 'https://creativecommons.org/licenses/by-sa/4.0/deed.en',
					},
				},
				{
					id: '1d933df3-680f-4280-940d-da87435edb07',
					source: 1,
					name: '@cf/microsoft/phi-2',
					description: 'Phi-2 is a Transformer-based model with a next-word prediction objective, trained on 1.4T tokens from multiple passes on a mixture of Synthetic and Web datasets for NLP and coding.',
					tags: [],
					properties: {
						beta: true,
						info: 'https://huggingface.co/microsoft/phi-2',
					},
				},
				{
					id: '1a7b6ad6-9987-4bd3-a329-20ee8de93296',
					source: 2,
					name: '@hf/meta-llama/meta-llama-3-8b-instruct',
					description: 'Generation over generation, Meta Llama 3 demonstrates state-of-the-art performance on a wide range of industry benchmarks and offers new capabilities, including improved reasoning.\t',
					tags: [],
					properties: {},
				},
				{
					id: '0f002249-7d86-4698-aabf-8529ed86cefb',
					source: 2,
					name: '@hf/google/gemma-7b-it',
					description: 'Gemma is a family of lightweight, state-of-the-art open models from Google, built from the same research and technology used to create the Gemini models. They are text-to-text, decoder-only large language models, available in English, with open weights, pre-trained variants, and instruction-tuned variants.',
					tags: [],
					properties: {
						beta: true,
						info: 'https://ai.google.dev/gemma/docs',
						lora: true,
						max_batch_prefill_tokens: 2048,
						max_input_length: 1512,
						max_total_tokens: 2048,
						terms: 'https://ai.google.dev/gemma/terms',
					},
				},
				{
					id: '09d113a9-03c4-420e-b6f2-52ad4b3bed45',
					source: 1,
					name: '@cf/qwen/qwen1.5-14b-chat-awq',
					description: 'Qwen1.5 is the improved version of Qwen, the large language model series developed by Alibaba Cloud. AWQ is an efficient, accurate and blazing-fast low-bit weight quantization method, currently supporting 4-bit quantization.',
					tags: [],
					properties: {
						beta: true,
						info: 'https://huggingface.co/qwen/qwen1.5-14b-chat-awq',
					},
				},
				{
					id: '081054cd-a254-4349-855e-6dc0996277fa',
					source: 1,
					name: '@cf/openchat/openchat-3.5-0106',
					description: 'OpenChat is an innovative library of open-source language models, fine-tuned with C-RLFT - a strategy inspired by offline reinforcement learning.',
					tags: [],
					properties: {
						beta: true,
						info: 'https://huggingface.co/openchat/openchat-3.5-0106',
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
					tags: [],
					properties: {
						beta: true,
						info: 'https://huggingface.co/Intel/distilbert-base-uncased-finetuned-sst-2-english-int8-static',
					},
				},
			],
		},
		'Object Detection': {
			id: '9c178979-90d9-49d8-9e2c-0f1cf01815d4',
			description: 'Object detection models can detect instances of objects like persons, faces, license plates, or others in an image. This task takes an image as input and returns a list of detected objects, each one containing a label, a probability score, and its surrounding box coordinates.',
			models: [
				{
					id: 'cc34ce52-3059-415f-9a48-12aa919d37ee',
					source: 1,
					name: '@cf/facebook/detr-resnet-50',
					description: 'DEtection TRansformer (DETR) model trained end-to-end on COCO 2017 object detection (118k annotated images).',
					tags: [],
					properties: {
						beta: true,
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
					tags: [],
					properties: {
						beta: true,
						info: 'https://openai.com/research/whisper',
					},
				},
				{
					id: '2169496d-9c0e-4e49-8399-c44ee66bff7d',
					source: 1,
					name: '@cf/openai/whisper-tiny-en',
					description: 'Whisper is a pre-trained model for automatic speech recognition (ASR) and speech translation. Trained on 680k hours of labelled data, Whisper models demonstrate a strong ability to generalize to many datasets and domains without the need for fine-tuning. This is the English-only version of the Whisper Tiny model which was trained on the task of speech recognition.',
					tags: [],
					properties: {
						beta: true,
					},
				},
			],
		},
		'Image-to-Text': {
			id: '882a91d1-c331-4eec-bdad-834c919942a8',
			description: 'Image to text models output a text from a given image. Image captioning or optical character recognition can be considered as the most common applications of image to text.',
			models: [
				{
					id: 'af274959-cb47-4ba8-9d8e-5a0a58b6b402',
					source: 1,
					name: '@cf/llava-hf/llava-1.5-7b-hf',
					description: 'LLaVA is an open-source chatbot trained by fine-tuning LLaMA/Vicuna on GPT-generated multimodal instruction-following data. It is an auto-regressive language model, based on the transformer architecture.',
					tags: [],
					properties: {
						beta: true,
					},
				},
				{
					id: '3dca5889-db3e-4973-aa0c-3a4a6bd22d29',
					source: 1,
					name: '@cf/unum/uform-gen2-qwen-500m',
					description: 'UForm-Gen is a small generative vision-language model primarily designed for Image Captioning and Visual Question Answering. The model was pre-trained on the internal image captioning dataset and fine-tuned on public instructions datasets: SVIT, LVIS, VQAs datasets.',
					tags: [],
					properties: {
						beta: true,
						info: 'https://www.unum.cloud/',
					},
				},
			],
		},
		'Text-to-Image': {
			id: '3d6e1f35-341b-4915-a6c8-9a7142a9033a',
			description: 'Generates images from input text. These models can be used to generate and modify images based on text prompts.',
			models: [
				{
					id: 'a9abaef0-3031-47ad-8790-d311d8684c6c',
					source: 1,
					name: '@cf/runwayml/stable-diffusion-v1-5-inpainting',
					description: 'Stable Diffusion Inpainting is a latent text-to-image diffusion model capable of generating photo-realistic images given any text input, with the extra capability of inpainting the pictures by using a mask.',
					tags: [],
					properties: {
						beta: true,
						info: 'https://huggingface.co/runwayml/stable-diffusion-inpainting',
						terms: 'https://github.com/runwayml/stable-diffusion/blob/main/LICENSE',
					},
				},
				{
					id: '9e087485-23dc-47fa-997d-f5bfafc0c7cc',
					source: 1,
					name: '@cf/black-forest-labs/flux-1-schnell',
					description: 'FLUX.1 [schnell] is a 12 billion parameter rectified flow transformer capable of generating images from text descriptions. ',
					tags: [],
					properties: {
						beta: true,
					},
				},
				{
					id: '7f797b20-3eb0-44fd-b571-6cbbaa3c423b',
					source: 1,
					name: '@cf/bytedance/stable-diffusion-xl-lightning',
					description: 'SDXL-Lightning is a lightning-fast text-to-image generation model. It can generate high-quality 1024px images in a few steps.',
					tags: [],
					properties: {
						beta: true,
						info: 'https://huggingface.co/ByteDance/SDXL-Lightning',
					},
				},
				{
					id: '7912c0ab-542e-44b9-b9ee-3113d226a8b5',
					source: 1,
					name: '@cf/lykon/dreamshaper-8-lcm',
					description: 'Stable Diffusion model that has been fine-tuned to be better at photorealism without sacrificing range.',
					tags: [],
					properties: {
						beta: true,
						info: 'https://huggingface.co/Lykon/DreamShaper',
					},
				},
				{
					id: '6d52253a-b731-4a03-b203-cde2d4fae871',
					source: 1,
					name: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
					description: 'Diffusion-based text-to-image generative model by Stability AI. Generates and modify images based on text prompts.',
					tags: [],
					properties: {
						beta: true,
						info: 'https://stability.ai/stable-diffusion',
						terms: 'https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/blob/main/LICENSE.md',
					},
				},
				{
					id: '19547f04-7a6a-4f87-bf2c-f5e32fb12dc5',
					source: 1,
					name: '@cf/runwayml/stable-diffusion-v1-5-img2img',
					description: 'Stable Diffusion is a latent text-to-image diffusion model capable of generating photo-realistic images. Img2img generate a new image from an input image with Stable Diffusion. ',
					tags: [],
					properties: {
						beta: true,
						info: 'https://huggingface.co/runwayml/stable-diffusion-v1-5',
						terms: 'https://github.com/runwayml/stable-diffusion/blob/main/LICENSE',
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
					tags: [],
					properties: {
						beta: true,
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
					tags: [],
					properties: {
						beta: true,
						info: 'https://github.com/facebookresearch/fairseq/tree/main/examples/m2m_100',
						languages: 'english, chinese, french, spanish, arabic, russian, german, japanese, portuguese, hindi',
						terms: 'https://github.com/facebookresearch/fairseq/blob/main/LICENSE',
					},
				},
			],
		},
		'Text Embeddings': {
			id: '0137cdcf-162a-4108-94f2-1ca59e8c65ee',
			description: 'Feature extraction models transform raw data into numerical features that can be processed while preserving the information in the original dataset. These models are ideal as part of building vector search applications or Retrieval Augmented Generation workflows with Large Language Models (LLM).',
			models: [
				{
					id: '57fbd08a-a4c4-411c-910d-b9459ff36c20',
					source: 1,
					name: '@cf/baai/bge-small-en-v1.5',
					description: 'BAAI general embedding (bge) models transform any given text into a compact vector',
					tags: [],
					properties: {
						beta: true,
						info: 'https://huggingface.co/BAAI/bge-base-en-v1.5',
						max_input_tokens: 512,
						output_dimensions: 384,
					},
				},
				{
					id: '429b9e8b-d99e-44de-91ad-706cf8183658',
					source: 1,
					name: '@cf/baai/bge-base-en-v1.5',
					description: 'BAAI general embedding (bge) models transform any given text into a compact vector',
					tags: [],
					properties: {
						beta: true,
						info: 'https://huggingface.co/BAAI/bge-base-en-v1.5',
						max_input_tokens: 512,
						output_dimensions: 768,
					},
				},
				{
					id: '01bc2fb0-4bca-4598-b985-d2584a3f46c0',
					source: 1,
					name: '@cf/baai/bge-large-en-v1.5',
					description: 'BAAI general embedding (bge) models transform any given text into a compact vector',
					tags: [],
					properties: {
						beta: true,
						info: 'https://huggingface.co/BAAI/bge-base-en-v1.5',
						max_input_tokens: 512,
						output_dimensions: 1024,
					},
				},
			],
		},
		Summarization: {
			id: '6f4e65d8-da0f-40d2-9aa4-db582a5a04fd',
			description: 'Summarization is the task of producing a shorter version of a document while preserving its important information. Some models can extract text from the original input, while other models can generate entirely new text.',
			models: [
				{
					id: '19bd38eb-bcda-4e53-bec2-704b4689b43a',
					source: 1,
					name: '@cf/facebook/bart-large-cnn',
					description: 'BART is a transformer encoder-encoder (seq2seq) model with a bidirectional (BERT-like) encoder and an autoregressive (GPT-like) decoder. You can use this model for text summarization.',
					tags: [],
					properties: {
						beta: true,
					},
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
