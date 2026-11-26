-- Repair emitted by the continuous RLS policy proof.
-- Each block fixes an operation the app performs that the database refuses.

-- "profiles": the app performs SELECT as authenticated, but the database refuses it.
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- "bills": the app performs SELECT as anon, but the database refuses it.
GRANT SELECT ON public.bills TO anon;
GRANT ALL ON public.bills TO service_role;

-- "bills": the app performs SELECT as authenticated, but the database refuses it.
GRANT SELECT ON public.bills TO authenticated;
GRANT ALL ON public.bills TO service_role;
