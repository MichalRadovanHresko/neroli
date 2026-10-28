import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import heroImage from "../assets/images/loginPage.png";
import { useAuth } from "../context/AuthContext.js";

const DEMO_EMAIL = "test@gmail.com";
const DEMO_PASSWORD = "test123";

const inputClass =
  "h-12 w-full rounded-full bg-[#F7F5F0]/90 px-5 text-sm text-[#221B04] outline-none placeholder:text-[#696555] focus-visible:outline-2 focus-visible:outline-[#696555]";

const Auth = () => {
  const navigate = useNavigate();
  const {
    session,
    loading: sessionLoading,
    signInUser,
    signUpUser,
  } = useAuth();
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isSignUp = mode === "signup";

  if (sessionLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#D8D1C1] text-sm text-[#221B04]/70">
        Restoring your session...
      </main>
    );
  }

  if (session) return <Navigate to="/" replace />;

  const submit = async (credentials) => {
    setError("");
    setNotice("");
    setSubmitting(true);

    try {
      if (isSignUp && !credentials.demo) {
        const { data, error: signUpError } = await signUpUser(
          credentials.email,
          credentials.password,
          credentials.name,
        );
        if (signUpError) setError(signUpError.message);
        else if (data.session) navigate("/", { replace: true });
        else {
          setNotice("Account created. Check your email to confirm it.");
          setMode("signin");
        }
        return;
      }

      const { error: signInError } = await signInUser(
        credentials.email,
        credentials.password,
      );
      if (signInError) setError(signInError.message);
      else navigate("/", { replace: true });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#D8D1C1] text-[#221B04]">
      <img
        className="absolute inset-0 size-full scale-[1.03] object-cover object-center"
        src={heroImage}
        alt=""
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[#D8D1C1]/25" />
      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col items-center px-6 pt-[32vh] text-center">
        <h1 className="font-serif text-[60px] leading-none">NÉROLI</h1>
        <p className="mt-3 font-serif text-lg">“Your scent, your story”</p>
        <form
          className="mt-[10vh] flex w-full flex-col items-center gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit({ email: email.trim(), password, name: name.trim() });
          }}
        >
          {isSignUp && (
            <input
              className={inputClass}
              type="text"
              placeholder="Nickname"
              autoComplete="nickname"
              maxLength={30}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          )}
          <input
            className={inputClass}
            type="email"
            placeholder="Email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className={inputClass}
            type="password"
            placeholder="Password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            minLength={6}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            className="mt-2 h-12.5 w-49.5 rounded-full bg-[#D6D2C6]/90 px-5 text-sm text-[#221B04] shadow-[0_3px_6px_rgba(34,27,4,.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#696555] disabled:opacity-60"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Please wait..."
              : isSignUp
                ? "Create account"
                : "Log in"}
          </button>
          {error && (
            <p className="text-sm text-red-800" role="alert">
              {error}
            </p>
          )}
          {notice && <p className="text-sm text-[#221B04]">{notice}</p>}
          <button
            className="text-xs underline underline-offset-2"
            type="button"
            onClick={() => {
              setMode(isSignUp ? "signin" : "signup");
              setError("");
              setNotice("");
            }}
          >
            {isSignUp ? "Already have an account?" : "Create an account"}
          </button>
          {!isSignUp && (
            <button
              className="text-xs text-[#221B04]/70 underline underline-offset-2"
              type="button"
              onClick={() =>
                submit({
                  email: DEMO_EMAIL,
                  password: DEMO_PASSWORD,
                  demo: true,
                })
              }
              disabled={submitting}
            >
              Use demo account
            </button>
          )}
        </form>
      </section>
    </main>
  );
};

export default Auth;
