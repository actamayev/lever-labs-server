import express from "express"

import attachTeacherId from "../middleware/attach/attach-teacher-id"
import confirmUserIsNotTeacher from "../middleware/confirm/confirm-user-is-not-teacher"
import confirmClassBelongsToTeacher from "../middleware/confirm/confirm-class-belongs-to-teacher"
import validateBecomeTeacher from "../middleware/request-validation/teacher/validate-become-teacher"
import validateClassroomName from "../middleware/request-validation/teacher/validate-classroom-name"
import validateTeacherNameData from "../middleware/request-validation/teacher/validate-teacher-name-data"
import attachClassroomIdValidateClassCode from "../middleware/confirm/attach-classroom-id-attach-class-code"
import validateCreateHub from "../middleware/request-validation/teacher/validate-create-hub"
import validateDeleteHub from "../middleware/request-validation/teacher/validate-delete-hub"
import confirmHubBelongsToTeacher from "../middleware/confirm/confirm-hub-belongs-to-teacher"
import validateSetHubNewSlideId from "../middleware/request-validation/teacher/validate-set-hub-new-slide-id"

import createHub from "../controllers/teacher/create-hub"
import deleteHub from "../controllers/teacher/delete-hub"
import createClassroom from "../controllers/teacher/create-classroom"
import editClassroomName from "../controllers/teacher/edit-classroom-name"
import setHubNewSlideId from "../controllers/teacher/set-hub-new-slide-id"
import editTeacherName from "../controllers/teacher/edit-teacher-name-data"
import requestBecomeTeacher from "../controllers/teacher/request-become-teacher"
import retrieveBasicClassroomInfo from "../controllers/teacher/retrieve-basic-classroom-info"
import retrieveDetailedClassroomInfo from "../controllers/teacher/retrieve-detailed-classroom-info"
import validateUpdateGarageDrivingStatus from "../middleware/request-validation/teacher/validate-update-garage-driving-status"
import updateGarageDrivingStatus from "../controllers/teacher/update-garage-driving-status"
import validateUpdateGarageSounds from "../middleware/request-validation/teacher/validate-update-garage-sounds"
import updateGarageSounds from "../controllers/teacher/update-garage-sounds"
import validateUpdateGarageLights from "../middleware/request-validation/teacher/validate-update-garage-lights"
import updateGarageLights from "../controllers/teacher/update-garage-lights"
import validateUpdateIndividualStudentGarageDriving
	from "../middleware/request-validation/teacher/validate-update-individual-student-garage-driving"
import updateIndividualStudentGarageDriving from "../controllers/teacher/update-individual-student-garage-driving"
import validateUpdateIndividualStudentGarageSounds
	from "../middleware/request-validation/teacher/validate-update-individual-student-garage-sounds"
import updateIndividualStudentGarageSounds from "../controllers/teacher/update-individual-student-garage-sounds"
import validateUpdateIndividualStudentGarageLights
	from "../middleware/request-validation/teacher/validate-update-individual-student-garage-lights"
import updateIndividualStudentGarageLights from "../controllers/teacher/update-individual-student-garage-lights"
import validateUpdateGarageDisplay from "../middleware/request-validation/teacher/validate-update-garage-display"
import updateGarageDisplay from "../controllers/teacher/update-garage-display"
import validateUpdateIndividualStudentGarageDisplay
	from "../middleware/request-validation/teacher/validate-update-individual-student-garage-display"
import updateIndividualStudentGarageDisplay from "../controllers/teacher/update-individual-student-garage-display"

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
	confirmClassBelongsToTeacher,
	retrieveDetailedClassroomInfo
)

teacherRoutes.post(
	"/create-hub/:classCode",
	validateCreateHub,
	attachTeacherId, // we are not using this teacherId, but we need to make sure the user is a teacher
	attachClassroomIdValidateClassCode,
	confirmClassBelongsToTeacher,
	createHub
)

teacherRoutes.post(
	"/delete-hub/:classCode",
	validateDeleteHub,
	attachTeacherId, // we are not using this teacherId, but we need to make sure the user is a teacher
	attachClassroomIdValidateClassCode,
	confirmHubBelongsToTeacher,
	confirmClassBelongsToTeacher,
	deleteHub
)

// TODO: Might not need this endpoint (should be hit directly from  update-career-quest-user-progress)
teacherRoutes.post(
	"/set-hub-new-slide-id/:classCode",
	validateSetHubNewSlideId,
	attachTeacherId, // we are not using this teacherId, but we need to make sure the user is a teacher
	attachClassroomIdValidateClassCode,
	confirmHubBelongsToTeacher,
	confirmClassBelongsToTeacher,
	setHubNewSlideId
)

teacherRoutes.post(
	"/update-garage-driving-status-all-students/:classCode",
	validateUpdateGarageDrivingStatus,
	attachTeacherId,
	attachClassroomIdValidateClassCode,
	confirmClassBelongsToTeacher,
	updateGarageDrivingStatus
)

teacherRoutes.post(
	"/update-garage-sounds-all-students/:classCode",
	validateUpdateGarageSounds,
	attachTeacherId,
	attachClassroomIdValidateClassCode,
	confirmClassBelongsToTeacher,
	updateGarageSounds
)

teacherRoutes.post(
	"/update-garage-lights-all-students/:classCode",
	validateUpdateGarageLights,
	attachTeacherId,
	attachClassroomIdValidateClassCode,
	confirmClassBelongsToTeacher,
	updateGarageLights
)

teacherRoutes.post(
	"/update-individual-student-garage-driving/:classCode",
	validateUpdateIndividualStudentGarageDriving,
	attachTeacherId,
	attachClassroomIdValidateClassCode,
	confirmClassBelongsToTeacher,
	updateIndividualStudentGarageDriving
)

teacherRoutes.post(
	"/update-individual-student-garage-sounds/:classCode",
	validateUpdateIndividualStudentGarageSounds,
	attachTeacherId,
	attachClassroomIdValidateClassCode,
	confirmClassBelongsToTeacher,
	updateIndividualStudentGarageSounds
)

teacherRoutes.post(
	"/update-individual-student-garage-lights/:classCode",
	validateUpdateIndividualStudentGarageLights,
	attachTeacherId,
	attachClassroomIdValidateClassCode,
	confirmClassBelongsToTeacher,
	updateIndividualStudentGarageLights
)

teacherRoutes.post(
	"/update-garage-display-all-students/:classCode",
	validateUpdateGarageDisplay,
	attachTeacherId,
	attachClassroomIdValidateClassCode,
	confirmClassBelongsToTeacher,
	updateGarageDisplay
)

teacherRoutes.post(
	"/update-individual-student-garage-display/:classCode",
	validateUpdateIndividualStudentGarageDisplay,
	attachTeacherId,
	attachClassroomIdValidateClassCode,
	confirmClassBelongsToTeacher,
	updateIndividualStudentGarageDisplay
)

export default teacherRoutes
