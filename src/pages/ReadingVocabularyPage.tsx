import { useState, useEffect } from 'react';
import { Search, Filter, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { WordCard } from '../components/WordCard';
import { useStore } from '../store';
import { WordStatus, Word } from '../types';

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

export function ReadingVocabularyPage() {
  const { words, loadReadingWords, updateWord, deleteWord } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WordStatus | 'all'>('all');
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [editForm, setEditForm] = useState({
    word: '',
    phonetic: '',
    meaning: '',
    example: '',
  });
  const [selectedPartsOfSpeech, setSelectedPartsOfSpeech] = useState<string[]>([]);
  const [partOfSpeechMeanings, setPartOfSpeechMeanings] = useState<Record<string, string>>({});
  const [isPolysemous, setIsPolysemous] = useState(false);
  const [isSimilar, setIsSimilar] = useState(false);

  useEffect(() => {
    loadReadingWords();
  }, [loadReadingWords]);

  const filteredWords = words.filter((word) => {
    const matchesSearch =
      word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.meaning.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || word.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (id: string | number, status: WordStatus, reviewCount?: number) => {
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
      
      updateWord(id, {
        status,
        lastReviewedAt: new Date().toISOString(),
        reviewCount: newReviewCount,
      });
    } else {
      updateWord(id, { status });
    }
  };

  const handleEdit = (word: Word) => {
    setEditingWord(word);
    setIsPolysemous(Boolean(word.is_polysemous));
    setIsSimilar(Boolean(word.is_similar));
    
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
      setEditForm({
        word: word.word,
        phonetic: word.phonetic || '',
        meaning: '',
        example: word.example || '',
      });
    } else {
      setSelectedPartsOfSpeech([]);
      setPartOfSpeechMeanings({});
      setEditForm({
        word: word.word,
        phonetic: word.phonetic || '',
        meaning: word.meaning,
        example: word.example || '',
      });
    }
  };

  const handleSaveEdit = () => {
    if (!editingWord || !editForm.word) return;

    let processedMeaning = editForm.meaning;
    
    if (selectedPartsOfSpeech.length > 0) {
      const meaningParts = selectedPartsOfSpeech.map(pos => {
        const meaning = partOfSpeechMeanings[pos] || '';
        return `${pos} ${meaning}`;
      });
      processedMeaning = meaningParts.join('\n');
    }

    if (!processedMeaning.trim()) {
      alert('请输入释义');
      return;
    }

    updateWord(editingWord.id, {
      word: editForm.word,
      phonetic: editForm.phonetic,
      meaning: processedMeaning,
      example: editForm.example,
      is_polysemous: isPolysemous,
      is_similar: isSimilar,
    });
    setEditingWord(null);
    setSelectedPartsOfSpeech([]);
    setPartOfSpeechMeanings({});
    setIsPolysemous(false);
    setIsSimilar(false);
  };

  const stats = {
    total: words.length,
    new: words.filter((w) => w.status === 'new').length,
    learning: words.filter((w) => w.status === 'learning').length,
    mastered: words.filter((w) => w.status === 'mastered').length,
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary-950">
            阅读词汇
          </h1>
          <p className="text-gray-600 mt-1">
            共 {stats.total} 个阅读词汇 · {stats.mastered} 个已掌握
          </p>
        </div>
        <Link to="/reading" className="text-accent-600 hover:text-accent-700 flex items-center gap-2">
          <BookOpen size={18} />
          返回阅读
        </Link>
      </header>

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
          <div className="flex gap-4">
            <div className="flex-1 relative">
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
          </div>
        </CardContent>
      </Card>

      {filteredWords.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Filter size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500">
              {searchQuery ? '没有找到匹配的单词' : '还没有阅读词汇，在阅读理解中添加新词'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredWords.map((word) => (
            <WordCard
              key={word.id}
              word={word}
              onStatusChange={handleStatusChange}
              onDelete={deleteWord}
              onEdit={handleEdit}
              showSource
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={!!editingWord}
        onClose={() => { setEditingWord(null); setSelectedPartsOfSpeech([]); setPartOfSpeechMeanings({}); }}
        title="修改单词"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              单词 *
            </label>
            <input
              type="text"
              value={editForm.word}
              onChange={(e) => setEditForm({ ...editForm, word: e.target.value })}
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
              value={editForm.phonetic}
              onChange={(e) => setEditForm({ ...editForm, phonetic: e.target.value })}
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
                value={editForm.meaning}
                onChange={(e) => setEditForm({ ...editForm, meaning: e.target.value })}
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
              value={editForm.example}
              onChange={(e) => setEditForm({ ...editForm, example: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none resize-none"
              rows={2}
              placeholder="输入例句"
            />
          </div>
          {(isPolysemous || isSimilar) && (
            <div className="flex gap-3 pt-2">
              {isPolysemous && (
                <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  一词多义
                </span>
              )}
              {isSimilar && (
                <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  长得相似
                </span>
              )}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setEditingWord(null); setSelectedPartsOfSpeech([]); setPartOfSpeechMeanings({}); }}
            >
              取消
            </Button>
            <Button className="flex-1" onClick={handleSaveEdit}>
              保存
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}