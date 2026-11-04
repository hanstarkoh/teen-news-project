'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // 편집장님이 지정하신 바로 그 비밀번호
    if (password === '1q2w3e4r*!') {
      localStorage.setItem('byNewsAdmin', 'true');
      alert('편집장님, 환영합니다.');
      router.push('/');
    } else {
      alert('비밀번호가 틀렸습니다. 다시 확인해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 text-gray-900">
      <div className="bg-white p-8 w-full max-w-md border border-gray-900">
        <h1 className="font-serif text-2xl font-black text-center mb-6 tracking-tight border-b border-gray-900 pb-4">
          편집장 전용 로그인
        </h1>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">편집장 비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 bg-white focus:ring-1 focus:ring-gray-900 outline-none transition-all text-sm"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 font-black text-white transition-all text-sm mt-4 bg-gray-900 hover:bg-black"
          >
            편집장 모드 진입하기
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
