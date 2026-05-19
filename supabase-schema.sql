-- Run this in the Supabase SQL Editor (supabase.com → your project → SQL Editor)

-- Profiles table (links to auth.users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  role text not null default 'member'  -- 'admin' or 'member'
);

-- Categories
create table categories (
  id serial primary key,
  name text not null,
  icon text default '💰',
  created_at timestamptz default now()
);

-- Monthly budgets per category
create table budgets (
  id serial primary key,
  category_id int references categories(id) on delete cascade,
  month int not null check (month between 1 and 12),
  year int not null,
  amount decimal(10,2) not null default 0,
  unique(category_id, month, year)
);

-- Expenses
create table expenses (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete cascade,
  category_id int references categories(id),
  amount decimal(10,2) not null,
  note text,
  date date not null default current_date,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table categories enable row level security;
alter table budgets enable row level security;
alter table expenses enable row level security;

-- RLS Policies
create policy "Authenticated can read profiles" on profiles for select using (auth.uid() is not null);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Authenticated can read categories" on categories for select using (auth.uid() is not null);
create policy "Authenticated can manage categories" on categories for all using (auth.uid() is not null);

create policy "Authenticated can read budgets" on budgets for select using (auth.uid() is not null);
create policy "Authenticated can manage budgets" on budgets for all using (auth.uid() is not null);

create policy "Authenticated can read all expenses" on expenses for select using (auth.uid() is not null);
create policy "Users can insert own expenses" on expenses for insert with check (auth.uid() = user_id);
create policy "Users can update own expenses" on expenses for update using (auth.uid() = user_id);
create policy "Users can delete own expenses" on expenses for delete using (auth.uid() = user_id);

-- Seed categories
insert into categories (name, icon) values
  ('Groceries', '🛒'),
  ('Dining Out', '🍽️'),
  ('Gas', '⛽'),
  ('Clothing', '👕'),
  ('Personal Care', '🧴'),
  ('Entertainment', '🎮'),
  ('Household', '🏠'),
  ('Transport', '🚗'),
  ('Healthcare', '💊'),
  ('Other', '📦');

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 'member');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
