import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Filter, Shuffle, ArrowLeft, Upload, Music, Pencil, Trash2 } from 'lucide-react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { WordCard } from '../components/WordCard';
import { useStore } from '../store';
import { WordStatus } from '../types';
import { getStatusLabel } from '../utils/helpers';
import { filterMeaning } from '../utils/meaningFilter';
import { apiFetch, apiUrl } from '../lib/api';

export function WordListPage() {
  const navigate = useNavigate();
  const { chapterId } = useParams<{ chapterId: string }>();
  const [searchParams] = useSearchParams();
  const { words, chapters, loadChapters, loadWords, addWord, updateWord, deleteWord, batchAddWords, uploadWordAudio } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WordStatus | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [newWord, setNewWord] = useState({
    word: '',
    phonetic: '',
    meaning: '',
    example: '',
    status: 'new' as WordStatus,
  });
  const [useMultiMeaning, setUseMultiMeaning] = useState(false);
  const [selectedPartsOfSpeech, setSelectedPartsOfSpeech] = useState<string[]>([]);
  const [partOfSpeechMeanings, setPartOfSpeechMeanings] = useState<Record<string, string>>({});
  const [editingWord, setEditingWord] = useState<typeof words[0] | null>(null);
  const [batchText, setBatchText] = useState('');
  const [uploadingWordId, setUploadingWordId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isPolysemous, setIsPolysemous] = useState(false);
  const [isSimilar, setIsSimilar] = useState(false);
  const [groupedWords, setGroupedWords] = useState<Array<Array<typeof words[0]>>>([]);
  const [showGroupedView, setShowGroupedView] = useState<'polysemous' | 'similar' | null>(null);
  const [groupWordList, setGroupWordList] = useState<Array<{
    word: string;
    phonetic: string;
    meaning: string;
    example: string;
    selectedParts: string[];
    partMeanings: Record<string, string>;
  }>>([{ word: '', phonetic: '', meaning: '', example: '', selectedParts: [], partMeanings: {} }]);
  const [visibleMeanings, setVisibleMeanings] = useState<Record<string | number, boolean>>({});
  const [showAllMeanings, setShowAllMeanings] = useState(true);
  const [groupVisibleMeanings, setGroupVisibleMeanings] = useState<Record<string | number, boolean>>({});
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const targetWordId = searchParams.get('wordId');
  const [highlightedWordId, setHighlightedWordId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (targetWordId) {
      setHighlightedWordId(targetWordId);
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [targetWordId]);

  const partsOfSpeech = [
    { value: 'n.', label: 'n.' },
    { value: 'v.', label: 'v.' },
    { value: 'vt.', label: 'vt.' },
    { value: 'vi.', label: 'vi.' },
    { value: 'adj.', label: 'adj.' },
    { value: 'adv.', label: 'adv.' },
    { value: 'prep.', label: 'prep. (介词)' },
    { value: 'pron.', label: 'pron. (代词)' },
    { value: 'num.', label: 'num.' },
    { value: 'conj.', label: 'conj. (连词)' },
    { value: 'int.', label: 'int. (叹词)' },
    { value: 'aux.', label: 'aux. (助词)' },
    { value: 'art.', label: 'art. (冠词)' },
  ];

  const chapterIdNum = parseInt(chapterId || '0');
  const currentChapter = chapters.find(c => c.id === chapterIdNum);

  useEffect(() => {
    if (chapterIdNum) {
      loadWords(chapterIdNum);
      loadChapters(currentChapter?.wordbook_id || 0);
    }
  }, [chapterIdNum, loadWords, loadChapters, currentChapter?.wordbook_id]);

  const filteredWords = words.filter((word) => {
    const matchesSearch =
      word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.meaning.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || word.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter) {
      if (word.createdAt) {
        const wordDate = new Date(word.createdAt);
        const filterDate = new Date(dateFilter);
        matchesDate = 
          wordDate.getFullYear() === filterDate.getFullYear() &&
          wordDate.getMonth() === filterDate.getMonth() &&
          wordDate.getDate() === filterDate.getDate();
      } else {
        matchesDate = false;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });
  
  const getUniqueDates = () => {
    const dateMap = new Map<string, number>();
    
    words.forEach(word => {
      if (word.createdAt) {
        const date = new Date(word.createdAt);
        const dateKey = date.toISOString().split('T')[0];
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
      }
    });
    
    return Array.from(dateMap.entries())
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  };

  const toggleMeaning = (id: string | number) => {
    setVisibleMeanings(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleAllMeanings = () => {
    setShowAllMeanings(prev => !prev);
    setVisibleMeanings({});
    setGroupVisibleMeanings({});
  };

  const isMeaningVisible = (id: string | number) => {
    if (visibleMeanings[id] !== undefined) {
      return visibleMeanings[id];
    }
    return showAllMeanings;
  };

  const toggleGroupMeaning = (id: string | number) => {
    setGroupVisibleMeanings(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const isGroupMeaningVisible = (id: string | number) => {
    if (groupVisibleMeanings[id] !== undefined) {
      return groupVisibleMeanings[id];
    }
    return showAllMeanings;
  };

  const handleStatusChange = async (id: string | number, status: WordStatus, reviewCount?: number) => {
    try {
      if (status === 'mastered') {
        const currentWord = words.find((w) => w.id === id);
        const lastReviewedAt = currentWord?.lastReviewedAt ? new Date(currentWord.lastReviewedAt) : null;
        const now = new Date();
        const diffDays = lastReviewedAt 
          ? Math.floor((now.getTime() - lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        
        let newReviewCount = reviewCount;
        
        if (diffDays >= 21) {
          newReviewCount = 0;
        } else {
          newReviewCount = (currentWord?.reviewCount || 0) + 1;
        }
        
        await updateWord(id, {
          status,
          lastReviewedAt: new Date().toISOString(),
          reviewCount: newReviewCount,
        });
      } else {
        await updateWord(id, { status });
      }
      await loadWords(chapterIdNum);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleGroupStatusChange = async (id: string | number, status: WordStatus, reviewCount?: number) => {
    try {
      if (status === 'mastered') {
        const flatList = groupedWords.flat();
        const currentWord = flatList.find((w) => w.id === id);
        const lastReviewedAt = currentWord?.lastReviewedAt ? new Date(currentWord.lastReviewedAt) : null;
        const now = new Date();
        const diffDays = lastReviewedAt 
          ? Math.floor((now.getTime() - lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        
        let newReviewCount = reviewCount;
        
        if (diffDays >= 21) {
          newReviewCount = 0;
        } else {
          newReviewCount = (currentWord?.reviewCount || 0) + 1;
        }
        
        await updateWord(id, {
          status,
          lastReviewedAt: new Date().toISOString(),
          reviewCount: newReviewCount,
        });
      } else {
        await updateWord(id, { status });
      }
      if (showGroupedView) {
        await fetchGroupedWords(showGroupedView);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleGroupReview = async (id: string | number) => {
    try {
      const word = groupedWords.flat().find(w => w.id === id);
      if (!word) return;
      
      const now = new Date();
      const lastReview = word.lastReviewedAt ? new Date(word.lastReviewedAt) : null;
      let newCount = 1;
      
      if (lastReview) {
        const diffDays = Math.floor((now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 21) {
          newCount = (word.reviewCount || 0) + 1;
        }
      }
      
      await updateWord(id, {
        reviewCount: newCount,
        lastReviewedAt: now.toISOString()
      });
      if (showGroupedView) {
        await fetchGroupedWords(showGroupedView);
      }
    } catch (error) {
      console.error('Failed to update review:', error);
    }
  };

  const deleteGroupWord = async (id: string | number) => {
    try {
      await deleteWord(id);
      if (showGroupedView) {
        await fetchGroupedWords(showGroupedView);
      }
    } catch (error) {
      console.error('Failed to delete word:', error);
    }
  };

  const handleAddWord = async () => {
    let processedMeaning = newWord.meaning;
    
    if (selectedPartsOfSpeech.length > 0) {
      const meaningParts = selectedPartsOfSpeech.map(pos => {
        const meaning = partOfSpeechMeanings[pos] || '';
        return `${pos} ${meaning}`;
      });
      processedMeaning = meaningParts.join('\n');
    } else if (useMultiMeaning) {
      processedMeaning = newWord.meaning.split('//').map(m => m.trim()).join('\n');
    }
    
    if (!newWord.word || (selectedPartsOfSpeech.length === 0 && !newWord.meaning)) {
      alert('请输入单词和释义');
      return;
    }
    
    if (selectedPartsOfSpeech.length === 0 && !newWord.meaning) {
      alert('请输入释义');
      return;
    }
    
    if (editingWord) {
      await updateWord(editingWord.id, {
        word: newWord.word,
        phonetic: newWord.phonetic,
        meaning: processedMeaning,
        example: newWord.example,
        is_polysemous: isPolysemous,
        is_similar: isSimilar,
      });
    } else {
      await addWord({
        ...newWord,
        meaning: processedMeaning,
        chapter_id: chapterIdNum,
        wordbook_id: currentChapter?.wordbook_id,
        is_polysemous: isPolysemous,
        is_similar: isSimilar,
      });
    }
    
    await loadWords(chapterIdNum);
    
    setNewWord({
      word: '',
      phonetic: '',
      meaning: '',
      example: '',
      status: 'new',
    });
    setUseMultiMeaning(false);
    setSelectedPartsOfSpeech([]);
    setPartOfSpeechMeanings({});
    setEditingWord(null);
    setIsAddModalOpen(false);
    setIsPolysemous(false);
    setIsSimilar(false);
    setIsMoreMenuOpen(false);
  };

  const handleEditWord = (word: typeof words[0]) => {
    setEditingWord(word);
    setIsPolysemous(Boolean(word.is_polysemous));
    setIsSimilar(Boolean(word.is_similar));
    setGroupWordList([{ word: '', phonetic: '', meaning: '', example: '', selectedParts: [], partMeanings: {} }]);
    
    const lines = word.meaning.split('\n').filter(Boolean);
    const parsedPartsOfSpeech: string[] = [];
    const parsedMeanings: Record<string, string> = {};
    const posValues = partsOfSpeech.map(p => p.value);
    
    lines.forEach(line => {
      const match = line.match(/^([nvadjadvprepconjpronnumintjvt\.]+)\s+(.*)/);
      if (match && posValues.includes(match[1])) {
        parsedPartsOfSpeech.push(match[1]);
        parsedMeanings[match[1]] = match[2];
      }
    });
    
    if (parsedPartsOfSpeech.length > 0) {
      setSelectedPartsOfSpeech(parsedPartsOfSpeech);
      setPartOfSpeechMeanings(parsedMeanings);
      setNewWord({
        word: word.word,
        phonetic: word.phonetic || '',
        meaning: '',
        example: word.example || '',
        status: word.status,
      });
    } else {
      setSelectedPartsOfSpeech([]);
      setPartOfSpeechMeanings({});
      setNewWord({
        word: word.word,
        phonetic: word.phonetic || '',
        meaning: word.meaning,
        example: word.example || '',
        status: word.status,
      });
    }
    
    setIsAddModalOpen(true);
  };

  const handleBatchAdd = async () => {
    if (!batchText.trim()) return;
    
    const lines = batchText.trim().split('\n');
    const wordsToAdd = lines.map(line => {
      const parts = line.split('//');
      return {
        word: parts[0]?.trim() || '',
        phonetic: parts[1]?.trim() || '',
        meaning: parts[2]?.trim() || '',
        example: parts[3]?.trim() || '',
      };
    }).filter(w => w.word && w.meaning);

    if (wordsToAdd.length === 0) {
      alert('请按照格式输入单词数据');
      return;
    }

    await batchAddWords(wordsToAdd, currentChapter?.wordbook_id, chapterIdNum);
    await loadWords(chapterIdNum);
    setBatchText('');
    setIsBatchModalOpen(false);
  };

  const fetchGroupedWords = async (groupType: 'polysemous' | 'similar') => {
    try {
      const response = await apiFetch(`/words/grouped/list?group_type=${groupType}`);
      const data = await response.json();
      setGroupedWords(data);
      setShowGroupedView(groupType);
    } catch (error) {
      console.error('Failed to fetch grouped words:', error);
    }
  };

  const handleSubmitGroupWords = async () => {
    let mainWordMeaning = newWord.meaning;
    if (selectedPartsOfSpeech.length > 0) {
      const meaningParts = selectedPartsOfSpeech.map(pos => {
        const meaning = partOfSpeechMeanings[pos] || '';
        return `${pos} ${meaning}`;
      });
      mainWordMeaning = meaningParts.join('\n');
    }
    
    if (!newWord.word || (selectedPartsOfSpeech.length === 0 && !newWord.meaning)) {
      alert('请输入主单词和释义');
      return;
    }

    const mainWordItem = {
      word: newWord.word,
      phonetic: newWord.phonetic,
      meaning: mainWordMeaning,
      example: newWord.example,
    };

    const validGroupWords = groupWordList.filter(w => w.word && (w.meaning || Object.keys(w.partMeanings).length > 0));
    
    const wordsToAdd = [mainWordItem, ...validGroupWords.map(w => {
      let meaning = w.meaning;
      if (w.selectedParts.length > 0) {
        const meaningParts = w.selectedParts.map(pos => {
          const m = w.partMeanings[pos] || '';
          return `${pos} ${m}`;
        });
        meaning = meaningParts.join('\n');
      }
      return {
        word: w.word,
        phonetic: w.phonetic,
        meaning,
        example: w.example,
      };
    })];

    const groupType = isPolysemous ? 'polysemous' : 'similar';
    
    if (!isPolysemous && !isSimilar) {
      alert('请选择是一词多义还是长得相似');
      return;
    }
    
    try {
      const response = await apiFetch('/words/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          words: wordsToAdd,
          wordbook_id: currentChapter?.wordbook_id,
          chapter_id: chapterIdNum,
          group_type: groupType,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add words');
      }
      
      alert('添加成功！');
      await loadWords(chapterIdNum);
      setNewWord({
        word: '',
        phonetic: '',
        meaning: '',
        example: '',
        status: 'new',
      });
      setUseMultiMeaning(false);
      setSelectedPartsOfSpeech([]);
      setPartOfSpeechMeanings({});
      setGroupWordList([{ word: '', phonetic: '', meaning: '', example: '', selectedParts: [], partMeanings: {} }]);
      setIsPolysemous(false);
      setIsSimilar(false);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Failed to add grouped words:', error);
      alert('添加失败，请重试');
    }
  };

  const addMoreGroupWord = () => {
    setGroupWordList(prev => [...prev, { word: '', phonetic: '', meaning: '', example: '', selectedParts: [], partMeanings: {} }]);
  };

  const removeGroupWord = (index: number) => {
    if (groupWordList.length === 1) {
      return;
    }
    setGroupWordList(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadClick = (wordId: number) => {
    setUploadingWordId(wordId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingWordId) return;
    
    try {
      await uploadWordAudio(uploadingWordId, file);
      alert('音频上传成功！');
    } catch (error) {
      alert('音频上传失败，请重试。');
    }
    
    setUploadingWordId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBack = () => {
    if (currentChapter?.wordbook_id) {
      loadChapters(currentChapter.wordbook_id);
      navigate(`/vocabulary/wordbook/${currentChapter.wordbook_id}`);
    } else {
      navigate('/vocabulary');
    }
  };

  const stats = {
    total: words.length,
    new: words.filter((w) => w.status === 'new').length,
    learning: words.filter((w) => w.status === 'learning').length,
    mastered: words.filter((w) => w.status === 'mastered').length,
  };

  return (
    <div className="max-w-6xl mx-auto">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/*"
        className="hidden"
      />

      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleBack}
            className="p-2 flex-shrink-0 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary-950 truncate">
              {currentChapter?.name || '单词列表'}
            </h1>
            <p className="text-gray-600 mt-1 text-sm whitespace-nowrap">
              共 {stats.total} 个单词 · {stats.mastered} 个已掌握
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/vocabulary/test/${chapterId}`}>
            <Button variant="outline">
              <Shuffle size={18} className="mr-2" />
              记忆测试
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setIsBatchModalOpen(true)}>
            <Upload size={18} className="mr-2" />
            批量导入
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} className="mr-2" />
            添加单词
          </Button>
          <div className="relative">
            <Button variant="outline" onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}>
              更多
            </Button>
            {isMoreMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                <button
                  onClick={() => {
                    fetchGroupedWords('polysemous');
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-blue-600"
                >
                  查看多义词
                </button>
                <button
                  onClick={() => {
                    fetchGroupedWords('similar');
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-purple-600"
                >
                  查看相似词
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {currentChapter?.audio_path && (
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Music size={20} className="text-green-600" />
              <span className="text-green-700">本章节已上传音频</span>
              <audio 
                controls 
                src={apiUrl(`/chapters/${chapterIdNum}/audio`)}
                className="flex-1 h-8"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card
          hover
          onClick={() => setStatusFilter('all')}
          className={statusFilter === 'all' ? 'ring-2 ring-accent-500' : ''}
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary-950">{stats.total}</p>
            <p className="text-sm text-gray-500">全部</p>
          </CardContent>
        </Card>
        <Card
          hover
          onClick={() => setStatusFilter('new')}
          className={statusFilter === 'new' ? 'ring-2 ring-accent-500' : ''}
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
            <p className="text-sm text-gray-500">新词</p>
          </CardContent>
        </Card>
        <Card
          hover
          onClick={() => setStatusFilter('learning')}
          className={statusFilter === 'learning' ? 'ring-2 ring-accent-500' : ''}
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.learning}</p>
            <p className="text-sm text-gray-500">学习中</p>
          </CardContent>
        </Card>
        <Card
          hover
          onClick={() => setStatusFilter('mastered')}
          className={statusFilter === 'mastered' ? 'ring-2 ring-accent-500' : ''}
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.mastered}</p>
            <p className="text-sm text-gray-500">已掌握</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center">
            <div className="w-full sm:w-1/2 lg:w-2/3 relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="搜索单词或释义..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none transition-all"
              />
            </div>
            <button
              onClick={toggleAllMeanings}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors whitespace-nowrap"
            >
              {showAllMeanings ? '隐藏全部释义' : '显示全部释义'}
            </button>
            
            {!showGroupedView && (
              <div className="relative z-[100]">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm text-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    <Filter size={16} />
                    {dateFilter 
                      ? new Date(dateFilter).toLocaleDateString('zh-CN') 
                      : '按日期筛选'}
                  </button>
                  {dateFilter && (
                    <button
                      onClick={() => setDateFilter(null)}
                      className="px-2 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
                
                {showDatePicker && (
                  <div 
                    className="fixed w-64 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 max-h-80 overflow-y-auto"
                    style={{ 
                      zIndex: 9999,
                      right: '24px',
                      top: '180px'
                    }}
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={dateFilter || ''}
                          onChange={(e) => setDateFilter(e.target.value || null)}
                          className="flex-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
                        />
                        <button
                          onClick={() => {
                            setDateFilter(null);
                            setShowDatePicker(false);
                          }}
                          className="text-sm text-gray-600 hover:text-gray-800 px-2"
                        >
                          全部日期
                        </button>
                      </div>
                    </div>
                    {getUniqueDates().length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">
                        暂无日期数据
                      </div>
                    ) : (
                      getUniqueDates().map(([dateKey, count]) => {
                        const date = new Date(dateKey);
                        const isSelected = dateFilter === dateKey;
                        return (
                          <button
                            key={dateKey}
                            onClick={() => {
                              setDateFilter(dateKey);
                              setShowDatePicker(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex justify-between items-center ${
                              isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                          >
                            <span>{date.toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}</span>
                            <span className="text-gray-400">{count} 个单词</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showGroupedView ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {showGroupedView === 'polysemous' ? '一词多义单词组' : '相似词单词组'}
            </h2>
            <button
              onClick={() => {
                setShowGroupedView(null);
                setGroupedWords([]);
              }}
              className="text-accent-600 hover:text-accent-700 text-sm"
            >
              返回单词列表
            </button>
          </div>
          {groupedWords.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Filter size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-500">
                  暂无{showGroupedView === 'polysemous' ? '一词多义' : '相似词'}单词组
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {groupedWords.map((group, groupIndex) => (
                <Card key={groupIndex} className="border-l-4 border-accent-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-3 py-1 bg-accent-100 text-accent-700 rounded-full text-sm font-medium">
                        {showGroupedView === 'polysemous' ? '一词多义组' : '相似词组'} {groupIndex + 1}
                      </span>
                      <span className="text-sm text-gray-500">共 {group.length} 个单词</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.map((word) => (
                        <div 
                          key={word.id} 
                          className="relative group p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer h-[200px] flex flex-col"
                          onClick={() => toggleGroupMeaning(word.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="text-lg font-semibold text-primary-950">{word.word}</h4>
                              {word.phonetic && <p className="text-sm text-gray-500">{word.phonetic}</p>}
                            </div>
                            <div className="flex gap-1 no-toggle">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditWord(word); }}
                                className="p-1.5 rounded-lg hover:bg-white transition-colors"
                                title="编辑"
                              >
                                <Pencil size={14} className="text-gray-400" />
                              </button>
                              <button
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  if (confirm('确定要删除这个单词吗？')) {
                                    deleteGroupWord(word.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg hover:bg-red-100 transition-colors"
                                title="删除"
                              >
                                <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
                              </button>
                            </div>
                          </div>
                          {isGroupMeaningVisible(word.id) && (
                            <div className="mt-2 flex-1 overflow-hidden">
                              {filterMeaning(word.meaning).split('\n').filter(line => line.trim()).map((line, idx) => (
                                <p key={idx} className="text-sm text-gray-700">
                                  {line}
                                </p>
                              ))}
                              {word.example && (
                                <p className="mt-2 text-sm text-gray-500 italic">"{word.example}"</p>
                              )}
                            </div>
                          )}
                          <div className="mt-auto flex items-center justify-between relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const statusMenu = e.currentTarget.nextElementSibling as HTMLElement;
                                statusMenu.classList.toggle('hidden');
                              }}
                              className="lq-status"
                              data-status={word.status}
                              title="点击切换状态"
                            >
                              {getStatusLabel(word.status)}
                            </button>
                            <div className="lq-menu lq-menu--row hidden absolute left-0 bottom-full mb-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleGroupStatusChange(word.id, 'new'); }}
                                className="lq-menu-item"
                                aria-current={word.status === 'new'}
                              >
                                <span className="lq-menu-dot" style={{ background: '#0a84ff' }} />
                                新词
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleGroupStatusChange(word.id, 'learning'); }}
                                className="lq-menu-item"
                                aria-current={word.status === 'learning'}
                              >
                                <span className="lq-menu-dot" style={{ background: '#ffb300' }} />
                                学习中
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleGroupStatusChange(word.id, 'mastered'); }}
                                className="lq-menu-item"
                                aria-current={word.status === 'mastered'}
                              >
                                <span className="lq-menu-dot" style={{ background: '#34c759' }} />
                                已掌握
                              </button>
                            </div>
                            {(() => {
                              let displayCount = 0;
                              if (word.lastReviewedAt) {
                                const lastReview = new Date(word.lastReviewedAt);
                                const now = new Date();
                                const diffDays = Math.floor((now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
                                if (diffDays < 21) {
                                  displayCount = word.reviewCount || 0;
                                }
                              }
                              return displayCount > 0 && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleGroupReview(word.id); }}
                                  className="text-xs text-gray-400 hover:text-accent-600 transition-colors"
                                  title="点击记录复习"
                                >
                                  复习 {displayCount} 次
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : filteredWords.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Filter size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500">
              {searchQuery ? '没有找到匹配的单词' : '还没有单词，点击上方按钮添加'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredWords.map((word) => {
            const isHighlighted = highlightedWordId === String(word.id);
            return (
              <div 
                key={word.id} 
                className={`relative group ${isHighlighted && isAnimating ? 'highlight-animation' : ''}`}
              >
                <WordCard
                  word={word}
                  onDelete={deleteWord}
                  onEdit={handleEditWord}
                  onStatusChange={handleStatusChange}
                  isMeaningVisible={isMeaningVisible(word.id)}
                  onToggleMeaning={toggleMeaning}
                  isHighlighted={isHighlighted && isAnimating}
                />
                <button
                  onClick={() => handleUploadClick(typeof word.id === 'string' ? parseInt(word.id) : word.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                  title="上传音频"
                >
                  {word.audio_path ? (
                    <Music size={14} className="text-green-500" />
                  ) : (
                    <Upload size={14} className="text-gray-400" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => { 
          setIsAddModalOpen(false); 
          setEditingWord(null);
          setNewWord({
            word: '',
            phonetic: '',
            meaning: '',
            example: '',
            status: 'new',
          });
          setUseMultiMeaning(false);
          setSelectedPartsOfSpeech([]);
          setPartOfSpeechMeanings({});
          setGroupWordList([{ word: '', phonetic: '', meaning: '', example: '', selectedParts: [], partMeanings: {} }]);
          setIsPolysemous(false);
          setIsSimilar(false);
        }}
        title={editingWord ? '编辑单词' : '添加新单词'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              单词 *
            </label>
            <input
              type="text"
              value={newWord.word}
              onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
              placeholder="输入英文单词"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              音标
            </label>
            <input
              type="text"
              value={newWord.phonetic}
              onChange={(e) => setNewWord({ ...newWord, phonetic: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
              placeholder="例如: /ˈwɜːd/"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              词性
            </label>
            <div className="flex flex-wrap gap-2">
              {partsOfSpeech.map((pos) => (
                <button
                  key={pos.value}
                  type="button"
                  onClick={() => {
                    setSelectedPartsOfSpeech(prev => {
                      if (prev.includes(pos.value)) {
                        const newSelected = prev.filter(p => p !== pos.value);
                        const newMeanings = { ...partOfSpeechMeanings };
                        delete newMeanings[pos.value];
                        setPartOfSpeechMeanings(newMeanings);
                        return newSelected;
                      } else {
                        return [...prev, pos.value];
                      }
                    });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                    selectedPartsOfSpeech.includes(pos.value)
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 transform scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  <span style={{ 
                    fontFamily: '"Times New Roman", Times, serif',
                    fontStyle: 'italic',
                    fontWeight: 'bold'
                  }}>
                    {pos.value}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {selectedPartsOfSpeech.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                释义
              </label>
              <div className="space-y-2">
                {selectedPartsOfSpeech.map((pos) => (
                  <div key={pos} className="flex items-center gap-2">
                    <span 
                      className="min-w-[60px] text-sm font-bold italic text-blue-600"
                      style={{ fontFamily: '"Times New Roman", Times, serif' }}
                    >
                      {pos}
                    </span>
                    <input
                      type="text"
                      value={partOfSpeechMeanings[pos] || ''}
                      onChange={(e) => setPartOfSpeechMeanings(prev => ({
                        ...prev,
                        [pos]: e.target.value
                      }))}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
                      placeholder={`输入${pos}的释义`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                释义 *
              </label>
              <input
                type="text"
                value={newWord.meaning}
                onChange={(e) => setNewWord({ ...newWord, meaning: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
                placeholder="输入中文释义"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              例句
            </label>
            <textarea
              value={newWord.example}
              onChange={(e) => setNewWord({ ...newWord, example: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none resize-none"
              rows={2}
              placeholder="输入例句"
            />
          </div>
          {(isPolysemous || isSimilar) ? (
            <div>
              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPolysemous}
                    onChange={(e) => {
                      setIsPolysemous(e.target.checked);
                      if (e.target.checked) {
                        if (isSimilar) {
                          setIsSimilar(false);
                        }
                        setGroupWordList([{ word: '', phonetic: '', meaning: '', example: '', selectedParts: [], partMeanings: {} }]);
                      } else {
                        setGroupWordList([{ word: '', phonetic: '', meaning: '', example: '', selectedParts: [], partMeanings: {} }]);
                      }
                    }}
                    className="w-4 h-4 text-blue-500 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">一词多义</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSimilar}
                    onChange={(e) => {
                      setIsSimilar(e.target.checked);
                      if (e.target.checked) {
                        if (isPolysemous) {
                          setIsPolysemous(false);
                        }
                        setGroupWordList([{ word: '', phonetic: '', meaning: '', example: '', selectedParts: [], partMeanings: {} }]);
                      } else {
                        setGroupWordList([{ word: '', phonetic: '', meaning: '', example: '', selectedParts: [], partMeanings: {} }]);
                      }
                    }}
                    className="w-4 h-4 text-purple-500 rounded border-gray-300 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">长得相似</span>
                </label>
              </div>
              <div className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto pr-2">
                {groupWordList.map((groupWord, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg relative">
                    <button
                      onClick={() => removeGroupWord(index)}
                      className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-500 transition-colors"
                      title="删除此单词"
                    >
                      ×
                    </button>
                    <div className="text-sm font-medium text-gray-700 mb-3">
                      单词 {index + 1}
                    </div>
                    <input
                      type="text"
                      value={groupWord.word}
                      onChange={(e) => {
                        const newList = [...groupWordList];
                        newList[index] = { ...newList[index], word: e.target.value };
                        setGroupWordList(newList);
                      }}
                      className="w-full px-3 py-2 mb-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
                      placeholder="输入英文单词"
                    />
                    <input
                      type="text"
                      value={groupWord.phonetic}
                      onChange={(e) => {
                        const newList = [...groupWordList];
                        newList[index] = { ...newList[index], phonetic: e.target.value };
                        setGroupWordList(newList);
                      }}
                      className="w-full px-3 py-2 mb-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
                      placeholder="音标"
                    />
                    <div className="flex flex-wrap gap-2 mb-2">
                      {partsOfSpeech.map((pos) => (
                        <button
                          key={pos.value}
                          type="button"
                          onClick={() => {
                            const newList = [...groupWordList];
                            const currentParts = newList[index].selectedParts;
                            if (currentParts.includes(pos.value)) {
                              newList[index] = {
                                ...newList[index],
                                selectedParts: currentParts.filter(p => p !== pos.value),
                                partMeanings: Object.fromEntries(
                                  Object.entries(newList[index].partMeanings).filter(([k]) => k !== pos.value)
                                )
                              };
                            } else {
                              newList[index] = {
                                ...newList[index],
                                selectedParts: [...currentParts, pos.value]
                              };
                            }
                            setGroupWordList(newList);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                            groupWord.selectedParts.includes(pos.value)
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 transform scale-105'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                          }`}
                        >
                          <span style={{ fontFamily: '"Times New Roman", Times, serif', fontStyle: 'italic', fontWeight: 'bold' }}>
                            {pos.value}
                          </span>
                        </button>
                      ))}
                    </div>
                    {groupWord.selectedParts.length > 0 ? (
                      <div className="space-y-2 mb-2">
                        {groupWord.selectedParts.map((pos) => (
                          <div key={pos} className="flex items-center gap-2">
                            <span className="min-w-[60px] text-sm font-bold italic text-blue-600" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                              {pos}
                            </span>
                            <input
                              type="text"
                              value={groupWord.partMeanings[pos] || ''}
                              onChange={(e) => {
                                const newList = [...groupWordList];
                                newList[index] = {
                                  ...newList[index],
                                  partMeanings: {
                                    ...newList[index].partMeanings,
                                    [pos]: e.target.value
                                  }
                                };
                                setGroupWordList(newList);
                              }}
                              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
                              placeholder={`输入${pos}的释义`}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={groupWord.meaning}
                        onChange={(e) => {
                          const newList = [...groupWordList];
                          newList[index] = { ...newList[index], meaning: e.target.value };
                          setGroupWordList(newList);
                        }}
                        className="w-full px-3 py-2 mb-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
                        placeholder="输入释义"
                      />
                    )}
                    <textarea
                      value={groupWord.example}
                      onChange={(e) => {
                        const newList = [...groupWordList];
                        newList[index] = { ...newList[index], example: e.target.value };
                        setGroupWordList(newList);
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none resize-none"
                      rows={2}
                      placeholder="输入例句"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={addMoreGroupWord}
                className="w-full mt-4 py-2 text-blue-500 hover:text-blue-600 text-sm flex items-center justify-center gap-2 border border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Plus size={16} />
                {isPolysemous ? '还有多义词？' : '还有相似词？'}
              </button>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsPolysemous(false);
                    setIsSimilar(false);
                    setGroupWordList([{ word: '', phonetic: '', meaning: '', example: '', selectedParts: [], partMeanings: {} }]);
                  }}
                >
                  取消
                </Button>
                <Button className="flex-1" onClick={handleSubmitGroupWords}>
                  添加
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="groupType"
                    checked={isPolysemous}
                    onChange={(e) => {
                      setIsPolysemous(e.target.checked);
                      if (e.target.checked) {
                        setGroupWordList([{ word: '', phonetic: '', meaning: '', example: '', selectedParts: [], partMeanings: {} }]);
                      }
                    }}
                    className="w-4 h-4 text-blue-500 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">一词多义</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="groupType"
                    checked={isSimilar}
                    onChange={(e) => {
                      setIsSimilar(e.target.checked);
                      if (e.target.checked) {
                        setGroupWordList([{ word: '', phonetic: '', meaning: '', example: '', selectedParts: [], partMeanings: {} }]);
                      }
                    }}
                    className="w-4 h-4 text-purple-500 border-gray-300 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">长得相似</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsPolysemous(false);
                    setIsSimilar(false);
                  }}
                >
                  取消
                </Button>
                <Button className="flex-1" onClick={handleAddWord}>
                  添加
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title="批量导入单词"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              导入格式说明
            </label>
            <p className="text-sm text-gray-500 mb-2">
              每行一个单词，使用双斜杠 // 分隔字段：单词//音标//释义//例句
            </p>
            <p className="text-sm text-gray-500">
              示例：apple//ˈæpl//苹果//I like apples.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Excel导入：确保Excel列顺序为：单词、音标、释义、例句，直接复制粘贴即可
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              单词数据
            </label>
            <textarea
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none resize-none font-mono text-sm"
              rows={10}
              placeholder="粘贴单词数据...&#10;格式：单词//音标//释义//例句"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsBatchModalOpen(false)}
            >
              取消
            </Button>
            <Button className="flex-1" onClick={handleBatchAdd}>
              导入
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
