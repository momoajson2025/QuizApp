import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Clock, Star, Trophy, Home, Play } from "lucide-react";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  questionText: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  points: number;
  timeLimit: number;
}

interface QuizData {
  id: string;
  title: string;
  description: string;
  totalQuestions: number;
  estimatedTime: number;
  difficulty: string;
}

export default function QuizInterface() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quizId = params.id;

  // Fetch quiz data
  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: ["/api/quizzes", quizId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!quizId,
  });

  // Fetch quiz questions
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ["/api/quizzes", quizId, "questions"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!quizId && quizStarted,
  });

  // Submit quiz attempt mutation
  const submitQuizMutation = useMutation({
    mutationFn: async (attemptData: any) => {
      const res = await apiRequest("POST", "/api/quiz-attempts", attemptData);
      return await res.json();
    },
    onSuccess: (data) => {
      setScore(data.attempt.score);
      setShowResult(true);
      toast({
        title: "Quiz completed!",
        description: `You earned $${data.earnings.toFixed(2)}!`,
      });
      
      // Invalidate user data to refresh stats
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Timer effect
  useEffect(() => {
    if (quizStarted && !showResult && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      handleNextQuestion();
    }
  }, [timeRemaining, quizStarted, showResult]);

  const startQuiz = () => {
    setQuizStarted(true);
    setTimeRemaining(30);
  };

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (questions?.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeRemaining(30);
    } else {
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = async () => {
    if (!questions || isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Calculate score
    let correctCount = 0;
    const answers = selectedAnswers.map((answer, index) => {
      const question = questions[index];
      const isCorrect = answer === question?.correctAnswer;
      if (isCorrect) correctCount++;
      
      return {
        questionId: question?.id || '',
        answer: answer || '',
        timeSpent: 30 - timeRemaining,
      };
    });

    const finalScore = Math.round((correctCount / questions.length) * 100);
    const totalTimeSpent = (currentQuestionIndex + 1) * 30;

    try {
      await submitQuizMutation.mutateAsync({
        quizId: quiz?.id,
        score: finalScore,
        totalQuestions: questions.length,
        correctAnswers: correctCount,
        timeSpent: totalTimeSpent,
        answers,
      });
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) {
    setLocation('/auth');
    return null;
  }

  if (quizLoading || questionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Play className="h-8 w-8 text-white" />
          </div>
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md glass-card border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            {/* Celebration graphic */}
            <div className="w-32 h-32 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full mx-auto mb-6 flex items-center justify-center relative animate-fade-in">
              <Trophy className="h-12 w-12 text-purple-600" />
              {/* Floating stars */}
              <div className="absolute -top-2 -right-2 text-yellow-400">
                <Star className="h-6 w-6 animate-pulse" />
              </div>
              <div className="absolute -bottom-2 -left-2 text-yellow-400">
                <Star className="h-4 w-4 animate-pulse delay-100" />
              </div>
              <div className="absolute top-1 -left-4 text-yellow-400">
                <Star className="h-3 w-3 animate-pulse delay-200" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-foreground mb-2">Congratulations!</h1>
            <p className="text-muted-foreground mb-6">
              Great job, {user.firstName}! You have done well
            </p>

            {/* Score Display */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-1">Your Score</p>
              <p className="text-4xl font-bold gradient-text" data-testid="final-score">
                {score}%
              </p>
            </div>

            {/* Earnings Display */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center space-x-2 text-green-700">
                <Star className="h-5 w-5" />
                <span className="font-semibold">Points Earned!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">Quiz completed successfully</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => setLocation('/dashboard')}
                className="w-full gradient-bg text-white hover:shadow-lg transform hover:scale-[1.02] transition-all"
                data-testid="back-to-home-button"
              >
                Back to Home
              </Button>
              <Button
                onClick={() => setLocation('/quiz')}
                variant="outline"
                className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                data-testid="play-again-button"
              >
                Play Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        {/* Header */}
        <div className="bg-white border-b border-border px-4 py-3">
          <div className="flex items-center max-w-4xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => setLocation('/dashboard')}
              className="flex items-center text-muted-foreground hover:text-foreground"
              data-testid="back-to-dashboard-button"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Button>
          </div>
        </div>

        {/* Quiz Preview */}
        <div className="max-w-2xl mx-auto p-4 py-8">
          <Card className="glass-card border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-24 h-24 gradient-bg rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Play className="h-12 w-12 text-white" />
              </div>
              
              <h1 className="text-2xl font-bold text-foreground mb-4">
                {quiz?.title || "Quiz Challenge"}
              </h1>
              
              <p className="text-muted-foreground mb-8">
                {quiz?.description || "Test your knowledge and earn rewards"}
              </p>

              {/* Quiz Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold">{quiz?.estimatedTime || 15} min</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Star className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-sm text-muted-foreground">Questions</p>
                  <p className="font-semibold">{quiz?.totalQuestions || 20}</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Trophy className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-sm text-muted-foreground">Difficulty</p>
                  <p className="font-semibold capitalize">{quiz?.difficulty || "Medium"}</p>
                </div>
              </div>

              <Button
                onClick={startQuiz}
                className="gradient-bg text-white px-8 py-4 text-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all"
                data-testid="start-quiz-button"
              >
                Start Quiz
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = questions?.[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / (questions?.length || 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Quiz Header */}
      <div className="bg-white border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setLocation('/dashboard')}
            className="flex items-center text-muted-foreground hover:text-foreground"
            data-testid="back-button"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Question</p>
              <p className="font-semibold text-foreground" data-testid="question-counter">
                {currentQuestionIndex + 1}/{questions?.length || 0}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Time</p>
              <p className="font-semibold text-foreground" data-testid="time-remaining">
                {formatTime(timeRemaining)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mt-3">
          <Progress value={progress} className="w-full h-2" />
        </div>
      </div>

      {/* Quiz Content */}
      <div className="max-w-4xl mx-auto p-4 py-8">
        <Card className="glass-card border-0 shadow-xl">
          <CardContent className="p-6 lg:p-8">
            <div className="text-center mb-8">
              <h1 className="text-xl lg:text-2xl font-bold text-foreground mb-4">
                {currentQuestion?.questionText || "Loading question..."}
              </h1>
              
              {/* Question illustration placeholder */}
              <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl mx-auto flex items-center justify-center mb-6">
                <Play className="h-12 w-12 text-purple-500" />
              </div>
            </div>

            {/* Answer Options */}
            <div className="space-y-4 mb-8">
              {currentQuestion?.options?.map((option: any, index: number) => {
                const letters = ['A', 'B', 'C', 'D'];
                const isSelected = selectedAnswers[currentQuestionIndex] === option.text;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option.text)}
                    className={`w-full p-4 text-left border-2 rounded-xl transition-all group ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary hover:bg-primary/5"
                    }`}
                    data-testid={`answer-option-${letters[index]}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 border-2 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary text-white"
                          : "border-muted-foreground group-hover:border-primary group-hover:bg-primary group-hover:text-white"
                      }`}>
                        <span className="font-semibold">{letters[index]}</span>
                      </div>
                      <span className="text-foreground font-medium">{option.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleNextQuestion()}
                data-testid="skip-question-button"
              >
                Skip Question
              </Button>
              <Button
                onClick={handleNextQuestion}
                disabled={!selectedAnswers[currentQuestionIndex]}
                className="flex-1 gradient-bg text-white hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:transform-none"
                data-testid="next-question-button"
              >
                {currentQuestionIndex === (questions?.length || 1) - 1 ? "Finish Quiz" : "Next Question"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ad Placement Area */}
        <div className="mt-8">
          <Card className="glass-card border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Advertisement</p>
              <div className="h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">Ad Content Area</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
