import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle, Trash2, Edit3, FileText } from 'lucide-react';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { useStore } from '../store';
import { getDifficultyLabel, getDifficultyColor } from '../utils/helpers';

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

export function ReadingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { articles, words, loadArticles, loadWords, addWord, updateTodayRecord, deleteArticle, updateArticle, loadQuestions } = useStore();
  const navigate = useNavigate();
  const [editingArticle, setEditingArticle] = useState<{id: number; title: string; content: string} | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isEditQuestionsOpen, setIsEditQuestionsOpen] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [isAddWordModalOpen, setIsAddWordModalOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState('');
  const [newWordPhonetic, setNewWordPhonetic] = useState('');
  const [newWordMeaning, setNewWordMeaning] = useState('');
  const [newWordExample, setNewWordExample] = useState('');
  const [selectedPartsOfSpeech, setSelectedPartsOfSpeech] = useState<string[]>([]);
  const [partOfSpeechMeanings, setPartOfSpeechMeanings] = useState<Record<string, string>>({});
  const [highlightedWords, setHighlightedWords] = useState<Set<string>>(new Set());
  const [isPolysemous, setIsPolysemous] = useState(false);
  const [isSimilar, setIsSimilar] = useState(false);

  useEffect(() => {
    loadArticles();
    loadWords();
  }, [loadArticles, loadWords]);

  const article = articles.find((a) => String(a.id) === id);

  const handleDeleteArticle = () => {
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!article) return;
    await deleteArticle(Number(article.id));
    navigate('/reading');
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
  };

  const handleEditArticle = () => {
    if (!article) return;
    setEditingArticle({ id: Number(article.id), title: article.title, content: article.content });
  };

  const handleEditQuestions = async () => {
    if (!article) return;
    const loadedQuestions = await loadQuestions(article.id);
    setQuestions(loadedQuestions || []);
    setIsEditQuestionsOpen(true);
  };

  const saveEdit = async () => {
    if (!editingArticle) return;
    await updateArticle(editingArticle.id, { title: editingArticle.title, content: editingArticle.content });
    setEditingArticle(null);
  };

  const cancelEdit = () => {
    setEditingArticle(null);
  };

  useEffect(() => {
    if (article) {
      updateTodayRecord({ articlesRead: 1 });
    }
  }, [article, updateTodayRecord]);

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 mb-4">文章不存在</p>
            <Link to="/reading">
              <Button>返回文章列表</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fontSizes = {
    small: 'text-sm leading-relaxed',
    medium: 'text-base leading-relaxed',
    large: 'text-lg leading-relaxed',
  };

  const handleWordClick = (word: string) => {
    const cleanWord = word.replace(/[.,!?;:'"()]/g, '').toLowerCase();
    if (cleanWord.length < 2) return;

    const existingWord = words.find(
      (w) => w.word.toLowerCase() === cleanWord
    );

    if (existingWord) {
      setHighlightedWords((prev) => new Set(prev).add(cleanWord));
      return;
    }

    setSelectedWord(cleanWord);
    setNewWordPhonetic('');
    setNewWordMeaning('');
    setNewWordExample('');
    setSelectedPartsOfSpeech([]);
    setPartOfSpeechMeanings({});
    setIsPolysemous(false);
    setIsSimilar(false);
    setIsAddWordModalOpen(true);
  };

  const handleAddWord = () => {
    if (!selectedWord) return;
    
    let processedMeaning = newWordMeaning;
    
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

    addWord({
      word: selectedWord,
      phonetic: newWordPhonetic,
      meaning: processedMeaning,
      example: newWordExample,
      status: 'new',
      source_type: 'reading',
      source_id: Number(id),
      is_polysemous: isPolysemous,
      is_similar: isSimilar,
    });
    setHighlightedWords((prev) => new Set(prev).add(selectedWord));
    setIsAddWordModalOpen(false);
  };

  const renderContent = () => {
    if (!article.content) {
      return <p className="text-gray-500">暂无内容</p>;
    }
    const paragraphs = article.content.split('\n\n');
    return paragraphs.map((paragraph, pIndex) => {
      const words = paragraph.split(/(\s+)/);
      return (
        <p key={pIndex} className="mb-4">
          {words.map((word, wIndex) => {
            const cleanWord = word.replace(/[.,!?;:'"()]/g, '').toLowerCase();
            const isHighlighted = highlightedWords.has(cleanWord);
            const isActualWord = /[a-zA-Z]/.test(word);

            if (!isActualWord) {
              return <span key={wIndex}>{word}</span>;
            }

            return (
              <span
                key={wIndex}
                onClick={() => handleWordClick(word)}
                className={`cursor-pointer transition-colors ${
                  isHighlighted
                    ? 'bg-accent-200 text-accent-900 px-0.5 rounded'
                    : 'hover:bg-blue-100'
                }`}
              >
                {word}
              </span>
            );
          })}
        </p>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/reading"
          className="flex items-center gap-2 text-gray-600 hover:text-primary-950 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>返回列表</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">字体大小:</span>
            <div className="flex gap-1">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    fontSize === size
                      ? 'bg-primary-950 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {size === 'small' ? '小' : size === 'medium' ? '中' : '大'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleEditArticle}
              className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1.5"
            >
              <Edit3 size={14} />
              修改文章
            </button>
            <button
              onClick={handleEditQuestions}
              className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1.5"
            >
              <FileText size={14} />
              修改题目
            </button>
            <button
              onClick={handleDeleteArticle}
              className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              删除文章
            </button>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-8">
          <h1 className="text-2xl font-display font-bold text-primary-950 mb-4">
            {article.title}
          </h1>
          <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <BookOpen size={14} />
              {article.wordCount} 词
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                article.difficulty
              )}`}
            >
              {getDifficultyLabel(article.difficulty)}
            </span>
          </div>
          <div className={fontSizes[fontSize]}>
            <p className="text-sm text-gray-500 mb-4">
              💡 点击单词可添加到生词本
            </p>
            {renderContent()}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Link to={`/reading/${article.id}/test`}>
          <Button>
            <CheckCircle size={18} className="mr-2" />
            开始测试
          </Button>
        </Link>
      </div>

      {editingArticle && (
        <Modal
          isOpen={!!editingArticle}
          onClose={cancelEdit}
          title="修改文章"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                文章标题
              </label>
              <input
                type="text"
                value={editingArticle.title}
                onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                文章内容
              </label>
              <textarea
                value={editingArticle.content}
                onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none resize-none"
                rows={8}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={cancelEdit}>
                取消
              </Button>
              <Button className="flex-1" onClick={saveEdit}>
                保存
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {isDeleteConfirmOpen && (
        <Modal
          isOpen={isDeleteConfirmOpen}
          onClose={cancelDelete}
          title="确认删除"
        >
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-red-800 font-medium">⚠️ 确认删除此文章？</p>
              <p className="text-red-600 text-sm mt-1">删除后将无法恢复，包括与此文章相关的所有题目。</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={cancelDelete}>
                取消
              </Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600" onClick={confirmDelete}>
                确认删除
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {isEditQuestionsOpen && (
        <Modal
          isOpen={isEditQuestionsOpen}
          onClose={() => setIsEditQuestionsOpen(false)}
          title="查看题目"
        >
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {questions.length === 0 ? (
              <p className="text-center text-gray-500 py-4">暂无题目</p>
            ) : (
              questions.map((q, qIndex) => (
                <div key={qIndex} className="p-4 rounded-lg bg-gray-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">第 {qIndex + 1} 题</span>
                    <span className="text-xs text-gray-500">
                      {q.type === 'choice' ? '选择题' : '填空题'}
                    </span>
                  </div>
                  <p className="text-sm">{q.question}</p>
                  {q.type === 'choice' && q.options && (
                    <div className="text-sm text-gray-600">
                      A: {q.options[0]} | B: {q.options[1]} | C: {q.options[2]} | D: {q.options[3]}
                    </div>
                  )}
                  {q.type === 'fill' && (
                    <p className="text-sm text-green-600">答案: {q.correct_answer_text || q.correctAnswerText}</p>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setIsEditQuestionsOpen(false)}>
              关闭
            </Button>
            <Button className="flex-1" onClick={() => navigate(`/reading/${article.id}/test`)}>
              开始测试
            </Button>
          </div>
        </Modal>
      )}

      <Modal
        isOpen={isAddWordModalOpen}
        onClose={() => {
          setIsAddWordModalOpen(false);
          setNewWordPhonetic('');
          setNewWordMeaning('');
          setNewWordExample('');
          setSelectedPartsOfSpeech([]);
          setPartOfSpeechMeanings({});
        }}
        title="添加到生词本"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              单词
            </label>
            <p className="text-lg font-medium text-primary-950">{selectedWord}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              音标
            </label>
            <input
              type="text"
              value={newWordPhonetic}
              onChange={(e) => setNewWordPhonetic(e.target.value)}
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
                      autoFocus
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
                value={newWordMeaning}
                onChange={(e) => setNewWordMeaning(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
                placeholder="输入中文释义"
                autoFocus
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              例句
            </label>
            <textarea
              value={newWordExample}
              onChange={(e) => setNewWordExample(e.target.value)}
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
              onClick={() => {
                setIsAddWordModalOpen(false);
                setNewWordPhonetic('');
                setNewWordMeaning('');
                setNewWordExample('');
                setSelectedPartsOfSpeech([]);
                setPartOfSpeechMeanings({});
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
      </Modal>
    </div>
  );
}
