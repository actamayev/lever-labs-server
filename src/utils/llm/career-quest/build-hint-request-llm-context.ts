import findChallengeDataFromId from "../find-challenge-data-from-id"

// eslint-disable-next-line max-lines-per-function
export default function buildHintLLMContext(
	chatData: ProcessedCareerQuestHintMessage,
	hintNumber: number
): SimpleMessageData[] {
	const challengeData = findChallengeDataFromId(chatData.challengeId)
	const messages: SimpleMessageData[] = []

	// System prompt for hint generation
	const systemPrompt = `You are a robotics tutor providing concise, direct hints for coding challenges.

CHALLENGE: ${challengeData.title}
DESCRIPTION: ${challengeData.description}
EXPECTED BEHAVIOR: ${challengeData.expectedBehavior}

HINT STRATEGY:
${hintNumber === 1 ? "• Start conceptual - what should the robot sense or do first?" : ""}
${hintNumber === 2 ? "• Guide toward structure - what loop or logic pattern is needed?" : ""}
${hintNumber >= 3 ? "• Be more specific - which blocks or code patterns to use?" : ""}
${hintNumber >= 4 ? "• Give direct guidance - specific implementation details" : ""}

COMMON MISTAKES TO AVOID:
${challengeData.commonMistakes.map(mistake => `• ${mistake}`).join("\n")}

CURRENT USER CODE:
\`\`\`cpp
${chatData.userCode || "// No code written yet"}
\`\`\`

RESPONSE REQUIREMENTS:
• Start with "Hint #${hintNumber}" as a header
• Skip introductory praise or encouragement
• Skip concluding encouragement paragraphs
• Focus on the core issue or next step
• Be direct and concise
• Guide discovery, don't give complete solutions

Provide only the essential guidance needed to help them progress.`

	messages.push({
		role: "system",
		content: systemPrompt
	})

	// Add conversation history for context
	chatData.conversationHistory.forEach((message: SimpleMessageData) => {
		messages.push({
			role: message.role === "user" ? "user" : "assistant",
			content: message.content
		})
	})

	// Add hint request
	const hintRequest = "I need a hint for this challenge. What should I focus on next?"

	messages.push({
		role: "user",
		content: hintRequest
	})

	return messages
}
