-- Seed Dr. Pradeep's weekly hours with the sessions the booking form offered
-- before hours became configurable (10-11, 11-12, 2-3, 3-4, 4-5, 5-6 every day),
-- so bookings keep working until an admin edits the schedule.
-- Only runs when no hours exist; attached to the longest-standing admin.
INSERT INTO "AdminAvailability" ("id", "adminId", "dayOfWeek", "startTime", "endTime", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, a.id, d.day, r.start_time, r.end_time, true, now(), now()
FROM (SELECT id FROM "User" WHERE role = 'ADMIN' ORDER BY "createdAt" ASC LIMIT 1) a
CROSS JOIN generate_series(0, 6) AS d(day)
CROSS JOIN (VALUES ('10:00', '12:00'), ('14:00', '18:00')) AS r(start_time, end_time)
WHERE NOT EXISTS (SELECT 1 FROM "AdminAvailability");
