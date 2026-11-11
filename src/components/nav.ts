import { BookOpen, Database, FileText, Headphones, Home } from 'lucide-react';

/** 全站主导航：桌面侧栏、平板紧凑侧栏、手机底部标签栏共用 */
export const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/vocabulary', label: '单词本', icon: BookOpen },
  { path: '/listening', label: '听力训练', icon: Headphones },
  { path: '/reading', label: '阅读理解', icon: FileText },
  { path: '/data', label: '我的数据', icon: Database },
];
