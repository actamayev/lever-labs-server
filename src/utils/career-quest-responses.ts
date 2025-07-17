const correctResponses = [
	"Correct! Great job!",
	"Perfect! Well done!",
	"Excellent work!",
	"Outstanding! You got it!",
	"Brilliant! That's right!",
	"Fantastic! You solved it!",
	"Amazing! Correct!",
	"Wonderful! You did it!",
	"Superb! That's correct!",
	"Great! You nailed it!"
]

const farOffResponses = [
	"Not quite there yet. Keep trying!",
	"This needs some work. Try a different approach!",
	"Hmm, that's not quite right. Let's think about this differently.",
	"Not quite correct. Take your time and try again!",
	"That's not it yet. You can do this!",
	"Not quite right. Consider the challenge requirements again.",
	"This isn't working yet. Try a new approach!",
	"Not quite there. Keep experimenting!",
	"This needs more work. You're learning!",
	"Not quite right. Don't give up!"
]

const gettingCloserResponses = [
	"Getting closer! Try adjusting your approach.",
	"You're on the right track! Keep refining it.",
	"Close! Just needs a few tweaks.",
	"You're getting there! Almost got it.",
	"Good progress! Just needs some fine-tuning.",
	"You're heading in the right direction! Keep going.",
	"Not bad! You're getting warmer.",
	"You're making progress! Just needs a bit more work.",
	"Good start! You're getting closer to the solution.",
	"Nice try! You're almost there."
]

const almostThereResponses = [
	"So close! Just one more adjustment.",
	"Almost there! Just a small tweak needed.",
	"You're very close! Just needs a tiny fix.",
	"Almost perfect! Just one more thing.",
	"You're right there! Just needs a final touch.",
	"So close! One more small change.",
	"Nearly got it! Just needs a minor adjustment.",
	"You're almost there! Just needs a bit more.",
	"Very close! Just one more try.",
	"Almost! You're just about there!"
]

export function getRandomCorrectResponse(): string {
	return correctResponses[Math.floor(Math.random() * correctResponses.length)]
}

export function getRandomIncorrectResponse(score: number): string {
	let responseArray: string[]

	if (score < 0.3) {
		responseArray = farOffResponses
	} else if (score < 0.7) {
		responseArray = gettingCloserResponses
	} else {
		responseArray = almostThereResponses
	}

	return responseArray[Math.floor(Math.random() * responseArray.length)]
}
