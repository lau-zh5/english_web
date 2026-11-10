import { useState } from 'react';
import { Word } from '../types';
import { getStatusLabel } from '../utils/helpers';
import { filterMeaning } from '../utils/meaningFilter';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';

interface WordCardProps {
  word: Word;
  onStatusChange?: (id: string | number, status: Word['status'], reviewCount?: number) => void;
  onDelete: (id: string | number) => void;
  onEdit?: (word: Word) => void;
  showSource?: boolean;
  isMeaningVisible?: boolean;
  onToggleMeaning?: (id: string | number) => void;
  isHighlighted?: boolean;
}

const ReviewCycleDays = 21;

export function WordCard(props: WordCardProps) {
  const { word, onStatusChange, onDelete, onEdit, showSource, isMeaningVisible = true, onToggleMeaning, isHighlighted } = props;
  const [showMenu, setShowMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const getReviewCountDisplay = () => {
    if (!word.lastReviewedAt) {
      return 0;
    }
    const lastReview = new Date(word.lastReviewedAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays >= ReviewCycleDays) {
      return 0;
    }
    return word.reviewCount || 0;
  };

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowStatusMenu(!showStatusMenu);
    setShowMenu(false);
  };

  const handleStatusChange = (e: React.MouseEvent, newStatus: Word['status']) => {
    e.stopPropagation();
    
    const lastReviewedAt = word.lastReviewedAt ? new Date(word.lastReviewedAt) : null;
    const now = new Date();
    const diffDays = lastReviewedAt 
      ? Math.floor((now.getTime() - lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    let newReviewCount = word.reviewCount || 0;
    
    if (diffDays >= ReviewCycleDays) {
      newReviewCount = 0;
    } else {
      newReviewCount = (word.reviewCount || 0) + 1;
    }
    
    onStatusChange?.(word.id, newStatus, newReviewCount);
    setShowStatusMenu(false);
  };

  const handleEdit = () => {
    onEdit?.(word);
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (confirm('确定要删除这个单词吗？')) {
      onDelete(word.id);
    }
    setShowMenu(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.no-toggle')) {
      return;
    }
    e.stopPropagation();
    onToggleMeaning?.(word.id);
  };

  const renderMeaning = () => {
    const filteredMeaning = filterMeaning(word.meaning);
    const lines = filteredMeaning.split('\n').filter(line => line.trim());
    return lines.map((line, lineIndex) => {
      const match = line.match(/^([nvadjadvprepconjpronnumintjvt\.]+)\s+(.*)/);
      if (match) {
        return (
          <div key={lineIndex} className={lineIndex > 0 ? 'mt-1' : ''}>
            <span
              style={{ fontFamily: '"Times New Roman", Times, serif', fontStyle: 'italic', fontWeight: 'bold' }}
              className="text-blue-600"
            >
              {match[1]}
            </span>
            <span className="text-gray-700 ml-1">{match[2]}</span>
          </div>
        );
      }
      return (
        <div key={lineIndex} className={lineIndex > 0 ? 'mt-1' : ''}>
          <span className="text-gray-700">{line}</span>
        </div>
      );
    });
  };

  return (
    <div className="relative">
      {word.source_type === 'reading' && (
        <div className="absolute -top-2 -right-2 z-10 px-2 py-0.5 bg-accent-500 text-white text-xs rounded-full font-medium shadow-md">
          阅读词汇
        </div>
      )}
      <div className={`w-full h-[280px] bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow flex flex-col cursor-pointer ${isHighlighted ? 'highlight-card' : 'border-gray-100'}`} onClick={handleCardClick}>
        <div className="flex-1">
          <h3 className="text-xl font-display font-bold text-primary-950">
            {word.word}
          </h3>
          {word.phonetic && (
            <p className="text-gray-500 text-sm mt-1">{word.phonetic}</p>
          )}

          {isMeaningVisible && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              {renderMeaning()}
              {word.example && (
                <p className="mt-2 text-sm text-gray-500 italic">"{word.example}"</p>
              )}
            </div>
          )}

          {showSource && word.source_title && (
            <div className="mt-3 text-xs text-gray-400 flex items-center gap-1 whitespace-nowrap">
              <span className="text-accent-500 font-medium flex-shrink-0">来源：</span>
              <span className="truncate">{word.source_title}</span>
            </div>
          )}

          {(word.is_polysemous === 1 || word.is_similar === 1) && (
            <div className="mt-3 flex gap-1 flex-wrap">
              {word.is_polysemous === 1 && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                  一词多义
                </span>
              )}
              {word.is_similar === 1 && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                  长得相似
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between no-toggle">
          <div className="relative">
            <button
              onClick={handleStatusClick}
              className="lq-status"
              data-status={word.status}
              title="点击切换状态"
              aria-label="点击切换状态"
            >
              {getStatusLabel(word.status)}
            </button>
            {showStatusMenu && (
              <div className="lq-menu lq-menu--row absolute left-0 bottom-full mb-2 no-toggle">
                {([
                  { key: 'new', label: '新词', color: '#0a84ff' },
                  { key: 'learning', label: '学习中', color: '#ffb300' },
                  { key: 'mastered', label: '已掌握', color: '#34c759' },
                ] as const).map((s) => (
                  <button
                    key={s.key}
                    onClick={(e) => handleStatusChange(e, s.key)}
                    className="lq-menu-item"
                    aria-current={word.status === s.key}
                    title={s.label}
                  >
                    <span className="lq-menu-dot" style={{ background: s.color }} />
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 no-toggle">
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>
              复习 {getReviewCountDisplay()} 次
            </span>
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); setShowStatusMenu(false); }}
                className="lq-icon-btn no-toggle"
                title="更多操作"
                aria-label="更多操作"
              >
                <MoreVertical size={16} />
              </button>
              {showMenu && (
                <div
                  className="lq-menu lq-menu--col absolute right-0 bottom-full mb-2 no-toggle"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button onClick={handleEdit} className="lq-menu-item" title="修改">
                    <Pencil size={14} />
                    <span>修改</span>
                  </button>
                  <div className="lq-menu-divider" />
                  <button onClick={handleDelete} className="lq-menu-item lq-menu-item--danger" title="删除">
                    <Trash2 size={14} />
                    <span>删除</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}