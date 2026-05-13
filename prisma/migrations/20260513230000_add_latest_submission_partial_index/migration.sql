CREATE UNIQUE INDEX IF NOT EXISTS "submissions_latest_unique"
ON "submissions"("assignment_id", "user_id")
WHERE "is_latest" = true;