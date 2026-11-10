import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Headphones, FileText, TrendingUp, Flame, Sparkles, Search, Clock, Target, ChevronRight, RefreshCw, X } from 'lucide-react';
import { Card, CardContent } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { Button } from '../components/Button';
import { useStore } from '../store';
import { isSameDay } from '../utils/helpers';
import { filterMeaning } from '../utils/meaningFilter';
export function HomePage() {
  const navigate = useNavigate();
  const { words, wordbooks, chapters, records, loadWords, loadRecords, loadWordbooks, loadAllChapters, currentUser } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadWords();
    loadRecords();
    loadWordbooks();
    // 先加载单词书，再加载所有章节
    const loadAllData = async () => {
      await loadWordbooks();
      await loadAllChapters();
    };
    loadAllData();
  }, [loadWords, loadRecords, loadWordbooks, loadAllChapters]);

  const todayRecord = records.find((r) => isSameDay(new Date(r.date), new Date())) || {
    wordsLearned: 0,
    listeningMinutes: 0,
    articlesRead: 0,
  };

  const totalWords = words.length;
  const masteredWords = words.filter((w) => w.status === 'mastered').length;
  const learningWords = words.filter((w) => w.status === 'learning').length;

  const streak = calculateStreak(records);

  const today = new Date();
  const dateString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekDay = weekDays[today.getDay()];

  const urgentWords = words
    .filter(w => w.status !== 'mastered')
    .map(w => ({
      ...w,
      urgency: calculateUrgency(w.lastReviewedAt || undefined, w.reviewCount)
    }))
    .filter(w => w.urgency >= 50)
    .sort((a, b) => b.urgency - a.urgency)
    .slice(0, 5);

  const recentWords = [...words]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  // 模糊搜索功能
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase().trim();
    
    return words.filter(word => {
      const wordMatch = word.word?.toLowerCase().includes(query);
      const meaningMatch = word.meaning?.toLowerCase().includes(query);
      const phoneticMatch = word.phonetic?.toLowerCase().includes(query);
      
      return wordMatch || meaningMatch || phoneticMatch;
    }).slice(0, 10);
  }, [words, searchQuery]);

  // 获取单词书名称（优先使用后端返回的 wordbook_name，其次通过章节查找，最后通过 wordbook_id 查找）
  const getWordbookName = (wordbookId?: number | null, wordbookName?: string, chapterId?: number | null) => {
    if (wordbookName) return wordbookName;
    if (chapterId) {
      const chapter = chapters.find(c => c.id === chapterId);
      if (chapter?.wordbook_id) {
        const wordbook = wordbooks.find(w => w.id === chapter.wordbook_id);
        if (wordbook) return wordbook.name;
      }
    }
    if (!wordbookId) return '无单词书';
    const wordbook = wordbooks.find(w => w.id === wordbookId);
    return wordbook?.name || '无单词书';
  };

  // 获取章节名称（优先使用后端返回的 chapter_name，避免数据加载时序问题）
  const getChapterName = (chapterId?: number | null, chapterName?: string) => {
    if (chapterName) return chapterName;
    if (!chapterId) return '无章节';
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter?.name || '无章节';
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate('/vocabulary');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchResults(value.trim().length > 0);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
  };

  // 点击外部区域关闭搜索结果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles size={24} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 truncate">
                Hi~, {currentUser?.username || '用户'}
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm truncate">今天也要继续努力学习哦 💪</p>
            </div>
          </div>
          <div className="text-right shrink-0 whitespace-nowrap">
            <p className="text-sm sm:text-lg font-medium text-gray-700">{dateString}</p>
            <p className="text-xs sm:text-sm text-gray-500">{weekDay}</p>
          </div>
        </div>

        <Card className="mb-6" ref={searchContainerRef}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索单词或释义..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              <Button onClick={handleSearch}>
                搜索
              </Button>
            </div>
            
            {/* 搜索结果下拉框 */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {searchResults.map((word) => (
                    <div
                      key={word.id}
                      onClick={() => navigate('/vocabulary')}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{word.word}</span>
                          <span className="text-sm text-gray-500">{word.phonetic}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">{filterMeaning(word.meaning)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {word.source_type === 'reading' ? (
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                              {word.source_title || '该来源已被删除'}
                            </span>
                          ) : (
                            <>
                              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                {getWordbookName(word.wordbook_id, word.wordbook_name, word.chapter_id)}
                              </span>
                              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                {getChapterName(word.chapter_id, word.chapter_name)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-400 ml-2 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 无搜索结果提示 */}
            {showSearchResults && searchResults.length === 0 && searchQuery.trim() && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <div className="text-center py-4 text-gray-500">
                  <p>未找到相关单词</p>
                  <p className="text-sm mt-1">尝试其他关键词</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </header>

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">快捷入口</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/vocabulary"
              className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <BookOpen size={24} />
              </div>
              <div>
                <p className="font-semibold text-gray-800">单词本</p>
                <p className="text-sm text-gray-500">{totalWords} 个单词</p>
              </div>
            </Link>

            <Link
              to="/listening"
              className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
                <Headphones size={24} />
              </div>
              <div>
                <p className="font-semibold text-gray-800">听力训练</p>
                <p className="text-sm text-gray-500">开始练习</p>
              </div>
            </Link>

            <Link
              to="/reading"
              className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <div>
                <p className="font-semibold text-gray-800">阅读理解</p>
                <p className="text-sm text-gray-500">开始阅读</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">今日学习统计</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <ProgressBar
                value={todayRecord.wordsLearned}
                max={currentUser?.dailyWordGoal || 20}
                label={`今日学习目标 (${currentUser?.dailyWordGoal || 20}个)`}
                icon={<BookOpen size={16} />}
                color="blue"
              />
            </div>
            <div>
              <ProgressBar
                value={todayRecord.listeningMinutes}
                max={currentUser?.dailyListeningGoal || 30}
                label={`听力目标 (${currentUser?.dailyListeningGoal || 30}分钟)`}
                icon={<Headphones size={16} />}
                color="blue"
              />
            </div>
            <div>
              <ProgressBar
                value={todayRecord.articlesRead}
                max={currentUser?.dailyReadingGoal || 3}
                label={`阅读目标 (${currentUser?.dailyReadingGoal || 3}篇)`}
                icon={<FileText size={16} />}
                color="green"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-100 flex items-center justify-center">
              <BookOpen size={20} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{totalWords}</p>
            <p className="text-sm text-gray-500">总单词数</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-4">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-green-100 flex items-center justify-center">
              <Target size={20} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{masteredWords}</p>
            <p className="text-sm text-gray-500">已掌握</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-4">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-yellow-100 flex items-center justify-center">
              <TrendingUp size={20} className="text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{learningWords}</p>
            <p className="text-sm text-gray-500">学习中</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-4">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-orange-100 flex items-center justify-center">
              <Flame size={20} className="text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{streak}</p>
            <p className="text-sm text-gray-500">连续天数</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-red-500" />
                <h2 className="text-xl font-semibold text-gray-800">今日待复习</h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-600 text-sm font-medium">
                {urgentWords.length} 个单词
              </span>
            </div>
            
            {urgentWords.length === 0 ? (
              <div className="text-center py-8">
                <RefreshCw size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">暂无需要复习的单词</p>
                <p className="text-sm text-gray-400">继续保持！</p>
              </div>
            ) : (
              <div className="space-y-3">
                {urgentWords.map((word) => (
                  <div 
                    key={word.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => {
                      if (word.chapter_id) {
                        navigate(`/vocabulary/chapter/${word.chapter_id}?wordId=${word.id}`);
                      } else if (word.wordbook_id) {
                        navigate(`/vocabulary/wordbook/${word.wordbook_id}?wordId=${word.id}`);
                      } else {
                        navigate(`/vocabulary?wordId=${word.id}`);
                      }
                    }}
                  >
                    <div>
                      <p className="font-medium text-gray-800">{word.word}</p>
                      <p className="text-sm text-gray-500 line-clamp-1">{filterMeaning(word.meaning)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${word.urgency >= 80 ? 'bg-red-500' : word.urgency >= 60 ? 'bg-yellow-500' : 'bg-orange-500'}`} />
                      <span className="text-xs text-gray-400">紧迫性 {Math.round(word.urgency)}%</span>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </div>
                ))}
                {urgentWords.length > 0 && urgentWords[0].chapter_id && (
                  <Link 
                    to={`/vocabulary/test/${urgentWords[0].chapter_id}`} 
                    className="flex items-center justify-center py-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium"
                  >
                    开始记忆测试 <ChevronRight size={16} />
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-purple-500" />
                <h2 className="text-xl font-semibold text-gray-800">最近添加</h2>
              </div>
              <Link to="/vocabulary" className="text-sm text-blue-600 hover:text-blue-700">
                查看全部
              </Link>
            </div>
            
            {recentWords.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">还没有添加单词</p>
                <Link 
                  to="/vocabulary" 
                  className="inline-block mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  添加第一个单词
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentWords.map((word) => (
                  <div 
                    key={word.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => {
                      if (word.chapter_id) {
                        navigate(`/vocabulary/chapter/${word.chapter_id}?wordId=${word.id}`);
                      } else if (word.wordbook_id) {
                        navigate(`/vocabulary/wordbook/${word.wordbook_id}?wordId=${word.id}`);
                      } else {
                        navigate(`/vocabulary?wordId=${word.id}`);
                      }
                    }}
                  >
                    <div>
                      <p className="font-medium text-gray-800">{word.word}</p>
                      <p className="text-sm text-gray-500">{word.phonetic}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function calculateStreak(records: { date: string }[]): number {
  if (records.length === 0) return 0;

  const sortedRecords = [...records]
    .map((r) => new Date(r.date))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const record of sortedRecords) {
    const recordDate = new Date(record);
    recordDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === streak) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function calculateUrgency(lastReviewedAt?: string, reviewCount?: number): number {
  if (!lastReviewedAt) return 100;
  
  const lastReviewed = new Date(lastReviewedAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - lastReviewed.getTime()) / (1000 * 60 * 60 * 24));
  
  const reviewCycles = [1, 2, 4, 7, 14, 30];
  const currentCycle = reviewCount && reviewCount > 0 
    ? Math.min(reviewCount - 1, reviewCycles.length - 1)
    : 0;
  const cycleDays = reviewCycles[currentCycle];
  
  const urgency = Math.min(100, (diffDays / cycleDays) * 100);
  
  return urgency;
}
