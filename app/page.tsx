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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const PAGE_GROUP_SIZE = 10;

  const [isAdmin, setIsAdmin] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const checkLogin = () => {
      const admin = typeof window !== 'undefined' && localStorage.getItem('byNewsAdmin') === 'true';
      setIsAdmin(admin);
      if (admin) fetchPendingRequests();
    };
    checkLogin();

    fetchData();
    window.addEventListener('storage', checkLogin);
    return () => window.removeEventListener('storage', checkLogin);
  }, []);

  const fetchPendingRequests = async () => {
    const { count } = await supabase.from('requests').select('id', { count: 'exact', head: true });
    setPendingRequests(count || 0);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter, startDate, endDate]);

  const fetchData = async () => {
    const { data } = await supabase.from('articles').select('*').order('published_at', { ascending: false });
    if (data) {
      setArticles(data.filter(item => item.source_type !== 'ad'));
      setAds(data.filter(item => item.source_type === 'ad'));
    }
    setLoading(false);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('byNewsAdmin');
    setIsAdmin(false);
    alert('편집장 모드 로그아웃 되었습니다.');
    window.location.reload();
  };

  const handleDeleteAd = async (id: number) => {
    if (window.confirm('정말로 이 광고를 삭제하시겠습니까?')) {
      await supabase.from('articles').delete().eq('id', id);
      fetchData();
    }
  };

  const handleDeleteArticle = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('정말로 이 기사를 삭제하시겠습니까?')) {
      await supabase.from('articles').delete().eq('id', id);
      fetchData();
    }
  };

  const handleScrape = async () => {
    setIsScraping(true);
    alert('🤖 로봇 기자가 타 언론사 뉴스를 수집합니다!');
    try {
      const response = await fetch('/api/scrape');
      const result = await response.json();
      if (response.ok) {
        alert(`✅ 수집 완료! 중복을 제외하고 ${result.count}개의 새 기사를 가져왔습니다.`);
        fetchData();
      }
    } catch (error) {
      alert('❌ 실패');
    }
    setIsScraping(false);
  };

  const filteredArticles = articles.filter(article => {
    const matchSearch = article.title.includes(searchTerm) || article.summary.includes(searchTerm);
    const matchFilter = filter === 'all' || article.source_type === filter;
    const articleDate = new Date(article.published_at);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);
    const matchStartDate = start ? articleDate >= start : true;
    const matchEndDate = end ? articleDate <= end : true;
    return matchSearch && matchFilter && matchStartDate && matchEndDate;
  });

  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const paginatedArticles = filteredArticles.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const currentGroup = Math.ceil(currentPage / PAGE_GROUP_SIZE);
  const startPage = (currentGroup - 1) * PAGE_GROUP_SIZE + 1;
  const endPage = Math.min(startPage + PAGE_GROUP_SIZE - 1, totalPages);

  const defaultImage = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop";

  const showHero = currentPage === 1 && !searchTerm && !startDate && !endDate && paginatedArticles.length > 0;
  const heroArticle = paginatedArticles[0];
  const gridArticles = showHero ? paginatedArticles.slice(1) : paginatedArticles;

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* 유틸리티 바 */}
      <div className="bg-gray-900 text-gray-300 text-xs">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex justify-between items-center gap-4">
          <span className="hidden sm:inline whitespace-nowrap">{today}</span>
          <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden">
            <a href="/hotplace" className="hover:text-white transition">핫플 지도</a>
            <a href="/bamboo" className="hover:text-white transition">대나무숲</a>
            <a href="/request" className="hover:text-white transition">기사 제보</a>
            {isAdmin ? (
              <>
                <a href="/admin/desk" className="hover:text-white transition">AI 데스크</a>
                <button onClick={handleScrape} disabled={isScraping} className="hover:text-white transition disabled:text-gray-500">
                  {isScraping ? '수집 중...' : '타 언론사 수집'}
                </button>
                <a href="/admin/requests" className="hover:text-white transition flex items-center gap-1">
                  제보 확인
                  {pendingRequests > 0 && (
                    <span className="bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{pendingRequests > 9 ? '9+' : pendingRequests}</span>
                  )}
                </a>
                <a href="/write" className="hover:text-white transition">기사 쓰기</a>
                <a href="/ad" className="hover:text-white transition">광고 추가</a>
                <button onClick={handleAdminLogout} className="hover:text-white transition">로그아웃</button>
              </>
            ) : (
              <a href="/login" className="hover:text-white transition" title="관리자 페이지">편집장</a>
            )}
          </div>
        </div>
      </div>

      {/* 마스트헤드 */}
      <header className="border-b border-gray-900 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col items-center">
          <a href="/" className="font-serif text-4xl md:text-5xl font-black tracking-tight text-gray-900">BY NEWS</a>
          <span className="text-xs md:text-sm font-bold text-gray-400 tracking-[0.2em] mt-1">부산 청소년의 새로운 소식</span>
        </div>
        <nav className="border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-8 text-sm font-bold">
            <button onClick={() => setFilter('all')} className={`py-3 border-b-2 transition ${filter === 'all' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>전체 기사</button>
            <button onClick={() => setFilter('manual')} className={`py-3 border-b-2 transition ${filter === 'manual' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>단독 보도</button>
            <button onClick={() => setFilter('scraped')} className={`py-3 border-b-2 transition ${filter === 'scraped' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>타 언론사</button>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto mt-8 p-4 flex flex-col md:flex-row gap-6">
        {/* ... (기존 검색, 필터, 리스트 렌더링 코드 동일) ... */}
        <aside className="w-full md:w-1/4 space-y-8">
          <div>
            <h3 className="font-serif font-bold text-gray-900 mb-3 text-sm border-b-2 border-gray-900 pb-2">기사 검색</h3>
            <input type="text" placeholder="검색어를 입력하세요..." className="w-full p-3 border border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none text-gray-900 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div>
            <h3 className="font-serif font-bold text-gray-900 mb-3 text-sm border-b-2 border-gray-900 pb-2">기간 검색</h3>
            <div className="flex flex-col space-y-2">
              <input type="date" className="w-full p-2 border border-gray-300 text-sm outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-900" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <span className="text-center text-gray-400 text-sm font-bold">~</span>
              <input type="date" className="w-full p-2 border border-gray-300 text-sm outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-900" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <button onClick={() => {setStartDate(''); setEndDate('');}} className="mt-2 text-xs text-gray-500 hover:text-gray-900 underline text-right">초기화</button>
            </div>
          </div>
        </aside>

        <section className="w-full md:w-2/4 flex flex-col">
          <div className="flex justify-between items-end mb-6 border-b-4 border-gray-900 pb-2">
            <h2 className="font-serif text-2xl font-black text-gray-900">{filter === 'all' ? '최신 뉴스' : filter === 'manual' ? '단독 보도' : '타 언론사 뉴스'}</h2>
            <span className="text-gray-400 font-bold text-xs">총 {filteredArticles.length}건</span>
          </div>
          {loading ? (
            <div className="text-center py-20 font-bold text-gray-500">뉴스를 불러오는 중입니다... 🌊</div>
          ) : (
            <>
              {paginatedArticles.length === 0 ? (
                <div className="text-center bg-gray-50 p-10 border border-gray-200 text-gray-500 font-bold">조건에 맞는 기사가 없습니다.</div>
              ) : (
                <div className="flex-1">
                  {showHero && (
                    <div className="relative group mb-8 pb-8 border-b border-gray-200">
                      {isAdmin && (
                        <button onClick={(e) => handleDeleteArticle(heroArticle.id, e)} className="absolute top-3 right-3 z-10 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded shadow-md">삭제</button>
                      )}
                      <a href={heroArticle.source_type === 'manual' ? `/article/${heroArticle.id}` : (heroArticle.original_link || '#')} target={heroArticle.source_type === 'manual' ? '_self' : '_blank'} className="block">
                        <div className="relative aspect-[16/9] overflow-hidden mb-4">
                          <img src={heroArticle.thumbnail_url || defaultImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="기사 썸네일"/>
                          <span className={`absolute top-3 left-3 text-white text-xs font-bold px-2 py-1 ${heroArticle.source_type === 'manual' ? 'bg-red-600' : 'bg-gray-900'}`}>{heroArticle.source_type === 'manual' ? '단독' : '타 언론사'}</span>
                        </div>
                        <h3 className="font-serif text-2xl md:text-3xl font-black text-gray-900 leading-snug mb-3 group-hover:underline">{heroArticle.title}</h3>
                        <p className="text-gray-600 leading-relaxed line-clamp-2 mb-3">{heroArticle.summary}</p>
                        <div className="text-xs text-gray-400 font-medium flex items-center gap-3">
                          <span>{new Date(heroArticle.published_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          {heroArticle.source_type === 'manual' && <span>❤️ {heroArticle.likes || 0}</span>}
                        </div>
                      </a>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
                    {gridArticles.map((article) => (
                      <div key={article.id} className="relative group">
                        {isAdmin && (
                          <button
                            onClick={(e) => handleDeleteArticle(article.id, e)}
                            className="absolute top-2 right-2 z-10 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded shadow-md"
                          >
                            삭제
                          </button>
                        )}
                        <a href={article.source_type === 'manual' ? `/article/${article.id}` : (article.original_link || '#')} target={article.source_type === 'manual' ? '_self' : '_blank'} className="block">
                          <div className="relative aspect-[4/3] overflow-hidden mb-3">
                            <img src={article.thumbnail_url || defaultImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="기사 썸네일"/>
                            <span className={`absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 ${article.source_type === 'manual' ? 'bg-red-600' : 'bg-gray-900'}`}>{article.source_type === 'manual' ? '단독' : '타 언론사'}</span>
                          </div>
                          <h3 className="font-serif text-lg font-bold text-gray-900 leading-snug mb-1.5 line-clamp-2 group-hover:underline">{article.title}</h3>
                          <p className="text-gray-500 text-sm line-clamp-2 mb-2">{article.summary}</p>
                          <div className="text-xs text-gray-400 font-medium flex items-center gap-3">
                            <span>{new Date(article.published_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            {article.source_type === 'manual' && <span>❤️ {article.likes || 0}</span>}
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  {startPage > 1 && <button onClick={() => setCurrentPage(startPage - 1)} className="w-9 h-9 font-bold transition-all bg-white text-gray-600 hover:bg-gray-100 border border-gray-300 flex items-center justify-center">◀</button>}
                  {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(page => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`w-9 h-9 font-bold transition-all ${currentPage === page ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'}`}>{page}</button>
                  ))}
                  {endPage < totalPages && <button onClick={() => setCurrentPage(endPage + 1)} className="w-9 h-9 font-bold transition-all bg-white text-gray-600 hover:bg-gray-100 border border-gray-300 flex items-center justify-center">▶</button>}
                </div>
              )}
            </>
          )}
        </section>

        <aside className="w-full md:w-1/4 space-y-6">
          <h3 className="font-bold text-gray-400 text-sm flex items-center gap-2"><span className="w-full h-px bg-gray-300"></span> AD <span className="w-full h-px bg-gray-300"></span></h3>
          <div className="flex flex-col gap-6">
            {ads.map((ad) => (
              <div key={ad.id} className="group relative">
                <a href={ad.original_link} target="_blank" rel="noopener noreferrer" className="block relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-200 bg-white aspect-[3/4]">
                  <img src={ad.thumbnail_url} alt="배너 광고" className="w-full h-full object-cover"/>
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
        </aside>
      </main>
    </div>
  );
}