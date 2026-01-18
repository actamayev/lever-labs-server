# src/controllers/student Directory - Claude Instructions

## Overview
This directory contains route handlers for student-specific functionality: classroom enrollment, hub connection, and class management.

## Key Files

### join-class.ts
**Purpose:** Enroll student in classroom using access code

**Function:**
```typescript
async function joinClass(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Extract studentId from authenticated request
2. Extract classCode from request body
3. Look up classroom by code
4. Verify classroom exists
5. Add student to enrollment
6. Return classroom details

**Request:**
```typescript
{
  classCode: string  // 6-char code from teacher
}
```

**Response:**
```typescript
{
  classId: string,
  className: string,
  teacherId: string,
  teacherName: string,
  success: ""
}
```

**Error Cases:**
```typescript
404: { error: "Classroom with this code not found" }
400: { error: "Already enrolled in this classroom" }
```

### join-hub.ts
**Purpose:** Connect student to real-time teaching hub

**Function:**
```typescript
async function joinHub(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Extract studentId from request
2. Extract hubId from body
3. Verify hub is active
4. Register student in hub
5. Initialize real-time connection
6. Return hub details

**Request:**
```typescript
{
  hubId: string
}
```

**Response:**
```typescript
{
  hubId: string,
  classId: string,
  status: "active",
  connectedStudents: number
}
```

### get-student-classes.ts
**Purpose:** Retrieve all classrooms student is enrolled in

**Function:**
```typescript
async function getStudentClasses(req: Request, res: Response): Promise<void>
```

**Response:**
```typescript
[
  {
    classId: string,
    className: string,
    teacherName: string,
    enrolledDate: Date,
    studentCount: number,
    isActive: boolean
  }
]
```

## Database Operations

### Read
- `getStudentClasses(studentId)` - All enrolled classrooms
- `getClassroomByCode(classCode)` - Lookup classroom
- `getHubDetails(hubId)` - Hub status

### Write
- `addStudentToClassroom(studentId, classId)` - Enroll
- `registerStudentInHub(studentId, hubId)` - Hub connection

## Error Handling

```typescript
// Code not found
404: { error: "Classroom with this code not found" }

// Already enrolled
400: { error: "Already enrolled in this classroom" }

// Hub not active
400: { error: "Hub is not currently active" }

// Server error
500: { error: "Internal Server Error: ..." }
```

## Best Practices

- **Verify enrollment** - Check not already in class
- **Atomic operations** - Join and register atomically
- **Real-time sync** - Notify teacher of new student
- **Error clarity** - Clear messages for each failure case

## Common Workflows

### Joining a Classroom
```typescript
1. Teacher provides 6-char class code
2. Student enters code in UI
3. POST /api/student/join-class with code
4. Server looks up classroom
5. Adds student to enrollment
6. Returns classroom info
7. UI navigates to classroom view
```

### Joining a Live Hub
```typescript
1. Teacher starts teaching session (hub)
2. Student sees hub available
3. POST /api/student/join-hub with hubId
4. Real-time connection established
5. Student can now see live scoreboard
6. Can participate in activities
```

## Real-time Communication

### WebSocket Events
- Enrollment notifications to teacher
- Hub connection status updates
- Scoreboard broadcasts

### Browser Socket Manager
- Tracks student connections
- Broadcasts real-time events
- Handles disconnections

## Integration Patterns

### Student Dashboard
```typescript
1. Student logs in
2. GET /api/student/classes
3. Shows all enrolled classrooms
4. Can select active hub to join
5. Can view classroom progress
```

### Classroom Flow
```typescript
1. Join with code → enrollment
2. Wait for teacher to start hub
3. Join hub when active
4. See live scoreboard
5. Participate in activities
```

## Important Notes

- **Class codes public** - Students don't need permission to join
- **One-time enrollment** - Per classroom
- **Hub temporary** - Session-based teaching
- **Real-time required** - WebSocket for hub participation
