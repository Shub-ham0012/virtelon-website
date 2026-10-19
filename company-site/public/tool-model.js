'use strict';

globalThis.VirtelonTools = Object.freeze({
  digits(value) {
    return String(value || '').replace(/\D/g, '');
  },
  whatsappUrl(countryCode, phone, message) {
    const cc = this.digits(countryCode);
    const number = this.digits(phone).replace(/^0+/, '');
    if (!cc || !number || (cc + number).length < 8 || (cc + number).length > 15) return '';
    const text = String(message || '').trim();
    return `https://wa.me/${cc}${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
  },
  leadScenario({ missed, value, conversion, recovery }) {
    const monthly = Math.max(0, Number(missed)) * 4.33;
    const opportunity = monthly * Math.max(0, Number(value)) * Math.max(0, Number(conversion)) / 100;
    const recovered = opportunity * Math.max(0, Number(recovery)) / 100;
    return { opportunity, recovered, annual: recovered * 12 };
  }
});
