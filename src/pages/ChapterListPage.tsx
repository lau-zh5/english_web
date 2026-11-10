import { useState, useEffect, useRef } from 'react';
import { Plus, ListMusic, Trash2, Edit2, ChevronRight, ArrowLeft, Upload, Music } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { useStore } from '../store';
import { Chapter } from '../types';

export function ChapterListPage() {
  const navigate = useNavigate();
  const { wordbookId } = useParams<{ wordbookId: string }>();
  const { wordbooks, chapters, loadWordbooks, loadChapters, addChapter, deleteChapter, uploadChapterAudio } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [formData, setFormData] = useState({ name: '', chapter_order: 0 });
  const [uploadingChapterId, setUploadingChapterId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordbookIdNum = parseInt(wordbookId || '0');
  const currentWordbook = wordbooks.find(w => w.id === wordbookIdNum);

  useEffect(() => {
    loadWordbooks();
    if (wordbookIdNum) {
      loadChapters(wordbookIdNum);
    }
  }, [loadWordbooks, loadChapters, wordbookIdNum]);

  const handleOpenModal = (chapter?: Chapter) => {
    if (chapter) {
      setEditingChapter(chapter);
      setFormData({ name: chapter.name, chapter_order: chapter.chapter_order });
    } else {
      setEditingChapter(null);
      setFormData({ name: '', chapter_order: chapters.length });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    
    if (editingChapter) {
      await useStore.getState().updateChapter(editingChapter.id, formData);
    } else {
      await addChapter(wordbookIdNum, formData.name, formData.chapter_order);
    }
    
    await loadChapters(wordbookIdNum);
    
    setIsModalOpen(false);
    setFormData({ name: '', chapter_order: 0 });
    setEditingChapter(null);
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个章节吗？章节内的单词也会被删除。')) {
      await deleteChapter(id);
      await loadChapters(wordbookIdNum);
    }
  };

  const handleEnter = (chapterId: number) => {
    navigate(`/vocabulary/chapter/${chapterId}`);
  };

  const handleUploadClick = (chapterId: number) => {
    setUploadingChapterId(chapterId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingChapterId) return;
    
    try {
      await uploadChapterAudio(uploadingChapterId, file);
      await loadChapters(wordbookIdNum);
      alert('音频上传成功！');
    } catch (error) {
      alert('音频上传失败，请重试。');
    }
    
    setUploadingChapterId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBack = () => {
    loadWordbooks();
    navigate('/vocabulary');
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

      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-display font-bold text-primary-950">
              {currentWordbook?.name || '章节管理'}
            </h1>
            <p className="text-gray-600 mt-1">
              共 {chapters.length} 个章节
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={18} className="mr-2" />
          创建章节
        </Button>
      </header>

      {chapters.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <ListMusic size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">还没有章节，点击上方按钮创建</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {chapters.map((chapter, index) => (
            <Card key={chapter.id} hover className="group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-4 flex-1 cursor-pointer"
                    onClick={() => handleEnter(chapter.id)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center text-accent-600 font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-primary-950">{chapter.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span>{(chapter as any).word_count || chapter.words?.length || 0} 个单词</span>
                        {chapter.audio_path && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Music size={14} />
                            已上传音频
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUploadClick(chapter.id); }}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-accent-50 text-gray-600 hover:text-accent-600 flex items-center gap-1.5 text-sm transition-colors"
                    >
                      <Upload size={14} />
                      上传音频
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenModal(chapter); }}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary-950"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(chapter.id); }}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => handleEnter(chapter.id)}
                      className="p-2 rounded-lg hover:bg-accent-50 text-gray-500 hover:text-accent-600"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingChapter(null); }}
        title={editingChapter ? '编辑章节' : '创建章节'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              章节名称 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
              placeholder="例如：Unit 1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              排序序号
            </label>
            <input
              type="number"
              value={formData.chapter_order}
              onChange={(e) => setFormData({ ...formData, chapter_order: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
              placeholder="数字越小越靠前"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setIsModalOpen(false); setEditingChapter(null); }}
            >
              取消
            </Button>
            <Button className="flex-1" onClick={handleSubmit}>
              {editingChapter ? '保存' : '创建'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
