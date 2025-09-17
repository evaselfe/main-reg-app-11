-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to run auto-approval check daily at 9:00 AM
SELECT cron.schedule(
    'auto-approve-pennyekart-free',
    '0 9 * * *', -- Every day at 9:00 AM
    $$
    SELECT public.process_auto_approvals();
    $$
);