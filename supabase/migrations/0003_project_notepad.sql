-- hito · bloc de notas libre por proyecto (apuntes e ideas sueltas)
alter table public.projects
  add column notepad text not null default '' check (char_length(notepad) <= 50000);
