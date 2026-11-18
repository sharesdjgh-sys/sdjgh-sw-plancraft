"use client";

import { useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowDown, ArrowRight, Check, FileText, MessageCircle, Save, X } from "lucide-react";
import { STEPS } from "@/lib/utils";
import styles from "./step-help-dialog.module.css";

type HelpStep = 1 | 2 | 3 | 4 | 5;

const GUIDES = {
  1: {
    title: "불편했던 순간이 아이디어의 시작이에요.",
    description: "완성된 아이디어가 없어도 괜찮아요. 경험 하나부터 이야기해보세요.",
    example: "대화가 한 줄 아이디어로 바뀌는 과정",
    actions: [
      ["겪었던 불편함을 이야기해요", "아이디어봇 입력창에 상황을 적어요. 막막하면 화면 위 예시로 시작해요."],
      ["질문에 답하며 범위를 좁혀요", "누가, 언제 어려웠는지 이야기해요. 대화는 자연스럽게 이어집니다."],
      ["아래에 한 줄로 남겨요", "‘아이디어 한 줄 정리’에 누구의 어떤 문제를 해결할지 적어요."],
    ],
    takeaway: "누구의 어떤 불편함을 해결할지 담은 한 문장",
    note: "대화와 한 줄 정리는 이 브라우저에 자동 저장돼요.",
  },
  2: {
    title: "막연한 생각을, 해결할 문제로 바꿔요.",
    description: "누가 어떤 상황에서 어려운지 선명해지면 해결 방향도 보입니다.",
    example: "같은 생각도 이렇게 구체적으로",
    actions: [
      ["한 줄 소개부터 확인해요", "01에서 남긴 문장을 다듬고 ‘해결하려는 문제’에 실제 상황을 적어요."],
      ["왜 필요한지 근거를 적어요", "‘배경 및 필요성’에 관찰한 사례를 써요. 확인하지 않은 수치는 넣지 않아요."],
      ["문제를 바꿀 방법을 정해요", "‘기능 개요’에 핵심 기능과 사용 후 달라질 모습을 적고 저장해요."],
    ],
    takeaway: "문제 → 필요한 이유 → 해결 방향이 이어지는 설명",
    note: "작성 후 저장 버튼을 눌러주세요. AI 초안은 사실과 맞는지 확인해요.",
  },
  3: {
    title: "같은 서비스, 필요한 이유는 달라요.",
    description: "직접 쓰는 사람부터 운영하는 사람까지, 각자의 관점으로 살펴보세요.",
    example: "학교 공지 서비스에 필요한 두 관점",
    actions: [
      ["이해관계자를 추가해요", "‘이해관계자 추가’를 눌러 대상 이름과 역할을 정해요."],
      ["각자의 불편함을 적어요", "‘편집’을 눌러 현재 불편함과 연령·특성, 사용 상황을 구체화해요."],
      ["사용 목적과 관계를 정리해요", "이 서비스로 얻고 싶은 것과 직접 사용·운영 등 관계를 적고 저장해요."],
    ],
    takeaway: "대상별 현재 불편함과 서비스에서 얻고 싶은 것",
    note: "대상 수보다 관점의 차이가 중요해요. 작성 후 저장 버튼을 눌러주세요.",
  },
  4: {
    title: "기능 하나를, 작동하는 흐름으로 풀어요.",
    description: "무엇을 넣으면 어떤 과정을 거쳐 어떤 결과가 나오는지 그려보세요.",
    example: "‘공지 모아보기’ 기능의 동작 예시",
    actions: [
      ["설계할 기능을 골라요", "위 기능 목록에서 선택하거나 추가한 뒤, 이름과 설명을 적어요."],
      ["동작을 순서대로 나눠요", "‘단계 추가’로 입력·처리·출력을 구성해요. 드래그로 순서를 바꿀 수 있어요."],
      ["입력값과 결과를 확인해요", "각 동작의 입력 데이터와 출력/결과를 적어요. 결과가 없을 때도 생각해요."],
    ],
    takeaway: "핵심 기능마다 입력 → 처리 → 출력이 연결된 설계",
    note: "가장 필요한 기능부터 완성하고 저장해요. 빈 결과나 실패 상황도 확인해요.",
  },
  5: {
    title: "흩어진 생각을, 한 편의 기획서로 엮어요.",
    description: "앞 단계에서 모은 문제·사용자·기능을 연결하면 초안이 됩니다.",
    example: "앞 단계의 내용이 모인 기획서 견본",
    actions: [
      ["앞 단계의 재료를 확인해요", "상단 참고 내용을 펼쳐 이해관계자와 기능을 살펴봐요."],
      ["하나의 이야기로 연결해요", "배경 → 해결 방안 → 핵심 기능 → 기대 효과 순으로 써요. AI 자동채우기도 가능해요."],
      ["구체적인 동작으로 다듬어요", "‘편리하게’ 대신 실제 동작을 적고, 기능이 문제를 해결하는지 확인한 뒤 저장해요."],
    ],
    takeaway: "다른 사람이 읽고 무엇을 만들지 이해할 수 있는 기획서",
    note: "AI가 만든 문장도 내 기획에 맞게 검토해요. 저장한 뒤 최종 검토로 이어가요.",
  },
} as const;

function Example({ step }: { step: HelpStep }) {
  if (step === 1) return <div className={styles.conversation}>
    <div className={styles.bubbleUser}><span>나의 경험</span><p>학교 알림이 여기저기 흩어져서<br />중요한 공지를 자꾸 놓쳐요.</p></div>
    <div className={styles.bubbleBot}><span><MessageCircle size={14} aria-hidden="true" /> 아이디어봇</span><p>누가, 어떤 공지를 놓쳤나요?</p></div>
    <div className={styles.bubbleUser}><span>상황을 더 구체적으로</span><p>학부모가 체험학습 신청 기한을<br />놓치는 일이 있어요.</p></div>
    <div className={styles.connector}><ArrowDown size={17} aria-hidden="true" /><span>한 문장으로 정리하면</span></div>
    <div className={styles.ideaResult}><span>아이디어 한 줄 정리</span><p><mark>학부모</mark>가 필요한 <mark>학교 공지</mark>를<br />한곳에서 확인하는 서비스</p></div>
  </div>;

  if (step === 2) return <div className={styles.definition}>
    <div className={styles.vague}><span>처음 떠오른 생각</span><p>“학교 앱을 더 편리하게 만들고 싶다.”</p></div>
    <div className={styles.connector}><ArrowDown size={17} aria-hidden="true" /><span>사용자와 상황을 넣으면</span></div>
    <div className={styles.problem}><span>해결하려는 문제</span><p><mark>학부모</mark>가 여러 채널의 공지를<br />따로 확인하다 <mark>신청 기한을 놓친다.</mark></p><div className={styles.problemKeys}><span>누가 · 학부모</span><span>언제 · 공지 확인</span><span>무엇을 · 기한 누락</span></div></div>
    <div className={styles.solution}><Check size={17} aria-hidden="true" /><div><span>이 문제에 맞는 해결 방향</span><p>공지를 한곳에 모으고, 마감 전에 알려주기</p></div></div>
  </div>;

  if (step === 3) return <div className={styles.people}>
    <div className={styles.person}><div className={styles.personHead}><span className={styles.monogram}>학</span><div><strong>학부모</strong><span>주요 사용자</span></div></div><dl><div><dt>현재 불편함</dt><dd>여러 채널을 오가다<br />신청 기한을 놓쳐요.</dd></div><div><dt>SW 사용 목적</dt><dd>필요한 공지만 빠르게 확인하고<br /><mark>기한 안에 신청하고 싶어요.</mark></dd></div></dl></div>
    <div className={styles.person}><div className={styles.personHead}><span className={styles.monogram}>교</span><div><strong>담임교사</strong><span>운영자</span></div></div><dl><div><dt>현재 불편함</dt><dd>같은 내용을 여러 번 안내하고<br />신청 여부를 확인해요.</dd></div><div><dt>SW 사용 목적</dt><dd>공지와 신청 현황을 한곳에서 보고<br /><mark>반복 안내를 줄이고 싶어요.</mark></dd></div></dl></div>
    <p className={styles.visualCaption}>대상이 달라지면 필요한 기능도 달라집니다.</p>
  </div>;

  if (step === 4) return <div className={styles.pipeline}>
    {[{ label: "입력", title: "학교·학년 선택", detail: "어떤 공지가 필요한가요?", values: "학교 이름, 학년" }, { label: "처리", title: "조건에 맞는 공지 조회", detail: "필요한 공지를 모아 정렬해요.", values: "학교·학년 필터 → 마감일 정렬" }, { label: "출력", title: "공지 목록 표시", detail: "사용자가 확인할 결과예요.", values: "제목, 신청 기한, 공지 링크" }].map((item, index) => <div key={item.label} className={styles.pipelineItem}><div className={styles.pipelineNode}>{index + 1}</div><div className={styles.pipelineCard}><span>{item.label}</span><strong>{item.title}</strong><p>{item.detail}</p><div>{item.values}</div></div></div>)}
    <p className={styles.visualCaption}>공지가 없다면? “해당 공지가 없어요” 안내도 결과예요.</p>
  </div>;

  return <div className={styles.proposal}>
    <div className={styles.paper}><div className={styles.paperHeading}><FileText size={18} aria-hidden="true" /><span>서비스 기획서 · 예시</span></div><h3>학교 공지를 한곳에</h3><p className={styles.paperIntro}>학부모를 위한 공지 통합 서비스</p>
      <dl>{[
        ["배경", "02 문제 정의", "공지가 흩어져 신청 기한을 놓치는 일이 생깁니다."],
        ["사용자", "03 이해관계자", "학부모는 공지를 확인하고, 교사는 공지를 관리합니다."],
        ["핵심 기능", "04 기능 설계", "학교·학년으로 공지를 모아 마감일 순으로 보여줍니다."],
        ["기대 효과", "문제와 연결", "기한 누락을 줄이고 반복 안내에 드는 수고를 덜고자 합니다."],
      ].map(([label, source, text]) => <div key={label}><dt><strong>{label}</strong><span>{source}</span></dt><dd>{text}</dd></div>)}</dl>
    </div>
  </div>;
}

export default function StepHelpDialog({ step, open, onOpenChange }: { step: HelpStep; open: boolean; onOpenChange: (open: boolean) => void }) {
  const returnFocus = useRef<HTMLElement | null>(null);
  const guide = GUIDES[step];
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className={styles.overlay} />
      <Dialog.Content className={styles.dialog} onOpenAutoFocus={() => {
        returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      }} onCloseAutoFocus={(event) => {
        if (returnFocus.current?.isConnected) {
          event.preventDefault();
          returnFocus.current.focus({ preventScroll: true });
        }
      }}>
        <header className={styles.header}>
          <p className={styles.eyebrow}><span>{String(step).padStart(2, "0")}</span>{STEPS[step - 1].label}<i aria-hidden="true" />사용 방법</p>
          <Dialog.Title className={styles.title}>{guide.title}</Dialog.Title>
          <Dialog.Description className={styles.description}>{guide.description}</Dialog.Description>
          <Dialog.Close className={styles.close} aria-label="사용 방법 닫기"><X size={20} /></Dialog.Close>
        </header>
        <div className={styles.body} role="region" aria-label="단계별 예시와 사용 안내" tabIndex={0}>
          <div className={styles.layout}>
            <figure className={styles.example}>
              <figcaption><span>예시로 이해하기</span><p>{guide.example}</p></figcaption>
              <Example step={step} />
            </figure>
            <section className={styles.instructions} aria-label="화면에서 따라 하기">
              <h3>화면에서는 이렇게</h3>
              <ol>{guide.actions.map(([title, detail], index) => <li key={title}><span className={styles.actionNumber}>{String(index + 1).padStart(2, "0")}</span><div><h4>{title}</h4><p>{detail}</p></div></li>)}</ol>
              <div className={styles.takeaway}><span><Check size={15} aria-hidden="true" />이번 단계에서 남길 것</span><p>{guide.takeaway}</p></div>
            </section>
          </div>
        </div>
        <footer className={styles.footer}><p><Save size={15} aria-hidden="true" />{guide.note}</p><Dialog.Close className={styles.start}>직접 해볼게요<ArrowRight size={15} aria-hidden="true" /></Dialog.Close></footer>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
