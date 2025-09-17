-- Fix: use integer for ROW_COUNT diagnostic logging instead of RECORD
CREATE OR REPLACE FUNCTION public.auto_approve_pennyekart_free()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    pennyekart_free_category_id UUID;
    updated_count integer;
BEGIN
    -- Get the category ID for "Pennyekart Free Registration"
    SELECT id INTO pennyekart_free_category_id 
    FROM public.categories 
    WHERE name_english = 'Pennyekart Free Registration';
    
    -- If category not found, exit
    IF pennyekart_free_category_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Auto-approve registrations that are pending for more than 3 days
    UPDATE public.registrations 
    SET 
        status = 'approved',
        approved_date = NOW(),
        approved_by = 'auto_system'
    WHERE 
        category_id = pennyekart_free_category_id 
        AND status = 'pending'
        AND created_at <= NOW() - INTERVAL '3 days';
        
    -- Log how many records were updated
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Auto-approved % Pennyekart Free Registration records', updated_count;
END;
$$;

-- Keep helper wrapper to report results
CREATE OR REPLACE FUNCTION public.process_auto_approvals()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    result json;
    approved_count integer;
BEGIN
    -- Call the auto-approval function
    PERFORM public.auto_approve_pennyekart_free();
    
    -- Get count of recently auto-approved records (last hour)
    SELECT count(*) INTO approved_count
    FROM public.registrations r
    JOIN public.categories c ON r.category_id = c.id
    WHERE c.name_english = 'Pennyekart Free Registration'
      AND r.approved_by = 'auto_system'
      AND r.approved_date >= NOW() - INTERVAL '1 hour';
    
    -- Return result
    result := json_build_object(
        'success', true,
        'approved_count', approved_count,
        'processed_at', NOW()
    );
    
    RETURN result;
END;
$$;