import { CqChallengeData } from "@bluedotrobots/common-ts/types/career-quest"
import { ChallengeUUID } from "@bluedotrobots/common-ts/types/utils"
import { CHALLENGES } from "@bluedotrobots/common-ts/types/cq-challenge-data"

export default function findChallengeDataFromUUID(challengeUUID: ChallengeUUID): CqChallengeData {
	const challenge = CHALLENGES.find(foundChallenge => foundChallenge.challengeUUID === challengeUUID)

	if (!challenge) {
		throw new Error(`Challenge with UUID "${challengeUUID}" not found`)
	}

	return challenge
}
