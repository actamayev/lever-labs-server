import express from "express"

import retrieveAllArcadeScores from "../controllers/arcade/retrieve-all-arcade-scores"
import addArcadeScore from "../controllers/arcade/add-arcade-score"
import validateNewArcadeScore from "../middleware/request-validation/arcade/validate-new-arcade-score"

const arcadeRoutes = express.Router()

arcadeRoutes.get("/retrieve-all-arcade-scores", retrieveAllArcadeScores)

arcadeRoutes.post("/add-arcade-score", validateNewArcadeScore, addArcadeScore)

export default arcadeRoutes
