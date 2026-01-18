# src/controllers/teacher Directory - Claude Instructions

## Overview
Route handlers for teacher classroom management: creation, enrollment, hub coordination, and real-time scoreboard management.

## Key Controllers

### create-classroom.ts
**Purpose**: Create new classroom with unique access code
**Workflow**: Extract name → Generate code → Retry until unique → Return code
**Response**: `{ classCode: string }`

### add-student-to-classroom.ts
**Purpose**: Enroll student using access code
**Workflow**: Lookup code → Verify classroom → Add student → Return classroom details

### create-hub.ts
**Purpose**: Initialize real-time teaching hub for classroom
**Workflow**: Verify teacher owns class → Create hub record → Initialize real-time coordination → Return hub details

### add-student-to-scoreboard.ts
**Purpose**: Update student score during class
**Workflow**: Verify student in teacher's class → Add/update score → Broadcast to hub → Return success

### retrieve-classroom-students.ts
**Purpose**: Get list of enrolled students
**Response**: Array of student objects with enrollment data

## Classroom Structure

**Classroom**: { id, name, teacherId, accessCode (6-char unique), createdAt, students[] }
**Hubs**: Real-time sessions during teaching, coordinates browser+device connections, temporary

## Workflow

**Classroom Creation**:
Generate 6-char alphanumeric code → Check uniqueness → Create record → Share code with students

**Student Enrollment**:
Student enters code → Lookup classroom → Add to enrollment → Return details

**Teaching Session**:
Teacher starts hub → Hub initialized → Students connect → Real-time coordination begins

**Scoreboard Updates**:
Score submitted → ScoreboardManager broadcasts → All connected clients see live update

## Database Operations

**Read**: Find classroom, get students, lookup by code, verify teacher ownership
**Write**: Create classroom, add student enrollment, create hub, update scores

## Real-time Communication

**Hub Manager**: Coordinates real-time connections, tracks active sessions
**Scoreboard Manager**: Real-time score broadcasting
**WebSocket Events**: Enrollment notifications, score updates, hub creation/deletion

## Permission System

**Teacher Authorization**: All endpoints verify user owns resource
```typescript
const classroom = await findClassroom(classId)
if (classroom.teacherId !== teacherId) {
  return 403: { error: "Not authorized" }
}
```

**Student Enrollment**: Public code-based (no permission check)

## Error Handling

- **Not authorized**: 403 "Not authorized to manage this classroom"
- **Classroom not found**: 404 "Classroom not found"
- **Invalid access code**: 400 "Invalid classroom code"
- **Student already enrolled**: 400 "Student already in classroom"
- **Hub already active**: 400 "Hub already active for this classroom"
- **Server error**: 500

## Integration Patterns

**Classroom Lifecycle**:
Create class → Generate code → Share code → Students join → Teacher starts hub → Hub active → Scoreboard updates → Hub closed

**Real-time Coordination**:
Hub Manager initializes → Students connect → Synchronized state maintained → Scores broadcast

## Best Practices

- **Always verify ownership** - Don't trust client on classroom ID
- **Atomic operations** - Create classroom + code together
- **Unique codes** - Retry until unique, don't reuse
- **Real-time broadcasts** - Keep all connected clients in sync
- **Graceful disconnection** - Clean up hub when teacher leaves
- **Audit logging** - Track classroom actions
- **Batch operations** - Efficient multiple student additions

## Common Workflows

**Setting up class**: Teacher enters name → Clicks "Create" → Receives 6-char code → Shares with students

**Running lesson**: Students join class → Teacher clicks "Start Session" → Hub created → Real-time begins → Teachers updates scores as students progress

**Managing students**: View enrolled students → Can remove → Can reset progress → Can export data

## Performance

- **Code uniqueness**: Index access_code for fast lookup
- **Student lists**: Paginate if classroom large
- **Real-time**: Batch score updates if many students
- **Hub memory**: Clean up inactive hubs
- **Connections**: Database connection pooling

## Troubleshooting

**Duplicate codes**: Check uniqueness constraint in DB, verify code generation logic
**Can't join class**: Verify code exists, check enrollment write succeeds
**Scores not broadcasting**: Verify WebSocket connection, check ScoreboardManager emitting
**Can't create hub**: Verify teacher ID matches classroom owner, check hub creation logic

## Important Notes

- **Access codes public** - Share freely with students
- **One-time use** - New code per classroom
- **Persistent enrollment** - Student stays until removed
- **Session-based teaching** - Hubs are temporary
- **Real-time required** - WebSocket needed for live updates
- **Teacher authority** - Complete control over classroom
- **No student isolation** - All enrolled students see same content

## Integration Points

- **Database**: Classroom persistence, enrollment tracking, hub management
- **Real-time**: HubManager, ScoreboardManager, BrowserSocketManager
- **Authentication**: Teacher role verification
- **Device Layer**: May coordinate with ESP32 devices
- **Types**: Strong typing of classroom objects
- **Middleware**: Auth required, teacher role, classroom ownership
