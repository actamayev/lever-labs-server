import { InteractionType } from "@bluedotrobots/common-ts"

export default function selectModel(interactionType: InteractionType): string {
	switch (interactionType) {
	case "checkCode":
		return "google/gemini-2.5-flash-lite-preview-06-17"
	case "hint":
		return "google/gemini-2.5-flash-lite-preview-06-17"
	case "generalQuestion":
		return "google/gemini-2.5-flash-lite-preview-06-17"
	default:
		return "google/gemini-2.5-flash-lite-preview-06-17"
	}
}
