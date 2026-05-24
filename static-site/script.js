function syncBadgeLine() {
  const firstBadge = document.querySelector('.badge');

  if (!firstBadge) {
    return;
  }

  const badgeLeft = firstBadge.getBoundingClientRect().left;
  document.documentElement.style.setProperty('--badge-line', `${badgeLeft}px`);
}

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

window.scrollTo(0, 0);

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
const easeInOutQuart = (value) => (
  value < 0.5
    ? 8 * value * value * value * value
    : 1 - Math.pow(-2 * value + 2, 4) / 2
);
const easeOutQuint = (value) => 1 - Math.pow(1 - value, 5);
let educationProgress = 0;
let educationTargetProgress = 0;
let educationAnimationFrame = null;
let educationLocked = false;
let educationCompleted = false;
let educationLockScrollY = 0;
const educationOverlap = 0.08;
const educationStackGap = 44;
const educationHiddenY = 300;
const educationLockOffset = 70;
const educationScrollScene = 2200;
let statsProgress = 0;
let statsTargetProgress = 0;
let statsAnimationFrame = null;
let statsLocked = false;
let statsCompleted = false;
let statsLockScrollY = 0;

function renderStatsScene(progress) {
  const photo = document.querySelector('.stats-photo-wrap');
  const facts = Array.from(document.querySelectorAll('.stats-fact'));
  const checklistPage = document.querySelector('.stats-checklist-page');
  const scriptTitle = document.querySelector('.section-script-stats');

  if (!photo || !facts.length) {
    return;
  }

  // Phase 1 & 2: Photo zoom (starts at 0.41, reaches full screen at 0.72)
  const photoProgress = easeInOutQuart(clamp((progress - 0.41) / 0.31));
  const startWidth = 286;
  const startHeight = 154;
  const endWidth = window.innerWidth + 40;
  const endHeight = window.innerHeight + 40;
  const width = startWidth + ((endWidth - startWidth) * photoProgress);
  const height = startHeight + ((endHeight - startHeight) * photoProgress);
  const radius = 18 * (1 - photoProgress);
  const shadow = 0.12 * (1 - photoProgress);

  const topOffset = 30 * (1 - photoProgress);

  photo.style.setProperty('--stats-photo-width', `${width.toFixed(1)}px`);
  photo.style.setProperty('--stats-photo-height', `${height.toFixed(1)}px`);
  photo.style.setProperty('--stats-photo-radius', `${radius.toFixed(1)}px`);
  photo.style.setProperty('--stats-photo-shadow', shadow.toFixed(3));
  photo.style.setProperty('--stats-photo-top', `calc(50% + ${topOffset.toFixed(1)}px)`);

  if (scriptTitle) {
    const scriptOpacity = 1 - photoProgress;
    scriptTitle.style.opacity = scriptOpacity.toFixed(3);
  }

  // Phase 3: Facts Fade-out (starts at 0.72, fully faded by 0.82)
  const fadeOutProgress = clamp((progress - 0.72) / 0.10);

  facts.forEach((fact, index) => {
    // Flight-in timing (from 0.05 to 0.41)
    const start = 0.05 + (index * 0.07);
    const end = start + 0.15;
    const factProgress = clamp((progress - start) / (end - start));
    const flyInOpacity = easeOutQuint(factProgress);
    const opacity = flyInOpacity * (1 - fadeOutProgress);
    const y = 32 - (32 * easeOutQuint(factProgress));
    const scale = 0.96 + (0.04 * easeOutQuint(factProgress));

    fact.style.setProperty('--fact-opacity', opacity.toFixed(3));
    fact.style.setProperty('--fact-y', `${y.toFixed(1)}px`);
    fact.style.setProperty('--fact-scale', scale.toFixed(3));
  });

  // Phase 4: Checklist page fade-in (starts at 0.72, fully faded in at 1.0)
  const checklistProgress = easeOutQuint(clamp((progress - 0.72) / 0.28));
  const checklistOpacity = checklistProgress;
  const checklistY = 30 * (1 - checklistProgress);
  const checklistScale = 0.96 + (0.04 * checklistProgress);

  if (checklistPage) {
    checklistPage.style.setProperty('--checklist-opacity', checklistOpacity.toFixed(3));
    checklistPage.style.setProperty('--checklist-y', `${checklistY.toFixed(1)}px`);
    checklistPage.style.setProperty('--checklist-scale', checklistScale.toFixed(3));
    if (checklistProgress > 0.9) {
      checklistPage.classList.add('visible');
    } else {
      checklistPage.classList.remove('visible');
    }
  }
}

function syncStatsScene() {
  const stats = document.querySelector('.stats');

  if (!stats) {
    return;
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth <= 860) {
    const photo = document.querySelector('.stats-photo-wrap');
    const facts = Array.from(document.querySelectorAll('.stats-fact'));
    const checklistPage = document.querySelector('.stats-checklist-page');
    const scriptTitle = document.querySelector('.section-script-stats');
    if (photo && facts.length) {
      photo.style.setProperty('--stats-photo-width', '100%');
      photo.style.setProperty('--stats-photo-height', '260px');
      photo.style.setProperty('--stats-photo-radius', '0px');
      photo.style.setProperty('--stats-photo-shadow', '0.12');
      facts.forEach((fact) => {
        fact.style.setProperty('--fact-opacity', 1);
        fact.style.setProperty('--fact-y', '0px');
        fact.style.setProperty('--fact-scale', 1);
      });
    }
    if (scriptTitle) {
      scriptTitle.style.opacity = '1';
    }
    if (checklistPage) {
      checklistPage.style.setProperty('--checklist-opacity', '1');
      checklistPage.style.setProperty('--checklist-y', '0px');
      checklistPage.style.setProperty('--checklist-scale', '1');
      checklistPage.classList.add('visible');
    }
    return;
  }

  if (statsLocked) {
    window.scrollTo(0, statsLockScrollY);
    return;
  }

  if (!statsLocked) {
    const rect = stats.getBoundingClientRect();
    if (rect.top > 0) {
      statsProgress = 0;
      statsTargetProgress = 0;
      statsCompleted = false;
      renderStatsScene(0);
    } else if (!statsCompleted) {
      const scrollRange = stats.offsetHeight - window.innerHeight;
      const progress = clamp(-rect.top / scrollRange);
      statsProgress = progress;
      statsTargetProgress = progress;
      renderStatsScene(statsProgress);
    }
  }

  if (statsCompleted) {
    statsProgress = 1;
    statsTargetProgress = 1;
    renderStatsScene(1);
  }
}

function handleStatsWheel(event) {
  const stats = document.querySelector('.stats');
  const scene = document.querySelector('.stats-scene');

  if (!stats || !scene || window.innerWidth <= 860) {
    return;
  }

  const delta = event.deltaY;
  const sceneRect = scene.getBoundingClientRect();
  
  // Lock triggers exactly when stats-scene aligns with the top of the viewport
  const isSceneCentered = sceneRect.top <= 1;
  const isEnteringLock = delta > 0 && isSceneCentered && statsTargetProgress < 1;
  const isLeavingBack = delta < 0 && statsLocked && statsTargetProgress <= 0;
  const shouldControlAnimation = !statsCompleted && (statsLocked || isEnteringLock);

  if (!shouldControlAnimation || isLeavingBack) {
    if (isLeavingBack) {
      statsLocked = false;
      statsCompleted = false;
    }
    return;
  }

  event.preventDefault();

  if (!statsLocked) {
    statsLocked = true;
    statsLockScrollY = window.scrollY + sceneRect.top; // Perfect real-time lock coordinate
    statsTargetProgress = statsProgress;

    if (statsAnimationFrame) {
      cancelAnimationFrame(statsAnimationFrame);
      statsAnimationFrame = null;
    }
  }

  statsTargetProgress = clamp(statsTargetProgress + delta / 1800);
  startStatsSmoothing();

  if (statsTargetProgress >= 1 && delta > 0 && statsProgress > 0.995) {
    statsLocked = false;
    statsCompleted = true;
  }
}

function startStatsSmoothing() {
  if (statsAnimationFrame) {
    return;
  }

  const animate = () => {
    statsProgress += (statsTargetProgress - statsProgress) * 0.12;

    if (Math.abs(statsTargetProgress - statsProgress) < 0.001) {
      statsProgress = statsTargetProgress;
    }

    renderStatsScene(statsProgress);

    if (statsProgress === statsTargetProgress) {
      if (statsLocked && statsTargetProgress >= 1) {
        statsLocked = false;
        statsCompleted = true;
      }
      statsAnimationFrame = null;
      return;
    }

    statsAnimationFrame = requestAnimationFrame(animate);
  };

  statsAnimationFrame = requestAnimationFrame(animate);
}

function getEducationLockPoint() {
  const education = document.querySelector('.education');
  const educationCard = document.querySelector('.education-card');

  if (!education || !educationCard) {
    return null;
  }

  const cardHeight = educationCard.offsetHeight;
  const viewportCenterTop = (window.innerHeight - cardHeight) / 2;

  return {
    education,
    educationCard,
    stickyStart: education.offsetTop + educationCard.offsetTop - viewportCenterTop,
    stickyEnd: education.offsetTop + educationCard.offsetTop - viewportCenterTop + educationScrollScene,
  };
}

function renderEducationCards(progress) {
  const items = Array.from(document.querySelectorAll('.education-item'));
  const animatedCount = Math.max(items.length - 1, 1);

  items.forEach((item, index) => {
    const settledY = index * educationStackGap;
    const zIndex = index + 1;

    if (index === 0) {
      item.style.transform = `translate3d(0, ${settledY}px, 0)`;
      item.style.opacity = 1;
      item.style.zIndex = zIndex;
      return;
    }

    const rawProgress = clamp(((progress * animatedCount) - (index - 1) + educationOverlap) / (1 + educationOverlap));
    const itemProgress = rawProgress < 0.72
      ? easeInOutQuart(rawProgress / 0.72) * 0.88
      : 0.88 + (easeOutQuint((rawProgress - 0.72) / 0.28) * 0.12);
    const scale = 0.985 + (0.015 * itemProgress);
    const opacity = itemProgress < 0.08
      ? 0
      : 0.98 + (0.02 * itemProgress);
    const y = educationHiddenY - ((educationHiddenY - settledY) * itemProgress);

    item.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
    item.style.opacity = opacity;
    item.style.zIndex = zIndex;
  });
}

function syncEducationCards() {
  const lockPoint = getEducationLockPoint();

  if (!lockPoint || window.innerWidth <= 860) {
    Array.from(document.querySelectorAll('.education-item')).forEach((item) => {
      item.style.transform = '';
      item.style.opacity = '';
      item.style.zIndex = '';
    });
    return;
  }

  if (!educationLocked && !educationCompleted) {
    educationTargetProgress = 0;
  }

  if (educationCompleted) {
    educationTargetProgress = 1;
  }

  startEducationSmoothing();
}

function handleEducationWheel(event) {
  const lockPoint = getEducationLockPoint();

  if (!lockPoint || window.innerWidth <= 860) {
    return;
  }

  const delta = event.deltaY;
  const sceneRect = lockPoint.education.getBoundingClientRect();
  const cardRect = lockPoint.educationCard.getBoundingClientRect();
  const sceneTop = Math.min(sceneRect.top, cardRect.top - 160);
  const sceneBottom = cardRect.bottom;
  const sceneCenter = sceneTop + ((sceneBottom - sceneTop) / 2);
  const viewportCenter = window.innerHeight / 2;
  const isSceneCentered = sceneCenter <= viewportCenter + educationLockOffset;
  const isEnteringLock = delta > 0 && isSceneCentered && educationTargetProgress < 1;
  const isLeavingBack = delta < 0 && educationLocked && educationTargetProgress <= 0;
  const shouldControlAnimation = !educationCompleted && (educationLocked || isEnteringLock);

  if (!shouldControlAnimation || isLeavingBack) {
    if (isLeavingBack) {
      educationLocked = false;
      educationCompleted = false;
    }

    return;
  }

  event.preventDefault();

  if (!educationLocked) {
    educationLocked = true;
    educationLockScrollY = window.scrollY;
    educationTargetProgress = educationProgress;

    if (educationAnimationFrame) {
      cancelAnimationFrame(educationAnimationFrame);
      educationAnimationFrame = null;
    }
  }

  educationTargetProgress = clamp(educationTargetProgress + delta / 980);
  startEducationSmoothing();

  if (educationTargetProgress >= 1 && delta > 0 && educationProgress > 0.995) {
    educationLocked = false;
    educationCompleted = true;
  }
}

function startEducationSmoothing() {
  if (educationAnimationFrame) {
    return;
  }

  const animate = () => {
    educationProgress += (educationTargetProgress - educationProgress) * 0.16;

    if (Math.abs(educationTargetProgress - educationProgress) < 0.001) {
      educationProgress = educationTargetProgress;
    }

    renderEducationCards(educationProgress);

    if (educationProgress === educationTargetProgress) {
      if (educationLocked && educationTargetProgress >= 1) {
        educationLocked = false;
        educationCompleted = true;
      }

      educationAnimationFrame = null;
      return;
    }

    educationAnimationFrame = requestAnimationFrame(animate);
  };

  educationAnimationFrame = requestAnimationFrame(animate);
}
function syncLayout() {
  syncBadgeLine();
  syncEducationCards();
}

function stabilizeLayout(shouldResetScroll = false) {
  if (shouldResetScroll) {
    window.scrollTo(0, 0);
  }

  syncLayout();

  requestAnimationFrame(() => {
    syncLayout();

    requestAnimationFrame(syncLayout);
  });
}

window.addEventListener('load', () => {
  stabilizeLayout(true);
  syncStatsScene();
});

if (document.fonts) {
  document.fonts.ready.then(() => stabilizeLayout(false));
}

window.addEventListener('resize', () => {
  syncLayout();
  syncStatsScene();
});
window.addEventListener('scroll', syncEducationCards, { passive: true });
window.addEventListener('scroll', syncStatsScene, { passive: true });
window.addEventListener('wheel', handleEducationWheel, { passive: false });
window.addEventListener('wheel', handleStatsWheel, { passive: false });
requestAnimationFrame(syncLayout);
requestAnimationFrame(syncStatsScene);
