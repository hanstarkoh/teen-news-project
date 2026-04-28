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

  const [isAdmin, setIsAdmin] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkLogin = () => {
      if (typeof window !== 'undefined' && localStorage.getItem('byNewsAdmin') === 'true') setIsAdmin(true);
      else setIsAdmin(false);
    };
    checkLogin();
    fetchData();
    window.addEventListener('storage', checkLogin);
    return () => window.removeEventListener('storage', checkLogin);
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem('byNewsAdmin');
    setIsAdmin(false);
    alert('로그아웃 되었습니다.');
    window.location.reload();
  };

  const handleDeleteAd = async (id: number) => {
    if (window.confirm('정말로 이 광고를 삭제하시겠습니까?')) {
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
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  const defaultImage = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <nav className="bg-blue-700 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start">
            <a href="/" className="text-2xl font-black tracking-tighter">🌊 BY NEWS</a>
            <span className="text-[10px] md:text-xs font-bold text-blue-200">부산 청소년의 새로운 소식</span>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4 flex-wrap justify-center">
            <a href="/bamboo" className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-bold shadow hover:bg-green-600 transition">🎋 대나무숲</a>
            <a href="/request" className="bg-yellow-400 text-blue-900 px-3 py-2 rounded-lg text-sm font-bold shadow hover:bg-yellow-300 transition">📢 기사 제보하기</a>
            
            {isAdmin ? (
              <>
                <button onClick={handleScrape} disabled={isScraping} className={`px-3 py-2 rounded-lg text-sm font-bold shadow transition ${isScraping ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
                  {isScraping ? '⏳ 수집 중...' : '🤖 타 언론사 수집'}
                </button>
                <a href="/admin/requests" className="bg-orange-500 text-white px-3 py-2 rounded-lg text-sm font-bold shadow hover:bg-orange-600 transition">📬 제보 확인</a>
                <a href="/write" className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-bold shadow hover:bg-red-600 transition">✍️ 기사 쓰기</a>
                <a href="/ad" className="bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm font-bold shadow hover:bg-indigo-600 transition">💸 광고 추가</a>
                <button onClick={handleLogout} className="bg-white text-gray-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition">로그아웃</button>
              </>
            ) : (
              <a href="/write" className="text-blue-300 hover:text-white transition-colors text-lg" title="관리자 페이지">🔒</a>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto mt-8 p-4 flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-1/4 space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 text-lg">🔍 기사 검색</h3>
            {/* ⭐️ text-gray-900 추가로 글씨가 선명하게 보입니다 */}
            <input type="text" placeholder="검색어를 입력하세요..." className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 text-lg">📅 기간 검색</h3>
            <div className="flex flex-col space-y-2">
              <input type="date" className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <span className="text-center text-gray-400 text-sm font-bold">~</span>
              <input type="date" className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <button onClick={() => {setStartDate(''); setEndDate('');}} className="mt-2 text-xs text-gray-500 hover:text-blue-600 underline text-right">초기화</button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 text-lg">📂 카테고리</h3>
            <div className="flex flex-col space-y-2">
              <button onClick={() => setFilter('all')} className={`p-3 rounded-xl text-left font-bold transition ${filter === 'all' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>🌐 전체 기사 보기</button>
              <button onClick={() => setFilter('manual')} className={`p-3 rounded-xl text-left font-bold transition ${filter === 'manual' ? 'bg-red-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>🔥 BY NEWS 단독보도</button>
              <button onClick={() => setFilter('scraped')} className={`p-3 rounded-xl text-left font-bold transition ${filter === 'scraped' ? 'bg-green-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>📰 타 언론사 기사</button>
            </div>
          </div>
        </aside>

        <section className="w-full md:w-2/4 flex flex-col">
          {/* 생략 (기존 기사 리스트 로직 그대로 유지) */}
          <div className="flex justify-between items-end mb-6 border-b-4 border-blue-700 pb-2">
            <h2 className="text-2xl font-extrabold text-gray-900">{filter === 'all' ? '최신 뉴스' : filter === 'manual' ? '단독 보도 뉴스' : '타 언론사 주요뉴스'}</h2>
            <span className="text-gray-500 font-bold text-sm">총 {filteredArticles.length}개</span>
          </div>
          {loading ? (
            <div className="text-center py-20 font-bold text-gray-500">뉴스를 불러오는 중입니다... 🌊</div>
          ) : (
            <>
              <div className="space-y-6 flex-1">
                {paginatedArticles.length === 0 ? (
                  <div className="text-center bg-white p-10 rounded-2xl border border-gray-200 text-gray-500 font-bold">조건에 맞는 기사가 없습니다.</div>
                ) : (
                  paginatedArticles.map((article) => (
                    <a key={article.id} href={article.source_type === 'manual' ? `/article/${article.id}` : (article.original_link || '#')} target={article.source_type === 'manual' ? '_self' : '_blank'} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row overflow-hidden border border-gray-100 group">
                      <div className="w-full sm:w-1/3 h-48 sm:h-auto relative overflow-hidden">
                        <img src={article.thumbnail_url || defaultImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="기사 썸네일"/>
                        <div className={`absolute top-2 left-2 text-white text-xs font-bold px-2 py-1 rounded ${article.source_type === 'manual' ? 'bg-red-500' : 'bg-gray-800'}`}>{article.source_type === 'manual' ? '단독' : '타 언론사'}</div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">{article.title}</h3>
                          <p className="text-gray-600 text-sm line-clamp-2">{article.summary}</p>
                        </div>
                        <div className="text-xs text-gray-400 mt-4 font-medium">{new Date(article.published_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                      </div>
                    </a>
                  ))
                )}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`w-10 h-10 rounded-xl font-bold transition-all shadow-sm ${currentPage === page ? 'bg-blue-700 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>{page}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
        
        {/* 생략 (기존 광고 리스트 로직 그대로 유지) */}
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