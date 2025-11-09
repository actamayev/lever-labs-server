import express from "express"

import starSandboxProject from "../controllers/sandbox/star-sandbox-project"
import editSandboxProject from "../controllers/sandbox/edit-sandbox-project"
import deleteSandboxProject from "../controllers/sandbox/delete-sandbox-project"
import createSandboxProject from "../controllers/sandbox/create-sandbox-project"
import getAllSandboxProjects from "../controllers/sandbox/get-all-sandbox-projects"
import editSandboxProjectName from "../controllers/sandbox/edit-sandbox-project-name"
import editSandboxProjectNotes from "../controllers/sandbox/edit-sandbox-project-notes"
import getSingleSandboxProject from "../controllers/sandbox/get-single-sandbox-project"
import sendSandboxCodeToPipUsb from "../controllers/sandbox/send-sandbox-code-to-pip-usb"
import sendSandboxCodeToPipWifi from "../controllers/sandbox/send-sandbox-code-to-pip-wifi"
import stopCurrentlyRunningSandboxCode from "../controllers/sandbox/stop-currently-running-sandbox-code"

import convertCppToBytecode from "../middleware/convert-cpp-to-bytecode"
import confirmPipIsActive from "../middleware/confirm/confirm-pip-is-active"
import validateCppCode from "../middleware/request-validation/sandbox/validate-cpp-code"
import confirmUserConnectedToPip from "../middleware/confirm/confirm-user-connected-to-pip"
import validatePipUUIDInBody from "../middleware/request-validation/pip/validate-pip-uuid-in-body"
import validateEditSandboxProject from "../middleware/request-validation/sandbox/validate-edit-sandbox-project"
import validateStarSandboxProject from "../middleware/request-validation/sandbox/validate-star-sandbox-project"
import validateProjectUUIDInParams from "../middleware/request-validation/sandbox/validate-project-uuid-in-params"
import validateEditSandboxProjectName from "../middleware/request-validation/sandbox/validate-edit-sandbox-project-name"
import validateEditSandboxProjectNotes from "../middleware/request-validation/sandbox/validate-edit-sandbox-project-notes"
import confirmSandboxProjectExistsAndValidUserId from "../middleware/confirm/confirm-sandbox-project-exists-and-valid-user-id"
import validateCppCodeAndPipUUID from "../middleware/request-validation/sandbox/validate-cpp-code-and-pip-uuid"

const sandboxRoutes = express.Router()

sandboxRoutes.post("/create-sandbox-project", createSandboxProject)

sandboxRoutes.post(
	"/edit-sandbox-project/:projectUUID",
	validateProjectUUIDInParams,
	validateEditSandboxProject,
	confirmSandboxProjectExistsAndValidUserId,
	editSandboxProject
)

sandboxRoutes.post(
	"/edit-sandbox-project-name/:projectUUID",
	validateProjectUUIDInParams,
	validateEditSandboxProjectName,
	confirmSandboxProjectExistsAndValidUserId,
	editSandboxProjectName
)

sandboxRoutes.post(
	"/edit-sandbox-project-notes/:projectUUID",
	validateProjectUUIDInParams,
	validateEditSandboxProjectNotes,
	confirmSandboxProjectExistsAndValidUserId,
	editSandboxProjectNotes
)

sandboxRoutes.post(
	"/star-sandbox-project/:projectUUID",
	validateProjectUUIDInParams,
	validateStarSandboxProject,
	confirmSandboxProjectExistsAndValidUserId,
	starSandboxProject
)

sandboxRoutes.post(
	"/delete-sandbox-project/:projectUUID",
	validateProjectUUIDInParams,
	confirmSandboxProjectExistsAndValidUserId,
	deleteSandboxProject
)

sandboxRoutes.get("/retrieve-all-sandbox-projects", getAllSandboxProjects)

sandboxRoutes.get(
	"/retrieve-single-sandbox-project/:projectUUID",
	validateProjectUUIDInParams,
	confirmSandboxProjectExistsAndValidUserId,
	getSingleSandboxProject
)

sandboxRoutes.post(
	"/send-sandbox-code-to-pip-wifi",
	validateCppCodeAndPipUUID,
	confirmPipIsActive(true),
	convertCppToBytecode,
	confirmUserConnectedToPip,
	sendSandboxCodeToPipWifi
)

sandboxRoutes.post(
	"/send-sandbox-code-to-pip-usb",
	validateCppCode,
	convertCppToBytecode,
	sendSandboxCodeToPipUsb
)

sandboxRoutes.post(
	"/stop-currently-running-code",
	validatePipUUIDInBody,
	confirmPipIsActive(true),
	stopCurrentlyRunningSandboxCode
)

export default sandboxRoutes
