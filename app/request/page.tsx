'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function RequestPage() {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from('requests').insert([
      { title, author, content, image_url: imageUrl } 
    ]);

    if (error) alert('제보 전송 실패 ㅜㅜ');
    else {
      alert('기사 제보가 완료되었습니다! 편집장님이 검토 후 올려주실 거예요. 감사합니다. ✨');
      router.push('/');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-blue-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-blue-100">
        <button onClick={() => router.push('/')} className="mb-6 text-gray-500 font-bold hover:text-blue-700">← 홈으로 돌아가기</button>
        <h1 className="text-3xl font-black text-blue-800 mb-2">📢 기사 제보하기</h1>
        <p className="text-gray-500 mb-8 font-medium">부산 청소년들에게 알리고 싶은 소식을 자유롭게 제보해 주세요!</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-bold text-gray-700">제보 제목</label>
            <input className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50" placeholder="뉴스 기사 제목처럼 적어주세요" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="block mb-2 font-bold text-gray-700">제보자 성함/단체명</label>
            <input className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50" placeholder="예: 부산고 학생회 김철수" value={author} onChange={(e) => setAuthor(e.target.value)} required />
          </div>

          {/* ⭐️ 문제 해결: 입력칸과 안내 박스를 위아래로 넓게 배치했습니다 */}
          <div>
            <label className="block mb-2 font-bold text-gray-700">관련 사진 (이미지 주소)</label>
            <input 
              className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-400" 
              placeholder="https://..." 
              value={imageUrl} 
              onChange={(e) => setImageUrl(e.target.value)} 
            />
            <div className="mt-3 bg-blue-50 p-4 rounded-xl text-sm text-blue-800 border border-blue-100 shadow-sm leading-relaxed">
              💡 <b>안내:</b> 인터넷에 있는 사진을 우클릭한 뒤, <b>'이미지 주소 복사'</b>를 눌러서 이곳에 붙여넣어 주세요! (선택사항)
            </div>
            
            {/* 이미지 주소를 넣으면 어떻게 보이는지 미리보기 제공 */}
            {imageUrl && (
              <img src={imageUrl} alt="미리보기" className="mt-4 h-40 rounded-xl object-cover border shadow-sm" onError={(e) => (e.currentTarget.style.display = 'none')} />
            )}
          </div>

          <div>
            <label className="block mb-2 font-bold text-gray-700">제보 내용</label>
            <textarea className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 h-64" placeholder="상세한 내용을 적어주세요." value={content} onChange={(e) => setContent(e.target.value)} required />
          </div>
          <button type="submit" disabled={submitting} className="w-full bg-blue-700 text-white p-4 rounded-xl font-bold text-lg hover:bg-blue-800 shadow-lg transition-colors">
            {submitting ? '⏳ 전송 중...' : '뉴스 제보 보내기'}
          </button>
        </form>
      </div>
    </div>
  );
}