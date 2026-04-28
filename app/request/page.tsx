'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function RequestPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('로그인한 기자만 제보할 수 있습니다.');
      router.push('/login');
      return;
    }
    setSubmitting(true);

    const { error } = await supabase.from('requests').insert([
      { title, content, image_url: imageUrl, user_id: user.id, author: user.user_metadata.nickname } 
    ]);

    if (error) alert('전송 실패');
    else {
      alert('제보가 완료되었습니다! 채택 시 포인트와 배지를 드립니다. ✨');
      router.push('/');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-blue-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-blue-100">
        <h1 className="text-3xl font-black text-blue-800 mb-2">📢 기사 제보 (기자단 전용)</h1>
        {!user && <p className="text-red-500 font-bold mb-4">로그인이 필요합니다!</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <input className="w-full p-4 border rounded-xl bg-gray-50 text-gray-900" placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <input className="w-full p-4 border rounded-xl bg-gray-50 text-gray-900" placeholder="이미지 주소" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          <textarea className="w-full p-4 border rounded-xl bg-gray-50 h-64 text-gray-900" placeholder="내용" value={content} onChange={(e) => setContent(e.target.value)} required />
          <button type="submit" disabled={submitting} className="w-full bg-blue-700 text-white p-4 rounded-xl font-bold shadow-lg">
            {submitting ? '⏳ 전송 중' : '뉴스 제보 보내기'}
          </button>
        </form>
      </div>
    </div>
  );
}