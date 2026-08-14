
REVOKE ALL ON FUNCTION public.subscription_benefit_available(uuid,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.subscription_benefit_available(uuid,text) TO service_role;
