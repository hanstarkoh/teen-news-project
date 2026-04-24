'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function WritePage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [publishedAt, setPublishedAt] = useState('');
  const router = useRouter();

  useEffect(() => {
    // VIP 출입증 확인
    if (typeof window !== 'undefined' && localStorage.getItem('byNewsAdmin') === 'true') {
      setIsAdmin(true);
    }

    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setPublishedAt(now.toISOString().slice(0, 16));
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1q2w3e4r!!') {
      setIsAdmin(true);
      localStorage.setItem('byNewsAdmin', 'true');
    } else {
      alert('비밀번호가 틀렸습니다! 편집장님만 접근할 수 있어요. 🚨');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('byNewsAdmin');
    setIsAdmin(false);
    alert('로그아웃 되었습니다. 일반 독자 모드로 돌아갑니다.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('articles').insert([{
      title: title,
      summary: summary,
      thumbnail_url: imageUrl,
      source_type: 'manual',
      published_at: new Date(publishedAt).toISOString(),
    }]);

    if (error) {
      alert('저장 실패 ㅜㅜ');
    } else {
      alert('BY NEWS 기사 등록 완료! 🎉');
      router.push('/');
    }
  };

  // ===================== [1. 로그인 화면] =====================
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 relative">
        {/* ⭐️ 비상구: 홈으로 돌아가기 */}
        <button 
          onClick={() => router.push('/')} 
          className="absolute top-8 left-8 text-gray-500 hover:text-blue-600 font-bold transition-colors flex items-center gap-2"
        >
          ← 홈으로 돌아가기
        </button>

        <div className="max-w-sm w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-blue-600 mb-2">🌊 BY NEWS 데스크</h1>
            <p className="text-gray-500 text-sm">관리자 전용 페이지입니다.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600" 
              placeholder="비밀번호를 입력하세요" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
            <button type="submit" className="w-full bg-gray-900 text-white p-4 rounded-xl font-bold hover:bg-black">
              로그인
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ===================== [2. 기사 작성 화면] =====================
  return (
    <div className="max-w-2xl mx-auto p-10">
      {/* ⭐️ 비상구: 홈으로 돌아가기 */}
      <div className="mb-6">
        <button 
          onClick={() => router.push('/')} 
          className="text-gray-500 hover:text-blue-600 font-bold transition-colors flex items-center gap-2"
        >
          ← 홈으로 돌아가기
        </button>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-600">✍️ BY NEWS 기사 발행</h1>
        <button onClick={handleLogout} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-300">
          편집장 로그아웃
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2 font-bold">기사 제목</label>
          <input 
            className="w-full p-3 border rounded-xl" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
          />
        </div>
        
        <div>
          <label className="block mb-2 font-bold text-red-500">발행 일시</label>
          <input 
            type="datetime-local" 
            className="w-full p-3 border rounded-xl bg-red-50" 
            value={publishedAt} 
            onChange={(e) => setPublishedAt(e.target.value)} 
            required 
          />
        </div>

        <div>
          <label className="block mb-2 font-bold">대표 사진 주소 (URL)</label>
          <input 
            className="w-full p-3 border rounded-xl" 
            value={imageUrl} 
            onChange={(e) => setImageUrl(e.target.value)} 
          />
        </div>

        <div>
          <label className="block mb-2 font-bold">기사 내용 (요약)</label>
          <textarea 
            className="w-full p-3 border rounded-xl h-40" 
            value={summary} 
            onChange={(e) => setSummary(e.target.value)} 
            required 
          />
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700">
          기사 발행하기
        </button>
      </form>
    </div>
  );
}