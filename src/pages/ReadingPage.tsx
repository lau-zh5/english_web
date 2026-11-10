import { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, BookOpen, ArrowRight, Upload, Plus, Trash2, MoreVertical, Edit3, FileText, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { useStore } from '../store';
import { getDifficultyLabel, getDifficultyColor } from '../utils/helpers';
import { Question } from '../types';

export function ReadingPage() {
  const { articles, loadArticles, addArticle, addQuestions, deleteArticle, updateArticle, loadQuestions } = useStore();
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [newArticle, setNewArticle] = useState({ title: '', content: '', difficulty: 'medium' as 'easy' | 'medium' | 'hard' });
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingArticle, setEditingArticle] = useState<{id: number; title: string; content: string} | null>(null);
  const [deletingArticleId, setDeletingArticleId] = useState<number | null>(null);
  const [articleQuestionsCount, setArticleQuestionsCount] = useState<Record<number, number>>({});
  const [showImportMenu, setShowImportMenu] = useState(false);
  const importMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (importMenuRef.current && !importMenuRef.current.contains(event.target as Node)) {
      setShowImportMenu(false);
    }
  }, []);

  useEffect(() => {
    if (showImportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showImportMenu, handleClickOutside]);

  useEffect(() => {
    const loadQuestionsCounts = async () => {
      const counts: Record<number, number> = {};
      for (const article of articles) {
        const questions = await loadQuestions(article.id);
        counts[Number(article.id)] = questions.length;
      }
      setArticleQuestionsCount(counts);
    };
    if (articles.length > 0) {
      loadQuestionsCounts();
    }
  }, [articles, loadQuestions]);

  const difficulties = ['all', 'easy', 'medium', 'hard'];

  const filteredArticles =
    difficultyFilter === 'all'
      ? articles
      : articles.filter((a) => a.difficulty === difficultyFilter);

  const getReadingTime = (wordCount: number) => {
    return Math.ceil(wordCount / 200);
  };

  const handleAddArticle = async () => {
    if (!newArticle.title.trim() || !newArticle.content.trim()) {
      alert('请填写标题和内容');
      return;
    }
    await addArticle(newArticle);
    await loadArticles();
    setNewArticle({ title: '', content: '', difficulty: 'medium' });
    setIsArticleModalOpen(false);
  };

  const handleAddQuestions = async () => {
    if (!selectedArticleId || questions.length === 0) {
      alert('请选择文章并添加题目');
      return;
    }
    await addQuestions(selectedArticleId, questions);
    await loadArticles();
    setQuestions([]);
    setSelectedArticleId('');
    setIsQuestionModalOpen(false);
  };

  const handleEditArticle = (articleId: number) => {
    const article = articles.find(a => a.id === articleId);
    if (article) {
      setEditingArticle({ id: articleId, title: article.title, content: article.content });
    }
    setOpenMenuId(null);
  };

  const handleEditQuestions = async (articleId: number) => {
    setSelectedArticleId(String(articleId));
    setIsQuestionModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDeleteArticleConfirm = (articleId: number) => {
    setDeletingArticleId(articleId);
    setOpenMenuId(null);
  };

  const confirmDelete = async () => {
    if (!deletingArticleId) return;
    await deleteArticle(deletingArticleId);
    setDeletingArticleId(null);
  };

  const cancelDelete = () => {
    setDeletingArticleId(null);
  };

  const saveEdit = async () => {
    if (!editingArticle) return;
    await updateArticle(editingArticle.id, { title: editingArticle.title, content: editingArticle.content });
    setEditingArticle(null);
  };

  const cancelEdit = () => {
    setEditingArticle(null);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        correctAnswerText: '',
        explanation: '',
        type: 'choice',
      },
    ]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: string | number) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex] = {
      ...newQuestions[qIndex],
      options: newQuestions[qIndex].options.map((opt, i) => (i === oIndex ? value : opt)),
    };
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary-950">
            阅读理解
          </h1>
          <p className="text-gray-600 mt-1">选择文章开始阅读</p>
        </div>
        <div className="relative" ref={importMenuRef}>
          <Button onClick={() => setShowImportMenu(!showImportMenu)}>
            <Plus size={18} className="mr-2" />
            导入
            <ChevronDown size={18} className={`ml-1 transition-transform ${showImportMenu ? 'rotate-180' : ''}`} />
          </Button>
          {showImportMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-xl border border-gray-100 py-1 z-50">
              <button
                onClick={() => {
                  setIsArticleModalOpen(true);
                  setShowImportMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-blue-50 transition-colors"
              >
                <Upload size={18} />
                导入文章
              </button>
              <button
                onClick={() => {
                  if (articles.length === 0) {
                    alert('请先导入文章');
                    return;
                  }
                  setSelectedArticleId(articles[0] ? String(articles[0].id) : '');
                  setIsQuestionModalOpen(true);
                  setShowImportMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-blue-50 transition-colors"
              >
                <FileText size={18} />
                导入题目
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex gap-2 mb-6">
        {difficulties.map((diff) => (
          <button
            key={diff}
            onClick={() => setDifficultyFilter(diff)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              difficultyFilter === diff
                ? 'bg-accent-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {diff === 'all' ? '全部' : getDifficultyLabel(diff as 'easy' | 'medium' | 'hard')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArticles.map((article) => (
          <div key={article.id} className="relative">
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setOpenMenuId(openMenuId === article.id ? null : Number(article.id));
                }}
                className="lq-icon-btn"
                aria-label="更多操作"
              >
                <MoreVertical size={18} />
              </button>
              {openMenuId === article.id && (
                <div className="lq-menu lq-menu--col absolute right-0 top-full mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleEditArticle(Number(article.id));
                    }}
                    className="lq-menu-item"
                  >
                    <Edit3 size={14} />
                    修改文章
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleEditQuestions(Number(article.id));
                    }}
                    className="lq-menu-item"
                  >
                    <FileText size={14} />
                    修改题目
                  </button>
                  <div className="lq-menu-divider" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDeleteArticleConfirm(Number(article.id));
                    }}
                    className="lq-menu-item lq-menu-item--danger"
                  >
                    <Trash2 size={14} />
                    删除此文章
                  </button>
                </div>
              )}
            </div>
            <Link to={`/reading/${article.id}`}>
              <Card hover className="h-full flex flex-col">
                <CardContent className="p-5 flex flex-col flex-1">
                  <h3 className="font-display font-semibold text-primary-950 text-lg line-clamp-2 mb-2 pr-8">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                    {article.content ? article.content.substring(0, 100) + '...' : '暂无内容'}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {getReadingTime(article.wordCount || 0)} 分钟
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen size={14} />
                      {article.wordCount || 0} 词
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                        article.difficulty
                      )}`}
                    >
                      {getDifficultyLabel(article.difficulty)}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {articleQuestionsCount[Number(article.id)] || 0} 题
                    </span>
                  </div>
                  <div className="mt-auto flex items-center justify-end text-accent-600 text-sm font-medium">
                    开始阅读 <ArrowRight size={16} className="ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500">没有找到匹配的文章</p>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={isArticleModalOpen}
        onClose={() => setIsArticleModalOpen(false)}
        title="导入文章"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标题 *
            </label>
            <input
              type="text"
              value={newArticle.title}
              onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
              placeholder="输入文章标题"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              难度
            </label>
            <select
              value={newArticle.difficulty}
              onChange={(e) => setNewArticle({ ...newArticle, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
            >
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              内容 *
            </label>
            <textarea
              value={newArticle.content}
              onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none resize-none"
              rows={8}
              placeholder="粘贴文章内容..."
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsArticleModalOpen(false)}
            >
              取消
            </Button>
            <Button className="flex-1" onClick={handleAddArticle}>
              添加
            </Button>
          </div>
        </div>
      </Modal>

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

      {deletingArticleId && (
        <Modal
          isOpen={!!deletingArticleId}
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

      <Modal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        title="导入题目"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              选择文章 *
            </label>
            <select
              value={selectedArticleId}
              onChange={(e) => setSelectedArticleId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
            >
              <option value="">请选择文章</option>
              {articles.map((article) => (
                <option key={article.id} value={String(article.id)}>
                  {article.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">题目列表</span>
              <Button size="sm" onClick={addQuestion}>
                <Plus size={14} className="mr-1" />
                添加题目
              </Button>
            </div>

            {questions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                点击上方按钮添加题目
              </p>
            ) : (
              questions.map((question, qIndex) => (
                <div key={qIndex} className="p-4 rounded-lg bg-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      第 {qIndex + 1} 题
                    </span>
                    <button
                      onClick={() => removeQuestion(qIndex)}
                      className="p-1 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">题目类型:</span>
                    <select
                      value={question.type}
                      onChange={(e) => {
                        const newType = e.target.value as 'choice' | 'fill';
                        const newQuestions = [...questions];
                        newQuestions[qIndex] = { 
                          ...newQuestions[qIndex], 
                          type: newType,
                          correctAnswer: newType === 'choice' ? 0 : null 
                        };
                        setQuestions(newQuestions);
                      }}
                      className="px-3 py-1 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none text-sm"
                    >
                      <option value="choice">选择题</option>
                      <option value="fill">填空题</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    value={question.question}
                    onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none text-sm"
                    placeholder="输入问题"
                  />
                  {question.type === 'choice' && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        {question.options.map((option, oIndex) => (
                          <input
                            key={oIndex}
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none text-sm"
                            placeholder={`选项 ${String.fromCharCode(65 + oIndex)}`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">正确答案:</span>
                        <select
                          value={question.correctAnswer ?? 0}
                          onChange={(e) => updateQuestion(qIndex, 'correctAnswer', parseInt(e.target.value))}
                          className="px-3 py-1 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none text-sm"
                        >
                          {['A', 'B', 'C', 'D'].map((opt, i) => (
                            <option key={opt} value={i}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                  {question.type === 'fill' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        正确答案
                      </label>
                      <input
                        type="text"
                        value={question.correctAnswerText || ''}
                        onChange={(e) => {
                          const newQuestions = [...questions];
                          newQuestions[qIndex] = { 
                            ...newQuestions[qIndex], 
                            correctAnswerText: e.target.value 
                          };
                          setQuestions(newQuestions);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none text-sm"
                        placeholder="输入正确答案"
                      />
                    </div>
                  )}
                  <textarea
                    value={question.explanation}
                    onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none resize-none text-sm"
                    rows={2}
                    placeholder="解析（可选）"
                  />
                </div>
              ))
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsQuestionModalOpen(false)}
            >
              取消
            </Button>
            <Button className="flex-1" onClick={handleAddQuestions}>
              保存题目
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
