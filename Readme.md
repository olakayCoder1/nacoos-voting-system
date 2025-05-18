create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
is_active
   created_at timestamp with time zone default now() ); 

create table candidates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
is_active
  category_id uuid references categories(id) on delete cascade,
  photo_url text,  -- optional, if you're displaying photos
  created_at timestamp with time zone default now()
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,  -- Reference your users table if needed
  candidate_id uuid references candidates(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique (user_id, category_id) -- ensures one vote per user per category
);