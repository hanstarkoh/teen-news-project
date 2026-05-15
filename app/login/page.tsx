'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginMode, setLoginMode] = useState<'reporter' | 'admin'>('reporter');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // 👑 편집장(관리자) 로그인 모드일 때
    if (loginMode === 'admin') {
      // ⭐️ 편집장님이 지정하신 바로 그 비밀번호!
      if (password === '1q2w3e4r*!') {
        localStorage.setItem('byNewsAdmin', 'true');
        alert('편집장님, 환영합니다! 👑');
        router.push('/');
      } else {
        alert('❌ 비밀번호가 틀렸습니다. 다시 확인해주세요.');
      }
    } 
    // ✍️ 일반 기자단 로그인 모드일 때
    else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert('로그인 실패: ' + error.message);
      } else {
        alert('🎉 기자단 로그인 성공!');
        router.push('/');
      }
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4 text-gray-900">
      <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-md border border-blue-100">
        <h1 className="text-2xl font-black text-center mb-6 tracking-tight">
          {loginMode === 'admin' ? '👑 편집장 전용 로그인' : '🔑 기자단 로그인'}
        </h1>

        {/* 탭 버튼 */}
        <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-2xl">
          <button 
            onClick={() => setLoginMode('reporter')} 
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${loginMode === 'reporter' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            일반 기자단
          </button>
          <button 
            onClick={() => setLoginMode('admin')} 
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${loginMode === 'admin' ? 'bg-red-50 text-red-600 shadow-sm border border-red-100' : 'text-gray-500 hover:text-gray-700'}`}
          >
            편집장 (관리자)
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {loginMode === 'reporter' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">이메일</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" 
                placeholder="reporter@busanyouth.kr"
                required 
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
              {loginMode === 'admin' ? '편집장 비밀번호' : '비밀번호'}
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" 
              placeholder="비밀번호를 입력하세요"
              required 
            />
          </div>

          <button 
            type="submit" 
            className={`w-full py-4 rounded-2xl font-black text-white shadow-md transition-all text-lg mt-4 ${loginMode === 'admin' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loginMode === 'admin' ? '편집장 모드 진입하기 🚀' : '로그인하기'}
          </button>
        </form>

        <div className="mt-8 text-center">
           <button onClick={() => router.push('/')} className="text-gray-400 font-bold text-sm hover:text-gray-600 underline underline-offset-4">
             ← 메인 화면으로 돌아가기
           </button>
        </div>
      </div>
    </div>
  );
}