
-- Restrict function execution
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Tighten anon order creation
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

CREATE POLICY "Guests can create pending orders"
  ON public.orders FOR INSERT
  TO anon
  WITH CHECK (
    status = 'pending'
    AND user_id IS NULL
    AND char_length(contact_email) BETWEEN 5 AND 255
    AND char_length(nick) BETWEEN 1 AND 64
    AND amount_brl > 0
    AND amount_brl <= 10000
  );

CREATE POLICY "Authenticated users create their orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (
    status = 'pending'
    AND (user_id IS NULL OR user_id = auth.uid())
    AND char_length(contact_email) BETWEEN 5 AND 255
    AND char_length(nick) BETWEEN 1 AND 64
    AND amount_brl > 0
    AND amount_brl <= 10000
  );
