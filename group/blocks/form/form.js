export default function decorate(block) {
  // Grab endpoint from the first link or fallback to text content
  const endpointLink = block.querySelector('a');
  const endpoint = endpointLink?.href || block.textContent.trim();

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
          name="nonSmokerDeclaration"
          id="nonSmokerDeclaration"
          required
        />
        <span>I hereby declare under the penalty of perjury that I meet the Non-Smoker criteria above. <span class="required">*</span></span>
      </label>
      <div class="field-error" id="error-nonSmokerDeclaration"></div>
    </div>

    <div class="form-field">
      <label for="lastName">Subscriber Last Name <span class="required">*</span></label>
      <input
        type="text"
        id="lastName"
        name="lastName"
        required
        autocomplete="family-name"
      />
      <div class="field-error" id="error-lastName"></div>
    </div>

    <div class="form-field">
      <label for="birthYear">Subscriber Year of Birth <span class="required">*</span></label>
      <input
        type="text"
        id="birthYear"
        name="birthYear"
        inputmode="numeric"
        maxlength="4"
        required
      />
      <div class="field-error" id="error-birthYear"></div>
    </div>

    <div class="form-field">
      <label for="referenceNumber">
        Reference Number: (Example: RN1234; this is not case sensitive)
        <span class="required">*</span>
      </label>
      <input
        type="text"
        id="referenceNumber"
        name="referenceNumber"
        required
      />
      <div class="field-error" id="error-referenceNumber"></div>
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
    ['nonSmokerDeclaration', 'lastName', 'birthYear', 'referenceNumber'].forEach((field) => {
      setFieldError(field, '');
    });
    messageEl.textContent = '';
    messageEl.classList.remove('is-error', 'is-success');
  }

  function validateForm() {
    clearErrors();
    let isValid = true;

    const nonSmokerDeclaration = form.nonSmokerDeclaration.checked;
    const lastName = form.lastName.value.trim();
    const birthYear = form.birthYear.value.trim();
    const referenceNumber = form.referenceNumber.value.trim();

    if (!nonSmokerDeclaration) {
      setFieldError('nonSmokerDeclaration', 'Please confirm the declaration.');
      isValid = false;
    }

    if (!lastName) {
      setFieldError('lastName', 'Last name is required.');
      isValid = false;
    }

    if (!/^\d{4}$/.test(birthYear)) {
      setFieldError('birthYear', 'Enter a valid 4-digit birth year.');
      isValid = false;
    } else {
      const year = Number(birthYear);
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear) {
        setFieldError('birthYear', 'Enter a reasonable birth year.');
        isValid = false;
      }
    }

    if (!referenceNumber) {
      setFieldError('referenceNumber', 'Reference number is required.');
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
      formName: 'non-smoker-attestation',
      submittedAt: new Date().toISOString(),
      pageUrl: window.location.href,
      nonSmokerDeclaration: form.nonSmokerDeclaration.checked,
      lastName: form.lastName.value.trim(),
      birthYear: form.birthYear.value.trim(),
      referenceNumber: form.referenceNumber.value.trim().toUpperCase(),
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

      form.reset();
      clearErrors();
      messageEl.textContent = 'Thank you. Your form has been submitted.';
      messageEl.classList.add('is-success');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Form submission error:', error);
      messageEl.textContent = 'Sorry, something went wrong. Please try again.';
      messageEl.classList.add('is-error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Submit';
    }
  }

  form.addEventListener('submit', handleSubmit);
}

