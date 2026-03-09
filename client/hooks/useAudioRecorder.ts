import { useState, useRef, useCallback, useEffect } from "react";

export interface RecorderState {
  isRecording: boolean;
  duration: number; // In seconds
  permission: "granted" | "denied" | "pending" | "notasked";
  error: string | null;
  streamConnected: boolean;
  recordedBlob: Blob | null;
  recordingUrl: string | null;
  selectedMimeType: string;
  blobSize: number; // bytes
}

export interface RecorderControls {
  state: RecorderState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  cancelRecording: () => void;
  playRecording: () => void;
}

const MAX_RECORDING_TIME = 30000; // 30 seconds in ms
const SAMPLE_RATE = 44100;

/**
 * Pick the best supported MediaRecorder MIME type.
 * We prefer browser-native formats that are reliable for recording + playback.
 *
 * Notes:
 * - MP3 ("audio/mpeg") is commonly playable, but usually not recordable via MediaRecorder.
 * - AIFF is not a MediaRecorder target and is not browser-safe for playback.
 */
function pickSupportedMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4",
  ];

  for (const type of candidates) {
    try {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    } catch (err) {
      console.warn("Error checking MediaRecorder MIME type support:", type, err);
    }
  }

  // Let browser choose as final fallback
  return "";
}

/**
 * Hook for recording audio using MediaRecorder API.
 * Handles permissions, recording, cleanup, and browser compatibility.
 */
export function useAudioRecorder(): RecorderControls {
  const [state, setState] = useState<RecorderState>({
    isRecording: false,
    duration: 0,
    permission: "notasked",
    error: null,
    streamConnected: false,
    recordedBlob: null,
    recordingUrl: null,
    selectedMimeType: "",
    blobSize: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentRecordingUrlRef = useRef<string | null>(null);
  const isCancellingRef = useRef(false);

  const clearDurationInterval = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const cleanupPlayback = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = "";
      currentAudioRef.current = null;
    }
  }, []);

  const revokeRecordingUrl = useCallback((url?: string | null) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }, []);

  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, permission: "pending", error: null }));

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: SAMPLE_RATE,
        },
      });

      stream.getTracks().forEach((track) => track.stop());

      setState((prev) => ({
        ...prev,
        permission: "granted",
        error: null,
      }));

      return true;
    } catch (error) {
      const errorName = (error as { name?: string })?.name || "Unknown";
      const message = error instanceof Error ? error.message : "Unknown error";

      console.error("🎤 getUserMedia error:", {
        name: errorName,
        message,
        error,
      });

      if (errorName === "NotAllowedError" || message.includes("Permission denied")) {
        setState((prev) => ({
          ...prev,
          permission: "denied",
          error: "Microphone permission denied. Please allow microphone access in your browser settings.",
        }));
      } else if (errorName === "NotFoundError") {
        setState((prev) => ({
          ...prev,
          permission: "denied",
          error: "No microphone found. Please connect a microphone and try again.",
        }));
      } else if (errorName === "NotReadableError") {
        setState((prev) => ({
          ...prev,
          permission: "denied",
          error: "Microphone is already in use by another application. Please close it and try again.",
        }));
      } else if (errorName === "SecurityError") {
        setState((prev) => ({
          ...prev,
          permission: "denied",
          error: "This site cannot access your microphone (HTTPS required). Please ensure you're accessing a secure connection.",
        }));
      } else {
        setState((prev) => ({
          ...prev,
          permission: "denied",
          error: `Microphone error: ${message}`,
        }));
      }

      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));

      if (state.isRecording) {
        return;
      }

      cleanupPlayback();

      if (state.permission === "notasked") {
        const granted = await requestMicrophonePermission();
        if (!granted) return;
      } else if (state.permission === "denied") {
        setState((prev) => ({
          ...prev,
          error: "Microphone access denied. Cannot start recording.",
        }));
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: SAMPLE_RATE,
        },
      });

      streamRef.current = stream;
      recordedChunksRef.current = [];
      isCancellingRef.current = false;

      const mimeType = pickSupportedMimeType();

      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
        audioBitsPerSecond: 128000,
      });

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setState((prev) => ({
          ...prev,
          error: "Recording failed. Please try again.",
          isRecording: false,
          streamConnected: false,
        }));
        clearDurationInterval();
        cleanupStream();
        mediaRecorderRef.current = null;
      };

      mediaRecorderRef.current = recorder;
      recorder.start();

      startTimeRef.current = Date.now();

      // Revoke any previous object URL before starting a fresh recording cycle
      if (currentRecordingUrlRef.current) {
        revokeRecordingUrl(currentRecordingUrlRef.current);
        currentRecordingUrlRef.current = null;
      }

      setState((prev) => ({
        ...prev,
        isRecording: true,
        duration: 0,
        streamConnected: true,
        selectedMimeType: mimeType,
        recordedBlob: null,
        recordingUrl: null,
        blobSize: 0,
      }));

      durationIntervalRef.current = setInterval(() => {
        if (!startTimeRef.current) return;

        const elapsed = Date.now() - startTimeRef.current;
        const durationSeconds = Math.floor(elapsed / 1000);

        setState((prev) => ({
          ...prev,
          duration: durationSeconds,
        }));

        if (elapsed >= MAX_RECORDING_TIME && mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, 100);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start recording";
      console.error("startRecording failed:", error);

      clearDurationInterval();
      cleanupStream();

      setState((prev) => ({
        ...prev,
        error: message,
        streamConnected: false,
        isRecording: false,
      }));
    }
  }, [
    state.permission,
    state.isRecording,
    cleanupPlayback,
    cleanupStream,
    clearDurationInterval,
    requestMicrophonePermission,
    revokeRecordingUrl,
  ]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    try {
      const recorder = mediaRecorderRef.current;

      if (!recorder) {
        setState((prev) => ({ ...prev, error: "No recording in progress" }));
        return null;
      }

      if (recorder.state === "inactive") {
        setState((prev) => ({ ...prev, error: "Recorder is already stopped" }));
        return null;
      }

      clearDurationInterval();

      return await new Promise<Blob | null>((resolve) => {
        recorder.onstop = () => {
          try {
            const mimeType = recorder.mimeType || state.selectedMimeType || "audio/webm";
            const blob = new Blob(recordedChunksRef.current, { type: mimeType });

            console.log("Recorded blob:", {
              mimeType,
              recorderMimeType: recorder.mimeType,
              size: blob.size,
              chunks: recordedChunksRef.current.length,
            });

            cleanupStream();
            mediaRecorderRef.current = null;
            startTimeRef.current = null;

            if (isCancellingRef.current) {
              recordedChunksRef.current = [];
              isCancellingRef.current = false;

              setState((prev) => ({
                ...prev,
                isRecording: false,
                duration: 0,
                streamConnected: false,
                recordedBlob: null,
                recordingUrl: null,
                blobSize: 0,
              }));

              resolve(null);
              return;
            }

            const previousUrl = currentRecordingUrlRef.current;
            const url = URL.createObjectURL(blob);
            currentRecordingUrlRef.current = url;

            if (previousUrl) {
              revokeRecordingUrl(previousUrl);
            }

            setState((prev) => ({
              ...prev,
              isRecording: false,
              recordedBlob: blob,
              recordingUrl: url,
              blobSize: blob.size,
              streamConnected: false,
            }));

            recordedChunksRef.current = [];
            resolve(blob);
          } catch (err) {
            console.error("Failed to process recording:", err);

            cleanupStream();
            mediaRecorderRef.current = null;
            recordedChunksRef.current = [];
            startTimeRef.current = null;
            isCancellingRef.current = false;

            const message = err instanceof Error ? err.message : "Failed to process recording";
            setState((prev) => ({
              ...prev,
              isRecording: false,
              error: message,
              streamConnected: false,
            }));

            resolve(null);
          }
        };

        recorder.stop();
      });
    } catch (error) {
      console.error("stopRecording failed:", error);

      clearDurationInterval();
      cleanupStream();
      mediaRecorderRef.current = null;

      const message = error instanceof Error ? error.message : "Failed to stop recording";
      setState((prev) => ({
        ...prev,
        error: message,
        streamConnected: false,
        isRecording: false,
      }));

      return null;
    }
  }, [state.selectedMimeType, clearDurationInterval, cleanupStream, revokeRecordingUrl]);

  const cancelRecording = useCallback(() => {
    clearDurationInterval();
    cleanupPlayback();

    if (state.recordingUrl) {
      revokeRecordingUrl(state.recordingUrl);
      currentRecordingUrlRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      isCancellingRef.current = true;
      mediaRecorderRef.current.stop();
    } else {
      cleanupStream();
      mediaRecorderRef.current = null;
      recordedChunksRef.current = [];
      startTimeRef.current = null;
      isCancellingRef.current = false;

      setState((prev) => ({
        ...prev,
        isRecording: false,
        duration: 0,
        streamConnected: false,
        recordedBlob: null,
        recordingUrl: null,
        blobSize: 0,
        error: null,
      }));
    }
  }, [
    state.recordingUrl,
    clearDurationInterval,
    cleanupPlayback,
    cleanupStream,
    revokeRecordingUrl,
  ]);

  const playRecording = useCallback(() => {
    if (!state.recordingUrl) {
      setState((prev) => ({
        ...prev,
        error: "No recording to play. Record something first.",
      }));
      return;
    }

    cleanupPlayback();

    const audio = new Audio(state.recordingUrl);
    currentAudioRef.current = audio;

    audio.onended = () => {
      currentAudioRef.current = null;
    };

    audio.onerror = () => {
      setState((prev) => ({
        ...prev,
        error: "Failed to play the recording. The audio may be in an unsupported format.",
      }));
      currentAudioRef.current = null;
    };

    audio.play().catch((err) => {
      console.error("playRecording failed:", err);
      setState((prev) => ({
        ...prev,
        error: `Failed to play: ${err.message}`,
      }));
      currentAudioRef.current = null;
    });
  }, [state.recordingUrl, cleanupPlayback]);

  useEffect(() => {
    return () => {
      clearDurationInterval();
      cleanupPlayback();
      cleanupStream();

      if (currentRecordingUrlRef.current) {
        revokeRecordingUrl(currentRecordingUrlRef.current);
        currentRecordingUrlRef.current = null;
      }
    };
  }, [clearDurationInterval, cleanupPlayback, cleanupStream, revokeRecordingUrl]);

  return {
    state,
    startRecording,
    stopRecording,
    cancelRecording,
    playRecording,
  };
}
