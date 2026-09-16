-- Run this once in Supabase SQL Editor before using Prisma.
-- Replace 'CHANGE_ME_TO_A_LONG_RANDOM_PASSWORD' with a strong password.

create user "prisma" with password 'CHANGE_ME_TO_A_LONG_RANDOM_PASSWORD' bypassrls createdb;

grant "prisma" to "postgres";

grant usage on schema public to prisma;
grant create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;

alter default privileges for role postgres in schema public grant all on tables to prisma;
alter default privileges for role postgres in schema public grant all on routines to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;
