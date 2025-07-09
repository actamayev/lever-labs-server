/* eslint-disable max-len */
import { isEmpty } from "lodash"
import { ChallengeData, ChatMessage } from "@bluedotrobots/common-ts"
import { BlockFormatter } from "../sandbox/block-formatter"


// eslint-disable-next-line max-lines-per-function
export default function buildCqLLMContext(
	challengeData: ChallengeData,
	userCode: string,
	interactionType: "checkCode" | "hint" | "generalQuestion",
	conversationHistory: ChatMessage[],
	message?: string,
): ChatMessage[] {
	// Format challenge blocks hierarchically for better LLM understanding
	const availableBlocksText = BlockFormatter.formatChallengeBlocksForCqLLMContext(challengeData.availableBlocks)

	const systemPrompt = `You are a friendly robotics tutor helping students aged 10-20 with programming challenges.

CURRENT CHALLENGE: ${challengeData.title}
CHALLENGE ID: ${challengeData.id}
DIFFICULTY: ${challengeData.difficulty}

TASK DESCRIPTION: ${challengeData.description}

AVAILABLE BLOCKS FOR THIS CHALLENGE:
${availableBlocksText}

EXPECTED BEHAVIOR: ${challengeData.expectedBehavior}

LEARNING OBJECTIVES:
${challengeData.learningObjectives.map(obj => `- ${obj}`).join("\n")}

COMMON MISTAKES TO WATCH FOR:
${challengeData.commonMistakes.map(mistake => `- ${mistake}`).join("\n")}

ROBOTICS PROGRAMMING PATTERNS:
- 🤖 Sense → Think → Act: Always read sensors before making decisions
- 🔄 Use forever loops (while(true)) for continuous robot behavior
- 💡 Provide LED feedback to show what the robot is "thinking"
- 🏗️ Structure: setup → wait for button → main behavior loop
- 🧪 Test one feature at a time (e.g., just sensors, then just motors, then combined)

INTERACTION TYPE: ${interactionType}

USER'S CURRENT CODE:
\`\`\`cpp
${userCode || "// No code provided yet"}
\`\`\``

	const messages: ChatMessage[] = [
		{ role: "system", content: systemPrompt, timestamp: new Date() }
	]

	if (!isEmpty(conversationHistory)) {
		const recentHistory = conversationHistory.slice(-10)
		messages.push(...recentHistory)
	}

	// Add current user message based on interaction type
	let userMessage: string
	switch (interactionType) {
	case "checkCode":
		userMessage = "Please analyze my current code and provide specific feedback. Tell me what needs to be fixed or improved to complete the challenge correctly."
		break
	case "hint":
		userMessage = generateHintMessage(challengeData, conversationHistory)
		break
	case "generalQuestion":
		userMessage = message || "I have a question about this robotics challenge."
		break
	}

	messages.push({ role: "user", content: userMessage, timestamp: new Date() })
	return messages
}

function generateHintMessage(challengeData: ChallengeData, conversationHistory: ChatMessage[]): string {
	const hintCount = conversationHistory.filter(msg =>
		msg.role === "user" && msg.content.toLowerCase().includes("hint")
	).length

	let baseMessage = "I need a helpful hint to guide me in the right direction. "

	if (challengeData.hints) {
		if (hintCount === 0) {
			baseMessage += `Here's a gentle nudge: ${challengeData.hints.level1}`
		} else if (hintCount === 1) {
			baseMessage += `Here's a more specific hint: ${challengeData.hints.level2}`
		} else if (hintCount >= 2) {
			baseMessage += `Here's a detailed hint: ${challengeData.hints.level3}`
		}
	} else {
		if (hintCount === 0) {
			baseMessage += "Please give me a gentle nudge in the right direction without giving away the full solution."
		} else if (hintCount === 1) {
			baseMessage += "I still need help. Can you give me a more specific hint?"
		} else {
			baseMessage += "I'm really struggling. Can you give me a more detailed hint, but still let me figure out the final steps?"
		}
	}

	return baseMessage
}
