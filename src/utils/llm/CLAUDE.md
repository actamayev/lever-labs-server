# src/utils/llm Directory - Claude Instructions

## Overview
Utilities for building LLM context and prompts. Prepares conversation data, system prompts, and message histories for OpenAI/Grok API calls.

## LLM Integration Flow

User message → Extract context (career/challenge/code/history) → Build LLM context with system prompt → Send to API → Stream response via Socket.IO → Store in database

## Key Files

### model-selector.ts
Selects which AI model to use based on interaction type.
```typescript
selectModel(interactionType: string): string
// Currently returns: "x-ai/grok-code-fast-1" for all types
```

Used for: checkCode, hint, generalQuestion, default

Extensible for different models per interaction type.

### find-challenge-data-from-uuid.ts
Looks up challenge details from UUID.
```typescript
findChallengeDataFromUuid(challengeUUID)
// Returns: { id, name, description, successCriteria, ... }
```

### build-sandbox-llm-context.ts
Builds LLM message context for sandbox programming help.
```typescript
buildSandboxLLMContext(
  conversationHistory: Message[],
  currentCode: string,
  userMessage: string
): SimpleMessageData[]
```

**Output format**:
```typescript
[
  { role: "system", content: "You are a C++ mentor..." },
  { role: "user", content: "..user's previous message.." },
  { role: "assistant", content: "...my response..." },
  { role: "user", content: "New user message" }
]
```

### career-quest/ Subdirectory

**build-career-chat-llm-context.ts**: Career guidance context
```typescript
buildCareerChatLLMContext(careerData, history, userMessage)
// System prompt: Career guide role, career context, educational focus
```

**build-challenge-llm-context.ts**: Challenge-specific context
```typescript
buildChallengeLLMContext(challengeData, history, userMessage)
// Challenge description, difficulty, expectations
```

**build-check-code-llm-context.ts**: Code evaluation context
```typescript
buildCheckCodeLLMContext(challengeData, userCode)
// System: Evaluate code against requirements
// Returns structured JSON response format
```

**build-hint-request-llm-context.ts**: Hint-giving context
```typescript
buildHintRequestLLMContext(challengeData, userCode, history)
// System: Provide helpful hints without spoiling solution
```

## System Prompts

Each context builder includes a system prompt that defines the AI's role:

- **Sandbox**: "You are an experienced C++ mentor..."
- **Career**: "You are a career counselor..."
- **Challenge**: "You are a challenge tutor..."
- **Code check**: "Evaluate this code submission..."
- **Hints**: "Provide helpful hints without revealing the answer..."

## Message Structure

```typescript
interface Message {
  role: "system" | "user" | "assistant"
  content: string
}
```

**System**: AI instructions and context
**User**: Student questions/submissions
**Assistant**: AI responses

## Context Building Strategy

1. **System prompt** - Role definition + context
2. **Recent history** - Last 30 messages for coherence
3. **Current code** - If applicable (sandbox, challenges)
4. **User message** - New input to respond to
5. **Constraints** - Success criteria, hints available

## Cost Optimization

- **Limit history** - Only last 30 messages (token efficiency)
- **Compress code** - Remove extra whitespace
- **Structured prompts** - Clear instructions = faster responses
- **Reuse contexts** - Cache similar queries if possible

## Integration with Controllers

**Sandbox chat**:
```typescript
const context = buildSandboxLLMContext(history, code, message)
const response = await openai.chat.completions.create({
  model: selectModel("generalQuestion"),
  messages: context,
  stream: true
})
```

**Career chat**:
```typescript
const context = buildCareerChatLLMContext(career, history, message)
const response = await openai.chat.completions.create({
  model: selectModel("hint"),
  messages: context
})
```

**Code checking**:
```typescript
const context = buildCheckCodeLLMContext(challenge, userCode)
const response = await openai.chat.completions.create({
  model: selectModel("checkCode"),
  messages: context,
  response_format: checkCodeResponseFormat  // JSON schema
})
```

## Response Formats

**Streaming**: For chat interactions, stream chunks to client
**JSON**: For code evaluation, return structured object
**Text**: For hints and guidance

## Best Practices

- **Include context** - More context = better responses
- **Use structured prompts** - Clear instructions
- **Limit token usage** - Truncate old history
- **Cache prompts** - Reuse system prompts
- **Handle timeouts** - Set reasonable OpenAI timeout
- **Log interactions** - Track for debugging

## Performance Notes

- **Context size** - Typical 1-3K tokens per interaction
- **API latency** - Expect 1-5 seconds for responses
- **Streaming** - Faster perceived performance
- **Caching** - Similar prompts use cached responses

## Important Notes

- **Model selection** - Currently unified, easily extended
- **System prompts** - Define AI behavior clearly
- **History limit** - Prevents token explosion
- **Cost tracking** - Monitor API usage
- **Fallback** - Have default behavior if API fails

## Integration Points

- **Controllers**: Import and use context builders
- **OpenAI Client**: Sends context, receives responses
- **Database**: Store messages and responses
- **WebSocket**: Stream responses to client
- **Types**: Strong typing of context objects
