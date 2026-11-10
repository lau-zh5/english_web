import { useCallback, useEffect, useState } from 'react';
import { Database, Download, ExternalLink, RefreshCw, Cloud, HardDrive } from 'lucide-react';
import { API_BASE, apiFetch, getSession } from '../lib/api';

const COLLECTIONS = [
  { key: 'wordbooks', label: '单词本' },
  { key: 'chapters', label: '章节' },
  { key: 'words', label: '单词' },
  { key: 'articles', label: '文章' },
  { key: 'study_records', label: '学习记录' },
  { key: 'notes', label: '笔记' },
  { key: 'audios', label: '音频' },
] as const;

const CLOUD_CONSOLE = 'https://console.cloud.tencent.com/tcb';

export function DataPage() {
  const session = getSession();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [raw, setRaw] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isCloud = API_BASE.startsWith('http');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const nextCounts: Record<string, number> = {};
    const nextRaw: Record<string, unknown> = {};

    await Promise.all(
      COLLECTIONS.map(async ({ key }) => {
        try {
          const res = await apiFetch(`/${key}`);
          if (!res.ok) throw new Error(String(res.status));
          const data = await res.json();
          nextRaw[key] = data;
          nextCounts[key] = Array.isArray(data) ? data.length : 0;
        } catch {
          nextCounts[key] = -1;
        }
      }),
    );

    setCounts(nextCounts);
    setRaw(nextRaw);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const exportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      apiBase: API_BASE,
      user: session ? { id: session.id, username: session.username } : null,
      collections: raw,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `english-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass rounded-3xl p-6">
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            <Database size={22} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-primary">我的数据</h1>
            <p className="text-sm text-tertiary mt-1 leading-relaxed">
              查看当前账号保存在{session?.username ? `「${session.username}」` : ''}账号下的学习数据，并可随时导出备份。
            </p>
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          {isCloud ? <Cloud size={18} style={{ color: 'var(--accent)' }} /> : <HardDrive size={18} className="text-tertiary" />}
          <h2 className="font-semibold text-primary">数据来源</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl p-4 surface-glass">
            <p className="text-xs text-tertiary mb-1">接口地址</p>
            <p className="font-mono text-secondary break-all">{API_BASE}</p>
          </div>
          <div className="rounded-2xl p-4 surface-glass">
            <p className="text-xs text-tertiary mb-1">状态</p>
            <p className="text-secondary">
              {isCloud ? '已连接云端服务' : '本地同源接口（部署后自动切到云端）'}
            </p>
          </div>
        </div>
        {error && <p className="mt-3 text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
      </div>

      <div className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-primary">数据集合</h2>
          <button
            onClick={load}
            disabled={loading}
            className="btn-outline flex items-center gap-2 !py-2 !px-3 text-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            刷新
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {COLLECTIONS.map(({ key, label }) => (
            <div key={key} className="rounded-2xl p-4 surface-glass">
              <p className="text-xs text-tertiary">{label}</p>
              <p className="text-2xl font-semibold text-primary mt-1 tabular-nums">
                {counts[key] === undefined ? '—' : counts[key] === -1 ? '不可用' : counts[key]}
              </p>
              <p className="text-[11px] font-mono text-tertiary mt-1 truncate">{key}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mt-5">
          <button onClick={exportJson} className="btn-primary flex items-center gap-2 text-sm">
            <Download size={16} />
            导出 JSON 备份
          </button>
          <a
            href={CLOUD_CONSOLE}
            target="_blank"
            rel="noreferrer"
            className="btn-outline flex items-center gap-2 text-sm"
          >
            <ExternalLink size={16} />
            打开云端控制台
          </a>
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <h2 className="font-semibold text-primary mb-3">在云端控制台怎么看</h2>
        <ol className="space-y-2 text-sm text-secondary leading-relaxed list-decimal list-inside">
          <li>打开腾讯云开发控制台，进入你的环境。</li>
          <li>左侧「云数据库」→ 选择对应集合（users / words / study_records 等），可直接查看、编辑每条记录。</li>
          <li>集合右上角支持导出 JSON / CSV，也可在「数据库 → 备份」配置定期备份。</li>
          <li>注册账号在 <span className="font-mono text-tertiary">users</span> 集合；密码以 scrypt 哈希存储，不会明文保存。</li>
        </ol>
        <p className="text-xs text-tertiary mt-4 leading-relaxed">
          注意：本页的「导出 JSON」是从当前接口拉取一份快照，适合本地留档；控制台里的才是权威数据源。
        </p>
      </div>
    </div>
  );
}
