import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose"
import { HubUUID, ClassCode, CareerUUID } from "@lever-labs/common-ts/types/utils"

// Embedded subdocument for students
export class StudentJoined {
	@prop({ required: true })
	public userId!: number

	@prop({ required: true })
	public username!: string
}

// Main Hub model
@modelOptions({
	schemaOptions: {
		collection: "hubs",
		timestamps: true, // Adds createdAt, updatedAt automatically
	}
})
export class Hub {
	@prop({ required: true, unique: true })
	public hubId!: HubUUID

	@prop({ required: true, index: true })
	public classCode!: ClassCode

	@prop({ required: true })
	public careerUUID!: CareerUUID

	@prop({ required: true })
	public slideId!: string

	@prop({ required: true })
	public hubName!: string

	@prop({ required: true, index: true })
	public teacherId!: number

	@prop({ type: () => [StudentJoined], default: [] })
	public studentsJoined!: StudentJoined[]
}

// Export the model - this is what you'll use to query
// eslint-disable-next-line @typescript-eslint/naming-convention
export const HubModel = getModelForClass(Hub)
