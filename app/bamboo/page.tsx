'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function BambooPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    // 24시간이 지나지 않은 글만 화면에 불러옵니다 (안전장치)
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const { data } = await supabase
      .from('bamboo_posts')
      .select('*')
      .gt('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false });

    if (data) setPosts(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);

    const { error } = await supabase.from('bamboo_posts').insert([{ content }]);

    if (error) alert('등록 실패!');
    else {
      setContent('');
      fetchPosts(); // 글 작성 후 목록 새로고침
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-green-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => router.push('/')} className="text-gray-500 font-bold hover:text-green-700">← 홈으로</button>
          <h1 className="text-3xl font-black text-green-800 tracking-tight">🎋 BY NEWS 대나무숲</h1>
          <div className="w-16"></div> {/* 레이아웃 균형용 */}
        </div>
        
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-8 border border-green-100">
          <p className="text-sm text-green-600 font-bold mb-4">🤫 모든 글은 철저히 익명으로 보장되며, 작성 후 24시간이 지나면 흔적 없이 사라집니다.</p>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input 
              className="flex-1 p-4 border border-green-200 rounded-2xl bg-gray-50 focus:ring-2 focus:ring-green-400 outline-none" 
              placeholder="학교 생활, 고민, 뒷담화(?) 무엇이든 외쳐보세요!" 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              maxLength={200}
              required 
            />
            <button type="submit" disabled={submitting} className="bg-green-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-green-700 shadow-md">
              {submitting ? '전송중' : '외치기!'}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-20 text-gray-400 font-bold">아직 아무도 외치지 않았습니다. 첫 번째로 외쳐보세요!</div>
          ) : (
            posts.map(post => {
              // 남은 시간 계산
              const postDate = new Date(post.created_at);
              const expiryDate = new Date(postDate.getTime() + 24 * 60 * 60 * 1000);
              const hoursLeft = Math.max(0, Math.floor((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60)));

              return (
                <div key={post.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                  <div className="text-gray-800 text-lg font-medium break-words">{post.content}</div>
                  <div className="mt-4 flex justify-between items-end text-xs font-bold">
                    <span className="text-gray-400">{postDate.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-red-400 bg-red-50 px-2 py-1 rounded-md">⏳ 삭제까지 {hoursLeft}시간 남음</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  );
}