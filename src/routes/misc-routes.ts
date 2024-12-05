import express from "express"

import validateSubscribeForEmailUpdates from "../middleware/request-validation/misc/validate-subscribe-for-email-updates"

import subscribeForEmailUpdates from "../controllers/misc/subscribe-for-email-updates"

const miscRoutes = express.Router()

miscRoutes.post("/subscribe-for-email-updates", validateSubscribeForEmailUpdates, subscribeForEmailUpdates)

export default miscRoutes
