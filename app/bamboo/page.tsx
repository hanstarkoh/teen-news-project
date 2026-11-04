'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function BambooPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // ⭐️ 관리자 상태 추가
  const router = useRouter();

  useEffect(() => {
    // ⭐️ 관리자 로그인 여부 확인
    if (typeof window !== 'undefined' && localStorage.getItem('byNewsAdmin') === 'true') {
      setIsAdmin(true);
    }
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
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
    if (!error) {
      setContent('');
      fetchPosts();
    }
    setSubmitting(false);
  };

  // ⭐️ 관리자 전용 삭제 함수
  const handleDeletePost = async (id: number) => {
    if (window.confirm('이 글을 삭제하시겠습니까? (관리자 권한)')) {
      const { error } = await supabase.from('bamboo_posts').delete().eq('id', id);
      if (!error) {
        alert('삭제되었습니다.');
        fetchPosts();
      }
    }
  };

  return (
    <div className="min-h-screen bg-white py-10 px-4 text-gray-900">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-gray-900 pb-4">
          <button onClick={() => router.push('/')} className="text-gray-500 font-bold text-sm hover:text-gray-900">← 홈으로</button>
          <h1 className="font-serif text-3xl font-black text-gray-900 tracking-tight">BY NEWS 대나무숲</h1>
          <div className="w-16"></div>
        </div>

        <div className="bg-gray-50 p-6 mb-8 border border-gray-200">
          <p className="text-xs text-gray-500 font-bold mb-4">작성 후 24시간이 지나면 흔적 없이 사라집니다.</p>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              className="flex-1 p-3 border border-gray-300 bg-white focus:ring-1 focus:ring-gray-900 outline-none text-sm text-gray-900"
              placeholder="외쳐보세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={200}
              required
            />
            <button type="submit" disabled={submitting} className="bg-gray-900 text-white px-6 py-3 font-bold text-sm hover:bg-black transition">
              {submitting ? '...' : '외치기'}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-20 text-gray-400 font-bold text-sm">아직 외침이 없습니다.</div>
          ) : (
            posts.map(post => {
              const postDate = new Date(post.created_at);
              const expiryDate = new Date(postDate.getTime() + 24 * 60 * 60 * 1000);
              const hoursLeft = Math.max(0, Math.floor((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60)));

              return (
                <div key={post.id} className="bg-white p-6 border border-gray-200 relative group transition-colors hover:border-gray-900">
                  <div className="text-gray-800 text-lg font-medium break-words pr-12">{post.content}</div>

                  {/* 관리자일 때만 보여주는 삭제 버튼 */}
                  {isAdmin && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="absolute top-4 right-4 text-red-500 hover:text-red-700 p-2 text-sm font-bold"
                    >
                      삭제
                    </button>
                  )}

                  <div className="mt-4 flex justify-between items-end text-xs font-bold">
                    <span className="text-gray-400">{postDate.toLocaleString()}</span>
                    <span className="text-red-600 bg-red-50 px-2 py-1">{hoursLeft}시간 남음</span>
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