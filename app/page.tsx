'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [articles, setArticles] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkLogin = () => {
      if (typeof window !== 'undefined' && localStorage.getItem('byNewsAdmin') === 'true') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    };

    checkLogin();
    fetchData();

    window.addEventListener('storage', checkLogin);
    return () => window.removeEventListener('storage', checkLogin);
  }, []);

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('published_at', { ascending: false });

    if (data) {
      setArticles(data.filter(item => item.source_type !== 'ad'));
      setAds(data.filter(item => item.source_type === 'ad'));
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('byNewsAdmin');
    setIsAdmin(false);
    alert('로그아웃 되었습니다.');
    window.location.reload();
  };

  // ⭐️ 1. 관리자 전용 광고 삭제 기능
  const handleDeleteAd = async (id: number) => {
    if (window.confirm('정말로 이 광고를 삭제하시겠습니까?')) {
      const { error } = await supabase.from('articles').delete().eq('id', id);
      if (error) alert('삭제 실패 ㅜㅜ');
      else {
        alert('광고가 삭제되었습니다. 🗑️');
        fetchData(); // 새로고침 없이 즉시 화면 업데이트
      }
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchSearch = article.title.includes(searchTerm) || article.summary.includes(searchTerm);
    const matchFilter = filter === 'all' || article.source_type === filter;
    return matchSearch && matchFilter;
  });

  const defaultImage = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      
      {/* ===================== 상단 네비게이션 바 ===================== */}
      <nav className="bg-blue-700 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <a href="/" className="text-2xl font-black tracking-widest">🌊 BY NEWS</a>
          
          <div className="flex items-center gap-4">
            {isAdmin ? (
              <>
                <a href="/write" className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-red-600 transition">✍️ 기사 쓰기</a>
                <a href="/ad" className="bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-indigo-600 transition">💸 광고 추가</a>
                <button onClick={handleLogout} className="bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition">로그아웃</button>
              </>
            ) : (
              <a href="/write" className="bg-white text-blue-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition">편집장 로그인</a>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto mt-8 p-4 flex flex-col md:flex-row gap-6">
        
        {/* ===================== 1단: 왼쪽 메뉴 ===================== */}
        <aside className="w-full md:w-1/4 space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 text-lg">🔍 기사 검색</h3>
            <input 
              type="text" 
              placeholder="검색어를 입력하세요..." 
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 text-lg">📂 카테고리</h3>
            <div className="flex flex-col space-y-2">
              <button onClick={() => setFilter('all')} className={`p-3 rounded-xl text-left font-bold transition ${filter === 'all' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>🌐 전체 기사 보기</button>
              <button onClick={() => setFilter('manual')} className={`p-3 rounded-xl text-left font-bold transition ${filter === 'manual' ? 'bg-red-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>🔥 BY NEWS 단독보도</button>
              <button onClick={() => setFilter('scraped')} className={`p-3 rounded-xl text-left font-bold transition ${filter === 'scraped' ? 'bg-green-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>🤖 스크랩 (구글 뉴스)</button>
            </div>
          </div>
        </aside>

        {/* ===================== 2단: 가운데 기사 목록 ===================== */}
        <section className="w-full md:w-2/4">
          <div className="flex justify-between items-end mb-6 border-b-4 border-blue-700 pb-2">
            <h2 className="text-2xl font-extrabold text-gray-900">
              {filter === 'all' ? '최신 뉴스' : filter === 'manual' ? '단독 보도 뉴스' : '스크랩 뉴스'}
            </h2>
            <span className="text-gray-500 font-bold text-sm">{filteredArticles.length}개의 기사</span>
          </div>

          {loading ? (
            <div className="text-center py-20 font-bold text-gray-500">뉴스를 불러오는 중입니다... 🌊</div>
          ) : (
            <div className="space-y-6">
              {filteredArticles.length === 0 ? (
                <div className="text-center bg-white p-10 rounded-2xl border border-gray-200 text-gray-500">조건에 맞는 기사가 없습니다.</div>
              ) : (
                filteredArticles.map((article) => (
                  <a key={article.id} href={article.source_type === 'manual' ? `/article/${article.id}` : (article.original_link || '#')} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row overflow-hidden border border-gray-100 group">
                    <div className="w-full sm:w-1/3 h-48 sm:h-auto relative overflow-hidden">
                      <img src={article.thumbnail_url || defaultImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="기사 썸네일"/>
                      <div className={`absolute top-2 left-2 text-white text-xs font-bold px-2 py-1 rounded ${article.source_type === 'manual' ? 'bg-red-500' : 'bg-gray-800'}`}>
                        {article.source_type === 'manual' ? '단독' : '스크랩'}
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">{article.title}</h3>
                        <p className="text-gray-600 text-sm line-clamp-2">{article.summary}</p>
                      </div>
                      <div className="text-xs text-gray-400 mt-4 font-medium">
                        {new Date(article.published_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </a>
                ))
              )}
            </div>
          )}
        </section>

        {/* ===================== 3단: 오른쪽 배너 광고 ===================== */}
        <aside className="w-full md:w-1/4 space-y-6">
          <h3 className="font-bold text-gray-400 text-sm flex items-center gap-2">
            <span className="w-full h-px bg-gray-300"></span> AD <span className="w-full h-px bg-gray-300"></span>
          </h3>

          <div className="flex flex-col gap-6">
            {/* ⭐️ 2. 3:4 비율이 적용된 실제 광고들 */}
            {ads.map((ad) => (
              <div key={ad.id} className="group relative">
                <a href={ad.original_link} target="_blank" rel="noopener noreferrer" 
                   className="block relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-200 bg-white aspect-[3/4]">
                  <img src={ad.thumbnail_url} alt="배너 광고" className="w-full h-full object-cover"/>
                  <div className="absolute top-0 right-0 bg-black bg-opacity-50 text-white text-[10px] px-1 m-1 rounded">AD</div>
                </a>
                
                {/* ⭐️ 3. 편집장 전용 수정/삭제 버튼 (마우스를 올리면 짠! 나타남) */}
                {isAdmin && (
                  <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => router.push(`/ad?id=${ad.id}`)}
                      className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 text-xs font-bold"
                    >
                      수정
                    </button>
                    <button 
                      onClick={() => handleDeleteAd(ad.id)}
                      className="bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 text-xs font-bold"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* ⭐️ 4. 광고가 3개 미만일 때 빈칸을 채워주는 점선 박스 (마찬가지로 3:4 비율) */}
            {Array.from({ length: Math.max(0, 3 - ads.length) }).map((_, i) => (
              <div key={`empty-ad-${i}`} 
                   className="bg-gray-100 aspect-[3/4] rounded-2xl flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
                <span className="text-2xl mb-1">📢</span>
                <span className="font-bold text-sm text-center">광고 문의<br/>BY NEWS</span>
              </div>
            ))}
          </div>
        </aside>

      </main>
    </div>
  );
}