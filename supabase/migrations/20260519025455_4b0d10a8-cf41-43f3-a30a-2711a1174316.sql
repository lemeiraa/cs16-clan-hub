
-- Update accept_clan_invite to enforce 12-member cap
CREATE OR REPLACE FUNCTION public.accept_clan_invite(_invite_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_clan uuid;
  v_invitee uuid;
  v_count integer;
BEGIN
  SELECT clan_id, invitee_id INTO v_clan, v_invitee
    FROM public.clan_invites
    WHERE id = _invite_id AND status = 'pending';
  IF v_clan IS NULL THEN
    RAISE EXCEPTION 'Invite not found or already processed';
  END IF;
  IF v_invitee <> auth.uid() THEN
    RAISE EXCEPTION 'Only the invitee can accept';
  END IF;
  IF EXISTS (SELECT 1 FROM public.clan_members WHERE user_id = v_invitee) THEN
    RAISE EXCEPTION 'You are already in a clan';
  END IF;

  SELECT count(*) INTO v_count FROM public.clan_members WHERE clan_id = v_clan;
  IF v_count >= 12 THEN
    RAISE EXCEPTION 'Clan is full (max 12 members)';
  END IF;

  INSERT INTO public.clan_members (clan_id, user_id, role) VALUES (v_clan, v_invitee, 'member');
  UPDATE public.clan_invites SET status = 'accepted' WHERE id = _invite_id;
  UPDATE public.clan_invites SET status = 'declined'
    WHERE invitee_id = v_invitee AND status = 'pending' AND id <> _invite_id;
  RETURN v_clan;
END;
$function$;

-- Block new invites for full clans via RLS policy update
DROP POLICY IF EXISTS "Officers send invites" ON public.clan_invites;
CREATE POLICY "Officers send invites"
  ON public.clan_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = inviter_id)
    AND (status = 'pending'::clan_invite_status)
    AND (get_clan_role(clan_id, auth.uid()) = ANY (ARRAY['leader'::clan_role, 'officer'::clan_role]))
    AND (user_clan_id(invitee_id) IS NULL)
    AND ((SELECT count(*) FROM public.clan_members WHERE clan_id = clan_invites.clan_id) < 12)
  );
