import express from "express"
import validateCreateScoreboard from "../../middleware/request-validation/teacher/validate-create-scoreboard"
import validateUpdateTeamScore from "../../middleware/request-validation/teacher/validate-update-team-score"
import validateUpdateRemainingTime from "../../middleware/request-validation/teacher/validate-update-remaining-time"
import validateDeleteScoreboard from "../../middleware/request-validation/teacher/validate-delete-scoreboard"
import validateAddStudentToScoreboard from "../../middleware/request-validation/teacher/validate-add-student-to-scoreboard"
import validateRemoveStudentFromScoreboard from "../../middleware/request-validation/teacher/validate-remove-student-from-scoreboard"
import attachTeacherId from "../../middleware/attach/attach-teacher-id"
import attachClassroomIdValidateClassCode from "../../middleware/confirm/attach-classroom-id-attach-class-code"
import confirmClassBelongsToTeacher from "../../middleware/confirm/confirm-class-belongs-to-teacher"
import createScoreboard from "../../controllers/teacher/create-scoreboard"
import updateTeamScore from "../../controllers/teacher/update-team-score"
import updateRemainingTime from "../../controllers/teacher/update-remaining-time"
import deleteScoreboard from "../../controllers/teacher/delete-scoreboard"
import addStudentToScoreboard from "../../controllers/teacher/add-student-to-scoreboard"
import removeStudentFromScoreboard from "../../controllers/teacher/remove-student-from-scoreboard"

const scoreboardRoutes = express.Router()

scoreboardRoutes.post(
	"/create-scoreboard/:classCode",
	validateCreateScoreboard,
	attachTeacherId,
	attachClassroomIdValidateClassCode,
	confirmClassBelongsToTeacher,
	createScoreboard
)

scoreboardRoutes.post(
	"/update-remaining-time/:classCode",
	validateUpdateRemainingTime,
	attachTeacherId,
	attachClassroomIdValidateClassCode,
	confirmClassBelongsToTeacher,
	updateRemainingTime
)

scoreboardRoutes.post(
	"/update-team-score/:classCode",
	validateUpdateTeamScore,
	attachTeacherId,
	attachClassroomIdValidateClassCode,
	confirmClassBelongsToTeacher,
	updateTeamScore
)

scoreboardRoutes.post(
	"/delete-scoreboard/:classCode",
	validateDeleteScoreboard,
	attachTeacherId,
	attachClassroomIdValidateClassCode,
	confirmClassBelongsToTeacher,
	deleteScoreboard
)

scoreboardRoutes.post(
	"/add-student-to-scoreboard/:classCode",
	validateAddStudentToScoreboard,
	attachTeacherId,
	attachClassroomIdValidateClassCode,
	confirmClassBelongsToTeacher,
	addStudentToScoreboard
)

scoreboardRoutes.post(
	"/remove-student-from-scoreboard/:classCode",
	validateRemoveStudentFromScoreboard,
	attachTeacherId,
	attachClassroomIdValidateClassCode,
	confirmClassBelongsToTeacher,
	removeStudentFromScoreboard
)

export default scoreboardRoutes
