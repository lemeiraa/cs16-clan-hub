
-- ============ ENUMS ============
CREATE TYPE public.friendship_status AS ENUM ('pending', 'accepted', 'blocked');
CREATE TYPE public.clan_role AS ENUM ('leader', 'officer', 'member');
CREATE TYPE public.clan_invite_status AS ENUM ('pending', 'accepted', 'declined');

-- ============ FRIENDSHIPS ============
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  addressee_id uuid NOT NULL,
  status public.friendship_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (requester_id <> addressee_id)
);
-- Unique pair regardless of direction
CREATE UNIQUE INDEX friendships_pair_uniq ON public.friendships
  (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));
CREATE INDEX friendships_addressee_idx ON public.friendships(addressee_id, status);
CREATE INDEX friendships_requester_idx ON public.friendships(requester_id, status);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER friendships_touch BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Helper: are two users friends (accepted)?
CREATE OR REPLACE FUNCTION public.are_friends(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships
    WHERE status = 'accepted'
      AND ((requester_id = _a AND addressee_id = _b)
        OR (requester_id = _b AND addressee_id = _a))
  )
$$;

CREATE POLICY "Users see their own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users send friend requests as themselves"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id AND status = 'pending');

CREATE POLICY "Addressee can update status"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = addressee_id);

CREATE POLICY "Either party can remove friendship"
  ON public.friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- ============ CLANS ============
CREATE TABLE public.clans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  tag text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  avatar_url text,
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (char_length(name) BETWEEN 2 AND 40),
  CHECK (char_length(tag) BETWEEN 2 AND 8),
  CHECK (char_length(description) <= 500)
);
ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER clans_touch BEFORE UPDATE ON public.clans
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ CLAN MEMBERS ============
CREATE TABLE public.clan_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.clan_role NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clan_id, user_id),
  UNIQUE (user_id) -- one clan per user
);
CREATE INDEX clan_members_clan_idx ON public.clan_members(clan_id);
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;

-- Helpers
CREATE OR REPLACE FUNCTION public.is_clan_member(_clan uuid, _user uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.clan_members WHERE clan_id = _clan AND user_id = _user)
$$;

CREATE OR REPLACE FUNCTION public.get_clan_role(_clan uuid, _user uuid)
RETURNS public.clan_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.clan_members WHERE clan_id = _clan AND user_id = _user
$$;

CREATE OR REPLACE FUNCTION public.user_clan_id(_user uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT clan_id FROM public.clan_members WHERE user_id = _user
$$;

-- Trigger: when clan created, owner becomes leader
CREATE OR REPLACE FUNCTION public.create_clan_owner_member()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.clan_members (clan_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'leader');
  RETURN NEW;
END;
$$;
CREATE TRIGGER clans_add_owner_member
  AFTER INSERT ON public.clans
  FOR EACH ROW EXECUTE FUNCTION public.create_clan_owner_member();

-- Clan policies
CREATE POLICY "Clans public read"
  ON public.clans FOR SELECT USING (true);

CREATE POLICY "Authenticated users create clans they own"
  ON public.clans FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Leader updates clan"
  ON public.clans FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Leader deletes clan"
  ON public.clans FOR DELETE
  USING (auth.uid() = owner_id);

-- Clan members policies
CREATE POLICY "Clan members public read"
  ON public.clan_members FOR SELECT USING (true);

-- INSERT handled by trigger (owner) and accept-invite function (security definer).
-- No INSERT policy granted to anon/authenticated to prevent self-join.

CREATE POLICY "Members leave or leader/officer removes"
  ON public.clan_members FOR DELETE
  USING (
    auth.uid() = user_id AND role <> 'leader'
    OR public.get_clan_role(clan_id, auth.uid()) IN ('leader', 'officer')
       AND role <> 'leader'
  );

CREATE POLICY "Leader updates roles"
  ON public.clan_members FOR UPDATE
  USING (public.get_clan_role(clan_id, auth.uid()) = 'leader');

-- ============ CLAN INVITES ============
CREATE TABLE public.clan_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL,
  invitee_id uuid NOT NULL,
  status public.clan_invite_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clan_id, invitee_id, status)
);
CREATE INDEX clan_invites_invitee_idx ON public.clan_invites(invitee_id, status);
ALTER TABLE public.clan_invites ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER clan_invites_touch BEFORE UPDATE ON public.clan_invites
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "Invitee and inviter see invites"
  ON public.clan_invites FOR SELECT
  USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);

CREATE POLICY "Officers send invites"
  ON public.clan_invites FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = inviter_id
    AND status = 'pending'
    AND public.get_clan_role(clan_id, auth.uid()) IN ('leader', 'officer')
    AND public.user_clan_id(invitee_id) IS NULL
  );

CREATE POLICY "Invitee updates invite"
  ON public.clan_invites FOR UPDATE
  USING (auth.uid() = invitee_id);

CREATE POLICY "Invitee or inviter delete invite"
  ON public.clan_invites FOR DELETE
  USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);

-- Accept invite: security definer adds membership
CREATE OR REPLACE FUNCTION public.accept_clan_invite(_invite_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_clan uuid;
  v_invitee uuid;
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
  INSERT INTO public.clan_members (clan_id, user_id, role) VALUES (v_clan, v_invitee, 'member');
  UPDATE public.clan_invites SET status = 'accepted' WHERE id = _invite_id;
  -- decline any other pending invites for this user
  UPDATE public.clan_invites SET status = 'declined'
    WHERE invitee_id = v_invitee AND status = 'pending' AND id <> _invite_id;
  RETURN v_clan;
END;
$$;

-- ============ DIRECT MESSAGES ============
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  CHECK (sender_id <> recipient_id),
  CHECK (char_length(content) BETWEEN 1 AND 2000)
);
CREATE INDEX dm_pair_idx ON public.direct_messages(LEAST(sender_id,recipient_id), GREATEST(sender_id,recipient_id), created_at DESC);
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read DMs"
  ON public.direct_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Friends send DMs"
  ON public.direct_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.are_friends(sender_id, recipient_id)
  );

CREATE POLICY "Recipient marks read"
  ON public.direct_messages FOR UPDATE
  USING (auth.uid() = recipient_id);

-- ============ CLAN MESSAGES ============
CREATE TABLE public.clan_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (char_length(content) BETWEEN 1 AND 2000)
);
CREATE INDEX clan_messages_clan_idx ON public.clan_messages(clan_id, created_at DESC);
ALTER TABLE public.clan_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clan members read messages"
  ON public.clan_messages FOR SELECT
  USING (public.is_clan_member(clan_id, auth.uid()));

CREATE POLICY "Clan members send messages"
  ON public.clan_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_clan_member(clan_id, auth.uid())
  );

CREATE POLICY "Sender or leader deletes clan message"
  ON public.clan_messages FOR DELETE
  USING (
    auth.uid() = sender_id
    OR public.get_clan_role(clan_id, auth.uid()) = 'leader'
  );

-- ============ REALTIME ============
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
ALTER TABLE public.clan_messages REPLICA IDENTITY FULL;
ALTER TABLE public.friendships REPLICA IDENTITY FULL;
ALTER TABLE public.clan_invites REPLICA IDENTITY FULL;
ALTER TABLE public.clan_members REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clan_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clan_invites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clan_members;
