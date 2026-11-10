import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Camera, Mail, Shield, Save, ArrowLeft, BookOpen, Headphones, FileText, Target } from 'lucide-react';
import { Button } from '../components/Button';
import { Card, CardContent } from '../components/Card';
import { useStore } from '../store';

import { apiFetch, mediaUrl } from '../lib/api';

export function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, loadCurrentUser, updateUser } = useStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  
  const [dailyWordGoal, setDailyWordGoal] = useState<number>(20);
  const [dailyListeningGoal, setDailyListeningGoal] = useState<number>(30);
  const [dailyReadingGoal, setDailyReadingGoal] = useState<number>(3);
  const [goalMessage, setGoalMessage] = useState('');

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || '');
      setEmail(currentUser.email || '');
      setAvatar(currentUser.avatar || null);
      setDailyWordGoal(currentUser.dailyWordGoal || 20);
      setDailyListeningGoal(currentUser.dailyListeningGoal || 30);
      setDailyReadingGoal(currentUser.dailyReadingGoal || 3);
    }
  }, [currentUser]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      try {
        const formData = new FormData();
        formData.append('avatar', file);
        
        const response = await apiFetch(`/users/${currentUser.id}/avatar`, {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.user) {
            setAvatar(result.user.avatar);
            await loadCurrentUser();
            setMessage('头像上传成功');
            setMessageType('success');
          }
        } else {
          setMessage('头像上传失败');
          setMessageType('error');
        }
      } catch (error) {
        setMessage('头像上传失败，请重试');
        setMessageType('error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password && password !== confirmPassword) {
      setMessage('两次输入的密码不一致');
      setMessageType('error');
      return;
    }

    try {
      const data: Record<string, string | number> = {};
      if (username) data.username = username;
      if (email) data.email = email;
      if (password) data.password = password;

      await updateUser(data);
      setMessage('修改成功');
      setMessageType('success');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setMessage('修改失败，请重试');
      setMessageType('error');
    }
  };

  const handleSaveGoals = async () => {
    if (!currentUser) return;
    
    try {
      await updateUser({
        dailyWordGoal,
        dailyListeningGoal,
        dailyReadingGoal,
      });
      setGoalMessage('学习目标已更新');
      setTimeout(() => setGoalMessage(''), 3000);
    } catch (error) {
      setGoalMessage('保存失败，请重试');
      setTimeout(() => setGoalMessage(''), 3000);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">加载中...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">设置</h1>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Target size={20} className="text-blue-500" />
            学习目标设置
          </h2>
          
          {goalMessage && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 text-green-600 text-center">
              {goalMessage}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">每日单词目标</label>
              <div className="relative">
                <BookOpen size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={dailyWordGoal}
                    onChange={(e) => setDailyWordGoal(Number(e.target.value))}
                    className="flex-1 pl-12 pr-4 py-3 rounded-xl bg-white/60 border border-gray-200 focus:border-blue-500 outline-none transition-all"
                    placeholder="请输入每日单词数量"
                  />
                  <span className="text-gray-500">个</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">每日听力目标</label>
              <div className="relative">
                <Headphones size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={dailyListeningGoal}
                    onChange={(e) => setDailyListeningGoal(Number(e.target.value))}
                    className="flex-1 pl-12 pr-4 py-3 rounded-xl bg-white/60 border border-gray-200 focus:border-blue-500 outline-none transition-all"
                    placeholder="请输入每日听力分钟数"
                  />
                  <span className="text-gray-500">分钟</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">每日阅读目标</label>
              <div className="relative">
                <FileText size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={dailyReadingGoal}
                    onChange={(e) => setDailyReadingGoal(Number(e.target.value))}
                    className="flex-1 pl-12 pr-4 py-3 rounded-xl bg-white/60 border border-gray-200 focus:border-blue-500 outline-none transition-all"
                    placeholder="请输入每日阅读篇数"
                  />
                  <span className="text-gray-500">篇</span>
                </div>
              </div>
            </div>

            <Button onClick={handleSaveGoals} className="w-full">
              <Save size={18} className="mr-2" />
              保存学习目标
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <User size={20} className="text-blue-500" />
            个人信息设置
          </h2>

          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-lg">
                {avatar ? (
                  <img src={mediaUrl(avatar)} alt="头像" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User size={40} />
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors shadow-md">
                <Camera size={16} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="mt-4 text-gray-500 text-sm">点击相机图标更换头像</p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-xl text-center ${
              messageType === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/60 border border-gray-200 focus:border-blue-500 outline-none transition-all"
                  placeholder="请输入用户名"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/60 border border-gray-200 focus:border-blue-500 outline-none transition-all"
                  placeholder="请输入邮箱"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">新密码</label>
              <div className="relative">
                <Shield size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/60 border border-gray-200 focus:border-blue-500 outline-none transition-all"
                  placeholder="请输入新密码（不填则不修改）"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">确认密码</label>
              <div className="relative">
                <Shield size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/60 border border-gray-200 focus:border-blue-500 outline-none transition-all"
                  placeholder="请再次输入密码"
                />
              </div>
            </div>

            <Button type="submit" onClick={(e?: React.FormEvent) => handleSubmit(e!)} className="w-full">
              <Save size={18} className="mr-2" />
              保存修改
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
