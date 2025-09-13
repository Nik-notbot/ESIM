-- Проверка текущих RLS политик для таблицы qr_codes

-- 1. Проверяем статус RLS
SELECT 'RLS Status' as info, 
       schemaname, 
       tablename, 
       rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'qr_codes';

-- 2. Проверяем все политики
SELECT 'Current Policies' as info,
       policyname,
       permissive,
       roles,
       cmd,
       qual,
       with_check
FROM pg_policies 
WHERE tablename = 'qr_codes'
ORDER BY policyname;

-- 3. Проверяем права доступа
SELECT 'Access Rights' as info,
       grantee,
       privilege_type,
       is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'qr_codes'
ORDER BY grantee, privilege_type;