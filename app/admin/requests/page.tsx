'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('byNewsAdmin') !== 'true') {
      alert('관리자만 접근 가능합니다.');
      router.push('/');
    } else {
      fetchRequests();
    }
  }, []);

  const fetchRequests = async () => {
    const { data } = await supabase.from('requests').select('*').order('created_at', { ascending: false });
    if (data) setRequests(data);
  };

  const handleApprove = async (req: any) => {
    if (window.confirm('이 제보를 정식 기사로 등록할까요?')) {
      // 1. 기사 테이블(articles)로 복사 (이때 제보받은 이미지를 thumbnail_url에 쏙 넣어줍니다!)
      const { error: insError } = await supabase.from('articles').insert([{
        title: `[제보보도] ${req.title}`,
        summary: `제보자: ${req.author}\n\n${req.content}`,
        thumbnail_url: req.image_url || '', // ⭐️ 제보 이미지가 있으면 넣고, 없으면 비워둠
        source_type: 'manual',
        published_at: new Date().toISOString()
      }]);

      if (insError) {
        alert('기사 등록 실패');
      } else {
        await supabase.from('requests').delete().eq('id', req.id);
        alert('정식 기사로 등록되었습니다! 🎉');
        fetchRequests();
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('이 제보를 삭제하시겠습니까?')) {
      await supabase.from('requests').delete().eq('id', id);
      fetchRequests();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push('/')} className="mb-6 text-gray-500 font-bold hover:text-blue-700">← 홈으로</button>
        <h1 className="text-3xl font-black text-orange-600 mb-8">📬 기사 제보 목록</h1>

        <div className="space-y-6">
          {requests.length === 0 ? (
            <div className="bg-white p-20 text-center rounded-3xl border text-gray-400 font-bold">도착한 제보가 없습니다.</div>
          ) : (
            requests.map(req => (
              <div key={req.id} className="bg-white p-8 rounded-3xl shadow-sm border border-orange-100 flex flex-col md:flex-row gap-6">
                
                {/* ⭐️ 편집장님이 제보된 이미지를 바로 볼 수 있도록 추가 */}
                <div className="w-full md:w-1/3 flex-shrink-0">
                  {req.image_url ? (
                    <img src={req.image_url} alt="제보 이미지" className="w-full h-48 object-cover rounded-2xl border" />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 rounded-2xl border-2 border-dashed flex items-center justify-center text-gray-400 font-bold text-sm">
                      첨부된 사진 없음
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">{req.title}</h2>
                  </div>
                  <div className="text-sm text-blue-600 font-bold mb-4">제보자: {req.author} | {new Date(req.created_at).toLocaleString()}</div>
                  <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-2xl h-32 overflow-y-auto border mb-4">{req.content}</div>
                  
                  <div className="flex gap-2 justify-end mt-auto">
                    <button onClick={() => handleApprove(req)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700">승인 및 게시</button>
                    <button onClick={() => handleDelete(req.id)} className="bg-red-100 text-red-600 px-4 py-2 rounded-xl font-bold hover:bg-red-200">삭제</button>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}