/* eslint-disable max-len */
import { ResponseFormatJSONSchema } from "openai/resources/shared"

// eslint-disable-next-line max-lines-per-function
export default function buildCheckOpenEndedActionToCodeQuestionLLMContext(
	questionText: string,
	referenceSolutionCpp: string,
	userCode: string
): SimpleMessageData[] {
	const messages: SimpleMessageData[] = []

	const systemPrompt = `You are an expert robotics code evaluator for educational exercises.

	Your task: Determine if the user's C++ code would produce the SAME OBSERVABLE BEHAVIOR as the reference solution, and assign PARTIAL CREDIT for partially correct solutions.

	CONTEXT: The user watched a robot perform an action (they did NOT see the code), then wrote their own code to recreate what they saw.

	EVALUATION APPROACH:
	1. Understand what observable behavior the reference solution produces (movements, LED colors, timing, sequences)
	2. Analyze if the user's code would produce identical observable behavior
	3. Consider if a person watching both robots would see the same thing
	4. Award PARTIAL CREDIT based on how much of the behavior is correct:
	   - If the behavior is completely correct → score = 1.0
	   - If the behavior is mostly correct with minor differences → score = 0.7-0.9
	   - If some behaviors are correct but significant parts are wrong → score = 0.4-0.6
	   - If the solution is on the right track but mostly wrong → score = 0.1-0.3
	   - If the behavior is completely wrong or unrelated → score = 0.0

	ACCEPT solutions that:
	✅ Produce the same observable behavior (same movements, colors, timing, sequences)
	✅ Use completely different implementation approaches (loops vs delays, different variable names, different logic structure)
	✅ Call sensors multiple times instead of caching (unless the problem specifically requires caching)
	✅ Use equivalent timing methods (delay() vs sleep() vs loop-based timing)
	✅ Achieve the same end result through different means

	REJECT solutions that:
	❌ Produce observably different behavior (wrong colors, wrong movement direction/speed, wrong timing, wrong sequence)
	❌ Have logical errors that would prevent the intended behavior
	❌ Missing key actions or steps from the sequence

	IMPORTANT: 
	- Assume sensor readings are stable within a single loop iteration. Focus on whether the ROBOT'S BEHAVIOR would look the same to an observer, not whether the code structure matches.
	- The score should reflect PARTIAL CREDIT - do not use binary 0 or 1 unless the solution is completely wrong or completely correct. Award intermediate scores for partially correct solutions.

	Prioritize BEHAVIORAL EQUIVALENCE over code similarity.`

	messages.push({
		role: "system",
		content: systemPrompt
	})

	const userPrompt = `TASK: ${questionText}

The user watched the robot perform this action, then wrote code to recreate it.

REFERENCE CODE (what actually ran on the robot):
\`\`\`cpp
${referenceSolutionCpp}
\`\`\`

USER'S CODE (their attempt to recreate the behavior):
\`\`\`cpp
${userCode}
\`\`\`

Evaluate if the user's code would make the robot behave the same way as the reference. Focus on observable behavior - would both robots look like they're doing the same thing? Assign a partial credit score (0.0 to 1.0) based on how correct the behavior is, not just binary 0 or 1.`

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
					description: "Partial credit score between 0.0 and 1.0, representing how correct the solution is (0.0 = completely wrong, 1.0 = completely correct). Award intermediate scores for partially correct solutions (e.g., 0.3 for somewhat on track, 0.7 for mostly correct with minor issues). Do not use binary 0 or 1 unless the solution is completely wrong or completely correct.",
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
