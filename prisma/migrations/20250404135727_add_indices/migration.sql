-- CreateIndex
CREATE INDEX "activity__activity_uuid_idx" ON "activity"("activity_uuid");

-- CreateIndex
CREATE INDEX "pip_uuid__uuid_idx" ON "pip_uuid"("uuid");

-- CreateIndex
CREATE INDEX "sandbox_project__project_uuid_idx" ON "sandbox_project"("project_uuid");
