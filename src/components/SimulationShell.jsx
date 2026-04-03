import React, { useEffect, useMemo, useState } from "react";
import { getQuestionsForSubject } from "../questionBank";
import { scoreAssessment, validateAnswer } from "../assessmentEngine";

const SUBJECT_OPTIONS = [
  { key: "ela", label: "ELA" },
  { key: "math", label: "Math" },
];

const EXAM_DURATION_SECONDS = 15 * 60;

export default function SimulationShell() {
  const [subject, setSubject] = useState("ela");
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [submittedIds, setSubmittedIds] = useState({});
  const [flaggedIds, setFlaggedIds] = useState({});
  const [examStarted, setExamStarted] = useState(false);
  const [examComplete, setExamComplete] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(EXAM_DURATION_SECONDS);

  const questions = useMemo(() => getQuestionsForSubject(subject), [subject]);
  const currentQuestion = questions[index];

  const results = useMemo(() => scoreAssessment(questions, responses), [questions, responses]);

  useEffect(() => {
    if (!examStarted || examComplete) return;

    const timer = window.setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setExamComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [examStarted, examComplete]);

  useEffect(() => {
    setIndex(0);
    setResponses({});
    setSubmittedIds({});
    setFlaggedIds({});
    setExamStarted(false);
    setExamComplete(false);
    setTimeRemaining(EXAM_DURATION_SECONDS);
  }, [subject]);

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
    setExamStarted(true);
  }

  function finishExam() {
    setExamComplete(true);
    setExamStarted(false);
  }

  const answeredCount = questions.filter((q) => {
    const value = responses[q.id];
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
            This codebase is structured for expansion into a full practice platform with
            multiple subject banks, digital validation, navigation tools, and score reporting.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {SUBJECT_OPTIONS.map((option) => {
              const active = option.key === subject;
              return (
                <button
                  key={option.key}
                  onClick={() => setSubject(option.key)}
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
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Session</p>
              <h2 className="mt-2 text-2xl font-bold">{subject.toUpperCase()} Practice</h2>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-2 text-right">
              <p className="text-xs uppercase tracking-wider text-slate-300">Timer</p>
              <p className="text-2xl font-bold">{formatTime(timeRemaining)}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <MetricCard label="Questions" value={questions.length} />
            <MetricCard label="Answered" value={answeredCount} />
            <MetricCard label="Score" value={`${results.percent}%`} />
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
                    Question {index + 1} of {questions.length}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">{currentQuestion.prompt}</h2>
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
                  className="w-full rounded-2xl border border-slate-200 p-4 outline-none ring-0 focus:border-slate-400"
                />
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={prevQuestion}
                  disabled={index === 0}
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
                    disabled={index === questions.length - 1}
                    className="rounded-2xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>

              {submittedIds[currentQuestion.id] && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold">
                    {validateAnswer(currentQuestion, responses[currentQuestion.id])
                      ? "Correct"
                      : "Needs revision"}
                  </p>
                  {currentQuestion.explanation && (
                    <p className="mt-1 text-sm text-slate-600">{currentQuestion.explanation}</p>
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
          <p className="mt-1 text-sm text-slate-500">Jump between items and review status.</p>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {questions.map((question, questionIndex) => {
              const isCurrent = questionIndex === index;
              const isAnswered = responses[question.id] !== undefined && responses[question.id] !== "";
              const isFlagged = !!flaggedIds[question.id];

              let className = "border-slate-200 bg-white text-slate-700";
              if (isCurrent) className = "border-slate-900 bg-slate-900 text-white";
              else if (isAnswered) className = "border-emerald-200 bg-emerald-50 text-emerald-700";
              else if (isFlagged) className = "border-amber-200 bg-amber-50 text-amber-800";

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
            <p><span className="font-semibold text-slate-900">Dark</span>: current</p>
            <p><span className="font-semibold text-emerald-700">Green</span>: answered</p>
            <p><span className="font-semibold text-amber-700">Amber</span>: flagged</p>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <h4 className="font-semibold text-slate-900">Current Score</h4>
            <p className="mt-2 text-sm text-slate-600">
              {results.correct} correct out of {results.total} questions
            </p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{results.percent}%</p>
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
