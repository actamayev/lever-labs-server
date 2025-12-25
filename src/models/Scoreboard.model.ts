import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose"
import { ScoreboardUUID, ClassCode } from "@actamayev/lever-labs-common-ts/types/utils"

// Embedded subdocument for student in scoreboard
class StudentJoinedScoreboard {
	@prop({ required: true })
	public studentId!: number

	@prop({ required: true })
	public username!: string
}

// Embedded subdocument for team stats
export class TeamStats {
	@prop({ required: true })
	public teamName!: string

	@prop({ required: true, default: 0 })
	public score!: number

	@prop({ type: () => [StudentJoinedScoreboard], default: [] })
	public students!: StudentJoinedScoreboard[]
}

// Main Scoreboard model
@modelOptions({
	schemaOptions: {
		collection: "scoreboards",
		timestamps: true,
	}
})
class Scoreboard {
	@prop({ required: true, unique: true })
	public scoreboardId!: ScoreboardUUID

	@prop({ required: true, index: true })
	public classCode!: ClassCode

	@prop({ required: true })
	public scoreboardName!: string

	@prop({ type: () => TeamStats, required: true })
	public team1Stats!: TeamStats

	@prop({ type: () => TeamStats, required: true })
	public team2Stats!: TeamStats

	@prop({ required: true, default: 0 })
	public timeRemaining!: number
}

// Export the model
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ScoreboardModel = getModelForClass(Scoreboard)
