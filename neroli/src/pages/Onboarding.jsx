import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import heroImage from "../assets/images/loginPage.png";
import { useAuth } from "../context/AuthContext.js";

const STEPS = [
  {
    key: "likes",
    title: "What kinds of scents do you usually enjoy?",
    multiple: true,
    options: [
      "Floral",
      "Fresh & citrusy",
      "Sweet & gourmand",
      "Woody & earthy",
      "Clean & soapy",
      "Spicy & warm",
    ],
  },
  {
    key: "avoids",
    title: "Are there any scents you dislike or want to avoid?",
    multiple: true,
    options: [
      "Very sweet scents",
      "Strong floral scents",
      "Heavy or intense scents",
      "Smoky or leathery scents",
      "Powdery scents",
    ],
  },
  {
    key: "notes",
    title: "Which ingredients or notes attract you the most?",
    multiple: true,
    other: true,
    options: ["Vanilla", "Rose", "Bergamot", "Sandalwood", "Jasmine"],
  },
  {
    key: "strength",
    title: "How strong would you like your perfume to be?",
    options: [
      "Light and subtle",
      "Noticeable but not overpowering",
      "Strong and long-lasting",
      "Not sure yet",
    ],
  },
  {
    key: "experience",
    title: "Have you ever made your own perfume before?",
    options: [
      "Never - I'm a complete beginner",
      "I've researched it but haven't tried it",
      "I've tried making one or two",
      "I have some experience",
      "I'm very experienced",
    ],
  },
];

const buttonShadow = "shadow-[0_3px_4px_rgba(34,27,4,0.25)]";

const Splash = ({ title, text, onStart, disabled, error }) => (
  <main className="relative min-h-screen overflow-hidden bg-[#D8D1C1] text-[#221B04]">
    <img
      className="absolute inset-0 size-full object-cover"
      src={heroImage}
      alt=""
      aria-hidden="true"
    />
    <div className="absolute inset-0 bg-[#E8E2D6]/70" />
    <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col items-center px-8 pt-[19vh] text-center">
      <p className="font-serif text-xl">NÉROLI</p>
      <h1 className="mt-[16vh] font-serif text-[40px] uppercase leading-[1.1]">
        {title}
      </h1>
      <p className="mt-9 text-[15px] leading-snug">{text}</p>
      <button
        className={`mt-16 h-13 w-49.25 rounded-full bg-[#696555] text-sm text-[#E8E2D6] disabled:opacity-60 ${buttonShadow}`}
        type="button"
        onClick={onStart}
        disabled={disabled}
      >
        Let's start
      </button>
      {error && (
        <p className="mt-4 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
    </section>
  </main>
);

const Onboarding = () => {
  const navigate = useNavigate();
  const { session, needsOnboarding, completeOnboarding } = useAuth();
  const [params] = useSearchParams();
  const editing = params.get("edit") === "1";
  const saved = session?.user?.user_metadata?.preferences ?? {};
  const knownNotes = STEPS[2].options;
  const [stage, setStage] = useState(editing ? "steps" : "welcome");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(() =>
    editing
      ? {
          ...saved,
          notes: (saved.notes ?? []).filter((note) =>
            knownNotes.includes(note),
          ),
        }
      : {},
  );
  const [other, setOther] = useState(() =>
    editing
      ? ((saved.notes ?? []).find((note) => !knownNotes.includes(note)) ?? "")
      : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!needsOnboarding && !editing && !saving && stage !== "done") {
    return <Navigate to="/" replace />;
  }

  if (stage === "welcome") {
    return (
      <Splash
        title="Let's find your scent"
        text="Tell us a little about what you love so we can personalize your experience and help you create something unique!"
        onStart={() => setStage("steps")}
      />
    );
  }

  if (stage === "done") {
    return (
      <Splash
        title="All done!"
        text="Your profile is ready, and it's time to start exploring the world of perfume-making."
        onStart={() => navigate("/", { replace: true })}
      />
    );
  }

  const step = STEPS[index];
  const selected = answers[step.key] ?? (step.multiple ? [] : "");

  const choose = (option) =>
    setAnswers((current) => {
      if (!step.multiple) return { ...current, [step.key]: option };
      const list = current[step.key] ?? [];
      return {
        ...current,
        [step.key]: list.includes(option)
          ? list.filter((item) => item !== option)
          : [...list, option],
      };
    });

  const isSelected = (option) =>
    step.multiple ? selected.includes(option) : selected === option;

  const finish = async () => {
    setError("");
    setSaving(true);
    const preferences = { ...answers };
    if (other.trim()) {
      preferences.notes = [...(preferences.notes ?? []), other.trim()];
    }
    try {
      await completeOnboarding(preferences);
      if (editing) navigate("/profile", { replace: true });
      else setStage("done");
    } catch {
      setError("Could not save your preferences. Please try again.");
      setSaving(false);
    }
  };

  const next = () => {
    if (index < STEPS.length - 1) setIndex(index + 1);
    else void finish();
  };

  const optionClass = (active) =>
    `flex h-11 w-full items-center rounded-full px-6 text-left text-[15px] ${buttonShadow} ${
      active ? "bg-[#D6D2C6] ring-2 ring-[#696555]" : "bg-[#F4F2EE]"
    }`;

  return (
    <main className="min-h-screen bg-[#EAE3D6] text-[#221B04]">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-8 pb-12 pt-18">
        <div className="flex gap-1.5" aria-hidden="true">
          {STEPS.map((item, position) => (
            <span
              className={`h-0.75 flex-1 rounded-full ${
                position <= index ? "bg-[#D6D2C6]" : "bg-[#F4F2EE]"
              }`}
              key={item.key}
            />
          ))}
        </div>

        <h1 className="mx-auto mt-18 max-w-75 text-center text-2xl leading-[1.2]">
          {step.title}
        </h1>

        <div className="mt-14 space-y-3.5">
          {step.options.map((option) => (
            <button
              className={optionClass(isSelected(option))}
              type="button"
              key={option}
              aria-pressed={isSelected(option)}
              onClick={() => choose(option)}
            >
              {option}
            </button>
          ))}
          {step.other && (
            <label className={optionClass(Boolean(other.trim()))}>
              <span className="shrink-0">Other :</span>
              <input
                className="ml-2 min-w-0 flex-1 bg-transparent outline-none"
                value={other}
                maxLength={40}
                onChange={(event) => setOther(event.target.value)}
                aria-label="Other note"
              />
            </label>
          )}
        </div>

        {error && (
          <p className="mt-4 text-center text-sm text-red-800" role="alert">
            {error}
          </p>
        )}

        <div className="mt-auto flex gap-4 pt-10">
          {(index > 0 || editing) && (
            <button
              className={`h-12.5 flex-1 rounded-full border border-[#D6D2C6] bg-[#EAE3D6] text-sm ${buttonShadow}`}
              type="button"
              onClick={() =>
                index > 0 ? setIndex(index - 1) : navigate("/profile")
              }
              disabled={saving}
            >
              {index > 0 ? "Go back" : "Cancel"}
            </button>
          )}
          <button
            className={`h-12.5 flex-1 rounded-full bg-[#696555] text-sm text-[#E8E2D6] disabled:opacity-60 ${buttonShadow}`}
            type="button"
            onClick={next}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editing && index === STEPS.length - 1
                ? "Save"
                : "Continue"}
          </button>
        </div>
      </section>
    </main>
  );
};

export default Onboarding;
