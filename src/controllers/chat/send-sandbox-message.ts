
import { Response, Request } from "express"
import { MessageSender } from "@prisma/client"
import { ErrorResponse, ProcessedSandboxChatData, ProjectUUID, StartChatSuccess } from "@bluedotrobots/common-ts"
import StreamManager from "../../classes/stream-manager"
import selectModel from "../../utils/llm/model-selector"
import OpenAiClientClass from "../../classes/openai-client"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import buildSandboxLLMContext from "../../utils/llm/build-sandbox-llm-context"
import addSandboxMessage from "../../db-operations/write/sandbox-message/add-sandbox-message"

export default function sendSandboxMessage(req: Request, res: Response): void {
	try {
		const { userId } = req
		const { projectUUID } = req.params as { projectUUID: ProjectUUID }
		const chatData = req.body as ProcessedSandboxChatData

		// Create a new stream and get streamId
		const { streamId, abortController } = StreamManager.getInstance().createStream()

		// Immediately respond with streamId so client can use it to stop if needed
		res.status(200).json({ streamId } as StartChatSuccess)

		// Process LLM request with streaming via WebSocket (async)
		processLLMRequest(chatData, userId, streamId, abortController.signal, projectUUID)
			.catch(error => {
				console.error("Background LLM processing error:", error)
			})

	} catch (error) {
		console.error("Chatbot endpoint error:", error)
		res.status(500).json({
			error: "Internal Server Error: Unable to process chatbot request"
		} satisfies ErrorResponse)
	}
}

// eslint-disable-next-line complexity, max-lines-per-function
async function processLLMRequest(
	chatData: ProcessedSandboxChatData,
	userId: number,
	streamId: string,
	abortSignal: AbortSignal,
	sandboxProjectUUID: ProjectUUID
): Promise<void> {
	const socketManager = BrowserSocketManager.getInstance()

	try {
		// Check if already aborted
		if (abortSignal.aborted) return

		await addSandboxMessage(
			chatData.sandboxChatId,
			chatData.message,
			MessageSender.USER
		)

		// Build LLM context
		const messages = buildSandboxLLMContext(chatData)

		// Select model based on interaction type
		const modelId = selectModel("generalQuestion")

		// Send start event with challengeId
		socketManager.emitSandboxChatbotStart(userId, sandboxProjectUUID)

		// Check abort before making OpenAI call
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (abortSignal.aborted) return

		// Get OpenAI client and make streaming request with abort signal
		const openAiClient = await OpenAiClientClass.getOpenAiClient()
		const stream = await openAiClient.chat.completions.create({
			model: modelId,
			messages: messages.map(msg => ({
				role: msg.role,
				content: msg.content
			})),
			stream: true,

			temperature: 0.6,              // Lower than 0.7 for more focused responses
			max_completion_tokens: 1200,   // Slightly shorter to stay concise
			presence_penalty: 0.4,         // Higher to avoid repetitive unsafe suggestions
			frequency_penalty: 0.3,        // Reduce repetition of potentially problematic phrases
			stop: ["```cpp\n// END", "\n---\n", "CHALLENGE COMPLETE"]
		}, {
			signal: abortSignal
		})

		let aiResponseContent = "" // Collect full AI response

		try {
			// Stream chunks back via WebSocket with challengeId
			for await (const chunk of stream) {
				// Check if aborted during streaming
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, max-depth
				if (abortSignal.aborted) break

				const content = chunk.choices[0]?.delta?.content
				// eslint-disable-next-line max-depth
				if (content) {
					aiResponseContent += content // Collect the content
					socketManager.emitSandboxChatbotChunk(userId, content, sandboxProjectUUID)
				}
			}

			// Only save and send completion if not aborted
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (!abortSignal.aborted && aiResponseContent.trim()) {
				// Save AI response to database
				await addSandboxMessage(
					chatData.sandboxChatId,
					aiResponseContent,
					MessageSender.AI,
					modelId
				)

				socketManager.emitSandboxChatbotComplete(userId, sandboxProjectUUID)
			}

		} catch (error) {
			if (error instanceof Error && error.name === "AbortError") {
				// If aborted during streaming, don't save partial response
			} else {
				throw error
			}
		}

	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			// Handle abort gracefully
		} else {
			console.error("LLM processing error:", error)
			if (!abortSignal.aborted) {
				// Could emit error via WebSocket here if needed
			}
		}
	} finally {
		// Clean up the stream
		StreamManager.getInstance().stopStream(streamId)
	}
}
