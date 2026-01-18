# src/prisma Directory - Claude Instructions

## Overview
This directory contains database seeding scripts and utilities for populating reference data in the PostgreSQL database. Seed data includes careers, challenges, activities, and other educational content used throughout the platform.

## Files

### seed.ts
The main seeding script that populates all reference data into the database.

**Key Functions:**
- `seedCareers()` - Loads career definitions from CSV
- `seedChallenges()` - Loads challenge definitions linked to careers
- `seedActivities()` - Loads educational activity content
- `seedReadingSections()` - Loads reading material for learning modules
- `seedGarage()` - Loads garage/equipment reference data
- `seedResetDatabase()` - Clears all reference data (use with caution)

**Seeding Pattern:**
- Reads CSV data from `src/db-seed-data/[table].csv`
- Uses `deleteOrphanedRecords()` to clean up records not in current seed data
- Uses Prisma `upsert` to create or update records
- Validates required fields before seeding
- Executes operations in parallel where safe

**Error Handling:**
- Validates all required fields are present
- Throws descriptive errors for invalid data
- Orphaned record deletion prevents database drift

### delete-orphaned-records.ts
Utility for cleaning up records that no longer exist in seed data.

**Purpose:**
- Prevents database pollution when reference data changes
- Deletes records that were in DB but not in new seed data
- Maintains referential integrity by respecting foreign keys
- Safe deletion: respects database constraints

**Usage:**
- Called before each seed function
- Takes three parameters:
  1. Prisma model (e.g., `prismaClient.career`)
  2. Array of new seed data
  3. Primary key field name
  4. Feature name (for logging)

## Data Files (src/db-seed-data/)

Seed data lives in CSV and JSON files:
- `career.csv` - Career quest definitions
- `challenge.csv` - Coding challenges linked to careers
- `activity.csv` - Educational activities
- `reading_sections.csv` - Reading material
- `garage.csv` - Equipment/garage reference data

**CSV Format:**
- Headers in first row
- One record per line
- Parsed by `src/utils/parse-csv.ts`

**CSV Field Requirements:**
- Each table has required fields (IDs, names, etc.)
- Validated in seed functions before upserting
- Invalid records throw descriptive errors

## Seeding Workflows

### Local Development Seeding

**First Time Setup:**
```bash
cd /Users/arieltamayev/Documents/Lever-Labs/lever-labs-server
mv .env.local .env
npx prisma migrate dev    # Run migrations and seed
mv .env .env.local
```

**Reseed After Data Changes:**
```bash
npx prisma db seed
```

**Interactive Seeding:**
```bash
npx prisma studio       # Browse and edit data directly
```

### Production Seeding

For cloud/production environments:
```bash
pnpm run cloud-seed
```

This is more selective and careful about what gets seeded in production.

## Adding New Seed Data

### To Seed a New Table:

1. **Create CSV file** in `src/db-seed-data/[table].csv`
   - Include headers matching Prisma schema fields
   - Add data rows

2. **Create seed function** in `seed.ts`
   ```typescript
   async function seedNewTable(): Promise<void> {
     const prismaClient = await PrismaClientClass.getPrismaClient()
     const data = parseCSV("../db-seed-data/new-table.csv") as NewTableData[]

     await deleteOrphanedRecords(prismaClient.newTable, data, "id", "new-table")

     await Promise.all(data.map(record => {
       if (!record.requiredField) {
         throw new Error(`Invalid data: ${JSON.stringify(record)}`)
       }
       return prismaClient.newTable.upsert({
         where: { id: record.id },
         update: { /* fields */ },
         create: { /* fields */ }
       })
     }))
   }
   ```

3. **Add type definition** in `src/types/seed-data.ts`
   ```typescript
   export interface NewTableData {
     id: string
     // ... other fields
   }
   ```

4. **Call function** in main seeding block at bottom of `seed.ts`

5. **Test locally**:
   ```bash
   npx prisma db seed
   ```

## Important Patterns

### Validation
Every seed function validates required fields before inserting:
```typescript
if (!record.id || !record.name) {
  throw new Error(`Invalid record: ${JSON.stringify(record)}`)
}
```

### Upsert Pattern
Uses `upsert` to allow re-running seed safely:
```typescript
prismaClient.table.upsert({
  where: { id: record.id },
  update: { /* updatable fields */ },
  create: { /* all fields */ }
})
```

### Parallel Execution
Uses `Promise.all()` for independent operations:
```typescript
await Promise.all(records.map(r => prismaClient.table.upsert(...)))
```

### Orphan Cleanup
Always call before upserting to clean old data:
```typescript
await deleteOrphanedRecords(prismaClient.table, records, "id", "table-name")
```

## Type Definitions

All seed data structures are typed in `src/types/seed-data.ts`:
- `CareerData` - Career seed structure
- `ChallengeData` - Challenge seed structure
- `ActivityData` - Activity seed structure
- `ReadingSectionData` - Reading section structure
- `GarageData` - Garage item structure

Update these types when adding new seed tables.

## Troubleshooting

**"Cannot find module" when seeding**
- Ensure `.env` is properly configured with DATABASE_URL
- Check you're in correct directory: `/src/prisma/`
- Verify CSV files exist in `src/db-seed-data/`

**Foreign key constraint violations**
- Check data references valid parent records
- Ensure seed order respects dependencies (seed parents before children)
- Verify Prisma relationships match CSV data structure

**Seed takes too long or hangs**
- Check database connection is active
- Verify no migrations are running concurrently
- Review `Promise.all()` batch sizes for very large datasets

**Orphaned records not deleting**
- Check for foreign key constraints preventing deletion
- Verify primary key field name matches actual column
- Review `delete-orphaned-records.ts` for deletion logic

## Best Practices

- **Keep CSV files clean** - No extraneous whitespace or invalid UTF-8
- **Validate before seeding** - Run `npx prisma db seed` locally first
- **Document new tables** - Add to this file when adding new seed tables
- **Test data consistency** - Verify relationships between entities are intact
- **Version control seed data** - CSV changes should be committed with schema changes
- **Run migrations before seeding** - Ensure schema exists before populating
- **Restart after seed changes** - Application may cache old data

## Important Notes

- **Never delete seed data files** without removing corresponding seed function
- **Environment file switching** - Must rename `.env.local` ↔ `.env` for migrations
- **Seeding is idempotent** - Safe to run multiple times due to upsert pattern
- **Production seeding** is more selective - use `pnpm run cloud-seed` for cloud
- **CSV encoding** - Must be UTF-8 for special characters to parse correctly
- **Backup before reset** - `seedResetDatabase()` is destructive
