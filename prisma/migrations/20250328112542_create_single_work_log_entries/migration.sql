-- CreateTable
CREATE TABLE "single_work_log_entries" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "project" TEXT,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME,
    "description" TEXT
);
