import express from "express"

import starSandboxProject from "../controllers/sandbox/star-sandbox-project"
import editSandboxProject from "../controllers/sandbox/edit-sandbox-project"
import deleteSandboxProject from "../controllers/sandbox/delete-sandbox-project"
import createSandboxProject from "../controllers/sandbox/create-sandbox-project"
import sendSandboxCodeToPip from "../controllers/sandbox/send-sandbox-code-to-pip"
import getAllSandboxProjects from "../controllers/sandbox/get-all-sandbox-projects"
import editSandboxProjectName from "../controllers/sandbox/edit-sandbox-project-name"
import editSandboxProjectNotes from "../controllers/sandbox/edit-sandbox-project-notes"
import getSingleSandboxProject from "../controllers/sandbox/get-single-sandbox-project"

import convertCppToBytecode from "../middleware/convert-cpp-to-bytecode"
import confirmPipIsActive from "../middleware/confirm/confirm-pip-is-active"
import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import validateCppCode from "../middleware/request-validation/sandbox/validate-cpp-code"
import confirmUserConnectedToPip from "../middleware/confirm/confirm-user-connected-to-pip"
import confirmUserPreviouslyAddedUUID from "../middleware/confirm/confirm-user-previously-added-uuid"
import attachSandboxProjectIdFromUUID from "../middleware/attach/attach-sandbox-project-id-from-uuid"
import validateEditSandboxProject from "../middleware/request-validation/sandbox/validate-edit-sandbox-project"
import validateStarSandboxProject from "../middleware/request-validation/sandbox/validate-star-sandbox-project"
import validateProjectUUIDInParams from "../middleware/request-validation/sandbox/validate-project-uuid-in-params"
import validateEditSandboxProjectName from "../middleware/request-validation/sandbox/validate-edit-sandbox-project-name"
import validateEditSandboxProjectNotes from "../middleware/request-validation/sandbox/validate-edit-sandbox-project-notes"
import confirmSandboxProjectExistsAndValidUserId from "../middleware/confirm/confirm-sandbox-project-exists-and-valid-user-id"

const sandboxRoutes = express.Router()

sandboxRoutes.post("/create-sandbox-project", jwtVerifyAttachUserId, createSandboxProject)

sandboxRoutes.post(
	"/edit-sandbox-project/:projectUUID",
	validateProjectUUIDInParams,
	validateEditSandboxProject,
	jwtVerifyAttachUserId,
	attachSandboxProjectIdFromUUID,
	confirmSandboxProjectExistsAndValidUserId,
	editSandboxProject
)

sandboxRoutes.post(
	"/edit-sandbox-project-name/:projectUUID",
	validateProjectUUIDInParams,
	validateEditSandboxProjectName,
	jwtVerifyAttachUserId,
	attachSandboxProjectIdFromUUID,
	confirmSandboxProjectExistsAndValidUserId,
	editSandboxProjectName
)

sandboxRoutes.post(
	"/edit-sandbox-project-notes/:projectUUID",
	validateProjectUUIDInParams,
	validateEditSandboxProjectNotes,
	jwtVerifyAttachUserId,
	attachSandboxProjectIdFromUUID,
	confirmSandboxProjectExistsAndValidUserId,
	editSandboxProjectNotes
)

sandboxRoutes.post(
	"/star-sandbox-project/:projectUUID",
	validateProjectUUIDInParams,
	validateStarSandboxProject,
	jwtVerifyAttachUserId,
	attachSandboxProjectIdFromUUID,
	confirmSandboxProjectExistsAndValidUserId,
	starSandboxProject
)

sandboxRoutes.post(
	"/delete-sandbox-project/:projectUUID",
	validateProjectUUIDInParams,
	jwtVerifyAttachUserId,
	attachSandboxProjectIdFromUUID,
	confirmSandboxProjectExistsAndValidUserId,
	deleteSandboxProject
)

sandboxRoutes.get("/retrieve-all-sandbox-projects", jwtVerifyAttachUserId, getAllSandboxProjects)

sandboxRoutes.get(
	"/retrieve-single-sandbox-project/:projectUUID",
	validateProjectUUIDInParams,
	jwtVerifyAttachUserId,
	attachSandboxProjectIdFromUUID,
	confirmSandboxProjectExistsAndValidUserId,
	getSingleSandboxProject
)

sandboxRoutes.post(
	"/send-sandbox-code-to-pip",
	validateCppCode,
	confirmPipIsActive,
	jwtVerifyAttachUserId,
	convertCppToBytecode,
	confirmUserPreviouslyAddedUUID,
	confirmUserConnectedToPip,
	sendSandboxCodeToPip
)

export default sandboxRoutes
