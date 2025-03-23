-- CreateTable
CREATE TABLE "work_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "project" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "work_log_entries" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "time_spent_description" TEXT NOT NULL,
    "time_spent_seconds" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "worklog_id" INTEGER NOT NULL,
    CONSTRAINT "work_log_entries_worklog_id_fkey" FOREIGN KEY ("worklog_id") REFERENCES "work_logs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
