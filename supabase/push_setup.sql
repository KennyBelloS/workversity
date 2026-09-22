-- ============================================================================
-- Activar el envío automático de notificaciones push (una vez)
-- Antes: 1) ejecutar schema.sql  2) desplegar la función enviar-recordatorios
-- Reemplaza TU-REF y TU_CRON_SECRET (el mismo valor del secreto CRON_SECRET).
-- ============================================================================
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('workversity-recordatorios')
where exists (select 1 from cron.job where jobname = 'workversity-recordatorios');

select cron.schedule(
  'workversity-recordatorios',
  '* * * * *',                       -- cada minuto
  $$
  select net.http_post(
    url := 'https://TU-REF.supabase.co/functions/v1/enviar-recordatorios',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', 'TU_CRON_SECRET'),
    body := '{}'::jsonb
  );
  $$
);
