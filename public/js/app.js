/* =========================================================
   Check · 1분 부모님 건강기록 관리 습관 유형 체크 & 수요조사 프론트엔드 로직
   두원공대 최종 심사 의견 (비진단 기록 정리 집중, 가족별 접근권한·동의 구조 필수,
   설문 통계와 개인정보 분리 보관) 100% 반영
   ========================================================= */

(function () {
  // 1. 중립적 객관식 6개 설문 문항 (Q1 ~ Q6)
  const QUESTIONS = [
    {
      id: 'Q1',
      step: 1,
      category: '질문 1 · 병원 동행 및 약 관리 경험',
      scene: '🏥 부모님의 외래 진료에 동행하거나 복약 기록을 챙기던 순간을 떠올려 보세요.',
      question: '최근 1년간 부모님의 병원 방문이나 약 관리를 도우면서 어떤 경험이 있으셨나요?',
      options: [
        {
          key: 'pain_recall',
          emoji: '💦',
          headline: '진료실에서 이전 복용약이나 증상 시점을 바로 답하기 어려워 당황했다',
          desc: '갑작스러운 질문에 정확한 약 이름이나 증상 시작일이 바로 떠오르지 않았던 경험',
          score: 1,
          weights: { type1: 2 }
        },
        {
          key: 'pain_question',
          emoji: '💬',
          headline: '진료가 끝난 뒤에야 의사 선생님께 여쭤볼 질문이 떠올라 아쉬웠다',
          desc: '짧은 진료 시간 동안 미리 물어볼 질문을 적어가지 못해 돌아오며 아쉬웠던 경험',
          score: 2,
          weights: { type2: 1, type3: 1 }
        },
        {
          key: 'pain_scattered',
          emoji: '💊',
          headline: '여러 병원의 처방약·영양제 기록이 흩어져 있어 한눈에 확인하기 불편했다',
          desc: '약봉투와 영양제 기록이 여러 곳에 나뉘어 있어 모아 보기 번거로웠던 경험',
          score: 2,
          weights: { type2: 2, type3: 1 }
        },
        {
          key: 'no_pain',
          emoji: '✨',
          headline: '병원 방문이나 약 관리를 도왔지만 별다른 불편함은 없었다',
          desc: '평소 복약 기록과 진료 일정을 비교적 체계적으로 정리해 두고 있는 편',
          score: 4,
          weights: { type4: 3 }
        },
        {
          key: 'future_concern',
          emoji: '🌱',
          headline: '최근 1년간 직접 도운 경험은 없지만 향후 관리 방법이 고민된다',
          desc: '앞으로 부모님 병원 동행이나 건강기록 정리를 어떻게 시작할지 고민 중인 상태',
          score: 1,
          weights: { type1: 2 }
        }
      ]
    },
    {
      id: 'Q2',
      step: 2,
      category: '질문 2 · 날짜별 건강 변화 기록·보관 및 공유 방식',
      scene: '📅 이상 증상 메모, 증상이나 약봉투 사진, 다음 병원 예약일 등 날짜별 건강 기록...',
      question: '현재 부모님의 날짜별 건강 변화(이상 증상 메모, 증상이나 약봉투 사진, 병원 일정 등)를 어떻게 기록·보관하고 가족과 공유하시나요?',
      options: [
        {
          key: 'share_album',
          emoji: '📱',
          headline: '스마트폰 사진첩에 찍어두고 필요할 때마다 스크롤해서 찾는다',
          desc: '약봉투나 예약증을 사진으로 찍어두지만 일상 사진과 섞여 다시 찾기 번거로움',
          score: 2,
          weights: { type2: 3 }
        },
        {
          key: 'share_kakao',
          emoji: '💬',
          headline: '가족 카카오톡 단톡방에 사진이나 메시지로 올린다',
          desc: '단톡방에 공유해 두지만 대화 내역이 쌓이면 이전 기록을 찾기 어려움',
          score: 2,
          weights: { type2: 3 }
        },
        {
          key: 'share_calendar_memo',
          emoji: '📓',
          headline: '캘린더·메모장 앱이나 수첩에 날짜별로 직접 적어둔다',
          desc: '날짜별로 꼼꼼히 적지만 직접 타이핑하고 가족에게 따로 전달하는 수고가 듦',
          score: 3,
          weights: { type3: 3 }
        },
        {
          key: 'share_cloud_app',
          emoji: '📊',
          headline: '가족 공유 폴더나 전용 기록 앱으로 체계적으로 모아둔다',
          desc: '언제든 진료실에서 바로 꺼내 볼 수 있도록 디지털로 깔끔하게 모아 관리함',
          score: 4,
          weights: { type4: 3 }
        },
        {
          key: 'share_none',
          emoji: '🧠',
          headline: '별도로 기록하지 않고 부모님이나 가족의 기억에 의존한다',
          desc: '따로 적어두지 않고 필요할 때마다 부모님께 전화해 여쭤보는 편',
          score: 1,
          weights: { type1: 3 }
        }
      ]
    },
    {
      id: 'Q3',
      step: 3,
      category: '질문 3 · 과거 복용약·증상 기록 확인 및 정리의 어려움',
      scene: '🗂️ 외래 진료에 들어가기 전, 이전 처방약·영양제 기록과 날짜별 증상 메모를 다시 모을 때...',
      question: '진료 전 과거 복용약·영양제 정보나 이전 증상 기록을 다시 찾아 확인하면서 어떤 점이 가장 어려우셨나요?',
      options: [
        {
          key: 'organize_scattered',
          emoji: '🔍',
          headline: '약봉투·처방전이나 메모가 여러 곳에 흩어져 있어 다시 찾기가 막막하다',
          desc: '종이 약봉투, 사진첩, 카톡방 등에 흩어진 기록을 한곳에 모으기 어려운 점',
          score: 1,
          weights: { type1: 2, type2: 2 }
        },
        {
          key: 'organize_complex',
          emoji: '📝',
          headline: '약 이름이 어렵고 가짓수가 많아 진료 전 한 장으로 모아 정리하기 번거롭다',
          desc: '여러 병원 처방약과 영양제 이름을 일일이 수기로 타이핑해 정리하기 힘든 점',
          score: 2,
          weights: { type3: 2, type2: 1 }
        },
        {
          key: 'organize_timeline',
          emoji: '🗓️',
          headline: '언제 어떤 증상이 있었는지 날짜별로 기억을 되짚어 요약하기 어렵다',
          desc: '증상이 시작된 날짜와 빈도를 시간순(타임라인)으로 정리해 설명하기 어려운 점',
          score: 3,
          weights: { type3: 2 }
        },
        {
          key: 'organize_well',
          emoji: '✅',
          headline: '평소 날짜별로 잘 정리해 두어 다시 확인하는 데 큰 어려움이 없다',
          desc: '평소 복약 이력과 증상 메모를 날짜별로 잘 정리해 두고 있는 편',
          score: 4,
          weights: { type4: 3 }
        }
      ]
    },
    {
      id: 'Q4',
      step: 4,
      category: '질문 4 · 가족 간 건강정보 접근권한 및 동의 방식',
      scene: '🔒 부모님의 건강정보는 소중하고 민감한 개인정보이기에 부모님 동의와 공개 범위 설정이 중요합니다.',
      question: '가족 간 부모님 건강정보를 공유할 때 가장 중요하게 생각하는 ‘접근권한 및 동의’ 방식은 무엇인가요?',
      options: [
        {
          key: 'auth_full_consent',
          emoji: '🤝',
          headline: '부모님 사전 동의 후 모든 기록 공유',
          desc: '부모님의 명시적인 사전 동의를 거친 뒤 가족 구성원이 전체 기록을 함께 열람',
          score: 3,
          weights: { type3: 1, type4: 1 }
        },
        {
          key: 'auth_selective',
          emoji: '🛡️',
          headline: '민감한 기록은 가리고 필요한 항목만 선택적 공유',
          desc: '부모님 프라이버시를 위해 민감 기록은 비공개하고 가족별로 필요한 항목만 선택 공유',
          score: 4,
          weights: { type4: 2, type3: 1 }
        },
        {
          key: 'auth_card_only',
          emoji: '📋',
          headline: '평소엔 비공개였다가 병원 방문 준비 카드만 공유',
          desc: '일상 기록은 비공개로 두고 병원 동행 시 필요한 요약 카드만 한시적으로 공유',
          score: 3,
          weights: { type2: 1, type3: 1 }
        },
        {
          key: 'auth_unsure',
          emoji: '🤔',
          headline: '잘 모르겠음',
          desc: '가족 간 건강정보 공유 범위나 동의 방식에 대해 아직 구체적으로 생각해 본 적 없음',
          score: 1,
          weights: { type1: 1 }
        }
      ]
    },
    {
      id: 'Q5',
      step: 5,
      category: '질문 5 · 가장 필요한 비진단 기록 정리 핵심 기능 1순위',
      scene: '🪄 가족이 입력한 복약·증상 기록을 읽기 쉽게 정리해 주는 비진단 보조 기능들입니다.',
      question: '부모님 건강기록을 정리·관리할 때 가장 필요하다고 생각하는 핵심 기능 1순위는 무엇인가요?',
      options: [
        {
          key: 'feat_health_calendar',
          emoji: '📅',
          headline: '날짜별 건강 캘린더·증상 사진첩 정리',
          desc: '이상 증상 메모, 증상·약봉투 사진, 병원 일정을 날짜별 캘린더에 한눈에 모아 보관',
          score: 0,
          weights: {}
        },
        {
          key: 'feat_med_summary',
          emoji: '💊',
          headline: '처방전·복용약 요약 정리',
          desc: '여러 병원의 처방전·약봉투 기록을 촬영·입력하면 읽기 쉬운 복약 목록표로 단순 요약',
          score: 0,
          weights: {}
        },
        {
          key: 'feat_visit_card',
          emoji: '🏥',
          headline: '병원 방문 준비 카드 생성',
          desc: '최근 증상 메모, 복용약 기록 요약, 여쭤볼 질문 3가지를 진료 지참용 1장 카드로 정리',
          score: 0,
          weights: {}
        },
        {
          key: 'feat_privacy_control',
          emoji: '🔐',
          headline: '가족 구성원별 세밀한 공유 범위 설정',
          desc: '부모님 사전 동의 기반, 가족별·항목별 열람 권한 및 공개 범위를 안전하게 설정',
          score: 0,
          weights: {}
        }
      ]
    },
    {
      id: 'Q6',
      step: 6,
      category: '질문 6 · 추가 AI 기록 정리 기능 이용 방식 선호도',
      scene: '💡 기본 건강 캘린더와 수동 기록은 무료로 제공될 때, 추가 AI 기록 자동 요약 기능의 선호 방식을 알려주세요.',
      question: '추가 AI 기록 정리 기능(복약·증상 기록 자동 요약 등)을 이용할 때 선호하시는 방식은 무엇인가요?',
      options: [
        {
          key: 'biz_ad_free',
          emoji: '📺',
          headline: '짧은 광고 시청 후 무료로 이용',
          desc: '필요할 때마다 15~30초 광고를 시청하고 무료로 AI 기록 요약 기능을 이용',
          score: 0,
          weights: {}
        },
        {
          key: 'biz_pay_per_use',
          emoji: '🪙',
          headline: '병원 방문 전 필요할 때만 건당 소액 결제 (500~1,000원)',
          desc: '월 고정 구독료 없이 병원 진료 전 요약 카드가 필요할 때만 소액으로 이용',
          score: 0,
          weights: {}
        },
        {
          key: 'biz_subscription',
          emoji: '👨‍👩‍👧',
          headline: '온 가족이 함께 쓰는 월 정기 구독 (월 3,900~4,900원)',
          desc: '커피 한 잔 값으로 부모님과 형제자매가 광고 없이 기록 정리 기능을 무제한 이용',
          score: 0,
          weights: {}
        },
        {
          key: 'biz_free_basic',
          emoji: '🆓',
          headline: '유료 결제 없이 무료 기본 기록 기능만 이용',
          desc: '유료 결제나 광고 시청 없이 기본 제공되는 수동 기록·보관 기능만 사용',
          score: 0,
          weights: {}
        }
      ]
    }
  ];

  // 2. 4가지 부모님 건강기록 관리 습관 유형 (비진단 습관 분류)
  const HABIT_TYPES = {
    type1: {
      code: 'type1',
      badge: '습관 유형 1 · 효심기록시작형',
      emoji: '🌷',
      title: '마음만은 든든, 기록 정리는 막막한 효심형',
      nickname: '“부모님 건강을 챙기고 싶은 마음은 굴뚝같은데, 기록을 어디서부터 모을지 막막해요!”',
      description:
        '부모님 생각만 하면 늘 마음이 쓰이고 더 챙겨드리고 싶은 다정한 자녀분이시군요! 다만 바쁜 일상 속에서 부모님이 어떤 약을 드시는지, 언제 어떤 증상이 있으셨는지 날짜별로 따로 기록해 두기가 쉽지 않으셨을 거예요. 진료실에서 이전 기록이 바로 떠오르지 않아 아쉬웠던 경험도 있으셨을 텐데요, 이제 복잡한 수기 정리 대신 간편한 기록 도구를 시작해 볼 타이밍입니다.',
      prescriptionTitle: '기억에 의존하는 부담을 덜고 ‘날짜별 건강 캘린더’로 가볍게 기록을 시작해 보세요.',
      prescriptionBody:
        '본가에 가셨을 때 약봉투와 이상 증상 시점을 건강 캘린더에 사진과 짧은 메모로 남겨두세요. Check가 흩어진 기록을 읽기 쉽게 모아 드리고, 병원 방문 전에는 부모님 동의 하에 진료에 필요한 항목만 담긴 ‘병원 방문 준비 카드’로 깔끔하게 요약해 드립니다.'
    },
    type2: {
      code: 'type2',
      badge: '습관 유형 2 · 스크롤탐정형',
      emoji: '🔍',
      title: '사진첩·단톡방 스크롤 탐정형',
      nickname: '“분명 지난달에 단톡방이나 사진첩에 약봉투 찍어 올렸는데... 어디 갔지?!”',
      description:
        '부모님 처방전이나 병원 예약증이 생길 때마다 부지런히 사진을 찍고 가족 단톡방에 공유하는 센스 만점 자녀분이시네요! 하지만 막상 병원 진료실 앞에서 과거 기록을 다시 찾으려고 하면, 수많은 일상 사진과 안부 대화 속에 파묻혀 한참 동안 스크롤을 올려야 했던 번거로움이 있으셨을 거예요. 기록하려는 습관은 이미 훌륭하지만, 기록이 여러 곳에 흩어져 있어 정리 피로도가 높은 상태입니다.',
      prescriptionTitle: '단톡방과 사진첩에 흩어진 기록들, 이제 ‘날짜별 건강 캘린더’ 한곳에 모아보세요.',
      prescriptionBody:
        '약봉투 사진과 증상 메모를 날짜별로 한눈에 모아 보관할 수 있어요. 특히 가족 전체에게 모든 민감 기록을 무조건 노출하는 단톡방 대신, 부모님 사전 동의 하에 필요한 항목만 선택적으로 공유하는 안전한 접근권한 설정을 활용해 보세요.'
    },
    type3: {
      code: 'type3',
      badge: '습관 유형 3 · 꼼꼼수첩매니저형',
      emoji: '📓',
      title: '수첩·메모장 꼼꼼 기록 매니저형',
      nickname: '“부모님 복용약 목록부터 여쭤볼 질문까지 직접 적어두는 든든한 가족 매니저!”',
      description:
        '가족 중에서 부모님의 병원 일정과 건강 기록을 가장 주도적으로 챙기는 든든한 매니저 역할을 하고 계시군요! 진료 전 캘린더나 수첩에 증상 시점과 질문을 적어 가는 정성이 정말 놀랍습니다. 다만 어렵고 긴 처방약 이름을 일일이 수기로 타이핑하고, 진료 후 형제자매에게 결과를 다시 요약해 전달하느라 혼자서 너무 많은 정리 수고를 감당하고 계십니다.',
      prescriptionTitle: '정성스러운 기록 습관에 ‘비진단 AI 요약’과 ‘선택적 공유’를 더해 수고를 덜어보세요!',
      prescriptionBody:
        '번거로운 약 이름 타이핑 대신 약봉투 기록 요약 기능을 활용하면 진료 지참용 ‘병원 방문 준비 카드’가 1장 표로 깔끔하게 정리됩니다. 부모님 동의에 따라 가족별로 공유 범위를 안전하게 설정해 기록 전달 부담도 줄여보세요.'
    },
    type4: {
      code: 'type4',
      badge: '습관 유형 4 · 스마트기록프로형',
      emoji: '🏆',
      title: '체계적인 스마트 동행 기록 프로형',
      nickname: '“날짜별 기록 정리부터 가족 간 공유 범위까지 빈틈없이 챙기는 스마트 파트너!”',
      description:
        '부모님의 날짜별 증상 기록과 복용약 목록을 평소에도 체계적으로 정리하고 가족과 현명하게 공유하고 계신 프로 기록러시네요! 진료실에서도 준비된 메모로 핵심 질문을 빠짐없이 여쭤보실 수 있는 든든한 준비성을 갖추고 계십니다. 앞으로 부모님의 진료과가 늘어나거나 가족 간 프라이버시 보호가 더욱 중요해질 때, 전용 건강기록 지갑이 함께한다면 더욱 완벽할 거예요.',
      prescriptionTitle: '부모님의 프라이버시를 지키는 ‘세밀한 가족 권한 설정’과 ‘방문 준비 카드’를 경험해 보세요.',
      prescriptionBody:
        '평소에는 민감한 건강 기록을 비공개로 안전하게 보관하고, 병원 방문 시에만 부모님 사전 동의 하에 ‘병원 방문 준비 카드’를 가족이나 부모님 휴대폰으로 간편하게 공유해 보세요.'
    }
  };

  // 상태 관리
  let currentStepIndex = 0; // 0 ~ 5
  const userAnswers = {};   // { Q1: 'pain_recall', ... }
  let isTransitioning = false;

  // DOM 요소 참조
  const viewLanding = document.getElementById('view-landing');
  const viewQuiz = document.getElementById('view-quiz');
  const viewResult = document.getElementById('view-result');

  const btnStartQuiz = document.getElementById('btn-start-quiz');
  const btnPrev = document.getElementById('btn-prev');
  const headerLogo = document.getElementById('header-logo');
  const quizStepBadge = document.getElementById('quiz-step-badge');
  const progressTrack = document.getElementById('progress-track');
  const progressFill = document.getElementById('progress-fill');

  const quizCard = document.getElementById('quiz-card');
  const quizCategory = document.getElementById('quiz-category');
  const quizScene = document.getElementById('quiz-scene');
  const quizQuestion = document.getElementById('quiz-question');
  const optionsList = document.getElementById('options-list');

  // 결과 화면 DOM
  const resultTypeBadge = document.getElementById('result-type-badge');
  const resultScoreBadge = document.getElementById('result-score-badge');
  const resultEmoji = document.getElementById('result-emoji');
  const resultTitle = document.getElementById('result-title');
  const resultNickname = document.getElementById('result-nickname');
  const resultDescription = document.getElementById('result-description');
  const resultPrescriptionTitle = document.getElementById('result-prescription-title');
  const resultPrescriptionBody = document.getElementById('result-prescription-body');

  // 신청 폼 DOM
  const betaLeadForm = document.getElementById('beta-lead-form');
  const inputNickname = document.getElementById('input-nickname');
  const inputContact = document.getElementById('input-contact');
  const inputInterview = document.getElementById('input-interview');
  const inputPrivacy = document.getElementById('input-privacy');
  const btnTogglePrivacy = document.getElementById('btn-toggle-privacy');
  const privacyDetailBox = document.getElementById('privacy-detail-box');
  const formErrorMsg = document.getElementById('form-error-msg');
  const btnSubmitLead = document.getElementById('btn-submit-lead');

  // 모달 & 공유 DOM
  const modalThankyou = document.getElementById('modal-thankyou');
  const modalUserName = document.getElementById('modal-user-name');
  const btnModalShare = document.getElementById('btn-modal-share');
  const btnModalClose = document.getElementById('btn-modal-close');
  const btnShareLink = document.getElementById('btn-share-link');
  const btnRestartQuiz = document.getElementById('btn-restart-quiz');
  const toastMessage = document.getElementById('toast-message');

  function switchView(targetView) {
    [viewLanding, viewQuiz, viewResult].forEach((v) => v.classList.remove('active'));
    targetView.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (targetView === viewQuiz) {
      btnPrev.classList.remove('hidden');
      quizStepBadge.classList.remove('hidden');
      progressTrack.classList.remove('hidden');
      headerLogo.classList.add('hidden');
    } else {
      btnPrev.classList.add('hidden');
      quizStepBadge.classList.add('hidden');
      progressTrack.classList.add('hidden');
      headerLogo.classList.remove('hidden');
    }
  }

  function renderQuestion(index) {
    const q = QUESTIONS[index];
    if (!q) return;

    const total = QUESTIONS.length;
    quizStepBadge.textContent = `${index + 1} / ${total}`;
    const pct = (((index + 1) / total) * 100).toFixed(2);
    progressFill.style.width = `${pct}%`;

    quizCategory.textContent = q.category;
    quizScene.textContent = q.scene;
    quizQuestion.textContent = q.question;

    optionsList.innerHTML = '';
    const prevSelected = userAnswers[q.id];

    q.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-card' + (prevSelected === opt.key ? ' selected' : '');
      btn.innerHTML = `
        <span class="option-emoji">${opt.emoji}</span>
        <span class="option-content">
          <span class="option-headline">${opt.headline}</span>
          <span class="option-desc">${opt.desc}</span>
        </span>
      `;
      btn.addEventListener('click', () => handleOptionSelect(q.id, opt.key, btn));
      optionsList.appendChild(btn);
    });
  }

  function handleOptionSelect(questionId, optionKey, btnElement) {
    if (isTransitioning) return;
    isTransitioning = true;

    userAnswers[questionId] = optionKey;

    const allBtns = optionsList.querySelectorAll('.option-card');
    allBtns.forEach((b) => b.classList.remove('selected'));
    btnElement.classList.add('selected');

    setTimeout(() => {
      if (currentStepIndex < QUESTIONS.length - 1) {
        quizCard.classList.add('fade-out');
        setTimeout(() => {
          currentStepIndex += 1;
          renderQuestion(currentStepIndex);
          quizCard.classList.remove('fade-out');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          isTransitioning = false;
        }, 180);
      } else {
        finishQuizAndShowResult();
        isTransitioning = false;
      }
    }, 240);
  }

  // 비진단 건강기록 관리 습관 유형 산출 (Q1~Q4 점수 합산 4~16점)
  function evaluateHabitType() {
    let totalScore = 0;
    const weights = { type1: 0, type2: 0, type3: 0, type4: 0 };

    QUESTIONS.forEach((q) => {
      const ansKey = userAnswers[q.id];
      const chosen = q.options.find((o) => o.key === ansKey);
      if (!chosen) return;

      if (['Q1', 'Q2', 'Q3', 'Q4'].includes(q.id)) {
        totalScore += chosen.score || 0;
        if (chosen.weights) {
          Object.keys(chosen.weights).forEach((tKey) => {
            weights[tKey] += chosen.weights[tKey];
          });
        }
      }
    });

    let baseType = 'type1';
    if (totalScore >= 14) {
      baseType = 'type4';
    } else if (totalScore >= 10) {
      baseType = 'type3';
    } else if (totalScore >= 7) {
      baseType = 'type2';
    } else {
      baseType = 'type1';
    }

    let finalType = baseType;
    if (totalScore === 6 && weights.type2 > weights.type1 + 1) finalType = 'type2';
    if (totalScore === 7 && weights.type1 > weights.type2 + 1) finalType = 'type1';
    if (totalScore === 9 && weights.type3 > weights.type2 + 1) finalType = 'type3';
    if (totalScore === 10 && weights.type2 > weights.type3 + 1) finalType = 'type2';
    if (totalScore === 13 && weights.type4 > weights.type3 + 1) finalType = 'type4';

    return {
      totalScore,
      habitType: finalType,
      typeData: HABIT_TYPES[finalType]
    };
  }

  // 설문 완료 시 익명 통계 서버 저장 (POST /api/responses) 및 결과 화면 표시
  async function finishQuizAndShowResult() {
    const evalData = evaluateHabitType();
    const tData = evalData.typeData;

    resultTypeBadge.textContent = tData.badge;
    resultScoreBadge.textContent = `기록 준비도 ${evalData.totalScore} / 16점`;
    resultEmoji.textContent = tData.emoji;
    resultTitle.textContent = tData.title;
    resultNickname.textContent = tData.nickname;
    resultDescription.textContent = tData.description;
    resultPrescriptionTitle.textContent = tData.prescriptionTitle;
    resultPrescriptionBody.textContent = tData.prescriptionBody;

    switchView(viewResult);

    // 익명 설문 응답 데이터만 data/responses.json에 저장 (개인 식별 정보 일절 없음)
    try {
      await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: userAnswers,
          totalScore: evalData.totalScore,
          habitType: evalData.habitType,
          habitTypeName: tData.title
        })
      });
    } catch (err) {
      console.error('익명 설문 응답 저장 실패');
    }
  }

  btnStartQuiz.addEventListener('click', () => {
    currentStepIndex = 0;
    renderQuestion(currentStepIndex);
    switchView(viewQuiz);
  });

  btnPrev.addEventListener('click', () => {
    if (currentStepIndex > 0) {
      currentStepIndex -= 1;
      renderQuestion(currentStepIndex);
    } else {
      switchView(viewLanding);
    }
  });

  // 개인정보 상세보기 토글
  btnTogglePrivacy.addEventListener('click', () => {
    const isHidden = privacyDetailBox.classList.toggle('hidden');
    btnTogglePrivacy.textContent = isHidden ? '상세보기 ▼' : '상세접기 ▲';
  });

  // 초기 테스트 참여 신청 폼 제출 (POST /api/leads - 설문 통계와 분리 보관)
  betaLeadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formErrorMsg.classList.add('hidden');

    const nickname = inputNickname.value.trim();
    const contact = inputContact.value.trim();
    const interviewAvailable = inputInterview.checked;
    const privacyConsent = inputPrivacy.checked;

    if (!nickname) {
      showFormError('닉네임을 입력해 주세요.');
      inputNickname.focus();
      return;
    }
    if (!contact) {
      showFormError('연락처(휴대폰 번호, 카톡ID, 이메일 중 택1)를 입력해 주세요.');
      inputContact.focus();
      return;
    }
    if (!privacyConsent) {
      showFormError('필수 개인정보 수집·이용에 동의해 주세요.');
      inputPrivacy.focus();
      return;
    }

    btnSubmitLead.disabled = true;
    btnSubmitLead.innerHTML = '<span>신청 정보를 안전하게 전송 중이에요...</span>';

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname,
          contact,
          interviewAvailable,
          privacyConsent
        })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '신청 중 문제가 발생했습니다.');
      }

      modalUserName.textContent = nickname;
      modalThankyou.classList.remove('hidden');
      btnSubmitLead.innerHTML = '<span>✓ 초기 테스트 & 인터뷰 참여 신청이 완료되었습니다</span>';
    } catch (err) {
      showFormError(err.message || '네트워크 오류가 발생했습니다. 다시 시도해 주세요.');
      btnSubmitLead.disabled = false;
      btnSubmitLead.innerHTML = '<span>시제품 초기 테스트 & 인터뷰 참여 신청하기</span>';
    }
  });

  function showFormError(msg) {
    formErrorMsg.textContent = msg;
    formErrorMsg.classList.remove('hidden');
  }

  btnModalClose.addEventListener('click', () => {
    modalThankyou.classList.add('hidden');
  });

  async function copyShareLink() {
    const shareUrl = window.location.origin;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const tempInput = document.createElement('input');
        tempInput.value = shareUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      showToast('링크가 복사되었습니다! 가족 단톡방에 공유해 보세요 💚');
    } catch (err) {
      showToast('링크가 복사되었습니다: ' + shareUrl);
    }
  }

  btnShareLink.addEventListener('click', copyShareLink);
  btnModalShare.addEventListener('click', copyShareLink);

  btnRestartQuiz.addEventListener('click', () => {
    Object.keys(userAnswers).forEach((k) => delete userAnswers[k]);
    currentStepIndex = 0;
    betaLeadForm.reset();
    btnSubmitLead.disabled = false;
    btnSubmitLead.innerHTML = '<span>시제품 초기 테스트 & 인터뷰 참여 신청하기</span>';
    switchView(viewLanding);
  });

  function showToast(text) {
    toastMessage.textContent = text;
    toastMessage.classList.remove('hidden');
    setTimeout(() => {
      toastMessage.classList.add('hidden');
    }, 3000);
  }
})();
