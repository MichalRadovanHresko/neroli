import { useEffect, useState } from "react";
import { randomIconKey } from "../lib/avatars";
import supabase from "../lib/supabase";
import { AuthContext } from "./AuthContext.js";

// Manage the Supabase session and provide account actions to the app.

const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the existing session and subscribe to later auth changes.
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

  // Keep the sign-in action in one place for screens to reuse.
  const signInUser = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  // Create accounts with the profile defaults needed by onboarding.
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

  // Derive account flags from metadata saved on the active user.
  const isPremium = session?.user?.user_metadata?.is_premium === true;

  const needsOnboarding =
    session?.user?.user_metadata?.needs_onboarding === true;

  // Save preferences and mark onboarding as complete in user metadata.
  const completeOnboarding = async (preferences) => {
    const { error } = await supabase.auth.updateUser({
      data: { needs_onboarding: false, preferences },
    });
    if (error) throw error;
  };

  // Update the premium flag through Supabase authentication metadata.
  const setPremium = async (value) => {
    const { error } = await supabase.auth.updateUser({
      data: { is_premium: value },
    });
    if (error) throw error;
  };

  // End the current Supabase session.
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // Make session state and account actions available to nested screens.
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
