export type User = {
  id: string;
  email: string;
  username: string;
  name?: string;
  pfp?:string
  hat_size?: string | null;
  shirt_size?: string | null;
  pants_size?: string | null;
  shoe_size?: string | null;
  ring_size?: string | null;
  dress_size?: string | null;
  jacket_size?: string | null;
};

export default function user () {}