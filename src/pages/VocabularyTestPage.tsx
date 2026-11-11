import { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Brain, Clock, Zap } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { useStore } from '../store';
import { idKey, sameId, shuffleArray } from '../utils/helpers';
import { Word } from '../types';

const ReviewIntervals = [1, 2, 4, 7, 15, 30];

const getOptimalReviewDays = (reviewCount: number): number => {
  const index = Math.min(reviewCount, ReviewIntervals.length - 1);
  return ReviewIntervals[index];
};

const calculateUrgency = (word: Word): number => {
  if (!word.lastReviewedAt) return 100;
  
  const lastReviewed = new Date(word.lastReviewedAt);
  const now = new Date();
  const daysSinceReview = Math.floor((now.getTime() - lastReviewed.getTime()) / (1000 * 60 * 60 * 24));
  const optimalDays = getOptimalReviewDays(word.reviewCount || 0);
  
  if (daysSinceReview >= optimalDays) {
    return 100 - Math.min(daysSinceReview - optimalDays, 50);
  }
  
  return Math.floor((daysSinceReview / optimalDays) * 50);
};

export function VocabularyTestPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const { words, chapters, loadWords, updateWord, updateTodayRecord } = useStore();
  const [testWords, setTestWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const chapterIdKey = idKey(chapterId);
  const currentChapter = chapters.find(c => sameId(c.id, chapterIdKey));

  useEffect(() => {
    if (chapterIdKey) {
      loadWords(chapterIdKey);
    }
  }, [chapterIdKey, loadWords]);

  useEffect(() => {
    if (chapterIdKey && !isFinished && words.length > 0) {
      const nonMasteredWords = words.filter(w => w.status !== 'mastered');
      
      if (nonMasteredWords.length === 0) {
        setTestWords([]);
        return;
      }
      
      const reviewableWords = nonMasteredWords
        .map(w => ({
          ...w,
          urgency: calculateUrgency(w)
        }))
        .filter(w => w.urgency >= 50)
        .sort((a, b) => b.urgency - a.urgency);

      const testPool = reviewableWords.length > 0 ? reviewableWords : nonMasteredWords;
      const shuffled = shuffleArray(testPool);
      const newTestWords = shuffled.slice(0, Math.min(10, shuffled.length));
      
      if (newTestWords.length > 0) {
        setTestWords(newTestWords);
        setCurrentIndex(0);
        setShowMeaning(false);
      }
    }
  }, [chapterIdKey, isFinished, words.length]);

  const currentWord = testWords[currentIndex];
  const progress = ((currentIndex + 1) / testWords.length) * 100;

  const handleShowMeaning = () => {
    if (!showMeaning && currentWord) {
      setReviewedCount((c) => c + 1);
      updateWord(currentWord.id, {
        reviewCount: (currentWord.reviewCount || 0) + 1,
        lastReviewedAt: new Date().toISOString(),
      });
      setShowMeaning(true);
    }
  };

  const handleCardClick = () => {
    handleShowMeaning();
  };

  const handleNext = () => {
    if (currentIndex < testWords.length - 1) {
      setCurrentIndex((i) => i + 1);
      setShowMeaning(false);
    } else {
      setIsFinished(true);
      updateTodayRecord({
        wordsLearned: (words.filter((w) => w.status === 'mastered').length || 0) + reviewedCount,
      });
    }
  };

  const handleMarkAsMastered = () => {
    updateWord(currentWord.id, {
      status: 'mastered' as const,
      reviewCount: (currentWord.reviewCount || 0) + 1,
      lastReviewedAt: new Date().toISOString(),
    });
    setCorrectCount((c) => c + 1);
    handleNext();
  };

  const handleBack = () => {
    navigate(`/vocabulary/chapter/${chapterId}`);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setShowMeaning(false);
    setReviewedCount(0);
    setCorrectCount(0);
    setIsFinished(false);
    
    const reviewableWords = words
      .filter(w => w.status !== 'mastered')
      .map(w => ({
        ...w,
        urgency: calculateUrgency(w)
      }))
      .filter(w => w.urgency >= 50)
      .sort((a, b) => b.urgency - a.urgency);

    const shuffled = shuffleArray(reviewableWords.length > 0 ? reviewableWords : words.filter(w => w.status !== 'mastered'));
    setTestWords(shuffled.slice(0, Math.min(10, shuffled.length)));
  };

  const getReviewStage = (word: Word): { stage: number; label: string; color: string } => {
    const count = word.reviewCount || 0;
    if (count === 0) return { stage: 0, label: '新单词', color: 'bg-blue-100 text-blue-700' };
    if (count === 1) return { stage: 1, label: '第1天复习', color: 'bg-green-100 text-green-700' };
    if (count === 2) return { stage: 2, label: '第3天复习', color: 'bg-yellow-100 text-yellow-700' };
    if (count === 3) return { stage: 3, label: '第7天复习', color: 'bg-orange-100 text-orange-700' };
    if (count === 4) return { stage: 4, label: '第14天复习', color: 'bg-red-100 text-red-700' };
    return { stage: 5, label: '长期记忆', color: 'bg-purple-100 text-purple-700' };
  };

  const getUrgencyLabel = (word: Word): string => {
    const urgency = calculateUrgency(word);
    if (urgency >= 80) return '急需复习';
    if (urgency >= 60) return '建议复习';
    return '暂不需要';
  };

  if (testWords.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Brain className="w-10 h-10 text-green-600" />
            </div>
            <p className="text-gray-500 mb-4">没有需要复习的单词</p>
            <p className="text-sm text-gray-400 mb-6">所有单词都在最佳复习周期内</p>
            <Button onClick={handleBack}>返回单词列表</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isFinished) {
    const accuracy = testWords.length > 0 ? Math.round((correctCount / reviewedCount) * 100) : 0;
    
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl font-bold text-primary-950">{reviewedCount}</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-primary-950 mb-2">
              测试完成！
            </h2>
            <p className="text-gray-600 mb-6">
              你复习了 {reviewedCount}/{testWords.length} 个单词，掌握了 {correctCount} 个
            </p>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-blue-600">{reviewedCount}</p>
                <p className="text-sm text-gray-500">已复习</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-600">{correctCount}</p>
                <p className="text-sm text-gray-500">已掌握</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-purple-600">{accuracy}%</p>
                <p className="text-sm text-gray-500">正确率</p>
              </div>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={handleBack}>
                返回单词列表
              </Button>
              <Button onClick={handleRestart}>
                <RotateCcw size={18} className="mr-2" />
                再测一次
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const reviewStage = getReviewStage(currentWord);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={handleBack} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-sm text-gray-500">
          {currentIndex + 1}/{testWords.length}
        </span>
      </div>

      {currentChapter && (
        <p className="text-center text-gray-500 mb-4">{currentChapter.name}</p>
      )}

      <div className="flex items-center justify-center gap-4 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${reviewStage.color}`}>
          {reviewStage.label}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Clock size={14} />
          {getUrgencyLabel(currentWord)}
        </span>
      </div>

      <Card 
        className="mb-6 cursor-pointer transition-all hover:shadow-lg"
        onClick={handleCardClick}
      >
        <CardContent className="p-8 text-center">
          <p className="text-sm text-gray-500 mb-2">点击查看释义</p>
          <h2 className="text-4xl font-display font-bold text-primary-950">
            {currentWord.word}
          </h2>
          {currentWord.phonetic && (
            <p className="text-gray-500 mt-2">{currentWord.phonetic}</p>
          )}
        </CardContent>
      </Card>

      {showMeaning && (
        <Card className="mb-6 bg-accent-50 border-accent-200">
          <CardContent className="p-6">
            <p className="text-lg text-primary-950 whitespace-pre-line">
              {currentWord.meaning.split('\n').filter(line => {
                const trimmed = line.trim();
                if (!trimmed) return false;
                if (/^\s*\d+\s*$/.test(trimmed)) return false;
                if (trimmed === '0') return false;
                return true;
              }).join('\n')}
            </p>
            {currentWord.example && (
              <div className="mt-4 pt-4 border-t border-accent-200">
                <p className="text-sm text-gray-500">例句：</p>
                <p className="text-primary-700 italic">{currentWord.example}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center gap-4">
        <Button 
          variant="outline" 
          onClick={handleBack}
        >
          返回
        </Button>
        {showMeaning && (
          <Button 
            onClick={handleMarkAsMastered}
            className="bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40"
          >
            <Zap size={18} className="mr-2" />
            已掌握
          </Button>
        )}
        <Button 
          onClick={handleNext}
          disabled={!showMeaning}
        >
          {currentIndex < testWords.length - 1 ? '下一个' : '查看结果'}
        </Button>
      </div>
    </div>
  );
}