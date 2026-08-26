import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import ArticleClient from './ArticleClient';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data: article } = await supabase
    .from('articles')
    .select('title, summary, thumbnail_url')
    .eq('id', id)
    .single();

  if (!article) {
    return { title: '기사를 찾을 수 없습니다 - BY NEWS' };
  }

  const description = (article.summary || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  const image = article.thumbnail_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop';

  return {
    title: `${article.title} - BY NEWS`,
    description,
    openGraph: {
      title: article.title,
      description,
      images: [{ url: image }],
      type: 'article',
      siteName: 'BY NEWS',
      locale: 'ko_KR',
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: [image],
    },
  };
}

export default function ArticlePage() {
  return <ArticleClient />;
}
