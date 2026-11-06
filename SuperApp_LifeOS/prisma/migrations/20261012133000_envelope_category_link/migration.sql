-- Link a monthly envelope to the real transaction category it controls.
ALTER TABLE "Envelope" ADD COLUMN "categoryId" TEXT REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Envelope_categoryId_idx" ON "Envelope"("categoryId");
