import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Shuffle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { WordCard } from '../components/WordCard';
import { useStore } from '../store';
import { WordStatus } from '../types';

export function VocabularyPage() {
  const { words, loadWords, addWord, updateWord, deleteWord } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WordStatus | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleMeanings, setVisibleMeanings] = useState<Record<string | number, boolean>>({});
  const [newWord, setNewWord] = useState({
    word: '',
    phonetic: '',
    meaning: '',
    example: '',
    status: 'new' as WordStatus,
  });

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  const filteredWords = words.filter((word) => {
    const matchesSearch =
      word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.meaning.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || word.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddWord = () => {
    if (!newWord.word || !newWord.meaning) return;
    addWord(newWord);
    setNewWord({
      word: '',
      phonetic: '',
      meaning: '',
      example: '',
      status: 'new',
    });
    setIsModalOpen(false);
  };

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

  const toggleMeaning = (id: string | number) => {
    setVisibleMeanings(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const isMeaningVisible = (id: string | number) => {
    if (visibleMeanings[id] !== undefined) {
      return visibleMeanings[id];
    }
    return true;
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
            单词本
          </h1>
          <p className="text-gray-600 mt-1">
            共 {stats.total} 个单词 · {stats.mastered} 个已掌握
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/vocabulary">
            <Button variant="outline">
              <Shuffle size={18} className="mr-2" />
              记忆测试
            </Button>
          </Link>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={18} className="mr-2" />
            添加单词
          </Button>
        </div>
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
              {searchQuery ? '没有找到匹配的单词' : '还没有单词，点击上方按钮添加'}
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
              onToggleMeaning={toggleMeaning}
              isMeaningVisible={isMeaningVisible(word.id)}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="添加新单词"
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
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsModalOpen(false)}
            >
              取消
            </Button>
            <Button className="flex-1" onClick={handleAddWord}>
              添加
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
