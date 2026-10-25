/* =========================================================
   Check 관리자 대시보드 스크립트 (/admin 전용)
   - 서버 API 헤더(x-admin-password) 기반 엄격한 인증
   - 시연용 가상 데이터(Seed) vs 실제 고객 응답(Real) 토글 필터링
   - 신청자 개인정보 개별 즉시 삭제 (DELETE /api/admin/leads/:id)
   - UTF-8 BOM 적용 CSV 다운로드 (fetch + Blob 방식으로 헤더 인증 유지)
   ========================================================= */

(function () {
  const SESSION_KEY = 'check_admin_pw';

  const loginView = document.getElementById('admin-login-view');
  const dashboardView = document.getElementById('admin-dashboard-view');
  const loginForm = document.getElementById('admin-login-form');
  const passwordInput = document.getElementById('admin-password-input');
  const loginError = document.getElementById('admin-login-error');

  // 필터 탭 DOM
  const filterTabBtns = document.querySelectorAll('.filter-tab-btn');
  const tabFilterAll = document.getElementById('tab-filter-all');
  const tabFilterReal = document.getElementById('tab-filter-real');
  const tabFilterSeed = document.getElementById('tab-filter-seed');
  const filterStatusDesc = document.getElementById('filter-status-desc');

  // KPI DOM
  const kpiTotalResponses = document.getElementById('kpi-total-responses');
  const kpiTotalLeads = document.getElementById('kpi-total-leads');
  const kpiConversionRate = document.getElementById('kpi-conversion-rate');
  const kpiInterviewCount = document.getElementById('kpi-interview-count');
  const kpiConsentRate = document.getElementById('kpi-consent-rate');
  const kpiConsentSub = document.getElementById('kpi-consent-sub');

  // 컨테이너 DOM
  const typeStatsContainer = document.getElementById('type-stats-container');
  const questionStatsContainer = document.getElementById('question-stats-container');
  const leadsTableBody = document.getElementById('leads-table-body');
  const leadsCountBadge = document.getElementById('leads-count-badge');
  const responsesTableBody = document.getElementById('responses-table-body');
  const responsesCountBadge = document.getElementById('responses-count-badge');

  // 액션 버튼
  const btnRefreshStats = document.getElementById('btn-refresh-stats');
  const btnClearSeed = document.getElementById('btn-clear-seed');
  const btnResetSeed = document.getElementById('btn-reset-seed');
  const btnLogout = document.getElementById('btn-logout');
  const btnExportResponses = document.getElementById('btn-export-responses');
  const btnExportPdf = document.getElementById('btn-export-pdf');
  const btnExportLeads = document.getElementById('btn-export-leads');

  let currentPassword = sessionStorage.getItem(SESSION_KEY) || '';
  let currentFilter = 'all'; // 'all' | 'real' | 'seed'

  const SHORT_LABELS = {
    share_group_chat: '가족 전체 단톡방에서 공유해요',
    share_selected_family: '필요한 가족만 선택해 따로 소통해요',
    share_visit_summary: '병원 방문 전후로 필요한 기록만 공유해요',
    share_parent_consent: '부모님 사전 동의 후 허용된 항목만 공유해요',
    share_none_exp: '공유한 경험이 없어요',
    feat_calendar: '날짜별 건강 달력',
    feat_med_list: '복용약·처방전 정리',
    feat_visit_card: '병원 방문 준비 카드',
    feat_selective_share: '가족별 선택적 공유·소통',
    feat_current_enough: '지금 방식으로 충분해요',
    freq_5_plus: '5번 이상 있었어요',
    freq_3_4: '3~4번 있었어요',
    freq_1_2: '1~2번 있었어요',
    freq_zero: '한 번도 없었어요',
    freq_no_help: '최근 6개월 동안 도운 적 없음',
    age_20s: '20대',
    age_30s: '30대',
    age_40s: '40대',
    age_50_plus: '50대 이상'
  };

  if (currentPassword) {
    fetchDashboardStats(currentPassword, currentFilter, true);
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    const pw = passwordInput.value.trim();
    if (!pw) return;
    await fetchDashboardStats(pw, currentFilter, false);
  });

  // 필터 탭 전환 이벤트
  filterTabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const selectedFilter = btn.getAttribute('data-filter') || 'all';
      currentFilter = selectedFilter;
      filterTabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      if (currentFilter === 'real') {
        filterStatusDesc.textContent = '현재 [실제 고객 응답(Real)] 데이터만 필터링하여 표시하고 있습니다.';
      } else if (currentFilter === 'seed') {
        filterStatusDesc.textContent = '현재 [시연용 가상 데이터(Seed)]만 필터링하여 표시하고 있습니다.';
      } else {
        filterStatusDesc.textContent = '현재 전체 데이터(시연용 Seed + 실제 고객 응답 Real)를 함께 표시하고 있습니다.';
      }

      if (currentPassword) {
        fetchDashboardStats(currentPassword, currentFilter, false);
      }
    });
  });

  async function fetchDashboardStats(pw, filterMode, silentOnFail) {
    try {
      const res = await fetch(`/api/admin/stats?filter=${encodeURIComponent(filterMode)}`, {
        method: 'GET',
        headers: {
          'x-admin-password': pw
        }
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        sessionStorage.removeItem(SESSION_KEY);
        currentPassword = '';
        if (!silentOnFail) {
          loginError.textContent = json.message || '비밀번호가 올바르지 않습니다.';
          loginError.classList.remove('hidden');
        }
        return;
      }

      currentPassword = pw;
      sessionStorage.setItem(SESSION_KEY, pw);
      loginView.classList.add('hidden');
      dashboardView.classList.remove('hidden');

      renderDashboard(json);
    } catch (err) {
      if (!silentOnFail) {
        loginError.textContent = '서버와 통신 중 오류가 발생했습니다.';
        loginError.classList.remove('hidden');
      }
    }
  }

  function formatDateTime(isoStr) {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (e) {
      return isoStr;
    }
  }

  function renderDashboard(data) {
    const { kpi, countsSummary, typeStats, questionStats, leads, responses } = data;

    // 상단 필터 탭 카운트 업데이트
    if (countsSummary) {
      tabFilterAll.textContent = `전체 보기 (설문 ${countsSummary.allResponses} · 신청 ${countsSummary.allLeads})`;
      tabFilterReal.textContent = `실제 고객 응답만 (설문 ${countsSummary.realResponses} · 신청 ${countsSummary.realLeads})`;
      tabFilterSeed.textContent = `시연용 가상 데이터만 (설문 ${countsSummary.seedResponses} · 신청 ${countsSummary.seedLeads})`;
    }

    // 1. KPI 업데이트
    kpiTotalResponses.textContent = `${kpi.totalResponses}명`;
    kpiTotalLeads.textContent = `${kpi.totalLeads}명`;
    kpiConversionRate.textContent = `${kpi.conversionRate}%`;
    kpiInterviewCount.textContent = `${kpi.interviewAvailableCount}명`;
    kpiConsentRate.textContent = `${kpi.consentAwareRate}%`;
    kpiConsentSub.textContent = `재확인 경험 ${kpi.consentAwareCount}명 / 전체 ${kpi.totalResponses}명`;

    // 2. 4가지 건강기록 관리 습관 유형 분포 렌더링
    typeStatsContainer.innerHTML = '';
    typeStats.forEach((t) => {
      const box = document.createElement('div');
      box.className = 'type-stat-box';
      box.innerHTML = `
        <div class="type-stat-top">
          <span>${escapeHtml(t.name)}</span>
          <span>${t.count}명 (${t.percent}%)</span>
        </div>
        <div class="bar-bg">
          <div class="bar-fill" style="width: ${t.percent}%;"></div>
        </div>
      `;
      typeStatsContainer.appendChild(box);
    });

    // 3. Q1 ~ Q6 문항별 차트 렌더링
    questionStatsContainer.innerHTML = '';
    Object.keys(questionStats).forEach((qKey) => {
      const qData = questionStats[qKey];
      const card = document.createElement('div');
      card.className = 'q-stat-card';

      const isHighlightQ = qKey === 'Q4' || qKey === 'Q5' || qKey === 'Q6';
      const rowsHtml = qData.options
        .map(
          (opt) => `
          <div class="q-opt-row">
            <div class="q-opt-label-line">
              <span class="q-opt-text">${escapeHtml(opt.label)}</span>
              <span class="q-opt-val">${opt.count}명 (${opt.percent}%)</span>
            </div>
            <div class="bar-bg">
              <div class="bar-fill ${isHighlightQ ? 'coral' : ''}" style="width: ${opt.percent}%;"></div>
            </div>
          </div>
        `
        )
        .join('');

      card.innerHTML = `
        <div class="q-stat-title">${escapeHtml(qData.title)}</div>
        ${rowsHtml}
      `;
      questionStatsContainer.appendChild(card);
    });

    // 4. 초기 테스트 신청자 명단 테이블 렌더링 + 개별 즉시 삭제 버튼
    leadsCountBadge.textContent = `현재 필터 기준 총 ${leads.length}건`;
    leadsTableBody.innerHTML = '';

    if (leads.length === 0) {
      leadsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding: 28px; color: #64748B;">
            해당 필터 조건에 맞는 초기 테스트 신청 내역이 없습니다.
          </td>
        </tr>
      `;
    } else {
      leads.forEach((lead) => {
        const tr = document.createElement('tr');
        const seedBadge = lead.isSeed
          ? '<span class="badge-seed">[시연용 Seed]</span>'
          : '<span class="badge-real">[실제 응답 Real]</span>';

        tr.innerHTML = `
          <td>${seedBadge}</td>
          <td>${formatDateTime(lead.createdAt)}</td>
          <td><strong>${escapeHtml(lead.nickname)}</strong></td>
          <td>${escapeHtml(lead.contact)}</td>
          <td>
            ${
              lead.interviewAvailable
                ? '<span class="badge-yes">가능 (O)</span>'
                : '<span class="badge-no">미선택</span>'
            }
          </td>
          <td>
            ${
              lead.privacyConsent
                ? '<span class="badge-yes">동의함</span>'
                : '<span class="badge-no">미동의</span>'
            }
          </td>
          <td>
            <button type="button" class="btn-delete-row" data-lead-id="${escapeHtml(lead.id)}">
              🗑️ 개별 삭제
            </button>
          </td>
        `;
        leadsTableBody.appendChild(tr);
      });

      // 개별 삭제 이벤트 바인딩
      leadsTableBody.querySelectorAll('.btn-delete-row').forEach((delBtn) => {
        delBtn.addEventListener('click', async () => {
          const leadId = delBtn.getAttribute('data-lead-id');
          if (!leadId) return;
          if (!confirm('선택하신 신청자의 연락처 및 개인정보를 시스템에서 즉시 영구 삭제하시겠습니까?')) {
            return;
          }
          await deleteLeadById(leadId);
        });
      });
    }

    // 5. 익명 설문 응답 목록 렌더링
    responsesCountBadge.textContent = `현재 필터 기준 총 ${responses.length}건`;
    responsesTableBody.innerHTML = '';

    if (responses.length === 0) {
      responsesTableBody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center; padding: 28px; color: #64748B;">
            해당 필터 조건에 맞는 설문 응답 내역이 없습니다.
          </td>
        </tr>
      `;
    } else {
      responses.forEach((resp) => {
        const tr = document.createElement('tr');
        const seedBadge = resp.isSeed
          ? '<span class="badge-seed">[시연용 Seed]</span>'
          : '<span class="badge-real">[실제 응답 Real]</span>';

        const HABIT_TYPE_LABELS = {
          type1: '마음만은 든든, 기억·대화 중심 확인형',
          type2: '사진첩·단톡방 스크롤 탐정형',
          type3: '수첩·메모장 꼼꼼 기록 매니저형',
          type4: '체계적인 스마트 동행 기록 프로형'
        };
        const cleanTypeName = HABIT_TYPE_LABELS[resp.habitType] || resp.habitTypeName || '-';
        const q4Label = SHORT_LABELS[resp.answers?.Q4] || resp.answers?.Q4 || '-';
        const q5Label = SHORT_LABELS[resp.answers?.Q5] || resp.answers?.Q5 || '-';
        const q6Label = SHORT_LABELS[resp.answers?.Q6] || resp.answers?.Q6 || '-';
        const q7Label = SHORT_LABELS[resp.answers?.Q7] || resp.answers?.Q7 || '-';
        const vocText = resp.vocComment && resp.vocComment.trim()
          ? `<span style="color:#0F766E; font-weight:600;">“${escapeHtml(resp.vocComment)}”</span>`
          : '<span style="color:#94A3B8;">-</span>';

        tr.innerHTML = `
          <td>${seedBadge}</td>
          <td>${formatDateTime(resp.createdAt)}</td>
          <td><strong>${escapeHtml(q7Label)}</strong></td>
          <td><strong>${escapeHtml(cleanTypeName)}</strong></td>
          <td>${escapeHtml(q4Label)}</td>
          <td>${escapeHtml(q5Label)}</td>
          <td>${escapeHtml(q6Label)}</td>
          <td>${vocText}</td>
          <td>
            <button type="button" class="btn-delete-row btn-delete-resp" data-resp-id="${escapeHtml(resp.id)}">
              🗑️ 개별 삭제
            </button>
          </td>
        `;
        responsesTableBody.appendChild(tr);
      });

      // 설문 응답 개별 삭제 이벤트 바인딩
      responsesTableBody.querySelectorAll('.btn-delete-resp').forEach((delBtn) => {
        delBtn.addEventListener('click', async () => {
          const respId = delBtn.getAttribute('data-resp-id');
          if (!respId) return;
          if (!confirm('선택하신 설문 응답 내역을 삭제하시겠습니까?')) {
            return;
          }
          await deleteResponseById(respId);
        });
      });
    }
  }

  // 설문 응답 개별 삭제 요청 (DELETE /api/admin/responses/:id)
  async function deleteResponseById(respId) {
    try {
      const res = await fetch(`/api/admin/responses/${encodeURIComponent(respId)}`, {
        method: 'DELETE',
        headers: {
          'x-admin-password': currentPassword
        }
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        alert(json.message || '삭제 처리에 실패했습니다.');
        return;
      }
      fetchDashboardStats(currentPassword, currentFilter, false);
    } catch (err) {
      alert('서버와 통신 중 오류가 발생했습니다.');
    }
  }

  // 신청자 개별 삭제 요청 (DELETE /api/admin/leads/:id)
  async function deleteLeadById(leadId) {
    try {
      const res = await fetch(`/api/admin/leads/${encodeURIComponent(leadId)}`, {
        method: 'DELETE',
        headers: {
          'x-admin-password': currentPassword
        }
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        alert(json.message || '삭제 처리에 실패했습니다.');
        return;
      }
      fetchDashboardStats(currentPassword, currentFilter, false);
    } catch (err) {
      alert('서버와 통신 중 오류가 발생했습니다.');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // 새로고침
  btnRefreshStats.addEventListener('click', () => {
    if (currentPassword) {
      fetchDashboardStats(currentPassword, currentFilter, false);
    }
  });

  // 시연용(Seed) 데이터 전체 삭제
  if (btnClearSeed) {
    btnClearSeed.addEventListener('click', async () => {
      if (!confirm('실제 고객 응답(Real)은 그대로 보존하고, 시연용 가상 데이터(Seed: 설문 5건, 신청 3건)를 모두 삭제하시겠습니까?')) {
        return;
      }
      try {
        const res = await fetch('/api/admin/clear-seed', {
          method: 'POST',
          headers: { 'x-admin-password': currentPassword }
        });
        const json = await res.json();
        if (json.ok) {
          alert(json.message);
          fetchDashboardStats(currentPassword, currentFilter, false);
        } else {
          alert(json.message || '삭제 처리에 실패했습니다.');
        }
      } catch (e) {
        alert('서버 통신 중 오류가 발생했습니다.');
      }
    });
  }

  // 시연용 샘플 데이터 복원
  btnResetSeed.addEventListener('click', async () => {
    if (!confirm('실제 고객 응답은 그대로 유지하고, 시연용 가상 데이터(설문 5건, 신청 3건)만 기본값으로 복원하시겠습니까?')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/reset-seed', {
        method: 'POST',
        headers: { 'x-admin-password': currentPassword }
      });
      const json = await res.json();
      if (json.ok) {
        alert(json.message);
        fetchDashboardStats(currentPassword, currentFilter, false);
      } else {
        alert(json.message || '초기화에 실패했습니다.');
      }
    } catch (e) {
      alert('서버 통신 중 오류가 발생했습니다.');
    }
  });

  // 로그아웃
  btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    currentPassword = '';
    passwordInput.value = '';
    dashboardView.classList.add('hidden');
    loginView.classList.remove('hidden');
  });

  // CSV 다운로드 (헤더 인증 x-admin-password 사용으로 URL에 비밀번호 노출 방지)
  async function downloadCsv(type) {
    if (!currentPassword) return;
    try {
      const url = `/api/admin/export-csv?type=${encodeURIComponent(type)}&filter=${encodeURIComponent(currentFilter)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'x-admin-password': currentPassword
        }
      });
      if (!res.ok) {
        alert('CSV 다운로드 권한이 없거나 오류가 발생했습니다.');
        return;
      }
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = type === 'leads'
        ? `Check_초기테스트신청자_${currentFilter}_${dateStr}.csv`
        : `Check_수요조사_엑셀정리본_${currentFilter}_${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert('CSV 다운로드 중 오류가 발생했습니다.');
    }
  }

  btnExportResponses.addEventListener('click', () => downloadCsv('responses'));
  btnExportLeads.addEventListener('click', () => downloadCsv('leads'));

  if (btnExportPdf) {
    btnExportPdf.addEventListener('click', () => {
      const origTitle = document.title;
      const dateStr = new Date().toISOString().slice(0, 10);
      document.title = `Check_수요조사_대시보드리포트_${currentFilter}_${dateStr}`;
      window.print();
      setTimeout(() => {
        document.title = origTitle;
      }, 1000);
    });
  }

  // ==================== 바이럴 확산 키트 (템플릿 3종 원클릭 복사 & QR코드 저장) ====================
  async function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }

  document.querySelectorAll('.btn-copy-template[data-target]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const targetId = btn.getAttribute('data-target');
      const textarea = document.getElementById(targetId);
      if (!textarea) return;
      const originalLabel = btn.textContent;
      try {
        await copyToClipboard(textarea.value);
        btn.textContent = '✓ 홍보 문구가 복사되었습니다! 바로 붙여넣기 하세요';
        setTimeout(() => {
          btn.textContent = originalLabel;
        }, 2500);
      } catch (e) {
        alert('클립보드 복사에 실패했습니다. 텍스트를 직접 선택해 복사해 주세요.');
      }
    });
  });

  const btnCopySurveyUrl = document.getElementById('btn-copy-survey-url');
  if (btnCopySurveyUrl) {
    btnCopySurveyUrl.addEventListener('click', async () => {
      const urlText = 'https://check-research.surge.sh';
      const orig = btnCopySurveyUrl.textContent;
      try {
        await copyToClipboard(urlText);
        btnCopySurveyUrl.textContent = '✓ 링크 복사 완료!';
        setTimeout(() => {
          btnCopySurveyUrl.textContent = orig;
        }, 2000);
      } catch (e) {}
    });
  }

  const btnDownloadQr = document.getElementById('btn-download-qr');
  const adminQrImg = document.getElementById('admin-qr-img');
  if (btnDownloadQr && adminQrImg) {
    btnDownloadQr.addEventListener('click', async () => {
      try {
        const res = await fetch(adminQrImg.src);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = 'check_research_qr.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } catch (e) {
        window.open(adminQrImg.src, '_blank');
      }
    });
  }
})();
