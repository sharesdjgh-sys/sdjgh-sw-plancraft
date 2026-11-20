"use strict";
(() => {
  const screens = [
    ["home", "히어로", "오로라 배경, 워드마크, 예시 장면과 시작 버튼의 변화를 비교해 보세요."],
    ["dashboard", "작업 공간", "헤더부터 프로젝트 카드, 6단계 안내까지 전체 화면 구성을 비교합니다."],
    ["guide", "사용 가이드", "서비스의 공통 디자인과 단계별 안내가 어떻게 정리되었는지 확인해 보세요."],
    ["idea", "01 아이디어 발굴", "기획 여정 사이드바와 아이디어봇 대화, 안내 방식의 변화입니다."],
    ["story", "02 문제 정의", "입력 영역, AI 도우미와 사이드바의 위계와 가독성을 비교합니다."],
    ["characters", "03 사용자 분석", "사용자 정보와 작업 도구가 배치된 방식을 비교합니다."],
    ["episodes", "04 기능 설계", "기능 카드와 편집 화면의 공간 활용을 확인해 보세요."],
    ["script", "05 기획서 작성", "기획서 편집 화면과 상단 도구, 안내 영역의 변화입니다."],
    ["submit", "06 최종 검토", "최종 검토와 다운로드까지 이어지는 화면을 비교합니다."]
  ];
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.hash.slice(1));
  let selected = screens.some(screen => screen[0] === params.get("screen")) ? params.get("screen") : "home";
  let viewport = params.get("viewport") === "mobile" ? "mobile" : "desktop";
  let mode = params.get("mode") === "overlay" ? "overlay" : "split";
  const comparison = $("comparison");
  const nav = $("screen-nav");
  for (const [id, label] of screens) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.screen = id;
    button.addEventListener("click", () => { selected = id; render(); });
    nav.append(button);
  }
  function render() {
    const index = screens.findIndex(screen => screen[0] === selected);
    const [, label, description] = screens[index];
    $("screen-title").textContent = label;
    $("screen-description").textContent = description;
    $("screen-count").textContent = `${String(index + 1).padStart(2, "0")} / 09`;
    $("load-error").hidden = true;
    for (const version of ["before", "after"]) {
      const src = `shots/${selected}-${version}-${viewport}.png`;
      for (const id of [`${version}-image`, `overlay-${version}`]) {
        const img = $(id);
        img.width = viewport === "mobile" ? 390 : 1440;
        img.height = viewport === "mobile" ? 844 : 1000;
        img.alt = `${label} · ${version === "before" ? "개선 전 GitHub" : "개선 후 현재"} · ${viewport === "mobile" ? "모바일" : "데스크톱"}`;
        img.onerror = () => { $("load-error").hidden = false; };
        if (!img.src.endsWith(src)) img.src = src;
      }
      $(`${version}-original`).href = src;
    }
    comparison.dataset.viewport = viewport;
    comparison.dataset.mode = mode;
    comparison.querySelector(".split-view").hidden = mode !== "split";
    comparison.querySelector(".overlay-view").hidden = mode !== "overlay";
    for (const button of document.querySelectorAll("[data-screen]")) button.setAttribute("aria-pressed", String(button.dataset.screen === selected));
    for (const button of document.querySelectorAll("button[data-viewport]")) button.setAttribute("aria-pressed", String(button.dataset.viewport === viewport));
    for (const button of document.querySelectorAll("button[data-mode]")) button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
    $("comparison-note").textContent = `${viewport === "mobile" ? "390 × 844" : "1440 × 1000"} px · ${mode === "split" ? "같은 크기로 캡처한 실제 화면입니다. 원본 보기로 세부 내용을 확인할 수 있습니다." : "왼쪽은 Before, 오른쪽은 After입니다. 슬라이더는 방향키로도 조절할 수 있습니다."}`;
    for (const canvas of comparison.querySelectorAll(".canvas,.overlay-scroll")) { canvas.scrollTop = 0; canvas.scrollLeft = 0; }
    history.replaceState(null, "", `#screen=${selected}&viewport=${viewport}&mode=${mode}`);
  }
  for (const button of document.querySelectorAll("button[data-viewport]")) button.addEventListener("click", () => { viewport = button.dataset.viewport; render(); });
  for (const button of document.querySelectorAll("button[data-mode]")) button.addEventListener("click", () => { mode = button.dataset.mode; render(); });
  $("zoom").addEventListener("change", event => { comparison.dataset.zoom = event.target.value; });
  $("reveal").addEventListener("input", event => {
    const value = Number(event.target.value);
    comparison.style.setProperty("--split", `${value}%`);
    $("reveal-value").value = `${value}%`;
    event.target.setAttribute("aria-valuetext", `Before ${value}%, After ${100 - value}%`);
  });
  render();
})();
