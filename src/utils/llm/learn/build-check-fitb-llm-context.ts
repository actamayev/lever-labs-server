/* eslint-disable max-len */
import { ResponseFormatJSONSchema } from "openai/resources/shared"

// eslint-disable-next-line max-lines-per-function
export default function buildCheckFITBLLMContext(
	questionText: string,
	referenceSolutionCpp: string,
	userCode: string
): SimpleMessageData[] {
	const messages: SimpleMessageData[] = []

	const systemPrompt = `You are an expert robotics code evaluator for educational exercises.

	Your task: Determine if the user's C++ code produces the SAME BEHAVIOR as the reference solution for the given problem.
	
	EVALUATION APPROACH:
	1. Read the problem requirements from the QUESTION
	2. Understand what behavior the reference solution produces
	3. Analyze if the user's code produces identical behavior across ALL inputs
	4. Consider edge cases (boundary values, special conditions)
	
	ACCEPT solutions that:
	✅ Produce identical outputs for all possible inputs
	✅ Use different but equivalent logic (e.g., different loop structures, variable names)
	✅ Handle edge cases the same way as the reference
	✅ Call sensors multiple times instead of caching the value (unless the problem specifically requires caching or mentions "read only once")
	
	REJECT solutions that:
	❌ Produce different outputs for ANY input (including edge cases)
	❌ Have logical errors or bugs
	❌ Don't handle boundary conditions the same way
	
	IMPORTANT: Assume sensor readings are stable within a single loop iteration. Multiple calls to the same sensor in one iteration can be treated as returning the same value unless the problem explicitly states otherwise.
	
	Focus on FUNCTIONAL EQUIVALENCE for the educational goal, not micro-optimizations.`

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
	
	Evaluate if the user's code produces the same behavior as the reference solution for all possible inputs. Focus on functional equivalence.`

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


