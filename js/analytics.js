/**
 * GS Group Services - Analytics & Tracking
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a Google Analytics 4 property at https://analytics.google.com
 * 2. Replace 'G-XXXXXXXXXX' with your actual Measurement ID
 * 3. Uncomment the gtag.js script in the HTML head
 */

// Google Analytics 4 Configuration
// Uncomment and replace with your actual GA4 Measurement ID
/*
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-XXXXXXXXXX', {
  'anonymize_ip': true,  // GDPR compliance
  'cookie_flags': 'SameSite=None;Secure'
});
*/

// Track outbound links (WhatsApp, email, phone)
document.addEventListener('DOMContentLoaded', function() {
  // Track WhatsApp clicks
  document.querySelectorAll('a[href*="wa.me"]').forEach(function(link) {
    link.addEventListener('click', function() {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'click', {
          'event_category': 'contact',
          'event_label': 'whatsapp',
          'transport_type': 'beacon'
        });
      }
      console.log('WhatsApp click tracked');
    });
  });

  // Track phone clicks
  document.querySelectorAll('a[href^="tel:"]').forEach(function(link) {
    link.addEventListener('click', function() {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'click', {
          'event_category': 'contact',
          'event_label': 'phone',
          'transport_type': 'beacon'
        });
      }
      console.log('Phone click tracked');
    });
  });

  // Track email clicks
  document.querySelectorAll('a[href^="mailto:"]').forEach(function(link) {
    link.addEventListener('click', function() {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'click', {
          'event_category': 'contact',
          'event_label': 'email',
          'transport_type': 'beacon'
        });
      }
      console.log('Email click tracked');
    });
  });

  // Track CTA button clicks
  document.querySelectorAll('.button, .cta a').forEach(function(button) {
    button.addEventListener('click', function() {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'click', {
          'event_category': 'cta',
          'event_label': this.textContent.trim(),
          'transport_type': 'beacon'
        });
      }
      console.log('CTA click tracked:', this.textContent.trim());
    });
  });
});

// Form submission tracking
document.addEventListener('submit', function(e) {
  if (e.target.classList.contains('quote-form')) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'form_submit', {
        'event_category': 'lead',
        'event_label': 'quote_request',
        'transport_type': 'beacon'
      });
    }
    console.log('Form submission tracked');
  }
});
