import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import heroImage from "../assets/images/background-image.png";
import { useAuth } from "../context/AuthContext.js";

const DEMO_EMAIL = "test@gmail.com";
const DEMO_PASSWORD = "test123";

const Auth = ({ mode }) => {
  const isSignup = mode === "signup";
  const navigate = useNavigate();
  const {
    session,
    loading: sessionLoading,
    signUpNewUser,
    signInUser,
  } = useAuth();
  const [email, setEmail] = useState(isSignup ? "" : DEMO_EMAIL);
  const [password, setPassword] = useState(isSignup ? "" : DEMO_PASSWORD);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState("");

  if (sessionLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#D8D1C1] text-sm text-[#221B04]/70">
        Restoring your session...
      </main>
    );
  }

  if (session) return <Navigate to="/" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const result = isSignup
        ? await signUpNewUser(email, password, username)
        : await signInUser(DEMO_EMAIL, DEMO_PASSWORD);

      if (result.error) {
        setError(result.error.message);
      } else if (isSignup && !result.data.session) {
        setMessage("Check your email to confirm your account, then sign in.");
      } else {
        navigate("/", { replace: true });
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#D8D1C1] text-[#221B04]">
      <img
        className="absolute inset-0 size-full scale-[1.03] object-cover object-center blur-[1px]"
        src={heroImage}
        alt=""
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[#D8D1C1]/60 backdrop-blur-[2px]" />
      <section
        className={`relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col items-center px-6 text-center ${isSignup ? "justify-center py-12" : "pt-[32vh]"}`}
      >
        <Link
          className="font-serif text-[60px] leading-none no-underline"
          to="/signup"
          aria-label="Neroli home"
        >
          NÉROLI
        </Link>
        <p className="mt-3 font-serif text-lg">“Your scent, your story”</p>
        {isSignup && (
          <>
            <h1 className="mt-12 font-serif text-3xl">Create your account</h1>
            <p className="mt-2 text-sm text-[#221B04]/70">
              Sign up to save your scents and recipes.
            </p>
          </>
        )}

        <form
          className={`w-full text-center ${isSignup ? "mt-8 space-y-4" : "mt-[20vh]"}`}
          onSubmit={handleSubmit}
        >
          {isSignup && (
            <div className="space-y-4 text-left">
              <label className="block text-sm">
                Email
                <input
                  className="mt-2 h-12 w-full rounded-xl bg-[#F4F2EE] px-4 outline-none focus-visible:ring-2 focus-visible:ring-[#696555]"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label className="block text-sm">
                Password
                <input
                  className="mt-2 h-12 w-full rounded-xl bg-[#F4F2EE] px-4 outline-none focus-visible:ring-2 focus-visible:ring-[#696555]"
                  type="password"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              <label className="block text-sm">
                Username
                <input
                  className="mt-2 h-12 w-full rounded-xl bg-[#F4F2EE] px-4 outline-none focus-visible:ring-2 focus-visible:ring-[#696555]"
                  type="text"
                  autoComplete="username"
                  minLength={3}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />
              </label>
            </div>
          )}
          <button
            className={`h-12.5 rounded-full bg-[#D6D2C6] px-5 text-sm text-[#221B04] shadow-[0_3px_6px_rgba(34,27,4,.18)] disabled:opacity-60 ${isSignup ? "w-full" : "w-49.5"}`}
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Please wait..."
              : isSignup
                ? "Create account"
                : "Use demo login"}
          </button>
          {error && (
            <p className="text-sm text-red-800" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-[#221B04]/75" role="status">
              {message}
            </p>
          )}
        </form>
        <p className={`text-sm ${isSignup ? "mt-8" : "mt-5"}`}>
          {isSignup ? "Already have an account? " : "Don’t have an account? "}
          <Link
            className="underline underline-offset-2"
            to={isSignup ? "/signin" : "/signup"}
          >
            {isSignup ? "Sign in" : "Sign up"}
          </Link>
        </p>
      </section>
    </main>
  );
};

export default Auth;
