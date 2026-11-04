'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function RequestPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [author, setAuthor] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from('requests').insert([
      { title, content, image_url: imageUrl, author: author.trim() || '익명' }
    ]);

    if (error) alert('전송 실패');
    else {
      alert('제보가 완료되었습니다. 편집장님이 검토 후 기사로 게시할 수 있습니다.');
      router.push('/');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white p-8 border border-gray-900">
        <h1 className="font-serif text-3xl font-black text-gray-900 mb-2 border-b border-gray-900 pb-4">기사 제보</h1>
        <p className="text-gray-500 font-bold text-sm mb-6 mt-4">누구나 제보할 수 있습니다. 채택되면 정식 기사로 게시됩니다.</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input className="w-full p-3 border border-gray-300 bg-white text-gray-900 text-sm outline-none focus:ring-1 focus:ring-gray-900" placeholder="이름 또는 닉네임 (선택, 비우면 '익명')" value={author} onChange={(e) => setAuthor(e.target.value)} />
          <input className="w-full p-3 border border-gray-300 bg-white text-gray-900 text-sm outline-none focus:ring-1 focus:ring-gray-900" placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <input className="w-full p-3 border border-gray-300 bg-white text-gray-900 text-sm outline-none focus:ring-1 focus:ring-gray-900" placeholder="이미지 주소" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          <textarea className="w-full p-3 border border-gray-300 bg-white h-64 text-gray-900 text-sm outline-none focus:ring-1 focus:ring-gray-900" placeholder="내용" value={content} onChange={(e) => setContent(e.target.value)} required />
          <button type="submit" disabled={submitting} className="w-full bg-gray-900 text-white p-3 font-bold text-sm hover:bg-black">
            {submitting ? '전송 중' : '뉴스 제보 보내기'}
          </button>
        </form>
      </div>
    </div>
  );
}
