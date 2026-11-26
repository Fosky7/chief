-- Owner columns on bills default to the signed-in user so a row inserted by
-- an authenticated client (or a disposable test fixture) always carries a
-- valid owner without the client having to send a hard-coded user id.
-- Insert policies still require the value to equal auth.uid(), so this does
-- not weaken access rules.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bills' AND column_name = 'requester_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.bills ALTER COLUMN requester_id SET DEFAULT auth.uid()';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bills' AND column_name = 'user_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.bills ALTER COLUMN user_id SET DEFAULT auth.uid()';
  END IF;
END $$;
