import express from "express"
import validateCreateScoreboard from "../../middleware/request-validation/teacher/validate-create-scoreboard"
import attachTeacherId from "../../middleware/attach/attach-teacher-id"
import attachClassroomIdValidateClassCode from "../../middleware/confirm/attach-classroom-id-attach-class-code"
import confirmClassBelongsToTeacher from "../../middleware/confirm/confirm-class-belongs-to-teacher"
import createScoreboard from "../../controllers/teacher/create-scoreboard"

const scoreboardRoutes = express.Router()

scoreboardRoutes.post(
	"/create-scoreboard/:classCode",
	validateCreateScoreboard,
	attachTeacherId,
	attachClassroomIdValidateClassCode,
	confirmClassBelongsToTeacher,
	createScoreboard
)

export default scoreboardRoutes
