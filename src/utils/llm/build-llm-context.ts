/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

import { isEmpty } from "lodash"
import { ChallengeData, ChatMessage } from "@bluedotrobots/common-ts"

export function buildLLMContext(
	challengeData: ChallengeData,
	userCode: string,
	interactionType: "checkCode" | "hint" | "generalQuestion",
	conversationHistory: ChatMessage[],
	message?: string,
): ChatMessage[] {
	const systemPrompt = `You are a robotics tutor helping students aged 10-70 with programming challenges.

CURRENT CHALLENGE: ${challengeData.title}
CHALLENGE ID: ${challengeData.id}
DIFFICULTY: ${challengeData.difficulty}

TASK DESCRIPTION: ${challengeData.description}

AVAILABLE BLOCKS:
${challengeData.availableBlocks.map(block =>
		`- ${block.type} (${block.category}): ${block.description}${block.codeTemplate ? `
  Template: ${block.codeTemplate}` : ""}`
	).join("\n")}

AVAILABLE SENSORS: ${challengeData.availableSensors.join(", ")}

EXPECTED BEHAVIOR: ${challengeData.expectedBehavior}

LEARNING OBJECTIVES:
${challengeData.learningObjectives.map(obj => `- ${obj}`).join("\n")}

COMMON MISTAKES TO WATCH FOR:
${challengeData.commonMistakes.map(mistake => `- ${mistake}`).join("\n")}

CONSTRAINTS:
- Only suggest solutions using the available blocks and sensors listed above
- If asked about other sensors/components, acknowledge but redirect to available options
- No hardware modifications or safety-related changes
- Age-appropriate explanations (ages 10-20, adjust complexity accordingly)
- Stay focused on the current challenge
- Be encouraging and educational
- For hints, be progressive - don't give away the full solution immediately

INTERACTION TYPE: ${interactionType}

USER'S CURRENT CODE:
\`\`\`cpp
${userCode || "// No code provided yet"}
\`\`\``

	const messages: ChatMessage[] = [
		{ role: "system", content: systemPrompt }
	]

	// Add conversation history if available
	if (!isEmpty(conversationHistory)) {
		// Only include the last 10 exchanges to manage context length
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

	messages.push({ role: "user", content: userMessage })
	return messages
}

function generateHintMessage(challengeData: ChallengeData, conversationHistory: ChatMessage[]): string {
	// Count how many hint requests have been made in this conversation
	const hintCount = conversationHistory.filter(msg =>
		msg.role === "user" && msg.content.toLowerCase().includes("hint")
	).length

	let baseMessage = "I need a helpful hint to guide me in the right direction. "

	// Use progressive hints if available
	if (challengeData.hints) {
		if (hintCount === 0) {
			baseMessage += `Here's a gentle nudge: ${challengeData.hints.level1}`
		} else if (hintCount === 1) {
			baseMessage += `Here's a more specific hint: ${challengeData.hints.level2}`
		} else if (hintCount >= 2) {
			baseMessage += `Here's a detailed hint: ${challengeData.hints.level3}`
		}
	} else {
		// Fallback if no structured hints
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
