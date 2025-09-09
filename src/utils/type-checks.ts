import { PipUUID } from "@bluedotrobots/common-ts/types/utils"
import pipUUIdValidator from "../middleware/joi/pip-uuid-validator"

export default function isPipUUID(value: unknown): value is PipUUID {
	const { error } = pipUUIdValidator.validate(value)
	return !error
}
