# src/db-seed-data Directory - Claude Instructions

## Overview
Seed data files (CSV, JSON) for initializing database with reference content: careers, challenges, questions, activities, coding blocks.

## File Types

**CSV Files**: Tabular data imported into database
**JSON Files**: Complex nested structures (blocks, mappings)

## Key Files

### career.csv
Educational careers (robot-themed activities).
**Columns**: career_id, name, description, order
**Rows**: 12 careers (Meet Pip, Line Following, Maze Navigation, etc.)

### challenge.csv
Individual challenges linked to careers.
**Columns**: challenge_id, career_id, name, description, difficulty, order
**Links**: career_id references career table

### coding_block.json
Blockly block definitions with C++ code generation.
**Structure**:
```json
{
  "blocks": [
    {
      "name": "moveForward",
      "category": "motion",
      "code": "pip.moveForward(100);"
    }
  ]
}
```

### question.csv
Assessment questions across platform.
**Columns**: question_id, text, difficulty, topic
**Used by**: Lessons, challenges

### lesson_question_map.csv
Joins lessons to questions.
**Columns**: lesson_id, question_id, order
**Purpose**: Link questions to lessons

### answer_choice_*.csv
Multiple choice answer options.
**Columns**: choice_id, question_id, text, is_correct
**Structure**: One file or multiple per topic

### activity.csv
Learning activities/exercises.
**Columns**: activity_id, name, description, difficulty, category

### reading_section.csv
Content sections for lessons.
**Columns**: section_id, lesson_id, title, content, order

## Seed Data Management

### Seeding Process
Located in `src/prisma/seed.ts`:
```typescript
seedCareers()
seedChallenges()
seedActivities()
seedQuestions()
// etc - all run during migration
```

### Upsert Strategy
```typescript
// Update if exists, insert if new
await db.career.upsert({
  where: { career_id: careerId },
  update: { ...data },
  create: { ...data }
})
```

### Orphaned Record Cleanup
`delete-orphaned-records.ts` removes records not in seed data.
**Example**: Delete questions not in question.csv

## Data Format

### CSV Format
- Header row with column names
- UTF-8 encoding
- No quotes unless containing commas
- Newline-delimited rows

### JSON Format
- Valid JSON syntax
- Nested objects/arrays
- UTF-8 encoding
- Properly formatted (indentation optional)

## Common Patterns

### Career → Challenge Relationship
```
career.csv (id, name)
  ↓
challenge.csv (career_id, challenge_name)
```

### Question → Lesson Relationship
```
question.csv (id, text)
  ↓
lesson_question_map.csv (lesson_id, question_id)
```

### Answer Choices
```
question.csv (id)
  ↓
answer_choice_*.csv (question_id, text, is_correct)
```

## Data Initialization

**Development**: `npx prisma db seed`
**Production**: `npm run cloud-seed` (with cloud database)
**Manual**: Edit CSV/JSON → Re-run seed

## Workflow

### Adding New Content
1. Add row/entry to appropriate file
2. Run `npx prisma db seed`
3. Migrations auto-populate database
4. Test in application

### Updating Existing Content
1. Edit CSV/JSON row
2. Run `npx prisma db seed`
3. Upsert logic handles updates
4. Orphaned records cleaned up

### Removing Content
1. Remove row from file
2. Run `npx prisma db seed`
3. Orphaned record cleanup removes from DB

## Best Practices

- **Organize by feature** - Separate files for careers, questions, etc
- **Clear naming** - File names reflect content
- **Ordered rows** - Use order column for sequencing
- **Reference integrity** - Foreign keys properly linked
- **Validate before seed** - Check CSV syntax
- **Document schema** - Comment on column purposes

## Common Issues

**"Foreign key constraint failed"**: Parent record doesn't exist
**"Duplicate key value"**: Seed data has duplicate IDs
**"Column not found"**: CSV header mismatch with database schema
**"Orphaned records deleted"**: Removed from CSV, then cleaned by seed

## Database Schema Alignment

**Seed files must match**: `prisma/schema.prisma`
- Column names match database fields
- Data types consistent
- Foreign key references valid
- Constraints honored (unique, not null)

## Seed Data Size

- Careers: ~12 entries
- Challenges: ~60+ entries
- Questions: ~200+ entries
- Blocks: ~50-100 definitions
- Manageable for local development

## Performance Notes

- **Seed time**: Usually < 30 seconds for full seed
- **Upsert performance**: Efficient for updates
- **Cleanup performance**: Depends on orphaned record count
- **Database indexing**: On ID fields for fast lookups

## Important Notes

- **Reference data** - Used for system functionality
- **Persistent** - Survives user data deletion
- **Version controlled** - CSV/JSON files in git
- **Environment agnostic** - Same seed for dev/staging/prod
- **Reset capability** - Re-seed to restore data

## Integration Points

- **Prisma**: Handles import/parsing
- **Database**: Tables populated via migrations
- **Application**: Uses seeded data as reference
- **Tests**: May use subset of seed data

## Related Files

- `src/prisma/seed.ts`: Seeding logic
- `src/prisma/delete-orphaned-records.ts`: Cleanup
- `prisma/schema.prisma`: Database schema
- Migration files: Version control
