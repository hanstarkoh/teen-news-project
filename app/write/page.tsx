'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';

export default function WritePage() {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [sourceType, setSourceType] = useState('manual');
  const [originalLink, setOriginalLink] = useState('');
  
  const [keywords, setKeywords] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true); // ⭐️ 튕김 방지용 상태 추가!
  const router = useRouter();

  // ⭐️ 보안 요원 교체: 약간의 여유를 두고 편집장님 확인
  useEffect(() => {
    const checkLogin = () => {
      if (typeof window !== 'undefined') {
        const adminStatus = localStorage.getItem('byNewsAdmin');
        if (adminStatus === 'true') {
          setIsAdmin(true);
        } else {
          alert('편집장 권한이 필요합니다!');
          router.push('/');
        }
      }
      setIsChecking(false); // 확인 완료
    };
    
    // 페이지 로딩 후 0.1초 뒤에 확인 (튕김 버그 완벽 방지)
    setTimeout(checkLogin, 100);
  }, [router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1024, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      const fileExt = compressedFile.name.split('.').pop() || 'jpeg';
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `article_images/${fileName}`;

      const { data, error } = await supabase.storage.from('images').upload(filePath, compressedFile);
      if (error) {
        alert('이미지 업로드 실패: ' + error.message);
      } else {
        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
        setThumbnailUrl(publicUrl);
        alert('📸 썸네일 업로드 성공!');
      }
    } catch (error) {
      alert('사진 업로드 중 오류가 발생했습니다.');
    }
    setIsUploading(false);
  };

  const handleGenerateAI = async () => {
    if (!keywords.trim()) { alert('키워드를 먼저 입력해주세요!'); return; }
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-article', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords })
      });
      const data = await response.json();
      if (data.title && data.content) {
        setTitle(data.title); setSummary(data.content);
        alert('✨ 키워드 기반 AI 기사 초안 작성 완료!');
      }
    } catch (err) { alert('AI 서버 오류'); }
    setIsGenerating(false);
  };

  const handleScrapeUrlAndGenerate = async () => {
    if (!targetUrl.trim() || !targetUrl.startsWith('http')) {
      alert('정확한 인터넷 주소(http://...)를 입력해주세요!'); return;
    }
    setIsScrapingUrl(true);
    try {
      const response = await fetch('/api/scrape-url', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl })
      });
      const data = await response.json();
      
      if (response.ok && data.title && data.content) {
        setTitle(data.title); 
        setSummary(data.content);
        setOriginalLink(targetUrl); 
        setSourceType('scraped'); 
        alert('🕷️ 사이트 내용 스크래핑 및 기사 작성 성공!');
      } else {
        alert(`실패: ${data.error || '알 수 없는 오류'}`);
      }
    } catch (err) { alert('서버 통신 오류'); }
    setIsScrapingUrl(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const { error } = await supabase.from('articles').insert([{
      title, summary, thumbnail_url: thumbnailUrl, source_type: sourceType,
      original_link: originalLink, published_at: new Date().toISOString(),
    }]);
    if (error) alert('실패');
    else { alert('🎉 발행 성공!'); router.push('/'); }
  };

  // ⭐️ 신원 확인 중일 때는 하얀 화면 보여주기 (튕김 방지)
  if (isChecking) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">신원 확인 중...</div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-3xl shadow-md border border-gray-100">
        <h1 className="text-3xl font-black text-gray-900 mb-8 border-b pb-4">✍️ BY NEWS 기사 작성</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-indigo-800 mb-2">🤖 키워드로 기사 쓰기</h3>
              <textarea className="w-full p-4 rounded-xl border border-indigo-200 outline-none mb-3 text-sm h-24" placeholder="예: 송상현광장 플리마켓, 호응 좋았음" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
            </div>
            <button onClick={handleGenerateAI} disabled={isGenerating || isScrapingUrl} className="w-full py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow">
              {isGenerating ? '⏳ 작성 중...' : '✨ 초안 생성'}
            </button>
          </div>

          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-emerald-800 mb-2">🕷️ 주소(URL)로 긁어오기</h3>
              <input type="url" className="w-full p-4 rounded-xl border border-emerald-200 outline-none mb-3 text-sm" placeholder="https://..." value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} />
            </div>
            <button onClick={handleScrapeUrlAndGenerate} disabled={isGenerating || isScrapingUrl} className="w-full py-3 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow">
              {isScrapingUrl ? '🕵️‍♂️ 잠입 분석 중...' : '🕸️ 기사 훔쳐오기'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 border-t pt-8">
          <input className="w-full p-4 border rounded-xl font-bold text-lg text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="기사 제목" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <textarea className="w-full p-4 border rounded-xl h-64 leading-relaxed text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="본문 내용" value={summary} onChange={(e) => setSummary(e.target.value)} required />

          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 space-y-4">
            <label className="block text-sm font-bold text-blue-900">📸 대표 사진 등록</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                <p className="text-xs font-bold text-gray-400 mb-2">1. 파일 올리기</p>
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="text-xs w-full text-gray-700 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white cursor-pointer"/>
                {isUploading && <p className="text-[10px] text-blue-600 mt-1">업로드 중...</p>}
              </div>
              <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                <p className="text-xs font-bold text-gray-400 mb-2">2. URL 주소 넣기</p>
                <input type="url" className="w-full p-2 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-gray-800" placeholder="https://..." value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} />
              </div>
            </div>
            {thumbnailUrl && (
              <div className="mt-2 bg-white p-2 rounded-xl border flex flex-col items-center">
                <img src={thumbnailUrl} alt="미리보기" className="max-h-48 rounded-lg shadow-sm" />
                <button type="button" onClick={() => setThumbnailUrl('')} className="text-[10px] text-red-500 mt-2 font-bold underline">취소</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select className="p-4 border rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
              <option value="manual">단독 보도</option>
              <option value="scraped">타 언론사/기관 소식</option>
              <option value="ad">배너 광고</option>
            </select>
            <input className="p-4 border rounded-xl bg-gray-50 text-gray-800" placeholder="원본 링크" value={originalLink} onChange={(e) => setOriginalLink(e.target.value)} disabled={sourceType === 'manual'} />
          </div>

          <button type="submit" className="w-full bg-blue-700 text-white font-bold py-5 rounded-2xl shadow-lg hover:bg-blue-800 transition text-lg mt-4">
            📰 기사 최종 발행하기
          </button>
        </form>
      </div>
    </div>
  );
}