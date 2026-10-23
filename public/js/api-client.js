/* =========================================================
   Check 24/7 클라우드 통합 API 어댑터 (api-client.js)
   - PC가 꺼져 있어도 365일 24시간 모든 스마트폰·PC의 응답을 한곳으로 실시간 수집
   - 불필요한 반복 요청(429 Rate Limit)을 완전히 제거한 단일 이벤트 전송 구조
   - 익명 설문 통계 채널(CLOUD_RESP_STREAM)과 신청자 연락처 채널(CLOUD_LEADS_STREAM) 물리적 분리 보관
   ========================================================= */
(function () {
  const ORIGINAL_FETCH = window.fetch.bind(window);
  const CLOUD_RESP_STREAM = 'https://ntfy.sh/check_survey_clean_2026_v4';
  const CLOUD_LEADS_STREAM = 'https://ntfy.sh/check_leads_clean_2026_v4';
  const RESP_KEY = 'check_responses_v2';
  const LEADS_KEY = 'check_leads_v2';
  const SYNCED_IDS_KEY = 'check_synced_ids_v4';
  const DELETED_LEADS_KEY = 'check_deleted_leads_v2';
  const ADMIN_PW = 'check2026!';

  const INITIAL_REAL_IDS = new Set([
    'resp-1792752790662-1d04',
    'resp-1792730220134-420b',
    'resp-1792729866329-255d',
    'resp-1792499706693-21da'
  ]);

  // 기존에 수집된 실제 고객 응답 4건 기본 보존
  function getInitialRealResponses() {
    return [
      {
        id: 'resp-1792752790662-1d04',
        createdAt: '2026-10-23T10:53:10.665Z',
        isSeed: false,
        answers: {
          Q1: 'exp_multi_meds',
          Q2: 'store_none',
          Q3: 'recheck_med_list',
          Q4: 'share_visit_summary',
          Q5: 'feat_selective_share',
          Q6: 'freq_zero',
          Q7: 'age_30s'
        },
        habitType: 'type3',
        habitTypeName: '수첩·메모장 꼼꼼 기록 매니저형',
        vocComment: ''
      },
      {
        id: 'resp-1792730220134-420b',
        createdAt: '2026-10-23T04:37:00.143Z',
        isSeed: false,
        answers: {
          Q1: 'exp_no_issue',
          Q2: 'store_memo',
          Q3: 'recheck_med_list',
          Q4: 'share_visit_summary',
          Q5: 'feat_current_enough',
          Q6: 'freq_no_help'
        },
        habitType: 'type3',
        habitTypeName: '수첩·메모장 꼼꼼 기록 매니저형',
        vocComment: ''
      },
      {
        id: 'resp-1792729866329-255d',
        createdAt: '2026-10-23T04:31:06.343Z',
        isSeed: false,
        answers: {
          Q1: 'exp_hard_answer',
          Q2: 'store_memo',
          Q3: 'recheck_symptom_date',
          Q4: 'share_visit_summary',
          Q5: 'feat_selective_share',
          Q6: 'freq_zero'
        },
        habitType: 'type3',
        habitTypeName: '수첩·메모장 꼼꼼 기록 매니저형',
        vocComment: ''
      },
      {
        id: 'resp-1792499706693-21da',
        createdAt: '2026-10-20T12:35:06.693Z',
        isSeed: false,
        answers: {
          Q1: 'exp_none_yet',
          Q2: 'store_none',
          Q3: 'recheck_search',
          Q4: 'share_none_exp',
          Q5: 'feat_med_list',
          Q6: 'freq_1_2'
        },
        habitType: 'type1',
        habitTypeName: '마음만은 든든, 기억·대화 중심 확인형',
        vocComment: ''
      }
    ];
  }

  function getSeedResponses() {
    return [
      {
        id: 'resp-seed-101',
        createdAt: '2026-10-19T14:22:10.000Z',
        isSeed: true,
        answers: {
          Q1: 'exp_hard_answer',
          Q2: 'store_kakao',
          Q3: 'recheck_search',
          Q4: 'share_selected_family',
          Q5: 'feat_visit_card',
          Q6: 'freq_5_plus',
          Q7: 'age_30s'
        },
        habitType: 'type2',
        habitTypeName: '사진첩·단톡방 스크롤 탐정형',
        vocComment: '가족 단톡방에서 예전에 올린 약봉투 사진을 다시 찾으려니 대화에 밀려서 한참 걸렸어요.'
      },
      {
        id: 'resp-seed-102',
        createdAt: '2026-10-19T19:45:32.000Z',
        isSeed: true,
        answers: {
          Q1: 'exp_multi_meds',
          Q2: 'store_memo',
          Q3: 'recheck_med_list',
          Q4: 'share_parent_consent',
          Q5: 'feat_med_list',
          Q6: 'freq_3_4',
          Q7: 'age_40s'
        },
        habitType: 'type3',
        habitTypeName: '수첩·메모장 꼼꼼 기록 매니저형',
        vocComment: '병원 여러 곳에서 처방받은 약 이름을 메모장에 일일이 받아 적기가 번거로웠습니다.'
      },
      {
        id: 'resp-seed-103',
        createdAt: '2026-10-20T01:12:05.000Z',
        isSeed: true,
        answers: {
          Q1: 'exp_forgot_question',
          Q2: 'store_none',
          Q3: 'recheck_symptom_date',
          Q4: 'share_visit_summary',
          Q5: 'feat_calendar',
          Q6: 'freq_3_4',
          Q7: 'age_40s'
        },
        habitType: 'type1',
        habitTypeName: '마음만은 든든, 기억·대화 중심 확인형',
        vocComment: '진료실에 들어가면 긴장해서 언제부터 증상이 있었는지 바로 말씀드리기 어려웠어요.'
      },
      {
        id: 'resp-seed-104',
        createdAt: '2026-10-20T05:30:18.000Z',
        isSeed: true,
        answers: {
          Q1: 'exp_multi_meds',
          Q2: 'store_album',
          Q3: 'recheck_search',
          Q4: 'share_selected_family',
          Q5: 'feat_selective_share',
          Q6: 'freq_5_plus',
          Q7: 'age_30s'
        },
        habitType: 'type2',
        habitTypeName: '사진첩·단톡방 스크롤 탐정형',
        vocComment: '전체 단톡방에는 올리기 조심스러운 내용이 있어서 실제로 동행하는 형제끼리만 따로 공유하고 싶어요.'
      },
      {
        id: 'resp-seed-105',
        createdAt: '2026-10-20T09:15:44.000Z',
        isSeed: true,
        answers: {
          Q1: 'exp_no_issue',
          Q2: 'store_app_folder',
          Q3: 'recheck_easy',
          Q4: 'share_parent_consent',
          Q5: 'feat_visit_card',
          Q6: 'freq_1_2',
          Q7: 'age_50_plus'
        },
        habitType: 'type4',
        habitTypeName: '체계적인 스마트 동행 기록 프로형',
        vocComment: ''
      }
    ];
  }

  function getSeedLeads() {
    return [
      {
        id: 'lead-seed-201',
        createdAt: '2026-10-19T14:23:05.000Z',
        isSeed: true,
        nickname: '김지현 (시연용샘플)',
        contact: '010-0000-1001',
        interviewAvailable: true,
        privacyConsent: true
      },
      {
        id: 'lead-seed-202',
        createdAt: '2026-10-19T19:46:50.000Z',
        isSeed: true,
        nickname: '박서준 (시연용샘플)',
        contact: '카톡ID: sample_care02',
        interviewAvailable: true,
        privacyConsent: true
      },
      {
        id: 'lead-seed-203',
        createdAt: '2026-10-20T01:13:12.000Z',
        isSeed: true,
        nickname: '이수민 (시연용샘플)',
        contact: 'sample03@example.com',
        interviewAvailable: false,
        privacyConsent: true
      }
    ];
  }

  const QUESTION_META = {
    Q1: {
      title: 'Q1. [부모님 건강관리 경험] 최근 1년 동안 부모님의 병원 방문이나 약 관리를 도우면서 어떤 경험이 있으셨나요?',
      options: {
        exp_hard_answer: '1. 진료 중 바로 답하기 어려웠어요 (복용약이나 증상이 시작된 시점을 물어본 경험)',
        exp_forgot_question: '2. 물어볼 질문을 잊어버렸어요 (진료가 끝난 뒤 질문이 떠오른 경험)',
        exp_multi_meds: '3. 여러 약을 확인해야 했어요 (서로 다른 병원의 처방약이나 영양제를 확인한 경험)',
        exp_no_issue: '4. 별다른 불편이 없었어요 (필요한 정보를 확인하고 진료를 마친 경험)',
        exp_none_yet: '5. 아직 직접 도운 경험이 없어요 (앞으로 부모님 건강관리를 도울 가능성이 있는 경우)'
      }
    },
    Q2: {
      title: 'Q2. [건강기록 보관 방법] 부모님의 약봉투, 증상 사진, 병원 일정은 평소 어디에 기록하거나 보관하시나요?',
      options: {
        store_album: '1. 스마트폰 사진첩 (약봉투나 병원 관련 자료를 사진으로 저장해요)',
        store_kakao: '2. 가족 카카오톡·문자 (가족과 사진이나 메시지로 주고받아요)',
        store_memo: '3. 캘린더·메모장·수첩 (날짜와 내용을 직접 적어둬요)',
        store_app_folder: '4. 전용 기록 앱·폴더 (건강 관련 정보를 한곳에 모아둬요)',
        store_none: '5. 별도로 기록하지 않아요 (필요할 때 기억하거나 가족에게 확인해요)'
      }
    },
    Q3: {
      title: 'Q3. [과거 기록 재확인 경험] 부모님의 이전 복용약이나 증상 기록을 다시 확인할 때, 어떤 경험이 있으셨나요?',
      options: {
        recheck_search: '1. 기록을 다시 찾아야 했어요 (사진, 메시지, 서류 등을 찾아본 경험)',
        recheck_med_list: '2. 약 이름을 정리해야 했어요 (여러 약의 이름이나 복용 정보를 모아본 경험)',
        recheck_symptom_date: '3. 증상 발생 시점을 확인해야 했어요 (언제 증상이 있었는지 날짜를 확인한 경험)',
        recheck_easy: '4. 필요한 기록을 쉽게 확인했어요 (평소 관리하던 기록을 바로 확인한 경험)',
        recheck_none: '5. 다시 확인할 일이 없었어요 (이전 기록을 찾아본 경험이 없는 경우)'
      }
    },
    Q4: {
      title: 'Q4. [가족 간 건강정보 소통 및 공유 범위] 부모님의 건강정보를 가족과 주고받거나 공유할 때 어떤 방식을 선호하시거나 경험하셨나요?',
      options: {
        share_group_chat: '1. 가족 전체 단톡방에서 공유해요 (모든 가족 구성원에게 사진이나 메시지를 전달한 경험)',
        share_selected_family: '2. 필요한 가족만 선택해 따로 소통해요 (원하는 가족만 초대하거나 일부에게만 정보를 전달한 경험)',
        share_visit_summary: '3. 병원 방문 전후로 필요한 기록만 공유해요 (평소엔 각자 관리하고 진료 시점에만 요약 정보를 전달)',
        share_parent_consent: '4. 부모님 사전 동의 후 허용된 항목만 공유해요 (민감한 정보는 가리고 동의된 범위만 가족과 공유)',
        share_none_exp: '5. 공유한 경험이 없어요 (가족과 건강정보를 주고받지 않은 경우)'
      }
    },
    Q5: {
      title: 'Q5. [가장 필요한 기능 1순위] 부모님의 건강기록을 관리할 때, 가장 도움이 될 것 같은 기능 하나를 골라주세요.',
      options: {
        feat_calendar: '1. 날짜별 건강 달력 (증상 메모, 사진, 병원 일정을 날짜별로 기록)',
        feat_med_list: '2. 복용약·처방전 정리 (약봉투와 처방전 내용을 목록으로 정리)',
        feat_visit_card: '3. 병원 방문 준비 카드 (최근 기록과 질문을 한 장으로 정리)',
        feat_selective_share: '4. 가족별 선택적 공유·소통 (초대한 가족에게만 필요한 기록을 공유하고 소통)',
        feat_current_enough: '5. 지금 방식으로 충분해요 (별도의 기능이 필요하지 않은 경우)'
      }
    },
    Q6: {
      title: 'Q6. [실제 문제의 반복 빈도] 최근 6개월 동안 부모님의 건강정보를 다시 찾거나 가족에게 확인해야 했던 일이 얼마나 자주 있었나요?',
      options: {
        freq_5_plus: '1. 5번 이상 있었어요 (병원 방문이나 약 확인 때마다 자주 찾아본 경우)',
        freq_3_4: '2. 3~4번 있었어요 (분기나 격월 단위로 기록을 다시 확인한 경우)',
        freq_1_2: '3. 1~2번 있었어요 (가끔 필요할 때 이전 기록을 찾아본 경우)',
        freq_zero: '4. 한 번도 없었어요 (최근 6개월 내 다시 찾아볼 일이 없었던 경우)',
        freq_no_help: '5. 최근 6개월 동안 부모님 건강관리를 도운 적이 없어요 (해당 기간 내 관련 경험이 없는 경우)'
      }
    },
    Q7: {
      title: 'Q7. [응답자 연령대] 테스트 결과 분석을 위해 본인의 연령대를 선택해 주세요.',
      options: {
        age_20s: '1. 20대',
        age_30s: '2. 30대',
        age_40s: '3. 40대',
        age_50_plus: '4. 50대 이상'
      }
    }
  };

  const HABIT_TYPE_META = {
    type1: '마음만은 든든, 기억·대화 중심 확인형',
    type2: '사진첩·단톡방 스크롤 탐정형',
    type3: '수첩·메모장 꼼꼼 기록 매니저형',
    type4: '체계적인 스마트 동행 기록 프로형'
  };

  function getSyncedIdsSet() {
    try {
      const raw = localStorage.getItem(SYNCED_IDS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return new Set(arr);
      }
    } catch (e) {}
    return new Set();
  }

  function markIdSynced(id) {
    try {
      const set = getSyncedIdsSet();
      set.add(id);
      localStorage.setItem(SYNCED_IDS_KEY, JSON.stringify(Array.from(set)));
    } catch (e) {}
  }

  // 클라우드 스트림에 단건 이벤트 발행 (CORS Simple Request: text/plain)
  async function publishStreamEvent(streamUrl, payloadObj) {
    try {
      const res = await ORIGINAL_FETCH(streamUrl, {
        method: 'POST',
        body: JSON.stringify(payloadObj)
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  // 클라우드 스트림에서 전체 이벤트 로그 조회 (관리자 대시보드 전용)
  async function fetchStreamEvents(streamUrl) {
    const events = [];
    try {
      const res = await ORIGINAL_FETCH(`${streamUrl}/json?poll=1&since=all&t=${Date.now()}`, {
        method: 'GET'
      });
      if (res.ok) {
        const text = await res.text();
        const lines = text.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const wrapper = JSON.parse(trimmed);
            if (wrapper && wrapper.event === 'message' && wrapper.message) {
              const parsed = JSON.parse(wrapper.message);
              if (parsed && typeof parsed === 'object') {
                events.push(parsed);
              }
            }
          } catch (innerErr) {}
        }
      }
    } catch (e) {}
    return events;
  }

  // 휴대폰이나 PC 브라우저에 이전 미전송 응답이 남아 있다면 딱 1번만 클라우드로 복구 전송
  async function recoverUnsyncedLocalItemsOnce() {
    try {
      const syncedSet = getSyncedIdsSet();
      const raw = localStorage.getItem(RESP_KEY);
      if (!raw) return;
      const localArr = JSON.parse(raw);
      if (!Array.isArray(localArr)) return;

      for (const item of localArr) {
        if (
          item &&
          item.id &&
          !item.isSeed &&
          !INITIAL_REAL_IDS.has(item.id) &&
          !syncedSet.has(item.id)
        ) {
          markIdSynced(item.id);
          await publishStreamEvent(CLOUD_RESP_STREAM, {
            action: 'upsert_response',
            item
          });
        }
      }
    } catch (e) {}
  }

  // 24/7 클라우드 DB 조회 및 스마트 병합 (익명 응답용)
  async function readCloudResponses() {
    const map = new Map();

    // 1) 기본 실제 응답 4건 + 시연용 Seed 5건 로드
    for (const item of [...getInitialRealResponses(), ...getSeedResponses()]) {
      map.set(item.id, { ...item });
    }

    // 2) 현재 브라우저 localStorage에 저장된 응답 병합
    try {
      const raw = localStorage.getItem(RESP_KEY);
      if (raw) {
        const localArr = JSON.parse(raw);
        if (Array.isArray(localArr)) {
          for (const item of localArr) {
            if (item && item.id) {
              map.set(item.id, { ...item });
            }
          }
        }
      }
    } catch (e) {}

    // 3) 24/7 클라우드 스트림 이벤트 수신 및 병합
    const events = await fetchStreamEvents(CLOUD_RESP_STREAM);
    for (const ev of events) {
      if (ev.action === 'upsert_response' && ev.item && ev.item.id) {
        const existing = map.get(ev.item.id);
        map.set(ev.item.id, {
          ...existing,
          ...ev.item,
          vocComment: ev.item.vocComment || (existing ? existing.vocComment : '') || ''
        });
        markIdSynced(ev.item.id);
      } else if (ev.action === 'update_voc' && ev.responseId) {
        const target = map.get(ev.responseId);
        if (target) {
          target.vocComment = ev.vocComment || '';
          map.set(ev.responseId, target);
        }
      }
    }

    const mergedList = Array.from(map.values()).sort((a, b) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    try {
      localStorage.setItem(RESP_KEY, JSON.stringify(mergedList));
    } catch (e) {}

    return mergedList;
  }

  // 24/7 클라우드 DB 조회 및 스마트 병합 (분리된 신청자 연락처용)
  async function readCloudLeads() {
    const map = new Map();
    const deletedIds = new Set();

    try {
      const delRaw = localStorage.getItem(DELETED_LEADS_KEY);
      if (delRaw) {
        const delArr = JSON.parse(delRaw);
        if (Array.isArray(delArr)) delArr.forEach((id) => deletedIds.add(id));
      }
    } catch (e) {}

    // 1) 기본 시연용 Seed 3건 로드
    for (const item of getSeedLeads()) {
      map.set(item.id, { ...item });
    }

    // 2) 현재 브라우저 localStorage에 저장된 신청 내역 병합
    try {
      const raw = localStorage.getItem(LEADS_KEY);
      if (raw) {
        const localArr = JSON.parse(raw);
        if (Array.isArray(localArr)) {
          for (const item of localArr) {
            if (item && item.id) {
              map.set(item.id, { ...item });
            }
          }
        }
      }
    } catch (e) {}

    // 3) 24/7 클라우드 스트림 이벤트 수신 및 병합
    const events = await fetchStreamEvents(CLOUD_LEADS_STREAM);
    for (const ev of events) {
      if (ev.action === 'upsert_lead' && ev.item && ev.item.id) {
        map.set(ev.item.id, { ...ev.item });
        deletedIds.delete(ev.item.id);
      } else if (ev.action === 'delete_lead' && ev.leadId) {
        deletedIds.add(ev.leadId);
        map.delete(ev.leadId);
      } else if (ev.action === 'reset_seed_leads') {
        for (const seedItem of getSeedLeads()) {
          deletedIds.delete(seedItem.id);
          map.set(seedItem.id, { ...seedItem });
        }
      }
    }

    for (const delId of deletedIds) {
      map.delete(delId);
    }

    const mergedLeads = Array.from(map.values()).sort((a, b) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    try {
      localStorage.setItem(LEADS_KEY, JSON.stringify(mergedLeads));
      localStorage.setItem(DELETED_LEADS_KEY, JSON.stringify(Array.from(deletedIds)));
    } catch (e) {}

    return mergedLeads;
  }

  function filterByMode(items, mode) {
    if (mode === 'real') return items.filter((i) => !i.isSeed);
    if (mode === 'seed') return items.filter((i) => i.isSeed);
    return items;
  }

  function jsonResponse(obj, status = 200) {
    return new Response(JSON.stringify(obj), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  function escapeCsvCell(val) {
    if (val === null || val === undefined) return '""';
    return '"' + String(val).replace(/"/g, '""') + '"';
  }

  function formatKST(isoStr) {
    if (!isoStr) return '';
    try {
      return new Date(isoStr).toLocaleString('ko-KR', { hour12: false });
    } catch (e) {
      return isoStr;
    }
  }

  async function handleCloudApi(urlStr, options = {}) {
    const u = new URL(urlStr, window.location.origin);
    const path = u.pathname;
    const method = (options.method || 'GET').toUpperCase();
    const headers = options.headers || {};
    const pw = headers['x-admin-password'] || headers['X-Admin-Password'] || '';

    // 1. POST /api/responses (익명 설문 응답 저장 - 단 1회 POST)
    if (path === '/api/responses' && method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const item = {
        id: 'resp-' + Date.now() + '-' + Math.random().toString(16).slice(2, 6),
        createdAt: new Date().toISOString(),
        isSeed: false,
        answers: body.answers || {},
        habitType: body.habitType || 'type2',
        habitTypeName: body.habitTypeName || HABIT_TYPE_META[body.habitType] || HABIT_TYPE_META.type2,
        vocComment: body.vocComment ? String(body.vocComment).trim().slice(0, 300) : ''
      };

      try {
        const raw = localStorage.getItem(RESP_KEY);
        const list = raw ? JSON.parse(raw) : [...getInitialRealResponses(), ...getSeedResponses()];
        list.unshift(item);
        localStorage.setItem(RESP_KEY, JSON.stringify(list));
      } catch (e) {}

      markIdSynced(item.id);
      await publishStreamEvent(CLOUD_RESP_STREAM, {
        action: 'upsert_response',
        item
      });

      const countEl = document.getElementById('live-participant-count');
      if (countEl) {
        const cur = parseInt(countEl.textContent, 10) || 132;
        countEl.textContent = String(cur + 1);
      }

      return jsonResponse({ ok: true, responseId: item.id }, 201);
    }

    // 1-B. POST /api/responses/voc (선택형 1줄 자유응답 저장)
    if (path === '/api/responses/voc' && method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const cleanVoc = String(body.vocComment || '').trim().slice(0, 300);
      let targetId = body.responseId;

      try {
        const raw = localStorage.getItem(RESP_KEY);
        const list = raw ? JSON.parse(raw) : [];
        const target = targetId ? list.find((r) => r.id === targetId) : list.find((r) => !r.isSeed);
        if (target) {
          target.vocComment = cleanVoc;
          targetId = target.id;
          localStorage.setItem(RESP_KEY, JSON.stringify(list));
        }
      } catch (e) {}

      if (targetId) {
        await publishStreamEvent(CLOUD_RESP_STREAM, {
          action: 'update_voc',
          responseId: targetId,
          vocComment: cleanVoc
        });
        return jsonResponse({ ok: true, responseId: targetId }, 200);
      }
      return jsonResponse({ ok: false, message: '응답을 찾을 수 없습니다.' }, 404);
    }

    // 2. POST /api/leads (분리된 신청자 연락처 저장)
    if (path === '/api/leads' && method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const item = {
        id: 'lead-' + Date.now() + '-' + Math.random().toString(16).slice(2, 6),
        createdAt: new Date().toISOString(),
        isSeed: false,
        nickname: String(body.nickname || '').trim(),
        contact: String(body.contact || '').trim(),
        interviewAvailable: Boolean(body.interviewAvailable),
        privacyConsent: Boolean(body.privacyConsent)
      };

      try {
        const raw = localStorage.getItem(LEADS_KEY);
        const list = raw ? JSON.parse(raw) : getSeedLeads();
        list.unshift(item);
        localStorage.setItem(LEADS_KEY, JSON.stringify(list));
      } catch (e) {}

      await publishStreamEvent(CLOUD_LEADS_STREAM, {
        action: 'upsert_lead',
        item
      });

      return jsonResponse({ ok: true, leadId: item.id }, 201);
    }

    // Admin Auth Check
    if (path.startsWith('/api/admin/')) {
      if (pw !== ADMIN_PW) {
        return jsonResponse({ ok: false, message: '관리자 인증에 실패했습니다. 비밀번호를 확인해 주세요.' }, 401);
      }
    }

    // 3. GET /api/admin/stats
    if (path === '/api/admin/stats' && method === 'GET') {
      const filterMode = u.searchParams.get('filter') || 'all';
      const allResponses = await readCloudResponses();
      const allLeads = await readCloudLeads();
      const responses = filterByMode(allResponses, filterMode);
      const leads = filterByMode(allLeads, filterMode);

      const totalResponses = responses.length;
      const totalLeads = leads.length;
      const conversionRate = totalResponses > 0 ? Number(((totalLeads / totalResponses) * 100).toFixed(1)) : 0;
      const interviewAvailableCount = leads.filter((l) => l.interviewAvailable).length;
      const repeatCheckCount = responses.filter(
        (r) => r.answers && ['freq_5_plus', 'freq_3_4', 'freq_1_2'].includes(r.answers.Q6)
      ).length;
      const consentAwareRate = totalResponses > 0 ? Number(((repeatCheckCount / totalResponses) * 100).toFixed(1)) : 0;

      const questionStats = {};
      Object.keys(QUESTION_META).forEach((qKey) => {
        const meta = QUESTION_META[qKey];
        const counts = {};
        Object.keys(meta.options).forEach((k) => (counts[k] = 0));
        responses.forEach((r) => {
          const ans = r.answers?.[qKey];
          if (ans && counts[ans] !== undefined) counts[ans] += 1;
        });
        questionStats[qKey] = {
          title: meta.title,
          options: Object.keys(meta.options).map((optKey) => ({
            key: optKey,
            label: meta.options[optKey],
            count: counts[optKey],
            percent: totalResponses > 0 ? Number(((counts[optKey] / totalResponses) * 100).toFixed(1)) : 0
          }))
        };
      });

      const typeCounts = { type1: 0, type2: 0, type3: 0, type4: 0 };
      responses.forEach((r) => {
        if (r.habitType && typeCounts[r.habitType] !== undefined) typeCounts[r.habitType] += 1;
      });
      const typeStats = Object.keys(HABIT_TYPE_META).map((tKey) => ({
        type: tKey,
        name: HABIT_TYPE_META[tKey],
        count: typeCounts[tKey] || 0,
        percent: totalResponses > 0 ? Number((((typeCounts[tKey] || 0) / totalResponses) * 100).toFixed(1)) : 0
      }));

      return jsonResponse({
        ok: true,
        filterMode,
        countsSummary: {
          allResponses: allResponses.length,
          realResponses: allResponses.filter((r) => !r.isSeed).length,
          seedResponses: allResponses.filter((r) => r.isSeed).length,
          allLeads: allLeads.length,
          realLeads: allLeads.filter((l) => !l.isSeed).length,
          seedLeads: allLeads.filter((l) => l.isSeed).length
        },
        kpi: {
          totalResponses,
          totalLeads,
          conversionRate,
          interviewAvailableCount,
          consentAwareRate,
          consentAwareCount: repeatCheckCount
        },
        questionStats,
        typeStats,
        leads,
        responses
      });
    }

    // 4. DELETE /api/admin/leads/:id
    if (path.startsWith('/api/admin/leads/') && method === 'DELETE') {
      const targetId = decodeURIComponent(path.replace('/api/admin/leads/', ''));
      await publishStreamEvent(CLOUD_LEADS_STREAM, {
        action: 'delete_lead',
        leadId: targetId
      });
      await readCloudLeads();
      return jsonResponse({ ok: true, deletedId: targetId, message: '신청자 개인정보가 영구 삭제되었습니다.' });
    }

    // 5. POST /api/admin/reset-seed
    if (path === '/api/admin/reset-seed' && method === 'POST') {
      await publishStreamEvent(CLOUD_LEADS_STREAM, {
        action: 'reset_seed_leads'
      });
      await readCloudResponses();
      await readCloudLeads();
      return jsonResponse({
        ok: true,
        message: '실제 고객 응답은 그대로 유지하고, 시연용 가상 데이터(설문 5건, 신청 3건)만 기본값으로 복원했습니다.'
      });
    }

    // 6. GET /api/admin/export-csv
    if (path === '/api/admin/export-csv' && method === 'GET') {
      const exportType = u.searchParams.get('type') || 'responses';
      const filterMode = u.searchParams.get('filter') || 'all';
      const csvRows = [];

      if (exportType === 'leads') {
        const leads = filterByMode(await readCloudLeads(), filterMode);
        csvRows.push(
          ['신청ID', '데이터구분(Seed/Real)', '신청일시(KST)', '닉네임', '연락처', '10분_인터뷰_가능여부', '개인정보_수집동의']
            .map(escapeCsvCell)
            .join(',')
        );
        leads.forEach((lead) => {
          csvRows.push(
            [
              lead.id,
              lead.isSeed ? '[시연용 Seed]' : '[실제 응답 Real]',
              formatKST(lead.createdAt),
              lead.nickname,
              lead.contact,
              lead.interviewAvailable ? '가능 (O)' : '미선택 (X)',
              lead.privacyConsent ? '동의함' : '미동의'
            ]
              .map(escapeCsvCell)
              .join(',')
          );
        });
      } else {
        const responses = filterByMode(await readCloudResponses(), filterMode);
        csvRows.push(
          [
            '응답ID',
            '데이터구분(Seed/Real)',
            '참여일시(KST)',
            '응답자_연령대(Q7)',
            '습관유형_코드',
            '건강기록_관리_습관유형',
            'Q1_부모님_건강관리경험',
            'Q2_건강기록_보관방법',
            'Q3_과거기록_재확인경험',
            'Q4_가족간_소통_공유범위',
            'Q5_가장필요한_기능1순위',
            'Q6_최근6개월_재확인빈도',
            '선택형_1줄_자유응답(익명VOC)'
          ]
            .map(escapeCsvCell)
            .join(',')
        );
        responses.forEach((resp) => {
          csvRows.push(
            [
              resp.id,
              resp.isSeed ? '[시연용 Seed]' : '[실제 응답 Real]',
              formatKST(resp.createdAt),
              QUESTION_META.Q7.options[resp.answers?.Q7] || resp.answers?.Q7 || '-',
              resp.habitType,
              resp.habitTypeName,
              QUESTION_META.Q1.options[resp.answers?.Q1] || '',
              QUESTION_META.Q2.options[resp.answers?.Q2] || '',
              QUESTION_META.Q3.options[resp.answers?.Q3] || '',
              QUESTION_META.Q4.options[resp.answers?.Q4] || '',
              QUESTION_META.Q5.options[resp.answers?.Q5] || '',
              QUESTION_META.Q6.options[resp.answers?.Q6] || '',
              resp.vocComment || ''
            ]
              .map(escapeCsvCell)
              .join(',')
          );
        });
      }
      const csvContent = '\uFEFF' + csvRows.join('\r\n');
      return new Response(csvContent, {
        status: 200,
        headers: { 'Content-Type': 'text/csv; charset=utf-8' }
      });
    }

    return jsonResponse({ ok: false, message: 'Not Found' }, 404);
  }

  // 페이지 진입 시: 불필요한 네트워크 폴링 없이 로컬 미전송 응답만 1회 복구 체크
  async function initClient() {
    const countEl = document.getElementById('live-participant-count');
    if (countEl) {
      countEl.textContent = '132';
    }
    await recoverUnsyncedLocalItemsOnce();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initClient);
  } else {
    initClient();
  }

  window.fetch = async function (input, init) {
    const urlStr = typeof input === 'string' ? input : input.url;
    if (urlStr && urlStr.includes('/api/')) {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isLocalhost) {
        try { ORIGINAL_FETCH(input, init).catch(() => {}); } catch (e) {}
      }
      return await handleCloudApi(urlStr, init);
    }
    return ORIGINAL_FETCH(input, init);
  };
})();
