"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, getUserProfile, type User, type UserProfile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { FiMic, FiSend, FiX, FiVolume2, FiVolumeX, FiMicOff } from "react-icons/fi";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import { SpeechSynthesis } from "@/lib/speech";
import { SpeechRecognition } from "@/lib/speechRecognition";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function InterviewPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const MAX_QUESTIONS = 5; // Maximum number of questions in the interview

  // Audio states
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Voice input states
  const [isListening, setIsListening] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [voiceInputMode, setVoiceInputMode] = useState(true); // Default to voice mode
  const [interimTranscript, setInterimTranscript] = useState("");
  const [microphonePermission, setMicrophonePermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Refs
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const initialQuestionReceivedRef = useRef<boolean>(false);
  const messagesRef = useRef<Message[]>([]);
  const questionCountRef = useRef<number>(0);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push("/auth/login");
          return;
        }
        if (!currentUser.onboardingCompleted) {
          router.push("/onboarding");
          return;
        }
        setUser(currentUser);
        const userProfile = await getUserProfile();
        setProfile(userProfile);
      } catch (error) {
        router.push("/auth/login");
      }
    }
    loadUser();

    // Initialize speech synthesis and recognition
    speechSynthesisRef.current = new SpeechSynthesis();
    speechRecognitionRef.current = new SpeechRecognition();

    // Log speech recognition support for debugging
    if (speechRecognitionRef.current) {
      const isSupported = speechRecognitionRef.current.isSupported();
      console.log('Speech recognition initialized:', {
        supported: isSupported,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'N/A',
        isIOS: typeof window !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
      });
    }

    // Cleanup on unmount
    return () => {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.stop();
      }
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    };
  }, [router]);

  // Check microphone permission status (but don't request yet - iOS requires user interaction)
  useEffect(() => {
    async function checkMicrophonePermission() {
      // Only check if speech recognition is supported
      if (!speechRecognitionRef.current?.isSupported()) {
        setMicrophonePermission('denied');
        return;
      }

      // For non-iOS devices, check permission status
      const isIOSDevice = typeof window !== 'undefined' &&
        (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

      if (!isIOSDevice) {
        try {
          if (navigator.permissions && navigator.permissions.query) {
            const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            setMicrophonePermission(result.state === 'granted' ? 'granted' : 'prompt');

            // Listen for permission changes
            result.onchange = () => {
              setMicrophonePermission(result.state === 'granted' ? 'granted' : 'denied');
            };
          } else {
            setMicrophonePermission('prompt');
          }
        } catch (error) {
          console.log('Permission query not supported, will request on use');
          setMicrophonePermission('prompt');
        }
      } else {
        // For iOS, set to 'prompt' - we'll request when user clicks Start Interview
        setMicrophonePermission('prompt');
      }
    }

    // Check permission status after a short delay
    const timer = setTimeout(() => {
      checkMicrophonePermission();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Sync refs with state to always have latest values
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    questionCountRef.current = questionCount;
  }, [questionCount]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isLoading, currentQuestion]);

  const startInterview = async () => {
    // CRITICAL FOR iOS: Request microphone permission FIRST, before ANY other async operations
    // iOS Safari requires getUserMedia to be called directly in the user interaction handler
    // Any delay or async operation before it will break the permission prompt
    const isIOSDevice = typeof window !== 'undefined' &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

    const beginAudioUnlock = () => {
      if (!speechSynthesisRef.current) {
        return null;
      }
      const unlockPromise = speechSynthesisRef.current
        .unlockAudio()
        .catch((error) => {
          console.warn('Unable to unlock audio context before starting interview:', error);
        });
      return unlockPromise;
    };

    let pendingAudioUnlock: Promise<void> | null = null;

    // For iOS, request permission immediately if needed
    if (isIOSDevice && voiceInputMode && microphonePermission !== 'granted') {
      // Minimal checks - only the absolute essentials
      if (!navigator.mediaDevices?.getUserMedia) {
        alert('Microphone access is not available in this browser.');
        return;
      }

      try {
        console.log('🎤 Requesting microphone permission on iOS (immediate call)...');
        setMicrophonePermission('checking');

        // CRITICAL: Call getUserMedia IMMEDIATELY - no await, no delay, no other operations
        // This MUST be the first async operation to preserve user interaction context on iOS
        const permissionPromise = navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        pendingAudioUnlock = beginAudioUnlock();

        // Await the promise
        const stream = await permissionPromise;

        // Stop the stream immediately - we just needed permission
        stream.getTracks().forEach(track => track.stop());

        // Update permission status
        setMicrophonePermission('granted');
        if (speechRecognitionRef.current) {
          speechRecognitionRef.current.setMicrophonePermissionGranted(true);
        }

        console.log('✅ Microphone permission granted on iOS');
      } catch (error: any) {
        console.error('❌ Microphone permission error:', error);
        setMicrophonePermission('denied');
        if (speechRecognitionRef.current) {
          speechRecognitionRef.current.setMicrophonePermissionGranted(false);
        }

        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          alert('Microphone permission was denied.\n\nTo enable:\n1. Tap the "AA" icon in Safari address bar\n2. Select "Website Settings"\n3. Set Microphone to "Allow"\n4. Refresh the page\n\nOr go to Settings > Safari > Microphone and allow access for this website.');
          return;
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          alert('No microphone found. Please connect a microphone and try again.');
          return;
        } else {
          alert(`Microphone permission error: ${error.message || error.name}\n\nPlease ensure you allow microphone access when prompted.`);
          return;
        }
      }
    }

    if (!pendingAudioUnlock) {
      pendingAudioUnlock = beginAudioUnlock();
    }

    const waitForAudioUnlock = async () => {
      if (!pendingAudioUnlock) return;
      try {
        await pendingAudioUnlock;
      } catch (error) {
        console.warn('Audio unlock promise rejected:', error);
      }
    };

    // Now proceed with other operations after permission is granted
    // Attempt to unlock audio playback without blocking UI (mobile Safari sometimes delays resolution)
    setIsInterviewing(true);
    setIsLoading(true);
    initialQuestionReceivedRef.current = false; // Reset flag

    // Create initial user message for the first question (needed for conversation history)
    const initialMessages = [{
      role: "user" as const,
      content: profile?.workExperience && profile.workExperience.length > 0
        ? `I'm ready to start the interview. I have experience as ${profile.workExperience[0].position} at ${profile.workExperience[0].company}.`
        : profile?.education && profile.education.length > 0
          ? `I'm ready to start the interview. I studied ${profile.education[0].field} at ${profile.education[0].institution}.`
          : "I'm ready to start the interview."
    }];

    // Safety timeout: If we're still loading after 35 seconds, show fallback question
    // This prevents the UI from being stuck on "AI is thinking" indefinitely
    const safetyTimeout = setTimeout(async () => {
      if (!initialQuestionReceivedRef.current) {
        console.warn('Safety timeout triggered - showing fallback question (likely network issue)');
        initialQuestionReceivedRef.current = true; // Mark as handled
        const fallbackQuestion = "Tell me about yourself.";
        setCurrentQuestion(fallbackQuestion);
        // Include the initial user message in the messages state to maintain conversation history
        setMessages([
          ...initialMessages,
          { role: "assistant", content: fallbackQuestion }
        ]);
        setQuestionCount(1);
        setIsLoading(false);

        // Speak the fallback question
        if (isAudioEnabled && speechSynthesisRef.current) {
          await waitForAudioUnlock();
          setIsAISpeaking(true);
          speechSynthesisRef.current.speak(fallbackQuestion, () => {
            setIsAISpeaking(false);
            // iOS requires manual button click, skip auto-start
            if (voiceInputMode && speechRecognitionRef.current?.isSupported() && !isIOS()) {
              startVoiceInput();
            }
          });
        } else {
          // iOS requires manual button click, skip auto-start
          if (voiceInputMode && speechRecognitionRef.current?.isSupported() && !isIOS()) {
            setTimeout(() => startVoiceInput(), 500);
          }
        }
      }
    }, 35000); // 35 seconds safety timeout

    // Start API call IMMEDIATELY (don't wait for audio setup)
    // This makes the first question load much faster
    const fetchInitialQuestion = async () => {
      try {
        // Get session token to pass to API
        let token: string | null = null;
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            console.warn('Error getting session for initial question:', sessionError.message);
          }
          token = session?.access_token || null;
          if (!token) {
            console.warn('No session token available for initial question');
          }
        } catch (tokenError: any) {
          console.error('Error retrieving session token:', tokenError);
        }

        console.log('Fetching initial AI question...');

        // Use same timeout for both mobile and desktop (30 seconds)
        const fetchTimeout = 30000;

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.warn(`Fetch timeout after ${fetchTimeout}ms`);
          controller.abort();
        }, fetchTimeout);

        try {
          // Call AWS Bedrock API for initial AI question
          const response = await fetch('/api/ai/respond', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            credentials: 'include',
            body: JSON.stringify({ messages: initialMessages }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('API response error:', response.status, errorText);
            throw new Error(`Failed to get initial AI question: ${response.status} ${errorText}`);
          }

          const data = await response.json();
          console.log('Received AI response:', data);
          const initialQuestion = data.response || "Tell me about yourself.";

          if (!initialQuestion || initialQuestion.trim() === '') {
            throw new Error('Empty response from AI');
          }

          clearTimeout(safetyTimeout); // Clear safety timeout since we got a response
          initialQuestionReceivedRef.current = true; // Mark as received
          setCurrentQuestion(initialQuestion);
          // Include the initial user message in the messages state to maintain conversation history
          setMessages([
            ...initialMessages,
            { role: "assistant", content: initialQuestion }
          ]);
          setQuestionCount(1); // First question
          setIsLoading(false);

          // Speak the initial question using AWS Polly
          if (isAudioEnabled && speechSynthesisRef.current) {
            await waitForAudioUnlock();
            setIsAISpeaking(true);
            await speechSynthesisRef.current.speak(initialQuestion, () => {
              setIsAISpeaking(false);
              // Auto-start listening after AI finishes speaking (if voice mode is enabled)
              // Note: iOS requires manual button click, so we skip auto-start on iOS
              if (voiceInputMode && speechRecognitionRef.current?.isSupported() && !isIOS()) {
                startVoiceInput();
              }
            });
          } else {
            // If audio is disabled, still auto-start listening in voice mode (but not on iOS)
            if (voiceInputMode && speechRecognitionRef.current?.isSupported() && !isIOS()) {
              setTimeout(() => startVoiceInput(), 500);
            }
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          console.error('Error fetching initial AI question:', fetchError);

          // Check if it's a timeout or abort error
          if (fetchError.name === 'AbortError' || fetchError.message?.includes('timeout')) {
            console.error(`Request timed out after ${fetchTimeout}ms - using fallback question`);
            // Show alert on both mobile and desktop
            alert('The request timed out. Please check your internet connection and try again.');
          } else {
            console.error('Fetch error details:', {
              name: fetchError.name,
              message: fetchError.message,
              status: (fetchError as any).status,
              stack: fetchError.stack
            });

            // If it's a 504 Gateway Timeout, that's also a timeout case
            if ((fetchError as any).status === 504) {
              console.warn('Server returned 504 Gateway Timeout - using fallback question');
            }
          }

          clearTimeout(safetyTimeout); // Clear safety timeout since we're handling the error
          initialQuestionReceivedRef.current = true; // Mark as handled
          // Always show fallback question, even on error
          const fallbackQuestion = "Tell me about yourself.";
          setCurrentQuestion(fallbackQuestion);
          // Include the initial user message in the messages state to maintain conversation history
          setMessages([
            ...initialMessages,
            { role: "assistant", content: fallbackQuestion }
          ]);
          setQuestionCount(1);
          setIsLoading(false);

          // Speak the fallback question
          if (isAudioEnabled && speechSynthesisRef.current) {
            await waitForAudioUnlock();
            setIsAISpeaking(true);
            await speechSynthesisRef.current.speak(fallbackQuestion, () => {
              setIsAISpeaking(false);
              // iOS requires manual button click, skip auto-start
              if (voiceInputMode && speechRecognitionRef.current?.isSupported() && !isIOS()) {
                startVoiceInput();
              }
            });
          } else {
            // If audio disabled, still auto-start listening in voice mode (but not on iOS)
            if (voiceInputMode && speechRecognitionRef.current?.isSupported() && !isIOS()) {
              setTimeout(() => startVoiceInput(), 500);
            }
          }
        }
      } catch (error: any) {
        clearTimeout(safetyTimeout); // Clear safety timeout since we're handling the error
        initialQuestionReceivedRef.current = true; // Mark as handled
        console.error('Error getting initial AI question (outer catch):', error);
        // Fallback to simple question
        const fallbackQuestion = "Tell me about yourself.";
        setCurrentQuestion(fallbackQuestion);
        // Include the initial user message in the messages state to maintain conversation history
        setMessages([
          ...initialMessages,
          { role: "assistant", content: fallbackQuestion }
        ]);
        setQuestionCount(1);
        setIsLoading(false);

        // Speak the fallback question
        if (isAudioEnabled && speechSynthesisRef.current) {
          await waitForAudioUnlock();
          setIsAISpeaking(true);
          await speechSynthesisRef.current.speak(fallbackQuestion, () => {
            setIsAISpeaking(false);
            // iOS requires manual button click, skip auto-start
            if (voiceInputMode && speechRecognitionRef.current?.isSupported() && !isIOS()) {
              startVoiceInput();
            }
          });
        } else {
          // iOS requires manual button click, skip auto-start
          if (voiceInputMode && speechRecognitionRef.current?.isSupported() && !isIOS()) {
            setTimeout(() => startVoiceInput(), 500);
          }
        }
      }
    };

    // Start API call immediately (don't wait for audio setup)
    fetchInitialQuestion();

  };

  const submitAnswer = async (answerText?: string) => {
    const answer = answerText || userAnswer;
    if (!answer.trim()) return;

    // Stop listening if active
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    }

    // Use ref to get latest messages (always up-to-date)
    const currentMessages = messagesRef.current;

    // Validate answer first
    try {
      // Get session token to pass to API
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const validationResponse = await fetch('/api/interview/validate-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          question: currentQuestion || "Tell me about yourself",
          answer: answer
        }),
      });

      if (validationResponse.ok) {
        const validationData = await validationResponse.json();
        if (!validationData.isValid) {
          const feedback = validationData.feedback || "Please provide a more relevant answer.";
          setFeedbackMessage(feedback);

          // Speak feedback
          if (isAudioEnabled && speechSynthesisRef.current) {
            setIsAISpeaking(true);
            await speechSynthesisRef.current.speak(feedback, () => {
              setIsAISpeaking(false);
              // Restart listening if in voice mode
              if (voiceInputMode && speechRecognitionRef.current?.isSupported() && !isIOS()) {
                setTimeout(() => startVoiceInput(), 500);
              }
            });
          }
          return; // Stop here, don't proceed
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      // If validation fails, proceed anyway to avoid blocking user
    }

    setFeedbackMessage(null); // Clear any previous feedback
    const newMessages = [...currentMessages, { role: "user" as const, content: answer }];

    // Update state
    setMessages(newMessages);
    setUserAnswer("");
    setInterimTranscript("");
    setIsLoading(true);

    try {
      // Get session token to pass to API
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Call AWS Bedrock API for AI response with full conversation history
      const response = await fetch('/api/ai/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const nextQuestion = data.response;

      // Increment question count using ref to ensure we have latest value
      const newQuestionCount = questionCountRef.current + 1;
      setQuestionCount(newQuestionCount);

      // Check if we've reached the maximum number of questions
      // If so, request a closing statement instead of another question
      if (newQuestionCount >= MAX_QUESTIONS) {
        // Request closing statement from AI
        setIsClosing(true);
        setIsLoading(true);

        try {
          const closingMessages = [
            ...newMessages,
            { role: "assistant" as const, content: nextQuestion },
            {
              role: "user" as const,
              content: "This was my final answer. Please provide a professional closing statement to conclude the interview."
            }
          ];

          // Get session token for closing statement request
          const { data: { session: closingSession } } = await supabase.auth.getSession();
          const closingToken = closingSession?.access_token;

          const closingResponse = await fetch('/api/ai/respond', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(closingToken && { 'Authorization': `Bearer ${closingToken}` }),
            },
            credentials: 'include',
            body: JSON.stringify({
              messages: closingMessages,
              isClosing: true // Flag to indicate this is a closing statement
            }),
          });

          if (closingResponse.ok) {
            const closingData = await closingResponse.json();
            const closingStatement = closingData.response || "Thank you for your time today. We'll be in touch soon.";

            setCurrentQuestion(closingStatement);
            const finalMessages = [...closingMessages, { role: "assistant" as const, content: closingStatement }];
            setMessages(finalMessages);
            setIsLoading(false);

            // Speak the closing statement
            if (isAudioEnabled && speechSynthesisRef.current) {
              setIsAISpeaking(true);
              await speechSynthesisRef.current.speak(closingStatement, async () => {
                setIsAISpeaking(false);
                // After closing statement, automatically save and show report
                setTimeout(() => {
                  endInterview();
                }, 1000);
              });
            } else {
              // If audio disabled, still auto-save after a short delay
              setTimeout(() => {
                endInterview();
              }, 2000);
            }
            return;
          } else {
            // Fallback closing statement if API fails
            const fallbackClosing = "Thank you for your time today. We appreciate you taking the time to speak with us. We'll review your responses and get back to you soon.";
            setCurrentQuestion(fallbackClosing);
            setMessages([...newMessages, { role: "assistant" as const, content: nextQuestion }, { role: "assistant" as const, content: fallbackClosing }]);
            setIsLoading(false);

            if (isAudioEnabled && speechSynthesisRef.current) {
              setIsAISpeaking(true);
              await speechSynthesisRef.current.speak(fallbackClosing, async () => {
                setIsAISpeaking(false);
                setTimeout(() => {
                  endInterview();
                }, 1000);
              });
            } else {
              setTimeout(() => {
                endInterview();
              }, 2000);
            }
            return;
          }
        } catch (closingError) {
          console.error('Error getting closing statement:', closingError);
          // Fallback closing statement
          const fallbackClosing = "Thank you for your time today. We appreciate you taking the time to speak with us. We'll review your responses and get back to you soon.";
          setCurrentQuestion(fallbackClosing);
          setMessages([...newMessages, { role: "assistant" as const, content: nextQuestion }, { role: "assistant" as const, content: fallbackClosing }]);
          setIsLoading(false);

          if (isAudioEnabled && speechSynthesisRef.current) {
            setIsAISpeaking(true);
            await speechSynthesisRef.current.speak(fallbackClosing, async () => {
              setIsAISpeaking(false);
              setTimeout(() => {
                endInterview();
              }, 1000);
            });
          } else {
            setTimeout(() => {
              endInterview();
            }, 2000);
          }
          return;
        }
      }

      setCurrentQuestion(nextQuestion);
      setMessages([...newMessages, { role: "assistant", content: nextQuestion }]);
      setIsLoading(false);

      // Speak the AI response using AWS Polly
      if (isAudioEnabled && speechSynthesisRef.current) {
        setIsAISpeaking(true);
        await speechSynthesisRef.current.speak(nextQuestion, () => {
          setIsAISpeaking(false);
          // Auto-start listening after AI finishes speaking (if voice mode is enabled)
          // iOS requires manual button click, skip auto-start
          if (voiceInputMode && speechRecognitionRef.current?.isSupported() && !isIOS()) {
            setTimeout(() => startVoiceInput(), 500);
          }
        });
      } else {
        // If audio disabled, still auto-start listening in voice mode (but not on iOS)
        if (voiceInputMode && speechRecognitionRef.current?.isSupported() && !isIOS()) {
          setTimeout(() => startVoiceInput(), 500);
        }
      }
    } catch (error: any) {
      console.error('Error getting AI response:', error);
      // Fallback to simple response
      const fallbackResponse = "That's interesting. Can you tell me more about that?";
      setCurrentQuestion(fallbackResponse);
      setMessages([...newMessages, { role: "assistant", content: fallbackResponse }]);
      setIsLoading(false);

      if (isAudioEnabled && speechSynthesisRef.current) {
        setIsAISpeaking(true);
        await speechSynthesisRef.current.speak(fallbackResponse, () => {
          setIsAISpeaking(false);
          // iOS requires manual button click, skip auto-start
          if (voiceInputMode && speechRecognitionRef.current?.isSupported() && !isIOS()) {
            setTimeout(() => startVoiceInput(), 500);
          }
        });
      }
    }
  };

  // Helper to detect iOS
  const isIOS = () => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  };

  // Handle microphone permission request (for Request Permission button)
  // CRITICAL: This must call getUserMedia IMMEDIATELY to preserve user interaction context on iOS
  const handleRequestPermission = async () => {
    // Minimal check - only verify getUserMedia exists
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Microphone access is not available in this browser.');
      return;
    }

    try {
      console.log('🎤 Requesting microphone permission via Request Permission button (immediate call)...');
      setMicrophonePermission('checking');

      // CRITICAL: Call getUserMedia IMMEDIATELY - create promise first, then await
      // This ensures the permission request happens in the user interaction context
      const permissionPromise = navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Await the promise
      const stream = await permissionPromise;

      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());

      // Update permission status
      setMicrophonePermission('granted');
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.setMicrophonePermissionGranted(true);
      }

      console.log('✅ Microphone permission granted via Request Permission button');
    } catch (error: any) {
      console.error('❌ Microphone permission error:', error);
      setMicrophonePermission('denied');

      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.setMicrophonePermissionGranted(false);
      }

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('Microphone permission was denied.\n\nTo enable:\n1. Tap the "AA" icon in Safari address bar\n2. Select "Website Settings"\n3. Set Microphone to "Allow"\n4. Refresh the page\n\nOr go to Settings > Safari > Microphone and allow access for this website.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else {
        alert(`Microphone permission error: ${error.message || error.name}\n\nPlease ensure you allow microphone access when prompted.`);
      }
    }
  };

  const startVoiceInput = async () => {
    if (!speechRecognitionRef.current || isListening || isAISpeaking) {
      console.log('Cannot start voice input:', {
        hasRecognition: !!speechRecognitionRef.current,
        isListening,
        isAISpeaking
      });
      return;
    }

    // Check if speech recognition is supported
    if (!speechRecognitionRef.current.isSupported()) {
      console.warn('Speech recognition not supported, switching to text mode');
      setVoiceInputMode(false);
      return;
    }

    console.log('Starting voice input...');
    setIsListening(true);
    setInterimTranscript("");

    try {
      await speechRecognitionRef.current.start(
        (text: string, isInterim?: boolean) => {
          console.log('Speech recognition result:', { text, isInterim });
          if (isInterim) {
            // Show interim results in real-time
            setInterimTranscript(text);
          } else {
            // When we get a final result, submit it
            console.log('Final transcript received:', text);
            setInterimTranscript("");
            if (text.trim()) {
              submitAnswer(text);
            } else {
              // If no text, just stop listening and wait for next input
              setIsListening(false);
            }
          }
        },
        (error: string) => {
          console.error('Speech recognition error:', error);
          setIsListening(false);
          setInterimTranscript("");

          // For iOS, some errors are expected and we should allow retry
          if (error === 'no-speech' || error.includes('no-speech') || error.includes('audio-capture')) {
            // These are common on mobile, just stop listening
            console.log('No speech detected - this is normal');
            return;
          }

          // For other errors, show a message but don't switch modes automatically
          if (error.includes('not-allowed') || error.includes('permission') || error === 'not-allowed') {
            if (isIOS()) {
              alert('Microphone permission is required. Please go to Settings > Safari > Microphone and enable it, then refresh the page.');
            } else {
              alert('Microphone permission is required for voice input. Please enable it in your browser settings.');
            }
          } else if (error !== 'aborted' && error !== 'network') {
            // Don't show alerts for aborted or network errors
            console.warn('Speech recognition error (non-critical):', error);
          }
        }
      );
    } catch (error: any) {
      console.error('Error starting voice input:', error);
      setIsListening(false);
      setInterimTranscript("");
      if (isIOS()) {
        alert('Failed to start voice input. Please ensure microphone permission is granted in Safari settings.');
      }
    }
  };

  const stopVoiceInput = () => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
      setInterimTranscript("");
    }
  };

  const toggleVoiceInput = async (e?: React.MouseEvent | React.TouchEvent) => {
    // Prevent default to ensure proper event handling on mobile
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isListening) {
      console.log('Stopping voice input');
      stopVoiceInput();
    } else {
      console.log('Starting voice input via button click');
      // Start immediately to preserve user interaction context (critical for iOS)
      // Don't use setTimeout as it breaks the user interaction context on iOS
      await startVoiceInput();
    }
  };

  // Helper function to get session token with retry
  // Generate report in background (don't wait for it)
  const generateReportInBackground = async (sessionId: string, messages: Message[], token: string | null) => {
    // Run in background - don't await
    (async () => {
      try {
        console.log('🔄 Starting background report generation for session:', sessionId);

        const reportHeaders: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (token) {
          reportHeaders['Authorization'] = `Bearer ${token}`;
        }

        const reportResponse = await fetch('/api/interview/generate-report', {
          method: 'POST',
          headers: reportHeaders,
          credentials: 'include',
          body: JSON.stringify({
            messages: messages,
            duration: 0,
          }),
        });

        if (reportResponse.ok) {
          const reportData = await reportResponse.json();
          const report = reportData.report;

          if (report && typeof report === 'object' && Object.keys(report).length > 0) {
            // Update the session with the generated report
            const updateHeaders: HeadersInit = {
              'Content-Type': 'application/json',
            };

            if (token) {
              updateHeaders['Authorization'] = `Bearer ${token}`;
            }

            const updateResponse = await fetch('/api/interview/update-report', {
              method: 'POST',
              headers: updateHeaders,
              credentials: 'include',
              body: JSON.stringify({
                sessionId: sessionId,
                report: report,
              }),
            });

            if (updateResponse.ok) {
              console.log('✅ Report generated and saved to session:', sessionId);
            } else {
              console.error('❌ Failed to update session with report:', await updateResponse.text());
            }
          } else {
            console.error('❌ Report generation returned empty/null report');
          }
        } else {
          const errorData = await reportResponse.json().catch(() => ({}));
          console.error('❌ Background report generation failed:', {
            status: reportResponse.status,
            error: errorData.error || 'Unknown error'
          });
        }
      } catch (error: any) {
        console.error('❌ Error in background report generation:', error.message || error);
        // Don't show error to user - it's running in background
      }
    })();
  };

  const getSessionToken = async (): Promise<string | null> => {
    try {
      // Try to get session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.warn('Error getting session:', error.message);
        return null;
      }

      if (session?.access_token) {
        return session.access_token;
      }

      // If no session, try to refresh
      console.warn('No active session, attempting to refresh...');
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.warn('Error refreshing session:', refreshError.message);
        return null;
      }

      if (refreshedSession?.access_token) {
        return refreshedSession.access_token;
      }

      return null;
    } catch (error: any) {
      console.error('Error in getSessionToken:', error.message);
      return null;
    }
  };

  const endInterview = async () => {
    setIsLoading(true);

    // Stop speech
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.stop();
      setIsAISpeaking(false);
    }

    // Stop voice input
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
      setInterimTranscript("");
    }


    // Save session and redirect to dashboard immediately
    // Report will be generated in the background
    // Ensure we have a valid user session before proceeding
    if (!user) {
      console.error('Cannot save interview: No user found');
      alert('You must be logged in to save the interview. Please log in and try again.');
      setIsInterviewing(false);
      return;
    }

    if (messages.length > 0) {
      try {
        // Save session immediately (without report - it will be generated in background)
        let sessionSaved = false;
        let sessionId = null;

        try {
          // Get session token for save request
          const saveToken = await getSessionToken();
          if (!saveToken) {
            console.error('Failed to get session token for save');
          }

          const saveHeaders: HeadersInit = {
            'Content-Type': 'application/json',
          };

          if (saveToken) {
            saveHeaders['Authorization'] = `Bearer ${saveToken}`;
            console.log('Authorization header set for save');
          } else {
            console.warn('No token available for save - will rely on cookies');
          }

          console.log('💾 Saving session (report will be generated in background):', {
            messageCount: messages.length
          });

          // Save session without report - report will be null initially
          const saveResponse = await fetch('/api/interview/save', {
            method: 'POST',
            headers: saveHeaders,
            credentials: 'include',
            body: JSON.stringify({
              sessionData: {
                messages: messages,
                currentQuestion: currentQuestion,
              },
              report: null, // Report will be generated in background
              duration: 0,
            }),
          });

          if (saveResponse.ok) {
            const { session } = await saveResponse.json();
            sessionId = session.id;
            sessionSaved = true;
            console.log('✅ Session saved successfully with ID:', sessionId);

            // Trigger report generation in background (don't wait for it)
            generateReportInBackground(sessionId, messages, saveToken);

            // Redirect to dashboard immediately
            setIsLoading(false);
            router.push('/dashboard');
            return;
          } else {
            const errorData = await saveResponse.json().catch(() => ({}));
            console.error('❌ Failed to save interview session:', {
              status: saveResponse.status,
              statusText: saveResponse.statusText,
              error: errorData.error || 'Unknown error',
              response: errorData
            });

            // Try to check if session was actually saved (sometimes the response fails but data is saved)
            if (saveToken) {
              try {
                const { data: existingSessions } = await supabase
                  .from('interview_sessions')
                  .select('id, created_at')
                  .eq('user_id', user.id)
                  .order('created_at', { ascending: false })
                  .limit(1);

                if (existingSessions && existingSessions.length > 0) {
                  const latestSession = existingSessions[0];
                  const sessionAge = Date.now() - new Date(latestSession.created_at).getTime();
                  // If session was created in the last 30 seconds, it's likely our session
                  if (sessionAge < 30000) {
                    console.log('✅ Found recently created session, using it:', latestSession.id);
                    sessionId = latestSession.id;
                    sessionSaved = true;

                    // Trigger report generation in background
                    generateReportInBackground(sessionId, messages, saveToken);

                    // Redirect to dashboard
                    setIsLoading(false);
                    router.push('/dashboard');
                    return;
                  }
                }
              } catch (checkError) {
                console.warn('Could not verify if session was saved:', checkError);
              }
            }
          }
        } catch (saveError: any) {
          console.error('Error saving interview session:', saveError.message || saveError);
        }

        // If we got here, saving failed
        setIsLoading(false);
        alert('Interview ended, but there was an error saving the session.\n\nPlease check:\n1. Your internet connection\n2. Try refreshing the page\n3. Check the Reports page to see if it was saved\n\nIf the problem persists, please contact support.');

        // Still redirect to dashboard so user can check if anything was saved
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } catch (error: any) {
        console.error('Unexpected error during interview end:', error.message || error);
        setIsLoading(false);
        alert('An unexpected error occurred. The interview has ended.');
        router.push('/dashboard');
      }
    }

    setIsInterviewing(false);
    setMessages([]);
    setCurrentQuestion("");
    setUserAnswer("");
    setInterimTranscript("");
    setQuestionCount(0);
    setIsLoading(false);
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    if (!isAudioEnabled && speechSynthesisRef.current && currentQuestion) {
      // Resume speaking if audio was re-enabled
      speechSynthesisRef.current.speak(currentQuestion);
    } else if (isAudioEnabled && speechSynthesisRef.current) {
      // Stop speaking if audio was disabled
      speechSynthesisRef.current.stop();
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64 transition-all duration-300">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                AI Interview Practice
              </h1>
              {isInterviewing && questionCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <span className="text-blue-700 dark:text-blue-300 text-sm font-medium">Question {questionCount} of {MAX_QUESTIONS}</span>
                </div>
              )}
            </div>
            {isInterviewing && (
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAudio}
                  className={`p-2.5 rounded-lg transition-all ${isAudioEnabled
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
                    }`}
                  title={isAudioEnabled ? "Mute AI voice" : "Unmute AI voice"}
                >
                  {isAudioEnabled ? <FiVolume2 className="text-lg" /> : <FiVolumeX className="text-lg" />}
                </button>
                <button
                  onClick={endInterview}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-all duration-200 border border-red-200 dark:border-red-800"
                >
                  <FiX className="text-lg" />
                  <span className="text-sm font-medium">End Interview</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4">
          <div className="max-w-4xl mx-auto w-full h-full flex flex-col relative z-10">
            {/* Main Interface */}
            <div className="flex-1 flex flex-col min-h-0">
              {!isInterviewing ? (
                /* Start Interview Screen */
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 text-center border border-gray-200 dark:border-gray-700 flex-1 flex flex-col justify-center overflow-y-auto">
                  <div className="mb-8">
                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-200 dark:border-blue-800">
                      <FiMic className="text-4xl text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-3">Ready to Practice?</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed max-w-xl mx-auto">
                      Start an AI-powered interview session. Answer questions naturally, and our AI will speak to you and provide intelligent follow-up questions.
                    </p>
                  </div>

                  {/* Microphone Permission Status */}
                  {microphonePermission === 'checking' && (
                    <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent"></div>
                        <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                          Checking microphone permission...
                        </p>
                      </div>
                    </div>
                  )}

                  {microphonePermission === 'prompt' && isIOS() && voiceInputMode && (
                    <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        <p className="text-blue-700 dark:text-blue-300 text-sm">
                          When you click "Start Interview", your iPhone will prompt you to allow microphone access.
                          Please tap <strong>"Allow"</strong> to enable voice input.
                        </p>
                      </div>
                    </div>
                  )}

                  {microphonePermission === 'denied' && (
                    <div className="mb-6 bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-red-700 dark:text-red-400 text-sm font-semibold mb-1">Microphone Permission Denied</p>
                          <p className="text-red-600 dark:text-red-500 text-sm mb-3">
                            {isIOS()
                              ? 'Go to Settings → Safari → Microphone and enable access, then refresh.'
                              : /Android/.test(navigator.userAgent)
                                ? 'Please allow microphone access when prompted, or go to your browser settings and enable microphone permission for this website, then refresh.'
                                : 'Please enable microphone access in your browser settings.'}
                          </p>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();

                              // CRITICAL FOR iOS: Call getUserMedia IMMEDIATELY in the click handler
                              // No function calls, no delays - direct call to preserve user interaction context
                              if (!navigator.mediaDevices?.getUserMedia) {
                                alert('Microphone access is not available in this browser.');
                                return;
                              }

                              try {
                                console.log('🎤 Requesting microphone permission (direct button call)...');
                                setMicrophonePermission('checking');

                                // Direct call - create promise immediately, then await
                                const stream = await navigator.mediaDevices.getUserMedia({
                                  audio: {
                                    echoCancellation: true,
                                    noiseSuppression: true,
                                    autoGainControl: true
                                  }
                                });

                                stream.getTracks().forEach(track => track.stop());
                                setMicrophonePermission('granted');
                                if (speechRecognitionRef.current) {
                                  speechRecognitionRef.current.setMicrophonePermissionGranted(true);
                                }
                                console.log('✅ Microphone permission granted');
                              } catch (error: any) {
                                console.error('❌ Microphone permission error:', error);
                                setMicrophonePermission('denied');
                                if (speechRecognitionRef.current) {
                                  speechRecognitionRef.current.setMicrophonePermissionGranted(false);
                                }

                                if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                                  alert('Microphone permission was denied.\n\nTo enable:\n1. Tap the "AA" icon in Safari address bar\n2. Select "Website Settings"\n3. Set Microphone to "Allow"\n4. Refresh the page');
                                } else {
                                  alert(`Error: ${error.message || error.name}`);
                                }
                              }
                            }}
                            className="text-sm px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-800 dark:hover:bg-red-900 text-white rounded-lg transition-colors font-medium"
                          >
                            Request Permission
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {microphonePermission === 'granted' && (
                    <div className="mb-6 bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-green-700 dark:text-green-300 text-sm font-medium">
                          Microphone permission granted. Ready to start!
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mb-8 text-left max-w-xl mx-auto">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-base">Tips for Success</h3>
                      </div>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2.5">
                        <li className="flex items-start gap-3">
                          <span className="text-blue-600 dark:text-blue-400 mt-1 font-semibold">•</span>
                          <span>Be specific with concrete examples from your experience</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-blue-600 dark:text-blue-400 mt-1 font-semibold">•</span>
                          <span>Use the STAR method (Situation, Task, Action, Result)</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-blue-600 dark:text-blue-400 mt-1 font-semibold">•</span>
                          <span>Take time to think before answering</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={startInterview}
                    disabled={microphonePermission === 'denied' && voiceInputMode}
                    className={`w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl font-semibold text-base transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] transform flex items-center justify-center gap-2 ${microphonePermission === 'denied' && voiceInputMode
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                      }`}
                  >
                    <FiMic className="w-5 h-5" />
                    {isIOS() && microphonePermission === 'prompt' && voiceInputMode
                      ? 'Enable Mic & Start'
                      : 'Start Interview'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              ) : (
                /* Interview Session */
                <div className="flex-1 flex flex-col min-h-0 space-y-4">
                  {/* Messages Chat Container */}
                  <div
                    ref={messagesContainerRef}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 flex-1 min-h-0 overflow-y-auto border border-gray-200 dark:border-gray-700"
                  >
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex items-start gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                        >
                          {/* Avatar */}
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${message.role === "user"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                            }`}>
                            {message.role === "user" ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            )}
                          </div>

                          {/* Message Bubble */}
                          <div className={`flex flex-col gap-1 max-w-[75%] ${message.role === "user" ? "items-end" : "items-start"}`}>
                            <div
                              className={`rounded-2xl px-4 py-3 ${message.role === "user"
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                }`}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            </div>
                            <span className={`text-xs text-gray-500 dark:text-gray-400 px-2 ${message.role === "user" ? "text-right" : "text-left"}`}>
                              {message.role === "user" ? "You" : "AI Interviewer"}
                            </span>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
                            <div className="flex gap-2 items-center">
                              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                              <span className="text-gray-600 dark:text-gray-400 text-sm ml-2">AI is thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Invisible element to scroll to */}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Answer Input */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border border-gray-200 dark:border-gray-700 flex-shrink-0">
                    {/* Feedback Message */}
                    {feedbackMessage && (
                      <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-start gap-3 animate-fade-in">
                        <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">{feedbackMessage}</p>
                      </div>
                    )}

                    {/* Voice Input Mode Toggle */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setVoiceInputMode(!voiceInputMode)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${voiceInputMode
                              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600"
                            }`}
                        >
                          {voiceInputMode ? (
                            <>
                              <FiMic className="w-4 h-4" />
                              <span>Voice</span>
                            </>
                          ) : (
                            <>
                              <FiMicOff className="w-4 h-4" />
                              <span>Text</span>
                            </>
                          )}
                        </button>
                      </div>
                      {isAISpeaking && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                          </div>
                          <span className="text-blue-700 dark:text-blue-300 text-sm font-medium">AI speaking...</span>
                        </div>
                      )}
                    </div>

                    {voiceInputMode ? (
                      /* Voice Input Mode */
                      <div className="space-y-3">
                        {(interimTranscript || isListening) && (
                          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div>
                              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Live Transcription</span>
                            </div>
                            <p className="text-gray-900 dark:text-white text-sm leading-relaxed min-h-[20px]">
                              {interimTranscript || (isListening ? "Listening..." : "")}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => toggleVoiceInput(e)}
                            onTouchStart={async (e) => {
                              e.preventDefault();
                              if (!isListening && !isAISpeaking && !isLoading) {
                                await toggleVoiceInput(e);
                              }
                            }}
                            disabled={isAISpeaking || isLoading}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform active:scale-[0.98] touch-manipulation ${isListening
                                ? "bg-red-600 hover:bg-red-700 text-white"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                              }`}
                          >
                            {isListening ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white rounded-full animate-ping"></div>
                                <span>Listening... Click to stop</span>
                              </>
                            ) : (
                              <>
                                <FiMic className="w-4 h-4" />
                                <span>{isAISpeaking ? "Wait for AI..." : "Click to speak"}</span>
                              </>
                            )}
                          </button>
                        </div>
                        {!speechRecognitionRef.current?.isSupported() && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-yellow-700 dark:text-yellow-300 text-xs font-medium">
                              Voice input may not be supported. Use text mode or try Chrome/Edge/Safari.
                            </p>
                          </div>
                        )}
                        {speechRecognitionRef.current?.isSupported() && isIOS() && !isListening && !isAISpeaking && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-blue-700 dark:text-blue-300 text-xs font-medium">
                              <span className="font-semibold">iOS:</span> Click mic button to start voice input.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Text Input Mode */
                      <div className="space-y-3">
                        <div className="relative">
                          <textarea
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                submitAnswer();
                              }
                            }}
                            placeholder="Type your answer..."
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none transition-all duration-200 text-sm leading-relaxed"
                            rows={3}
                            disabled={isLoading || isAISpeaking}
                          />
                          <div className="absolute bottom-3 right-3 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500">Enter</kbd>
                            <span>to send</span>
                          </div>
                        </div>
                        <button
                          onClick={() => submitAnswer()}
                          disabled={!userAnswer.trim() || isLoading || isAISpeaking}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform active:scale-[0.98]"
                        >
                          <FiSend className="w-4 h-4" />
                          <span>Send Answer</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
