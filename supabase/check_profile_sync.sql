-- Check for triggers on the auth.users table
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND event_object_schema = 'auth';

-- Check for functions that might be used by triggers
SELECT 
    routine_name, 
    routine_definition 
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name ILIKE '%profile%';
