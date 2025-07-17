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

const incorrectResponses = [
	"Hmm, not quite. Try again!",
	"Close, but not quite right. Give it another shot!",
	"Not quite there yet. Keep trying!",
	"Almost! Try a different approach.",
	"Not quite right. You can do this!",
	"Hmm, that's not quite it. Try again!",
	"Not quite correct. Keep going!",
	"Close! Try adjusting your approach.",
	"Not quite there. Give it another try!",
	"Almost there! Try once more."
]

export function getRandomCorrectResponse(): string {
	return correctResponses[Math.floor(Math.random() * correctResponses.length)]
}

export function getRandomIncorrectResponse(): string {
	return incorrectResponses[Math.floor(Math.random() * incorrectResponses.length)]
}
