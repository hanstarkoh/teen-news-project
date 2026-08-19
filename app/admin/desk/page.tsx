'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { gallerySources } from '@/lib/gallerySources';

export default function AIDeskPage() {
  const [sourceId, setSourceId] = useState(gallerySources[0].id);
  const [notices, setNotices] = useState<{title: string, url: string}[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [processingId, setProcessingId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<{[key: number]: {title: string, content: string, url: string, imageUrl?: string}}>({});

  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  const currentSource = gallerySources.find(s => s.id === sourceId) || gallerySources[0];

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('byNewsAdmin') === 'true') {
      setIsAdmin(true);
    } else {
      alert('편집장 권한이 필요합니다!');
      router.push('/');
    }
  }, [router]);

  const handleSourceChange = (id: string) => {
    setSourceId(id);
    setNotices([]);
    setDrafts({});
  };

  const fetchNotices = async () => {
    setLoadingList(true);
    try {
      const response = await fetch('/api/gallery-list', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId })
      });
      const data = await response.json();

      if (data.notices && data.notices.length > 0) {
        setNotices(data.notices);
        alert(`성공! ${data.notices.length}개의 최신 갤러리 게시물을 대기실로 가져왔습니다.`);
      } else {
        alert('가져올 갤러리 게시물이 없습니다.');
      }
    } catch (error) {
      alert('목록을 가져오지 못했습니다.');
    }
    setLoadingList(false);
  };

  const generateDraft = async (index: number, url: string, listTitle: string) => {
    setProcessingId(index);
    try {
      const response = await fetch('/api/gallery-article', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, targetUrl: url, listTitle })
      });
      const data = await response.json();

      if (data.title && data.content) {
        setDrafts(prev => ({ ...prev, [index]: { title: data.title, content: data.content, url, imageUrl: data.sourceImage } }));
      } else {
        alert('기사 초안 작성 실패: ' + (data.error || ''));
      }
    } catch (error) {
      alert('AI 서버 통신 에러');
    }
    setProcessingId(null);
  };

  const handlePublish = async (index: number) => {
    const draft = drafts[index];
    if (!draft) return;
    
    if (!window.confirm('이 내용으로 메인 뉴스에 정식 발행하시겠습니까?')) return;

    const { error } = await supabase.from('articles').insert([{
      title: draft.title,
      summary: draft.content,
      thumbnail_url: draft.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop',
      source_type: 'manual',
      original_link: draft.url,
      published_at: new Date().toISOString(),
    }]);

    if (error) {
      alert('발행 실패: ' + error.message);
    } else {
      alert('🎉 메인 뉴스에 발행되었습니다!');
      const newDrafts = {...drafts};
      delete newDrafts[index];
      setDrafts(newDrafts);
    }
  };

  const updateDraft = (index: number, field: 'title' | 'content', value: string) => {
    setDrafts(prev => ({
      ...prev,
      [index]: { ...prev[index], [field]: value }
    }));
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">🕵️‍♂️ AI 편집 데스크</h1>
            <p className="text-gray-500 font-bold">타 기관 활동 갤러리를 검토하고 뉴스로 발행하는 컨트롤 타워입니다.</p>
          </div>
          <button onClick={() => router.push('/')} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-200">홈으로</button>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
          <h2 className="font-bold text-lg mb-4 text-blue-900">📡 정보 수집 레이더</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={sourceId}
              onChange={(e) => handleSourceChange(e.target.value)}
              disabled={loadingList}
              className="p-3 border border-gray-300 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              {gallerySources.map(source => (
                <option key={source.id} value={source.id}>{source.name}</option>
              ))}
            </select>
            <button
              onClick={fetchNotices}
              disabled={loadingList}
              className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:bg-blue-700 transition flex items-center gap-2"
            >
              {loadingList ? `📡 ${currentSource.name} 스캔 중...` : `📥 ${currentSource.name} 활동 갤러리 10개 불러오기`}
            </button>
          </div>
        </div>

        {notices.length > 0 && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
            <h2 className="font-bold text-lg mb-4 text-gray-800">📋 기사화 대기실 (총 {notices.length}건)</h2>
            <p className="text-xs text-gray-400 -mt-2 mb-3">※ 사진 속 인물의 얼굴/인상착의는 AI가 초상권 보호를 위해 서술하지 않습니다.</p>
            <div className="space-y-4">
              {notices.map((notice, index) => (
                <div key={index} className="border border-gray-200 rounded-2xl p-5 hover:border-blue-300 transition-all bg-gray-50">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{notice.title}</h3>
                      <a href={notice.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">원본 글 확인하기 ↗</a>
                    </div>
                    
                    {!drafts[index] && (
                      <button 
                        onClick={() => generateDraft(index, notice.url, notice.title)}
                        disabled={processingId !== null}
                        className={`px-4 py-2 rounded-xl font-bold text-sm shadow text-white flex-shrink-0 ${processingId === index ? 'bg-indigo-300' : processingId !== null ? 'bg-gray-300' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                      >
                        {processingId === index ? '🤖 AI가 기사 쓰는 중...' : '✨ 이 글로 기사 초안 쓰기'}
                      </button>
                    )}
                  </div>

                  {drafts[index] && (
                    <div className="mt-6 bg-white p-5 rounded-2xl border-2 border-indigo-200 shadow-inner">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">AI 초안 완료</span>
                        <span className="text-sm text-gray-500 font-bold">내용을 직접 수정한 뒤 발행할 수 있습니다.</span>
                      </div>
                      
                      {drafts[index].imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={drafts[index].imageUrl}
                          alt="대표 이미지 미리보기"
                          className="w-full max-h-64 object-cover rounded-xl mb-3 border border-gray-200"
                        />
                      )}
                      <input
                        className="w-full p-3 border border-gray-200 rounded-xl font-bold text-gray-900 mb-3 focus:border-indigo-500 outline-none"
                        value={drafts[index].title}
                        onChange={(e) => updateDraft(index, 'title', e.target.value)}
                      />
                      <textarea 
                        className="w-full p-3 border border-gray-200 rounded-xl text-gray-900 h-40 focus:border-indigo-500 outline-none leading-relaxed" 
                        value={drafts[index].content} 
                        onChange={(e) => updateDraft(index, 'content', e.target.value)}
                      />
                      
                      <div className="flex justify-end gap-3 mt-4">
                         <button onClick={() => {
                            const newDrafts = {...drafts};
                            delete newDrafts[index];
                            setDrafts(newDrafts);
                         }} className="px-5 py-2 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200">초안 폐기</button>
                         <button onClick={() => handlePublish(index)} className="px-6 py-2 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-md flex items-center gap-2">
                           🚀 메인 뉴스에 발행하기
                         </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}