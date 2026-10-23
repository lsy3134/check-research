const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'check2026!';

const DATA_DIR = path.join(__dirname, 'data');
const RESPONSES_FILE = path.join(DATA_DIR, 'responses.json');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS 허용 (외부 고정 도메인 check-research.surge.sh 연동 지원)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));

// 시연용 초기 시드 데이터 (설문 응답 통계 - 개인 식별 정보 일절 없음 + 익명 1줄 VOC 포함)
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

// 시연용 초기 시드 데이터 (초기 테스트 신청자 연락처 - 설문 응답과 물리적 분리 보관)
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

function ensureStorageFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(RESPONSES_FILE)) {
    fs.writeFileSync(RESPONSES_FILE, JSON.stringify(getSeedResponses(), null, 2), 'utf8');
  }
  if (!fs.existsSync(LEADS_FILE)) {
    fs.writeFileSync(LEADS_FILE, JSON.stringify(getSeedLeads(), null, 2), 'utf8');
  }
}

function readResponses() {
  ensureStorageFiles();
  try {
    const raw = fs.readFileSync(RESPONSES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getSeedResponses();
  } catch (err) {
    console.error('[Check Server] responses.json 읽기 오류, 시드 복구 진행');
    const seed = getSeedResponses();
    fs.writeFileSync(RESPONSES_FILE, JSON.stringify(seed, null, 2), 'utf8');
    return seed;
  }
}

function writeResponses(list) {
  ensureStorageFiles();
  fs.writeFileSync(RESPONSES_FILE, JSON.stringify(list, null, 2), 'utf8');
}

function readLeads() {
  ensureStorageFiles();
  try {
    const raw = fs.readFileSync(LEADS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getSeedLeads();
  } catch (err) {
    console.error('[Check Server] leads.json 읽기 오류, 시드 복구 진행');
    const seed = getSeedLeads();
    fs.writeFileSync(LEADS_FILE, JSON.stringify(seed, null, 2), 'utf8');
    return seed;
  }
}

function writeLeads(list) {
  ensureStorageFiles();
  fs.writeFileSync(LEADS_FILE, JSON.stringify(list, null, 2), 'utf8');
}

// 6개 문항 및 선택지 메타데이터 (중립성 및 1라운드 심사 기준 100% 반영)
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

// 관리자 API 인증 미들웨어 (x-admin-password 헤더 검증 필수)
function requireAdminAuth(req, res, next) {
  const passwordHeader = req.headers['x-admin-password'];
  if (!passwordHeader || passwordHeader !== ADMIN_PASSWORD) {
    return res.status(401).json({
      ok: false,
      message: '관리자 인증에 실패했습니다. 비밀번호를 다시 확인해 주세요.'
    });
  }
  next();
}

// 필터 헬퍼 ('all' | 'real' | 'seed')
function filterByMode(items, filterMode) {
  if (filterMode === 'real') {
    return items.filter((item) => item.isSeed === false);
  }
  if (filterMode === 'seed') {
    return items.filter((item) => item.isSeed === true);
  }
  return items;
}

// 1. 익명 설문 응답 저장 API (POST /api/responses)
app.post('/api/responses', (req, res) => {
  try {
    const { answers, habitType, habitTypeName, vocComment } = req.body;
    if (!answers || !answers.Q1 || !answers.Q6) {
      return res.status(400).json({ ok: false, message: '필수 설문 응답 항목이 누락되었습니다.' });
    }

    const responses = readResponses();
    const newResponse = {
      id: 'resp-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex'),
      createdAt: new Date().toISOString(),
      isSeed: false,
      answers: {
        Q1: String(answers.Q1),
        Q2: String(answers.Q2),
        Q3: String(answers.Q3),
        Q4: String(answers.Q4),
        Q5: String(answers.Q5),
        Q6: String(answers.Q6),
        Q7: answers.Q7 ? String(answers.Q7) : ''
      },
      habitType: habitType || 'type2',
      habitTypeName: habitTypeName || HABIT_TYPE_META[habitType] || HABIT_TYPE_META.type2,
      vocComment: vocComment ? String(vocComment).trim().slice(0, 300) : ''
    };

    responses.unshift(newResponse);
    writeResponses(responses);

    return res.status(201).json({
      ok: true,
      responseId: newResponse.id
    });
  } catch (err) {
    console.error('[Check Server] 설문 응답 저장 중 오류 발생');
    return res.status(500).json({ ok: false, message: '설문 응답 저장 중 서버 오류가 발생했습니다.' });
  }
});

// 1-B. 선택형 1줄 자유응답(VOC) 익명 업데이트 API (POST /api/responses/voc)
app.post('/api/responses/voc', (req, res) => {
  try {
    const { responseId, vocComment } = req.body;
    const cleanVoc = String(vocComment || '').trim().slice(0, 300);
    if (!cleanVoc) {
      return res.status(400).json({ ok: false, message: '의견 내용을 입력해 주세요.' });
    }

    const responses = readResponses();
    let target = null;
    if (responseId) {
      target = responses.find((r) => r.id === responseId);
    }
    if (!target) {
      target = responses.find((r) => !r.isSeed);
    }

    if (target) {
      target.vocComment = cleanVoc;
      writeResponses(responses);
      return res.json({ ok: true, responseId: target.id });
    }

    return res.status(404).json({ ok: false, message: '연결할 설문 응답을 찾을 수 없습니다.' });
  } catch (err) {
    console.error('[Check Server] 익명 VOC 저장 중 오류 발생');
    return res.status(500).json({ ok: false, message: '의견 저장 중 서버 오류가 발생했습니다.' });
  }
});

// 2. 초기 테스트 & 인터뷰 참여 신청 저장 API (POST /api/leads)
app.post('/api/leads', (req, res) => {
  try {
    const { nickname, contact, interviewAvailable, privacyConsent } = req.body;

    if (!nickname || !String(nickname).trim()) {
      return res.status(400).json({ ok: false, message: '닉네임을 입력해 주세요.' });
    }
    if (!contact || !String(contact).trim()) {
      return res.status(400).json({ ok: false, message: '연락처(휴대폰 번호, 카톡ID, 이메일 중 택1)를 입력해 주세요.' });
    }
    if (!privacyConsent) {
      return res.status(400).json({ ok: false, message: '개인정보 수집·이용에 동의해 주세요.' });
    }

    const leads = readLeads();
    const newLead = {
      id: 'lead-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex'),
      createdAt: new Date().toISOString(),
      isSeed: false,
      nickname: String(nickname).trim(),
      contact: String(contact).trim(),
      interviewAvailable: Boolean(interviewAvailable),
      privacyConsent: Boolean(privacyConsent)
    };

    leads.unshift(newLead);
    writeLeads(leads);

    return res.status(201).json({
      ok: true,
      leadId: newLead.id
    });
  } catch (err) {
    console.error('[Check Server] 리드 신청 저장 중 오류 발생 (개인정보 비출력)');
    return res.status(500).json({ ok: false, message: '신청 처리 중 오류가 발생했습니다.' });
  }
});

// 3. 관리자 대시보드 통계 및 명단 조회 API (GET /api/admin/stats?filter=all|real|seed)
app.get('/api/admin/stats', requireAdminAuth, (req, res) => {
  try {
    const filterMode = req.query.filter || 'all';
    const allResponses = readResponses();
    const allLeads = readLeads();

    const responses = filterByMode(allResponses, filterMode);
    const leads = filterByMode(allLeads, filterMode);

    const totalResponses = responses.length;
    const totalLeads = leads.length;
    const conversionRate = totalResponses > 0
      ? Number(((totalLeads / totalResponses) * 100).toFixed(1))
      : 0;
    const interviewAvailableCount = leads.filter((l) => l.interviewAvailable).length;

    // Q6에서 최근 6개월 내 1회 이상 재확인 경험 비율 (freq_5_plus, freq_3_4, freq_1_2)
    const repeatCheckCount = responses.filter(
      (r) => r.answers && ['freq_5_plus', 'freq_3_4', 'freq_1_2'].includes(r.answers.Q6)
    ).length;
    const consentAwareRate = totalResponses > 0
      ? Number(((repeatCheckCount / totalResponses) * 100).toFixed(1))
      : 0;

    // 문항별 통계 집계
    const questionStats = {};
    Object.keys(QUESTION_META).forEach((qKey) => {
      const meta = QUESTION_META[qKey];
      const counts = {};
      Object.keys(meta.options).forEach((optKey) => {
        counts[optKey] = 0;
      });
      responses.forEach((r) => {
        const ans = r.answers?.[qKey];
        if (ans && counts[ans] !== undefined) {
          counts[ans] += 1;
        }
      });

      questionStats[qKey] = {
        title: meta.title,
        options: Object.keys(meta.options).map((optKey) => {
          const count = counts[optKey];
          const percent = totalResponses > 0
            ? Number(((count / totalResponses) * 100).toFixed(1))
            : 0;
          return {
            key: optKey,
            label: meta.options[optKey],
            count,
            percent
          };
        })
      };
    });

    // 4가지 건강기록 관리 습관 유형 분포
    const typeCounts = { type1: 0, type2: 0, type3: 0, type4: 0 };
    responses.forEach((r) => {
      if (r.habitType && typeCounts[r.habitType] !== undefined) {
        typeCounts[r.habitType] += 1;
      }
    });

    const typeStats = Object.keys(HABIT_TYPE_META).map((tKey) => {
      const count = typeCounts[tKey] || 0;
      const percent = totalResponses > 0
        ? Number(((count / totalResponses) * 100).toFixed(1))
        : 0;
      return {
        type: tKey,
        name: HABIT_TYPE_META[tKey],
        count,
        percent
      };
    });

    return res.json({
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
  } catch (err) {
    console.error('[Check Server] 관리자 통계 조회 중 오류 발생');
    return res.status(500).json({ ok: false, message: '통계 조회 중 오류가 발생했습니다.' });
  }
});

// 4. 신청자 개인정보 개별 즉시 삭제 API (DELETE /api/admin/leads/:id)
app.delete('/api/admin/leads/:id', requireAdminAuth, (req, res) => {
  try {
    const targetId = req.params.id;
    const leads = readLeads();
    const index = leads.findIndex((l) => l.id === targetId);

    if (index === -1) {
      return res.status(404).json({ ok: false, message: '해당 신청자 항목을 찾을 수 없습니다.' });
    }

    leads.splice(index, 1);
    writeLeads(leads);

    return res.json({
      ok: true,
      deletedId: targetId,
      message: '신청자 개인정보가 영구 삭제되었습니다.'
    });
  } catch (err) {
    console.error('[Check Server] 신청자 개별 삭제 중 오류 발생');
    return res.status(500).json({ ok: false, message: '삭제 처리 중 오류가 발생했습니다.' });
  }
});

// 5. 관리자 시드 데이터 초기화 API (POST /api/admin/reset-seed)
// ※ 실제 고객 응답(isSeed: false)은 절대 삭제하지 않고 보존하며, 시연용 가상 데이터(isSeed: true)만 기본값으로 복원
app.post('/api/admin/reset-seed', requireAdminAuth, (req, res) => {
  try {
    const realResponses = readResponses().filter((r) => !r.isSeed);
    const realLeads = readLeads().filter((l) => !l.isSeed);
    writeResponses([...realResponses, ...getSeedResponses()]);
    writeLeads([...realLeads, ...getSeedLeads()]);
    return res.json({
      ok: true,
      message: '실제 고객 응답은 그대로 보존하고, 시연용 가상 데이터(설문 5건, 신청 3건)만 기본값으로 복원했습니다.'
    });
  } catch (err) {
    console.error('[Check Server] 시드 초기화 중 오류 발생');
    return res.status(500).json({ ok: false, message: '데이터 초기화 중 오류가 발생했습니다.' });
  }
});

// CSV 셀 이스케이프 헬퍼
function escapeCsvCell(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function formatKST(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false });
  } catch (e) {
    return isoStr;
  }
}

// 6. 관리자 CSV 다운로드 API (GET /api/admin/export-csv?type=responses|leads&filter=all|real|seed)
app.get('/api/admin/export-csv', requireAdminAuth, (req, res) => {
  try {
    const exportType = req.query.type || 'responses';
    const filterMode = req.query.filter || 'all';

    let csvRows = [];
    let filename = '';

    if (exportType === 'leads') {
      const leads = filterByMode(readLeads(), filterMode);
      filename = `check_test_leads_${filterMode}_${new Date().toISOString().slice(0, 10)}.csv`;
      const headers = [
        '신청ID',
        '데이터구분(Seed/Real)',
        '신청일시(KST)',
        '닉네임',
        '연락처(휴대폰/카톡ID/이메일)',
        '비대면_10분_인터뷰_가능여부',
        '개인정보_수집동의'
      ];
      csvRows.push(headers.map(escapeCsvCell).join(','));

      leads.forEach((lead) => {
        const row = [
          lead.id,
          lead.isSeed ? '[시연용 Seed]' : '[실제 응답 Real]',
          formatKST(lead.createdAt),
          lead.nickname,
          lead.contact,
          lead.interviewAvailable ? '가능 (O)' : '미선택 (X)',
          lead.privacyConsent ? '동의함' : '미동의'
        ];
        csvRows.push(row.map(escapeCsvCell).join(','));
      });
    } else {
      const responses = filterByMode(readResponses(), filterMode);
      filename = `check_survey_responses_${filterMode}_${new Date().toISOString().slice(0, 10)}.csv`;
      const headers = [
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
      ];
      csvRows.push(headers.map(escapeCsvCell).join(','));

      responses.forEach((resp) => {
        const q1Text = QUESTION_META.Q1.options[resp.answers?.Q1] || resp.answers?.Q1 || '';
        const q2Text = QUESTION_META.Q2.options[resp.answers?.Q2] || resp.answers?.Q2 || '';
        const q3Text = QUESTION_META.Q3.options[resp.answers?.Q3] || resp.answers?.Q3 || '';
        const q4Text = QUESTION_META.Q4.options[resp.answers?.Q4] || resp.answers?.Q4 || '';
        const q5Text = QUESTION_META.Q5.options[resp.answers?.Q5] || resp.answers?.Q5 || '';
        const q6Text = QUESTION_META.Q6.options[resp.answers?.Q6] || resp.answers?.Q6 || '';
        const q7Text = QUESTION_META.Q7.options[resp.answers?.Q7] || resp.answers?.Q7 || '-';

        const row = [
          resp.id,
          resp.isSeed ? '[시연용 Seed]' : '[실제 응답 Real]',
          formatKST(resp.createdAt),
          q7Text,
          resp.habitType,
          resp.habitTypeName,
          q1Text,
          q2Text,
          q3Text,
          q4Text,
          q5Text,
          q6Text,
          resp.vocComment || ''
        ];
        csvRows.push(row.map(escapeCsvCell).join(','));
      });
    }

    const csvContent = '\uFEFF' + csvRows.join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvContent);
  } catch (err) {
    console.error('[Check Server] CSV 내보내기 오류 발생');
    return res.status(500).json({ ok: false, message: 'CSV 생성 중 오류가 발생했습니다.' });
  }
});

// 보안 분리된 관리자 대시보드 라우트 (/admin)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 기본 사용자 라우트 (/)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  ensureStorageFiles();
  console.log(`====================================================`);
  console.log(`🌿 Check 비진단 건강기록 관리 습관 체크 & 수요조사 서버 실행 완료`);
  console.log(`👉 사용자 화면: http://localhost:${PORT}`);
  console.log(`🔐 보안 분리 페이지: http://localhost:${PORT}/admin`);
  console.log(`====================================================`);
});
