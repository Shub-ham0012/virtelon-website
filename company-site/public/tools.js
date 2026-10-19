'use strict';

(() => {
  const model = globalThis.VirtelonTools;
  if (!model) return;

  const generator = document.querySelector('#whatsapp-generator');
  if (generator) {
    const cc = generator.querySelector('#cc');
    const phone = generator.querySelector('#num');
    const message = generator.querySelector('#msg');
    const count = generator.querySelector('#cnt');
    const output = generator.querySelector('#generated-link');
    const status = generator.querySelector('#tool-status');
    const copy = generator.querySelector('#copy-link');
    const test = generator.querySelector('#test-chat');
    const canvas = generator.querySelector('#qr-code');
    const download = generator.querySelector('#download-qr');
    let qrUrl = '';

    function drawQr(url) {
      qrUrl = '';
      canvas.hidden = true;
      download.disabled = true;
      if (!url || typeof globalThis.qrcode !== 'function') return;
      try {
        const qr = globalThis.qrcode(0, 'M');
        qr.addData(url);
        qr.make();
        const image = new Image();
        image.onload = () => {
          const context = canvas.getContext('2d');
          context.fillStyle = '#fff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.imageSmoothingEnabled = false;
          context.drawImage(image, 24, 24, canvas.width - 48, canvas.height - 48);
          qrUrl = canvas.toDataURL('image/png');
          canvas.hidden = false;
          download.disabled = false;
        };
        image.src = qr.createDataURL(8, 16);
      } catch {
        status.textContent = 'The link is ready, but the QR could not be rendered in this browser.';
      }
    }

    function update() {
      count.textContent = String(message.value.length);
      const url = model.whatsappUrl(cc.value, phone.value, message.value);
      output.value = url;
      copy.disabled = !url;
      test.hidden = !url;
      if (url) {
        test.href = url;
        status.textContent = 'Ready. Test the chat before sharing the link or QR.';
      } else {
        test.removeAttribute('href');
        status.textContent = 'Enter a valid phone number with its country code.';
      }
      drawQr(url);
    }

    [cc, phone, message].forEach(input => input.addEventListener('input', update));
    generator.querySelectorAll('[data-message]').forEach(button => button.addEventListener('click', () => {
      message.value = button.dataset.message;
      update();
      message.focus();
    }));
    copy.addEventListener('click', async () => {
      if (!output.value) return;
      try {
        await navigator.clipboard.writeText(output.value);
        status.textContent = 'Link copied.';
      } catch {
        output.focus();
        output.select();
        status.textContent = 'Select and copy the link shown above.';
      }
    });
    download.addEventListener('click', () => {
      if (!qrUrl) return;
      const link = document.createElement('a');
      link.href = qrUrl;
      link.download = 'virtelon-whatsapp-qr.png';
      link.click();
    });
    update();
  }

  const calculator = document.querySelector('#lead-calculator');
  if (calculator) {
    const ids = ['miss', 'val', 'conv', 'recovery'];
    const inputs = Object.fromEntries(ids.map(id => [id, calculator.querySelector(`#${id}`)]));
    const currency = value => `₹${Math.round(value).toLocaleString('en-IN')}`;
    function update() {
      calculator.querySelector('#v-miss').textContent = inputs.miss.value;
      calculator.querySelector('#v-val').textContent = Number(inputs.val.value).toLocaleString('en-IN');
      calculator.querySelector('#v-conv').textContent = `${inputs.conv.value}%`;
      calculator.querySelector('#v-recovery').textContent = `${inputs.recovery.value}%`;
      const result = model.leadScenario({
        missed: inputs.miss.value,
        value: inputs.val.value,
        conversion: inputs.conv.value,
        recovery: inputs.recovery.value
      });
      calculator.querySelector('#loss').textContent = currency(result.opportunity);
      calculator.querySelector('#gain').textContent = currency(result.recovered);
      calculator.querySelector('#year').textContent = currency(result.annual);
    }
    Object.values(inputs).forEach(input => input.addEventListener('input', update));
    update();
  }
})();
