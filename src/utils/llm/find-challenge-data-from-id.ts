import { ChallengeData, CHALLENGES } from "@bluedotrobots/common-ts"

export default function findChallengeDataFromId(challengeId: string): ChallengeData {
	const challenge = CHALLENGES.find(foundChallenge => foundChallenge.id === challengeId)

	if (!challenge) {
		throw new Error(`Challenge with id "${challengeId}" not found`)
	}

	return challenge
}

