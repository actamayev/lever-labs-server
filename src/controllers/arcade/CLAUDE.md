# src/controllers/arcade Directory - Claude Instructions

## Overview
This directory contains route handlers for arcade/game mode endpoints. These controllers manage high score submission, score retrieval, and leaderboard updates.

## Key Files

### add-arcade-score.ts
**Purpose:** Submit a new arcade game score

**Function:**
```typescript
async function addArcadeScoreController(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Extract userId from authenticated request
2. Extract arcadeGameName and score from request body
3. Query database for user's current highest score
4. Add new score to database
5. If new high score, emit real-time update to leaderboard watchers
6. Return success response

**Request:**
```typescript
{
  arcadeGameName: "race" | "puzzle" | "challenge",
  score: number
}
```

**Response:**
```typescript
{
  success: ""
}
```

**Key Logic:**
- Only broadcasts score update if it's a new personal high score (optimization)
- Uses BrowserSocketManager for real-time leaderboard updates
- Retrieves username for broadcast

### retrieve-all-arcade-scores.ts
**Purpose:** Get all arcade game scores for a user or global leaderboard

**Function:**
```typescript
async function retrieveAllArcadeScores(req: Request, res: Response): Promise<void>
```

**Usage:**
- Fetch user's complete game history
- Build personal stats dashboard
- Populate global leaderboards

## Controller Patterns

### Authentication Flow
All arcade endpoints require:
1. JWT authentication via `jwtVerifyAttachUser` middleware
2. User ID extraction from `req.user` or `req.userId`

### Response Format
Controllers follow standard pattern:
```typescript
// Success
res.status(200).json({ /* data */ satisfies TypeResponse })

// Error
res.status(500).json({ error: "message" satisfies ErrorResponse })
```

### Database Operations
- Uses dedicated functions in `src/db-operations/`
- Write operations: `db-operations/write/arcade-score/`
- Read operations: `db-operations/read/arcade-score/`

### Real-time Updates
- BrowserSocketManager broadcasts high score events
- Emits to all connected clients for leaderboard display
- Only emits on new personal high scores (avoids spam)

## Integration Patterns

### Score Submission Flow
```typescript
// 1. Route receives POST /api/arcade/score
// 2. Middleware validates score data
// 3. Controller in this file processes submission
// 4. Database operation records score
// 5. If high score, broadcast update via WebSocket
// 6. Return success to client
```

### Leaderboard Updates
```typescript
// Real-time broadcast to all users
BrowserSocketManager.getInstance().emitArcadeScoreUpdate(
  score,
  username,
  userId,
  arcadeGameName
)
```

## Database Operations Used

### Read
- `retrieveUserHighestScore(userId, gameType)` - Get user's best score
- Part of validation before recording

### Write
- `addArcadeScore(userId, gameType, score)` - Insert/update score record

## Error Handling

**Common Errors:**
- User not authenticated: 401 (handled by middleware)
- Invalid score data: 400 (handled by validation middleware)
- Database error: 500 with descriptive message

**Error Response:**
```typescript
{
  error: "Internal Server Error: Unable to add arcade score"
}
```

## Real-time Communication

### WebSocket Events Emitted
- `arcadeScoreUpdate` - Broadcasts high score to leaderboard watchers
- Contains: score, username, userId, gameType

### Listeners
- Set up in route handlers via Socket.IO
- Broadcasts to all connected browser clients

## Best Practices

- **Validate before database writes** - Checks for high score status first
- **Minimize broadcasts** - Only emit for new personal records
- **Fetch necessary data** - Username lookup for broadcast
- **Use transactions** - Consider for simultaneous score updates
- **Log important events** - Score submissions for analytics

## Common Workflows

### Submitting a High Score
```typescript
1. User completes game in UI
2. POST /api/arcade/score with gameType and score
3. Controller receives authenticated request
4. Checks if score beats personal best
5. Records in database
6. Broadcasts to leaderboard if new high
7. Client receives success and updates UI
```

### Displaying Personal Scores
```typescript
1. GET /api/arcade/scores endpoint
2. Controller fetches all user game records
3. Returns formatted score history
4. UI displays personal stats
```

## Performance Considerations

- **Batch leaderboard updates** - Don't emit for every submission
- **Cache highest scores** - Reduce repeated database queries
- **Limit leaderboard size** - Only track top scores in memory

## Troubleshooting

**Score not appearing in leaderboard**
- Check user is authenticated
- Verify database write succeeded
- Check WebSocket connection to client
- Review BrowserSocketManager broadcast logic

**Multiple high score broadcasts**
- Check high score comparison logic
- Verify database write is atomic
- Ensure broadcast deduplication

**Leaderboard shows wrong rank**
- Verify rank calculation in read operations
- Check for concurrent score submissions
- Review database query logic

## Important Notes

- **Authentication required** - All endpoints protected by JWT middleware
- **Real-time optimization** - Only broadcast on personal high scores
- **User data privacy** - Only expose usernames for public leaderboards
- **Concurrent updates** - Handle multiple users scoring simultaneously
- **Persistence** - All scores recorded to database, not just high scores

## Integration with Other Systems

### Database Layer
- Coordinates with `db-operations/write/arcade-score/`
- Depends on score validation logic
- May query user profile for username

### Real-time Layer
- Uses BrowserSocketManager for broadcasting
- Connects to Socket.IO server
- Emits to subscribed leaderboard viewers

### Authentication Layer
- Depends on JWT verification middleware
- User context extracted from request
- Requires valid session
