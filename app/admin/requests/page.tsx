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
      // 1. 기사 테이블(articles)로 복사해서 넣기
      const { error: insError } = await supabase.from('articles').insert([{
        title: `[제보보도] ${req.title}`,
        summary: `제보자: ${req.author}\n\n${req.content}`,
        source_type: 'manual',
        published_at: new Date().toISOString()
      }]);

      if (insError) {
        alert('기사 등록 실패');
      } else {
        // 2. 승인 완료된 제보는 삭제
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
              <div key={req.id} className="bg-white p-8 rounded-3xl shadow-sm border border-orange-100">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{req.title}</h2>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(req)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700">승인 및 게시</button>
                    <button onClick={() => handleDelete(req.id)} className="bg-red-100 text-red-600 px-4 py-2 rounded-xl font-bold hover:bg-red-200">삭제</button>
                  </div>
                </div>
                <div className="text-sm text-blue-600 font-bold mb-4">제보자: {req.author} | {new Date(req.created_at).toLocaleString()}</div>
                <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-6 rounded-2xl">{req.content}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}