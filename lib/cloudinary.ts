// Cloudinary의 "fetch" 배달 방식으로 원본 이미지 URL을 그대로 가져와
// 얼굴만 자동으로 블러 처리한 URL로 바꿔줍니다. 원본 서버에는 아무 영향 없고,
// 우리 쪽에서 저장/표시하는 thumbnail_url만 블러 처리된 버전이 됩니다.
// CLOUDINARY_CLOUD_NAME이 설정 안 되어 있으면 원본 URL을 그대로 반환합니다(안전한 기본값).
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;

export function blurFacesUrl(originalUrl: string): string {
  if (!CLOUD_NAME || !originalUrl) return originalUrl;
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/e_blur_faces:1000/${encodeURIComponent(originalUrl)}`;
}
