import { type Project, getProjects, saveProjects } from "./storage";

function triggerDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── JSON 백업 / 복원 ───────────────────────────────────────────

export function exportAllProjects() {
  const data = JSON.stringify(getProjects(), null, 2);
  const date = new Date().toISOString().slice(0, 10);
  triggerDownload(`plancraft_backup_${date}.json`, data, "application/json");
}

export function importProjects(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!Array.isArray(parsed)) throw new Error();
        saveProjects(parsed);
        resolve();
      } catch {
        reject(new Error("올바른 백업 파일이 아니에요."));
      }
    };
    reader.readAsText(file);
  });
}

// ─── 스텝별 텍스트 다운로드 ────────────────────────────────────

export function downloadStory(project: Project) {
  const s = project.story;
  const lines = [
    `[ ${project.title} — 문제 정의 ]`,
    `작성자: ${project.author || "(미입력)"}`,
    `작성일: ${new Date().toLocaleDateString("ko-KR")}`,
    "",
    "=== 아이디어 한 줄 소개 ===",
    s.logline || "(미작성)",
    "",
    "=== 해결하려는 문제 ===",
    s.theme || "(미작성)",
    "",
    "=== 배경 및 필요성 ===",
    s.setting || "(미작성)",
    "",
    "=== 기능 개요 ===",
    s.plotOutline || "(미작성)",
    "",
    `총 기능 수: ${s.totalEpisodes}개`,
  ];
  triggerDownload(`${project.title}_문제정의.txt`, lines.join("\n"), "text/plain;charset=utf-8");
}

export function downloadCharacters(project: Project) {
  const lines = [
    `[ ${project.title} — 이해관계자 분석 ]`,
    `작성일: ${new Date().toLocaleDateString("ko-KR")}`,
    "",
  ];
  if (project.characters.length === 0) {
    lines.push("(등록된 이해관계자 없음)");
  } else {
    project.characters.forEach((ch, i) => {
      lines.push(`── 이해관계자 ${i + 1}: ${ch.name || "이름 없음"} ──`);
      lines.push(`역할: ${ch.role}`);
      if (ch.age) lines.push(`연령/특성: ${ch.age}`);
      if (ch.appearance) lines.push(`현재 불편함: ${ch.appearance}`);
      if (ch.personality) lines.push(`SW 사용 목적: ${ch.personality}`);
      if (ch.backstory) lines.push(`SW와의 관계: ${ch.backstory}`);
      lines.push("");
    });
  }
  triggerDownload(`${project.title}_이해관계자.txt`, lines.join("\n"), "text/plain;charset=utf-8");
}

export function downloadEpisode(project: Project, episodeIndex: number) {
  const ep = project.episodes[episodeIndex];
  if (!ep) return;
  const lines = [
    `[ ${project.title} — 기능 ${ep.episodeNumber} ]`,
    `작성일: ${new Date().toLocaleDateString("ko-KR")}`,
    "",
    `기능명: ${ep.title || "(미입력)"}`,
    "",
    "=== 기능 설명 ===",
    ep.synopsis || "(미작성)",
  ];

  const cuts = ep.cuts ?? [];
  if (cuts.length > 0) {
    lines.push("", "=== 처리 단계 ===");
    cuts.forEach((cut, i) => {
      lines.push(``, `[ 단계 ${i + 1} — ${cut.angle} ]`);
      if (cut.description) lines.push(`동작 설명: ${cut.description}`);
      if (cut.dialogue) lines.push(`입력 데이터: ${cut.dialogue}`);
      if (cut.soundEffect) lines.push(`출력/결과: ${cut.soundEffect}`);
    });
  }

  lines.push("", "=== 기획서 내용 ===", ep.script || "(미작성)");

  triggerDownload(
    `${project.title}_기능${ep.episodeNumber}.txt`,
    lines.join("\n"),
    "text/plain;charset=utf-8"
  );
}

export function downloadAllEpisodes(project: Project) {
  const lines = [
    `[ ${project.title} — 전체 기능 설계 & 기획서 ]`,
    `작성일: ${new Date().toLocaleDateString("ko-KR")}`,
    "",
  ];
  project.episodes.forEach((ep) => {
    lines.push(`${"═".repeat(40)}`);
    lines.push(`기능 ${ep.episodeNumber}: ${ep.title || "(이름 없음)"}`);
    lines.push(`${"═".repeat(40)}`);
    if (ep.synopsis) { lines.push("[ 기능 설명 ]"); lines.push(ep.synopsis); lines.push(""); }

    const cuts = ep.cuts ?? [];
    if (cuts.length > 0) {
      lines.push("[ 처리 단계 ]");
      cuts.forEach((cut, i) => {
        lines.push(`단계 ${i + 1} (${cut.angle})${cut.description ? ` — ${cut.description}` : ""}`);
        if (cut.dialogue) lines.push(`  입력 데이터: ${cut.dialogue}`);
        if (cut.soundEffect) lines.push(`  출력/결과: ${cut.soundEffect}`);
      });
      lines.push("");
    }

    lines.push("[ 기획서 내용 ]");
    lines.push(ep.script || "(미작성)");
    lines.push("");
  });
  triggerDownload(`${project.title}_전체기능.txt`, lines.join("\n"), "text/plain;charset=utf-8");
}

export function downloadProposalScript(project: Project) {
  const lines = [
    `[ ${project.title} — 기획서 ]`,
    project.author ? `작성자: ${project.author}` : "",
    `작성일: ${new Date().toLocaleDateString("ko-KR")}`,
    "",
    project.proposalScript || "(미작성)",
  ].filter(Boolean);
  triggerDownload(`${project.title}_기획서.txt`, lines.join("\n"), "text/plain;charset=utf-8");
}

export function downloadFullSummary(project: Project) {
  const s = project.story;
  const lines = [
    `[ ${project.title} — 최종 제출 요약 ]`,
    project.author ? `작성자: ${project.author}` : "",
    `작성일: ${new Date().toLocaleDateString("ko-KR")}`,
    project.targetCompetition ? `대상 공모전: ${project.targetCompetition}` : "",
    "",
    "═══ 문제 정의 ═══",
    `한 줄 소개: ${s.logline || "(미작성)"}`,
    `해결하려는 문제: ${s.theme || "(미작성)"}`,
    `배경 및 필요성: ${s.setting || "(미작성)"}`,
    "",
    "기능 개요:",
    s.plotOutline || "(미작성)",
    "",
    "═══ 이해관계자 분석 ═══",
    ...project.characters.flatMap((ch) => [
      `▸ ${ch.name} (${ch.role}${ch.age ? `, ${ch.age}` : ""})`,
      ch.appearance ? `  현재 불편함: ${ch.appearance}` : "",
      ch.personality ? `  SW 사용 목적: ${ch.personality}` : "",
      ch.backstory ? `  SW와의 관계: ${ch.backstory}` : "",
      "",
    ]),
    "═══ 기능 설계 ═══",
    ...project.episodes.flatMap((ep) => {
      const cutLines: string[] = [];
      const cuts = ep.cuts ?? [];
      if (cuts.length > 0) {
        cutLines.push("  [ 처리 단계 ]");
        cuts.forEach((cut, i) => {
          cutLines.push(`  단계 ${i + 1} (${cut.angle})${cut.description ? ` — ${cut.description}` : ""}`);
          if (cut.dialogue) cutLines.push(`    입력 데이터: ${cut.dialogue}`);
          if (cut.soundEffect) cutLines.push(`    출력/결과: ${cut.soundEffect}`);
        });
        cutLines.push("");
      }
      return [
        `[ 기능 ${ep.episodeNumber}: ${ep.title || "이름 없음"} ]`,
        ep.synopsis ? `기능 설명: ${ep.synopsis}` : "",
        "",
        ...cutLines,
      ];
    }),
    "═══ 기획서 ═══",
    project.proposalScript || "(미작성)",
    "",
  ].filter((l) => l !== undefined);
  triggerDownload(`${project.title}_최종요약.txt`, lines.join("\n"), "text/plain;charset=utf-8");
}
