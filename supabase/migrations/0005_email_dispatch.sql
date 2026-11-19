-- hito · envío diario de los correos de alerta (después de generate_alerts, 07:10 de Bogotá)
-- Llama a la Edge Function `send-alerts` con pg_net. Los datos de conexión viven en Vault,
-- nunca en este archivo. Mientras no existan los secretos `project_url` y `service_role_key`,
-- la función no hace nada.

create extension if not exists pg_net;

create or replace function public.dispatch_email_alerts() returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
  v_url text;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
  if v_key is null or v_url is null then
    return;
  end if;

  perform net.http_post(
    url := rtrim(v_url, '/') || '/functions/v1/send-alerts',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := '{}'::jsonb
  );
end;
$$;

revoke all on function public.dispatch_email_alerts() from public, anon, authenticated;
grant execute on function public.dispatch_email_alerts() to service_role;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'hito-send-email-alerts') then
    perform cron.unschedule('hito-send-email-alerts');
  end if;
  perform cron.schedule('hito-send-email-alerts', '10 12 * * *', 'select public.dispatch_email_alerts()');
end
$$;
