import { InteractionType } from "@bluedotrobots/common-ts"

export default function selectModel(interactionType: InteractionType): string {
	switch (interactionType) {
	case "checkCode":
		return "google/gemini-2.5-flash"
	case "hint":
		return "google/gemini-2.5-flash"
	case "generalQuestion":
		return "google/gemini-2.5-flash"
	default:
		return "google/gemini-2.5-flash"
	}
}
