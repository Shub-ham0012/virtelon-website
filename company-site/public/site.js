'use strict';

// All interactions stay in this page. No remote data, storage or automatic cycling.
document.documentElement.classList.add('js');
const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#site-nav');
menuToggle.hidden = false;
function closeMenu(restoreFocus = false) {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.querySelector('span').textContent = '+';
  navigation.classList.remove('is-open');
  if (restoreFocus) menuToggle.focus();
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.querySelector('span').textContent = open ? '−' : '+';
  navigation.classList.toggle('is-open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
});
const mobileHeader = matchMedia('(max-width: 650px)');
mobileHeader.addEventListener('change', () => closeMenu());

const briefs = {
  systems: {
    number: '01', title: 'Make the handoffs work.',
    context: 'An enquiry arrives. The information needs to reach the right person, with a clear next step.',
    input: 'An incoming enquiry', inputNote: 'Capture the details that matter.',
    build: 'One shared record', buildNote: 'Connect context, ownership and next steps.',
    review: 'The team reviews', reviewNote: 'People approve changes and exceptions.',
    question: 'Who owns the record, and who can change it?', announcement: 'Business systems brief selected.'
  },
  ai: {
    number: '02', title: 'Give repetitive work a hand.',
    context: 'A recurring question needs a useful answer, grounded in the information your business approves.',
    input: 'Business information', inputNote: 'Define the sources the assistant can use.',
    build: 'A suggested response', buildNote: 'Draft an answer with relevant context.',
    review: 'A person approves', reviewNote: 'Review uncertain answers before sending.',
    question: 'What can be assisted, and what needs a person?', announcement: 'AI and automation brief selected.'
  },
  product: {
    number: '03', title: 'Make the next step usable.',
    context: 'A customer has a task to complete. A focused product should make that task clear and manageable.',
    input: 'A real user task', inputNote: 'Understand who needs to do what.',
    build: 'A working interface', buildNote: 'Connect the screen to the right workflow.',
    review: 'People try it out', reviewNote: 'Use feedback to refine the first release.',
    question: 'What should someone be able to do on day one?', announcement: 'Digital product brief selected.'
  }
};
const briefChoices = document.querySelector('.brief-choices');
if (briefChoices) {
briefChoices.hidden = false;
briefChoices.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
  const brief = briefs[button.dataset.brief];
  if (!brief) return;
  const fields = {
    'brief-number': 'number', 'brief-heading': 'title', 'brief-context': 'context',
    'flow-input': 'input', 'flow-input-note': 'inputNote', 'flow-build': 'build',
    'flow-build-note': 'buildNote', 'flow-review': 'review', 'flow-review-note': 'reviewNote',
    'brief-question': 'question'
  };
  Object.entries(fields).forEach(([id, field]) => { document.getElementById(id).textContent = brief[field]; });
  briefChoices.querySelectorAll('button').forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
  document.querySelector('#brief-update').textContent = brief.announcement;
}));

}
const screens = [
  {name: 'Pipeline', file: 'pipeline', title: 'A place for the next step.', description: 'See an enquiry move through the visible sales stages, with its context kept alongside it.', caption: 'Follow an enquiry through the visible sales stages.', alt: 'Resort and Spa CRM demo pipeline, showing fictional enquiries arranged by follow-up stage'},
  {name: 'Enquiries', file: 'inbox', title: 'Keep the conversation in view.', description: 'Inspect a sample enquiry queue with the details a property team might need for a response.', caption: 'Review fictional guest enquiries and the context for a response.', alt: 'Resort and Spa CRM demo enquiry inbox with fictional guest messages and illustrative channel labels'},
  {name: 'Bookings', file: 'bookings', title: 'See the booking context.', description: 'Inspect the room and property schedule. The sample interface illustrates a possible view of the work.', caption: 'Inspect a sample property schedule. Interface labels are illustrative, not a booking guarantee.', alt: 'Resort and Spa CRM demo bookings schedule with fictional guest and property records'}
];
const productChoices = document.querySelector('.screen-choices');
const screenLink = document.querySelector('.screen-open');
const dialog = document.querySelector('#screen-dialog');
const viewerViewport = document.querySelector('.viewer-viewport');
const viewerZoom = document.querySelector('#viewer-zoom');
let currentScreen = 0;
let viewerOpener = null;
if (productChoices && dialog) {
productChoices.hidden = false;
function setScreen(index) {
  currentScreen = (index + screens.length) % screens.length;
  const screen = screens[currentScreen];
  const source = `/assets/resort-${screen.file}.png`;
  document.querySelector('#product-image').src = source;
  document.querySelector('#product-image').alt = screen.alt;
  screenLink.href = source;
  screenLink.setAttribute('aria-label', `Open the full-size Resort and Spa CRM ${screen.name.toLowerCase()} demo screen`);
  document.querySelector('#product-screen-title').textContent = screen.title;
  document.querySelector('#product-screen-description').textContent = screen.description;
  document.querySelector('#product-caption').textContent = `${screen.name} / actual demo capture`;
  productChoices.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.screen) === currentScreen)));
  document.querySelector('#viewer-title').textContent = screen.name;
  document.querySelector('#viewer-image').src = source;
  document.querySelector('#viewer-image').alt = screen.alt;
  document.querySelector('#viewer-caption').textContent = screen.caption;
  document.querySelector('#viewer-count').textContent = `${currentScreen + 1} of ${screens.length}`;
  viewerViewport.scrollTop = 0;
  viewerViewport.scrollLeft = 0;
}
productChoices.querySelectorAll('button').forEach(button => button.addEventListener('click', () => setScreen(Number(button.dataset.screen))));
screenLink.addEventListener('click', event => {
  if (typeof dialog.showModal !== 'function') return;
  event.preventDefault();
  viewerOpener = event.currentTarget;
  setScreen(currentScreen);
  viewerViewport.classList.remove('is-zoomed');
  viewerZoom.setAttribute('aria-pressed', 'false');
  viewerZoom.textContent = 'Actual size';
  dialog.showModal();
  document.body.classList.add('dialog-open');
  dialog.querySelector('.viewer-close').focus();
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  if (viewerOpener) viewerOpener.focus();
});
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
document.querySelector('#viewer-previous').addEventListener('click', () => setScreen(currentScreen - 1));
document.querySelector('#viewer-next').addEventListener('click', () => setScreen(currentScreen + 1));
viewerZoom.addEventListener('click', () => {
  const actualSize = viewerViewport.classList.toggle('is-zoomed');
  viewerZoom.setAttribute('aria-pressed', String(actualSize));
  viewerZoom.textContent = actualSize ? 'Fit to view' : 'Actual size';
  viewerViewport.scrollTop = 0;
  viewerViewport.scrollLeft = 0;
});
dialog.addEventListener('keydown', event => {
  if (event.key === 'Tab') {
    const controls = [...dialog.querySelectorAll('button:not(:disabled), [tabindex="0"]')]
      .filter(control => control.getClientRects().length);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && event.target === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && event.target === last) {
      event.preventDefault(); first.focus();
    }
    return;
  }
  // Arrow keys scroll an enlarged image when its region has focus.
  if (event.target === viewerViewport) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); setScreen(currentScreen + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); setScreen(currentScreen - 1); }
});

}
