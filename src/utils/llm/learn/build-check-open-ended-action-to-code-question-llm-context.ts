/* eslint-disable max-len */
import { ResponseFormatJSONSchema } from "openai/resources/shared"

export default function buildCheckOpenEndedActionToCodeQuestionLLMContext(
	questionText: string,
	referenceSolutionCpp: string,
	userCode: string
): SimpleMessageData[] {
	const messages: SimpleMessageData[] = []

	const systemPrompt = "You are a precise robotics code evaluator. " +
		`Analyze if the user's C++ code correctly recreates the robot action compared to the reference.

EVALUATION CRITERIA:
✅ Does it achieve the same robot behavior as the reference solution?
✅ Are the core logic and structure correct with respect to the reference?

Focus only on whether it is correct or not.`

	messages.push({
		role: "system",
		content: systemPrompt
	})

	const userPrompt = `TASK: ${questionText}

The user watched the robot perform an action, then wrote code to recreate that same action.

EXPECTED ROBOT BEHAVIOR (Reference):
\`\`\`cpp
${referenceSolutionCpp}
\`\`\`

USER'S CODE:
\`\`\`cpp
${userCode}
\`\`\`

Evaluate if the user's code would produce the same robot behavior as the reference. Output whether it is correct and a confidence score between 0.0 and 1.0.
The JSON must match the schema exactly.`

	messages.push({
		role: "user",
		content: userPrompt
	})

	return messages
}

const openEndedActionToCodeCheckResponseFormat: ResponseFormatJSONSchema = {
	type: "json_schema",
	json_schema: {
		name: "open_ended_action_to_code_question_evaluation",
		strict: true,
		schema: {
			type: "object",
			properties: {
				isCorrect: {
					type: "boolean",
					description: "Whether the user's code correctly recreates the robot action"
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

export { openEndedActionToCodeCheckResponseFormat }
