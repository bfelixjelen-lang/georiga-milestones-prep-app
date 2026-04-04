import React, { useEffect, useMemo, useState } from "react";
import {
  getQuestionsForSubject,
  getRandomQuestions,
} from "../questionBank";
import { scoreAssessment, validateAnswer } from "../assessmentEngine";

const SUBJECT_OPTIONS = [
  { key: "ela", label: "ELA" },
  { key: "math", label: "Math" },
  { key: "science", label: "Science" },
  { key: "socialStudies", label: "Social Studies" },
];

const EXAM_DURATION_SECONDS = 15 * 60;

const STORAGE_KEYS = {
  subject: "milestones_subject",
  index: "milestones_index",
  responses: "milestones_responses",
  submittedIds: "milestones_submitted_ids",
  flaggedIds: "milestones_flagged_ids",
  examStarted: "milestones_exam_started",
  examComplete: "milestones_exam_complete",
  timeRemaining: "milestones_time_remaining",
  questionCount: "milestones_question_count",
  sessionQuestions: "milestones_session_questions",
};

function getStoredJSON(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function getStoredNumber(key, fallback) {
  const saved = localStorage.getItem(key);
  const parsed = Number(saved);
  return saved !== null && !Number.isNaN(parsed) ? parsed : fallback;
}

function getStoredBoolean(key, fallback = false) {
  const saved = localStorage.getItem(key);
  if (saved === null) return fallback;
  return saved === "true";
}

export default function SimulationShell() {
  const [subject, setSubject] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.subject) || "ela";
  });

  const [index, setIndex] = useState(() =>
    getStoredNumber(STORAGE_KEYS.index, 0)
  );

  const [responses, setResponses] = useState(() =>
    getStoredJSON(STORAGE_KEYS.responses, {})
  );

  const [submittedIds, setSubmittedIds] = useState(() =>
    getStoredJSON(STORAGE_KEYS.submittedIds, {})
  );

  const [flaggedIds, setFlaggedIds] = useState(() =>
    getStoredJSON(STORAGE_KEYS.flaggedIds, {})
  );

  const [examStarted, setExamStarted] = useState(() =>
    getStoredBoolean(STORAGE_KEYS.examStarted, false)
  );

  const [examComplete, setExamComplete] = useState(() =>
    getStoredBoolean(STORAGE_KEYS.examComplete, false)
  );

  const [timeRemaining, setTimeRemaining] = useState(() =>
    getStoredNumber(STORAGE_KEYS.timeRemaining, EXAM_DURATION_SECONDS)
  );

const [questionCount, setQuestionCount] = useState(() =>
  getStoredNumber(STORAGE_KEYS.questionCount, 10)
);

const [sessionQuestions, setSessionQuestions] = useState(() =>
  getStoredJSON(STORAGE_KEYS.sessionQuestions, [])
);

  const questions = useMemo(() => {
    if (sessionQuestions.length > 0) {
      return sessionQuestions;
    }

    return getQuestionsForSubject(subject);
  }, [sessionQuestions, subject]);

  const safeIndex =
    questions.length === 0 ? 0 : Math.min(index, questions.length - 1);

  const currentQuestion = questions[safeIndex];

  const results = useMemo(() => {
    return scoreAssessment(questions, responses);
  }, [questions, responses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.subject, subject);
  }, [subject]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.index, String(safeIndex));
  }, [safeIndex]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.responses, JSON.stringify(responses));
  }, [responses]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.submittedIds,
      JSON.stringify(submittedIds)
    );
  }, [submittedIds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.flaggedIds, JSON.stringify(flaggedIds));
  }, [flaggedIds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.examStarted, String(examStarted));
  }, [examStarted]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.examComplete, String(examComplete));
  }, [examComplete]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.timeRemaining, String(timeRemaining));
  }, [timeRemaining]);

  useEffect(() => {
    if (questions.length === 0) {
      setIndex(0);
      return;
    }

    if (index > questions.length - 1) {
      setIndex(questions.length - 1);
    }
  }, [index, questions]);
useEffect(() => {
  localStorage.setItem(STORAGE_KEYS.questionCount, String(questionCount));
}, [questionCount]);

useEffect(() => {
  localStorage.setItem(
    STORAGE_KEYS.sessionQuestions,
    JSON.stringify(sessionQuestions)
  );
}, [sessionQuestions]);

  useEffect(() => {
    if (!examStarted || examComplete) return;

    const timer = window.setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setExamComplete(true);
          setExamStarted(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [examStarted, examComplete]);

  function formatTime(totalSeconds) {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function setResponse(value) {
    if (!currentQuestion || examComplete) return;

    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  }

  function submitCurrent() {
    if (!currentQuestion) return;

    setSubmittedIds((prev) => ({
      ...prev,
      [currentQuestion.id]: true,
    }));
  }

  function toggleFlag(questionId) {
    setFlaggedIds((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  }

  function jumpToQuestion(targetIndex) {
    setIndex(targetIndex);
  }

  function nextQuestion() {
    setIndex((prev) => Math.min(prev + 1, questions.length - 1));
  }

  function prevQuestion() {
    setIndex((prev) => Math.max(prev - 1, 0));
  }

  function startExam() {
    const selectedQuestions = getRandomQuestions(subject, questionCount);

    setSessionQuestions(selectedQuestions);
    setIndex(0);
    setResponses({});
    setSubmittedIds({});
    setFlaggedIds({});
    setExamStarted(true);
    setExamComplete(false);
    setTimeRemaining(EXAM_DURATION_SECONDS);
  }

  function finishExam() {
    setExamComplete(true);
    setExamStarted(false);
  }

  function resetSession(nextSubject = subject) {
    setSubject(nextSubject);
    setQuestionCount(10);
    setSessionQuestions([]);
    setIndex(0);
    setResponses({});
    setSubmittedIds({});
    setFlaggedIds({});
    setExamStarted(false);
    setExamComplete(false);
    setTimeRemaining(EXAM_DURATION_SECONDS);

    localStorage.setItem(STORAGE_KEYS.subject, nextSubject);
    localStorage.setItem(STORAGE_KEYS.index, "0");
    localStorage.setItem(STORAGE_KEYS.responses, JSON.stringify({}));
    localStorage.setItem(STORAGE_KEYS.submittedIds, JSON.stringify({}));
    localStorage.setItem(STORAGE_KEYS.flaggedIds, JSON.stringify({}));
    localStorage.setItem(STORAGE_KEYS.examStarted, "false");
    localStorage.setItem(STORAGE_KEYS.examComplete, "false");
    localStorage.setItem(
      STORAGE_KEYS.timeRemaining,
      String(EXAM_DURATION_SECONDS)
    );
    localStorage.setItem(STORAGE_KEYS.questionCount, "10");
localStorage.setItem(STORAGE_KEYS.sessionQuestions, JSON.stringify([]));
  }

  function clearSavedProgress() {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    setSubject("ela");
    setQuestionCount(10);
    setSessionQuestions([]);
    setIndex(0);
    setResponses({});
    setSubmittedIds({});
    setFlaggedIds({});
    setExamStarted(false);
    setExamComplete(false);
    setTimeRemaining(EXAM_DURATION_SECONDS);
  }

  const answeredCount = questions.filter((question) => {
    const value = responses[question.id];
    return value !== undefined && value !== "";
  }).length;

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-8">
      <div className="mb-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Georgia Milestones Prep
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Test simulation and scoring starter
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            This codebase now saves student progress locally in the browser, so
            refreshes and returns do not wipe answers immediately.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {SUBJECT_OPTIONS.map((option) => {
              const active = option.key === subject;

              return (
                <button
                  key={option.key}
                  onClick={() => resetSession(option.key)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                    active
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
                Session
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                {subject.toUpperCase()} Practice
              </h2>
            </div>

            <div className="rounded-2xl bg-white/10 px-4 py-2 text-right">
              <p className="text-xs uppercase tracking-wider text-slate-300">
                Timer
              </p>
              <p className="text-2xl font-bold">{formatTime(timeRemaining)}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <MetricCard label="Questions" value={questions.length} />
            <MetricCard label="Answered" value={answeredCount} />
            <MetricCard label="Score" value={`${results.percent}%`} />
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm uppercase tracking-[0.2em] text-slate-300">
              Question Count
            </p>
            <div className="flex flex-wrap gap-2">
              {[5, 10, 20].map((count) => (
                <button
                  key={count}
                  onClick={() => setQuestionCount(count)}
                  disabled={examStarted}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                    questionCount === count
                      ? "bg-white text-slate-900"
                      : "bg-white/10 text-white"
                  } disabled:opacity-50`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {!examStarted && !examComplete && (
              <button
                onClick={startExam}
                className="rounded-2xl bg-white px-4 py-2 font-semibold text-slate-900"
              >
                Start
              </button>
            )}

            {!examComplete && (
              <button
                onClick={finishExam}
                className="rounded-2xl border border-white/20 px-4 py-2 font-semibold text-white"
              >
                Finish
              </button>
            )}

            <button
              onClick={() => resetSession(subject)}
              className="rounded-2xl border border-white/20 px-4 py-2 font-semibold text-white"
            >
              Reset Subject
            </button>

            <button
              onClick={clearSavedProgress}
              className="rounded-2xl border border-red-300/40 px-4 py-2 font-semibold text-red-100"
            >
              Clear Progress
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          {currentQuestion ? (
            <>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Question {safeIndex + 1} of {questions.length}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    {currentQuestion.prompt}
                  </h2>
                </div>

                <button
                  onClick={() => toggleFlag(currentQuestion.id)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                    flaggedIds[currentQuestion.id]
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {flaggedIds[currentQuestion.id] ? "Flagged" : "Flag"}
                </button>
              </div>

              {currentQuestion.type === "mcq" && (
                <div className="space-y-3">
                  {currentQuestion.choices.map((choice) => {
                    const selected = responses[currentQuestion.id] === choice;

                    return (
                      <button
                        key={choice}
                        onClick={() => setResponse(choice)}
                        className={`block w-full rounded-2xl border px-4 py-3 text-left ${
                          selected
                            ? "border-slate-900 bg-slate-100"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {choice}
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQuestion.type === "short" && (
                <textarea
                  rows={6}
                  value={responses[currentQuestion.id] || ""}
                  onChange={(event) => setResponse(event.target.value)}
                  placeholder="Type your response here..."
                  className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-slate-400"
                />
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={prevQuestion}
                  disabled={safeIndex === 0}
                  className="rounded-2xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 disabled:opacity-40"
                >
                  Previous
                </button>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={submitCurrent}
                    className="rounded-2xl bg-slate-900 px-4 py-2 font-semibold text-white"
                  >
                    Submit
                  </button>

                  <button
                    onClick={nextQuestion}
                    disabled={safeIndex === questions.length - 1}
                    className="rounded-2xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>

              {submittedIds[currentQuestion.id] && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold">
                    {validateAnswer(
                      currentQuestion,
                      responses[currentQuestion.id]
                    )
                      ? "Correct"
                      : "Needs revision"}
                  </p>

                  {currentQuestion.explanation && (
                    <p className="mt-1 text-sm text-slate-600">
                      {currentQuestion.explanation}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p>No questions available for this subject.</p>
          )}
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-soft">
          <h3 className="text-lg font-semibold">Question Navigator</h3>
          <p className="mt-1 text-sm text-slate-500">
            Jump between items and review status.
          </p>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {questions.map((question, questionIndex) => {
              const isCurrent = questionIndex === safeIndex;
              const isAnswered =
                responses[question.id] !== undefined &&
                responses[question.id] !== "";
              const isFlagged = !!flaggedIds[question.id];

              let className = "border-slate-200 bg-white text-slate-700";

              if (isCurrent) {
                className = "border-slate-900 bg-slate-900 text-white";
              } else if (isAnswered) {
                className =
                  "border-emerald-200 bg-emerald-50 text-emerald-700";
              } else if (isFlagged) {
                className = "border-amber-200 bg-amber-50 text-amber-800";
              }

              return (
                <button
                  key={question.id}
                  onClick={() => jumpToQuestion(questionIndex)}
                  className={`h-11 rounded-2xl border text-sm font-semibold ${className}`}
                >
                  {questionIndex + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-5 space-y-2 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">Dark</span>: current
            </p>
            <p>
              <span className="font-semibold text-emerald-700">Green</span>: answered
            </p>
            <p>
              <span className="font-semibold text-amber-700">Amber</span>: flagged
            </p>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <h4 className="font-semibold text-slate-900">Current Score</h4>
            <p className="mt-2 text-sm text-slate-600">
              {results.correct} correct out of {results.total} questions
            </p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {results.percent}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-4">
      <p className="text-xs uppercase tracking-wider text-slate-300">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}