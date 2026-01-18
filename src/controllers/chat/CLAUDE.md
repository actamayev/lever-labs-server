# src/controllers/chat Directory - Claude Instructions

## Overview
Route handlers for AI-powered chat across different contexts: sandbox code assistance, career quest guidance, and code evaluation.

## Key Controllers

### check-challenge-code.ts
Evaluate student code submission against challenge requirements.
```typescript
async function checkChallengeCode(req, res)
export async function evaluateCodeWithScore(challengeUUID, chatData)
```

**Workflow**: Extract code → Evaluate (definite or LLM) → Get feedback → Save to DB → Return result

**Two evaluation paths**:
- **Definite solutions**: Direct string comparison after normalization
- **Complex solutions**: Use LLM evaluation with scoring (0-1)

**Response**: `{ isCorrect: boolean, feedback: string }`

### sandbox-message-chat.ts
AI chat for sandbox code editor assistance.
**Workflow**: Build LLM context (code, history) → Stream response → Save message

### career-quest-message-chat.ts
AI chat for career quest challenges.
**Workflow**: Build career context → Stream response → Save to DB

### delete-career-chat.ts
Delete entire career chat conversation and messages.

### delete-challenge-chat.ts
Delete entire challenge chat conversation.

## Chat Architecture

**Message Types**: Sandbox chat (code), Career chat (guidance), Challenge chat (help), Check code (evaluation)
**Message History**: Per conversation, includes user + AI responses, recent history loaded for context
**Response Streaming**: OpenAI streaming enabled, chunks sent real-time to client

## Code Evaluation System

**Path 1: Definite Solutions**
```typescript
if (challengeData.isDefiniteSolution) {
  const norm1 = normalize(solution)
  const norm2 = normalize(userCode)
  isCorrect = norm1 === norm2
  score = isCorrect ? 1.0 : 0.0
}
```

**Path 2: Complex Solutions** (LLM evaluation)
```typescript
const response = await openai.chat.completions.create({
  model: selectModel("checkCode"),
  messages: buildCheckCodeLLMContext(...),
  response_format: JSON schema
})
// result: { isCorrect: boolean, score: 0-1 }
```

## LLM Integration

**Context Builders**: Located in `src/utils/llm/`
- buildSandboxLLMContext: Code, recent history, mentor role
- buildCareerChatLLMContext: Career data, challenge context
- buildCheckCodeLLMContext: Challenge requirements, user code
- buildHintLLMContext: Guidance without spoiling

**System Prompts**: Define AI role (mentor, guide, evaluator, tutor)

**Model Selection**: selectModel() returns model for interaction type

## Database Operations

**Read**: Find challenge data, fetch message history
**Write**: Save messages, record code submissions, save evaluations

## Error Handling

- **Invalid code**: 400 "Invalid code submission"
- **Challenge not found**: 404 "Challenge not found"
- **LLM unavailable**: 503 "AI service temporarily unavailable"
- **Server error**: 500

## Integration Patterns

**Sandbox Chat Flow**: User types → buildSandboxLLMContext → OpenAI streams → Save message → UI updates

**Code Check Flow**: User submits → Evaluate (direct or LLM) → Get feedback → Save attempt → Return result

**Career Chat Flow**: User asks → buildCareerChatLLMContext → Stream response → Save history

## Best Practices

- **Stream for responsiveness** - Don't buffer entire response
- **Validate inputs** - Sanitize user messages
- **Preserve context** - Include recent history for coherence
- **Handle network failures** - Implement retry logic
- **Cost optimization** - Limit context window (last 30 messages)
- **Audit logging** - Track code submissions

## Real-time Features

- **Streaming responses**: Real-time output chunks
- **Status updates**: Connection, processing, completion
- **Error notifications**: Service issues

## Performance Considerations

- **Message history limits**: Last 30 messages (cost/performance tradeoff)
- **Context window**: Keep total tokens under API limits
- **Streaming chunks**: Reasonable buffer size
- **Database indexing**: Fast retrieval of recent messages
- **Cache**: Similar submissions may use cache

## Troubleshooting

**Chat slow**: Check OpenAI status, verify API key, check network latency
**Code evaluation always incorrect**: Review normalization, test with known examples
**Stream disconnects**: Check timeouts, verify network stability
**Messages not saved**: Check database write operations, verify disk space

## Important Notes

- **Stateless requests**: Each includes full context
- **Message history optional**: System works without prior messages
- **LLM accuracy varies**: Evaluation may not be perfect
- **Stream integrity**: Partial responses on disconnection
- **User privacy**: Store messages securely
- **Timeout handling**: Set reasonable timeouts

## Integration Points

- **Database**: Message persistence, challenge data, submission tracking
- **LLM**: OpenAI API integration, context building
- **Real-time**: WebSocket integration if streaming to client
- **Types**: Strong typing of messages, code submissions
- **Middleware**: Authentication, project/challenge ownership verification
