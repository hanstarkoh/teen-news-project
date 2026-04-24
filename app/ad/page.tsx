'use client';
import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

// ⭐️ 검색 파라미터(?id=...)를 사용하기 위해 별도 컴포넌트로 분리합니다.
function AdForm() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id'); // 주소에 id가 있으면 '수정 모드'로 작동!

  useEffect(() => {
    // 1. VIP 출입증 검사
    if (typeof window !== 'undefined' && localStorage.getItem('byNewsAdmin') === 'true') {
      setIsAdmin(true);
      // 2. 수정 모드라면, 창고에서 기존 광고 데이터를 불러와서 칸에 채워줍니다.
      if (editId) {
        fetchAdData(editId);
      }
    } else {
      alert('관리자(편집장)만 접근 가능한 페이지입니다!');
      router.push('/');
    }
  }, [editId, router]);

  const fetchAdData = async (id: string) => {
    const { data } = await supabase.from('articles').select('*').eq('id', id).single();
    if (data) {
      // 제목에 붙어있던 '[광고]' 꼬리표를 떼고 보여줍니다.
      setTitle(data.title.replace('[광고] ', ''));
      setImageUrl(data.thumbnail_url || '');
      setLinkUrl(data.original_link || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 창고에 넣을 데이터 포장
    const adData = {
      title: `[광고] ${title}`, // 저장할 때는 다시 꼬리표를 붙여줍니다.
      summary: '이것은 배너 광고입니다.',
      thumbnail_url: imageUrl,
      original_link: linkUrl,
      source_type: 'ad', // 기사가 아니라 광고라는 확실한 증표!
      published_at: new Date().toISOString(),
    };

    let error;

    // 수정 모드일 때는 'update(수정)', 새 광고일 때는 'insert(추가)'를 실행합니다.
    if (editId) {
      const { error: updateError } = await supabase.from('articles').update(adData).eq('id', editId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('articles').insert([adData]);
      error = insertError;
    }

    if (error) {
      alert('광고 저장 실패 ㅜㅜ : ' + error.message);
    } else {
      alert(editId ? '광고가 성공적으로 수정되었습니다! ✨' : '새 광고가 등록되었습니다! 💸');
      router.push('/'); // 완료 후 메인 화면으로 복귀
    }
  };

  // 관리자가 아니면 빈 화면만 보여줍니다.
  if (!isAdmin) return <div className="min-h-screen bg-gray-50"></div>;

  return (
    <div className="max-w-xl mx-auto p-10 mt-10 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="mb-6">
        <button onClick={() => router.push('/')} className="text-gray-500 hover:text-indigo-600 font-bold flex items-center gap-2 transition-colors">
          ← 홈으로 돌아가기
        </button>
      </div>
      
      <h1 className="text-3xl font-black mb-2 text-indigo-600">
        {editId ? '💸 배너 광고 수정하기' : '💸 새 배너 광고 등록'}
      </h1>
      <p className="text-gray-500 mb-8 font-medium">메인 화면 오른쪽에 3:4 비율로 노출될 배너입니다.</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2 font-bold text-gray-700">광고 이름 (관리용)</label>
          <input 
            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50 outline-none transition-all" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="예: 부산 코딩학원 겨울특강" 
            required 
          />
        </div>

        <div>
          <label className="block mb-2 font-bold text-gray-700">배너 이미지 주소 (URL)</label>
          <input 
            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50 outline-none transition-all" 
            value={imageUrl} 
            onChange={(e) => setImageUrl(e.target.value)} 
            placeholder="인터넷 이미지 우클릭 -> 주소 복사" 
            required 
          />
          {/* 이미지 주소를 넣으면 3:4 비율로 미리보기를 보여줍니다! */}
          {imageUrl && (
            <div className="mt-4 flex flex-col items-start">
              <span className="text-sm text-gray-500 mb-2 font-bold">👀 3:4 비율 미리보기</span>
              <img 
                src={imageUrl} 
                className="w-32 aspect-[3/4] object-cover rounded-xl border border-gray-200 shadow-sm" 
                alt="광고 미리보기" 
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
          )}
        </div>

        <div>
          <label className="block mb-2 font-bold text-gray-700">클릭 시 이동할 링크 주소</label>
          <input 
            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50 outline-none transition-all" 
            value={linkUrl} 
            onChange={(e) => setLinkUrl(e.target.value)} 
            placeholder="https://..." 
            required 
          />
        </div>

        <button type="submit" className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-md transition-all">
          {editId ? '수정된 내용 저장하기' : '메인 화면에 광고 걸기'}
        </button>
      </form>
    </div>
  );
}

// ⭐️ 최종 페이지 컴포넌트 (Next.js 최신 문법에 맞게 Suspense로 감싸줍니다)
export default function AdPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Suspense fallback={<div className="p-20 text-center font-bold text-indigo-500">광고 에디터 불러오는 중...</div>}>
        <AdForm />
      </Suspense>
    </div>
  );
}