export function generateId(): string {
  return crypto.randomUUID();
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function parseTimestamp(timestamp: string): number {
  const match = timestamp.match(/^(\d+):(\d{2})$/);
  if (match) {
    const mins = parseInt(match[1], 10);
    const secs = parseInt(match[2], 10);
    return mins * 60 + secs;
  }
  return 0;
}

export function getDifficultyLabel(difficulty: 'easy' | 'medium' | 'hard'): string {
  const labels = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };
  return labels[difficulty];
}

export function getDifficultyColor(difficulty: 'easy' | 'medium' | 'hard'): string {
  const colors = {
    easy: 'text-green-600 bg-green-100',
    medium: 'text-yellow-600 bg-yellow-100',
    hard: 'text-red-600 bg-red-100',
  };
  return colors[difficulty];
}

export function getStatusLabel(status: 'new' | 'learning' | 'mastered'): string {
  const labels = {
    new: '新词',
    learning: '学习中',
    mastered: '已掌握',
  };
  return labels[status];
}

export function getStatusColor(status: 'new' | 'learning' | 'mastered'): string {
  const colors = {
    new: 'text-blue-600 bg-blue-100',
    learning: 'text-yellow-600 bg-yellow-100',
    mastered: 'text-green-600 bg-green-100',
  };
  return colors[status];
}

export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getMonthData(year: number, month: number): Date[] {
  const days: Date[] = [];
  const daysInMonth = getDaysInMonth(year, month);
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  return days;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
