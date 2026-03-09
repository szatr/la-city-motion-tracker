-- CreateTable
CREATE TABLE "Motion" (
    "id" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "dateReceived" TIMESTAMP(3),
    "councilFile" TEXT,
    "expiration" TIMESTAMP(3),
    "status" TEXT,
    "reportBackDue" TIMESTAMP(3),
    "statusDate" TIMESTAMP(3),
    "originalMotionUrl" TEXT,
    "motionMaker" TEXT,
    "scrapedTitle" TEXT,
    "scrapedLastChanged" TIMESTAMP(3),
    "scrapedMover" TEXT,
    "scrapedSecond" TEXT,
    "lastScrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Motion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "motionId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "activity" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Motion_councilFile_key" ON "Motion"("councilFile");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_motionId_fkey" FOREIGN KEY ("motionId") REFERENCES "Motion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
