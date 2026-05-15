'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
// ⭐️ 사진 용량을 1/10로 줄여주는 마법의 도구 불러오기!
import imageCompression from 'browser-image-compression';

export default function WritePage() {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [sourceType, setSourceType] = useState('manual');
  const [originalLink, setOriginalLink] = useState('');
  
  const [keywords, setKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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

  // ⭐️ 사진 다이어트(압축) 후 업로드하는 핵심 로직!
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // 1. 압축 설정 (최대 0.2MB(200KB)로 화질 손실 없이 꽉 눌러 압축!)
      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(file, options);
      console.log(`압축 전: ${(file.size / 1024 / 1024).toFixed(2)} MB -> 압축 후: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

      // 2. 수파베이스로 업로드
      const fileExt = compressedFile.name.split('.').pop() || 'jpeg';
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `article_images/${fileName}`;

      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, compressedFile); // 뚱뚱한 원본 대신 홀쭉해진 사진을 올립니다!

      if (error) {
        alert('이미지 업로드 실패: ' + error.message);
      } else {
        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
        setThumbnailUrl(publicUrl);
        alert('📸 용량 압축 & 업로드 성공!');
      }
    } catch (error) {
      alert('사진을 압축하는 중에 오류가 발생했습니다.');
    }
    
    setIsUploading(false);
  };

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
        alert('✨ AI 기자가 성공적으로 기사를 작성했습니다!');
      }
    } catch (err) {
      alert('AI 서버 오류');
    }
    setIsGenerating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const { error } = await supabase.from('articles').insert([{
      title, summary, thumbnail_url: thumbnailUrl, source_type: sourceType,
      original_link: originalLink, published_at: new Date().toISOString(),
    }]);
    if (error) alert('실패');
    else {
      alert('🎉 발행 성공!');
      router.push('/');
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-3xl shadow-md border border-gray-100">
        <h1 className="text-3xl font-black text-gray-900 mb-8 border-b pb-4">✍️ BY NEWS 기사 작성</h1>

        <div className="mb-10 bg-indigo-50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
          <h3 className="font-bold text-indigo-800 mb-2">🤖 AI 어시스턴트</h3>
          <textarea className="w-full p-4 rounded-xl border border-indigo-200 outline-none mb-3" placeholder="메모를 입력하세요..." rows={2} value={keywords} onChange={(e) => setKeywords(e.target.value)} />
          <button onClick={handleGenerateAI} disabled={isGenerating} className="w-full py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition">
            {isGenerating ? '⏳ 작성 중...' : '✨ AI 기사 초안 생성'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input className="w-full p-4 border rounded-xl font-bold text-lg" placeholder="기사 제목" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <textarea className="w-full p-4 border rounded-xl h-64 leading-relaxed" placeholder="본문 내용" value={summary} onChange={(e) => setSummary(e.target.value)} required />

          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 space-y-4">
            <label className="block text-sm font-bold text-blue-900">📸 대표 사진 등록 (자동 용량 압축 적용됨)</label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                <p className="text-xs font-bold text-gray-400 mb-2">방식 1. 사진 파일 올리기</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="text-xs w-full file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white cursor-pointer"
                />
                {isUploading && <p className="text-[10px] text-blue-600 mt-1 animate-pulse">압축 및 업로드 중... ⏳</p>}
              </div>

              <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                <p className="text-xs font-bold text-gray-400 mb-2">방식 2. 이미지 주소(URL) 넣기</p>
                <input 
                  type="url" 
                  className="w-full p-2 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="https://..." 
                  value={thumbnailUrl} 
                  onChange={(e) => setThumbnailUrl(e.target.value)} 
                />
              </div>
            </div>

            {thumbnailUrl && (
              <div className="mt-2 bg-white p-2 rounded-xl border border-gray-200 flex flex-col items-center">
                <p className="text-[10px] text-gray-400 mb-2">선택된 이미지 미리보기</p>
                <img src={thumbnailUrl} alt="미리보기" className="max-h-48 rounded-lg object-cover shadow-sm" />
                <button type="button" onClick={() => setThumbnailUrl('')} className="text-[10px] text-red-500 mt-2 font-bold underline">사진 취소</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select className="p-4 border rounded-xl font-bold" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
              <option value="manual">단독 보도</option>
              <option value="ad">배너 광고</option>
            </select>
            <input className="p-4 border rounded-xl bg-gray-50" placeholder="원본 링크" value={originalLink} onChange={(e) => setOriginalLink(e.target.value)} disabled={sourceType === 'manual'} />
          </div>

          <button type="submit" className="w-full bg-blue-700 text-white font-bold py-5 rounded-2xl shadow-lg hover:bg-blue-800 transition text-lg mt-4">
            📰 기사 최종 발행하기
          </button>
        </form>
      </div>
    </div>
  );
}