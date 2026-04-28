'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email, password, options: { data: { nickname } }
      });
      if (error) alert(error.message);
      else alert('회원가입 성공! 메일함을 확인하거나 로그인을 시도하세요.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else {
        alert('반가워요, 기자님!');
        router.push('/');
      }
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-blue-100">
        <h1 className="text-3xl font-black text-blue-800 mb-6 text-center">
          {isSignUp ? '청소년 기자단 가입' : '기자단 로그인'}
        </h1>
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <input className="w-full p-4 border rounded-2xl bg-gray-50 text-gray-900" placeholder="닉네임" value={nickname} onChange={e => setNickname(e.target.value)} required />
          )}
          <input className="w-full p-4 border rounded-2xl bg-gray-50 text-gray-900" placeholder="이메일" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="w-full p-4 border rounded-2xl bg-gray-50 text-gray-900" placeholder="비밀번호" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="w-full bg-blue-700 text-white p-4 rounded-2xl font-bold text-lg hover:bg-blue-800 transition shadow-lg">
            {isSignUp ? '기자단 등록하기' : '로그인'}
          </button>
        </form>
        <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-4 text-blue-600 font-bold text-sm">
          {isSignUp ? '이미 계정이 있나요? 로그인' : '처음인가요? 기자단 등록하기'}
        </button>
      </div>
    </div>
  );
}