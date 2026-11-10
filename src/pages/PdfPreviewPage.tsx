import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { apiFetch } from '../lib/api';

export function PdfPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [ebook, setEbook] = useState<{ id: number; name: string; url: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    const fetchEbook = async () => {
      try {
        const res = await apiFetch(`/ebooks/${id}`);
        if (res.ok) {
          const data = await res.json();
          setEbook(data);
        } else {
          const error = await res.json();
          alert(error.error || '获取文件信息失败');
        }
      } catch (err) {
        console.error('PDF preview error:', err);
        alert('无法预览，请检查网络连接');
      } finally {
        setLoading(false);
      }
    };
    fetchEbook();
  }, [id]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">文件不存在或无法访问</p>
          <Link to="/vocabulary">
            <button className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors">
              返回单词书列表
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <header className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <Link to="/vocabulary" className="flex items-center gap-2 hover:text-gray-300 transition-colors">
          <ArrowLeft size={20} />
          <span className="font-medium">返回单词书</span>
        </Link>
        <h1 className="text-lg font-semibold truncate max-w-lg text-center">{ebook.name}</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="缩小"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-sm text-gray-300 w-12 text-center">{zoom}%</span>
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="放大"
          >
            <ZoomIn size={18} />
          </button>
          <a
            href={ebook.url}
            download
            className="flex items-center gap-1 px-3 py-1.5 bg-accent-500 hover:bg-accent-600 rounded text-sm transition-colors ml-1"
          >
            <Download size={16} />
            下载
          </a>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden bg-black">
        <div className="h-full w-full">
          <iframe
            src={ebook.url}
            title={ebook.name}
            width="100%"
            height="100%"
            className="border-none"
          />
        </div>
      </main>
    </div>
  );
}