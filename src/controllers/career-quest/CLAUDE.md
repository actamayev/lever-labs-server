# src/controllers/career-quest Directory - Claude Instructions

## Overview
This directory contains route handlers for the career quest educational system. These controllers manage career progression, challenges, chat sessions, and learning progress tracking.

## Key Files

### retrieve-career-progress-data.ts
**Purpose:** Get comprehensive career quest progress for authenticated user

**Function:**
```typescript
async function retrieveCareerProgressData(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Extract userId from authenticated request
2. Query database for user's career progress
3. Fetch all careers with completion status
4. Fetch challenges per career
5. Aggregate progress metrics
6. Return structured progress data

**Response:**
```typescript
{
  careers: [
    {
      careerUUID: string,
      careerName: string,
      description: string,
      isCompleted: boolean,
      progress: number,  // 0-100
      challengesCompleted: number,
      totalChallenges: number,
      challenges: [
        {
          challengeUUID: string,
          challengeName: string,
          isCompleted: boolean,
          dateCompleted?: Date,
          bestScore?: number
        }
      ]
    }
  ],
  overallProgress: number,
  careersCompleted: number,
  totalCareers: number
}
```

### mark-challenge-as-seen.ts
**Purpose:** Track user viewed a challenge

**Function:**
```typescript
async function markChallengeAsSeen(req: Request, res: Response): Promise<void>
```
Tracks engagement, used for recommendations and analytics.

### edit-challenge-sandbox-project.ts
**Purpose:** Link sandbox project to challenge

Links student's code project to challenge, enables code review by AI.

### get-career-details.ts
**Purpose:** Get detailed information about a specific career

**Function:**
```typescript
async function getCareerDetails(req: Request, res: Response): Promise<void>
```

**Response:**
```typescript
{
  careerUUID: string,
  careerName: string,
  description: string,
  overview: string,
  challenges: [
    {
      challengeUUID: string,
      challengeName: string,
      description: string,
      difficulty: "easy" | "medium" | "hard",
      isCompleted: boolean,
      hints?: string[]
    }
  ],
  userProgress: {
    isStarted: boolean,
    completedChallenges: number,
    totalChallenges: number
  }
}
```

### mark-challenge-complete.ts
**Purpose:** Record that user has successfully completed a challenge

**Function:**
```typescript
async function markChallengeComplete(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Extract userId and challengeId
2. Mark challenge as complete in database
3. Calculate reward points (if applicable)
4. Check if career is now complete
5. Emit real-time achievement notification
6. Return success

**Request:**
```typescript
{
  challengeUUID: string,
  score?: number
}
```

**Response:**
```typescript
{
  success: "",
  careerProgress: {
    totalChallenges: number,
    completedChallenges: number
  },
  reward?: {
    points: number,
    achievement: string
  }
}
```

### create-career-chat.ts
**Purpose:** Initialize new career quest chat conversation

**Function:**
```typescript
async function createCareerChat(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Extract userId and careerId
2. Create new chat conversation record
3. Initialize with career context
4. Return chat ID and initial message

**Request:**
```typescript
{
  careerUUID: string
}
```

**Response:**
```typescript
{
  careerChatId: string,
  careerUUID: string,
  initialMessage: string
}
```

### delete-career-chat.ts
**Purpose:** Delete career chat conversation and history

**Function:**
```typescript
async function deleteCareerChat(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Extract careerChatId from params
2. Verify user owns chat
3. Delete all messages in conversation
4. Delete conversation record
5. Return success

### retrieve-career-chat-history.ts
**Purpose:** Get message history for career chat

**Function:**
```typescript
async function retrieveCareerChatHistory(req: Request, res: Response): Promise<void>
```

**Response:**
```typescript
[
  {
    role: "user" | "assistant",
    content: string,
    timestamp: Date
  }
]
```

## Career Quest Architecture

### Career Structure
```typescript
{
  careerUUID: string,
  careerName: string,           // e.g., "Line Following"
  description: string,          // Career overview
  order: number,                // Display order
  challenges: Challenge[],      // Associated challenges
  totalChallenges: number
}
```

### Challenge Structure
```typescript
{
  challengeUUID: string,
  challengeName: string,
  careerUUID: string,
  description: string,
  difficulty: "easy" | "medium" | "hard",
  solutionCode: string,         // Reference solution
  isDefiniteSolution: boolean,  // Direct comparison vs LLM eval
  hints: string[],
  order: number
}
```

### User Progress Tracking
```typescript
{
  userId: string,
  challengeId: string,
  status: "not_started" | "in_progress" | "completed",
  attempts: number,
  bestScore?: number,
  dateCompleted?: Date,
  linkedSandboxProjectId?: string
}
```

## Progression System

### Career Completion
- Automatic when all challenges complete
- Triggers achievement notification
- May unlock additional careers

### Challenge Scoring
- Based on code correctness
- May include time-based bonus
- Difficulty multiplier applied

### Achievement System
- Career completed = badge/reward
- Milestone notifications
- Progress visualization

## Chat Integration

### Career Chat Context
```typescript
// System prompt positions AI as career guide
- Career-specific information
- Challenge hints without spoilers
- Encouragement and motivation
- Career relevance explanation
```

### Message Flow
```typescript
1. User clicks "Ask Guide" in career
2. User types question
3. POST /api/career-quest/chat with message
4. LLM context built with career info
5. AI responds with career-relevant help
6. Message saved to history
7. Response streamed to UI
```

## Database Operations

### Read
- `getCareerProgress(userId)` - User's overall progress
- `getCareerDetails(careerUUID)` - Career information
- `getChallengeDetails(challengeUUID)` - Challenge information
- `getChallengeAttempts(userId, challengeId)` - User's attempts
- Chat history retrieval

### Write
- `markChallengeAsViewed(userId, challengeId)` - Track viewing
- `recordChallengeAttempt(userId, challengeId, data)` - Attempt tracking
- `markChallengeComplete(userId, challengeId)` - Completion marker
- `createCareerChat(userId, careerId)` - New conversation
- Chat message persistence

## Real-time Communication

### Achievement Notifications
- Broadcast when career completed
- Broadcast when milestone reached
- Used for leaderboard updates

### Progress Updates
- May emit challenge completion
- Real-time progress tracking
- Live achievement notifications

## Error Handling

### Common Errors
```typescript
// Career/challenge not found
404: { error: "Career/Challenge not found" }

// Already completed
400: { error: "Challenge already completed" }

// Not authorized
403: { error: "Not authorized to access this content" }

// Invalid progress
400: { error: "Invalid progression attempt" }

// Server error
500: { error: "Internal Server Error: ..." }
```

## Integration Patterns

### Career Progression Flow
Select career → View challenges → Work on solution → Submit code → LLM evaluation → Mark complete → Progress updated → Next challenge

### Learning Path
Career intro → First challenge → Hint/chat support → Code submission → Evaluation/feedback → Progress update → Next challenge

### Chat Support
User stuck → Click "Get Help" → AI responds with guidance → Save history → Reference while solving

## Performance Considerations

- **Query optimization** - Index on userId + careerId
- **Pagination** - For large challenge lists
- **Caching** - Career/challenge data relatively static
- **Message history** - Limit stored messages
- **Real-time broadcasts** - Batch achievement notifications

## Troubleshooting

**Progress not updating**: Verify database write, check completion logic, review conditions
**Chat context incorrect**: Verify career data fetched, challenge context built, review LLM builder
**Achievement not notifying**: Check broadcast logic, verify WebSocket, review conditions
**Career incomplete**: Check completion query, verify challenges marked complete

## Best Practices

- **Validate progression** - Don't allow challenge skip
- **Preserve history** - Keep attempt records
- **Real-time feedback** - Immediate achievement notification
- **Supportive AI** - Hints, not solutions
- **Progress visibility** - Show clear progress metrics
- **Save frequently** - Auto-save chat and progress

## Important Notes

- **Linear progression** - Challenges in order per career
- **Multiple attempts allowed** - Can retry challenges
- **Sandbox integration** - Link code projects to challenges
- **Chat persistence** - Full history available
- **Achievement tracking** - Career completion is milestone
- **Hints available** - Without spoiling solutions
- **Stateful progress** - Persisted across sessions

## Integration with Other Systems

### Database Layer
- Career and challenge definitions
- User progress tracking
- Chat history storage

### LLM Layer
- Career context building
- Challenge-specific guidance
- Code evaluation

### Chat System
- Career-aware AI assistant
- Message history management
- Context preservation

### Sandbox Integration
- Code submission tracking
- Project linking to challenges
- Code review by AI

### Real-time Layer
- Achievement notifications
- Progress broadcasts
- Live chat updates

### Middleware Layer
- Authentication required
- Career access control
- Challenge unlock verification
