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
const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);
let educationProgress = 0;
let educationLocked = false;
let educationLockScrollY = 0;
const educationStep = 242;

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
  };
}

function renderEducationCards(progress) {
  const items = Array.from(document.querySelectorAll('.education-item'));
  const animatedCount = Math.max(items.length - 1, 1);

  items.forEach((item, index) => {
    const baseY = index * educationStep;
    const zIndex = index + 1;

    if (index === 0) {
      item.style.transform = 'translate3d(0, 0, 0)';
      item.style.zIndex = zIndex;
      return;
    }

    const itemProgress = easeOutCubic(clamp((progress * animatedCount) - (index - 1)));

    item.style.transform = `translate3d(0, ${baseY - (baseY * itemProgress)}px, 0)`;
    item.style.zIndex = zIndex;
  });
}

function syncEducationCards() {
  const lockPoint = getEducationLockPoint();

  if (!lockPoint || window.innerWidth <= 860) {
    Array.from(document.querySelectorAll('.education-item')).forEach((item) => {
      item.style.transform = '';
      item.style.zIndex = '';
    });
    return;
  }

  renderEducationCards(educationProgress);
}

function handleEducationWheel(event) {
  const lockPoint = getEducationLockPoint();

  if (!lockPoint || window.innerWidth <= 860) {
    return;
  }

  const { stickyStart } = lockPoint;
  const delta = event.deltaY;
  const lockZoneStart = stickyStart - 2;
  const isAtLockPoint = window.scrollY >= lockZoneStart;
  const shouldLockDown = delta > 0 && isAtLockPoint && educationProgress < 1;
  const shouldLockUp = delta < 0 && educationLocked && educationProgress > 0;

  if (!shouldLockDown && !shouldLockUp) {
    if (delta < 0 && window.scrollY < stickyStart - 2) {
      educationLocked = false;
      educationProgress = 0;
      renderEducationCards(educationProgress);
    }

    return;
  }

  event.preventDefault();
  if (!educationLocked) {
    educationLockScrollY = stickyStart;
  }

  educationLocked = true;
  educationProgress = clamp(educationProgress + delta / 720);
  renderEducationCards(educationProgress);
  requestAnimationFrame(() => {
    window.scrollTo(0, educationLockScrollY);
  });

  if (educationProgress >= 1 && delta > 0) {
    educationLocked = false;
  }

  if (educationProgress <= 0 && delta < 0) {
    educationLocked = false;
  }
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
window.addEventListener('wheel', handleEducationWheel, { passive: false });
syncLayout();
