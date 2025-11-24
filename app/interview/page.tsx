"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, getUserProfile, type User, type UserProfile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { FiMic, FiSend, FiX, FiVolume2, FiVolumeX, FiMicOff } from "react-icons/fi";
import BottomNav from "@/components/BottomNav";
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
  
  // Refs
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const initialQuestionReceivedRef = useRef<boolean>(false);

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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isLoading, currentQuestion]);

  const startInterview = async () => {
    // For iOS, request microphone permission first (requires user interaction)
    // IMPORTANT: This must be called directly in the click handler to preserve user interaction context
    const isIOSDevice = typeof window !== 'undefined' && 
      (/iPad|iPhone|iPod/.test(navigator.userAgent) || 
       (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

    if (isIOSDevice && voiceInputMode) {
      // Check if we need to request permission
      // Request microphone permission directly using getUserMedia
      // This must happen synchronously in the click handler to trigger iOS prompt
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Microphone access is not available in this browser.');
        return;
      }

      // Check if we're on HTTPS (required for iOS)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        alert('Microphone access requires HTTPS. Please access this site over HTTPS.');
        return;
      }

      // Request permission if not already granted
      // On iOS with "Ask" setting, we need to request every time until granted
      if (microphonePermission !== 'granted') {
        try {
          console.log('🎤 Requesting microphone permission on iOS...');
          setMicrophonePermission('checking');
          
          // Call getUserMedia directly - this will trigger iOS permission prompt
          // This MUST be called within the user interaction handler (button click)
          // The await preserves the user interaction context
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            } 
          });
          
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
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
          
          setMicrophonePermission('denied');
          if (speechRecognitionRef.current) {
            speechRecognitionRef.current.setMicrophonePermissionGranted(false);
          }
          
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            alert('Microphone permission was denied. Please:\n1. Go to Settings > Safari > Microphone\n2. Allow access for this website\n3. Refresh the page and try again');
          } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            alert('No microphone found. Please connect a microphone and try again.');
          } else {
            alert(`Microphone permission error: ${error.message || error.name}. Please ensure you allow microphone access when prompted.`);
          }
          return;
        }
      }
    }

    setIsInterviewing(true);
    setIsLoading(true);
    initialQuestionReceivedRef.current = false; // Reset flag
    
    // Safety timeout: If we're still loading after 35 seconds, show fallback question
    // This prevents the UI from being stuck on "AI is thinking" indefinitely
    const safetyTimeout = setTimeout(() => {
      if (!initialQuestionReceivedRef.current) {
        console.warn('Safety timeout triggered - showing fallback question (likely network issue)');
        initialQuestionReceivedRef.current = true; // Mark as handled
        const fallbackQuestion = "Tell me about yourself.";
        setCurrentQuestion(fallbackQuestion);
        setMessages([{ role: "assistant", content: fallbackQuestion }]);
        setQuestionCount(1);
        setIsLoading(false);
        
        // Speak the fallback question
        if (isAudioEnabled && speechSynthesisRef.current) {
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
        
        // Create a system message for the first question
        const initialMessages = [{
          role: "user" as const,
          content: profile?.workExperience && profile.workExperience.length > 0
            ? `I'm ready to start the interview. I have experience as ${profile.workExperience[0].position} at ${profile.workExperience[0].company}.`
            : profile?.education && profile.education.length > 0
            ? `I'm ready to start the interview. I studied ${profile.education[0].field} at ${profile.education[0].institution}.`
            : "I'm ready to start the interview."
        }];

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
          setMessages([{ role: "assistant", content: initialQuestion }]);
          setQuestionCount(1); // First question
          setIsLoading(false);

        // Speak the initial question using AWS Polly
        if (isAudioEnabled && speechSynthesisRef.current) {
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
          setMessages([{ role: "assistant", content: fallbackQuestion }]);
          setQuestionCount(1);
          setIsLoading(false);
          
          // Speak the fallback question
          if (isAudioEnabled && speechSynthesisRef.current) {
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
        setMessages([{ role: "assistant", content: fallbackQuestion }]);
        setQuestionCount(1);
        setIsLoading(false);

        // Speak the fallback question
        if (isAudioEnabled && speechSynthesisRef.current) {
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

    // Resume audio context on user interaction (required for autoplay)
    // This runs in parallel with the API call (non-blocking)
    if (speechSynthesisRef.current) {
      // This will resume the audio context if it's suspended
      try {
        // Trigger a silent audio play to resume context
        const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
        silentAudio.play().catch(() => {}); // Don't await - run in parallel
      } catch (e) {
        // Ignore errors
      }
    }
  };

  const submitAnswer = async (answerText?: string) => {
    const answer = answerText || userAnswer;
    if (!answer.trim()) return;

    // Stop listening if active
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    }

    // Add user answer to messages
    const newMessages = [...messages, { role: "user" as const, content: answer }];
    setMessages(newMessages);
    setUserAnswer("");
    setInterimTranscript("");
    setIsLoading(true);

    try {
      // Get session token to pass to API
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      // Call AWS Bedrock API for AI response
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
      
      const newQuestionCount = questionCount + 1;
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


    // Generate report and save session
    // Ensure we have a valid user session before proceeding
    if (!user) {
      console.error('Cannot save interview: No user found');
      alert('You must be logged in to save the interview. Please log in and try again.');
      setIsInterviewing(false);
      return;
    }
    
    if (messages.length > 0) {
      try {
        // Generate report (with timeout and error handling)
        let report = null;
        let reportGenerated = false;
        try {
          const reportController = new AbortController();
          const reportTimeout = setTimeout(() => reportController.abort(), 30000); // 30 second timeout
          
          // Get session token for report generation
          const reportToken = await getSessionToken();
          if (!reportToken) {
            console.error('Failed to get session token for report generation');
          }
          
          const reportHeaders: HeadersInit = {
            'Content-Type': 'application/json',
          };
          
          if (reportToken) {
            reportHeaders['Authorization'] = `Bearer ${reportToken}`;
            console.log('Authorization header set for report generation');
          } else {
            console.warn('No token available for report generation - will rely on cookies');
          }
          
          const reportResponse = await fetch('/api/interview/generate-report', {
            method: 'POST',
            headers: reportHeaders,
            credentials: 'include',
            body: JSON.stringify({
              messages: messages,
              duration: 0,
            }),
            signal: reportController.signal,
          });

          clearTimeout(reportTimeout);

          if (reportResponse.ok) {
            const reportData = await reportResponse.json();
            report = reportData.report;
            reportGenerated = true;
            console.log('Report generated successfully');
          } else {
            const errorData = await reportResponse.json().catch(() => ({}));
            console.warn('Report generation failed (non-critical):', errorData.error || 'Unknown error');
            // Continue without report
          }
        } catch (reportError: any) {
          if (reportError.name === 'AbortError') {
            console.warn('Report generation timed out (non-critical)');
          } else {
            console.warn('Error generating report (non-critical):', reportError.message || reportError);
          }
          // Continue without report
        }

        // Save session (with error handling)
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
          
          const saveResponse = await fetch('/api/interview/save', {
            method: 'POST',
            headers: saveHeaders,
            credentials: 'include',
            body: JSON.stringify({
              sessionData: {
                messages: messages,
                currentQuestion: currentQuestion,
              },
              report: report,
              duration: 0,
            }),
          });

          if (saveResponse.ok) {
            const { session } = await saveResponse.json();
            sessionId = session.id;
            sessionSaved = true;
            console.log('Session saved successfully');
          } else {
            const errorData = await saveResponse.json().catch(() => ({}));
            console.error('Failed to save interview session:', errorData.error || 'Unknown error');
            // Don't show error if report was generated - we can still show the report
          }
        } catch (saveError: any) {
          console.error('Error saving interview session:', saveError.message || saveError);
          // Don't show error if report was generated - we can still show the report
        }

        // Redirect based on what succeeded
        if (sessionSaved && sessionId) {
          // Best case: both report and session saved, redirect to report page
          router.push(`/interview/report/${sessionId}`);
          return;
        } else if (reportGenerated && report) {
          // Report generated but save failed - store report temporarily and show it
          // Store report in sessionStorage for temporary viewing
          const tempReportData = {
            report: report,
            messages: messages,
            duration: 0,
            timestamp: Date.now(),
          };
          sessionStorage.setItem('temp_interview_report', JSON.stringify(tempReportData));
          router.push('/interview/report/temp');
          return;
        } else {
          // Both failed - show error
          alert('Interview ended, but there was an error generating the report and saving the session. Please try again later.');
        }
      } catch (error: any) {
        console.error('Unexpected error during interview end:', error.message || error);
        alert('An unexpected error occurred. The interview has ended.');
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
    <div className="min-h-screen px-4 py-8 pb-24 bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>
      
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="glass-dark rounded-3xl shadow-2xl p-8 mb-8 border border-white/10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">
                AI Interview Practice
              </h1>
              <p className="text-gray-400 text-sm font-medium">Practice your interview skills with real-time AI feedback</p>
            </div>
            {isInterviewing && (
              <div className="flex items-center gap-3">
                {questionCount > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary-500/20 rounded-xl border border-primary-500/30">
                    <span className="text-primary-300 text-sm font-semibold">Question {questionCount}/{MAX_QUESTIONS}</span>
                  </div>
                )}
              <button
                onClick={endInterview}
                  className="flex items-center gap-2 px-5 py-2.5 text-red-300 hover:text-white bg-red-500/20 hover:bg-red-500/30 rounded-xl transition-all duration-200 border border-red-500/30 hover:border-red-500/50"
              >
                  <FiX className="text-lg" />
                  <span className="hidden sm:inline text-sm font-semibold">End Interview</span>
              </button>
              </div>
            )}
          </div>
        </div>

        {!isInterviewing ? (
          /* Start Interview Screen */
          <div className="glass-dark rounded-3xl shadow-2xl p-10 text-center border border-white/10 card-hover">
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-500/30 to-primary-600/30 rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-primary-500/50 shadow-2xl shadow-primary-500/30">
                <FiMic className="text-5xl text-primary-300" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Ready to Practice?</h2>
              <p className="text-gray-400 text-base leading-relaxed max-w-2xl mx-auto">
                Start an AI-powered interview session. Answer questions naturally, and our AI will speak to you and provide intelligent follow-up questions.
              </p>
            </div>

            {/* Microphone Permission Status */}
            {microphonePermission === 'checking' && (
              <div className="mb-6 glass rounded-2xl p-5 border border-blue-500/40 bg-gradient-to-r from-blue-500/10 to-blue-600/10 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                  <p className="text-blue-300 text-sm font-medium">
                    Requesting microphone permission...
                  </p>
                </div>
              </div>
            )}

            {microphonePermission === 'prompt' && isIOS() && voiceInputMode && (
              <div className="mb-6 glass rounded-2xl p-5 border border-blue-500/40 bg-gradient-to-r from-blue-500/10 to-blue-600/10 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-blue-300 text-sm font-semibold mb-2">Microphone Access Required</p>
                    <p className="text-blue-200 text-sm">
                      When you click "Start Interview", your iPhone will prompt you to allow microphone access. 
                      Please tap <strong>"Allow"</strong> to enable voice input for the AI interview.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {microphonePermission === 'denied' && (
              <div className="mb-6 glass rounded-2xl p-5 border border-red-500/40 bg-gradient-to-r from-red-500/10 to-red-600/10 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-red-300 text-sm font-semibold mb-2">Microphone Permission Denied</p>
                    <p className="text-red-200 text-sm mb-3">
                      {isIOS() ? (
                        <>
                          To use voice input, please enable microphone access:
                          <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
                            <li>Go to <strong>Settings</strong> → <strong>Safari</strong> → <strong>Microphone</strong></li>
                            <li>Select <strong>Allow</strong> or ensure this website is set to <strong>Ask</strong></li>
                            <li>Refresh this page and try again</li>
                          </ol>
                        </>
                      ) : (
                        'Please enable microphone access in your browser settings to use voice input.'
                      )}
                    </p>
                    <button
                      onClick={async () => {
                        const recognition = speechRecognitionRef.current;
                        if (recognition) {
                          try {
                            setMicrophonePermission('checking');
                            const granted = await recognition.requestMicrophonePermission();
                            // Sync the permission status
                            recognition.setMicrophonePermissionGranted(granted);
                            setMicrophonePermission(granted ? 'granted' : 'denied');
                          } catch (error) {
                            console.error('Error requesting permission:', error);
                            setMicrophonePermission('denied');
                            recognition.setMicrophonePermissionGranted(false);
                          }
                        } else if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                          try {
                            setMicrophonePermission('checking');
                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                            stream.getTracks().forEach(track => track.stop());
                            setMicrophonePermission('granted');
                            // Try to sync with recognition if it exists now
                            const recognitionAfter = speechRecognitionRef.current;
                            if (recognitionAfter) {
                              recognitionAfter.setMicrophonePermissionGranted(true);
                            }
                          } catch (error) {
                            setMicrophonePermission('denied');
                            const recognitionAfter = speechRecognitionRef.current;
                            if (recognitionAfter) {
                              recognitionAfter.setMicrophonePermissionGranted(false);
                            }
                          }
                        }
                      }}
                      className="text-xs px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg border border-red-500/40 transition-colors"
                    >
                      Request Permission
                    </button>
                  </div>
                </div>
              </div>
            )}

            {microphonePermission === 'granted' && (
              <div className="mb-6 glass rounded-2xl p-4 border border-green-500/40 bg-gradient-to-r from-green-500/10 to-green-600/10 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-green-300 text-sm font-medium">
                    Microphone permission granted. You're ready to start!
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4 mb-8 text-left max-w-2xl mx-auto">
              <div className="glass rounded-2xl p-6 border border-primary-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary-500/20 rounded-xl">
                    <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-white text-lg">Tips for a great interview:</h3>
                </div>
                <ul className="text-sm text-gray-300 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Be specific and provide concrete examples</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Use the STAR method (Situation, Task, Action, Result)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Take your time to think before answering</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Be honest and authentic in your responses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Look at the camera and speak clearly</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={startInterview}
              disabled={microphonePermission === 'denied' && voiceInputMode}
              className={`group relative w-full py-5 px-8 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 text-white rounded-2xl font-bold text-lg hover:from-primary-500 hover:via-primary-400 hover:to-primary-500 transition-all duration-300 shadow-2xl shadow-primary-500/40 hover:shadow-primary-500/60 active:scale-[0.98] transform overflow-hidden ${
                microphonePermission === 'denied' && voiceInputMode
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative flex items-center justify-center gap-3">
                <FiMic className="w-6 h-6" />
                {isIOS() && microphonePermission === 'prompt' && voiceInputMode
                  ? 'Enable Microphone & Start Interview'
                  : 'Start Interview'}
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
            {microphonePermission === 'denied' && voiceInputMode && (
              <p className="text-center text-sm text-gray-400 mt-2">
                Switch to text mode or grant microphone permission to start
              </p>
            )}
            {isIOS() && microphonePermission === 'prompt' && voiceInputMode && (
              <p className="text-center text-sm text-blue-300 mt-2">
                You'll be prompted to allow microphone access when you click above
              </p>
            )}
          </div>
        ) : (
          /* Interview Session */
          <div className="space-y-6">
            {/* Audio Control */}
            <div className="flex justify-end mb-4">
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-xl backdrop-blur-md transition-all shadow-lg ${
                  isAudioEnabled 
                    ? 'bg-gray-800/90 text-white hover:bg-gray-700/90 border border-gray-600/50' 
                    : 'bg-red-500/90 text-white hover:bg-red-600 border border-red-400/50'
                }`}
                title={isAudioEnabled ? "Mute AI voice" : "Unmute AI voice"}
              >
                {isAudioEnabled ? <FiVolume2 className="text-xl" /> : <FiVolumeX className="text-xl" />}
              </button>
            </div>

            {/* Messages Chat Container */}
            <div 
              ref={messagesContainerRef}
              className="glass-dark rounded-3xl shadow-2xl p-6 min-h-[400px] max-h-[500px] overflow-y-auto border border-white/10 mb-6 custom-scrollbar"
            >
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-4 ${message.role === "user" ? "flex-row-reverse" : "flex-row"} animate-fade-in`}
                  >
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-primary-500 to-primary-600 ring-2 ring-primary-400/50"
                        : "bg-gradient-to-br from-gray-700 to-gray-800 ring-2 ring-gray-600/50"
                    }`}>
                      {message.role === "user" ? (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      )}
                    </div>
                    
                    {/* Message Bubble */}
                    <div className={`flex flex-col gap-1 max-w-[75%] ${message.role === "user" ? "items-end" : "items-start"}`}>
                      <div
                        className={`rounded-2xl px-5 py-4 shadow-lg transition-all duration-200 ${
                        message.role === "user"
                            ? "bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white rounded-tr-sm shadow-primary-500/30"
                            : "bg-gradient-to-br from-gray-800/90 to-gray-900/90 text-gray-100 rounded-tl-sm border border-gray-700/50 backdrop-blur-sm"
                        }`}
                      >
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">{message.content}</p>
                      </div>
                      <span className={`text-xs text-gray-500 px-2 ${message.role === "user" ? "text-right" : "text-left"}`}>
                        {message.role === "user" ? "You" : "AI Interviewer"}
                      </span>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start gap-4 animate-fade-in">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 ring-2 ring-gray-600/50 shadow-lg">
                      <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl rounded-tl-sm px-5 py-4 border border-gray-700/50 backdrop-blur-sm">
                      <div className="flex gap-2 items-center">
                        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                        <span className="text-gray-400 text-sm ml-2">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                {/* Invisible element to scroll to */}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Current Question Highlight */}
            {currentQuestion && !isLoading && (
              <div className="relative glass rounded-2xl p-6 mb-6 border-2 border-primary-500/50 bg-gradient-to-br from-primary-600/30 via-primary-500/20 to-primary-600/30 backdrop-blur-sm shadow-xl shadow-primary-500/20 animate-fade-in">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-500 rounded-t-2xl"></div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-3 bg-primary-500/30 rounded-xl border border-primary-400/30 shadow-lg">
                    <svg className="w-6 h-6 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-primary-300 uppercase tracking-wider">Current Question</span>
                    </div>
                    <p className="text-white font-semibold text-lg leading-relaxed">{currentQuestion}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Answer Input */}
            <div className="glass-dark rounded-3xl shadow-2xl p-6 border border-white/10 backdrop-blur-xl">
              {/* Voice Input Mode Toggle */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setVoiceInputMode(!voiceInputMode)}
                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all duration-300 font-semibold shadow-lg ${
                      voiceInputMode
                        ? "bg-gradient-to-r from-primary-500/30 to-primary-600/30 text-primary-200 border-2 border-primary-500/50 hover:border-primary-400/70 hover:from-primary-500/40 hover:to-primary-600/40"
                        : "bg-gray-800/60 text-gray-400 border-2 border-gray-700/50 hover:border-gray-600/70 hover:bg-gray-800/80"
                    }`}
                  >
                    {voiceInputMode ? (
                      <>
                        <FiMic className="w-5 h-5" />
                        <span className="text-sm">Voice Mode</span>
                      </>
                    ) : (
                      <>
                        <FiMicOff className="w-5 h-5" />
                        <span className="text-sm">Text Mode</span>
                      </>
                    )}
                  </button>
                </div>
                {isAISpeaking && (
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-primary-500/20 to-primary-600/20 rounded-xl border border-primary-500/40 shadow-lg">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 bg-primary-400 rounded-full animate-bounce"></div>
                      <div className="w-2.5 h-2.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-2.5 h-2.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                    <span className="text-primary-200 text-sm font-bold">AI is speaking...</span>
                  </div>
                )}
              </div>

              {voiceInputMode ? (
                /* Voice Input Mode */
                <div className="space-y-4">
                  {interimTranscript && (
                    <div className="glass rounded-xl p-4 border-2 border-primary-500/40 bg-gradient-to-r from-primary-500/10 to-primary-600/10 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
                        <span className="text-xs font-semibold text-primary-300 uppercase tracking-wide">Listening...</span>
                      </div>
                      <p className="text-gray-200 text-base font-medium leading-relaxed">{interimTranscript}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={(e) => toggleVoiceInput(e)}
                      onTouchStart={async (e) => {
                        // For mobile, also handle touch events
                        e.preventDefault();
                        if (!isListening && !isAISpeaking && !isLoading) {
                          await toggleVoiceInput(e);
                        }
                      }}
                      disabled={isAISpeaking || isLoading}
                      className={`flex-1 flex items-center justify-center gap-3 px-8 py-6 rounded-2xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl transform active:scale-[0.98] touch-manipulation ${
                        isListening
                          ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white ring-4 ring-red-500/30 animate-pulse"
                          : "bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 hover:from-primary-500 hover:via-primary-400 hover:to-primary-500 text-white hover:shadow-primary-500/50"
                      }`}
                    >
                      {isListening ? (
                        <>
                          <div className="w-7 h-7 border-3 border-white rounded-full animate-ping"></div>
                          <span>Listening... Click to stop</span>
                        </>
                      ) : (
                        <>
                          <FiMic className="w-6 h-6" />
                          <span>{isAISpeaking ? "Wait for AI to finish..." : "Click to speak your answer"}</span>
                        </>
                      )}
                    </button>
                  </div>
                  {!speechRecognitionRef.current?.isSupported() && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-yellow-500/20 border border-yellow-500/40 rounded-xl">
                      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-yellow-300 text-sm font-medium">
                        Voice input may not be supported in this browser. 
                        {typeof window !== 'undefined' && /iPad|iPhone|iPod|Android/.test(navigator.userAgent) && (
                          <span className="block mt-1">On mobile, please ensure you're using Safari (iOS) or Chrome (Android) and have granted microphone permissions in your browser settings.</span>
                        )}
                        {typeof window !== 'undefined' && !/iPad|iPhone|iPod|Android/.test(navigator.userAgent) && (
                          <span className="block mt-1">Please use text mode or try Chrome, Edge, or Safari.</span>
                        )}
                      </p>
                    </div>
                  )}
                  {speechRecognitionRef.current?.isSupported() && isIOS() && !isListening && !isAISpeaking && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-blue-500/20 border border-blue-500/40 rounded-xl">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-blue-300 text-sm font-medium">
                        <span className="font-semibold">iOS Tip:</span> Click the microphone button above to start voice input. Voice input must be started manually on iOS devices.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Text Input Mode */
                <div className="space-y-4">
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
                placeholder="Type your answer here... (Press Enter to submit, Shift+Enter for new line)"
                      className="w-full px-5 py-4 bg-gray-900/60 border-2 border-gray-700/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/70 focus:ring-4 focus:ring-primary-500/20 resize-none transition-all duration-300 text-base leading-relaxed backdrop-blur-sm"
                      rows={5}
                      disabled={isLoading || isAISpeaking}
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2 text-xs text-gray-500">
                      <kbd className="px-2 py-1 bg-gray-800/50 rounded border border-gray-700/50">Enter</kbd>
                      <span>to send</span>
                    </div>
                  </div>
                <button
                    onClick={() => submitAnswer()}
                    disabled={!userAnswer.trim() || isLoading || isAISpeaking}
                    className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 hover:from-primary-500 hover:via-primary-400 hover:to-primary-500 text-white rounded-2xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-primary-500/50 transform active:scale-[0.98] group"
                  >
                    <FiSend className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    <span>Send Answer</span>
                    <svg className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </button>
              </div>
              )}
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

