import { CqChallengeData, CHALLENGES, ChallengeUUID } from "@bluedotrobots/common-ts"

export default function findChallengeDataFromUUID(challengeUUID: ChallengeUUID): CqChallengeData {
	const challenge = CHALLENGES.find(foundChallenge => foundChallenge.challengeUUID === challengeUUID)

	if (!challenge) {
		throw new Error(`Challenge with UUID "${challengeUUID}" not found`)
	}

	return challenge
}
