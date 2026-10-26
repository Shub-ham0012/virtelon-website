'use strict';
const form = document.getElementById('contact-form');
if (form) {
  const params = new URLSearchParams(location.search);
  if (params.get('interest') === 'crm') form.elements.interest.value = 'crm';
  const button = form.querySelector('button[type="submit"]');
  const status = document.getElementById('form-status');
  let pending = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;
    pending = true;
    button.disabled = true;
    button.textContent = 'Sending…';
    status.dataset.state = 'loading';
    status.textContent = 'Sending your enquiry. Please keep this page open.';
    try {
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData);
      payload.projectTypes = formData.getAll('projectTypes').join(', ');
      const response = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload), signal: AbortSignal.timeout(25000)
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error(result.message || 'Your enquiry was not accepted. Please try again or email contact@virtelon.com.');
      status.dataset.state = 'success';
      status.textContent = 'Your enquiry was accepted by our delivery provider. Thank you — we’ll review it and reply by email.';
      form.reset();
    } catch (error) {
      status.dataset.state = 'error';
      status.textContent = error.name === 'TimeoutError' || error instanceof TypeError
        ? 'We could not confirm delivery. Your details are still here. Please retry later or email contact@virtelon.com; avoid resending if you receive a confirmation email.'
        : error.message;
    } finally {
      pending = false;
      button.disabled = false;
      button.innerHTML = 'Send project brief <span aria-hidden="true">↗</span>';
      status.focus();
    }
  });
}
