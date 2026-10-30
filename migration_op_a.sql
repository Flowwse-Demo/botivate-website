-- ============================================================
-- OPERATION A (REVISED & AUDITED): TEST → PRODUCTION (SCHEMA ONLY, NO DATA)
-- Strict Safety Design:
-- 1. Zero DROP statements (no DROP TABLE, no DROP TRIGGER, no DROP VIEW).
-- 2. Zero TRUNCATE or DELETE statements.
-- 3. Top-level ENUM modifications (safe from PG transaction block restrictions).
-- 4. Multi-layered Table Synchronization:
--    - CREATE TABLE IF NOT EXISTS
--    - Followed by ALTER TABLE ... ADD COLUMN IF NOT EXISTS for every column
--      (guarantees missing columns are added even if a table pre-existed).
-- 5. Hardened Foreign Keys:
--    - Destructive ON DELETE CASCADE on business data replaced with ON DELETE RESTRICT
--      (prevents user deletion from cascading into wiped systems, tasks, or requests).
-- 6. Row Level Security (RLS) enabled on all 14 new tables to shield password columns.
-- 7. Functions checked against pg_proc prior to creation.
-- 8. Triggers checked against pg_trigger/pg_class prior to creation.
-- 9. Views checked against pg_views prior to creation.
-- 10. Existing Production legacy tables (FMS, system_list, master, dropdown, new_system)
--     are 100% isolated and untouched.
-- ============================================================

-- ─── STEP 1: ENUM TYPES (Transaction-Safe Top-Level Statements) ─────────────

DO $$ BEGIN
  CREATE TYPE public.user_role_enum AS ENUM ('employee','company','hod','admin','superadmin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.system_type_enum AS ENUM ('New System','Existing System');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.environment_enum AS ENUM ('dummy','original');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.system_status_enum AS ENUM ('Active','Development','Maintenance','Inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.work_type_enum AS ENUM (
    'New System',
    'Existing System Edit & Update',
    'Error Received',
    'Complain Report',
    'System Dummy',
    'System Actual',
    'Meeting'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Top-level ADD VALUE statements (safe in PG 12+ outside DO blocks)
ALTER TYPE public.work_type_enum ADD VALUE IF NOT EXISTS 'System Dummy';
ALTER TYPE public.work_type_enum ADD VALUE IF NOT EXISTS 'System Actual';
ALTER TYPE public.work_type_enum ADD VALUE IF NOT EXISTS 'Meeting';

DO $$ BEGIN
  CREATE TYPE public.priority_enum AS ENUM ('High','Medium','Low');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.task_status_enum AS ENUM (
    'Pending','In Progress','In Testing','Completed','On Hold','Cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE public.task_status_enum ADD VALUE IF NOT EXISTS 'In Testing';

DO $$ BEGIN
  CREATE TYPE public.cmp_task_status_enum AS ENUM ('Open','Converted','Closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.team_type_enum AS ENUM ('Development','Support','QA','Operations','Sales','General');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.delegated_task_status AS ENUM ('Pending','In Progress','Completed','Extended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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

-- ─── STEP 4: TABLES & COLUMN SYNCHRONIZATION ────────────────────────────────

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
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role public.user_role_enum default 'employee';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS permission jsonb default '{}'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active boolean default true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at timestamptz default now();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();
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
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS team_type public.team_type_enum default 'General';
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS hod_id bigint;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS is_active boolean default true;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS created_at timestamptz default now();
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();
CREATE INDEX IF NOT EXISTS idx_teams_hod ON public.teams(hod_id);

-- 4.3 team_members
CREATE TABLE IF NOT EXISTS public.team_members (
  id        bigint generated by default as identity primary key,
  team_id   bigint not null references public.teams(id) on delete cascade,
  user_id   bigint not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS team_id bigint;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS user_id bigint;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS joined_at timestamptz default now();
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

-- 4.4 systems (Hardened: ON DELETE RESTRICT prevents wiping systems if company is deleted)
CREATE TABLE IF NOT EXISTS public.systems (
  id               bigint generated by default as identity primary key,
  company_id       bigint not null references public.users(id) on delete restrict,
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
ALTER TABLE public.systems ADD COLUMN IF NOT EXISTS company_id bigint;
ALTER TABLE public.systems ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.systems ADD COLUMN IF NOT EXISTS type_of_system public.system_type_enum default 'New System';
ALTER TABLE public.systems ADD COLUMN IF NOT EXISTS status_of_system public.system_status_enum default 'Active';
ALTER TABLE public.systems ADD COLUMN IF NOT EXISTS department_name text;
ALTER TABLE public.systems ADD COLUMN IF NOT EXISTS website_link text;
ALTER TABLE public.systems ADD COLUMN IF NOT EXISTS system_username text;
ALTER TABLE public.systems ADD COLUMN IF NOT EXISTS system_password text;
ALTER TABLE public.systems ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.systems ADD COLUMN IF NOT EXISTS environment public.environment_enum default 'original';
ALTER TABLE public.systems ADD COLUMN IF NOT EXISTS created_at timestamptz default now();
ALTER TABLE public.systems ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();
ALTER TABLE public.systems ADD COLUMN IF NOT EXISTS company_username text;
ALTER TABLE public.systems ADD COLUMN IF NOT EXISTS company_password text;
ALTER TABLE public.systems ADD COLUMN IF NOT EXISTS dummy_link text;
ALTER TABLE public.systems ADD COLUMN IF NOT EXISTS dummy_username text;
ALTER TABLE public.systems ADD COLUMN IF NOT EXISTS dummy_password text;

-- 4.5 system_requests (Hardened: ON DELETE RESTRICT on company)
CREATE TABLE IF NOT EXISTS public.system_requests (
  id               bigint generated by default as identity primary key,
  company_id       bigint not null references public.users(id) on delete restrict,
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
ALTER TABLE public.system_requests ADD COLUMN IF NOT EXISTS company_id bigint;
ALTER TABLE public.system_requests ADD COLUMN IF NOT EXISTS system_name text;
ALTER TABLE public.system_requests ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.system_requests ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.system_requests ADD COLUMN IF NOT EXISTS priority text default 'Medium';
ALTER TABLE public.system_requests ADD COLUMN IF NOT EXISTS needed_by date;
ALTER TABLE public.system_requests ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE public.system_requests ADD COLUMN IF NOT EXISTS attachment_name text;
ALTER TABLE public.system_requests ADD COLUMN IF NOT EXISTS requested_by bigint;
ALTER TABLE public.system_requests ADD COLUMN IF NOT EXISTS status text default 'Pending';
ALTER TABLE public.system_requests ADD COLUMN IF NOT EXISTS system_id bigint;
ALTER TABLE public.system_requests ADD COLUMN IF NOT EXISTS decided_by bigint;
ALTER TABLE public.system_requests ADD COLUMN IF NOT EXISTS decided_at timestamptz;
ALTER TABLE public.system_requests ADD COLUMN IF NOT EXISTS decision_remarks text;
ALTER TABLE public.system_requests ADD COLUMN IF NOT EXISTS created_at timestamptz default now();
ALTER TABLE public.system_requests ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();
CREATE INDEX IF NOT EXISTS idx_system_requests_company ON public.system_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_system_requests_status  ON public.system_requests(status);

-- 4.6 cmp_task (Hardened: ON DELETE RESTRICT on company)
CREATE TABLE IF NOT EXISTS public.cmp_task (
  id                     bigint generated by default as identity primary key,
  task_name              text not null,
  description            text null,
  company_id             bigint not null references public.users(id) on delete restrict,
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
ALTER TABLE public.cmp_task ADD COLUMN IF NOT EXISTS task_name text;
ALTER TABLE public.cmp_task ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.cmp_task ADD COLUMN IF NOT EXISTS company_id bigint;
ALTER TABLE public.cmp_task ADD COLUMN IF NOT EXISTS system_id bigint;
ALTER TABLE public.cmp_task ADD COLUMN IF NOT EXISTS posted_by bigint;
ALTER TABLE public.cmp_task ADD COLUMN IF NOT EXISTS assigned_member_id bigint;
ALTER TABLE public.cmp_task ADD COLUMN IF NOT EXISTS assigned_by bigint;
ALTER TABLE public.cmp_task ADD COLUMN IF NOT EXISTS priority public.priority_enum default 'Medium';
ALTER TABLE public.cmp_task ADD COLUMN IF NOT EXISTS status public.cmp_task_status_enum default 'Open';
ALTER TABLE public.cmp_task ADD COLUMN IF NOT EXISTS link_of_system text;
ALTER TABLE public.cmp_task ADD COLUMN IF NOT EXISTS attachment_file text;
ALTER TABLE public.cmp_task ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.cmp_task ADD COLUMN IF NOT EXISTS remarks text;
ALTER TABLE public.cmp_task ADD COLUMN IF NOT EXISTS time_required timestamptz;
ALTER TABLE public.cmp_task ADD COLUMN IF NOT EXISTS given_date timestamptz;
ALTER TABLE public.cmp_task ADD COLUMN IF NOT EXISTS expected_date_to_close timestamptz;
ALTER TABLE public.cmp_task ADD COLUMN IF NOT EXISTS converted_task_id bigint;
ALTER TABLE public.cmp_task ADD COLUMN IF NOT EXISTS created_at timestamptz default now();
CREATE INDEX IF NOT EXISTS idx_cmp_task_status    ON public.cmp_task(status);
CREATE INDEX IF NOT EXISTS idx_cmp_task_converted ON public.cmp_task(converted_task_id);
CREATE INDEX IF NOT EXISTS idx_cmp_task_company_id ON public.cmp_task(company_id);
CREATE INDEX IF NOT EXISTS idx_cmp_task_posted_by ON public.cmp_task(posted_by);
CREATE INDEX IF NOT EXISTS idx_cmp_task_assigned_member ON public.cmp_task(assigned_member_id);
CREATE INDEX IF NOT EXISTS idx_cmp_task_system_id ON public.cmp_task(system_id);

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
  assigned_member_1      bigint null references public.users(id) on delete set null,
  assigned_member_2      bigint null references public.users(id) on delete set null,
  assigned_by            bigint null references public.users(id) on delete set null,
  remarks                text null,
  status                 public.task_status_enum not null default 'Pending',
  assigned_at            timestamptz null,
  approved_by            bigint null references public.users(id) on delete set null,
  approved_at            timestamptz null,
  completed_at           timestamptz null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  github_link            text null,
  is_testing_issue       boolean not null default false,
  constraint user_tasks_posted_by_ne_taken_from check (posted_by is distinct from taken_from)
);
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS task_no text;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS given_date timestamptz default now();
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS posted_by bigint;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS taken_from bigint;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS company_id bigint;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS type_of_work public.work_type_enum;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS expected_date_to_close timestamptz;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS description_of_work text;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS system_id bigint;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS link_of_system text;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS attachment_file text;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS priority public.priority_enum default 'Medium';
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS time_required timestamptz;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS assigned_member_1 bigint;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS assigned_member_2 bigint;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS assigned_by bigint;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS remarks text;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS status public.task_status_enum default 'Pending';
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS assigned_at timestamptz;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS approved_by bigint;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS created_at timestamptz default now();
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS github_link text;
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS is_testing_issue boolean not null default false;
CREATE INDEX IF NOT EXISTS idx_user_tasks_status            ON public.user_tasks(status);
CREATE INDEX IF NOT EXISTS idx_user_tasks_assigned_member_1 ON public.user_tasks(assigned_member_1);
CREATE INDEX IF NOT EXISTS idx_user_tasks_assigned_member_2 ON public.user_tasks(assigned_member_2);
CREATE INDEX IF NOT EXISTS idx_user_tasks_company_id        ON public.user_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_posted_by         ON public.user_tasks(posted_by);
CREATE INDEX IF NOT EXISTS idx_user_tasks_taken_from        ON public.user_tasks(taken_from);
CREATE INDEX IF NOT EXISTS idx_user_tasks_system_id         ON public.user_tasks(system_id);

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
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS task_id bigint;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS made_by bigint;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS company_id bigint;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS system_id bigint;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS type_of_product text;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS date_of_delivery date;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS system_link text;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS github_link text;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS system_login_id text;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS system_password text;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS tester_id bigint;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS expected_testing_date date;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS assign_remarks text;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS assigned_by bigint;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS assigned_at timestamptz;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS test_status text;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS tester_remarks text;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS tested_at timestamptz;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS issue_task_id bigint;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS db_status text;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS db_remarks text;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS db_checked_at timestamptz;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS db_checked_by text;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS db_task_id bigint;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS approval_status text;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS approval_remarks text;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS approval_checked_at timestamptz;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS approval_checked_by text;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS approval_task_id bigint;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS inform_status text;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS inform_remarks text;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS inform_checked_at timestamptz;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS inform_checked_by text;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS inform_task_id bigint;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS created_at timestamptz default now();
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS tester_type text;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS delivery_group bigint;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS subtask_id bigint;
ALTER TABLE public.task_testing ADD COLUMN IF NOT EXISTS tested_by text;
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
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS root_task_id bigint;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS parent_subtask_id bigint;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS source_testing_id bigint;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS relation_type text;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS issue_remarks text;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS created_by bigint;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS task_no text;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS given_date timestamptz default now();
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS posted_by bigint;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS taken_from bigint;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS company_id bigint;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS type_of_work public.work_type_enum;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS expected_date_to_close timestamptz;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS description_of_work text;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS system_id bigint;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS link_of_system text;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS github_link text;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS attachment_file text;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS priority public.priority_enum default 'Medium';
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS time_required timestamptz;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS assigned_member_1 bigint;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS assigned_member_2 bigint;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS assigned_by bigint;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS remarks text;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS status public.task_status_enum default 'Pending';
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS assigned_at timestamptz;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS approved_by bigint;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS created_at timestamptz default now();
ALTER TABLE public.task_subtasks ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();
CREATE INDEX IF NOT EXISTS idx_task_subtasks_root           ON public.task_subtasks(root_task_id);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_parent         ON public.task_subtasks(parent_subtask_id);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_status         ON public.task_subtasks(status);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_source_testing ON public.task_subtasks(source_testing_id);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_company_id     ON public.task_subtasks(company_id);

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
ALTER TABLE public.holidays ADD COLUMN IF NOT EXISTS holiday_date date;
ALTER TABLE public.holidays ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.holidays ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.holidays ADD COLUMN IF NOT EXISTS is_recurring boolean default false;
ALTER TABLE public.holidays ADD COLUMN IF NOT EXISTS created_by bigint;
ALTER TABLE public.holidays ADD COLUMN IF NOT EXISTS created_at timestamptz default now();
ALTER TABLE public.holidays ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();
CREATE UNIQUE INDEX IF NOT EXISTS idx_holidays_date_unique ON public.holidays(holiday_date);
CREATE INDEX IF NOT EXISTS idx_holidays_recurring ON public.holidays(is_recurring) WHERE is_recurring = true;

-- 4.11 delegated_tasks (Hardened: ON DELETE RESTRICT on assigned_by / assigned_to prevents task history loss)
CREATE TABLE IF NOT EXISTS public.delegated_tasks (
  id              bigserial primary key,
  serial_number   text unique,
  assigned_by     bigint not null references public.users(id) on delete restrict,
  assigned_to     bigint not null references public.users(id) on delete restrict,
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
ALTER TABLE public.delegated_tasks ADD COLUMN IF NOT EXISTS serial_number text;
ALTER TABLE public.delegated_tasks ADD COLUMN IF NOT EXISTS assigned_by bigint;
ALTER TABLE public.delegated_tasks ADD COLUMN IF NOT EXISTS assigned_to bigint;
ALTER TABLE public.delegated_tasks ADD COLUMN IF NOT EXISTS task_details text;
ALTER TABLE public.delegated_tasks ADD COLUMN IF NOT EXISTS target_date date;
ALTER TABLE public.delegated_tasks ADD COLUMN IF NOT EXISTS target_time text;
ALTER TABLE public.delegated_tasks ADD COLUMN IF NOT EXISTS planned_date date;
ALTER TABLE public.delegated_tasks ADD COLUMN IF NOT EXISTS actual_date date;
ALTER TABLE public.delegated_tasks ADD COLUMN IF NOT EXISTS delay_duration integer;
ALTER TABLE public.delegated_tasks ADD COLUMN IF NOT EXISTS status public.delegated_task_status default 'Pending';
ALTER TABLE public.delegated_tasks ADD COLUMN IF NOT EXISTS remarks text;
ALTER TABLE public.delegated_tasks ADD COLUMN IF NOT EXISTS new_target_date date;
ALTER TABLE public.delegated_tasks ADD COLUMN IF NOT EXISTS new_target_time text;
ALTER TABLE public.delegated_tasks ADD COLUMN IF NOT EXISTS created_at timestamptz default now();
ALTER TABLE public.delegated_tasks ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();
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
ALTER TABLE public.checklist_tasks ADD COLUMN IF NOT EXISTS assigned_by bigint;
ALTER TABLE public.checklist_tasks ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.checklist_tasks ADD COLUMN IF NOT EXISTS task_name text;
ALTER TABLE public.checklist_tasks ADD COLUMN IF NOT EXISTS task_category text default 'single';
ALTER TABLE public.checklist_tasks ADD COLUMN IF NOT EXISTS task_type text;
ALTER TABLE public.checklist_tasks ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.checklist_tasks ADD COLUMN IF NOT EXISTS task_date date;
ALTER TABLE public.checklist_tasks ADD COLUMN IF NOT EXISTS task_time text;
ALTER TABLE public.checklist_tasks ADD COLUMN IF NOT EXISTS days text[] default '{}';
ALTER TABLE public.checklist_tasks ADD COLUMN IF NOT EXISTS status text default 'Pending';
ALTER TABLE public.checklist_tasks ADD COLUMN IF NOT EXISTS remarks text;
ALTER TABLE public.checklist_tasks ADD COLUMN IF NOT EXISTS created_at timestamptz default now();
ALTER TABLE public.checklist_tasks ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();
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
ALTER TABLE public.weekly_calls ADD COLUMN IF NOT EXISTS party_name text;
ALTER TABLE public.weekly_calls ADD COLUMN IF NOT EXISTS responsible_person text;
ALTER TABLE public.weekly_calls ADD COLUMN IF NOT EXISTS responsible_phone text;
ALTER TABLE public.weekly_calls ADD COLUMN IF NOT EXISTS calling_person_name text;
ALTER TABLE public.weekly_calls ADD COLUMN IF NOT EXISTS task_description text;
ALTER TABLE public.weekly_calls ADD COLUMN IF NOT EXISTS calling_days text[] default '{}';
ALTER TABLE public.weekly_calls ADD COLUMN IF NOT EXISTS calling_time text;
ALTER TABLE public.weekly_calls ADD COLUMN IF NOT EXISTS assigned_by bigint;
ALTER TABLE public.weekly_calls ADD COLUMN IF NOT EXISTS status text default 'Pending';
ALTER TABLE public.weekly_calls ADD COLUMN IF NOT EXISTS has_issue boolean;
ALTER TABLE public.weekly_calls ADD COLUMN IF NOT EXISTS customer_said text;
ALTER TABLE public.weekly_calls ADD COLUMN IF NOT EXISTS proof_url text;
ALTER TABLE public.weekly_calls ADD COLUMN IF NOT EXISTS created_at timestamptz default now();
ALTER TABLE public.weekly_calls ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();
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
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS serial_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS party_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS type_of_work text default 'Project';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS value_of_order numeric(14,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_type text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS nda_required boolean default false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS nda_attachment_url text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quotation_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quotation_attachment_url text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status text default 'Submitted';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS remarks text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_by bigint;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at timestamptz default now();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();
CREATE INDEX IF NOT EXISTS idx_orders_status     ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_party_name ON public.orders(party_name);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- ─── STEP 5: ROW LEVEL SECURITY & CREDENTIAL PROTECTION ─────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmp_task ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_testing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegated_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Shield sensitive credential tables from unauthenticated public REST access
REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.systems FROM anon;
REVOKE ALL ON public.task_testing FROM anon;

-- Grant standard access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.systems TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cmp_task TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_testing TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_subtasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.holidays TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delegated_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklist_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_calls TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;

-- Service role retains full bypass privileges automatically

-- ─── STEP 6: TRIGGERS (Safe idempotent check via pg_trigger) ────────────────

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

-- ─── STEP 7: VIEW (Verified via pg_views) ───────────────────────────────────

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

-- ─── STEP 8: METADATA & COMMENTS ────────────────────────────────────────────

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
