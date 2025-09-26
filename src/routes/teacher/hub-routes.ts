import express from "express"
import validateCreateHub from "../../middleware/request-validation/teacher/validate-create-hub"
import attachTeacherId from "../../middleware/attach/attach-teacher-id"
import attachClassroomIdValidateClassCode from "../../middleware/confirm/attach-classroom-id-attach-class-code"
import confirmClassBelongsToTeacher from "../../middleware/confirm/confirm-class-belongs-to-teacher"
import createHub from "../../controllers/teacher/create-hub"
import validateDeleteHub from "../../middleware/request-validation/teacher/validate-delete-hub"
import confirmHubBelongsToTeacher from "../../middleware/confirm/confirm-hub-belongs-to-teacher"
import deleteHub from "../../controllers/teacher/delete-hub"
import validateSetHubNewSlideId from "../../middleware/request-validation/teacher/validate-set-hub-new-slide-id"
import setHubNewSlideId from "../../controllers/teacher/set-hub-new-slide-id"

const hubRoutes = express.Router()

hubRoutes.post(
	"/create-hub/:classCode",
	validateCreateHub,
	attachTeacherId, // we are not using this teacherId, but we need to make sure the user is a teacher
	attachClassroomIdValidateClassCode,
	confirmClassBelongsToTeacher,
	createHub
)

hubRoutes.post(
	"/delete-hub/:classCode",
	validateDeleteHub,
	attachTeacherId, // we are not using this teacherId, but we need to make sure the user is a teacher
	attachClassroomIdValidateClassCode,
	confirmHubBelongsToTeacher,
	confirmClassBelongsToTeacher,
	deleteHub
)

// TODO: Might not need this endpoint (should be hit directly from  update-career-quest-user-progress)
hubRoutes.post(
	"/set-hub-new-slide-id/:classCode",
	validateSetHubNewSlideId,
	attachTeacherId, // we are not using this teacherId, but we need to make sure the user is a teacher
	attachClassroomIdValidateClassCode,
	confirmHubBelongsToTeacher,
	confirmClassBelongsToTeacher,
	setHubNewSlideId
)


export default hubRoutes
