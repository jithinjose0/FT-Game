alter table public.runs add column if not exists mode text not null default 'coop' check (mode in ('coop','race'));
alter table public.profiles add column if not exists character text not null default 'hippo' check (character in ('hippo','croc','frog','penguin','capybara','bear'));
