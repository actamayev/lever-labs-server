import express from "express"

import attachStudentId from "../middleware/attach/attach-student-id"
import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import validateClassCode from "../middleware/request-validation/teacher/validate-class-code"
import confirmUserInvitedToClass from "../middleware/confirm/confirm-student-invited-to-class"
import confirmUserIsNotInClassroom from "../middleware/confirm/confirm-user-is-not-in-classroom"
import validateInviteResponse from "../middleware/request-validation/student/validate-invite-response"

import joinClass from "../controllers/student/join-class"
import getStudentClasses from "../controllers/student/get-student-classes"
import respondToClassroomInvite from "../controllers/student/respond-to-classroom-invite"

const studentRoutes = express.Router()

studentRoutes.post(
	"/join-class/:classCode",
	validateClassCode,
	jwtVerifyAttachUserId,
	confirmUserIsNotInClassroom,
	joinClass
)

studentRoutes.post(
	"/respond-to-classroom-invitation/:classCode",
	validateClassCode,
	validateInviteResponse,
	jwtVerifyAttachUserId,
	confirmUserInvitedToClass,
	attachStudentId,
	respondToClassroomInvite
)

studentRoutes.get(
	"/classrooms",
	jwtVerifyAttachUserId,
	getStudentClasses
)

export default studentRoutes
