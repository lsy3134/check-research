/* =========================================================
   Check · 1분 부모님 건강기록 관리 습관 유형 체크 & 수요조사 프론트엔드 로직
   - 1라운드 심사 기준(문제 정의 명확성, 반복 확인 빈도, 가족별 선택적 소통) 및 중립성 100% 반영
   - 결과 유형 중립적 안내 (의학적 진단이나 실제 건강관리 능력을 평가한 결과 아님 명시)
   - 연락처 없이도 익명으로 남길 수 있는 선택형 1줄 자유응답(VOC) 저장 지원
   ========================================================= */

(function () {
  // 1. 중립적 객관식 6개 설문 문항 (Q1 ~ Q6)
  const QUESTIONS = [
    {
      id: 'Q1',
      step: 1,
      category: '질문 1 · 부모님 건강관리 경험',
      scene: '부모님의 외래 진료에 동행하거나 복약 기록을 챙기던 순간 중 \'가장 기억에 남는 경험\' 하나를 골라주세요.',
      question: '최근 1년 동안 부모님의 병원 방문이나 약 관리를 도우면서 어떤 경험이 있으셨나요?',
      options: [
        {
          key: 'exp_hard_answer',
          emoji: '💦',
          headline: '진료 중 바로 답하기 어려웠어요',
          desc: '복용약이나 증상이 시작된 시점을 물어본 경험',
          weights: { type1: 2, type2: 1 }
        },
        {
          key: 'exp_forgot_question',
          emoji: '💬',
          headline: '물어볼 질문을 잊어버렸어요',
          desc: '진료가 끝난 뒤 질문이 떠오른 경험',
          weights: { type2: 1, type3: 1 }
        },
        {
          key: 'exp_multi_meds',
          emoji: '💊',
          headline: '여러 약을 확인해야 했어요',
          desc: '서로 다른 병원의 처방약이나 영양제를 확인한 경험',
          weights: { type2: 2, type3: 2 }
        },
        {
          key: 'exp_no_issue',
          emoji: '✨',
          headline: '별다른 불편이 없었어요',
          desc: '필요한 정보를 확인하고 진료를 마친 경험',
          weights: { type4: 3 }
        },
        {
          key: 'exp_none_yet',
          emoji: '🌱',
          headline: '아직 직접 도운 경험이 없어요',
          desc: '앞으로 부모님 건강관리를 도울 가능성이 있는 경우',
          weights: { type1: 3 }
        }
      ]
    },
    {
      id: 'Q2',
      step: 2,
      category: '질문 2 · 건강기록 보관 방법',
      scene: '평소 부모님의 건강 관련 자료를 어디에 두고 확인하시는지 가장 가까운 방식을 하나 골라주세요.',
      question: '부모님의 약봉투, 증상 사진, 병원 일정은 평소 어디에 기록하거나 보관하시나요?',
      options: [
        {
          key: 'store_album',
          emoji: '📱',
          headline: '스마트폰 사진첩',
          desc: '약봉투나 병원 관련 자료를 사진으로 저장해요',
          weights: { type2: 4 }
        },
        {
          key: 'store_kakao',
          emoji: '💬',
          headline: '가족 카카오톡·문자',
          desc: '가족과 사진이나 메시지로 주고받아요',
          weights: { type2: 4 }
        },
        {
          key: 'store_memo',
          emoji: '📓',
          headline: '캘린더·메모장·수첩',
          desc: '날짜와 내용을 직접 적어둬요',
          weights: { type3: 4 }
        },
        {
          key: 'store_app_folder',
          emoji: '🗂️',
          headline: '전용 기록 앱·폴더',
          desc: '건강 관련 정보를 한곳에 모아둬요',
          weights: { type4: 4 }
        },
        {
          key: 'store_none',
          emoji: '🧠',
          headline: '별도로 기록하지 않아요',
          desc: '필요할 때 기억하거나 가족에게 확인해요',
          weights: { type1: 4 }
        }
      ]
    },
    {
      id: 'Q3',
      step: 3,
      category: '질문 3 · 과거 기록 재확인 경험',
      scene: '진료 전이나 약 확인 시 이전 기록을 다시 살펴보았던 경험을 떠올려 보세요.',
      question: '부모님의 이전 복용약이나 증상 기록을 다시 확인할 때, 어떤 경험이 있으셨나요?',
      options: [
        {
          key: 'recheck_search',
          emoji: '🔎',
          headline: '기록을 다시 찾아야 했어요',
          desc: '사진, 메시지, 서류 등을 찾아본 경험',
          weights: { type2: 2, type1: 1 }
        },
        {
          key: 'recheck_med_list',
          emoji: '📝',
          headline: '약 이름을 정리해야 했어요',
          desc: '여러 약의 이름이나 복용 정보를 모아본 경험',
          weights: { type3: 2, type2: 1 }
        },
        {
          key: 'recheck_symptom_date',
          emoji: '🗓️',
          headline: '증상 발생 시점을 확인해야 했어요',
          desc: '언제 증상이 있었는지 날짜를 확인한 경험',
          weights: { type3: 2, type1: 1 }
        },
        {
          key: 'recheck_easy',
          emoji: '✅',
          headline: '필요한 기록을 쉽게 확인했어요',
          desc: '평소 관리하던 기록을 바로 확인한 경험',
          weights: { type4: 3 }
        },
        {
          key: 'recheck_none',
          emoji: '🌱',
          headline: '다시 확인할 일이 없었어요',
          desc: '이전 기록을 찾아본 경험이 없는 경우',
          weights: { type1: 2 }
        }
      ]
    },
    {
      id: 'Q4',
      step: 4,
      category: '질문 4 · 가족 간 건강정보 소통 및 공유 범위',
      scene: '가족과 부모님의 건강정보를 나누거나 소통할 때의 경험 또는 선호하시는 방식을 골라주세요.',
      question: '부모님의 건강정보를 가족과 주고받거나 공유할 때 어떤 방식을 선호하시거나 경험하셨나요?',
      options: [
        {
          key: 'share_group_chat',
          emoji: '💬',
          headline: '가족 전체 단톡방에서 공유해요',
          desc: '모든 가족 구성원에게 사진이나 메시지를 전달한 경험',
          weights: { type2: 2 }
        },
        {
          key: 'share_selected_family',
          emoji: '🔒',
          headline: '필요한 가족만 선택해 따로 소통해요',
          desc: '원하는 가족만 초대하거나 일부에게만 정보를 전달한 경험',
          weights: { type3: 1, type4: 1 }
        },
        {
          key: 'share_visit_summary',
          emoji: '📋',
          headline: '병원 방문 전후로 필요한 기록만 공유해요',
          desc: '평소엔 각자 관리하고 진료 시점에만 요약 정보를 전달',
          weights: { type3: 1, type4: 1 }
        },
        {
          key: 'share_parent_consent',
          emoji: '🤝',
          headline: '부모님 사전 동의 후 허용된 항목만 공유해요',
          desc: '민감한 정보는 가리고 동의된 범위만 가족과 공유',
          weights: { type4: 2, type3: 1 }
        },
        {
          key: 'share_none_exp',
          emoji: '🌿',
          headline: '공유한 경험이 없어요',
          desc: '가족과 건강정보를 주고받지 않은 경우',
          weights: { type1: 2 }
        }
      ]
    },
    {
      id: 'Q5',
      step: 5,
      category: '질문 5 · 가장 필요한 기능 1순위',
      scene: '부모님의 건강기록을 정리·보관할 때 어떤 기능이 도움이 될지 의견을 들려주세요.',
      question: '부모님의 건강기록을 관리할 때, 가장 도움이 될 것 같은 기능 하나를 골라주세요.',
      options: [
        {
          key: 'feat_calendar',
          emoji: '📅',
          headline: '날짜별 건강 달력',
          desc: '증상 메모, 사진, 병원 일정을 날짜별로 기록',
          weights: {}
        },
        {
          key: 'feat_med_list',
          emoji: '💊',
          headline: '복용약·처방전 정리',
          desc: '약봉투와 처방전 내용을 목록으로 정리',
          weights: {}
        },
        {
          key: 'feat_visit_card',
          emoji: '📋',
          headline: '병원 방문 준비 카드',
          desc: '최근 기록과 질문을 한 장으로 정리',
          weights: {}
        },
        {
          key: 'feat_selective_share',
          emoji: '🔐',
          headline: '가족별 선택적 공유·소통',
          desc: '초대한 가족에게만 필요한 기록을 공유하고 소통',
          weights: {}
        },
        {
          key: 'feat_current_enough',
          emoji: '🌿',
          headline: '지금 방식으로 충분해요',
          desc: '별도의 기능이 필요하지 않은 경우',
          weights: {}
        }
      ]
    },
    {
      id: 'Q6',
      step: 6,
      category: '질문 6 · 실제 문제의 반복 빈도 (재사용성 확인)',
      scene: '최근 반년 동안 부모님의 건강정보나 복약 기록을 다시 확인했던 빈도를 알려주세요.',
      question: '최근 6개월 동안 부모님의 건강정보를 다시 찾거나 가족에게 확인해야 했던 일이 얼마나 자주 있었나요?',
      options: [
        {
          key: 'freq_5_plus',
          emoji: '🔄',
          headline: '5번 이상 있었어요',
          desc: '병원 방문이나 약 확인 때마다 자주 찾아본 경우',
          weights: {}
        },
        {
          key: 'freq_3_4',
          emoji: '📅',
          headline: '3~4번 있었어요',
          desc: '분기나 격월 단위로 기록을 다시 확인한 경우',
          weights: {}
        },
        {
          key: 'freq_1_2',
          emoji: '🔎',
          headline: '1~2번 있었어요',
          desc: '가끔 필요할 때 이전 기록을 찾아본 경우',
          weights: {}
        },
        {
          key: 'freq_zero',
          emoji: '✨',
          headline: '한 번도 없었어요',
          desc: '최근 6개월 내 다시 찾아볼 일이 없었던 경우',
          weights: {}
        },
        {
          key: 'freq_no_help',
          emoji: '🌱',
          headline: '최근 6개월 동안 부모님 건강관리를 도운 적이 없어요',
          desc: '해당 기간 내 관련 경험이 없는 경우',
          weights: {}
        }
      ]
    },
    {
      id: 'Q7',
      step: 7,
      category: '마지막 확인 · 응답자 연령대 선택',
      scene: '',
      question: '테스트 결과 분석을 위해 본인의 연령대를 선택해 주세요.',
      options: [
        {
          key: 'age_20s',
          emoji: '🌱',
          headline: '20대',
          desc: '',
          weights: {}
        },
        {
          key: 'age_30s',
          emoji: '🌿',
          headline: '30대',
          desc: '',
          weights: {}
        },
        {
          key: 'age_40s',
          emoji: '🌳',
          headline: '40대',
          desc: '',
          weights: {}
        },
        {
          key: 'age_50_plus',
          emoji: '🌺',
          headline: '50대 이상',
          desc: '',
          weights: {}
        }
      ]
    }
  ];

  // 2. 4가지 부모님 건강기록 관리 습관 유형 (사용자를 평가·단정하지 않는 중립적 설명)
  const HABIT_TYPES = {
    type1: {
      code: 'type1',
      badge: '기록 습관 유형 1 · 기억·대화 확인형',
      emoji: '🌷',
      title: '마음만은 든든, 기억·대화 중심 확인형',
      nickname: '“필요할 때 기억을 되짚거나 부모님·가족과 직접 대화하며 확인하는 유형이에요.”',
      description:
        '부모님의 건강정보를 별도의 도구에 적어두기보다, 필요할 때 기억을 떠올리거나 가족에게 물어보며 확인하는 유형이에요. 일상적인 안부 소통과 함께 자연스럽게 챙길 수 있어요. 만약 이전 복용약이나 증상 시점을 다시 확인해야 하는 순간이 생긴다면, 날짜별 건강 달력이나 사진 정리를 가볍게 시작해 보는 방법도 고려해 볼 수 있어요.',
      prescriptionTitle: '날짜별 건강 달력이나 방문 준비 카드를 필요에 따라 가볍게 활용해 볼 수 있어요.',
      prescriptionBody:
        '약봉투 사진이나 증상이 있었던 날짜를 달력 형태로 모아두면, 나중에 병원 방문 전 필요한 기록만 한 장의 카드로 확인하는 데 참고할 수 있어요.'
    },
    type2: {
      code: 'type2',
      badge: '기록 습관 유형 2 · 사진첩·대화방 활용형',
      emoji: '🔍',
      title: '사진첩·단톡방 스크롤 탐정형',
      nickname: '“부모님의 건강정보를 사진이나 가족 대화방을 통해 보관하고 확인하는 유형이에요.”',
      description:
        '부모님의 건강정보를 사진이나 가족 대화방을 통해 보관하고 확인하는 유형이에요. 사진과 메시지를 활용하면 정보를 빠르게 남길 수 있어요. 기록을 다시 찾는 일이 불편했다면 날짜별로 정리하는 방법도 고려해 볼 수 있어요.',
      prescriptionTitle: '사진과 메시지를 날짜별로 모아보고, 공유 범위를 선택하는 방법도 고려해 보세요.',
      prescriptionBody:
        '사진첩이나 대화방에 찍어둔 약봉투·증상 기록을 날짜별 달력으로 모아두거나, 필요한 가족에게만 선택적으로 공유하는 방식을 함께 활용해 볼 수 있어요.'
    },
    type3: {
      code: 'type3',
      badge: '기록 습관 유형 3 · 캘린더·수첩 기록형',
      emoji: '📓',
      title: '수첩·메모장 꼼꼼 기록 매니저형',
      nickname: '“부모님의 약 목록이나 병원 일정을 캘린더·메모장·수첩에 직접 적어두는 유형이에요.”',
      description:
        '부모님의 건강정보를 캘린더나 메모장, 수첩 등에 날짜와 내용으로 직접 기록하며 보관하는 유형이에요. 직접 내용을 적어두면 진료 전후에 필요한 사항을 차분히 확인할 수 있어요. 여러 약 이름이나 이전 기록을 한데 모으는 과정을 조금 더 간편하게 정리하는 방법도 함께 고려해 볼 수 있어요.',
      prescriptionTitle: '직접 적어두던 복약·증상 메모를 방문 준비 카드 형태로 모아볼 수 있어요.',
      prescriptionBody:
        '날짜별로 기록한 증상 메모와 처방약 목록을 진료 전 한 장의 요약 카드로 정리하고, 부모님 동의에 따라 원하는 가족과 공유하는 방법도 활용해 볼 수 있어요.'
    },
    type4: {
      code: 'type4',
      badge: '기록 습관 유형 4 · 전용 폴더·앱 정리형',
      emoji: '🏆',
      title: '체계적인 스마트 동행 기록 프로형',
      nickname: '“전용 기록 앱이나 폴더에 건강 관련 정보를 한곳에 모아 관리하는 유형이에요.”',
      description:
        '부모님의 약봉투, 증상 기록, 병원 일정을 전용 폴더나 기록 도구에 모아두고 확인하는 유형이에요. 평소 정리해 둔 방식을 통해 진료 시 필요한 정보를 비교적 수월하게 확인하고 계세요. 가족 구성원별로 공유 범위를 세밀하게 나누거나 진료 전 요약 카드로 공유하는 방식도 필요에 따라 고려해 볼 수 있어요.',
      prescriptionTitle: '가족별 선택적 공유 범위 설정과 병원 방문 준비 카드를 함께 활용해 보세요.',
      prescriptionBody:
        '평소 정리해 둔 기록 중 민감한 정보는 가리고, 부모님 사전 동의 하에 필요한 항목만 선택해 가족과 소통하는 방식을 고려해 볼 수 있어요.'
    }
  };

  // 상태 관리
  let currentStepIndex = 0; // 0 ~ 5
  const userAnswers = {};   // { Q1: '...', ... }
  let isTransitioning = false;
  let currentResponseId = null;
  let isVocSaved = false;

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

  // 선택형 1줄 자유응답(VOC) DOM
  const inputVocComment = document.getElementById('input-voc-comment');
  const btnSubmitVoc = document.getElementById('btn-submit-voc');
  const vocSavedMsg = document.getElementById('voc-saved-msg');

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
  const btnViralShareTop = document.getElementById('btn-viral-share-top');
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
    if (q.scene) {
      quizScene.textContent = q.scene;
      quizScene.classList.remove('hidden');
    } else {
      quizScene.textContent = '';
      quizScene.classList.add('hidden');
    }
    quizQuestion.textContent = q.question;

    optionsList.innerHTML = '';
    const prevSelected = userAnswers[q.id];

    q.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-card' + (prevSelected === opt.key ? ' selected' : '');
      btn.style.alignItems = opt.desc ? 'flex-start' : 'center';
      btn.innerHTML = `
        <span class="option-emoji">${opt.emoji}</span>
        <span class="option-content">
          <span class="option-headline" style="${opt.desc ? '' : 'margin-bottom:0;'}">${opt.headline}</span>
          ${opt.desc ? `<span class="option-desc">${opt.desc}</span>` : ''}
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

  // Q1~Q4의 보관·확인·소통 습관 기준으로 자연스럽게 결과 유형 매칭 (점수 서열화 배제)
  function evaluateHabitType() {
    const weights = { type1: 0, type2: 0, type3: 0, type4: 0 };

    // Q2(주 보관 방식)를 가장 핵심 기준으로 삼고, Q1·Q3·Q4의 경험 패턴을 더해 자연스럽게 매칭
    QUESTIONS.forEach((q) => {
      const ansKey = userAnswers[q.id];
      const chosen = q.options.find((o) => o.key === ansKey);
      if (!chosen || !chosen.weights) return;

      Object.keys(chosen.weights).forEach((tKey) => {
        weights[tKey] += chosen.weights[tKey];
      });
    });

    // 가장 가중치가 높은 유형 선택 (동점 시 Q2 보관 방식 우선 반영)
    let finalType = 'type2';
    const q2Ans = userAnswers.Q2;
    if (q2Ans === 'store_none') finalType = 'type1';
    else if (q2Ans === 'store_album' || q2Ans === 'store_kakao') finalType = 'type2';
    else if (q2Ans === 'store_memo') finalType = 'type3';
    else if (q2Ans === 'store_app_folder') finalType = 'type4';

    let maxWeight = weights[finalType];
    ['type1', 'type2', 'type3', 'type4'].forEach((tKey) => {
      if (weights[tKey] > maxWeight) {
        maxWeight = weights[tKey];
        finalType = tKey;
      }
    });

    return {
      habitType: finalType,
      typeData: HABIT_TYPES[finalType]
    };
  }

  // 설문 완료 시 익명 통계 서버 저장 (POST /api/responses) 및 결과 화면 표시
  async function finishQuizAndShowResult() {
    const evalData = evaluateHabitType();
    const tData = evalData.typeData;

    resultTypeBadge.textContent = tData.badge;
    if (resultScoreBadge) {
      resultScoreBadge.textContent = '설문 응답 기반 습관 안내';
    }
    resultEmoji.textContent = tData.emoji;
    resultTitle.textContent = tData.title;
    resultNickname.textContent = tData.nickname;
    resultDescription.textContent = tData.description;
    resultPrescriptionTitle.textContent = tData.prescriptionTitle;
    resultPrescriptionBody.textContent = tData.prescriptionBody;

    // VOC 초기화
    currentResponseId = null;
    isVocSaved = false;
    if (inputVocComment) inputVocComment.value = '';
    if (vocSavedMsg) vocSavedMsg.classList.add('hidden');
    if (btnSubmitVoc) {
      btnSubmitVoc.disabled = false;
      btnSubmitVoc.textContent = '익명으로 의견 남기기';
    }

    switchView(viewResult);

    // 익명 설문 응답 데이터만 data/responses.json에 저장 (개인 식별 정보 일절 없음)
    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: userAnswers,
          habitType: evalData.habitType,
          habitTypeName: tData.title,
          vocComment: ''
        })
      });
      const json = await res.json();
      if (json && json.responseId) {
        currentResponseId = json.responseId;
      }
    } catch (err) {
      console.error('익명 설문 응답 저장 실패');
    }
  }

  // 선택형 1줄 자유응답(VOC) 익명 저장 함수
  async function saveVocComment(silent = false) {
    if (!inputVocComment) return;
    const vocText = inputVocComment.value.trim();
    if (!vocText) {
      if (!silent) {
        showToast('남기실 한 줄 의견을 입력해 주세요.');
        inputVocComment.focus();
      }
      return;
    }

    if (btnSubmitVoc && !silent) {
      btnSubmitVoc.disabled = true;
      btnSubmitVoc.textContent = '저장 중...';
    }

    try {
      const res = await fetch('/api/responses/voc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseId: currentResponseId,
          vocComment: vocText
        })
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        isVocSaved = true;
        if (vocSavedMsg) vocSavedMsg.classList.remove('hidden');
        if (btnSubmitVoc) {
          btnSubmitVoc.disabled = true;
          btnSubmitVoc.textContent = '✓ 익명 의견 저장 완료';
        }
        if (!silent) {
          showToast('소중한 한 줄 의견이 익명으로 저장되었습니다!');
        }
      } else if (!silent && btnSubmitVoc) {
        btnSubmitVoc.disabled = false;
        btnSubmitVoc.textContent = '익명으로 의견 남기기';
      }
    } catch (e) {
      if (!silent && btnSubmitVoc) {
        btnSubmitVoc.disabled = false;
        btnSubmitVoc.textContent = '익명으로 의견 남기기';
      }
    }
  }

  if (btnSubmitVoc) {
    btnSubmitVoc.addEventListener('click', () => saveVocComment(false));
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

    // 만약 위쪽 VOC 칸에 내용을 적어두고 아직 저장 버튼을 안 눌렀다면 함께 익명 응답에 저장
    if (!isVocSaved && inputVocComment && inputVocComment.value.trim()) {
      await saveVocComment(true);
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

  async function copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const tempInput = document.createElement('textarea');
      tempInput.value = text;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
    }
  }

  async function handleViralShare() {
    const shareUrl = window.location.origin;
    const currentTypeTitle = (resultTitle && resultTitle.textContent)
      ? resultTitle.textContent.trim()
      : '사진첩·단톡방 스크롤 탐정형';
    const fullShareText = `나의 부모님 건강기록 관리 유형은 [${currentTypeTitle}]! 우리 가족도 1분 만에 확인해 보세요 👉 ${shareUrl}`;

    // 모바일 환경 등에서 Web Share API 지원 시 네이티브 공유 시트 호출
    const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
    if (isMobileDevice && navigator.share) {
      try {
        await navigator.share({
          title: '우리 가족의 부모님 건강기록 관리 유형은? (1분 체크)',
          text: `나의 부모님 건강기록 관리 유형은 [${currentTypeTitle}]! 우리 가족도 1분 만에 확인해 보세요 👉`,
          url: shareUrl
        });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') {
          return;
        }
        // 공유 시트 실패 시 클립보드 복사로 자동 전환
      }
    }

    try {
      await copyTextToClipboard(fullShareText);
      showToast('공유 문구와 링크가 복사되었습니다!');
    } catch (err) {
      showToast('공유 문구와 링크가 복사되었습니다!');
    }
  }

  if (btnViralShareTop) {
    btnViralShareTop.addEventListener('click', handleViralShare);
  }
  btnShareLink.addEventListener('click', handleViralShare);
  btnModalShare.addEventListener('click', handleViralShare);

  btnRestartQuiz.addEventListener('click', () => {
    Object.keys(userAnswers).forEach((k) => delete userAnswers[k]);
    currentStepIndex = 0;
    currentResponseId = null;
    isVocSaved = false;
    betaLeadForm.reset();
    if (inputVocComment) inputVocComment.value = '';
    if (vocSavedMsg) vocSavedMsg.classList.add('hidden');
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
