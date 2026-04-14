"use client";

import { useMemo, useState } from "react";

const DEFAULT_RESULT = `제품 소개: |
  설명 생성 버튼을 누르면 여기에 결과가 표시됩니다.

특징 및 장점: |
  추출된 정보와 추가 검색 결과를 바탕으로 내용을 정리합니다.

강조 포인트: |
  생성 후 아래에서 추가 반영 요청이 가능합니다.`;

export default function HomePage() {
  const [productLink, setProductLink] = useState("");
  const [storeName, setStoreName] = useState("");
  const [productName, setProductName] = useState("");
  const [statusText, setStatusText] = useState(
    "상품 링크 또는 추가 검색 정보를 바탕으로 설명 생성을 준비 중입니다.",
  );
  const [statusBadge, setStatusBadge] = useState("대기 중");
  const [statusError, setStatusError] = useState(false);

  const [resultText, setResultText] = useState(DEFAULT_RESULT);
  const [followupRequest, setFollowupRequest] = useState("");
  const [showFollowup, setShowFollowup] = useState(false);

  const [collecting, setCollecting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [refining, setRefining] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);

  const setStatus = (text: string, badge: string, isError = false) => {
    setStatusText(text);
    setStatusBadge(badge);
    setStatusError(isError);
  };

  const cleanResult = (text: string) => {
    return text
      .replace(/```yaml/g, "")
      .replace(/```/g, "")
      .trim();
  };

  const formattedSections = useMemo(() => {
    const blocks = resultText
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean);

    return blocks.map((block, index) => {
      const [rawTitle, ...rest] = block.split("\n");
      const title = rawTitle.replace(/\|/g, "").trim();
      const body = rest.join("\n").trim() || rawTitle;

      return {
        id: `${index}-${title}`,
        title,
        body,
      };
    });
  }, [resultText]);

  const handleCollectProductInfo = async () => {
    if (!productLink.trim()) {
      setStatus("상품 링크를 먼저 입력해 주세요.", "입력 필요", true);
      return;
    }

    setCollecting(true);
    setStatus("상품 정보를 수집하고 있습니다.", "수집 중");

    try {
      const response = await fetch("/api/extract-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productLink,
          storeName,
          productName,
        }),
      });

      if (!response.ok) {
        throw new Error("상품 정보 수집에 실패했습니다.");
      }

      const data = await response.json();

      if (data.storeName) setStoreName(data.storeName);
      if (data.productName) setProductName(data.productName);

      setStatus(
        "기본 수집이 완료되었습니다. 이제 설명 생성을 진행할 수 있습니다.",
        "수집 완료",
      );
    } catch (error) {
      console.error(error);
      setStatus(
        "기본 정보 수집에는 실패했지만, 입력된 스토어명과 상품명으로 설명 생성을 시도할 수 있습니다.",
        "보완 필요",
        true,
      );
    } finally {
      setCollecting(false);
    }
  };

  const handleGenerateDescription = async () => {
    setGenerating(true);
    setStatus("설명을 생성하고 있습니다.", "생성 중");

    try {
      const response = await fetch("/api/generate-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productLink,
          storeName,
          productName,
          followupRequest: "",
          previousResult: "",
        }),
      });

      if (!response.ok) {
        throw new Error("설명 생성에 실패했습니다.");
      }

      const data = await response.json();
      setResultText(cleanResult(data.result || "생성된 결과가 없습니다."));
      setShowFollowup(true);
      setStatus("설명 생성이 완료되었습니다.", "생성 완료");
    } catch (error) {
      console.error(error);
      setStatus(
        "설명 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        "오류",
        true,
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateWithFollowup = async () => {
    if (!followupRequest.trim()) {
      setStatus("추가로 반영할 내용을 입력해 주세요.", "입력 필요", true);
      return;
    }

    setRefining(true);
    setStatus("추가 요청을 반영해 결과를 다시 생성하고 있습니다.", "재생성 중");

    try {
      const response = await fetch("/api/generate-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productLink,
          storeName,
          productName,
          followupRequest,
          previousResult: resultText,
        }),
      });

      if (!response.ok) {
        throw new Error("재생성에 실패했습니다.");
      }

      const data = await response.json();
      setResultText(cleanResult(data.result || "생성된 결과가 없습니다."));
      setStatus("추가 요청이 반영되었습니다.", "반영 완료");
    } catch (error) {
      console.error(error);
      setStatus(
        "추가 반영에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        "오류",
        true,
      );
    } finally {
      setRefining(false);
    }
  };

  const handleReset = () => {
    setProductLink("");
    setStoreName("");
    setProductName("");
    setFollowupRequest("");
    setResultText(DEFAULT_RESULT);
    setShowFollowup(false);
    setStatus(
      "상품 링크 또는 추가 검색 정보를 바탕으로 설명 생성을 준비합니다.",
      "대기 중",
    );
    setStatusError(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resultText);
      setCopyDone(true);
      setShowCopyToast(true);
      setTimeout(() => setCopyDone(false), 1200);
      setTimeout(() => setShowCopyToast(false), 1800);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="page">
        <div className="hero">
          <div className="hero-card">
            <div className="hero-left">
              <div className="hero-badge">SUNGHYUN-SYSTEM</div>
              <h1 className="hero-title">스마트스토어 상품설명 추출기</h1>
              <p className="hero-text">
                상품 링크와 기본 정보를 바탕으로 블로그·상세페이지용 설명 문안을
                빠르게 정리할 수 있습니다.
              </p>
            </div>

            <div className="hero-right">
              <div className="hero-chip">Smartstore Workflow</div>
              <div className="hero-chip">Auto Copy Ready</div>
            </div>
          </div>
        </div>

        <section className="variant-card">
          <div className="frame">
            <div className="app-shell layout-a">
              <div className="glass-panel">
                <div className="eyebrow">Content Generator</div>
                <h3 className="title title-spaced">상품 정보 입력</h3>

                <div className="field">
                  <label>상품 링크</label>
                  <div className="input-row">
                    <input
                      value={productLink}
                      onChange={(e) => setProductLink(e.target.value)}
                      placeholder="https://smartstore.naver.com/... 형식의 링크를 입력해 주세요."
                    />
                    <button
                      className="secondary action-button"
                      onClick={handleCollectProductInfo}
                      disabled={collecting}
                    >
                      {collecting ? "수집 중..." : "수집"}
                    </button>
                  </div>
                </div>

                <div
                  className={`status-box ${statusError ? "status-error" : ""}`}
                >
                  <div>
                    <strong>수집 상태</strong>
                    <span>{statusText}</span>
                  </div>
                  <div
                    className={`badge ${statusError ? "badge-error" : "badge-normal"}`}
                  >
                    {statusBadge}
                  </div>
                </div>

                <div className="two-col top-gap">
                  <div className="field">
                    <label>스토어명</label>
                    <input
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="스토어명을 입력하세요"
                    />
                  </div>
                  <div className="field">
                    <label>상품명</label>
                    <input
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="상품명을 입력하세요"
                    />
                  </div>
                </div>

                <div className="sub-note">
                  <p>링크 기반으로 기본 정보를 먼저 수집합니다.</p>
                  <p>
                    스토어명과 상품명을 함께 입력하면 결과 품질이 더 좋아집니다.
                  </p>
                  <p>정확한 입력일수록 문안 생성 결과도 더 안정적입니다.</p>
                </div>

                <div className="actions">
                  <button
                    className="primary strong-cta"
                    onClick={handleGenerateDescription}
                    disabled={generating}
                  >
                    {generating ? (
                      <span className="loading-inline">
                        생성 중
                        <span className="dot-flow">
                          <span>.</span>
                          <span>.</span>
                          <span>.</span>
                        </span>
                      </span>
                    ) : (
                      "설명 생성"
                    )}
                  </button>
                  <button className="secondary" onClick={handleReset}>
                    초기화
                  </button>
                </div>
              </div>

              <div className="glass-result">
                <div className="result-toolbar">
                  <div>
                    <div className="eyebrow result-eyebrow">Generated Copy</div>
                    <h3>생성 결과</h3>
                    <p>복사 후 바로 활용할 수 있도록 문단형으로 정리됩니다.</p>
                  </div>
                  <button
                    className="secondary copy-button"
                    onClick={handleCopy}
                  >
                    {copyDone ? "복사 완료" : "전체 복사"}
                  </button>
                </div>

                <div className="result-card">
                  <div className="result-grid">
                    {formattedSections.map((section) => (
                      <div key={section.id} className="result-section">
                        <div className="result-section-title">
                          {section.title}
                        </div>
                        <div className="result-section-body">
                          {section.body}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className={`followup-box ${showFollowup ? "is-visible" : ""}`}
                >
                  <label>추가로 강조하고 싶은 내용</label>
                  <textarea
                    value={followupRequest}
                    onChange={(e) => setFollowupRequest(e.target.value)}
                    placeholder="예: 기호성이 높은 점을 더 강조해줘, 노령묘도 먹기 편한 부분을 반영해줘"
                  />
                  <div className="followup-actions">
                    <button
                      className="primary"
                      onClick={handleRegenerateWithFollowup}
                      disabled={refining}
                    >
                      {refining ? "반영 중..." : "추가 반영 후 재생성"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {showCopyToast && <div className="copy-toast">복사 완료</div>}
      </div>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        :root {
          --bg: #07111f;
          --panel: rgba(255, 255, 255, 0.08);
          --panel-strong: rgba(255, 255, 255, 0.1);
          --line: rgba(255, 255, 255, 0.12);
          --line-soft: rgba(255, 255, 255, 0.07);
          --text: #ecf3ff;
          --muted: #a7b4cb;
          --accent: #7c3aed;
          --accent-2: #2563eb;
          --accent-3: #06b6d4;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          font-family:
            Inter,
            "Noto Sans KR",
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          background:
            radial-gradient(
              circle at top left,
              rgba(124, 58, 237, 0.22),
              transparent 26%
            ),
            radial-gradient(
              circle at top right,
              rgba(6, 182, 212, 0.12),
              transparent 24%
            ),
            linear-gradient(180deg, #08111e 0%, #0a1324 100%);
          color: var(--text);
        }

        body {
          min-height: 100vh;
        }

        .page {
          max-width: 1440px;
          margin: 0 auto;
          padding: 34px 20px 60px;
        }

        .hero {
          margin-bottom: 18px;
        }

        .hero-card {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          width: 100%;
          padding: 22px 24px;
          border: 1px solid var(--line-soft);
          border-radius: 28px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.055),
            rgba(255, 255, 255, 0.02)
          );
          backdrop-filter: blur(18px);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.2);
        }

        .hero-left {
          max-width: 760px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.05);
          color: #d7e4ff;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 14px;
        }

        .hero-title {
          margin: 0;
          font-size: 36px;
          font-weight: 800;
          line-height: 1.14;
          letter-spacing: -0.04em;
          color: #f5f8ff;
          text-shadow: 0 2px 12px rgba(124, 58, 237, 0.25);
        }

        .hero-text {
          margin: 12px 0 0;
          font-size: 15px;
          color: #a7b4cb;
          line-height: 1.72;
          max-width: 700px;
        }

        .hero-right {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
          align-self: flex-start;
          padding-top: 8px;
        }

        .hero-chip {
          padding: 10px 14px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #dce8ff;
          font-size: 12px;
          font-weight: 700;
        }

        .variant-card {
          border: 1px solid var(--line);
          border-radius: 30px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(20px);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
        }

        .frame {
          padding: 20px;
        }

        .app-shell {
          border-radius: 26px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.07);
        }

        .layout-a {
          display: grid;
          grid-template-columns: 1.02fr 0.98fr;
          min-height: 720px;
        }

        .glass-panel {
          padding: 28px;
          background: rgba(255, 255, 255, 0.05);
          border-right: 1px solid rgba(255, 255, 255, 0.06);
        }

        .glass-result {
          padding: 28px;
          background: linear-gradient(
            180deg,
            rgba(10, 18, 32, 0.98),
            rgba(14, 22, 38, 0.96)
          );
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 13px;
          border-radius: 999px;
          margin-bottom: 16px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #dce8ff;
          font-size: 12px;
          font-weight: 700;
        }

        .result-eyebrow {
          margin-bottom: 12px;
        }

        .title {
          margin: 0;
          font-size: 28px;
          line-height: 1.2;
          letter-spacing: -0.03em;
        }

        .title-spaced {
          margin-bottom: 28px;
        }

        .field {
          margin-bottom: 16px;
        }

        .field label {
          display: block;
          margin-bottom: 8px;
          color: #e8f1ff;
          font-size: 13px;
          font-weight: 700;
        }

        .input-row {
          display: grid;
          grid-template-columns: 1fr 132px;
          gap: 10px;
        }

        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .top-gap {
          margin-top: 16px;
        }

        textarea,
        input {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.06);
          color: #f4f8ff;
          border-radius: 18px;
          padding: 15px 16px;
          font-size: 14px;
          outline: none;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
          font-family: inherit;
          transition:
            border-color 0.18s ease,
            background 0.18s ease,
            box-shadow 0.18s ease;
        }

        textarea {
          resize: vertical;
          min-height: 108px;
        }

        textarea::placeholder,
        input::placeholder {
          color: #8fa1bf;
        }

        textarea:focus,
        input:focus {
          border-color: rgba(125, 58, 237, 0.45);
          background: rgba(255, 255, 255, 0.075);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            0 0 0 4px rgba(124, 58, 237, 0.12);
        }

        .sub-note {
          margin-top: 12px;
          color: #b9c7de;
          font-size: 13px;
          line-height: 1.75;
        }

        .sub-note p {
          margin: 0;
        }

        .sub-note p + p {
          margin-top: 4px;
        }

        .status-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 15px 16px;
          margin-bottom: 18px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.07);
        }

        .status-error {
          background: rgba(239, 68, 68, 0.09);
          border-color: rgba(248, 113, 113, 0.14);
        }

        .status-box strong {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
        }

        .status-box span {
          color: #9eb0cb;
          font-size: 13px;
          line-height: 1.6;
        }

        .badge {
          padding: 9px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .badge-error {
          color: #ffe5e5;
          background: rgba(239, 68, 68, 0.13);
          border: 1px solid rgba(248, 113, 113, 0.18);
        }

        .badge-normal {
          color: #dbeafe;
          background: rgba(59, 130, 246, 0.14);
          border: 1px solid rgba(96, 165, 250, 0.18);
        }

        .actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        button {
          border: 0;
          border-radius: 18px;
          padding: 14px 18px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition:
            transform 0.18s ease,
            opacity 0.18s ease,
            box-shadow 0.18s ease,
            background 0.18s ease,
            border-color 0.18s ease;
        }

        button:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .primary {
          color: #fff;
          background: linear-gradient(135deg, #7c3aed, #2563eb 72%, #06b6d4);
          box-shadow: 0 16px 40px rgba(37, 99, 235, 0.2);
        }

        .primary:hover:not(:disabled) {
          box-shadow: 0 20px 46px rgba(37, 99, 235, 0.28);
        }

        .strong-cta {
          min-width: 160px;
          padding-inline: 24px;
          box-shadow:
            0 18px 44px rgba(37, 99, 235, 0.24),
            inset 0 1px 0 rgba(255, 255, 255, 0.16);
        }

        .strong-cta:hover:not(:disabled) {
          box-shadow:
            0 22px 52px rgba(37, 99, 235, 0.32),
            inset 0 1px 0 rgba(255, 255, 255, 0.18);
        }

        .secondary {
          color: #eef3ff;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.09);
        }

        .secondary:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.14);
        }

        .action-button {
          color: #f3f7ff;
        }

        .loading-inline {
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }

        .dot-flow {
          display: inline-flex;
          min-width: 18px;
        }

        .dot-flow span {
          display: inline-block;
          animation: dotBlink 1.2s infinite;
        }

        .dot-flow span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .dot-flow span:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes dotBlink {
          0%,
          20% {
            opacity: 0.25;
            transform: translateY(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-1px);
          }
          100% {
            opacity: 0.25;
            transform: translateY(0);
          }
        }

        .result-toolbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .result-toolbar h3 {
          margin: 0 0 8px;
          font-size: 24px;
          letter-spacing: -0.02em;
        }

        .result-toolbar p {
          margin: 0;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.6;
        }

        .copy-button {
          min-width: 120px;
          white-space: nowrap;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .result-card {
          border-radius: 24px;
          padding: 22px;
          min-height: 560px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.055),
            rgba(255, 255, 255, 0.03)
          );
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        .result-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .result-section {
          padding: 16px 16px 15px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.045);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .result-section-title {
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: #ffffff;
        }

        .result-section-body {
          color: #d8e4fb;
          font-size: 14px;
          line-height: 1.85;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .followup-box {
          margin-top: 18px;
          padding: 18px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          opacity: 0;
          max-height: 0;
          overflow: hidden;
          transform: translateY(10px);
          pointer-events: none;
          transition:
            opacity 0.35s ease,
            max-height 0.4s ease,
            transform 0.35s ease,
            margin-top 0.35s ease,
            padding 0.35s ease;
          margin-top: 0;
          padding-top: 0;
          padding-bottom: 0;
        }

        .followup-box.is-visible {
          opacity: 1;
          max-height: 260px;
          transform: translateY(0);
          pointer-events: auto;
          margin-top: 18px;
          padding-top: 18px;
          padding-bottom: 18px;
        }

        .followup-box label {
          display: block;
          margin-bottom: 10px;
          color: #e8f1ff;
          font-size: 13px;
          font-weight: 700;
        }

        .followup-box textarea {
          min-height: 110px;
          border-radius: 16px;
        }

        .followup-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 12px;
        }

        .copy-toast {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 50;
          padding: 12px 14px;
          border-radius: 14px;
          background: rgba(12, 18, 32, 0.92);
          color: #f5f8ff;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
          font-size: 13px;
          font-weight: 700;
          backdrop-filter: blur(12px);
        }

        @media (max-width: 1180px) {
          .layout-a {
            grid-template-columns: 1fr;
          }

          .glass-panel {
            border-right: 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }

          .hero-card {
            flex-direction: column;
            align-items: flex-start;
          }

          .hero-right {
            justify-content: flex-start;
          }
        }

        @media (max-width: 720px) {
          .page {
            padding: 22px 14px 36px;
          }

          .frame,
          .glass-panel,
          .glass-result {
            padding: 18px;
          }

          .hero-title {
            font-size: 30px;
          }

          .input-row,
          .two-col {
            grid-template-columns: 1fr;
          }

          .result-toolbar {
            display: block;
          }

          .copy-button {
            margin-top: 12px;
          }

          .actions {
            flex-wrap: wrap;
          }

          .result-card {
            min-height: 420px;
          }

          .copy-toast {
            right: 14px;
            bottom: 14px;
          }
        }
      `}</style>
    </>
  );
}
