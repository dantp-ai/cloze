-- Runs once on first container start (empty data volume).
-- The main "cloze" database is created via POSTGRES_DB; this adds the test database.
CREATE DATABASE cloze_test;
