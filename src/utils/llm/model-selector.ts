import { InteractionType } from "@lever-labs/common-ts/types/chat"

type ExtendedInteractionType = InteractionType | "checkCode"

export default function selectModel(interactionType: ExtendedInteractionType): string {
	switch (interactionType) {
	case "checkCode":
		return "openai/gpt-5-codex"
	case "hint":
		return "openai/gpt-5-codex"
	case "generalQuestion":
		return "openai/gpt-5-codex"
	default:
		return "openai/gpt-5-codex"
	}
}
