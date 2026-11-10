import { useState, useEffect, useRef } from 'react';
import { Play, Clock, Tag, Plus, Upload, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { AudioPlayer, AudioPlayerRef } from '../components/AudioPlayer';
import { useStore } from '../store';
import { formatDuration, parseTimestamp } from '../utils/helpers';
import { AudioItem } from '../types';
import { apiUrl } from '../lib/api';

export function ListeningPage() {
  const { audios, loadAudios, uploadAudio, deleteAudio, notes, loadNotes, addNote } = useStore();
  const [selectedAudio, setSelectedAudio] = useState<AudioItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [listeningTime, setListeningTime] = useState(0);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPlayerRef = useRef<AudioPlayerRef>(null);

  useEffect(() => {
    loadAudios();
    loadNotes();
  }, [loadAudios, loadNotes]);

  const categories = ['all', ...new Set(audios.map((a) => a.category))];

  const filteredAudios =
    categoryFilter === 'all'
      ? audios
      : audios.filter((a) => a.category === categoryFilter);

  const audioNotes = selectedAudio
    ? notes.filter((n) => n.audioId === String(selectedAudio.id))
    : [];

  const handleAddNote = () => {
    if (!selectedAudio || !newNote.trim()) return;
    addNote({
      audioId: String(selectedAudio.id),
      content: newNote,
      timestamp: formatDuration(listeningTime),
    });
    setNewNote('');
    setShowAddNote(false);
  };

  const handleCancelNote = () => {
    setNewNote('');
    setShowAddNote(false);
  };

  const handleSelectAudio = (audio: AudioItem) => {
    setSelectedAudio(audio);
    setListeningTime(0);
  };

  const handleTimestampClick = (timestamp: string) => {
    const time = parseTimestamp(timestamp);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.seek(time);
    }
  };

  const handleUploadAudio = async () => {
    const fileInput = fileInputRef.current;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;

    const file = fileInput.files[0];
    if (!uploadTitle.trim()) {
      alert('请输入音频标题');
      return;
    }

    await uploadAudio(uploadTitle, uploadCategory, file);
    await loadAudios();
    setUploadTitle('');
    setUploadCategory('');
    setIsUploadModalOpen(false);
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleDeleteAudio = async (audio: AudioItem) => {
    if (confirm(`确定要删除 "${audio.title}" 吗？`)) {
      await deleteAudio(String(audio.id));
      await loadAudios();
      if (selectedAudio?.id === audio.id) {
        setSelectedAudio(null);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary-950">
            听力训练
          </h1>
          <p className="text-gray-600 mt-1">选择音频开始练习</p>
        </div>
        <Button onClick={() => setIsUploadModalOpen(true)}>
          <Upload size={18} className="mr-2" />
          导入音频
        </Button>
      </header>

      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setCategoryFilter(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              categoryFilter === category
                ? 'bg-accent-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category === 'all' ? '全部' : category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAudios.map((audio) => (
              <Card
                key={audio.id}
                hover
                onClick={() => handleSelectAudio(audio)}
                className={
                  selectedAudio?.id === audio.id ? 'ring-2 ring-accent-500' : ''
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0">
                      <Play size={18} className="text-accent-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-primary-950 truncate">
                        {audio.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatDuration(audio.duration)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag size={14} />
                          {audio.category || '未分类'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAudio(audio);
                      }}
                      className="p-1 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {selectedAudio ? (
            <>
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-display font-semibold text-primary-950 mb-4">
                    {selectedAudio.title}
                  </h3>
                  <AudioPlayer
                    ref={audioPlayerRef}
                    duration={selectedAudio.duration}
                    audioUrl={apiUrl(`/audios/stream/${selectedAudio.file_path?.split('/').pop()}`)}
                    onTimeChange={setListeningTime}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-primary-950">
                      听力笔记
                    </h3>
                    <Button size="sm" onClick={() => setShowAddNote(true)}>
                      <Plus size={14} className="mr-1" />
                      添加
                    </Button>
                  </div>

                  {showAddNote && (
                    <div className="mb-4 p-3 rounded-lg bg-accent-50 border border-accent-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-accent-600 font-medium">
                          [{formatDuration(listeningTime)}]
                        </span>
                      </div>
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none resize-none text-sm"
                        rows={2}
                        placeholder="输入笔记内容..."
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={handleCancelNote}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          取消
                        </button>
                        <button
                          onClick={handleAddNote}
                          className="px-3 py-1 text-sm bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  )}

                  {audioNotes.length === 0 && !showAddNote && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      还没有笔记
                    </p>
                  )}

                  {audioNotes.length > 0 && (
                    <div className="space-y-2">
                      {audioNotes.map((note) => (
                        <div
                          key={note.id}
                          className="p-3 rounded-lg bg-gray-50 text-sm"
                        >
                          <button
                            onClick={() => handleTimestampClick(note.timestamp)}
                            className="text-xs text-accent-600 font-medium hover:text-accent-700 hover:underline cursor-pointer"
                          >
                            [{note.timestamp}]
                          </button>
                          <p className="mt-1 text-gray-700">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Play size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-500">选择一个音频开始练习</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="导入音频"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              音频文件 *
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/mp3,audio/wav,audio/ogg"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标题 *
            </label>
            <input
              type="text"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
              placeholder="输入音频标题"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分类
            </label>
            <input
              type="text"
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
              placeholder="例如: 考研听力、新闻、对话"
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsUploadModalOpen(false)}
            >
              取消
            </Button>
            <Button className="flex-1" onClick={handleUploadAudio}>
              上传
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
