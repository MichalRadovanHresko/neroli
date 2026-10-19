import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import heroImage from "../assets/images/loginPage.png";
import { useAuth } from "../context/AuthContext.js";

const DEMO_EMAIL = "test@gmail.com";
const DEMO_PASSWORD = "test123";

const Auth = () => {
  const navigate = useNavigate();
  const { session, loading: sessionLoading, signInUser } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (sessionLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#D8D1C1] text-sm text-[#221B04]/70">
        Restoring your session...
      </main>
    );
  }

  if (session) return <Navigate to="/" replace />;

  const handleDemoLogin = async () => {
    setError("");
    setSubmitting(true);

    try {
      const { error: signInError } = await signInUser(
        DEMO_EMAIL,
        DEMO_PASSWORD,
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
        <div className="mt-[20vh] flex w-full flex-col items-center">
          <button
            className="h-12.5 w-49.5 rounded-full bg-[#D6D2C6]/90 px-5 text-sm text-[#221B04] shadow-[0_3px_6px_rgba(34,27,4,.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#696555] disabled:opacity-60"
            type="button"
            onClick={handleDemoLogin}
            disabled={submitting}
          >
            {submitting ? "Please wait..." : "Log in"}
          </button>
          {error && (
            <p className="mt-4 text-sm text-red-800" role="alert">
              {error}
            </p>
          )}
        </div>
      </section>
    </main>
  );
};

export default Auth;
