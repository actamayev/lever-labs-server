import { CqChallengeData } from "@bluedotrobots/common-ts"
import { ResponseFormatJSONSchema } from "openai/resources/shared"

export default function buildCheckCodeLLMContext(
	challengeData: CqChallengeData,
	userCode: string
): SimpleMessageData[] {
	const messages: SimpleMessageData[] = []

	// System prompt for code evaluation
	const systemPrompt = "You are a precise robotics code evaluator. " +
		`Analyze if the user's code correctly implements the challenge requirements.

EVALUATION CRITERIA:
✅ Does it achieve the expected behavior?
✅ Are the core logic and structure correct?
✅ Does it follow safe robotics practices?

❌ Identify logical errors or missing functionality
❌ Note if it doesn't match the solution approach

Be thorough but fair - focus on functional correctness for this challenge.`

	messages.push({
		role: "system",
		content: systemPrompt
	})

	// User prompt with challenge details and code
	const userPrompt = `CHALLENGE: ${challengeData.title}
DESCRIPTION: ${challengeData.description}
EXPECTED BEHAVIOR: ${challengeData.expectedBehavior}

REFERENCE SOLUTION:
\`\`\`cpp
${challengeData.solutionCode}
\`\`\`

USER'S CODE:
\`\`\`cpp
${userCode}
\`\`\`

Evaluate if the user's code correctly solves this challenge. ` +
		"Also provide a score (0.0-1.0) indicating how close they are to the correct solution, " +
		"where 1.0 means completely correct."

	messages.push({
		role: "user",
		content: userPrompt
	})

	return messages
}

const checkCodeResponseFormat: ResponseFormatJSONSchema = {
	type: "json_schema",
	json_schema: {
		name: "code_evaluation",
		strict: true,
		schema: {
			type: "object",
			properties: {
				isCorrect: {
					type: "boolean",
					description: "Whether the user's code correctly solves the challenge"
				},
				score: {
					type: "number",
					description: "How close to correct (0.0 - 1.0, where 1.0 is correct)"
				}
			},
			required: ["isCorrect", "score"],
			additionalProperties: false
		}
	}
}

export { checkCodeResponseFormat }
