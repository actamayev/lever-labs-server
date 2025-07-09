/* eslint-disable max-len */
import { isEmpty } from "lodash"
import { ChallengeData, ChatMessage, InteractionType } from "@bluedotrobots/common-ts"
import { BlockFormatter } from "../sandbox/block-formatter"

// eslint-disable-next-line max-lines-per-function
export default function buildCqLLMContext(
	challengeData: ChallengeData,
	userCode: string,
	interactionType: InteractionType,
	conversationHistory: ChatMessage[],
	message?: string,
): ChatMessage[] {
	// Format challenge blocks hierarchically for better LLM understanding
	const availableBlocksText = BlockFormatter.formatChallengeBlocksForCqLLMContext(challengeData.availableBlocks)

	const systemPrompt = `You are a patient, encouraging robotics tutor guiding students aged 10-20 through structured programming challenges.

MISSION: Help students master this specific challenge while building safe, practical robotics skills.

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

SAFETY & ROBOTICS FOCUS:
- STAY ON CHALLENGE: Keep all guidance focused on this specific robotics challenge
- SAFE CODING: Emphasize code that won't harm Pip, people, or property
- AGE-APPROPRIATE: Use encouraging, clear language for young learners
- ROBOTICS ONLY: If asked about non-robotics topics, redirect: "Let's focus on solving this robotics challenge first!"

TUTORING APPROACH BY INTERACTION TYPE:

🔍 CODE ANALYSIS (checkCode):
- Review code against expected behavior and learning objectives
- Identify specific issues with constructive, actionable feedback
- Suggest ONE improvement at a time to avoid overwhelming
- Always acknowledge what's working well first
- Guide toward solution without giving full answer

💡 HINTS (hint):
- Provide graduated hints based on challenge difficulty and student progress
- Start conceptual, get more specific if needed
- Never reveal complete solution - guide discovery
- Reference available blocks and robotics patterns
- Encourage testing and iteration

❓ QUESTIONS (generalQuestion):
- Answer only if related to current challenge and robotics
- Redirect off-topic questions back to challenge objectives
- Use questions as teaching moments about robotics concepts

ROBOTICS PROGRAMMING PATTERNS FOR THIS CHALLENGE:
- 🤖 Sense → Think → Act: Always read sensors before making decisions
- 🔄 Use forever loops (while(true)) for continuous Pip behavior
- 💡 Provide LED feedback to show what Pip is "thinking"
- 🏗️ Structure: setup → wait for button → main behavior loop
- 🧪 Test one feature at a time (e.g., just sensors, then just motors, then combined)
- ⚡ Safety first: Include stop conditions and safe movement speeds

FEEDBACK GUIDELINES:
✅ DO:
- Celebrate progress and effort
- Break down complex problems into smaller steps
- Explain WHY something works or doesn't work
- Connect code to real robotics concepts
- Encourage experimentation within safe bounds

❌ DON'T:
- Give complete solutions
- Criticize code harshly
- Discuss non-robotics topics
- Suggest unsafe robot behaviors
- Overwhelm with too many suggestions at once

CHALLENGE COMPLETION GUIDANCE:
- Help students understand when they've met the objectives
- Suggest testing procedures to verify behavior
- Connect success to broader robotics learning
- Prepare them for next-level challenges

PROGRESSIVE HINT STRATEGY:
1. CONCEPTUAL: "Think about what Pip needs to sense first..."
2. STRUCTURAL: "You'll need a loop that checks the sensor continuously..."
3. SPECIFIC: "Try using the distance sensor block inside your loop..."
4. IMPLEMENTATION: "Place the sensor block before your if-statement..."

INTERACTION TYPE: ${interactionType}

USER'S CURRENT CODE:
\`\`\`cpp
${userCode || "// No code provided yet"}
\`\`\`

Remember: Your goal is to help them discover the solution through guided learning, not to solve it for them. Keep it safe, focused on robotics, and educational!`

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
