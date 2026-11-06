-- Monthly closes belong to the household while retaining the member who
-- performed the close in userId.
ALTER TABLE "MonthlySnapshot" ADD COLUMN "coupleId" TEXT REFERENCES "CoupleSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "MonthlySnapshot_coupleId_year_month_key" ON "MonthlySnapshot"("coupleId", "year", "month");
