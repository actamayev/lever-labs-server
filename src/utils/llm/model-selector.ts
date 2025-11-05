import { InteractionType } from "@lever-labs/common-ts/types/chat"

type ExtendedInteractionType = InteractionType | "checkCode"

export default function selectModel(interactionType: ExtendedInteractionType): string {
	switch (interactionType) {
	case "checkCode":
		return "x-ai/grok-code-fast-1"
	case "hint":
		return "x-ai/grok-code-fast-1"
	case "generalQuestion":
		return "x-ai/grok-code-fast-1"
	default:
		return "x-ai/grok-code-fast-1"
	}
}
