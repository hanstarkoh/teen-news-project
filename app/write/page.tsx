'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function WritePage() {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [sourceType, setSourceType] = useState('manual');
  const [originalLink, setOriginalLink] = useState('');
  
  // ⭐️ AI 자동 생성용 상태
  const [keywords, setKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkLogin = () => {
      if (typeof window !== 'undefined' && localStorage.getItem('byNewsAdmin') === 'true') {
        setIsAdmin(true);
      } else {
        alert('편집장 권한이 필요합니다!');
        router.push('/');
      }
    };
    checkLogin();
  }, [router]);

  // ⭐️ AI 기사 작성 실행 함수
  const handleGenerateAI = async () => {
    if (!keywords.trim()) {
      alert('취재 메모나 키워드를 먼저 입력해주세요!');
      return;
    }
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords })
      });
      
      const data = await response.json();
      if (data.title && data.content) {
        setTitle(data.title);
        setSummary(data.content);
        alert('✨ AI 기자가 성공적으로 기사를 작성했습니다! 내용을 검토하고 수정해보세요.');
      } else {
        alert('기사 작성에 실패했습니다.');
      }
    } catch (err) {
      alert('AI 서버와 통신 중 오류가 발생했습니다.');
    }
    setIsGenerating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const { error } = await supabase.from('articles').insert([{
      title,
      summary,
      thumbnail_url: thumbnailUrl,
      source_type: sourceType,
      original_link: originalLink,
      published_at: new Date().toISOString(),
    }]);

    if (error) {
      alert('기사 등록 실패: ' + error.message);
    } else {
      alert('🎉 기사가 성공적으로 발행되었습니다!');
      router.push('/');
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-3xl shadow-md border border-gray-100">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-black text-gray-900">✍️ BY NEWS 기사 작성</h1>
          <button onClick={() => router.push('/')} className="text-gray-500 font-bold hover:text-blue-700">← 홈으로</button>
        </div>

        {/* ⭐️ AI 자동 생성 패널 */}
        <div className="mb-10 bg-indigo-50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
          <h3 className="font-bold text-indigo-800 text-lg mb-2 flex items-center gap-2">
            🤖 AI 어시스턴트에게 기사 맡기기
          </h3>
          <p className="text-sm text-indigo-600 mb-4">키워드나 행사 내용만 대충 적어주시면, AI가 완벽한 기사 초안을 써드립니다!</p>
          <div className="flex flex-col gap-3">
            <textarea 
              className="w-full p-4 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800"
              placeholder="예: 이번 주말 송상현광장 청소년 플리마켓, 다양한 체험부스, 청소년들 호응 좋았음"
              rows={3}
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
            <button 
              type="button"
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className={`py-3 rounded-xl font-bold shadow-md transition-all text-white ${isGenerating ? 'bg-indigo-300' : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg'}`}
            >
              {isGenerating ? '⏳ AI 기자가 열심히 타이핑하는 중...' : '✨ 키워드로 기사 초안 자동 생성'}
            </button>
          </div>
        </div>

        {/* 기존 수동 작성 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">기사 제목</label>
            <input className="w-full p-4 border rounded-xl bg-gray-50 focus:bg-white text-gray-900 font-bold text-lg" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">기사 본문</label>
            <textarea className="w-full p-4 border rounded-xl bg-gray-50 focus:bg-white text-gray-900 h-64 leading-relaxed" value={summary} onChange={(e) => setSummary(e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">썸네일 이미지 URL (선택)</label>
            <input type="url" className="w-full p-4 border rounded-xl bg-gray-50 focus:bg-white text-gray-900" placeholder="https://..." value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">기사 유형</label>
              <select className="w-full p-4 border rounded-xl bg-gray-50 text-gray-900 font-bold" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
                <option value="manual">단독 보도</option>
                <option value="ad">배너 광고</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">원본 링크 (타 언론사/광고일 경우)</label>
              <input type="url" className="w-full p-4 border rounded-xl bg-gray-50 focus:bg-white text-gray-900" value={originalLink} onChange={(e) => setOriginalLink(e.target.value)} disabled={sourceType === 'manual'} />
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-700 text-white font-bold py-5 rounded-2xl shadow-lg hover:bg-blue-800 transition text-lg mt-8">
            📰 기사 최종 발행하기
          </button>
        </form>
      </div>
    </div>
  );
}