import { CqChallengeData, CHALLENGES, ChallengeUUID } from "@bluedotrobots/common-ts"

export default function findChallengeDataFromUUID(challengeUUID: ChallengeUUID): CqChallengeData {
	const challenge = CHALLENGES.find(foundChallenge => foundChallenge.challengeUUID === challengeUUID)

	if (!challenge) {
		throw new Error(`Challenge with UUID "${challengeUUID}" not found`)
	}

	return challenge
}

interface ChallengeSnapshot {
	title: string
	description: string
	expectedBehavior: string
	solutionCode: string
}

export function findChallengeSnapshotFromUUID(challengeUUID: ChallengeUUID): ChallengeSnapshot {
	const challenge = CHALLENGES.find(foundChallenge => foundChallenge.challengeUUID === challengeUUID)

	if (!challenge) {
		throw new Error(`Challenge with UUID "${challengeUUID}" not found`)
	}

	return {
		title: challenge.title,
		description: challenge.description,
		expectedBehavior: challenge.expectedBehavior,
		solutionCode: challenge.solutionCode
	}
}
