import { CareerQuestChatMessage } from "@bluedotrobots/common-ts"
import findChallengeDataFromId from "../find-challenge-data-from-id"

// eslint-disable-next-line max-lines-per-function
export default function buildHintLLMContext(
	chatData: ProcessedCareerQuestHintMessage,
	hintNumber: number
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
	const challengeData = findChallengeDataFromId(chatData.careerQuestChallengeId)
	const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = []

	// System prompt for hint generation
	const systemPrompt = `You are an encouraging robotics tutor providing progressive hints for coding challenges.

CHALLENGE: ${challengeData.title}
DESCRIPTION: ${challengeData.description}
EXPECTED BEHAVIOR: ${challengeData.expectedBehavior}

HINT #${hintNumber} STRATEGY:
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

GUIDELINES:
✅ Guide discovery, don't give complete solutions
✅ Be encouraging and age-appropriate (10-20 years old)
✅ Focus on robotics learning concepts
✅ Build on previous hints if this isn't the first

Keep hint concise, helpful, and progressive. Help them take the next step in their learning journey.`

	messages.push({
		role: "system",
		content: systemPrompt
	})

	// Add conversation history for context
	chatData.conversationHistory.forEach((message: CareerQuestChatMessage) => {
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
