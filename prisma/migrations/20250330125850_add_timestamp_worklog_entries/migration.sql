/*
  Warnings:

  - Added the required column `created_at` to the `work_log_entries` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_work_log_entries" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "time_spent_description" TEXT NOT NULL,
    "time_spent_seconds" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "worklog_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL,
    CONSTRAINT "work_log_entries_worklog_id_fkey" FOREIGN KEY ("worklog_id") REFERENCES "work_logs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_work_log_entries" ("description", "id", "time_spent_description", "time_spent_seconds", "worklog_id") SELECT "description", "id", "time_spent_description", "time_spent_seconds", "worklog_id" FROM "work_log_entries";
DROP TABLE "work_log_entries";
ALTER TABLE "new_work_log_entries" RENAME TO "work_log_entries";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
