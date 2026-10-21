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

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));

// 시연용 초기 시드 데이터 (설문 응답 통계 - 개인 식별 정보 일절 없음)
function getSeedResponses() {
  return [
    {
      id: 'resp-seed-101',
      createdAt: '2026-10-19T14:22:10.000Z',
      isSeed: true,
      answers: {
        Q1: 'pain_recall',
        Q2: 'share_kakao',
        Q3: 'organize_scattered',
        Q4: 'auth_selective',
        Q5: 'feat_visit_card',
        Q6: 'biz_pay_per_use'
      },
      totalScore: 8,
      habitType: 'type2',
      habitTypeName: '사진첩·단톡방 스크롤 탐정형'
    },
    {
      id: 'resp-seed-102',
      createdAt: '2026-10-19T19:45:32.000Z',
      isSeed: true,
      answers: {
        Q1: 'pain_scattered',
        Q2: 'share_calendar_memo',
        Q3: 'organize_complex',
        Q4: 'auth_selective',
        Q5: 'feat_med_summary',
        Q6: 'biz_subscription'
      },
      totalScore: 11,
      habitType: 'type3',
      habitTypeName: '수첩·메모장 꼼꼼 기록 매니저형'
    },
    {
      id: 'resp-seed-103',
      createdAt: '2026-10-20T01:12:05.000Z',
      isSeed: true,
      answers: {
        Q1: 'pain_recall',
        Q2: 'share_none',
        Q3: 'organize_scattered',
        Q4: 'auth_card_only',
        Q5: 'feat_health_calendar',
        Q6: 'biz_ad_free'
      },
      totalScore: 6,
      habitType: 'type1',
      habitTypeName: '마음만은 든든, 기록 정리는 막막한 효심형'
    },
    {
      id: 'resp-seed-104',
      createdAt: '2026-10-20T05:30:18.000Z',
      isSeed: true,
      answers: {
        Q1: 'pain_question',
        Q2: 'share_album',
        Q3: 'organize_complex',
        Q4: 'auth_full_consent',
        Q5: 'feat_privacy_control',
        Q6: 'biz_pay_per_use'
      },
      totalScore: 9,
      habitType: 'type2',
      habitTypeName: '사진첩·단톡방 스크롤 탐정형'
    },
    {
      id: 'resp-seed-105',
      createdAt: '2026-10-20T09:15:44.000Z',
      isSeed: true,
      answers: {
        Q1: 'no_pain',
        Q2: 'share_cloud_app',
        Q3: 'organize_timeline',
        Q4: 'auth_selective',
        Q5: 'feat_visit_card',
        Q6: 'biz_subscription'
      },
      totalScore: 15,
      habitType: 'type4',
      habitTypeName: '체계적인 스마트 동행 기록 프로형'
    }
  ];
}

// 시연용 초기 시드 데이터 (초기 테스트 신청자 연락처 - 설문 응답과 분리 보관)
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

// 6개 문항 및 선택지 메타데이터 (심사위원 의견 100% 반영)
const QUESTION_META = {
  Q1: {
    title: 'Q1. [병원 동행·약 관리 경험] 최근 1년간 부모님의 병원 방문이나 약 관리를 도우면서 어떤 경험이 있으셨나요?',
    options: {
      pain_recall: '1. 진료실에서 이전 복용약이나 증상 시점을 바로 답하기 어려워 당황했다',
      pain_question: '2. 진료가 끝난 뒤에야 의사 선생님께 여쭤볼 질문이 떠올라 아쉬웠다',
      pain_scattered: '3. 여러 병원의 처방약·영양제 기록이 흩어져 있어 한눈에 확인하기 불편했다',
      no_pain: '4. 병원 방문이나 약 관리를 도왔지만 별다른 불편함은 없었다',
      future_concern: '5. 최근 1년간 직접 도운 경험은 없지만 향후 관리 방법이 고민된다'
    }
  },
  Q2: {
    title: 'Q2. [날짜별 건강 변화 기록·공유] 현재 부모님의 날짜별 건강 변화(이상 증상 메모, 증상이나 약봉투 사진, 병원 일정 등)를 어떻게 기록·보관하고 가족과 공유하시나요?',
    options: {
      share_album: '1. 스마트폰 사진첩에 찍어두고 필요할 때마다 스크롤해서 찾는다',
      share_kakao: '2. 가족 카카오톡 단톡방에 사진이나 메시지로 올린다',
      share_calendar_memo: '3. 캘린더·메모장 앱이나 수첩에 날짜별로 직접 적어둔다',
      share_cloud_app: '4. 가족 공유 폴더나 전용 기록 앱으로 체계적으로 모아둔다',
      share_none: '5. 별도로 기록하지 않고 부모님이나 가족의 기억에 의존한다'
    }
  },
  Q3: {
    title: 'Q3. [비진단 기록 확인·정리의 어려움] 진료 전 과거 복용약·영양제 정보나 이전 증상 기록을 다시 찾아 확인하면서 어떤 점이 가장 어려우셨나요?',
    options: {
      organize_scattered: '1. 약봉투·처방전이나 메모가 여러 곳에 흩어져 있어 다시 찾기가 막막하다',
      organize_complex: '2. 약 이름이 어렵고 가짓수가 많아 진료 전 한 장으로 모아 정리하기 번거롭다',
      organize_timeline: '3. 언제 어떤 증상이 있었는지 날짜별로 기억을 되짚어 요약하기 어렵다',
      organize_well: '4. 평소 날짜별로 잘 정리해 두어 다시 확인하는 데 큰 어려움이 없다'
    }
  },
  Q4: {
    title: 'Q4. [가족 간 접근권한 및 동의 방식] 가족 간 부모님 건강정보를 공유할 때 가장 중요하게 생각하는 ‘접근권한 및 동의’ 방식은 무엇인가요?',
    options: {
      auth_full_consent: '1. 부모님 사전 동의 후 모든 기록 공유',
      auth_selective: '2. 민감한 기록은 가리고 필요한 항목만 선택적 공유',
      auth_card_only: '3. 평소엔 비공개였다가 병원 방문 준비 카드만 공유',
      auth_unsure: '4. 잘 모르겠음'
    }
  },
  Q5: {
    title: 'Q5. [비진단 핵심 기능 1순위] 부모님 건강기록을 정리·관리할 때 가장 필요하다고 생각하는 핵심 기능 1순위는 무엇인가요?',
    options: {
      feat_health_calendar: '1. 날짜별 건강 캘린더·증상 사진첩 정리',
      feat_med_summary: '2. 처방전·복용약 요약 정리',
      feat_visit_card: '3. 병원 방문 준비 카드 생성',
      feat_privacy_control: '4. 가족 구성원별 세밀한 공유 범위 설정'
    }
  },
  Q6: {
    title: 'Q6. [AI 기록 정리 이용 방식 선호도] 추가 AI 기록 정리 기능(복약·증상 기록 자동 요약 등)을 이용할 때 선호하시는 방식은 무엇인가요?',
    options: {
      biz_ad_free: '1. 짧은 광고 시청 후 무료로 이용',
      biz_pay_per_use: '2. 병원 방문 전 필요할 때만 건당 소액 결제 (500~1,000원)',
      biz_subscription: '3. 온 가족이 함께 쓰는 월 정기 구독 (월 3,900~4,900원)',
      biz_free_basic: '4. 유료 결제 없이 무료 기본 기록 기능만 이용'
    }
  }
};

const HABIT_TYPE_META = {
  type1: '마음만은 든든, 기록 정리는 막막한 효심형',
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
// ※ 개인 식별 정보는 일절 받지 않으며 data/responses.json에만 저장
app.post('/api/responses', (req, res) => {
  try {
    const { answers, totalScore, habitType, habitTypeName } = req.body;
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
        Q6: String(answers.Q6)
      },
      totalScore: Number(totalScore) || 0,
      habitType: habitType || 'type1',
      habitTypeName: habitTypeName || HABIT_TYPE_META[habitType] || HABIT_TYPE_META.type1
    };

    responses.unshift(newResponse);
    writeResponses(responses);

    return res.status(201).json({
      ok: true,
      responseId: newResponse.id
    });
  } catch (err) {
    // 개인정보 평문 로깅 방지: 에러 요약만 출력
    console.error('[Check Server] 설문 응답 저장 중 오류 발생');
    return res.status(500).json({ ok: false, message: '설문 응답 저장 중 서버 오류가 발생했습니다.' });
  }
});

// 2. 초기 테스트 & 인터뷰 참여 신청 저장 API (POST /api/leads)
// ※ 설문 응답과 완전히 분리된 data/leads.json에만 저장하며, 서버 로그에 닉네임·연락처 평문을 절대 출력하지 않음
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
    // 개인정보 평문 로깅 절대 금지
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

    // Q4에서 선택적 공유/방문 카드 공유 등 세밀한 권한·동의 중요 응답 비율 (auth_selective + auth_card_only + auth_full_consent)
    const consentAwareCount = responses.filter(
      (r) => r.answers && ['auth_selective', 'auth_card_only', 'auth_full_consent'].includes(r.answers.Q4)
    ).length;
    const consentAwareRate = totalResponses > 0
      ? Number(((consentAwareCount / totalResponses) * 100).toFixed(1))
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
        consentAwareCount
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
app.post('/api/admin/reset-seed', requireAdminAuth, (req, res) => {
  try {
    writeResponses(getSeedResponses());
    writeLeads(getSeedLeads());
    return res.json({
      ok: true,
      message: '시연용 가상 데이터(설문 응답 5건, 초기 테스트 신청 3건)로 초기화되었습니다.'
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
// ※ 헤더 인증(x-admin-password) 필수로 검증하여 URL 쿼리 파라미터에 비밀번호가 남지 않도록 보안 강화
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
        '기록준비도_점수(4~16점)',
        '습관유형_코드',
        '건강기록_관리_습관유형',
        'Q1_병원동행_약관리경험',
        'Q2_날짜별_건강변화_기록공유방식',
        'Q3_과거기록_확인정리_어려움(비진단)',
        'Q4_가족간_접근권한_동의방식',
        'Q5_비진단_핵심기능_1순위',
        'Q6_AI기록정리_선호이용방식'
      ];
      csvRows.push(headers.map(escapeCsvCell).join(','));

      responses.forEach((resp) => {
        const q1Text = QUESTION_META.Q1.options[resp.answers?.Q1] || resp.answers?.Q1 || '';
        const q2Text = QUESTION_META.Q2.options[resp.answers?.Q2] || resp.answers?.Q2 || '';
        const q3Text = QUESTION_META.Q3.options[resp.answers?.Q3] || resp.answers?.Q3 || '';
        const q4Text = QUESTION_META.Q4.options[resp.answers?.Q4] || resp.answers?.Q4 || '';
        const q5Text = QUESTION_META.Q5.options[resp.answers?.Q5] || resp.answers?.Q5 || '';
        const q6Text = QUESTION_META.Q6.options[resp.answers?.Q6] || resp.answers?.Q6 || '';

        const row = [
          resp.id,
          resp.isSeed ? '[시연용 Seed]' : '[실제 응답 Real]',
          formatKST(resp.createdAt),
          resp.totalScore,
          resp.habitType,
          resp.habitTypeName,
          q1Text,
          q2Text,
          q3Text,
          q4Text,
          q5Text,
          q6Text
        ];
        csvRows.push(row.map(escapeCsvCell).join(','));
      });
    }

    // UTF-8 BOM (\uFEFF) 추가로 한글 엑셀 깨짐 방지
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
