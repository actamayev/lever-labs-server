import { ChallengeData, CHALLENGES } from "@bluedotrobots/common-ts"

export default function findChallengeDataFromId(challengeId: string): ChallengeData {
	const challenge = CHALLENGES.find(foundChallenge => foundChallenge.id === challengeId)

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

export function findChallengeSnapshotFromId(challengeId: string): ChallengeSnapshot {
	const challenge = CHALLENGES.find(foundChallenge => foundChallenge.id === challengeId)

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
