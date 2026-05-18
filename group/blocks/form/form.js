export default function decorate(block) {
  // Grab endpoint from the first link or fallback to text content
  const endpointLink = block.querySelector('a');
  const endpoint = endpointLink?.href || block.textContent.trim();

  // TODO: Update this URL once the confirmation page is live in EDS
  const confirmationPageUrl = '/county-of-orange-confirmation-2024';

  // Clear authored content once we have what we need
  block.textContent = '';

  const form = document.createElement('form');
  form.className = 'form-block';
  form.noValidate = true;

  form.innerHTML = `
    <div class="form-message" aria-live="polite"></div>

    <div class="form-field form-field-checkbox">
      <label class="form-checkbox-label">
        <input
          type="checkbox"
          name="Declaration"
          id="Declaration"
          required
        />
        <span>I hereby declare under the penalty of perjury that I meet the Non-Smoker criteria above. <span class="required">*</span></span>
      </label>
      <div class="field-error" id="error-Declaration"></div>
    </div>

    <div class="form-field">
      <label for="EmailAddress">Email Address <span class="required">*</span></label>
      <input
        type="email"
        id="EmailAddress"
        name="EmailAddress"
        required
        autocomplete="email"
      />
      <div class="field-error" id="error-EmailAddress"></div>
    </div>

    <div class="form-field">
      <label for="SubscriberLastName">Subscriber Last Name <span class="required">*</span></label>
      <input
        type="text"
        id="SubscriberLastName"
        name="SubscriberLastName"
        required
        autocomplete="family-name"
      />
      <div class="field-error" id="error-SubscriberLastName"></div>
    </div>

    <div class="form-field">
      <label for="SubscriberYearofBirth">Subscriber Year of Birth <span class="required">*</span></label>
      <input
        type="text"
        id="SubscriberYearofBirth"
        name="SubscriberYearofBirth"
        inputmode="numeric"
        maxlength="4"
        required
      />
      <div class="field-error" id="error-SubscriberYearofBirth"></div>
    </div>

    <div class="form-field">
      <label for="ref_number">
        Reference Number: (Example: RN1234; this is not case sensitive)
        <span class="required">*</span>
      </label>
      <input
        type="text"
        id="ref_number"
        name="ref_number"
        required
      />
      <div class="field-error" id="error-ref_number"></div>
    </div>

    <!-- Honeypot -->
    <div class="form-field form-honeypot" aria-hidden="true">
      <label for="company">Company</label>
      <input type="text" id="company" name="company" tabindex="-1" autocomplete="off" />
    </div>

    <div class="form-actions">
      <button type="submit">Submit</button>
    </div>
  `;

  block.append(form);

  const messageEl = form.querySelector('.form-message');
  const submitButton = form.querySelector('button[type="submit"]');

  function setFieldError(fieldName, message) {
    const errorEl = form.querySelector(`#error-${fieldName}`);
    const input = form.querySelector(`[name="${fieldName}"]`);

    if (errorEl) errorEl.textContent = message || '';
    if (input) {
      if (message) {
        input.setAttribute('aria-invalid', 'true');
      } else {
        input.removeAttribute('aria-invalid');
      }
    }
  }

  function clearErrors() {
    ['Declaration', 'EmailAddress', 'SubscriberLastName', 'SubscriberYearofBirth', 'ref_number'].forEach((field) => {
      setFieldError(field, '');
    });
    messageEl.textContent = '';
    messageEl.classList.remove('is-error', 'is-success');
  }

  function formatSubmissionDate(date) {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  function validateForm() {
    clearErrors();
    let isValid = true;

    const declaration = form.Declaration.checked;
    const emailAddress = form.EmailAddress.value.trim();
    const subscriberLastName = form.SubscriberLastName.value.trim();
    const subscriberYearofBirth = form.SubscriberYearofBirth.value.trim();
    const refNumber = form.ref_number.value.trim();

    if (!declaration) {
      setFieldError('Declaration', 'Please confirm the declaration.');
      isValid = false;
    }

    if (!emailAddress) {
      setFieldError('EmailAddress', 'Email address is required.');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
      setFieldError('EmailAddress', 'Please enter a valid email address.');
      isValid = false;
    }

    if (!subscriberLastName) {
      setFieldError('SubscriberLastName', 'Last name is required.');
      isValid = false;
    }

    if (!/^\d{4}$/.test(subscriberYearofBirth)) {
      setFieldError('SubscriberYearofBirth', 'Enter a valid 4-digit birth year.');
      isValid = false;
    } else {
      const year = Number(subscriberYearofBirth);
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear) {
        setFieldError('SubscriberYearofBirth', 'Enter a reasonable birth year.');
        isValid = false;
      }
    }

    if (!refNumber) {
      setFieldError('ref_number', 'Reference number is required.');
      isValid = false;
    }

    return isValid;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) return;

    // Honeypot check
    if (form.company.value.trim()) {
      messageEl.textContent = 'Submission blocked.';
      messageEl.classList.add('is-error');
      return;
    }

    if (!endpoint || endpoint === 'https://your-webhook-url-here') {
      messageEl.textContent = 'No form endpoint is configured yet.';
      messageEl.classList.add('is-error');
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    const payload = {
      Declaration: form.Declaration.checked,
      EmailAddress: form.EmailAddress.value.trim(),
      'Subscriber Last Name': form.SubscriberLastName.value.trim(),
      'Subscriber Year of Birth': form.SubscriberYearofBirth.value.trim(),
      ref_number: form.ref_number.value.trim().toUpperCase(),
      'Submission Date': formatSubmissionDate(new Date()),
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      window.location.href = confirmationPageUrl;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Form submission error:', error);
      messageEl.textContent = 'Sorry, something went wrong. Please try again.';
      messageEl.classList.add('is-error');
      submitButton.disabled = false;
      submitButton.textContent = 'Submit';
    }
  }

  form.addEventListener('submit', handleSubmit);
}
