'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // ⭐️ 편집장님이 지정하신 바로 그 비밀번호!
    if (password === '1q2w3e4r*!') {
      localStorage.setItem('byNewsAdmin', 'true');
      alert('편집장님, 환영합니다! 👑');
      router.push('/');
    } else {
      alert('❌ 비밀번호가 틀렸습니다. 다시 확인해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4 text-gray-900">
      <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-md border border-blue-100">
        <h1 className="text-2xl font-black text-center mb-6 tracking-tight">
          👑 편집장 전용 로그인
        </h1>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">편집장 비밀번호</label>
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
            className="w-full py-4 rounded-2xl font-black text-white shadow-md transition-all text-lg mt-4 bg-red-500 hover:bg-red-600"
          >
            편집장 모드 진입하기 🚀
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
