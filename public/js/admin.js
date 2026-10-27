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
  const btnPrintReport = document.getElementById('btn-print-report');
  const btnExportLeads = document.getElementById('btn-export-leads');

  let currentPassword = sessionStorage.getItem(SESSION_KEY) || '';
  let currentFilter = 'all'; // 'all' | 'real' | 'seed'
  let lastDashboardData = null;

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
    lastDashboardData = data;
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

  // ==================== 진짜 엑셀(.xlsx) 스타일 적용 다운로드 (테두리·배경색·열너비 자동맞춤·시트분리) ====================
  function buildStyledSheetFromAoA(XLSX, aoa, colWidths, headerRowIndices, sectionTitleRowIndices) {
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = colWidths.map((w) => ({ wch: w }));

    const thinBorder = {
      top: { style: 'thin', color: { rgb: 'CBD5E1' } },
      bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } }
    };

    const headerSet = new Set(headerRowIndices || []);
    const sectionSet = new Set(sectionTitleRowIndices || []);
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');

    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddr = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellAddr];
        if (!cell) continue;

        if (sectionSet.has(R)) {
          cell.s = {
            fill: { fgColor: { rgb: '0F766E' } },
            font: { name: '맑은 고딕', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
            alignment: { vertical: 'center', horizontal: 'left' },
            border: thinBorder
          };
        } else if (headerSet.has(R)) {
          cell.s = {
            fill: { fgColor: { rgb: 'CCFBF1' } },
            font: { name: '맑은 고딕', sz: 10, bold: true, color: { rgb: '0F766E' } },
            alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
            border: thinBorder
          };
        } else if (cell.v !== '' && cell.v !== null && cell.v !== undefined) {
          cell.s = {
            fill: { fgColor: { rgb: R % 2 === 1 ? 'F8FAFC' : 'FFFFFF' } },
            font: { name: '맑은 고딕', sz: 10, color: { rgb: '0F172A' } },
            alignment: { vertical: 'center', horizontal: 'left', wrapText: true },
            border: thinBorder
          };
        }
      }
    }
    return ws;
  }

  function buildResponseRowsAoA(list) {
    const HABIT_TYPE_LABELS = {
      type1: '마음만은 든든, 기억·대화 중심 확인형',
      type2: '사진첩·단톡방 스크롤 탐정형',
      type3: '수첩·메모장 꼼꼼 기록 매니저형',
      type4: '체계적인 스마트 동행 기록 프로형'
    };
    const header = [
      '연번',
      '데이터 구분',
      '참여 일시 (KST)',
      '연령대 (Q7)',
      '건강기록 관리 습관 유형',
      'Q1. 부모님 건강관리 경험',
      'Q2. 건강기록 보관 방법',
      'Q3. 과거 기록 재확인 경험',
      'Q4. 가족 간 소통·공유 범위',
      'Q5. 가장 필요한 기능 1순위',
      'Q6. 최근 6개월 재확인 빈도',
      '선택형 1줄 자유응답 (익명 VOC)'
    ];
    const rows = [header];
    (list || []).forEach((r, idx) => {
      const cleanTypeName = HABIT_TYPE_LABELS[r.habitType] || r.habitTypeName || '-';
      rows.push([
        idx + 1,
        r.isSeed ? '시연용 샘플 (Seed)' : '실제 고객 응답 (Real)',
        formatDateTime(r.createdAt),
        SHORT_LABELS[r.answers?.Q7] || r.answers?.Q7 || '-',
        cleanTypeName,
        SHORT_LABELS[r.answers?.Q1] || r.answers?.Q1 || '-',
        SHORT_LABELS[r.answers?.Q2] || r.answers?.Q2 || '-',
        SHORT_LABELS[r.answers?.Q3] || r.answers?.Q3 || '-',
        SHORT_LABELS[r.answers?.Q4] || r.answers?.Q4 || '-',
        SHORT_LABELS[r.answers?.Q5] || r.answers?.Q5 || '-',
        SHORT_LABELS[r.answers?.Q6] || r.answers?.Q6 || '-',
        r.vocComment && r.vocComment.trim() ? r.vocComment.trim() : '-'
      ]);
    });
    return rows;
  }

  function buildLeadsRowsAoA(list) {
    const header = [
      '연번',
      '데이터 구분',
      '신청 일시 (KST)',
      '닉네임',
      '연락처 (휴대폰/카톡ID/이메일)',
      '10분 인터뷰 가능 여부',
      '개인정보 수집·이용 동의'
    ];
    const rows = [header];
    (list || []).forEach((l, idx) => {
      rows.push([
        idx + 1,
        l.isSeed ? '시연용 샘플 (Seed)' : '실제 신청자 (Real)',
        formatDateTime(l.createdAt),
        l.nickname || '-',
        l.contact || '-',
        l.interviewAvailable ? '가능 (O)' : '미선택 (X)',
        l.privacyConsent ? '동의 완료' : '미동의'
      ]);
    });
    return rows;
  }

  async function downloadExcelFile(type) {
    if (!lastDashboardData || typeof window.XLSX === 'undefined') {
      return downloadCsv(type);
    }
    try {
      const XLSX = window.XLSX;
      const wb = XLSX.utils.book_new();
      const dateStr = new Date().toISOString().slice(0, 10);
      const nowStr = formatDateTime(new Date().toISOString());
      const { kpi, typeStats, questionStats, leads, responses } = lastDashboardData;

      if (type === 'leads') {
        const leadsAoA = [
          ['[Check 초기 테스트 & 인터뷰 신청자 명단]', '', '', '', '', '', ''],
          ...buildLeadsRowsAoA(leads)
        ];
        const wsLeads = buildStyledSheetFromAoA(
          XLSX,
          leadsAoA,
          [8, 22, 22, 18, 28, 20, 22],
          [1],
          [0]
        );
        XLSX.utils.book_append_sheet(wb, wsLeads, '초기테스트_신청자명단');
        XLSX.writeFile(wb, `Check_초기테스트신청자_${currentFilter}_${dateStr}.xlsx`);
        return;
      }

      // 1) 시트 1: 통계 요약 리포트 (핵심 KPI + 유형 분포 + Q1~Q7 문항별 통계)
      const filterLabel =
        currentFilter === 'real'
          ? '실제 고객 응답만 (Real)'
          : currentFilter === 'seed'
            ? '시연용 샘플 데이터만 (Seed)'
            : '전체 보기 (Real + Seed)';

      const summaryAoA = [];
      const headerRows = [];
      const sectionRows = [];

      sectionRows.push(summaryAoA.length);
      summaryAoA.push(['■ [파트 1] Check 수요조사 핵심 요약 지표 (KPI)', '', '', `출력일시: ${nowStr}`]);
      headerRows.push(summaryAoA.length);
      summaryAoA.push(['지표 항목', '수치 결과', '산출 기준 / 설명', '현재 필터 모드']);
      summaryAoA.push(['총 익명 설문 응답 수', `${kpi.totalResponses}명`, 'Q1~Q7 완료 즉시 자동 수집', filterLabel]);
      summaryAoA.push(['초기 테스트 신청자 수', `${kpi.totalLeads}명`, `설문 대비 신청 전환율 ${kpi.conversionRate}%`, '물리적 분리 보관']);
      summaryAoA.push(['10분 비대면 인터뷰 가능 인원', `${kpi.interviewAvailableCount}명`, '가상 건강정보 시제품 인터뷰 대상', '']);
      summaryAoA.push(['최근 6개월 기록 재확인 경험 비율 (Q6)', `${kpi.consentAwareRate}% (${kpi.consentAwareCount}명)`, `전체 ${kpi.totalResponses}명 중 1회 이상 재확인 비율`, '']);
      summaryAoA.push(['', '', '', '']);

      sectionRows.push(summaryAoA.length);
      summaryAoA.push(['■ [파트 2] 부모님 건강기록 관리 습관 유형 분포 (4가지 유형)', '', '', '']);
      headerRows.push(summaryAoA.length);
      summaryAoA.push(['유형 코드', '습관 유형 명칭 (비진단 안내)', '응답자 수 (명)', '비율 (%)']);
      (typeStats || []).forEach((t) => {
        summaryAoA.push([t.typeKey, t.name, `${t.count}명`, `${t.percent}%`]);
      });
      summaryAoA.push(['', '', '', '']);

      sectionRows.push(summaryAoA.length);
      summaryAoA.push(['■ [파트 3] Q1 ~ Q7 문항별 및 연령대별 응답 통계 요약', '', '', '']);
      headerRows.push(summaryAoA.length);
      summaryAoA.push(['설문 문항 제목', '선택지 항목 내용', '응답자 수 (명)', '비율 (%)']);
      Object.keys(questionStats || {}).forEach((qKey) => {
        const qObj = questionStats[qKey];
        if (!qObj || !Array.isArray(qObj.options)) return;
        qObj.options.forEach((opt) => {
          summaryAoA.push([qObj.title, opt.label, `${opt.count}명`, `${opt.percent}%`]);
        });
      });

      const wsSummary = buildStyledSheetFromAoA(
        XLSX,
        summaryAoA,
        [52, 62, 18, 26],
        headerRows,
        sectionRows
      );
      XLSX.utils.book_append_sheet(wb, wsSummary, '1_통계요약_리포트');

      // 2) 시트 2: 순수 실제 고객 응답(Real) 전용 내역 (시연용 Seed 자동 제외 시트)
      const realOnlyList = (responses || []).filter((r) => !r.isSeed);
      const realAoA = [
        [`■ 실제 고객 설문 응답 전용 내역 (시연용 제외 · 총 ${realOnlyList.length}건)`, '', '', '', '', '', '', '', '', '', '', ''],
        ...buildResponseRowsAoA(realOnlyList)
      ];
      const wsReal = buildStyledSheetFromAoA(
        XLSX,
        realAoA,
        [7, 20, 20, 12, 30, 26, 26, 26, 28, 24, 20, 45],
        [1],
        [0]
      );
      XLSX.utils.book_append_sheet(wb, wsReal, '2_실제고객응답_내역');

      // 3) 시트 3: 현재 필터 기준 전체 응답 내역
      const allRespAoA = [
        [`■ 현재 필터(${filterLabel}) 설문 응답 전체 내역 (총 ${(responses || []).length}건)`, '', '', '', '', '', '', '', '', '', '', ''],
        ...buildResponseRowsAoA(responses)
      ];
      const wsAllResp = buildStyledSheetFromAoA(
        XLSX,
        allRespAoA,
        [7, 20, 20, 12, 30, 26, 26, 26, 28, 24, 20, 45],
        [1],
        [0]
      );
      XLSX.utils.book_append_sheet(wb, wsAllResp, '3_전체응답_원본');

      // 4) 시트 4: 초기 테스트 & 인터뷰 신청자 명단
      const leadsSheetAoA = [
        [`■ 초기 테스트 & 인터뷰 신청자 명단 (총 ${(leads || []).length}건)`, '', '', '', '', '', ''],
        ...buildLeadsRowsAoA(leads)
      ];
      const wsLeadsSheet = buildStyledSheetFromAoA(
        XLSX,
        leadsSheetAoA,
        [8, 22, 22, 18, 28, 20, 22],
        [1],
        [0]
      );
      XLSX.utils.book_append_sheet(wb, wsLeadsSheet, '4_초기테스트신청자');

      XLSX.writeFile(wb, `Check_수요조사_엑셀정리본_${currentFilter}_${dateStr}.xlsx`);
    } catch (e) {
      downloadCsv(type);
    }
  }

  btnExportResponses.addEventListener('click', () => downloadExcelFile('responses'));
  btnExportLeads.addEventListener('click', () => downloadExcelFile('leads'));

  // 1) PDF 파일 직접 다운로드 (A4 전용 페이지별 분할 렌더링으로 좌우·상하 잘림 0% 보장)
  function buildPdfQuestionCardHtml(qKey, qData) {
    if (!qData) return '';
    const isHighlight = qKey === 'Q4' || qKey === 'Q5' || qKey === 'Q6';
    const barColor = isHighlight ? '#EA580C' : '#0D9488';
    const optsHtml = (qData.options || [])
      .map(
        (opt) => `
        <div style="margin-bottom:7px;">
          <div style="display:flex; justify-content:space-between; font-size:10.5px; color:#334155; margin-bottom:3px; gap:6px;">
            <span style="flex:1; word-break:keep-all;">${escapeHtml(opt.label)}</span>
            <strong style="white-space:nowrap; color:#0F172A;">${opt.count}명 (${opt.percent}%)</strong>
          </div>
          <div style="width:100%; height:6px; background:#E2E8F0; border-radius:99px; overflow:hidden;">
            <div style="width:${opt.percent}%; height:100%; background:${barColor}; border-radius:99px;"></div>
          </div>
        </div>
      `
      )
      .join('');

    return `
      <div style="background:#F8FAFC; border:1px solid #CBD5E1; border-radius:10px; padding:11px 12px;">
        <div style="font-size:11.5px; font-weight:800; color:#0F172A; margin-bottom:8px; line-height:1.35;">
          ${escapeHtml(qData.title)}
        </div>
        ${optsHtml}
      </div>
    `;
  }

  function createA4SheetContainer() {
    const page = document.createElement('div');
    page.style.cssText =
      'width:794px; background:#FFFFFF; padding:26px 28px; box-sizing:border-box; font-family:Pretendard,-apple-system,sans-serif; color:#0F172A;';
    return page;
  }

  async function generateCleanA4Pdf() {
    if (!lastDashboardData) {
      alert('대시보드 데이터를 먼저 불러와 주세요.');
      return;
    }
    if (typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
      alert('PDF 생성 라이브러리를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    const origText = btnExportPdf.innerHTML;
    btnExportPdf.disabled = true;
    btnExportPdf.innerHTML = '⏳ A4 리포트 생성 중...';

    const { kpi, typeStats, questionStats, leads, responses } = lastDashboardData;
    const filterName =
      currentFilter === 'real'
        ? '실제 고객 응답만 (Real)'
        : currentFilter === 'seed'
          ? '시연용 가상 데이터만 (Seed)'
          : '전체 데이터 (Real + Seed)';
    const dateStr = new Date().toISOString().slice(0, 10);
    const nowFormatted = formatDateTime(new Date().toISOString());

    const stage = document.createElement('div');
    stage.style.cssText = 'position:absolute; left:0; top:0; width:794px; background:#FFFFFF; z-index:-9999; pointer-events:none;';
    document.body.appendChild(stage);

    const pages = [];

    try {
      // ==================== [페이지 1] 요약 KPI + 유형 분포 + Q1~Q4 ====================
      const page1 = createA4SheetContainer();
      const typeBoxesHtml = (typeStats || [])
        .map(
          (t) => `
          <div style="background:#F8FAFC; border:1px solid #CBD5E1; border-radius:8px; padding:9px 11px;">
            <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:700; margin-bottom:5px;">
              <span>${escapeHtml(t.name)}</span>
              <span style="color:#0F766E;">${t.count}명 (${t.percent}%)</span>
            </div>
            <div style="width:100%; height:7px; background:#E2E8F0; border-radius:99px; overflow:hidden;">
              <div style="width:${t.percent}%; height:100%; background:#0D9488; border-radius:99px;"></div>
            </div>
          </div>
        `
        )
        .join('');

      page1.innerHTML = `
        <div style="border-bottom:2px solid #0F766E; padding-bottom:10px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:flex-end;">
          <div>
            <div style="font-size:11px; font-weight:800; color:#0F766E; margin-bottom:2px;">CHECK DEMAND RESEARCH REPORT</div>
            <h1 style="font-size:18px; font-weight:900; color:#0F172A; margin:0;">🌿 Check 수요조사 & 초기 테스트 신청 종합 리포트</h1>
          </div>
          <div style="text-align:right; font-size:10.5px; color:#475569;">
            <div><strong>필터 기준:</strong> ${escapeHtml(filterName)}</div>
            <div><strong>출력 일시:</strong> ${escapeHtml(nowFormatted)}</div>
          </div>
        </div>

        <div style="margin-bottom:14px;">
          <div style="font-size:13px; font-weight:800; color:#0F172A; margin-bottom:8px;">1. 핵심 요약 지표 (KPI)</div>
          <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;">
            <div style="border:1px solid #CBD5E1; border-radius:10px; padding:10px 12px; background:#F8FAFC;">
              <div style="font-size:10.5px; color:#475569; font-weight:700;">총 설문 응답 수</div>
              <div style="font-size:18px; font-weight:900; color:#0F172A; margin:3px 0;">${kpi.totalResponses}명</div>
              <div style="font-size:9.5px; color:#64748B;">Q1~Q7 완료 즉시 수집</div>
            </div>
            <div style="border:1px solid #CBD5E1; border-radius:10px; padding:10px 12px; background:#F8FAFC;">
              <div style="font-size:10.5px; color:#475569; font-weight:700;">초기 테스트 신청자</div>
              <div style="font-size:18px; font-weight:900; color:#0D9488; margin:3px 0;">${kpi.totalLeads}명</div>
              <div style="font-size:9.5px; color:#64748B;">전환율 ${kpi.conversionRate}%</div>
            </div>
            <div style="border:1px solid #CBD5E1; border-radius:10px; padding:10px 12px; background:#F8FAFC;">
              <div style="font-size:10.5px; color:#475569; font-weight:700;">10분 인터뷰 가능</div>
              <div style="font-size:18px; font-weight:900; color:#0D9488; margin:3px 0;">${kpi.interviewAvailableCount}명</div>
              <div style="font-size:9.5px; color:#64748B;">시제품 인터뷰 대상</div>
            </div>
            <div style="border:1px solid #CBD5E1; border-radius:10px; padding:10px 12px; background:#F8FAFC;">
              <div style="font-size:10.5px; color:#475569; font-weight:700;">최근 6개월 재확인 비율</div>
              <div style="font-size:18px; font-weight:900; color:#EA580C; margin:3px 0;">${kpi.consentAwareRate}%</div>
              <div style="font-size:9.5px; color:#64748B;">${kpi.consentAwareCount}명 / 전체 ${kpi.totalResponses}명</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom:14px;">
          <div style="font-size:13px; font-weight:800; color:#0F172A; margin-bottom:8px;">2. 부모님 건강기록 관리 습관 유형 분포 (4가지 유형)</div>
          <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px;">
            ${typeBoxesHtml}
          </div>
        </div>

        <div>
          <div style="font-size:13px; font-weight:800; color:#0F172A; margin-bottom:8px;">3. 문항별 상세 응답 비율 (Q1 ~ Q4)</div>
          <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px;">
            ${buildPdfQuestionCardHtml('Q1', questionStats.Q1)}
            ${buildPdfQuestionCardHtml('Q2', questionStats.Q2)}
            ${buildPdfQuestionCardHtml('Q3', questionStats.Q3)}
            ${buildPdfQuestionCardHtml('Q4', questionStats.Q4)}
          </div>
        </div>
      `;
      stage.appendChild(page1);
      pages.push(page1);

      // ==================== [페이지 2] 문항별 상세 응답 비율 (Q5~Q7) + 신청자 명단 ====================
      const page2 = createA4SheetContainer();
      const leadsRowsHtml =
        leads && leads.length > 0
          ? leads
              .map(
                (l) => `
              <tr>
                <td style="padding:6px 7px; border-bottom:1px solid #E2E8F0; font-size:10.5px;">${l.isSeed ? '[시연용 Seed]' : '<strong>[실제 Real]</strong>'}</td>
                <td style="padding:6px 7px; border-bottom:1px solid #E2E8F0; font-size:10.5px;">${escapeHtml(formatDateTime(l.createdAt))}</td>
                <td style="padding:6px 7px; border-bottom:1px solid #E2E8F0; font-size:10.5px; font-weight:700;">${escapeHtml(l.nickname)}</td>
                <td style="padding:6px 7px; border-bottom:1px solid #E2E8F0; font-size:10.5px;">${escapeHtml(l.contact)}</td>
                <td style="padding:6px 7px; border-bottom:1px solid #E2E8F0; font-size:10.5px;">${l.interviewAvailable ? '가능 (O)' : '미선택'}</td>
                <td style="padding:6px 7px; border-bottom:1px solid #E2E8F0; font-size:10.5px;">${l.privacyConsent ? '동의함' : '미동의'}</td>
              </tr>
            `
              )
              .join('')
          : `<tr><td colspan="6" style="padding:14px; text-align:center; font-size:11px; color:#64748B;">해당 필터 조건에 맞는 초기 테스트 신청 내역이 없습니다.</td></tr>`;

      page2.innerHTML = `
        <div style="margin-bottom:16px;">
          <div style="font-size:13px; font-weight:800; color:#0F172A; margin-bottom:8px;">3-B. 문항별 상세 응답 비율 (Q5 ~ Q7 연령대)</div>
          <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px;">
            ${buildPdfQuestionCardHtml('Q5', questionStats.Q5)}
            ${buildPdfQuestionCardHtml('Q6', questionStats.Q6)}
            ${questionStats.Q7 ? buildPdfQuestionCardHtml('Q7', questionStats.Q7) : ''}
          </div>
        </div>

        <div>
          <div style="font-size:13px; font-weight:800; color:#0F172A; margin-bottom:8px;">4. 초기 테스트 & 인터뷰 신청자 명단 (총 ${(leads || []).length}건)</div>
          <table style="width:100%; border-collapse:collapse; table-layout:fixed; border:1px solid #CBD5E1;">
            <thead>
              <tr style="background:#F1F5F9;">
                <th style="width:14%; padding:7px; border-bottom:1px solid #CBD5E1; font-size:10.5px; text-align:left;">구분</th>
                <th style="width:20%; padding:7px; border-bottom:1px solid #CBD5E1; font-size:10.5px; text-align:left;">신청 일시</th>
                <th style="width:16%; padding:7px; border-bottom:1px solid #CBD5E1; font-size:10.5px; text-align:left;">닉네임</th>
                <th style="width:24%; padding:7px; border-bottom:1px solid #CBD5E1; font-size:10.5px; text-align:left;">연락처</th>
                <th style="width:13%; padding:7px; border-bottom:1px solid #CBD5E1; font-size:10.5px; text-align:left;">인터뷰 가능</th>
                <th style="width:13%; padding:7px; border-bottom:1px solid #CBD5E1; font-size:10.5px; text-align:left;">개인정보 동의</th>
              </tr>
            </thead>
            <tbody>
              ${leadsRowsHtml}
            </tbody>
          </table>
        </div>
      `;
      stage.appendChild(page2);
      pages.push(page2);

      // ==================== [페이지 3+] 익명 설문 응답 전체 내역 (12건씩 자동 페이지 분할) ====================
      const HABIT_TYPE_LABELS = {
        type1: '마음만은 든든, 기억·대화 중심 확인형',
        type2: '사진첩·단톡방 스크롤 탐정형',
        type3: '수첩·메모장 꼼꼼 기록 매니저형',
        type4: '체계적인 스마트 동행 기록 프로형'
      };

      const respList = responses || [];
      const pageSize = 12;
      const totalChunks = Math.max(1, Math.ceil(respList.length / pageSize));

      for (let c = 0; c < totalChunks; c++) {
        const slice = respList.slice(c * pageSize, (c + 1) * pageSize);
        const respPage = createA4SheetContainer();

        const rowsHtml =
          slice.length > 0
            ? slice
                .map((resp) => {
                  const cleanTypeName = HABIT_TYPE_LABELS[resp.habitType] || resp.habitTypeName || '-';
                  const q4Label = SHORT_LABELS[resp.answers?.Q4] || resp.answers?.Q4 || '-';
                  const q5Label = SHORT_LABELS[resp.answers?.Q5] || resp.answers?.Q5 || '-';
                  const q6Label = SHORT_LABELS[resp.answers?.Q6] || resp.answers?.Q6 || '-';
                  const q7Label = SHORT_LABELS[resp.answers?.Q7] || resp.answers?.Q7 || '-';
                  const vocText = resp.vocComment && resp.vocComment.trim() ? resp.vocComment.trim() : '-';
                  return `
                  <tr>
                    <td style="padding:6px 5px; border-bottom:1px solid #E2E8F0; font-size:9.5px; word-break:keep-all;">${resp.isSeed ? '[Seed]' : '<strong>[Real]</strong>'}</td>
                    <td style="padding:6px 5px; border-bottom:1px solid #E2E8F0; font-size:9.5px;">${escapeHtml(formatDateTime(resp.createdAt))}</td>
                    <td style="padding:6px 5px; border-bottom:1px solid #E2E8F0; font-size:9.5px; font-weight:700;">${escapeHtml(q7Label)}</td>
                    <td style="padding:6px 5px; border-bottom:1px solid #E2E8F0; font-size:9.5px; font-weight:700; word-break:keep-all;">${escapeHtml(cleanTypeName)}</td>
                    <td style="padding:6px 5px; border-bottom:1px solid #E2E8F0; font-size:9.5px; word-break:keep-all;">${escapeHtml(q4Label)}</td>
                    <td style="padding:6px 5px; border-bottom:1px solid #E2E8F0; font-size:9.5px; word-break:keep-all;">${escapeHtml(q5Label)}</td>
                    <td style="padding:6px 5px; border-bottom:1px solid #E2E8F0; font-size:9.5px; word-break:keep-all;">${escapeHtml(q6Label)}</td>
                    <td style="padding:6px 5px; border-bottom:1px solid #E2E8F0; font-size:9.5px; word-break:break-word; color:#0F766E;">${escapeHtml(vocText)}</td>
                  </tr>
                `;
                })
                .join('')
            : `<tr><td colspan="8" style="padding:16px; text-align:center; font-size:11px; color:#64748B;">설문 응답 내역이 없습니다.</td></tr>`;

        respPage.innerHTML = `
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <div style="font-size:13px; font-weight:800; color:#0F172A;">
                5. 실시간 익명 설문 응답 & 1줄 자유응답(VOC) 내역 (${c + 1} / ${totalChunks} 페이지 · 총 ${respList.length}건)
              </div>
              <div style="font-size:10px; color:#64748B;">${escapeHtml(filterName)}</div>
            </div>
            <table style="width:100%; border-collapse:collapse; table-layout:fixed; border:1px solid #CBD5E1;">
              <thead>
                <tr style="background:#F1F5F9;">
                  <th style="width:7%; padding:6px 5px; border-bottom:1px solid #CBD5E1; font-size:9.5px; text-align:left;">구분</th>
                  <th style="width:14%; padding:6px 5px; border-bottom:1px solid #CBD5E1; font-size:9.5px; text-align:left;">참여 일시</th>
                  <th style="width:8%; padding:6px 5px; border-bottom:1px solid #CBD5E1; font-size:9.5px; text-align:left;">연령대</th>
                  <th style="width:18%; padding:6px 5px; border-bottom:1px solid #CBD5E1; font-size:9.5px; text-align:left;">습관 유형</th>
                  <th style="width:16%; padding:6px 5px; border-bottom:1px solid #CBD5E1; font-size:9.5px; text-align:left;">Q4 공유 범위</th>
                  <th style="width:13%; padding:6px 5px; border-bottom:1px solid #CBD5E1; font-size:9.5px; text-align:left;">Q5 필요 기능</th>
                  <th style="width:9%; padding:6px 5px; border-bottom:1px solid #CBD5E1; font-size:9.5px; text-align:left;">Q6 빈도</th>
                  <th style="width:15%; padding:6px 5px; border-bottom:1px solid #CBD5E1; font-size:9.5px; text-align:left;">1줄 자유응답(VOC)</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        `;
        stage.appendChild(respPage);
        pages.push(respPage);
      }

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();
        const canvas = await window.html2canvas(pages[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: '#FFFFFF',
          width: 794,
          windowWidth: 1024,
          x: 0,
          scrollX: 0,
          scrollY: 0
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.96);
        let imgW = 196; // A4 210mm - 좌우 여백 7mm씩
        let imgH = (canvas.height * imgW) / canvas.width;
        if (imgH > 283) {
          const ratio = 283 / imgH;
          imgH = 283;
          imgW = imgW * ratio;
        }
        const xOffset = (210 - imgW) / 2;
        pdf.addImage(imgData, 'JPEG', xOffset, 7, imgW, imgH);
      }

      pdf.save(`Check_수요조사_대시보드리포트_${currentFilter}_${dateStr}.pdf`);
    } catch (err) {
      alert('PDF 파일 생성 중 오류가 발생했습니다.');
    } finally {
      if (stage.parentNode) stage.parentNode.removeChild(stage);
      btnExportPdf.disabled = false;
      btnExportPdf.innerHTML = origText;
    }
  }

  if (btnExportPdf) {
    btnExportPdf.addEventListener('click', generateCleanA4Pdf);
  }

  // 2) 리포트 인쇄 (프린터 출력 전용 별도 버튼)
  if (btnPrintReport) {
    btnPrintReport.addEventListener('click', () => {
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
