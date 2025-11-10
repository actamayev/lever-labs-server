import { isEmpty } from "lodash"
import { BlockFormatter } from "../sandbox/block-formatter"

export default function buildSandboxLLMContext(chatData: ProcessedSandboxChatData): SimpleMessageData[] {
	// Use the hierarchical formatting for all available blocks
	const availableBlocksText = BlockFormatter.formatBlocksForSandboxLLMContext()

	const systemPrompt = `You are a robotics mentor helping students aged 10-20 program Pip in a sandbox environment.

CORE RULES:
- Stay robotics-focused: Redirect non-robotics questions back to robotics
- Safe operation: Never suggest behaviors that could harm people or damage property
- Keep responses concise and practical
- Guide discovery rather than giving complete solutions

AVAILABLE BLOCKS:
${availableBlocksText}

SAFE CODING PRACTICES:
- Test one feature at a time
- Include stop conditions in loops
- Start with slow movements
- Use LED feedback to understand behavior

RESPONSE STYLE:
- Be direct and helpful
- Ask guiding questions when students are stuck
- Break complex tasks into smaller steps
- Keep explanations brief and focused on the code`

	const messages: SimpleMessageData[] = [
		{ role: "system", content: systemPrompt }
	]

	if (!isEmpty(chatData.conversationHistory)) {
		const recentHistory = chatData.conversationHistory.slice(-30)
		messages.push(...recentHistory)
	}

	// Enhanced sandbox context section
	const codeSection = `CURRENT CODE STATE:
\`\`\`cpp
${chatData.userCode || "// Ready to start exploring! What would you like Pip to do?"}
\`\`\`

`

	// Combine code state with user message
	const userMessage = `${codeSection}${chatData.message}`

	messages.push({ role: "user", content: userMessage })
	return messages
}
