import { isNull } from "lodash"
import { DetailedClassroomData } from "@actamayev/lever-labs-common-ts/types/api"
import { ClassCode } from "@actamayev/lever-labs-common-ts/types/utils"
import HubManager from "../../../classes/hub-manager"
import PrismaClientClass from "../../../classes/prisma-client"
import ScoreboardManager from "../../../classes/scoreboard-manager"

// eslint-disable-next-line max-lines-per-function
export default async function getDetailedTeacherClassroomData(
	teacherId: number,
	userId: number,
	classroomId: number
): Promise<DetailedClassroomData | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const classroom = await prismaClient.classroom_teacher_map.findUnique({
			where: {
				classroom_id_teacher_id: {
					teacher_id: teacherId,
					classroom_id: classroomId
				}
			},
			select: {
				classroom: {
					select: {
						classroom_name: true,
						class_code: true,
						student: {
							select: {
								student_id: true,
								user: {
									select: {
										username: true
									}
								},
								garage_driving_allowed: true,
								garage_sounds_allowed: true,
								garage_lights_allowed: true,
								garage_display_allowed: true
							}
						}
					},
				}
			}
		})

		if (isNull(classroom)) return null

		const hubManager = await HubManager.getInstance()
		const scoreboardManager = await ScoreboardManager.getInstance()
		return {
			classroomName: classroom.classroom.classroom_name,
			classCode: classroom.classroom.class_code as ClassCode,
			students: classroom.classroom.student.map(student => ({
				studentId: student.student_id,
				username: student.user.username || "",
				garageDrivingAllowed: student.garage_driving_allowed,
				garageTonesAllowed: student.garage_sounds_allowed,
				garageLightsAllowed: student.garage_lights_allowed,
				garageDisplayAllowed: student.garage_display_allowed
			})),
			activeHubs: await hubManager.getTeacherHubs(userId),
			scoreboards: await scoreboardManager.getScoreboards(classroom.classroom.class_code as ClassCode)
		} satisfies DetailedClassroomData
	} catch (error) {
		console.error(error)
		throw error
	}
}
