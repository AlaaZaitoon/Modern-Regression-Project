// Logo: shared file from assets/img/
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.logo-img').forEach(el => {
    el.src = 'assets/img/hue_logo.png';
  });

  // contenteditable placeholder behaviour
  document.querySelectorAll('[contenteditable]').forEach(el => {
    el.addEventListener('focus', () => {
      if (el.textContent.trim() === el.dataset.placeholder) el.textContent = '';
    });
    el.addEventListener('blur', () => {
      if (!el.textContent.trim()) el.textContent = el.dataset.placeholder;
    });
  });
});
