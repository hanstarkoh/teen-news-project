'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [article, setArticle] = useState<any>(null);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('byNewsAdmin') === 'true') setIsAdmin(true);

    if (!id) return;
    const fetchData = async () => {
      const { data: artData } = await supabase.from('articles').select('*').eq('id', id).single();
      if (artData) {
        setArticle(artData);
        setEditTitle(artData.title);
        setEditSummary(artData.summary);
        setEditImageUrl(artData.thumbnail_url || '');
      }

      const { data: adData } = await supabase.from('articles').select('*').eq('source_type', 'ad').order('published_at', { ascending: false });
      if (adData) setAds(adData);

      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleDeleteAd = async (adId: number) => {
    if (window.confirm('이 광고를 삭제하시겠습니까?')) {
      await supabase.from('articles').delete().eq('id', adId);
      setAds(ads.filter(a => a.id !== adId));
    }
  };

  const handleDelete = async () => {
    if (window.confirm('정말 이 기사를 완전히 삭제하시겠습니까?')) {
      await supabase.from('articles').delete().eq('id', id);
      router.push('/');
    }
  };

  const handleUpdate = async () => {
    const { error } = await supabase.from('articles').update({ title: editTitle, summary: editSummary, thumbnail_url: editImageUrl }).eq('id', id);
    if (!error) {
      alert('기사가 성공적으로 수정되었습니다! ✨');
      setArticle({ ...article, title: editTitle, summary: editSummary, thumbnail_url: editImageUrl });
      setIsEditing(false);
    }
  };

  if (loading) return <div className="p-20 text-center text-xl">기사를 불러오는 중입니다... 🌊</div>;
  if (!article) return <div className="p-20 text-center text-red-500 text-xl">기사를 찾을 수 없습니다.</div>;

  const defaultImage = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <nav className="bg-blue-700 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* ⭐️ 기사 세부 페이지에도 '부산 청소년의 새로운 소식' 슬로건 추가! */}
          <div className="flex flex-col">
            <a href="/" className="text-2xl font-black tracking-tighter">🌊 BY NEWS</a>
            <span className="text-[10px] md:text-xs font-bold text-blue-200">부산 청소년의 새로운 소식</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto mt-10 p-6 flex flex-col md:flex-row gap-10">
        <div className="flex-1 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          {isAdmin && article.source_type === 'manual' && (
            <div className="mb-8 flex justify-end gap-3 bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <span className="mr-auto font-bold text-blue-700 my-auto">🛠️ 기사 관리 모드</span>
              {!isEditing ? (
                <>
                  <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl">수정</button>
                  <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white font-bold rounded-xl">삭제</button>
                </>
              ) : (
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-400 text-white font-bold rounded-xl">취소</button>
              )}
            </div>
          )}

          {isEditing ? (
            <div className="space-y-4">
              <input className="w-full p-4 border rounded-xl bg-gray-50 text-2xl font-bold" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              <input className="w-full p-4 border rounded-xl bg-gray-50" value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} />
              <textarea className="w-full p-4 border rounded-xl bg-gray-50 h-96" value={editSummary} onChange={(e) => setEditSummary(e.target.value)} />
              <button onClick={handleUpdate} className="w-full bg-blue-700 text-white font-bold py-4 rounded-xl">저장하기</button>
            </div>
          ) : (
            <>
              <header className="mb-8 border-b border-gray-100 pb-8">
                <div className={`inline-block font-bold px-4 py-1 rounded-full text-xs mb-4 ${article.source_type === 'manual' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-700'}`}>
                  {article.source_type === 'manual' ? '단독 보도' : '타 언론사 기사'}
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight mb-6">{article.title}</h1>
                <div className="text-gray-400 font-medium">입력: {new Date(article.published_at).toLocaleString('ko-KR')}</div>
              </header>

              <div className="mb-10 rounded-3xl overflow-hidden shadow-md">
                <img src={article.thumbnail_url || defaultImage} alt="본문 이미지" className="w-full h-auto"/>
              </div>
              <article className="text-gray-800 text-xl leading-relaxed whitespace-pre-wrap break-words font-medium">{article.summary}</article>
            </>
          )}
        </div>

        <aside className="w-full md:w-80 space-y-8">
          <div className="sticky top-24 space-y-6">
            <h3 className="font-bold text-gray-400 text-sm flex items-center gap-2"><span className="w-full h-px bg-gray-300"></span> AD <span className="w-full h-px bg-gray-300"></span></h3>
            <div className="flex flex-col gap-6">
              {ads.map((ad) => (
                <div key={ad.id} className="group relative">
                  <a href={ad.original_link} target="_blank" rel="noopener noreferrer" className="block relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-200 bg-white aspect-[3/4]">
                    <img src={ad.thumbnail_url} alt="광고" className="w-full h-full object-cover"/>
                    <div className="absolute top-0 right-0 bg-black bg-opacity-50 text-white text-[10px] px-1 m-1 rounded">AD</div>
                  </a>
                  {isAdmin && (
                    <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => router.push(`/ad?id=${ad.id}`)} className="bg-blue-600 text-white p-2 rounded-full shadow-lg text-xs font-bold">수정</button>
                      <button onClick={() => handleDeleteAd(ad.id)} className="bg-red-600 text-white p-2 rounded-full shadow-lg text-xs font-bold">삭제</button>
                    </div>
                  )}
                </div>
              ))}
              {Array.from({ length: Math.max(0, 3 - ads.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-gray-200 aspect-[3/4] rounded-2xl flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
                  <span className="text-xl mb-1">📢</span><span className="font-bold text-xs text-center">광고 문의<br/>BY NEWS</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}