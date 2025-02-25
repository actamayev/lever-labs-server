import express from "express"

import jwtVerifyAttachUser from "../middleware/jwt/jwt-verify-attach-user"
import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import validateSetSidebarState from "../middleware/request-validation/personal-info/validate-set-sidebar-state"
import validateSetDefaultSiteTheme from "../middleware/request-validation/personal-info/validate-set-default-site-theme"

import getPersonalInfo from "../controllers/personal-info/get-personal-info"
import setDefaultSiteTheme from "../controllers/personal-info/set-default-site-theme"
import setDefaultSidebarState from "../controllers/personal-info/set-default-sidebar-state"

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
	"/set-default-sidebar-state/:defaultSidebarState",
	validateSetSidebarState,
	jwtVerifyAttachUserId,
	setDefaultSidebarState
)

export default personalInfoRoutes
