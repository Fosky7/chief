import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function NavBar(_props: Record<string, unknown> = {}) {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <nav aria-label="Main" className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="text-lg font-bold">
          Chief
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link to="/" className="hover:text-primary" activeOptions={{ exact: true }}>
            Home
          </Link>
          <Link to="/discover" className="hover:text-primary">
            Discover
          </Link>
          <a href="/admin" className="hover:text-primary">
            Admin
          </a>
          {signedIn && (
            <button type="button" onClick={() => supabase.auth.signOut()} className="hover:text-primary">
              Sign out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
