/* eslint-disable max-len */
/* eslint-disable max-lines-per-function */

import { isEmpty, groupBy } from "lodash"
import { BLOCK_REGISTRY, ChallengeData, ChatMessage } from "@bluedotrobots/common-ts"

export default function buildCqLLMContext(
	challengeData: ChallengeData,
	userCode: string,
	interactionType: "checkCode" | "hint" | "generalQuestion",
	conversationHistory: ChatMessage[],
	message?: string,
): ChatMessage[] {

	// Group blocks by category for better organization
	const blocksByCategory = groupBy(challengeData.availableBlocks, block =>
		BLOCK_REGISTRY[block.type].category || "other"
	)

	const availableBlocksText = Object.entries(blocksByCategory)
		.map(([category, blocks]) => {
			const categoryName = category.charAt(0).toUpperCase() + category.slice(1)
			const blockList = blocks.map(block =>
				`  - ${block.type}: ${block.description}\n    Code: ${block.codeTemplate}`
			).join("\n")
			return `${categoryName} Blocks:\n${blockList}`
		}).join("\n\n")

	// Add code analysis context for checkCode interactions
	const codeAnalysisGuidance = interactionType === "checkCode" ? `

CODE REVIEW GUIDELINES:
- Check if code structure follows robotics patterns (setup, main loop, conditions)
- Verify proper use of sensors before actuators (sense → think → act)
- Look for missing forever loops for continuous behavior
- Check if conditions use appropriate comparison operators
- Ensure LED feedback matches expected behavior
- Verify motor commands are logical for the task
- Check for proper variable usage if applicable
- Look for missing delay() calls that might cause rapid cycling

FEEDBACK STYLE:
- Start with what they did well (positive reinforcement)
- Point out specific issues with line references when possible
- Suggest one main improvement at a time to avoid overwhelming
- Use encouraging language ("Let's improve..." instead of "This is wrong")
- Ask guiding questions to help them discover solutions
- Provide specific code examples when helpful` : ""

	const systemPrompt = `You are a friendly robotics tutor helping students aged 10-20 with programming challenges.

CURRENT CHALLENGE: ${challengeData.title}
CHALLENGE ID: ${challengeData.id}
DIFFICULTY: ${challengeData.difficulty}

TASK DESCRIPTION: ${challengeData.description}

AVAILABLE BLOCKS:
${availableBlocksText}

EXPECTED BEHAVIOR: ${challengeData.expectedBehavior}

LEARNING OBJECTIVES:
${challengeData.learningObjectives.map(obj => `- ${obj}`).join("\n")}

COMMON MISTAKES TO WATCH FOR:
${challengeData.commonMistakes.map(mistake => `- ${mistake}`).join("\n")}

ROBOTICS PROGRAMMING PATTERNS:
- Sense → Think → Act: Always read sensors before making decisions
- Use forever loops (while(true)) for continuous robot behavior
- Provide LED feedback to show what the robot is "thinking"
- Structure: setup → wait for button → main behavior loop
- Test one feature at a time (e.g., just sensors, then just motors, then combined)

TEACHING CONSTRAINTS:
- Only suggest solutions using the available blocks listed above
- If asked about unavailable components, acknowledge and redirect to available options
- No hardware modifications or safety concerns
- Adjust explanation complexity based on difficulty level:
  * Beginner: Simple concepts, lots of encouragement, step-by-step guidance
  * Intermediate: Introduce debugging strategies, pattern recognition
  * Advanced: Discuss efficiency, edge cases, and optimization
- Use Socratic method: ask guiding questions instead of giving direct answers
- Encourage experimentation and learning from mistakes
- Be enthusiastic about robotics and programming!

INTERACTION TYPE: ${interactionType}${codeAnalysisGuidance}

USER'S CURRENT CODE:
\`\`\`cpp
${userCode || "// No code provided yet"}
\`\`\``

	const messages: ChatMessage[] = [
		{ role: "system", content: systemPrompt, timestamp: new Date() }
	]

	// Smarter conversation history management
	if (!isEmpty(conversationHistory)) {
		const recentHistory = getRelevantHistory(conversationHistory, interactionType)
		messages.push(...recentHistory)
	}

	// Enhanced user message generation
	const userMessage = generateUserMessage(interactionType, challengeData, conversationHistory, message)
	messages.push({ role: "user", content: userMessage, timestamp: new Date() })

	return messages
}

function getRelevantHistory(
	conversationHistory: ChatMessage[],
	interactionType: "checkCode" | "hint" | "generalQuestion"
): ChatMessage[] {
	// For code checks, prioritize recent AI feedback and user questions
	if (interactionType === "checkCode") {
		return conversationHistory
			.slice(-8) // Slightly fewer for code checks to leave room for detailed analysis
			.filter(msg =>
				msg.role === "assistant" ||
				(msg.role === "user" && (
					msg.content.includes("code") ||
					msg.content.includes("error") ||
					msg.content.includes("help")
				))
			)
	}

	// For hints, include previous hint exchanges to avoid repetition
	if (interactionType === "hint") {
		return conversationHistory.slice(-10)
	}

	// For general questions, include recent context
	return conversationHistory.slice(-6)
}

function generateUserMessage(
	interactionType: "checkCode" | "hint" | "generalQuestion",
	challengeData: ChallengeData,
	conversationHistory: ChatMessage[],
	message?: string
): string {
	switch (interactionType) {
	case "checkCode": {
		const codeIssues = analyzeCodeContext(conversationHistory)
		let checkMessage = "Please analyze my current code and provide specific, constructive feedback. "

		if (codeIssues.hasBeenStuck) {
			checkMessage += "I've been working on this for a while - help me identify what I might be missing. "
		}

		checkMessage += "Focus on:\n" +
			"- Whether my code structure matches the expected behavior\n" +
			"- If I'm using the right blocks for this challenge\n" +
			"- Any logical errors or missing components\n" +
			"- One specific improvement I should make next"

		return checkMessage
	}

	case "hint":
		return generateEnhancedHintMessage(challengeData, conversationHistory)

	case "generalQuestion":
		if (!message) {
			return "I have a question about this robotics challenge. Can you help me understand something?"
		}

		// Add context to make the question more specific
		return `I have a question about this challenge: ${message}\n\nPlease help me understand this in the context of the current robotics challenge.`
	}
}

function analyzeCodeContext(conversationHistory: ChatMessage[]): { hasBeenStuck: boolean } {
	const recentMessages = conversationHistory.slice(-6)
	const userMessages = recentMessages.filter(msg => msg.role === "user")

	// Check if user has asked for help multiple times
	const hasBeenStuck = userMessages.length >= 3 ||
		userMessages.some(msg =>
			msg.content.toLowerCase().includes("still") ||
			msg.content.toLowerCase().includes("again") ||
			msg.content.toLowerCase().includes("stuck")
		)

	return { hasBeenStuck }
}

function generateEnhancedHintMessage(challengeData: ChallengeData, conversationHistory: ChatMessage[]): string {
	// Count hint requests more accurately
	const hintCount = conversationHistory.filter(msg =>
		msg.role === "user" && (
			msg.content.toLowerCase().includes("hint") ||
			msg.content.toLowerCase().includes("help") ||
			msg.content.toLowerCase().includes("stuck")
		)
	).length

	let baseMessage = "I need a helpful hint to guide me in the right direction. "

	// Enhanced progressive hints
	if (challengeData.hints) {
		if (hintCount === 0) {
			baseMessage = `Here's my first hint request: ${challengeData.hints.level1}\n\nPlease expand on this hint and help me understand what I should try next.`
		} else if (hintCount === 1) {
			baseMessage = `I tried the first hint but still need help. Here's the next level hint: ${challengeData.hints.level2}\n\nCan you help me understand how to apply this?`
		} else if (hintCount >= 2) {
			baseMessage = `I'm still struggling. Here's a more detailed hint: ${challengeData.hints.level3}\n\nPlease help me break this down into specific steps I can follow.`
		}
	} else {
		// Enhanced fallback hints based on difficulty
		let difficultyContext: string
		switch (challengeData.difficulty) {
		case "beginner":
			difficultyContext = "Remember, I'm just starting with robotics programming."
			break
		case "advanced":
			difficultyContext = "I understand the basics but need help with the more complex logic."
			break
		default:
			difficultyContext = "I have some robotics experience but need guidance on this specific challenge."
		}
		if (hintCount === 0) {
			baseMessage += `${difficultyContext} Please give me a gentle nudge in the right direction without giving away the full solution.`
		} else if (hintCount === 1) {
			baseMessage += "I tried your suggestion but I'm still stuck. Can you give me a more specific hint about what to focus on?"
		} else {
			baseMessage += "I'm really struggling with this challenge. Can you give me a more detailed hint with maybe a small example, but still let me figure out the final implementation?"
		}
	}

	return baseMessage
}
