import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { useStore } from '../store';
import { Question } from '../types';

export function ReadingTestPage() {
  const { id } = useParams<{ id: string }>();
  const { articles, loadArticles, loadQuestions } = useStore();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | string>>({});
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<{ correct: number; total: number } | null>(null);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  useEffect(() => {
    if (id) {
      loadQuestions(id).then((data) => {
        if (data) {
          setQuestions(data);
        }
        setLoading(false);
      });
    }
  }, [id, loadQuestions]);

  const article = articles.find((a) => String(a.id) === id);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 rounded-full bg-gray-200 mx-auto mb-4" />
              <p className="text-gray-500">加载中...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!article || questions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 mb-4">没有测试题目</p>
            <Link to="/reading">
              <Button>返回文章列表</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const allAnswered = questions.every((q, index) => {
    if (q.type === 'choice') {
      return selectedAnswers[index] !== undefined;
    } else {
      return selectedAnswers[index] !== undefined && String(selectedAnswers[index]).trim() !== '';
    }
  });

  const handleSelectAnswer = (answerIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion]: answerIndex }));
  };

  const handleFillAnswer = (value: string) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion]: value }));
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestion(index);
  };

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach((q, index) => {
      const userAnswer = selectedAnswers[index];
      if (q.type === 'choice') {
        if (userAnswer === q.correctAnswer) correct++;
      } else {
        if (String(userAnswer).trim() === String(q.correctAnswerText).trim()) correct++;
      }
    });
    setResults({ correct, total: questions.length });
    setIsSubmitted(true);
  };

  const getQuestionResult = (index: number): 'correct' | 'wrong' | null => {
    if (!isSubmitted) return null;
    const q = questions[index];
    const userAnswer = selectedAnswers[index];
    if (q.type === 'choice') {
      return userAnswer === q.correctAnswer ? 'correct' : 'wrong';
    } else {
      return String(userAnswer).trim() === String(q.correctAnswerText).trim() ? 'correct' : 'wrong';
    }
  };

  const currentResult = isSubmitted ? getQuestionResult(currentQuestion) : null;
  const userAnswer = selectedAnswers[currentQuestion];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/reading/${id}`} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-sm text-gray-500">
          {currentQuestion + 1}/{questions.length}
        </span>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    currentQ.type === 'choice' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {currentQ.type === 'choice' ? '选择题' : '填空题'}
                  </span>
                  <span className="text-sm text-gray-500">第 {currentQuestion + 1} 题</span>
                </div>
                {isSubmitted && currentResult && (
                  <span className={`flex items-center gap-1 text-sm font-medium ${
                    currentResult === 'correct' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {currentResult === 'correct' ? <Check size={16} /> : <X size={16} />}
                    {currentResult === 'correct' ? '回答正确' : '回答错误'}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-medium text-primary-950 mb-6">
                {currentQ.question}
              </h2>

              {currentQ.type === 'choice' ? (
                <div className="space-y-3">
                  {currentQ.options.map((option, index) => {
                    const isSelected = selectedAnswers[currentQuestion] === index;
                    const isCorrect = index === currentQ.correctAnswer;
                    const showCorrect = isSubmitted && isCorrect;
                    const showWrong = isSubmitted && isSelected && !isCorrect;

                    return (
                      <button
                        key={index}
                        onClick={() => handleSelectAnswer(index)}
                        disabled={isSubmitted}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          showCorrect
                            ? 'border-green-500 bg-green-50'
                            : showWrong
                            ? 'border-red-500 bg-red-50'
                            : isSelected
                            ? 'border-accent-500 bg-accent-50'
                            : 'border-gray-200 hover:border-accent-300 hover:bg-accent-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            showCorrect
                              ? 'bg-green-500 text-white'
                              : showWrong
                              ? 'bg-red-500 text-white'
                              : isSelected
                              ? 'bg-accent-500 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="font-medium flex-1">{option}</span>
                          {showCorrect && <Check size={20} className="text-green-600" />}
                          {showWrong && <X size={20} className="text-red-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={String(selectedAnswers[currentQuestion] || '')}
                    onChange={(e) => handleFillAnswer(e.target.value)}
                    disabled={isSubmitted}
                    placeholder="请输入答案"
                    className={`w-full px-4 py-3 rounded-xl border-2 outline-none ${
                      isSubmitted
                        ? currentResult === 'correct'
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                        : 'border-gray-200 focus:border-accent-500'
                    }`}
                  />
                </div>
              )}

              {isSubmitted && (
                <div className="mt-6 p-4 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-primary-950">正确答案：</span>
                    {currentQ.type === 'choice' && currentQ.correctAnswer !== null ? (
                      <span className="font-bold text-green-600">
                        {String.fromCharCode(65 + currentQ.correctAnswer)}. {currentQ.options[currentQ.correctAnswer]}
                      </span>
                    ) : (
                      <span className="font-bold text-green-600">{currentQ.type === 'choice' ? '-' : currentQ.correctAnswerText}</span>
                    )}
                  </div>
                  {userAnswer !== undefined && (
                    <div className="text-sm text-gray-500">
                      你的答案：{currentQ.type === 'choice' ? String.fromCharCode(65 + (userAnswer as number)) : String(userAnswer)}
                    </div>
                  )}
                </div>
              )}

              {isSubmitted && (
                <div className="mt-4 p-4 rounded-xl bg-blue-50">
                  <p className="text-sm">
                    <span className="font-medium text-primary-950">解析：</span>
                    <span className="text-gray-700">{currentQ.explanation || '略。'}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion((i) => Math.max(0, i - 1))}
                disabled={currentQuestion === 0}
              >
                上一题
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion((i) => Math.min(questions.length - 1, i + 1))}
                disabled={currentQuestion === questions.length - 1}
              >
                下一题
              </Button>
            </div>
            {!isSubmitted ? (
              allAnswered ? (
                <Button onClick={handleSubmit}>
                  提交答案
                </Button>
              ) : (
                <span className="text-sm text-gray-500">
                  还需回答 {questions.filter((q, i) => {
                    if (q.type === 'choice') return selectedAnswers[i] === undefined;
                    return !selectedAnswers[i] || String(selectedAnswers[i]).trim() === '';
                  }).length} 题
                </span>
              )
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  答对 {results?.correct || 0}/{results?.total || 0} 题
                </span>
                <Link to={`/reading/${id}`}>
                  <Button variant="outline">返回文章详情</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="w-80 flex-shrink-0">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-primary-950 mb-3">题目导航</h3>
              <div className="grid grid-cols-5 gap-6">
                {questions.map((_, index) => {
                  const isCurrent = index === currentQuestion;
                  const result = getQuestionResult(index);
                  return (
                    <button
                      key={index}
                      onClick={() => handleJumpToQuestion(index)}
                      className={`w-11 h-11 rounded-lg text-sm font-medium transition-all flex items-center justify-center relative ${
                        isCurrent && !isSubmitted
                          ? 'bg-accent-500 text-white border-2 border-accent-500'
                          : result === 'correct'
                          ? 'bg-white text-green-600 border-2 border-green-500'
                          : result === 'wrong'
                          ? 'bg-white text-red-600 border-2 border-red-500'
                          : 'bg-white text-gray-600 border-2 border-gray-300 hover:border-gray-400'
                      }`}
                      title={`第 ${index + 1} 题${result === 'correct' ? ' - 正确' : result === 'wrong' ? ' - 错误' : ''}`}
                    >
                      <span className="text-sm font-bold z-10">{index + 1}</span>
                      {(result === 'correct' || result === 'wrong') && (
                        <span className={`absolute inset-0 flex items-center justify-center ${
                          result === 'correct' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {result === 'correct' ? <Check size={16} className="opacity-70" /> : <X size={16} className="opacity-70" />}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {isSubmitted && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Check size={14} className="text-green-600" />
                      <span>正确</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <X size={14} className="text-red-600" />
                      <span>错误</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
