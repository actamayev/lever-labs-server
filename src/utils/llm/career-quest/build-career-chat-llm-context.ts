import { isEmpty } from "lodash"

export default function buildCareerChatLLMContext(chatData: ProcessedCareerChatData): SimpleMessageData[] {
	const systemPrompt = `You are a patient, encouraging robotics tutor for students aged 10-20.

CAREER: ${chatData.careerName || "Robotics Career"}
DESCRIPTION: ${chatData.careerDescription || "Learning robotics programming and concepts"}

CAREER QUEST STRUCTURE:
• Students progress through reading sections and programming challenges
• Each challenge helps them program Pip (the physical robot) to accomplish specific goals
• Challenges build upon previous learning and increase in complexity
• Your role is to help with career-level questions about robotics concepts and learning

RESPONSE GUIDELINES:
✅ Help with robotics concepts and career-related questions
✅ Explain technical concepts clearly and simply
✅ Encourage exploration and learning
✅ Stay focused on robotics education

❌ Don't discuss non-robotics topics
❌ Keep responses concise and encouraging`

	const messages: SimpleMessageData[] = [
		{ role: "system", content: systemPrompt }
	]

	if (!isEmpty(chatData.conversationHistory)) {
		const recentHistory = chatData.conversationHistory.slice(-30)
		messages.push(...recentHistory)
	}

	const userMessageWithContext = `CURRENT CONTEXT: ${chatData.whatUserSees || "User is reading about robotics"}

USER QUESTION: ${chatData.message}`

	messages.push({ role: "user", content: userMessageWithContext })
	return messages
}
