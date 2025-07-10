import express from "express"

import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import confirmUserIsTeacher from "../middleware/confirm/confirm-user-is-teacher"
import confirmUsernameExists from "../middleware/confirm/confirm-username-exists"
import confirmUserIsNotTeacher from "../middleware/confirm/confirm-user-is-not-teacher"
import validateClassCode from "../middleware/request-validation/teacher/validate-class-code"
import validateBecomeTeacher from "../middleware/request-validation/teacher/validate-become-teacher"
import validateCreateClassroom from "../middleware/request-validation/teacher/validate-create-classroom"
import validateInviteJoinClass from "../middleware/request-validation/teacher/validate-invite-join-class"

import createClassroom from "../controllers/teacher/create-classroom"
import inviteStudentJoinClass from "../controllers/teacher/invite-join-class"
import requestBecomeTeacher from "../controllers/teacher/request-become-teacher"
import retrieveBasicClassroomInfo from "../controllers/teacher/retrieve-basic-classroom-info"
import retrieveDetailedClassroomInfo from "../controllers/teacher/retrieve-detailed-classroom-info"

const teacherRoutes = express.Router()

teacherRoutes.post(
	"/request-become-teacher",
	validateBecomeTeacher,
	jwtVerifyAttachUserId,
	confirmUserIsNotTeacher,
	requestBecomeTeacher
)

teacherRoutes.post(
	"/create-classroom",
	validateCreateClassroom,
	jwtVerifyAttachUserId,
	confirmUserIsTeacher,
	createClassroom
)

teacherRoutes.get(
	"/retrieve-basic-classroom-info",
	jwtVerifyAttachUserId,
	confirmUserIsTeacher,
	retrieveBasicClassroomInfo
)

teacherRoutes.get(
	"/retrieve-detailed-classroom-info/:classCode",
	validateClassCode,
	jwtVerifyAttachUserId,
	confirmUserIsTeacher,
	retrieveDetailedClassroomInfo
)

teacherRoutes.post(
	"/invite-student-join-class/:classCode",
	validateClassCode,
	validateInviteJoinClass,
	jwtVerifyAttachUserId,
	confirmUserIsTeacher,
	confirmUsernameExists,
	inviteStudentJoinClass
)

export default teacherRoutes
