/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable max-depth */
import { Response, Request } from "express"
import { ErrorResponse, StartChatSuccess, ChallengeData, ChatMessage } from "@bluedotrobots/common-ts"
import StreamManager from "../../classes/stream-manager"
import selectModel from "../../utils/llm/model-selector"
import OpenAiClientClass from "../../classes/openai-client"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import findChallengeDataFromId from "../../utils/llm/find-challenge-data-from-id"
import getNextHintNumber from "../../db-operations/read/career-quest-hint/get-next-hint-number"
import addCareerQuestHint from "../../db-operations/write/career-quest-hint/add-career-quest-hint"

export default function requestCareerQuestHint(req: Request, res: Response): void {
	try {
		const { userId } = req
		const chatData = req.body as ProcessedCareerQuestHintMessage

		// Create a new stream and get streamId
		const { streamId, abortController } = StreamManager.getInstance().createStream()

		// Immediately respond with streamId so client can use it to stop if needed
		res.status(200).json({ streamId } satisfies StartChatSuccess)

		// Process hint request with streaming via WebSocket (async)
		processHintRequest(chatData, userId, streamId, abortController.signal)
			.catch(error => {
				console.error("Background hint processing error:", error)
			})

	} catch (error) {
		console.error("Hint request endpoint error:", error)
		res.status(500).json({
			error: "Internal Server Error: Unable to process hint request"
		} satisfies ErrorResponse)
	}
}

// eslint-disable-next-line max-lines-per-function, complexity
async function processHintRequest(
	chatData: ProcessedCareerQuestHintMessage,
	userId: number,
	streamId: string,
	abortSignal: AbortSignal
): Promise<void> {
	const socketManager = BrowserSocketManager.getInstance()

	try {
		// Check if already aborted
		if (abortSignal.aborted) return

		// Get the next hint number for this chat
		const hintNumber = await getNextHintNumber(chatData.careerQuestChatId)

		// Build specialized LLM context for hints
		const messages = buildHintLLMContext(
			findChallengeDataFromId(chatData.careerQuestChallengeId),
			chatData.userCode,
			chatData.conversationHistory,
			hintNumber
		)

		// Select model for hint generation
		const modelId = selectModel("hint")

		// Send start event
		socketManager.emitCqChatbotStart(userId, {
			challengeId: chatData.careerQuestChallengeId,
			interactionType: "hint"
		})

		// Check abort before making OpenAI call
		if (abortSignal.aborted) return

		// Get OpenAI client and make streaming request
		const openAiClient = await OpenAiClientClass.getOpenAiClient()
		const stream = await openAiClient.chat.completions.create({
			model: modelId,
			messages: messages.map(msg => ({
				role: msg.role,
				content: msg.content
			})),
			stream: true,
			temperature: 0.4,              // Slightly lower for more focused hints
			max_completion_tokens: 1000,   // Shorter than general chat for concise hints
			presence_penalty: 0.3,         // Encourage variety in hints
			frequency_penalty: 0.2,
		}, {
			signal: abortSignal
		})

		let hintContent = "" // Collect full hint response

		try {
			// Stream chunks back via WebSocket
			for await (const chunk of stream) {
				if (abortSignal.aborted) break

				const content = chunk.choices[0]?.delta?.content

				if (content) {
					hintContent += content
					socketManager.emitCqChatbotChunk(userId, content, chatData.careerQuestChallengeId)
				}
			}

			// Only save if not aborted and we have content
			if (!abortSignal.aborted && hintContent.trim()) {
				// Save hint to database
				await addCareerQuestHint({
					careerQuestChatId: chatData.careerQuestChatId,
					hintText: hintContent,
					modelUsed: modelId
				})

				socketManager.emitCqChatbotComplete(userId, chatData.careerQuestChallengeId)
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
			console.error("Hint processing error:", error)
			if (!abortSignal.aborted) {
				// Could emit error via WebSocket here if needed
			}
		}
	} finally {
		// Clean up the stream
		StreamManager.getInstance().stopStream(streamId)
	}
}

// eslint-disable-next-line max-lines-per-function
function buildHintLLMContext(
	challengeData: ChallengeData,
	userCode: string,
	conversationHistory: ChatMessage[],
	hintNumber: number
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
	const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = []

	// System prompt for hint generation
	const systemPrompt = "You are a helpful robotics tutor providing hints for coding challenges. " +
		`Your goal is to guide students toward the solution without giving it away completely.

Guidelines for hints:
- This is hint #${hintNumber} for this challenge
- Be progressive: earlier hints should be more general, later hints more specific
- Focus on the learning process, not just the answer
- Encourage problem-solving thinking
- Reference the challenge requirements and expected behavior
- If this is a later hint (3+), you can be more direct but still educational

Challenge Context:
- Title: ${challengeData.title}
- Description: ${challengeData.description}
- Expected Behavior: ${challengeData.expectedBehavior}
- Common Mistakes: ${challengeData.commonMistakes.join(", ")}

Current user code:
${userCode}

Provide a helpful hint that moves the student forward in their learning journey.`

	messages.push({
		role: "system",
		content: systemPrompt
	})

	// Add conversation history for context
	conversationHistory.forEach(message => {
		messages.push({
			role: message.role === "user" ? "user" : "assistant",
			content: message.content
		})
	})

	// Add hint request
	const hintRequest = `I need a hint for this challenge. This would be hint #${hintNumber}. ` +
		"Please help me understand what I should focus on next."

	messages.push({
		role: "user",
		content: hintRequest
	})

	return messages
}
