import express from "express"

import editSandboxProject from "../controllers/sandbox/edit-sandbox-project"
import createSandboxProject from "../controllers/sandbox/create-sandbox-project"
import getAllSandboxProjects from "../controllers/sandbox/get-all-sandbox-projects"
import editSandboxProjectName from "../controllers/sandbox/edit-sandbox-project-name"
import getSingleSandboxProject from "../controllers/sandbox/get-single-sandbox-project"

import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import attachSandboxProjectIdFromUUID from "../middleware/attach/attach-sandbox-project-id-from-uuid"
import validateEditSandboxProject from "../middleware/request-validation/sandbox/validate-edit-sandbox-project"
import validateEditSandboxProjectName from "../middleware/request-validation/sandbox/validate-edit-sandbox-project-name"
import confirmSandboxProjectExistsAndValidUserId from "../middleware/confirm/confirm-sandbox-project-exists-and-valid-user-id"
import validateProjectUUIDInParams from "../middleware/request-validation/sandbox/validate-project-uuid-in-params"

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

sandboxRoutes.get("/retrieve-all-sandbox-projects", jwtVerifyAttachUserId, getAllSandboxProjects)

sandboxRoutes.get(
	"/retrieve-single-sandbox-project/:projectUUID",
	validateProjectUUIDInParams,
	jwtVerifyAttachUserId,
	attachSandboxProjectIdFromUUID,
	confirmSandboxProjectExistsAndValidUserId,
	getSingleSandboxProject
)

export default sandboxRoutes
