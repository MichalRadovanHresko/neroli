import { useEffect, useState } from "react";
import { randomIconKey } from "../lib/avatars";
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

  const signInUser = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUpUser = (email, password, name) =>
    supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          name,
          username: name,
          needs_onboarding: true,
          default_icon: randomIconKey(),
        },
      },
    });

  const isPremium = session?.user?.user_metadata?.is_premium === true;

  const needsOnboarding =
    session?.user?.user_metadata?.needs_onboarding === true;

  const completeOnboarding = async (preferences) => {
    const { error } = await supabase.auth.updateUser({
      data: { needs_onboarding: false, preferences },
    });
    if (error) throw error;
  };

  const setPremium = async (value) => {
    const { error } = await supabase.auth.updateUser({
      data: { is_premium: value },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        isPremium,
        needsOnboarding,
        completeOnboarding,
        setPremium,
        signInUser,
        signUpUser,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
