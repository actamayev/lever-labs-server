import { ResponseFormatJSONSchema } from "openai/resources/shared"

export default function buildCheckFITBLLMContext(
	questionText: string,
	referenceSolutionCpp: string,
	userCode: string
): SimpleMessageData[] {
	const messages: SimpleMessageData[] = []

	const systemPrompt = "You are a precise robotics code evaluator. " +
		`Analyze if the user's C++ code correctly solves the problem compared to the reference.

EVALUATION CRITERIA:
✅ Does it achieve the expected behavior implied by the prompt?
✅ Are the core logic and structure correct with respect to the reference?

Focus only on whether it is correct or not.`

	messages.push({
		role: "system",
		content: systemPrompt
	})

	const userPrompt = `QUESTION: ${questionText}

REFERENCE SOLUTION:
\`\`\`cpp
${referenceSolutionCpp}
\`\`\`

USER'S CODE:
\`\`\`cpp
${userCode}
\`\`\`

Evaluate if the user's code correctly solves this exercise. Output whether it is correct and a confidence score between 0.0 and 1.0.
The JSON must match the schema exactly.`

	messages.push({
		role: "user",
		content: userPrompt
	})

	return messages
}

const fitbCheckResponseFormat: ResponseFormatJSONSchema = {
	type: "json_schema",
	json_schema: {
		name: "code_evaluation",
		strict: true,
		schema: {
			type: "object",
			properties: {
				isCorrect: {
					type: "boolean",
					description: "Whether the user's code correctly solves the exercise"
				},
				score: {
					type: "number",
					description: "Confidence score between 0.0 and 1.0",
					minimum: 0,
					maximum: 1
				}
			},
			required: ["isCorrect", "score"],
			additionalProperties: false
		}
	}
}

export { fitbCheckResponseFormat }


