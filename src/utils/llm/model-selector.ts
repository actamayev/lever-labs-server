import { InteractionType } from "@bluedotrobots/common-ts"

export default function selectModel(interactionType: InteractionType): string {
	switch (interactionType) {
	case "checkCode":
		return "gemini-2.5-flash-lite-preview-06-17"
	case "hint":
		return "gemini-2.5-flash-lite-preview-06-17"
	case "generalQuestion":
		return "gemini-2.5-flash-lite-preview-06-17"
	default:
		return "gemini-2.5-flash-lite-preview-06-17"
	}
}
