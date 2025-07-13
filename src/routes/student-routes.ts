import express from "express"

import attachStudentId from "../middleware/attach/attach-student-id"
import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import confirmUserInvitedToClass from "../middleware/confirm/confirm-student-invited-to-class"
import confirmUserIsNotInClassroom from "../middleware/confirm/confirm-user-is-not-in-classroom"
import validateInviteResponse from "../middleware/request-validation/student/validate-invite-response"
import attachClassroomIdValidateClassCode from "../middleware/confirm/attach-classroom-id-attach-class-code"

import joinClass from "../controllers/student/join-class"
import getStudentClasses from "../controllers/student/get-student-classes"
import respondToClassroomInvite from "../controllers/student/respond-to-classroom-invite"

const studentRoutes = express.Router()

studentRoutes.post(
	"/join-class/:classCode",
	attachClassroomIdValidateClassCode,
	jwtVerifyAttachUserId,
	confirmUserIsNotInClassroom,
	joinClass
)

studentRoutes.post(
	"/respond-to-classroom-invitation/:classCode",
	attachClassroomIdValidateClassCode,
	validateInviteResponse,
	jwtVerifyAttachUserId,
	attachStudentId,
	confirmUserInvitedToClass,
	respondToClassroomInvite
)

studentRoutes.get("/classrooms", jwtVerifyAttachUserId, getStudentClasses)

export default studentRoutes
