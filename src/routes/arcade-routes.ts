import express from "express"

import retrieveAllArcadeScores from "../controllers/arcade/retrieve-all-arcade-scores"

const arcadeRoutes = express.Router()

arcadeRoutes.get("/retrieve-all-arcade-scores", retrieveAllArcadeScores)

export default arcadeRoutes

