import multer from "multer"
import express from "express"

import jwtVerifyAttachUser from "../middleware/jwt/jwt-verify-attach-user"
import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import confirmUsernameNotTaken from "../middleware/confirm/confirm-username-not-taken"
import validateImageType from "../middleware/request-validation/personal-info/validate-image-type"
import validateUpdateName from "../middleware/request-validation/personal-info/validate-update-name"
import validateSetDefaultSiteTheme from "../middleware/request-validation/personal-info/validate-set-default-site-theme"
import validateUpdateChangePassword from "../middleware/request-validation/personal-info/validate-update-change-password"
import validateSetSandboxNotesOpenStatus from "../middleware/request-validation/personal-info/validate-set-sandbox-notes-open-status"

import setName from "../controllers/personal-info/set-name"
import setUsername from "../controllers/personal-info/set-username"
import setNewPassword from "../controllers/personal-info/set-new-password"
import getPersonalInfo from "../controllers/personal-info/get-personal-info"
import setDefaultSiteTheme from "../controllers/personal-info/set-default-site-theme"
import uploadProfilePicture from "../controllers/personal-info/upload-profile-picture"
import setSandboxNotesOpenStatus from "../controllers/personal-info/set-sandbox-notes-open-status"
import removeCurrentProfilePicture from "../controllers/personal-info/remove-current-profile-picture"
import validateUpdateUsername from "../middleware/request-validation/personal-info/validate-update-username"

const personalInfoRoutes = express.Router()
const upload = multer()

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

personalInfoRoutes.post(
	"/upload-profile-picture",
	upload.single("file"),
	validateImageType,
	jwtVerifyAttachUserId,
	uploadProfilePicture
)

personalInfoRoutes.post("/remove-current-profile-picture", jwtVerifyAttachUserId, removeCurrentProfilePicture)

personalInfoRoutes.post(
	"/update-name/:name?",
	validateUpdateName,
	jwtVerifyAttachUserId,
	setName
)

personalInfoRoutes.post(
	"/update-username/:username",
	validateUpdateUsername,
	jwtVerifyAttachUserId,
	confirmUsernameNotTaken,
	setUsername
)

personalInfoRoutes.post(
	"/change-password",
	validateUpdateChangePassword,
	jwtVerifyAttachUser,
	setNewPassword
)

export default personalInfoRoutes
