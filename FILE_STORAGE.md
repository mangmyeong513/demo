
# FILE STORAGE 모드로 전환하기
1) `.env` 또는 Render 환경변수에 `FILE_STORAGE=1` 설정
2) `server/storage.ts` 최상단의 export를 아래처럼 바꾸거나, 라우터에서 `from './storage.file'`로 임포트하도록 변경

빠르게 테스트하려면:
- `mkdir data`
- 서버 실행 후 JSON들이 `./data/*.json`으로 생성/갱신됩니다.
