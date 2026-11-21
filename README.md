# PlanCraft

SW 공모전 기획서를 단계별로 작성하는 Next.js 앱입니다.

## 저장 방식

- 스마트 캠퍼스 iframe에서 열면 플랫폼 로그인 토큰으로 계정을 확인하고 `/api/plancraft`에 기획서를 저장합니다. 서버 연결이 실패하면 편집 화면을 열지 않고 오류를 표시합니다.
- 앱 주소로 직접 열면 기존 브라우저 저장 방식을 유지합니다. 학교 공용 컴퓨터에서는 재부팅 후 자료가 사라질 수 있으므로 JSON 내보내기를 사용하거나 스마트 캠퍼스에서 여세요.
- 서버 연결 후 이전 브라우저 기획서는 사용자가 버튼을 눌러 복사합니다. 같은 ID가 이미 서버에 있으면 서버 사본을 보여 주고 브라우저 원본은 그대로 둡니다. 충돌 사본은 JSON으로 내려받을 수 있습니다.
- 운영 플랫폼 서버에는 웹 공개 경로 밖의 절대 경로를 `PLANCRAFT_DATA_DIR`로 설정해야 합니다. 이 폴더는 운영 백업 대상에 포함해야 합니다. 설정이 없거나 중앙 계정 보안이 꺼져 있으면 서버 저장 API는 닫힙니다.
- 운영 반영 순서: 비공개 저장 경로와 백업 준비 → 플랫폼 API와 토큰 전달 배포 → 앱 배포 → 실제 교사·학생 계정으로 생성·새로고침·다른 기기 복원을 확인합니다.

## 로컬 실행

`npm ci` 후 `npm run dev`로 실행합니다. 직접 접속은 브라우저 저장 모드입니다.

## 확인된 제한

서버 저장에는 계정별 공간 및 기획서 크기 제한이 있습니다. 저장 실패가 표시되면 JSON 내보내기로 현재 내용을 보존하고 오류를 해결한 뒤 다시 시도하세요.

---

This project was bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
