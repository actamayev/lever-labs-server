import express from "express"

import attachTeacherId from "../middleware/attach/attach-teacher-id"
import attachStudentUserId from "../middleware/attach/attach-student-user-id"
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
import createHub from "../controllers/teacher/create-hub"
import validateCreateHub from "../middleware/request-validation/teacher/validate-create-hub"

const teacherRoutes = express.Router()

teacherRoutes.post(
	"/request-become-teacher",
	validateBecomeTeacher,
	confirmUserIsNotTeacher,
	requestBecomeTeacher
)

teacherRoutes.post(
	"/edit-teacher-name-data",
	validateTeacherNameData,
	editTeacherName
)

teacherRoutes.post(
	"/create-classroom",
	validateClassroomName,
	attachTeacherId,
	createClassroom
)

teacherRoutes.post(
	"/edit-classroom-name/:classCode",
	attachClassroomIdValidateClassCode,
	validateClassroomName,
	attachTeacherId,
	confirmClassBelongsToTeacher,
	editClassroomName
)

teacherRoutes.get(
	"/retrieve-basic-classroom-info",
	attachTeacherId,
	retrieveBasicClassroomInfo
)

teacherRoutes.get(
	"/retrieve-detailed-classroom-info/:classCode",
	attachClassroomIdValidateClassCode,
	attachTeacherId,
	retrieveDetailedClassroomInfo
)

teacherRoutes.post(
	"/invite-student-join-class/:classCode",
	attachClassroomIdValidateClassCode,
	validateInviteJoinClass,
	attachTeacherId,
	attachStudentUserId,
	inviteStudentJoinClass
)

teacherRoutes.post(
	"create-hub/:classCode",
	validateCreateHub,
	attachTeacherId,
	attachClassroomIdValidateClassCode,
	createHub
)

export default teacherRoutes
