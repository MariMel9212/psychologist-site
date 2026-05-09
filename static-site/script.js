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
    const animationDistance = Math.max(lockPoint.stickyEnd - lockPoint.stickyStart, 1);
    educationTargetProgress = clamp((window.scrollY - lockPoint.stickyStart) / animationDistance);
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

window.addEventListener('load', () => {
  window.scrollTo(0, 0);
  syncLayout();
});
window.addEventListener('resize', syncLayout);
window.addEventListener('scroll', syncEducationCards, { passive: true });
window.addEventListener('wheel', handleEducationWheel, { passive: false });
syncLayout();
