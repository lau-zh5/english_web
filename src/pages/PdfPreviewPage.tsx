import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { apiFetch } from '../lib/api';

export function PdfPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [ebook, setEbook] = useState<{ id: number; name: string; url: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    const fetchEbook = async () => {
      try {
        const res = await apiFetch(`/ebooks/${id}`);
        if (res.ok) {
          const data = await res.json();
          setEbook(data);
        } else {
          const data = await res.json().catch(() => ({}));
          // alert() 会阻塞页面脚本，改为内联错误提示
          setError(data.error || '获取文件信息失败');
        }
      } catch (err) {
        console.error('PDF preview error:', err);
        setError('无法预览，请检查网络连接');
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-secondary mb-4">{error || '文件不存在或无法访问'}</p>
          <Link to="/vocabulary">
            <button className="px-4 py-2 rounded-lg">返回单词书列表</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden rounded-2xl surface-glass">
      {/* pr-14：为固定在右上角的全站主题按钮留出空间，避免遮住下载/缩放控件 */}
      <header className="text-primary border-b border-[var(--lq-stroke-2)] pl-4 pr-14 py-3 flex items-center justify-between shrink-0">
        <Link to="/vocabulary" className="flex shrink-0 items-center gap-2 hover:opacity-70 transition-opacity">
          <ArrowLeft size={20} />
          <span className="hidden font-medium sm:inline">返回单词书</span>
        </Link>
        <h1 className="truncate px-2 text-center text-sm font-semibold sm:text-lg">{ebook.name}</h1>
        <div className="flex shrink-0 items-center gap-1">
          <button onClick={handleZoomOut} className="lq-icon-btn lq-icon-btn--subtle" title="缩小" aria-label="缩小">
            <ZoomOut size={18} />
          </button>
          <span className="w-12 text-center text-sm text-secondary">{zoom}%</span>
          <button onClick={handleZoomIn} className="lq-icon-btn lq-icon-btn--subtle" title="放大" aria-label="放大">
            <ZoomIn size={18} />
          </button>
          <a href={ebook.url} download className="lq-toolbar-link ml-1">
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