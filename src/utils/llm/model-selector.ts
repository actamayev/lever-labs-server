import { InteractionType } from "@bluedotrobots/common-ts"

export default function selectModel(interactionType: InteractionType): string {
	switch (interactionType) {
	case "checkCode":
		return "deepseek/deepseek-chat-v3-0324:free"
	case "hint":
		return "deepseek/deepseek-chat-v3-0324:free"
	case "generalQuestion":
		return "deepseek/deepseek-chat-v3-0324:free"
	default:
		return "deepseek/deepseek-chat-v3-0324:free"
	}
}
