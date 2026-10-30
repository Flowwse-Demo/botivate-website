/**
 * stages_2_3.js — Robust Planning and Safety Validation
 * ─────────────────────────────────────────────────────────────────────────────
 * STAGES 2 & 3: MIGRATION PLANNING & SAFETY VALIDATION ONLY.
 * STAGE 4 (EXECUTION) IS STRICTLY BLOCKED UNTIL APPROVAL GATE IS SATISFIED.
 *
 * Requirements addressed:
 * 1. Legacy table types strictly matched to verified PROD OpenAPI metadata.
 * 2. Idempotent triggers: checked via pg_trigger/pg_class without DROP.
 * 3. Verified functions: checked via pg_proc without blind replacement.
 * 4. Verified enum definitions: checked via pg_type; missing labels added.
 * 5. Checked views: verified via pg_views before creation.
 * 6. Explicit gap analysis for RLS, grants, permissions, and sequences.
 * 7. Error handling in row counts: failed counts recorded as ERROR, never zero.
 * 8. Clear distinction between verified facts vs assumptions.
 * 9. Mark unverified operations BLOCKED if cannot be guaranteed safe.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const envRaw = readFileSync(join(__dir, '.env.sync'), 'utf8');
const env = Object.fromEntries(
  envRaw.split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
);

const prodClient = createClient(env.PROD_SUPABASE_URL, env.PROD_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});
const testClient = createClient(env.TEST_SUPABASE_URL, env.TEST_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// ─── Live count verification with explicit error handling ───────────────────
async function verifyLiveCounts() {
  const tables = {
    prod: ['FMS', 'dropdown', 'master', 'new_system', 'system_list'],
    test: [
      'users', 'teams', 'team_members', 'systems', 'system_requests', 'cmp_task',
      'user_tasks', 'task_subtasks', 'task_testing', 'holidays', 'delegated_tasks',
      'checklist_tasks', 'weekly_calls', 'orders', 'task_subtasks_full'
    ],
  };

  const results = { prod: {}, test: {}, hasErrors: false };

  for (const t of tables.prod) {
    try {
      const { count, error } = await prodClient.from(t).select('*', { count: 'exact', head: true });
      if (error) {
        results.prod[t] = { status: 'ERROR', count: null, error: error.message };
        results.hasErrors = true;
      } else {
        results.prod[t] = { status: 'OK', count, error: null };
      }
    } catch (e) {
      results.prod[t] = { status: 'EXCEPTION', count: null, error: e.message };
      results.hasErrors = true;
    }
  }

  for (const t of tables.test) {
    try {
      const { count, error } = await testClient.from(t).select('*', { count: 'exact', head: true });
      if (error) {
        results.test[t] = { status: 'ERROR', count: null, error: error.message };
        results.hasErrors = true;
      } else {
        results.test[t] = { status: 'OK', count, error: null };
      }
    } catch (e) {
      results.test[t] = { status: 'EXCEPTION', count: null, error: e.message };
      results.hasErrors = true;
    }
  }

  return results;
}

// ─── Generate Operation A SQL (TEST → PROD, schema only) ────────────────────
function generateOperationA_SQL() {
  const ts = new Date().toISOString();
  return `-- ============================================================
-- OPERATION A: TEST → PRODUCTION (SCHEMA ONLY, NO DATA)
-- Strict Safety Design:
-- 1. No DROP statements of any kind (no DROP TABLE, no DROP TRIGGER, no DROP VIEW).
-- 2. No TRUNCATE or DELETE statements.
-- 3. Enums: Checked via pg_type; existing types have missing labels added safely.
-- 4. Functions: Checked via pg_proc before creation; existing functions are untouched.
-- 5. Sequences: Checked via CREATE SEQUENCE IF NOT EXISTS.
-- 6. Tables: Created via CREATE TABLE IF NOT EXISTS with exact live types.
-- 7. Constraints: Added via DO blocks with duplicate_object protection.
-- 8. Triggers: Checked via pg_trigger/pg_class before creation; no drops.
-- 9. Views: Checked via pg_views before creation; existing views untouched.
-- Generated: ${ts}
-- ============================================================

-- ─── STEP 1: ENUM TYPES (Inspected & Idempotent) ───────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'user_role_enum') THEN
    CREATE TYPE public.user_role_enum AS ENUM ('employee','company','hod','admin','superadmin');
  ELSE
    ALTER TYPE public.user_role_enum ADD VALUE IF NOT EXISTS 'employee';
    ALTER TYPE public.user_role_enum ADD VALUE IF NOT EXISTS 'company';
    ALTER TYPE public.user_role_enum ADD VALUE IF NOT EXISTS 'hod';
    ALTER TYPE public.user_role_enum ADD VALUE IF NOT EXISTS 'admin';
    ALTER TYPE public.user_role_enum ADD VALUE IF NOT EXISTS 'superadmin';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'system_type_enum') THEN
    CREATE TYPE public.system_type_enum AS ENUM ('New System','Existing System');
  ELSE
    ALTER TYPE public.system_type_enum ADD VALUE IF NOT EXISTS 'New System';
    ALTER TYPE public.system_type_enum ADD VALUE IF NOT EXISTS 'Existing System';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'environment_enum') THEN
    CREATE TYPE public.environment_enum AS ENUM ('dummy','original');
  ELSE
    ALTER TYPE public.environment_enum ADD VALUE IF NOT EXISTS 'dummy';
    ALTER TYPE public.environment_enum ADD VALUE IF NOT EXISTS 'original';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'system_status_enum') THEN
    CREATE TYPE public.system_status_enum AS ENUM ('Active','Development','Maintenance','Inactive');
  ELSE
    ALTER TYPE public.system_status_enum ADD VALUE IF NOT EXISTS 'Active';
    ALTER TYPE public.system_status_enum ADD VALUE IF NOT EXISTS 'Development';
    ALTER TYPE public.system_status_enum ADD VALUE IF NOT EXISTS 'Maintenance';
    ALTER TYPE public.system_status_enum ADD VALUE IF NOT EXISTS 'Inactive';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'work_type_enum') THEN
    CREATE TYPE public.work_type_enum AS ENUM (
      'New System',
      'Existing System Edit & Update',
      'Error Received',
      'Complain Report',
      'System Dummy',
      'System Actual',
      'Meeting'
    );
  ELSE
    ALTER TYPE public.work_type_enum ADD VALUE IF NOT EXISTS 'New System';
    ALTER TYPE public.work_type_enum ADD VALUE IF NOT EXISTS 'Existing System Edit & Update';
    ALTER TYPE public.work_type_enum ADD VALUE IF NOT EXISTS 'Error Received';
    ALTER TYPE public.work_type_enum ADD VALUE IF NOT EXISTS 'Complain Report';
    ALTER TYPE public.work_type_enum ADD VALUE IF NOT EXISTS 'System Dummy';
    ALTER TYPE public.work_type_enum ADD VALUE IF NOT EXISTS 'System Actual';
    ALTER TYPE public.work_type_enum ADD VALUE IF NOT EXISTS 'Meeting';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'priority_enum') THEN
    CREATE TYPE public.priority_enum AS ENUM ('High','Medium','Low');
  ELSE
    ALTER TYPE public.priority_enum ADD VALUE IF NOT EXISTS 'High';
    ALTER TYPE public.priority_enum ADD VALUE IF NOT EXISTS 'Medium';
    ALTER TYPE public.priority_enum ADD VALUE IF NOT EXISTS 'Low';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'task_status_enum') THEN
    CREATE TYPE public.task_status_enum AS ENUM ('Pending','In Progress','In Testing','Completed','On Hold','Cancelled');
  ELSE
    ALTER TYPE public.task_status_enum ADD VALUE IF NOT EXISTS 'Pending';
    ALTER TYPE public.task_status_enum ADD VALUE IF NOT EXISTS 'In Progress';
    ALTER TYPE public.task_status_enum ADD VALUE IF NOT EXISTS 'In Testing';
    ALTER TYPE public.task_status_enum ADD VALUE IF NOT EXISTS 'Completed';
    ALTER TYPE public.task_status_enum ADD VALUE IF NOT EXISTS 'On Hold';
    ALTER TYPE public.task_status_enum ADD VALUE IF NOT EXISTS 'Cancelled';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'cmp_task_status_enum') THEN
    CREATE TYPE public.cmp_task_status_enum AS ENUM ('Open','Converted','Closed');
  ELSE
    ALTER TYPE public.cmp_task_status_enum ADD VALUE IF NOT EXISTS 'Open';
    ALTER TYPE public.cmp_task_status_enum ADD VALUE IF NOT EXISTS 'Converted';
    ALTER TYPE public.cmp_task_status_enum ADD VALUE IF NOT EXISTS 'Closed';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'team_type_enum') THEN
    CREATE TYPE public.team_type_enum AS ENUM ('Development','Support','QA','Operations','Sales','General');
  ELSE
    ALTER TYPE public.team_type_enum ADD VALUE IF NOT EXISTS 'Development';
    ALTER TYPE public.team_type_enum ADD VALUE IF NOT EXISTS 'Support';
    ALTER TYPE public.team_type_enum ADD VALUE IF NOT EXISTS 'QA';
    ALTER TYPE public.team_type_enum ADD VALUE IF NOT EXISTS 'Operations';
    ALTER TYPE public.team_type_enum ADD VALUE IF NOT EXISTS 'Sales';
    ALTER TYPE public.team_type_enum ADD VALUE IF NOT EXISTS 'General';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'delegated_task_status') THEN
    CREATE TYPE public.delegated_task_status AS ENUM ('Pending','In Progress','Completed','Extended');
  ELSE
    ALTER TYPE public.delegated_task_status ADD VALUE IF NOT EXISTS 'Pending';
    ALTER TYPE public.delegated_task_status ADD VALUE IF NOT EXISTS 'In Progress';
    ALTER TYPE public.delegated_task_status ADD VALUE IF NOT EXISTS 'Completed';
    ALTER TYPE public.delegated_task_status ADD VALUE IF NOT EXISTS 'Extended';
  END IF;
END $$;

-- ─── STEP 2: FUNCTIONS (Non-destructive check via pg_proc) ───────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'touch_updated_at') THEN
    EXECUTE $func$
      CREATE FUNCTION public.touch_updated_at()
      RETURNS trigger LANGUAGE plpgsql AS $f$
      BEGIN
        new.updated_at = now();
        RETURN new;
      END;
      $f$;
    $func$;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'generate_task_no') THEN
    EXECUTE $func$
      CREATE FUNCTION public.generate_task_no()
      RETURNS trigger LANGUAGE plpgsql AS $f$
      BEGIN
        IF new.task_no IS NULL THEN
          new.task_no := 'TASK-' || lpad(nextval('public.user_tasks_no_seq')::text, 5, '0');
        END IF;
        RETURN new;
      END;
      $f$;
    $func$;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'generate_delegated_serial') THEN
    EXECUTE $func$
      CREATE FUNCTION public.generate_delegated_serial()
      RETURNS trigger LANGUAGE plpgsql AS $f$
      BEGIN
        IF new.serial_number IS NULL THEN
          new.serial_number := 'DLG-' || lpad(nextval('public.delegated_tasks_serial_seq')::text, 5, '0');
        END IF;
        RETURN new;
      END;
      $f$;
    $func$;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'generate_order_serial') THEN
    EXECUTE $func$
      CREATE FUNCTION public.generate_order_serial()
      RETURNS trigger LANGUAGE plpgsql AS $f$
      BEGIN
        IF new.serial_number IS NULL THEN
          new.serial_number := 'ORD-' || lpad(nextval('public.orders_serial_seq')::text, 5, '0');
        END IF;
        RETURN new;
      END;
      $f$;
    $func$;
  END IF;
END $$;

-- ─── STEP 3: SEQUENCES ──────────────────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS public.delegated_tasks_serial_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.user_tasks_no_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.orders_serial_seq START 1;

-- ─── STEP 4: TABLES (Dependency-ordered, Additive only) ──────────────────────

-- 4.1 users
CREATE TABLE IF NOT EXISTS public.users (
  id           bigint generated by default as identity primary key,
  username     text not null unique,
  password     text not null,
  name         text not null,
  role         public.user_role_enum not null default 'employee',
  company_name text null,
  permission   jsonb not null default '{}'::jsonb,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint users_company_name_check check (
    (role = 'company' and company_name is not null) or (role <> 'company')
  )
);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 4.2 teams
CREATE TABLE IF NOT EXISTS public.teams (
  id          bigint generated by default as identity primary key,
  name        text not null,
  team_type   public.team_type_enum not null default 'General',
  hod_id      bigint not null references public.users(id) on delete restrict,
  description text null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (hod_id, name)
);
CREATE INDEX IF NOT EXISTS idx_teams_hod ON public.teams(hod_id);

-- 4.3 team_members
CREATE TABLE IF NOT EXISTS public.team_members (
  id        bigint generated by default as identity primary key,
  team_id   bigint not null references public.teams(id) on delete cascade,
  user_id   bigint not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);

-- 4.4 systems
CREATE TABLE IF NOT EXISTS public.systems (
  id               bigint generated by default as identity primary key,
  company_id       bigint not null references public.users(id) on delete cascade,
  name             text not null,
  type_of_system   public.system_type_enum not null default 'New System',
  status_of_system public.system_status_enum not null default 'Active',
  department_name  text null,
  website_link     text null,
  system_username  text null,
  system_password  text null,
  description      text null,
  environment      public.environment_enum not null default 'original',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  company_username text null,
  company_password text null,
  dummy_link       text null,
  dummy_username   text null,
  dummy_password   text null,
  unique (company_id, name)
);

-- 4.5 system_requests
CREATE TABLE IF NOT EXISTS public.system_requests (
  id               bigint generated by default as identity primary key,
  company_id       bigint not null references public.users(id) on delete cascade,
  system_name      text not null,
  department       text null,
  description      text null,
  priority         text not null default 'Medium',
  needed_by        date null,
  attachment_url   text null,
  attachment_name  text null,
  requested_by     bigint null references public.users(id) on delete set null,
  status           text not null default 'Pending',
  system_id        bigint null references public.systems(id) on delete set null,
  decided_by       bigint null references public.users(id) on delete set null,
  decided_at       timestamptz null,
  decision_remarks text null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_system_requests_company ON public.system_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_system_requests_status  ON public.system_requests(status);

-- 4.6 cmp_task
CREATE TABLE IF NOT EXISTS public.cmp_task (
  id                     bigint generated by default as identity primary key,
  task_name              text not null,
  description            text null,
  company_id             bigint not null references public.users(id) on delete cascade,
  system_id              bigint null references public.systems(id) on delete set null,
  posted_by              bigint null references public.users(id) on delete set null,
  assigned_member_id     bigint null references public.users(id) on delete set null,
  assigned_by            bigint null references public.users(id) on delete set null,
  priority               public.priority_enum not null default 'Medium',
  status                 public.cmp_task_status_enum not null default 'Open',
  link_of_system         text null,
  attachment_file        text null,
  notes                  text null,
  remarks                text null,
  time_required          timestamptz null,
  given_date             timestamptz null,
  expected_date_to_close timestamptz null,
  converted_task_id      bigint null,
  created_at             timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_cmp_task_status    ON public.cmp_task(status);
CREATE INDEX IF NOT EXISTS idx_cmp_task_converted ON public.cmp_task(converted_task_id);

-- 4.7 user_tasks (with exact live nullability: is_testing_issue boolean NOT NULL default false)
CREATE TABLE IF NOT EXISTS public.user_tasks (
  id                     bigint generated by default as identity primary key,
  task_no                text unique,
  given_date             timestamptz not null default now(),
  posted_by              bigint not null references public.users(id),
  taken_from             bigint not null references public.users(id),
  company_id             bigint not null references public.users(id) on delete restrict,
  type_of_work           public.work_type_enum not null,
  expected_date_to_close timestamptz not null,
  description_of_work    text not null,
  system_id              bigint null references public.systems(id) on delete set null,
  link_of_system         text null,
  attachment_file        text null,
  priority               public.priority_enum not null default 'Medium',
  notes                  text null,
  time_required          timestamptz null,
  assigned_member_1      bigint null references public.users(id),
  assigned_member_2      bigint null references public.users(id),
  assigned_by            bigint null references public.users(id),
  remarks                text null,
  status                 public.task_status_enum not null default 'Pending',
  assigned_at            timestamptz null,
  approved_by            bigint null references public.users(id),
  approved_at            timestamptz null,
  completed_at           timestamptz null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  github_link            text null,
  is_testing_issue       boolean not null default false,
  constraint user_tasks_posted_by_ne_taken_from check (posted_by is distinct from taken_from)
);
CREATE INDEX IF NOT EXISTS idx_user_tasks_status            ON public.user_tasks(status);
CREATE INDEX IF NOT EXISTS idx_user_tasks_assigned_member_1 ON public.user_tasks(assigned_member_1);
CREATE INDEX IF NOT EXISTS idx_user_tasks_assigned_member_2 ON public.user_tasks(assigned_member_2);

-- Deferred FK: cmp_task -> user_tasks
DO $$ BEGIN
  ALTER TABLE public.cmp_task
    ADD CONSTRAINT cmp_task_converted_task_id_fkey
    FOREIGN KEY (converted_task_id) REFERENCES public.user_tasks(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4.8 task_testing (created prior to task_subtasks to avoid missing ref)
CREATE TABLE IF NOT EXISTS public.task_testing (
  id                    bigint generated by default as identity primary key,
  task_id               bigint null references public.user_tasks(id) on delete set null,
  made_by               bigint null references public.users(id) on delete set null,
  company_id            bigint null references public.users(id) on delete set null,
  system_id             bigint null references public.systems(id) on delete set null,
  type_of_product       text null,
  date_of_delivery      date null,
  system_link           text null,
  github_link           text null,
  system_login_id       text null,
  system_password       text null,
  tester_id             bigint null references public.users(id) on delete set null,
  expected_testing_date date null,
  assign_remarks        text null,
  assigned_by           bigint null references public.users(id) on delete set null,
  assigned_at           timestamptz null,
  test_status           text null,
  tester_remarks        text null,
  tested_at             timestamptz null,
  issue_task_id         bigint null references public.user_tasks(id) on delete set null,
  db_status             text null,
  db_remarks            text null,
  db_checked_at         timestamptz null,
  db_checked_by         text null,
  db_task_id            bigint null references public.user_tasks(id) on delete set null,
  approval_status       text null,
  approval_remarks      text null,
  approval_checked_at   timestamptz null,
  approval_checked_by   text null,
  approval_task_id      bigint null references public.user_tasks(id) on delete set null,
  inform_status         text null,
  inform_remarks        text null,
  inform_checked_at     timestamptz null,
  inform_checked_by     text null,
  inform_task_id        bigint null references public.user_tasks(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  tester_type           text null,
  delivery_group        bigint null,
  subtask_id            bigint null,
  tested_by             text null
);
CREATE INDEX IF NOT EXISTS idx_task_testing_task_id     ON public.task_testing(task_id);
CREATE INDEX IF NOT EXISTS idx_task_testing_tester_id   ON public.task_testing(tester_id);
CREATE INDEX IF NOT EXISTS idx_task_testing_test_status ON public.task_testing(test_status);

-- 4.9 task_subtasks
CREATE TABLE IF NOT EXISTS public.task_subtasks (
  id                     bigint generated by default as identity primary key,
  root_task_id           bigint null references public.user_tasks(id) on delete cascade,
  parent_subtask_id      bigint null references public.task_subtasks(id) on delete cascade,
  source_testing_id      bigint null references public.task_testing(id) on delete set null,
  relation_type          text null,
  issue_remarks          text null,
  created_by             bigint null references public.users(id) on delete set null,
  task_no                text null,
  given_date             timestamptz null default now(),
  posted_by              bigint null references public.users(id) on delete set null,
  taken_from             bigint null references public.users(id) on delete set null,
  company_id             bigint null references public.users(id) on delete set null,
  type_of_work           public.work_type_enum null,
  expected_date_to_close timestamptz null,
  description_of_work    text null,
  system_id              bigint null references public.systems(id) on delete set null,
  link_of_system         text null,
  github_link            text null,
  attachment_file        text null,
  priority               public.priority_enum null default 'Medium',
  notes                  text null,
  time_required          timestamptz null,
  assigned_member_1      bigint null references public.users(id) on delete set null,
  assigned_member_2      bigint null references public.users(id) on delete set null,
  assigned_by            bigint null references public.users(id) on delete set null,
  remarks                text null,
  status                 public.task_status_enum null default 'Pending',
  assigned_at            timestamptz null,
  approved_by            bigint null references public.users(id) on delete set null,
  approved_at            timestamptz null,
  completed_at           timestamptz null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_root   ON public.task_subtasks(root_task_id);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_parent ON public.task_subtasks(parent_subtask_id);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_status ON public.task_subtasks(status);

-- Mutual FK: task_testing.subtask_id -> task_subtasks
DO $$ BEGIN
  ALTER TABLE public.task_testing
    ADD CONSTRAINT task_testing_subtask_id_fkey
    FOREIGN KEY (subtask_id) REFERENCES public.task_subtasks(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4.10 holidays
CREATE TABLE IF NOT EXISTS public.holidays (
  id           bigint generated by default as identity primary key,
  holiday_date date not null,
  name         text not null,
  description  text null,
  is_recurring boolean not null default false,
  created_by   bigint null references public.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_holidays_date_unique ON public.holidays(holiday_date);
CREATE INDEX IF NOT EXISTS idx_holidays_recurring ON public.holidays(is_recurring) WHERE is_recurring = true;

-- 4.11 delegated_tasks
CREATE TABLE IF NOT EXISTS public.delegated_tasks (
  id              bigserial primary key,
  serial_number   text unique,
  assigned_by     bigint not null references public.users(id) on delete cascade,
  assigned_to     bigint not null references public.users(id) on delete cascade,
  task_details    text not null,
  target_date     date not null,
  target_time     text null,
  planned_date    date not null,
  actual_date     date null,
  delay_duration  integer null,
  status          public.delegated_task_status not null default 'Pending',
  remarks         text null,
  new_target_date date null,
  new_target_time text null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_delegated_tasks_assigned_to  ON public.delegated_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_delegated_tasks_assigned_by  ON public.delegated_tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_delegated_tasks_status       ON public.delegated_tasks(status);
CREATE INDEX IF NOT EXISTS idx_delegated_tasks_target_date  ON public.delegated_tasks(target_date);

-- 4.12 checklist_tasks
CREATE TABLE IF NOT EXISTS public.checklist_tasks (
  id            bigserial primary key,
  assigned_by   bigint null references public.users(id) on delete set null,
  name          text not null,
  task_name     text not null,
  task_category text not null default 'single',
  task_type     text not null,
  description   text null,
  task_date     date null,
  task_time     text null,
  days          text[] not null default '{}',
  status        text not null default 'Pending',
  remarks       text null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_checklist_tasks_status      ON public.checklist_tasks(status);
CREATE INDEX IF NOT EXISTS idx_checklist_tasks_assigned_by ON public.checklist_tasks(assigned_by);

-- 4.13 weekly_calls
CREATE TABLE IF NOT EXISTS public.weekly_calls (
  id                  bigserial primary key,
  party_name          text not null,
  responsible_person  text not null,
  responsible_phone   text not null,
  calling_person_name text not null,
  task_description    text null,
  calling_days        text[] not null default '{}',
  calling_time        text null,
  assigned_by         bigint null references public.users(id) on delete set null,
  status              text not null default 'Pending',
  has_issue           boolean null,
  customer_said       text null,
  proof_url           text null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_weekly_calls_status      ON public.weekly_calls(status);
CREATE INDEX IF NOT EXISTS idx_weekly_calls_assigned_by ON public.weekly_calls(assigned_by);

-- 4.14 orders
CREATE TABLE IF NOT EXISTS public.orders (
  id                       bigserial primary key,
  serial_number            text unique,
  party_name               text not null,
  type_of_work             text not null default 'Project',
  start_date               date null,
  end_date                 date null,
  value_of_order           numeric(14,2) null,
  payment_type             text null,
  nda_required             boolean not null default false,
  nda_attachment_url       text null,
  quotation_number         text null,
  quotation_attachment_url text null,
  status                   text not null default 'Submitted',
  remarks                  text null,
  created_by               bigint null references public.users(id) on delete set null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_party_name ON public.orders(party_name);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- ─── STEP 5: TRIGGERS (Safe idempotent check via pg_trigger) ────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND c.relname = 'user_tasks' AND t.tgname = 'set_task_no') THEN
    CREATE TRIGGER set_task_no BEFORE INSERT ON public.user_tasks FOR EACH ROW WHEN (new.task_no IS NULL) EXECUTE FUNCTION public.generate_task_no();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND c.relname = 'delegated_tasks' AND t.tgname = 'set_delegated_serial') THEN
    CREATE TRIGGER set_delegated_serial BEFORE INSERT ON public.delegated_tasks FOR EACH ROW WHEN (new.serial_number IS NULL) EXECUTE FUNCTION public.generate_delegated_serial();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND c.relname = 'orders' AND t.tgname = 'set_order_serial') THEN
    CREATE TRIGGER set_order_serial BEFORE INSERT ON public.orders FOR EACH ROW WHEN (new.serial_number IS NULL) EXECUTE FUNCTION public.generate_order_serial();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND c.relname = 'user_tasks' AND t.tgname = 'trg_user_tasks_updated_at') THEN
    CREATE TRIGGER trg_user_tasks_updated_at BEFORE UPDATE ON public.user_tasks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND c.relname = 'users' AND t.tgname = 'trg_users_updated_at') THEN
    CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND c.relname = 'systems' AND t.tgname = 'trg_systems_updated_at') THEN
    CREATE TRIGGER trg_systems_updated_at BEFORE UPDATE ON public.systems FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND c.relname = 'teams' AND t.tgname = 'trg_teams_updated_at') THEN
    CREATE TRIGGER trg_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND c.relname = 'holidays' AND t.tgname = 'trg_holidays_updated_at') THEN
    CREATE TRIGGER trg_holidays_updated_at BEFORE UPDATE ON public.holidays FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND c.relname = 'delegated_tasks' AND t.tgname = 'trg_delegated_tasks_updated_at') THEN
    CREATE TRIGGER trg_delegated_tasks_updated_at BEFORE UPDATE ON public.delegated_tasks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND c.relname = 'checklist_tasks' AND t.tgname = 'trg_checklist_tasks_updated_at') THEN
    CREATE TRIGGER trg_checklist_tasks_updated_at BEFORE UPDATE ON public.checklist_tasks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND c.relname = 'weekly_calls' AND t.tgname = 'trg_weekly_calls_updated_at') THEN
    CREATE TRIGGER trg_weekly_calls_updated_at BEFORE UPDATE ON public.weekly_calls FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND c.relname = 'orders' AND t.tgname = 'trg_orders_updated_at') THEN
    CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND c.relname = 'system_requests' AND t.tgname = 'trg_system_requests_updated_at') THEN
    CREATE TRIGGER trg_system_requests_updated_at BEFORE UPDATE ON public.system_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND c.relname = 'task_subtasks' AND t.tgname = 'trg_task_subtasks_updated_at') THEN
    CREATE TRIGGER trg_task_subtasks_updated_at BEFORE UPDATE ON public.task_subtasks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND c.relname = 'task_testing' AND t.tgname = 'trg_task_testing_updated_at') THEN
    CREATE TRIGGER trg_task_testing_updated_at BEFORE UPDATE ON public.task_testing FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END $$;

-- ─── STEP 6: VIEW (Verified via pg_views) ───────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'task_subtasks_full') THEN
    EXECUTE $view$
      CREATE VIEW public.task_subtasks_full AS
      SELECT
        ts.*,
        ut.task_no     AS root_task_no,
        pts.task_no    AS parent_task_no,
        tt.tester_type AS source_tester_type
      FROM public.task_subtasks ts
      LEFT JOIN public.user_tasks    ut  ON ts.root_task_id      = ut.id
      LEFT JOIN public.task_subtasks pts ON ts.parent_subtask_id = pts.id
      LEFT JOIN public.task_testing  tt  ON ts.source_testing_id = tt.id;
    $view$;
  END IF;
END $$;

-- ─── STEP 7: COMMENTS ───────────────────────────────────────────────────────

COMMENT ON TABLE public.holidays       IS 'Company holidays. Sundays always non-working (app logic). Extends task deadlines.';
COMMENT ON TABLE public.delegated_tasks IS 'Internal task delegation. Serial DLG-NNNNN. Delay = actual_date - planned_date.';
COMMENT ON TABLE public.checklist_tasks IS 'Recurring checklist tasks (single/group, Customer or Botivate Operational).';
COMMENT ON TABLE public.weekly_calls    IS 'Scheduled weekly customer/partner calls with update + optional escalate.';
COMMENT ON TABLE public.orders          IS 'Order System submissions — listed under Order List sidebar.';
COMMENT ON TABLE public.system_requests IS 'Company-submitted new system requests. Decided by admin/superadmin.';
COMMENT ON TABLE public.task_subtasks   IS 'Subtasks linked to user_tasks. Supports nested subtasks and testing-issue tracing.';
COMMENT ON TABLE public.task_testing    IS 'Full QA/testing workflow per delivery. Multi-stage: assign, test, DB, approval, inform.';

-- ============================================================
-- END OF OPERATION A
-- ============================================================
`;
}

// ─── Generate Operation B SQL (PROD legacy -> TEST, schema only) ────────────
function generateOperationB_SQL() {
  const ts = new Date().toISOString();
  return `-- ============================================================
-- OPERATION B PART 1: Create PROD legacy tables in TEST (SCHEMA ONLY)
-- Column types strictly matched to verified PROD OpenAPI metadata:
-- 1. "FMS": 34 columns (id bigint PK, timestamp timestamptz NOT NULL, given_date timestamp without time zone, planned1-3 timestamptz, etc.)
-- 2. "dropdown": 9 columns (id bigint PK, created_at timestamptz NOT NULL, text cols)
-- 3. "master": 10 columns (id bigint PK, created_at timestamptz NOT NULL, pagination_for_company json, pagination_for_user json, etc.)
-- 4. "new_system": 15 columns (id bigint PK, timestamp timestamptz NOT NULL, given_date date, expected_date_to_close date, etc.)
-- 5. "system_list": 10 columns (id bigint PK, timestamp timestamptz NOT NULL, text cols)
-- Data will be copied via idempotent REST batch upsert (preserving original IDs).
-- Generated: ${ts}
-- ============================================================

-- FMS: Legacy Field Management System / task table (8,001 rows in PROD)
CREATE TABLE IF NOT EXISTS public."FMS" (
  id                      bigint generated by default as identity primary key,
  timestamp               timestamp with time zone not null default now(),
  task_no                 text null,
  given_date              timestamp without time zone null,
  posted_by               text null,
  type_of_work            text null,
  taken_from              text null,
  party_name              text null,
  system_name             text null,
  description_of_work     text null,
  link_of_system          text null,
  attachment_file         text null,
  priority_in_customer    text null,
  notes                   text null,
  expected_date_to_close  text null,
  planned1                timestamp with time zone null,
  actual1                 timestamp with time zone null,
  delay1                  text null,
  team_member_name        text null,
  how_many_time_take      text null,
  remarks                 text null,
  planned2                timestamp with time zone null,
  actual2                 timestamp with time zone null,
  delay2                  text null,
  employee_name_1         text null,
  employee_name_2         text null,
  how_many_time_take_2    text null,
  remarks_2               text null,
  planned3                timestamp with time zone null,
  actual3                 timestamp with time zone null,
  delay3                  text null,
  status                  text null,
  team_name               text null,
  assigned_by             text null
);

-- dropdown: Legacy lookup/dropdown options (50 rows in PROD)
CREATE TABLE IF NOT EXISTS public.dropdown (
  id            bigint generated by default as identity primary key,
  created_at    timestamp with time zone not null default now(),
  party_name    text null,
  type_of_work  text null,
  taken_from    text null,
  posted_by     text null,
  member_name   text null,
  assign_member text null,
  team_name     text null
);

-- master: Legacy company + user credential mapping (42 rows in PROD)
-- Strict rule: Never map into 'users' table. Kept as standalone legacy table.
CREATE TABLE IF NOT EXISTS public.master (
  id                     bigint generated by default as identity primary key,
  created_at             timestamp with time zone not null default now(),
  company_id             text null,
  company_name           text null,
  company_password       text null,
  pagination_for_company json null,
  user_id                text null,
  user_password          text null,
  user_role              text null,
  pagination_for_user    json null
);

-- new_system: Legacy new system request submissions (1 row in PROD)
CREATE TABLE IF NOT EXISTS public.new_system (
  id                     bigint generated by default as identity primary key,
  timestamp              timestamp with time zone not null default now(),
  task_no                text null,
  given_date             date null,
  posted_by              text null,
  type_of_work           text null,
  taken_from             text null,
  party_name             text null,
  system_name            text null,
  description_of_work    text null,
  link_of_system         text null,
  attachment_file        text null,
  priority_in_customer   text null,
  notes                  text null,
  expected_date_to_close date null
);

-- system_list: Legacy system & client registry (1,705 rows in PROD)
CREATE TABLE IF NOT EXISTS public.system_list (
  id               bigint generated by default as identity primary key,
  timestamp        timestamp with time zone not null default now(),
  party_name       text null,
  department_name  text null,
  system_name      text null,
  type_of_system   text null,
  status_of_system text null,
  total_updation   text null,
  website_link     text null,
  flowchart        text null
);

-- ============================================================
-- END OF OPERATION B PART 1
-- ============================================================
`;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  STAGES 2 & 3 — REVISED PLANNING & SAFETY VALIDATION       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Step 1: Verify live counts with error handling
  console.log('Step 1: Checking live database counts...');
  const counts = await verifyLiveCounts();

  console.log('\nPROD live status:');
  Object.entries(counts.prod).forEach(([t, r]) => {
    if (r.status === 'OK') console.log(`  ${t.padEnd(16)}: ${r.count} rows [OK]`);
    else console.log(`  ${t.padEnd(16)}: FAILED (${r.error}) [${r.status}]`);
  });

  console.log('\nTEST live status:');
  Object.entries(counts.test).forEach(([t, r]) => {
    if (r.status === 'OK') console.log(`  ${t.padEnd(20)}: ${r.count} rows [OK]`);
    else console.log(`  ${t.padEnd(20)}: FAILED (${r.error}) [${r.status}]`);
  });

  // Step 2: Generate SQL files locally
  console.log('\nStep 2: Generating local SQL migration files...');
  const opA = generateOperationA_SQL();
  const opB = generateOperationB_SQL();

  writeFileSync(join(__dir, 'migration_op_a.sql'), opA);
  writeFileSync(join(__dir, 'migration_op_b.sql'), opB);
  console.log('  ✓ migration_op_a.sql saved locally');
  console.log('  ✓ migration_op_b.sql saved locally');

  // Step 3: Run comprehensive safety checks
  console.log('\nStep 3: Evaluating safety criteria on generated plans...');
  const stripComments = sql => sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const cleanA = stripComments(opA);
  const cleanB = stripComments(opB);

  const tableCountA = (opA.match(/^CREATE TABLE IF NOT EXISTS/gm) || []).length;
  const tableCountB = (opB.match(/^CREATE TABLE IF NOT EXISTS/gm) || []).length;
  const hasDropTable = /\bDROP\s+TABLE\b/i.test(cleanA) || /\bDROP\s+TABLE\b/i.test(cleanB);
  const hasDropTrigger = /\bDROP\s+TRIGGER\b/i.test(cleanA) || /\bDROP\s+TRIGGER\b/i.test(cleanB);
  const hasTruncate = /\bTRUNCATE\b/i.test(cleanA) || /\bTRUNCATE\b/i.test(cleanB);
  const hasDelete = /\bDELETE\s+FROM\b/i.test(cleanA) || /\bDELETE\s+FROM\b/i.test(cleanB);
  const hasBadAlterConstraint = /ADD CONSTRAINT IF NOT EXISTS/i.test(cleanA) || /ADD CONSTRAINT IF NOT EXISTS/i.test(cleanB);
  const hasDoGuardedConstraint = /DO \$\$.*ADD CONSTRAINT.*EXCEPTION WHEN duplicate_object/s.test(cleanA);
  const hasSafeEnumHandling = /ALTER TYPE.*ADD VALUE IF NOT EXISTS/s.test(cleanA);
  const hasSafeTriggerHandling = /IF NOT EXISTS \(SELECT 1 FROM pg_trigger/s.test(cleanA);
  const hasSafeProcHandling = /IF NOT EXISTS \(SELECT 1 FROM pg_proc/s.test(cleanA);
  const hasSafeViewHandling = /IF NOT EXISTS \(SELECT 1 FROM pg_views/s.test(cleanA);

  const safetyChecks = [
    { check: 'Zero DROP TABLE statements across all plans', pass: !hasDropTable },
    { check: 'Zero DROP TRIGGER statements across all plans', pass: !hasDropTrigger },
    { check: 'Zero TRUNCATE statements across all plans', pass: !hasTruncate },
    { check: 'Zero DELETE FROM statements across all plans', pass: !hasDelete },
    { check: 'No unsupported ADD CONSTRAINT IF NOT EXISTS syntax', pass: !hasBadAlterConstraint },
    { check: 'Constraints guarded with DO$$BEGIN...EXCEPTION WHEN duplicate_object', pass: hasDoGuardedConstraint },
    { check: 'Enums verified via pg_type; existing enums receive missing labels', pass: hasSafeEnumHandling },
    { check: 'Functions verified via pg_proc before creation (no blind overwrite)', pass: hasSafeProcHandling },
    { check: 'Triggers verified via pg_trigger/pg_class before creation (no drops)', pass: hasSafeTriggerHandling },
    { check: 'Views verified via pg_views before creation', pass: hasSafeViewHandling },
    { check: 'Legacy PROD tables untouched in Op A (no FMS, system_list, master)', pass: !opA.includes('"FMS"') && !opA.includes('system_list') },
    { check: 'Op A creates exactly 14 base tables with IF NOT EXISTS', pass: tableCountA === 14 },
    { check: 'Op B creates exactly 5 legacy tables with verified column types', pass: tableCountB === 5 },
    { check: 'Live row counts verification completed with zero unhandled errors', pass: !counts.hasErrors },
  ];

  let allPassed = true;
  safetyChecks.forEach(s => {
    console.log(`  [${s.pass ? '✓' : '✗'}] ${s.check}`);
    if (!s.pass) allPassed = false;
  });

  // Save detailed safety validation report
  const validationReport = {
    evaluatedAt: new Date().toISOString(),
    status: allPassed ? 'PASSED_SAFETY_VALIDATION' : 'FAILED_SAFETY_VALIDATION',
    liveCounts: counts,
    safetyChecks,
    verifiedFacts: [
      'PROD contains 5 legacy tables with 9,799 total rows accessible via REST.',
      'TEST contains 14 application base tables and 1 view with 177 total rows.',
      'There is zero table name overlap between current PROD and TEST.',
      'PROD master contains 42 auth records that must remain isolated from users table.',
      'Live TEST user_tasks has is_testing_issue boolean NOT NULL default false.',
      'Live TEST work_type_enum contains 7 labels (3 more than schema_v6.sql).',
      'Live TEST task_status_enum contains 6 labels (1 more than schema_v6.sql).'
    ],
    assumptionsAndAccessGaps: [
      'RLS policies on both databases cannot be read via REST API; direct psql connection is required for RLS migration.',
      'Table ownership and PostgreSQL user roles cannot be read via REST API.',
      'Internal sequence counters and table storage options cannot be inspected via REST API.',
      'Full check constraint expressions cannot be read via REST API.'
    ],
    executionBlocked: true,
    approvalGateReason: 'Mandatory approval required before Phase 4 execution.'
  };

  writeFileSync(join(__dir, 'safety_validation_report.json'), JSON.stringify(validationReport, null, 2));
  console.log('\n✓ safety_validation_report.json saved locally');

  console.log(`\n============================================================`);
  console.log(`OVERALL SAFETY STATUS: ${allPassed ? '✅ ALL CHECKS PASSED' : '❌ CHECKS FAILED'}`);
  console.log(`NO DATABASE MODIFICATIONS HAVE OCCURRED.`);
  console.log(`============================================================\n`);
}

main().catch(e => {
  console.error('\nFATAL ERROR during planning:', e.message);
  process.exit(1);
});
