import { isNull } from "lodash"
import { TeacherData } from "@bluedotrobots/common-ts"

export default function extractTeacherDataFromUserData(user: ExtendedCredentials): TeacherData | null {
	return isNull(user.teacher) ? null : {
		teacherFirstName: user.teacher.teacher_first_name,
		teacherLastName: user.teacher.teacher_last_name,
		isApproved: user.teacher.is_approved,
		schoolName: user.teacher.school.school_name
	}
}
