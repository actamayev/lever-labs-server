# src/utils/teacher Directory - Claude Instructions

## Overview
This directory contains utility functions for teacher-specific operations. These functions handle teacher data extraction and classroom management helpers.

## Key Files

### extract-teacher-data-from-user-data.ts
**Purpose:** Extract and format teacher-specific data from user records

**Function:**
```typescript
function extractTeacherData(user: User): TeacherData
```

**Transformation:**
```typescript
// User in database
{
  id: "user-123",
  email: "teacher@example.com",
  name: "Ms. Smith",
  role: "teacher",
  createdAt: "2023-01-01",
  classrooms: [
    { id: "class-1", name: "Robotics 101" },
    { id: "class-2", name: "Robotics 201" }
  ],
  students: 45,
  assignments: 12,
  // ... other fields
}

// Teacher data extracted
{
  id: "user-123",
  email: "teacher@example.com",
  name: "Ms. Smith",
  classrooms: [
    { id: "class-1", name: "Robotics 101" },
    { id: "class-2", name: "Robotics 201" }
  ],
  studentCount: 45,
  assignmentCount: 12
}
```

**Usage:**
```typescript
import extractTeacherData from "../../utils/teacher/extract-teacher-data-from-user-data"

const user = await findUserById(userId)
const teacherData = extractTeacherData(user)

res.json(teacherData)
```

### turn-off-student-pip.ts
**Purpose:** Stop a student's robot during class

**Function:**
```typescript
async function turnOffStudentPip(studentId: string, teacherId: string): Promise<void>
```

**Usage:**
```typescript
import turnOffStudentPip from "../../utils/teacher/turn-off-student-pip"

// Teacher stops a student's device
await turnOffStudentPip(studentId, teacherId)

// Student's robot stops and disconnects
```

**Logic:**
1. Verify student is in teacher's classroom
2. Find student's connected device
3. Send stop command
4. Terminate connection
5. Log event
6. Notify student

**Implementation:**
```typescript
async function turnOffStudentPip(studentId: string, teacherId: string) {
  // 1. Verify student in class
  const student = await findStudent(studentId)
  const classroom = await findClassroomForStudent(studentId)
  const isTeacher = classroom.teacherId === teacherId

  if (!isTeacher) {
    throw new Error("Not your student")
  }

  // 2. Find device
  const pipUUID = await getCurrentlyConnectedPipUUID(studentId)
  if (!pipUUID) {
    throw new Error("Student device not connected")
  }

  // 3. Send stop command
  await SendEsp32MessageManager.getInstance().stopDevice(pipUUID)

  // 4. Disconnect
  await esp32Manager.disconnectDevice(pipUUID, studentId)

  // 5. Log event
  await logEvent({
    type: "device_stopped",
    teacherId,
    studentId,
    pipUUID,
    timestamp: new Date()
  })

  // 6. Notify student
  const socket = browserSocketManager.getUserSocket(studentId)
  socket?.emit("deviceStoppedByTeacher")
}
```

## Teacher-Specific Operations

### Classroom Management
```typescript
async function createClassroom(teacher: User, name: string) {
  const classCode = generateClassroomCode()

  return await db.classrooms.create({
    name,
    teacherId: teacher.id,
    accessCode: classCode,
    createdAt: new Date()
  })
}
```

### Student Management
```typescript
async function addStudentToClassroom(classId: string, studentId: string) {
  // Verify student and class exist
  const classroom = await db.classrooms.findById(classId)
  const student = await db.users.findById(studentId)

  if (!classroom || !student) {
    throw new Error("Invalid classroom or student")
  }

  // Add to classroom
  return await db.classrooms.addStudent(classId, studentId)
}
```

### Assignment Management
```typescript
async function createAssignment(
  classId: string,
  assignment: AssignmentData
) {
  const classroom = await db.classrooms.findById(classId)
  const students = classroom.students

  return await Promise.all(
    students.map(student =>
      db.assignments.create({
        classroomId: classId,
        studentId: student.id,
        ...assignment
      })
    )
  )
}
```

### Progress Monitoring
```typescript
async function getClassroomProgress(classId: string) {
  const students = await db.classrooms.getStudents(classId)
  const progress = await Promise.all(
    students.map(student =>
      getStudentProgress(student.id)
    )
  )

  return {
    classId,
    studentCount: students.length,
    averageProgress: progress.reduce((a, b) => a + b) / progress.length,
    students: students.map((s, i) => ({
      name: s.name,
      progress: progress[i],
      lastActive: s.lastActive
    }))
  }
}
```

## Device Control in Classroom

### Emergency Stop
```typescript
async function emergencyStopAllDevices(classId: string, teacherId: string) {
  // Get all connected students in class
  const classroom = await findClassroom(classId)
  const students = classroom.students

  // Stop all devices
  await Promise.all(
    students.map(student =>
      turnOffStudentPip(student.id, teacherId).catch(e =>
        console.error(`Failed to stop ${student.id}:`, e)
      )
    )
  )

  // Log event
  await logEvent({
    type: "emergency_stop",
    classId,
    teacherId,
    timestamp: new Date()
  })
}
```

### Device Monitoring
```typescript
async function monitorClassroomDevices(classId: string) {
  const classroom = await findClassroom(classId)
  const devices = []

  for (const student of classroom.students) {
    const pipUUID = await getCurrentlyConnectedPipUUID(student.id)
    if (pipUUID) {
      const status = esp32Manager.getConnectionState(pipUUID)
      devices.push({
        studentName: student.name,
        pipUUID,
        status,
        lastSeen: esp32Manager.getLastHeartbeat(pipUUID)
      })
    }
  }

  return devices
}
```

## Permission Checking

### Verify Teacher Ownership
```typescript
async function verifyTeacherOwnsClassroom(
  teacherId: string,
  classId: string
): Promise<boolean> {
  const classroom = await db.classrooms.findById(classId)
  return classroom?.teacherId === teacherId
}
```

### Verify Student in Classroom
```typescript
async function verifyStudentInClassroom(
  studentId: string,
  classId: string
): Promise<boolean> {
  const enrollment = await db.classrooms.findEnrollment(classId, studentId)
  return !!enrollment
}
```

## Integration Patterns

### Teacher Dashboard
```typescript
async function getTeacherDashboard(teacherId: string) {
  const teacher = await findUserById(teacherId)
  const classrooms = await findTeacherClassrooms(teacherId)

  return {
    teacher: extractTeacherData(teacher),
    classrooms: await Promise.all(
      classrooms.map(classroom => ({
        id: classroom.id,
        name: classroom.name,
        studentCount: classroom.students.length,
        deviceCount: await countConnectedDevices(classroom.id),
        recentActivity: await getRecentActivity(classroom.id)
      }))
    )
  }
}
```

### Classroom Control Panel
```typescript
socket.on("teacherControl", async (action, data) => {
  switch (action) {
    case "stopDevice":
      await turnOffStudentPip(data.studentId, socket.userId)
      break
    case "sendMessage":
      await broadcastToClass(data.classId, data.message)
      break
    case "emergencyStop":
      await emergencyStopAllDevices(data.classId, socket.userId)
      break
  }
})
```

## Best Practices

- **Verify permissions** - Always check teacher owns resource
- **Log all actions** - Audit trail for device control
- **Handle errors gracefully** - Some devices may not respond
- **Notify students** - When teacher intervenes
- **Batch operations** - For efficiency
- **Real-time updates** - Use WebSocket
- **Emergency procedures** - Implement emergency stops
- **Respect privacy** - Don't monitor beyond necessary

## Important Notes

- **Teacher authority** - Can control student devices in class
- **Student notification** - Students should know when observed
- **Device responsiveness** - Not all devices may respond
- **Classroom context** - Operations limited to teacher's classes
- **Audit logging** - Track all teacher interventions
