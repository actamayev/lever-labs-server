# src/controllers/quest Directory - Claude Instructions

## Overview
This directory contains route handlers for the quest/learning system. These controllers manage lesson content, lesson completion tracking, and educational progression.

## Key Files

### get-all-lessons.ts
**Purpose:** Retrieve all available lessons for user

**Function:**
```typescript
async function getAllLessons(req: Request, res: Response): Promise<void>
```

**Response:**
```typescript
[
  {
    lessonId: string,
    title: string,
    description: string,
    order: number,
    isCompleted: boolean,
    difficulty: "beginner" | "intermediate" | "advanced",
    estimatedTime: number  // minutes
  }
]
```

### get-detailed-lesson.ts
**Purpose:** Get full lesson content including sections and questions

**Function:**
```typescript
async function getDetailedLesson(req: Request, res: Response): Promise<void>
```

**Route Parameter:**
```typescript
lessonId: string
```

**Response:**
```typescript
{
  lessonId: string,
  title: string,
  description: string,
  sections: [
    {
      sectionId: string,
      title: string,
      content: string,
      order: number
    }
  ],
  questions: [
    {
      questionId: string,
      questionText: string,
      answerChoices: string[],
      correctAnswer: number,
      explanation: string
    }
  ],
  isCompleted: boolean,
  userProgress: {
    questionsAnswered: number,
    questionsCorrect: number
  }
}
```

### mark-lesson-complete.ts
**Purpose:** Record lesson completion for user

**Function:**
```typescript
async function markLessonComplete(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Extract userId and lessonId
2. Verify lesson exists
3. Check user answered required questions
4. Record completion in database
5. Update user progress
6. Return success

**Request:**
```typescript
{
  lessonId: string,
  answers: { questionId: string, answer: number }[]
}
```

**Response:**
```typescript
{
  success: "",
  lessonProgress: {
    completedLessons: number,
    totalLessons: number,
    progressPercentage: number
  }
}
```

### submit-lesson-answers.ts
**Purpose:** Submit answers to lesson questions

**Function:**
```typescript
async function submitLessonAnswers(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Extract userId and lessonId
2. Extract answers from body
3. Grade answers against key
4. Save submission and score
5. Return feedback

**Request:**
```typescript
{
  lessonId: string,
  answers: { questionId: string, answer: number }[]
}
```

**Response:**
```typescript
{
  score: number,  // 0-100
  feedback: string,
  correctAnswers: { questionId: string, correct: boolean }[],
  lessonCompleted: boolean
}
```

## Database Operations

### Read
- `getLesson(lessonId)` - Lesson details
- `getLessonSections(lessonId)` - Lesson content
- `getLessonQuestions(lessonId)` - Assessment questions
- `getUserLessonProgress(userId)` - Completion status
- `getUserAnswers(userId, lessonId)` - Previous responses

### Write
- `recordLessonCompletion(userId, lessonId, score)` - Mark complete
- `saveUserAnswers(userId, lessonId, answers)` - Store responses
- `updateLessonProgress(userId)` - Update aggregate

## Lesson Structure

### Content Organization
```typescript
Lesson
├── Sections (reading material)
│   ├── Title
│   ├── Content
│   └── Order
└── Questions (assessment)
    ├── Question text
    ├── Answer choices
    ├── Correct answer
    └── Explanation
```

### Completion Criteria
- All sections read (optional tracking)
- Questions answered
- Minimum score threshold (if set)
- Sequential unlock (may require previous lesson)

## Error Handling

```typescript
// Lesson not found
404: { error: "Lesson not found" }

// Invalid answers
400: { error: "Invalid answer format" }

// Prerequisite not met
400: { error: "Complete previous lesson first" }

// Server error
500: { error: "Internal Server Error: ..." }
```

## Integration Patterns

### Lesson Flow
```typescript
1. User opens lesson list
2. GET /api/quest/lessons
3. Select incomplete lesson
4. GET /api/quest/lessons/:lessonId
5. Read content
6. Answer questions
7. POST /api/quest/lessons/:lessonId/submit
8. Get score and feedback
9. Marked complete if passed
10. Next lesson unlocked
```

### Progress Tracking
```typescript
// User profile shows:
- Completed lessons count
- Total lessons
- Percentage completion
- Last lesson completed
- Unlocked lessons
```

## Best Practices

- **Sequential unlock** - Lock lessons until prerequisites met
- **Score threshold** - May require passing grade to complete
- **Save progress** - Auto-save answer drafts
- **Clear feedback** - Explain correct answers
- **Estimated time** - Show lesson duration
- **Progress visibility** - Show completion status

## Common Workflows

### Viewing Lessons
```typescript
1. User clicks "Lessons" in sidebar
2. GET /api/quest/lessons
3. Shows all lessons with completion badges
4. Locked lessons show requirements
5. Click to open lesson detail
```

### Reading Lesson
```typescript
1. Lesson opens with content sections
2. User reads through material
3. Scrolls to questions
4. Answers questions in UI
5. Submits answers
```

### Completing Lesson
```typescript
1. User submits answers
2. POST /api/quest/lessons/:lessonId/submit
3. Server scores answers
4. Shows score and explanations
5. Records completion if passing
6. Unlocks next lesson
```

## Real-time Features

### Progress Updates
- Completion notifications
- Milestone achievements
- Progress percentage tracking

### Feedback
- Immediate question grading
- Explanation display
- Score calculation

## Performance Considerations

- **Pagination** - Large lesson lists
- **Lazy loading** - Content sections
- **Caching** - Lesson content (static)
- **Query optimization** - User progress lookups

## Important Notes

- **Lesson order** - Sequential progression
- **Answer persistence** - Responses saved
- **Replayable** - Can retake lessons
- **Scoring system** - May track best score
- **Prerequisite chain** - Linear dependency

## Integration with Other Systems

### Database Layer
- Lesson content storage
- User progress tracking
- Answer history

### Authentication Layer
- User context required
- Progress per user

### Real-time Layer
- Achievement notifications
- Progress broadcasts

### Type System
- Strong typing of lesson objects
- Answer validation
- Response type checking
