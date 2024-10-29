import express from "express"

import login from "../controllers/auth/login"
import logout from "../controllers/auth/logout"
import register from "../controllers/auth/register"
import registerUsername from "../controllers/auth/register-username"
import googleLoginAuthCallback from "../controllers/auth/google-login-auth-callback"

import jwtVerifyAttachUser from "../middleware/jwt/jwt-verify-attach-user"
import validateLogin from "../middleware/request-validation/auth/validate-login"
import validateRegister from "../middleware/request-validation/auth/validate-register"
import validateRegisterUsername from "../middleware/request-validation/auth/validate-register-username"
import validateGoogleLoginAuthCallback from "../middleware/request-validation/auth/validate-google-login-auth-callback"

const authRoutes = express.Router()

authRoutes.post("/login", validateLogin, login)
authRoutes.post("/logout", logout)
authRoutes.post("/register", validateRegister, register)

authRoutes.post(
	"/set-username",
	validateRegisterUsername,
	jwtVerifyAttachUser,
	registerUsername
)

authRoutes.use("/google-auth/login-callback", validateGoogleLoginAuthCallback, googleLoginAuthCallback)


export default authRoutes
