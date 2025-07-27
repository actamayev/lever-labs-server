import { CqChallengeData, CHALLENGES, ChallengeId } from "@bluedotrobots/common-ts"

export default function findChallengeDataFromId(challengeId: ChallengeId): CqChallengeData {
	const challenge = CHALLENGES.find(foundChallenge => foundChallenge.challengeId === challengeId)

	if (!challenge) {
		throw new Error(`Challenge with id "${challengeId}" not found`)
	}

	return challenge
}

interface ChallengeSnapshot {
	title: string
	description: string
	expectedBehavior: string
	solutionCode: string
}

export function findChallengeSnapshotFromId(challengeId: ChallengeId): ChallengeSnapshot {
	const challenge = CHALLENGES.find(foundChallenge => foundChallenge.challengeId === challengeId)

	if (!challenge) {
		throw new Error(`Challenge with id "${challengeId}" not found`)
	}

	return {
		title: challenge.title,
		description: challenge.description,
		expectedBehavior: challenge.expectedBehavior,
		solutionCode: challenge.solutionCode
	}
}
