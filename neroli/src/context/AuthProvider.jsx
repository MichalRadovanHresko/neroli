import { useEffect, useState } from "react";
import supabase from "../lib/supabase";
import { AuthContext } from "./AuthContext.js";

const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (!error) setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUpNewUser = (email, password, username) =>
    supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username.trim() },
      },
    });

  const signInUser = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{ session, loading, signUpNewUser, signInUser, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
