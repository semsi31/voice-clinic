update public.profiles
set full_name = 'Gülay Deniz'
where full_name is null
   or full_name like '%@%';
