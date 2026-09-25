-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.user_relationships (
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  status character varying NOT NULL,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT user_relationships_pkey PRIMARY KEY (id),
  CONSTRAINT user_relationships_friend_id_fkey FOREIGN KEY (friend_id) REFERENCES public.users(id),
  CONSTRAINT user_relationships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  username character varying NOT NULL UNIQUE,
  email character varying NOT NULL UNIQUE,
  password character varying NOT NULL,
  name character varying,
  pfp character varying,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  hat_size character varying,
  shirt_size character varying,
  pants_size character varying,
  shoe_size character varying,
  dress_size character varying,
  jacket_size character varying,
  ring_size character varying,
  updated_at timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.wishlist_items (
  user_id uuid NOT NULL,
  name character varying NOT NULL,
  description text,
  price double precision,
  url character varying,
  updated_at timestamp with time zone,
  wishlist_id uuid,
  image character varying,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  is_purchased boolean DEFAULT false,
  priority integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  embedding USER-DEFINED,
  claimed_by_user_id uuid,
  claimed_by_guest_session_id uuid,
  claimed_by_name character varying,
  claimed_at timestamp with time zone,
  claimed_under_mode character varying CHECK (claimed_under_mode IS NULL OR claimed_under_mode IN ('blind', 'open')),
  is_contribution boolean NOT NULL DEFAULT false,
  owner_seed_amount double precision CHECK (owner_seed_amount IS NULL OR owner_seed_amount >= 0),
  CONSTRAINT wishlist_items_contribution_not_claimed_check CHECK (is_contribution = false OR (claimed_by_user_id IS NULL AND claimed_by_guest_session_id IS NULL AND claimed_by_name IS NULL)),
  CONSTRAINT wishlist_items_pkey PRIMARY KEY (id),
  CONSTRAINT wishlist_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT wishlist_items_wishlist_id_fkey FOREIGN KEY (wishlist_id) REFERENCES public.wishlists(id),
  CONSTRAINT wishlist_items_claimed_by_user_id_fkey FOREIGN KEY (claimed_by_user_id) REFERENCES public.users(id),
  CONSTRAINT wishlist_items_claimed_by_guest_session_id_fkey FOREIGN KEY (claimed_by_guest_session_id) REFERENCES public.guest_sessions(id)
);
CREATE TABLE public.item_contributions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL,
  contributor_user_id uuid,
  guest_session_id uuid,
  amount double precision NOT NULL CHECK (amount > 0),
  note character varying(280),
  contributed_under_mode character varying CHECK (contributed_under_mode IS NULL OR contributed_under_mode IN ('blind', 'open')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT item_contributions_pkey PRIMARY KEY (id),
  CONSTRAINT item_contributions_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.wishlist_items(id) ON DELETE CASCADE,
  CONSTRAINT item_contributions_contributor_user_id_fkey FOREIGN KEY (contributor_user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT item_contributions_guest_session_id_fkey FOREIGN KEY (guest_session_id) REFERENCES public.guest_sessions(id) ON DELETE CASCADE,
  CONSTRAINT item_contributions_one_identity_check CHECK ((contributor_user_id IS NOT NULL) <> (guest_session_id IS NOT NULL))
);
-- one pledge per person per item; raising a pledge is an edit, not a second row
CREATE UNIQUE INDEX item_contributions_one_per_user_idx ON public.item_contributions (item_id, contributor_user_id) WHERE contributor_user_id IS NOT NULL;
CREATE UNIQUE INDEX item_contributions_one_per_guest_idx ON public.item_contributions (item_id, guest_session_id) WHERE guest_session_id IS NOT NULL;
CREATE INDEX item_contributions_item_id_idx ON public.item_contributions (item_id);
CREATE TABLE public.guest_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wishlist_id uuid NOT NULL,
  display_name character varying NOT NULL,
  email character varying,
  token_hash character varying NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  last_seen_at timestamp with time zone,
  CONSTRAINT guest_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT guest_sessions_wishlist_id_fkey FOREIGN KEY (wishlist_id) REFERENCES public.wishlists(id)
);
CREATE TABLE public.wishlists (
  visibility_mode character varying NOT NULL DEFAULT 'blind'::character varying CHECK (visibility_mode IN ('blind', 'open')),
  use_item_colors boolean NOT NULL DEFAULT false,
  default_view character varying NOT NULL DEFAULT 'grid'::character varying,
  due_date date,
  user_id uuid NOT NULL,
  title character varying NOT NULL,
  description text,
  color text,
  updated_at timestamp with time zone,
  image character varying,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  is_public boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  thumbnail_type character varying DEFAULT 'icon'::character varying,
  thumbnail_icon character varying,
  thumbnail_image text,
  CONSTRAINT wishlists_pkey PRIMARY KEY (id),
  CONSTRAINT wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.saved_wishlists (
  user_id uuid NOT NULL,
  wishlist_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT saved_wishlists_pkey PRIMARY KEY (id),
  CONSTRAINT saved_wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT saved_wishlists_wishlist_id_fkey FOREIGN KEY (wishlist_id) REFERENCES public.wishlists(id)
);