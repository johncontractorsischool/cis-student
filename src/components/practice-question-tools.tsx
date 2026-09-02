"use client";

import { AlertCircle, PlayCircle, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";

import type { PracticeVideoExplanation } from "@/lib/practice/types";
import type { StudyLanguage } from "@/lib/study/types";

type FeedbackType = "spelling" | "disagree" | "other";

type Props = {
  feedbackEnabled: boolean;
  language: StudyLanguage;
  questionId: string;
  showVideo: boolean;
  testId: string;
  videoExplanationId: string | null;
};

const copy = {
  en: {
    cancel: "Cancel",
    close: "Close",
    comment: "Comment",
    commentPlaceholder: "Tell us what should be reviewed.",
    disagree: "I disagree with this answer",
    feedback: "Report this question",
    feedbackHelp: "Your feedback goes to the curriculum team for review.",
    feedbackSent: "Thank you. Your feedback was submitted.",
    feedbackTitle: "Question feedback",
    other: "Other",
    retry: "Try again",
    send: "Send feedback",
    sending: "Sending…",
    spelling: "Spelling or grammar",
    type: "Type of feedback",
    video: "Watch video explanation",
    videoLoading: "Loading video explanation…",
    videoTitle: "Video explanation",
  },
  es: {
    cancel: "Cancelar",
    close: "Cerrar",
    comment: "Comentario",
    commentPlaceholder: "Díganos qué debemos revisar.",
    disagree: "No estoy de acuerdo con esta respuesta",
    feedback: "Reportar esta pregunta",
    feedbackHelp: "Sus comentarios se enviarán al equipo académico para su revisión.",
    feedbackSent: "Gracias. Sus comentarios fueron enviados.",
    feedbackTitle: "Comentarios sobre la pregunta",
    other: "Otro",
    retry: "Intentar de nuevo",
    send: "Enviar comentarios",
    sending: "Enviando…",
    spelling: "Ortografía o gramática",
    type: "Tipo de comentario",
    video: "Ver explicación en video",
    videoLoading: "Cargando explicación en video…",
    videoTitle: "Explicación en video",
  },
} as const;

function PracticeDialog({
  children,
  labelId,
  onClose,
}: {
  children: ReactNode;
  labelId: string;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    function handleDialogKeys(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = Array.from(cardRef.current?.querySelectorAll<HTMLElement>(
        "button:not(:disabled), input:not(:disabled), textarea:not(:disabled), video[controls], [href], [tabindex]:not([tabindex='-1'])",
      ) || []).filter((element) => !element.hasAttribute("hidden"));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", handleDialogKeys);
    return () => window.removeEventListener("keydown", handleDialogKeys);
  }, [onClose]);

  return (
    <div
      aria-labelledby={labelId}
      aria-modal="true"
      className="practice-dialog-backdrop"
      onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}
      role="dialog"
    >
      <div className="practice-dialog-card" ref={cardRef}>
        {children}
        <button aria-label="Close dialog" className="practice-dialog-close" onClick={onClose} ref={closeRef} type="button">
          <X aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function PracticeQuestionTools({
  feedbackEnabled,
  language,
  questionId,
  showVideo,
  testId,
  videoExplanationId,
}: Props) {
  const router = useRouter();
  const ui = copy[language];
  const videoHeadingId = useId();
  const feedbackHeadingId = useId();
  const feedbackTrigger = useRef<HTMLButtonElement>(null);
  const videoTrigger = useRef<HTMLButtonElement>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [video, setVideo] = useState<PracticeVideoExplanation | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("spelling");
  const [comment, setComment] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [sending, setSending] = useState(false);
  const query = language === "es" ? "?l=es" : "";
  const route = `/api/practice/test/${encodeURIComponent(testId)}/question/${encodeURIComponent(questionId)}`;

  async function loadVideo() {
    setVideoLoading(true);
    setVideoError("");
    try {
      const response = await fetch(`${route}/video${query}`, { cache: "no-store" });
      const payload = (await response.json()) as { data?: PracticeVideoExplanation; error?: { message?: string } };
      if (response.status === 401) return router.replace("/login");
      if (!response.ok || !payload.data) throw new Error(payload.error?.message || "Unable to load the video explanation.");
      setVideo(payload.data);
    } catch (error) {
      setVideoError(error instanceof Error ? error.message : "Unable to load the video explanation.");
    } finally {
      setVideoLoading(false);
    }
  }

  function openVideo() {
    setVideoOpen(true);
    if (!video && !videoLoading) void loadVideo();
  }

  const closeVideo = useCallback(() => {
    setVideoOpen(false);
    window.setTimeout(() => videoTrigger.current?.focus(), 0);
  }, []);

  function openFeedback() {
    setFeedbackError("");
    setFeedbackOpen(true);
  }

  const closeFeedback = useCallback(() => {
    setFeedbackOpen(false);
    window.setTimeout(() => feedbackTrigger.current?.focus(), 0);
  }, []);

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed) return setFeedbackError("Add a comment before sending feedback.");
    setSending(true);
    setFeedbackError("");
    try {
      const response = await fetch(`${route}/feedback${query}`, {
        body: JSON.stringify({ comment: trimmed, feedbackType }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as { error?: { message?: string } };
      if (response.status === 401) return router.replace("/login");
      if (!response.ok) throw new Error(payload.error?.message || "Unable to submit question feedback.");
      setFeedbackSent(true);
      setComment("");
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : "Unable to submit question feedback.");
    } finally {
      setSending(false);
    }
  }

  if ((!showVideo || !videoExplanationId) && !feedbackEnabled) return null;

  return (
    <>
      <div className="practice-question-tools">
        {showVideo && videoExplanationId ? (
          <button onClick={openVideo} ref={videoTrigger} type="button"><PlayCircle aria-hidden="true" />{ui.video}</button>
        ) : null}
        {feedbackEnabled ? (
          <button onClick={openFeedback} ref={feedbackTrigger} type="button"><AlertCircle aria-hidden="true" />{ui.feedback}</button>
        ) : null}
      </div>

      {videoOpen ? (
        <PracticeDialog labelId={videoHeadingId} onClose={closeVideo}>
          <header><span>Practice test</span><h2 id={videoHeadingId}>{video?.title || ui.videoTitle}</h2></header>
          <div className="practice-video-dialog-body">
            {videoLoading ? <p aria-live="polite">{ui.videoLoading}</p> : null}
            {videoError ? <div className="practice-dialog-error" role="alert"><p>{videoError}</p><button onClick={() => void loadVideo()} type="button">{ui.retry}</button></div> : null}
            {video ? <video controls playsInline poster={video.thumbnailUrl || undefined} preload="metadata" src={video.videoUrl} /> : null}
          </div>
          <footer><button onClick={closeVideo} type="button">{ui.close}</button></footer>
        </PracticeDialog>
      ) : null}

      {feedbackOpen ? (
        <PracticeDialog labelId={feedbackHeadingId} onClose={closeFeedback}>
          <header><span>Practice test</span><h2 id={feedbackHeadingId}>{ui.feedbackTitle}</h2><p>{ui.feedbackHelp}</p></header>
          {feedbackSent ? (
            <div className="practice-feedback-success" role="status"><Send aria-hidden="true" /><p>{ui.feedbackSent}</p></div>
          ) : (
            <form className="practice-feedback-form" onSubmit={submitFeedback}>
              <fieldset>
                <legend>{ui.type}</legend>
                {([
                  ["spelling", ui.spelling],
                  ["disagree", ui.disagree],
                  ["other", ui.other],
                ] as const).map(([value, label]) => (
                  <label key={value}><input checked={feedbackType === value} name={`feedback-${questionId}`} onChange={() => setFeedbackType(value)} type="radio" value={value} /><span>{label}</span></label>
                ))}
              </fieldset>
              <label className="practice-feedback-comment"><span>{ui.comment}<small>{comment.length}/2000</small></span><textarea maxLength={2000} onChange={(event) => setComment(event.target.value)} placeholder={ui.commentPlaceholder} required rows={5} value={comment} /></label>
              {feedbackError ? <p className="practice-dialog-error" role="alert">{feedbackError}</p> : null}
              <div className="practice-feedback-actions"><button onClick={closeFeedback} type="button">{ui.cancel}</button><button disabled={sending || !comment.trim()} type="submit"><Send aria-hidden="true" />{sending ? ui.sending : ui.send}</button></div>
            </form>
          )}
          {feedbackSent ? <footer><button onClick={closeFeedback} type="button">{ui.close}</button></footer> : null}
        </PracticeDialog>
      ) : null}
    </>
  );
}
