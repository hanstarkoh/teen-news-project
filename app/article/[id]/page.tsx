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

  // ⭐️ 좋아요 상태 추가
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

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

      if (typeof window !== 'undefined') {
        const likedArticles: number[] = JSON.parse(localStorage.getItem('likedArticles') || '[]');
        setLiked(likedArticles.includes(Number(id)));
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

  // ⭐️ 좋아요 토글 함수 (누구나 클릭 가능, 브라우저당 1회)
  const handleLike = async () => {
    if (likeLoading || !article) return;
    setLikeLoading(true);

    const likedArticles: number[] = JSON.parse(localStorage.getItem('likedArticles') || '[]');
    const nextLiked = !liked;
    const nextCount = (article.likes || 0) + (nextLiked ? 1 : -1);

    const { error } = await supabase.from('articles').update({ likes: nextCount }).eq('id', id);
    if (!error) {
      setArticle({ ...article, likes: nextCount });
      setLiked(nextLiked);
      const updatedLikedArticles = nextLiked
        ? [...likedArticles, Number(id)]
        : likedArticles.filter(likedId => likedId !== Number(id));
      localStorage.setItem('likedArticles', JSON.stringify(updatedLikedArticles));
    } else {
      alert('좋아요 처리에 실패했습니다.');
    }
    setLikeLoading(false);
  };

  const handleUpdate = async () => {
    const { error } = await supabase.from('articles').update({ title: editTitle, summary: editSummary, thumbnail_url: editImageUrl }).eq('id', id);
    if (!error) {
      alert('기사가 성공적으로 수정되었습니다! ✨');
      setArticle({ ...article, title: editTitle, summary: editSummary, thumbnail_url: editImageUrl });
      setIsEditing(false);
    }
  };

  if (loading) return <div className="p-20 text-center text-xl font-bold text-gray-500">기사를 불러오는 중입니다... 🌊</div>;
  if (!article) return <div className="p-20 text-center text-red-500 text-xl font-bold">기사를 찾을 수 없습니다.</div>;

  const defaultImage = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="border-b border-gray-900 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="font-serif text-2xl md:text-3xl font-black tracking-tight text-gray-900">BY NEWS</a>
          <button onClick={() => router.push('/')} className="text-sm font-bold text-gray-500 hover:text-gray-900 transition">홈으로</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto mt-10 px-6 flex flex-col md:flex-row gap-10">
        <div className="flex-1 max-w-3xl">
          {isAdmin && article.source_type === 'manual' && (
            <div className="mb-8 flex justify-end gap-3 bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <span className="mr-auto font-bold text-blue-700 my-auto">🛠️ 기사 관리 모드</span>
              {!isEditing ? (
                <>
                  <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700">수정</button>
                  <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white font-bold rounded-xl shadow hover:bg-red-600">삭제</button>
                </>
              ) : (
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-400 text-white font-bold rounded-xl shadow">취소</button>
              )}
            </div>
          )}

          {isEditing ? (
            <div className="space-y-4">
              <input className="w-full p-4 border rounded-xl bg-gray-50 text-2xl font-bold text-gray-900" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              <input className="w-full p-4 border rounded-xl bg-gray-50 text-gray-900" value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} />
              <textarea className="w-full p-4 border rounded-xl bg-gray-50 h-96 text-gray-900" value={editSummary} onChange={(e) => setEditSummary(e.target.value)} />
              <button onClick={handleUpdate} className="w-full bg-blue-700 text-white font-bold py-4 rounded-xl shadow hover:bg-blue-800">저장하기</button>
            </div>
          ) : (
            <>
              <header className="mb-6">
                <span className={`inline-block font-bold text-xs px-2 py-1 mb-4 ${article.source_type === 'manual' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'}`}>
                  {article.source_type === 'manual' ? '단독 보도' : '타 언론사 기사'}
                </span>
                <h1 className="font-serif text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-5">{article.title}</h1>
                <div className="flex items-center justify-between border-y border-gray-200 py-3">
                  <div className="text-gray-500 text-sm">
                    <span className="font-bold text-gray-700">부산청소년뉴스</span>
                    <span className="mx-2 text-gray-300">|</span>
                    <span>입력 {new Date(article.published_at).toLocaleString('ko-KR')}</span>
                  </div>
                  <button
                    onClick={handleLike}
                    disabled={likeLoading}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-sm border transition-colors ${liked ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-500 border-gray-300 hover:border-red-300 hover:text-red-500'}`}
                  >
                    <span>{liked ? '❤️' : '🤍'}</span>
                    <span>{article.likes || 0}</span>
                  </button>
                </div>
              </header>

              <div className="mb-8">
                <img src={article.thumbnail_url || defaultImage} alt="본문 이미지" className="w-full h-auto object-cover"/>
              </div>

              <article className="text-gray-800 text-lg leading-loose whitespace-pre-wrap break-words">
                {article.summary}
              </article>

              {article.original_link && (
                <a
                  href={article.original_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-10 flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-gray-200 px-6 py-4 transition-colors group"
                >
                  <span className="font-bold text-gray-600 group-hover:text-gray-900">📷 원본 사진/게시물 더 보러가기</span>
                  <span className="text-gray-400 group-hover:text-gray-900">↗</span>
                </a>
              )}
            </>
          )}
        </div>

        <aside className="w-full md:w-80 space-y-8">
          <div className="sticky top-24 space-y-6">
            <h3 className="font-serif font-bold text-gray-900 text-sm border-b-2 border-gray-900 pb-2">광고</h3>
            <div className="flex flex-col gap-6">
              {ads.map((ad) => (
                <div key={ad.id} className="group relative">
                  <a href={ad.original_link} target="_blank" rel="noopener noreferrer" className="block relative overflow-hidden border border-gray-200 bg-white aspect-[3/4]">
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
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}