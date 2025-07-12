import express from "express"

import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import confirmUserIsTeacher from "../middleware/confirm/confirm-user-is-teacher"
import confirmUsernameExists from "../middleware/confirm/confirm-username-exists"
import confirmUserIsNotTeacher from "../middleware/confirm/confirm-user-is-not-teacher"
import validateClassCode from "../middleware/request-validation/teacher/validate-class-code"
import validateBecomeTeacher from "../middleware/request-validation/teacher/validate-become-teacher"
import validateClassroomName from "../middleware/request-validation/teacher/validate-classroom-name"
import validateInviteJoinClass from "../middleware/request-validation/teacher/validate-invite-join-class"
import validateTeacherNameData from "../middleware/request-validation/teacher/validate-teacher-name-data"

import createClassroom from "../controllers/teacher/create-classroom"
import editClassroomName from "../controllers/teacher/edit-classroom-name"
import editTeacherName from "../controllers/teacher/edit-teacher-name-data"
import inviteStudentJoinClass from "../controllers/teacher/invite-join-class"
import requestBecomeTeacher from "../controllers/teacher/request-become-teacher"
import retrieveBasicClassroomInfo from "../controllers/teacher/retrieve-basic-classroom-info"
import retrieveDetailedClassroomInfo from "../controllers/teacher/retrieve-detailed-classroom-info"
import confirmClassBelongsToTeacher from "../middleware/confirm/confirm-class-belongs-to-teacher"

const teacherRoutes = express.Router()

teacherRoutes.post(
	"/request-become-teacher",
	validateBecomeTeacher,
	jwtVerifyAttachUserId,
	confirmUserIsNotTeacher,
	requestBecomeTeacher
)

teacherRoutes.post(
	"/edit-teacher-name-data",
	validateTeacherNameData,
	jwtVerifyAttachUserId,
	editTeacherName
)

teacherRoutes.post(
	"/create-classroom",
	validateClassroomName,
	jwtVerifyAttachUserId,
	confirmUserIsTeacher,
	createClassroom
)

teacherRoutes.post(
	"/edit-classroom-name/:classCode",
	validateClassCode,
	validateClassroomName,
	jwtVerifyAttachUserId,
	confirmUserIsTeacher,
	confirmClassBelongsToTeacher,
	// confirm this classroom belongs to this teacher
	editClassroomName
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
