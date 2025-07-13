import express from "express"

import attachTeacherId from "../middleware/attach/attach-teacher-id"
import attachStudentUserId from "../middleware/attach/attach-student-user-id"
import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import confirmUserIsNotTeacher from "../middleware/confirm/confirm-user-is-not-teacher"
import confirmClassBelongsToTeacher from "../middleware/confirm/confirm-class-belongs-to-teacher"
import validateBecomeTeacher from "../middleware/request-validation/teacher/validate-become-teacher"
import validateClassroomName from "../middleware/request-validation/teacher/validate-classroom-name"
import validateInviteJoinClass from "../middleware/request-validation/teacher/validate-invite-join-class"
import validateTeacherNameData from "../middleware/request-validation/teacher/validate-teacher-name-data"
import attachClassroomIdValidateClassCode from "../middleware/confirm/attach-classroom-id-attach-class-code"

import createClassroom from "../controllers/teacher/create-classroom"
import editClassroomName from "../controllers/teacher/edit-classroom-name"
import editTeacherName from "../controllers/teacher/edit-teacher-name-data"
import requestBecomeTeacher from "../controllers/teacher/request-become-teacher"
import inviteStudentJoinClass from "../controllers/teacher/invite-student-join-class"
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
	"/edit-teacher-name-data",
	validateTeacherNameData,
	jwtVerifyAttachUserId,
	editTeacherName
)

teacherRoutes.post(
	"/create-classroom",
	validateClassroomName,
	jwtVerifyAttachUserId,
	attachTeacherId,
	createClassroom
)

teacherRoutes.post(
	"/edit-classroom-name/:classCode",
	attachClassroomIdValidateClassCode,
	validateClassroomName,
	jwtVerifyAttachUserId,
	attachTeacherId,
	confirmClassBelongsToTeacher,
	editClassroomName
)

teacherRoutes.get(
	"/retrieve-basic-classroom-info",
	jwtVerifyAttachUserId,
	attachTeacherId,
	retrieveBasicClassroomInfo
)

teacherRoutes.get(
	"/retrieve-detailed-classroom-info/:classCode",
	attachClassroomIdValidateClassCode,
	jwtVerifyAttachUserId,
	attachTeacherId,
	retrieveDetailedClassroomInfo
)

teacherRoutes.post(
	"/invite-student-join-class/:classCode",
	attachClassroomIdValidateClassCode,
	validateInviteJoinClass,
	jwtVerifyAttachUserId,
	attachTeacherId,
	attachStudentUserId,
	inviteStudentJoinClass
)

export default teacherRoutes
