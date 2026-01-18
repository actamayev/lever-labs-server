# src/utils/arcade Directory - Claude Instructions

## Overview
This directory contains utilities for the arcade/game mode features. These functions handle game state conversion and game logic helpers.

## Key Files

### convert-arcade-game.ts
**Purpose:** Convert arcade game data between database and API formats

**Function:**
```typescript
function convertArcadeGame(dbGame: ArcadeGameDB): ArcadeGameAPI
```

**Transformation:**
```typescript
// Database format (snake_case)
{
  arcade_game_id: 123,
  user_id: 456,
  game_type: "race",
  high_score: 5000,
  last_played: "2024-01-01T00:00:00Z",
  created_at: "2023-12-01T00:00:00Z"
}

// API format (camelCase)
{
  arcadeGameId: 123,
  userId: 456,
  gameType: "race",
  highScore: 5000,
  lastPlayed: "2024-01-01T00:00:00Z",
  createdAt: "2023-12-01T00:00:00Z"
}
```

**Usage:**
```typescript
import convertArcadeGame from "../../utils/arcade/convert-arcade-game"

// Convert single game
const dbGame = await getArcadeGame(id)
const apiGame = convertArcadeGame(dbGame)
res.json(apiGame)

// Convert multiple games
const dbGames = await getUserArcadeGames(userId)
const apiGames = dbGames.map(convertArcadeGame)
res.json(apiGames)
```

## Arcade Game Concepts

### Game Types
```typescript
enum ArcadeGameType {
  RACE = "race",              // Speed optimization
  PUZZLE = "puzzle",          // Logic puzzles
  CHALLENGE = "challenge"     // Timed challenges
}
```

### Game State
```typescript
interface ArcadeGameState {
  gameId: string
  userId: string
  status: "playing" | "paused" | "complete" | "failed"
  score: number
  level: number
  elapsedTime: number
  startedAt: Date
}
```

### Score Tracking
```typescript
interface ScoreRecord {
  gameId: string
  userId: string
  score: number
  level: number
  time: number
  date: Date
  rank: number  // Overall ranking
}
```

## Game Logic Patterns

### Score Calculation
```typescript
function calculateScore(
  level: number,
  timeSeconds: number,
  difficulty: number
): number {
  // Higher level = more points
  const levelMultiplier = level * 100

  // Faster = bonus points
  const timeBonus = Math.max(0, 300 - timeSeconds) * 10

  // Difficulty adjustment
  const difficultyMultiplier = difficulty / 2

  return Math.floor(levelMultiplier * difficultyMultiplier + timeBonus)
}
```

### Leaderboard Calculation
```typescript
async function updateLeaderboard(userId: string, score: number) {
  // Get current rank
  const higherScores = await db.scores.count({
    where: { score: { gt: score } }
  })
  const rank = higherScores + 1

  // Update user's best score
  const existing = await db.scores.findOne({ userId })
  if (!existing || score > existing.score) {
    await db.scores.upsert({
      userId,
      score,
      rank
    })
  }

  return rank
}
```

## Game State Management

### Starting Game
```typescript
async function startArcadeGame(userId: string, gameType: string) {
  const gameState: ArcadeGameState = {
    gameId: generateId(),
    userId,
    status: "playing",
    score: 0,
    level: 1,
    elapsedTime: 0,
    startedAt: new Date()
  }

  // Store in cache for real-time updates
  cache.set(`game:${gameState.gameId}`, gameState)

  return gameState
}
```

### Updating Game State
```typescript
function updateGameState(
  gameState: ArcadeGameState,
  update: Partial<ArcadeGameState>
): ArcadeGameState {
  return {
    ...gameState,
    ...update,
    elapsedTime: Date.now() - gameState.startedAt.getTime()
  }
}
```

### Completing Game
```typescript
async function completeArcadeGame(gameId: string) {
  const gameState = cache.get(`game:${gameId}`)

  // Calculate final score
  const finalScore = calculateScore(
    gameState.level,
    gameState.elapsedTime / 1000,
    1
  )

  // Save to database
  await saveGameResult({
    userId: gameState.userId,
    gameType: gameState.gameType,
    score: finalScore,
    level: gameState.level,
    time: gameState.elapsedTime
  })

  // Update leaderboard
  const rank = await updateLeaderboard(gameState.userId, finalScore)

  return { finalScore, rank }
}
```

## Integration with Socket.IO

### Real-time Score Updates
```typescript
socket.on("gameUpdate", (data) => {
  const gameState = updateGameState(currentState, data)

  // Broadcast to leaderboard watchers
  io.emit("scoreUpdate", {
    userId: gameState.userId,
    score: gameState.score,
    timestamp: new Date()
  })
})
```

### Leaderboard Broadcast
```typescript
async function broadcastLeaderboard() {
  const top10 = await db.scores
    .find()
    .sort({ score: -1 })
    .limit(10)

  io.emit("leaderboard", top10.map(convertArcadeGame))
}
```

## Best Practices

- **Store game results** - For history and analysis
- **Track user progress** - Levels, scores, achievements
- **Update leaderboards** - Real-time or periodic
- **Handle timeouts** - Incomplete games
- **Save state** - Allow resume
- **Validate scores** - Prevent cheating
- **Log important events** - Game start, completion, errors

## Common Game Mechanics

### Scoring Rules
```
Base Score: 100 × Level
Time Bonus: (300 - seconds) × 10
Difficulty: Multiplier 0.5 - 2.0
Final: Base + Time × Difficulty
```

### Level Progression
```
Level 1: Basic mechanics
Level 2: Increased difficulty
Level 3: Speed requirement
Level 4: Complex patterns
Level 5+: Expert mode
```

## Troubleshooting

**Score not updating**
- Check game state is being saved
- Verify database connection
- Check score calculation logic
- Review WebSocket connection

**Leaderboard shows wrong ranks**
- Verify rank calculation
- Check for tied scores
- Review database queries
- Recalculate if needed

**Game state lost**
- Implement game state caching
- Use persistent storage
- Add checkpoint saves
- Log all changes

## Important Notes

- **Game state is ephemeral** - Lost on server restart
- **Scores are permanent** - Archive in database
- **Real-time updates** - Use WebSocket
- **Cheating prevention** - Validate on server
- **Performance critical** - Optimize calculations
