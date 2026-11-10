import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Edit2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { useStore } from '../store';
import { Wordbook } from '../types';
import { apiFetch } from '../lib/api';

export function WordbookListPage() {
  const navigate = useNavigate();
  const { wordbooks, loadWordbooks, addWordbook, deleteWordbook } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWordbook, setEditingWordbook] = useState<Wordbook | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  
  const [isEbookModalOpen, setIsEbookModalOpen] = useState(false);
  const [ebookName, setEbookName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadWordbooks();
  }, [loadWordbooks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingWordbook) {
      await apiFetch(`/wordbooks/${editingWordbook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      await loadWordbooks();
    } else {
      await addWordbook(formData.name, formData.description);
    }

    setIsModalOpen(false);
    setEditingWordbook(null);
    setFormData({ name: '', description: '' });
  };

  const handleEdit = (wordbook: Wordbook) => {
    setEditingWordbook(wordbook);
    setFormData({ name: wordbook.name, description: wordbook.description || '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个单词书吗？')) return;
    await apiFetch(`/wordbooks/${id}`, { method: 'DELETE' });
    await deleteWordbook(id);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'pdf') {
        alert('只支持 PDF 格式');
        return;
      }
      setSelectedFile(file);
      if (!ebookName) {
        setEbookName(file.name.replace(/\.pdf$/i, ''));
      }
    }
  };

  const handleEbookUpload = async () => {
    if (!selectedFile || !ebookName) {
      alert('请选择文件并输入名称');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('name', ebookName);
    formData.append('description', '');

    try {
      const res = await apiFetch('/ebooks/upload', { method: 'POST', body: formData });
      if (res.ok) {
        await loadWordbooks();
        setIsEbookModalOpen(false);
        setSelectedFile(null);
        setEbookName('');
      } else {
        const error = await res.json();
        alert(error.error || '上传失败');
      }
    } catch (err) {
      alert('上传失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">单词书</h1>
          <button 
            className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
            onClick={() => navigate('/reading/vocabulary')}
          >
            阅读词汇
          </button>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsEbookModalOpen(true)}>
            <Plus size={18} />
            导入 PDF
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            新建单词书
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wordbooks.map((wordbook) => (
          <Card key={wordbook.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div 
                  className="flex-1 cursor-pointer" 
                  onClick={() => navigate(`/vocabulary/wordbook/${wordbook.id}`)}
                >
                  <h3 className="font-semibold text-lg">{wordbook.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {wordbook.chapter_count} 章节 · {wordbook.word_count} 单词
                  </p>
                </div>
                <div className="flex gap-1 ml-2">
                  {wordbook.ebook_path && (
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/vocabulary/ebook/${wordbook.id}`); }}
                      className="p-1.5 hover:bg-gray-100 rounded text-blue-600"
                      title="预览 PDF"
                    >
                      <Eye size={18} />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(wordbook); }}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(wordbook.id); }}
                    className="p-1.5 hover:bg-gray-100 rounded text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingWordbook ? '编辑单词书' : '新建单词书'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="输入单词书名称"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="可选描述"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              取消
            </Button>
            <Button type="submit">
              {editingWordbook ? '保存' : '创建'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEbookModalOpen} onClose={() => setIsEbookModalOpen(false)} title="导入 PDF">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">选择 PDF 文件</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              {selectedFile ? (
                <div>
                  <p className="text-green-600 font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500">点击选择 PDF 文件</p>
                  <p className="text-sm text-gray-400 mt-1">仅支持 PDF 格式</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">单词书名称</label>
            <input
              type="text"
              value={ebookName}
              onChange={(e) => setEbookName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="输入名称"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsEbookModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEbookUpload} disabled={!selectedFile || !ebookName || uploading}>
              {uploading ? '上传中...' : '上传'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
