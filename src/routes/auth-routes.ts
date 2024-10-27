import express from "express"

import login from "../controllers/auth/login"
import logout from "../controllers/auth/logout"
import register from "../controllers/auth/register"

import validateLogin from "../middleware/request-validation/auth/validate-login"
import validateRegister from "../middleware/request-validation/auth/validate-register"

const authRoutes = express.Router()

authRoutes.post("/login", validateLogin, login)
authRoutes.post("/logout", logout)
authRoutes.post("/register", validateRegister, register)

// TODO: Add google routes

export default authRoutes
