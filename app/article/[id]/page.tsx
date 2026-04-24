'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // ⭐️ 1. 편집장인지 확인하는 상태 추가
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  useEffect(() => {
    // ⭐️ 2. 화면 켜질 때 VIP 출입증 검사
    if (typeof window !== 'undefined' && localStorage.getItem('byNewsAdmin') === 'true') {
      setIsAdmin(true);
    }

    if (!id) return;
    const fetchArticle = async () => {
      const { data, error } = await supabase.from('articles').select('*').eq('id', id).single();
      if (data) {
        setArticle(data);
        setEditTitle(data.title);
        setEditSummary(data.summary);
        setEditImageUrl(data.thumbnail_url || '');
      }
      setLoading(false);
    };
    fetchArticle();
  }, [id]);

  if (loading) return <div className="p-20 text-center text-xl">기사를 불러오는 중입니다... 🌊</div>;
  if (!article) return <div className="p-20 text-center text-red-500 text-xl">기사를 찾을 수 없습니다.</div>;

  const defaultImage = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop";

  const handleDelete = async () => {
    if (window.confirm('정말 이 기사를 완전히 삭제하시겠습니까?')) {
      await supabase.from('articles').delete().eq('id', id);
      alert('기사가 삭제되었습니다. 🗑️');
      router.push('/');
    }
  };

  const handleUpdate = async () => {
    const { error } = await supabase.from('articles').update({
      title: editTitle, summary: editSummary, thumbnail_url: editImageUrl
    }).eq('id', id);

    if (error) alert('수정 실패: ' + error.message);
    else {
      alert('기사가 성공적으로 수정되었습니다! ✨');
      setArticle({ ...article, title: editTitle, summary: editSummary, thumbnail_url: editImageUrl });
      setIsEditing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <nav className="bg-blue-600 text-white p-4 shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <a href="/" className="text-2xl font-black tracking-wider hover:text-blue-200 transition-colors">🌊 BY NEWS</a>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto mt-10 p-6">
        
        {/* ⭐️ 3. 출입증(isAdmin)이 있고, 직접 쓴 기사일 때만 이 메뉴가 보입니다! */}
        {isAdmin && article.source_type === 'manual' && (
          <div className="mb-8 flex justify-end gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <span className="mr-auto font-bold text-blue-600 my-auto">🛠️ 편집장 로그인 중</span>
            {!isEditing ? (
              <>
                <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-100 text-blue-700 font-bold rounded-lg hover:bg-blue-200">수정</button>
                <button onClick={handleDelete} className="px-4 py-2 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200">삭제</button>
              </>
            ) : (
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-300 text-gray-800 font-bold rounded-lg hover:bg-gray-400">수정 취소</button>
            )}
          </div>
        )}

        {isEditing ? (
          <div className="space-y-4 bg-yellow-50 p-6 rounded-xl border border-yellow-200 shadow-inner">
            <h2 className="text-xl font-bold text-yellow-800 mb-4">✏️ 기사 수정 중...</h2>
            <input className="w-full p-3 border rounded-lg text-2xl font-bold" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="제목" />
            <input className="w-full p-3 border rounded-lg" value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} placeholder="새로운 이미지 주소 URL" />
            <textarea className="w-full p-3 border rounded-lg h-60" value={editSummary} onChange={(e) => setEditSummary(e.target.value)} placeholder="기사 내용" />
            <button onClick={handleUpdate} className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg shadow hover:bg-blue-700">수정된 내용 저장하기</button>
          </div>
        ) : (
          <>
            <header className="mb-8 border-b border-gray-200 pb-6">
              <div className="inline-block bg-red-50 text-red-600 font-bold px-3 py-1 rounded-full text-sm mb-4">
                {article.source_type === 'manual' ? '[단독 보도]' : '[스크랩 뉴스]'}
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-6">{article.title}</h1>
              <div className="text-gray-500 text-sm">입력 {new Date(article.published_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            </header>
            <div className="mb-10 rounded-xl overflow-hidden shadow-sm border border-gray-100">
              <img src={article.thumbnail_url || defaultImage} alt="기사 대표 이미지" className="w-full h-auto object-cover max-h-[500px]"/>
            </div>
            <article className="text-gray-800 text-lg leading-loose break-keep">
              {article.summary.split('\n').map((line: string, i: number) => (
                <p key={i} className="mb-6">{line}</p>
              ))}
            </article>
          </>
        )}
      </main>
    </div>
  );
}