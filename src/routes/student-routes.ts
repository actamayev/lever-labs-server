import express from "express"

import attachStudentId from "../middleware/attach/attach-student-id"
import confirmUserIsNotInClassroom from "../middleware/confirm/confirm-user-is-not-in-classroom"
import confirmStudentInvitedToClass from "../middleware/confirm/confirm-student-invited-to-class"
import validateInviteResponse from "../middleware/request-validation/student/validate-invite-response"
import attachClassroomIdValidateClassCode from "../middleware/confirm/attach-classroom-id-attach-class-code"

import joinClass from "../controllers/student/join-class"
import getStudentClasses from "../controllers/student/get-student-classes"
import respondToClassroomInvite from "../controllers/student/respond-to-classroom-invite"
import validateJoinOrLeaveHub from "../middleware/request-validation/student/validate-join-or-leave-hub"
import joinHub from "../controllers/student/join-hub"
import leaveHub from "../controllers/student/leave-hub"
import confirmStudentInHub from "../middleware/confirm/confirm-student-in-hub"
import confirmStudentNotInHub from "../middleware/confirm/confirm-student-not-in-hub"

const studentRoutes = express.Router()

studentRoutes.post(
	"/join-class/:classCode",
	attachClassroomIdValidateClassCode,
	confirmUserIsNotInClassroom,
	joinClass
)

studentRoutes.post(
	"/respond-to-classroom-invitation/:classCode",
	validateInviteResponse,
	attachClassroomIdValidateClassCode,
	attachStudentId,
	confirmStudentInvitedToClass,
	respondToClassroomInvite
)

studentRoutes.get("/classrooms", getStudentClasses)

studentRoutes.post(
	"/join-hub/:classCode",
	validateJoinOrLeaveHub,
	confirmStudentNotInHub,
	attachClassroomIdValidateClassCode,
	attachStudentId,
	joinHub
)

studentRoutes.post(
	"/leave-hub/:classCode",
	validateJoinOrLeaveHub,
	confirmStudentInHub,
	attachClassroomIdValidateClassCode,
	attachStudentId,
	leaveHub
)

export default studentRoutes
