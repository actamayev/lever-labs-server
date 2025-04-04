import express from "express"

import jwtVerifyAttachUser from "../middleware/jwt/jwt-verify-attach-user"
import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import validateSetDefaultSiteTheme from "../middleware/request-validation/personal-info/validate-set-default-site-theme"

import getPersonalInfo from "../controllers/personal-info/get-personal-info"
import setDefaultSiteTheme from "../controllers/personal-info/set-default-site-theme"
import validateSetSandboxNotesOpenStatus from "../middleware/request-validation/personal-info/validate-set-sandbox-notes-open-status"
import setSandboxNotesOpenStatus from "../controllers/personal-info/set-sandbox-notes-open-status"

const personalInfoRoutes = express.Router()

personalInfoRoutes.get(
	"/get-personal-info",
	jwtVerifyAttachUser,
	getPersonalInfo
)

personalInfoRoutes.post(
	"/set-default-site-theme/:defaultSiteTheme",
	validateSetDefaultSiteTheme,
	jwtVerifyAttachUserId,
	setDefaultSiteTheme
)

personalInfoRoutes.post(
	"/set-sandbox-notes-open-status/:isOpen",
	validateSetSandboxNotesOpenStatus,
	jwtVerifyAttachUserId,
	setSandboxNotesOpenStatus
)

export default personalInfoRoutes
