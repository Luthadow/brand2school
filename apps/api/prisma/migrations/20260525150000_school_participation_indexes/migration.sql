-- Speed up province → district → school lookups on /participation/school-options.
CREATE INDEX "School_province_district_idx" ON "School"("province", "district");
CREATE INDEX "School_status_province_idx" ON "School"("status", "province");
