/**
 * Form Validation Utility
 * Real-time validation, error handling, and form state management
 * Works with form-validation.css for visual feedback
 */

const formValidator = {
    /**
     * Built-in validation rules
     */
    RULES: {
        required: {
            validate: (value) => {
                if (value === null || value === undefined) return false;
                if (typeof value === 'string') return value.trim().length > 0;
                if (Array.isArray(value)) return value.length > 0;
                return true;
            },
            message: (fieldName) => `${fieldName} is required`
        },

        email: {
            validate: (value) => {
                if (!value) return true; // Optional unless combined with required
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value);
            },
            message: () => 'Please enter a valid email address'
        },

        url: {
            validate: (value) => {
                if (!value) return true;
                try {
                    new URL(value);
                    return true;
                } catch {
                    return false;
                }
            },
            message: () => 'Please enter a valid URL'
        },

        minLength: {
            validate: (value, min) => {
                if (!value) return true;
                return value.length >= min;
            },
            message: (fieldName, min) => `${fieldName} must be at least ${min} characters`
        },

        maxLength: {
            validate: (value, max) => {
                if (!value) return true;
                return value.length <= max;
            },
            message: (fieldName, max) => `${fieldName} must not exceed ${max} characters`
        },

        min: {
            validate: (value, min) => {
                if (value === null || value === undefined || value === '') return true;
                return Number(value) >= min;
            },
            message: (fieldName, min) => `${fieldName} must be at least ${min}`
        },

        max: {
            validate: (value, max) => {
                if (value === null || value === undefined || value === '') return true;
                return Number(value) <= max;
            },
            message: (fieldName, max) => `${fieldName} must not exceed ${max}`
        },

        pattern: {
            validate: (value, pattern) => {
                if (!value) return true;
                const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
                return regex.test(value);
            },
            message: (fieldName) => `${fieldName} format is invalid`
        },

        match: {
            validate: (value, matchValue) => {
                return value === matchValue;
            },
            message: (fieldName) => `${fieldName} does not match`
        },

        custom: {
            validate: (value, validatorFn) => {
                return validatorFn(value);
            },
            message: (fieldName, _, customMessage) => customMessage || `${fieldName} is invalid`
        }
    },

    /**
     * Active form validations
     * Map<formId, FormState>
     */
    activeForms: new Map(),

    /**
     * Initialize validation for a form
     * @param {String} formId - Form element ID
     * @param {Object} config - Validation configuration
     */
    initializeForm(formId, config = {}) {
        const form = document.getElementById(formId);
        if (!form) {
            console.error(`Form not found: ${formId}`);
            return;
        }

        const formState = {
            formId,
            fields: new Map(),
            isValid: true,
            isDirty: false,
            config: {
                validateOnBlur: config.validateOnBlur !== false,
                validateOnInput: config.validateOnInput !== false,
                validateOnSubmit: config.validateOnSubmit !== false,
                showSuccessState: config.showSuccessState !== false,
                debounceMs: config.debounceMs || 300
            }
        };

        this.activeForms.set(formId, formState);

        // Setup event listeners
        this.setupFormListeners(form, formState);

        return formState;
    },

    /**
     * Setup event listeners for form
     */
    setupFormListeners(form, formState) {
        const { config } = formState;

        // Submit handler
        if (config.validateOnSubmit) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const isValid = this.validateForm(formState.formId);

                if (isValid) {
                    // Call onSubmit callback if provided
                    if (typeof config.onSubmit === 'function') {
                        config.onSubmit(this.getFormValues(formState.formId));
                    }
                } else {
                    // Focus first invalid field
                    this.focusFirstInvalidField(formState.formId);
                }
            });
        }

        // Input/textarea/select listeners
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            // Blur validation
            if (config.validateOnBlur) {
                input.addEventListener('blur', () => {
                    this.validateField(formState.formId, input.name || input.id);
                });
            }

            // Input validation with debounce
            if (config.validateOnInput) {
                let debounceTimer;
                input.addEventListener('input', () => {
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(() => {
                        this.validateField(formState.formId, input.name || input.id);
                    }, config.debounceMs);
                });
            }
        });
    },

    /**
     * Add field validation rules
     * @param {String} formId - Form element ID
     * @param {String} fieldName - Field name or ID
     * @param {Array<Object>} rules - Validation rules
     */
    addFieldRules(formId, fieldName, rules) {
        const formState = this.activeForms.get(formId);
        if (!formState) {
            console.error(`Form not initialized: ${formId}`);
            return;
        }

        formState.fields.set(fieldName, {
            name: fieldName,
            rules: rules,
            isValid: true,
            isDirty: false,
            errors: []
        });
    },

    /**
     * Validate a single field
     * @param {String} formId - Form element ID
     * @param {String} fieldName - Field name or ID
     * @returns {Boolean} Is field valid
     */
    validateField(formId, fieldName) {
        const formState = this.activeForms.get(formId);
        if (!formState) return true;

        const fieldState = formState.fields.get(fieldName);
        if (!fieldState) return true;

        const form = document.getElementById(formId);
        const input = form.querySelector(`[name="${fieldName}"], #${fieldName}`);
        if (!input) return true;

        const value = this.getFieldValue(input);
        const errors = [];

        // Run all validation rules
        for (const rule of fieldState.rules) {
            const ruleName = rule.type;
            const ruleConfig = this.RULES[ruleName];

            if (!ruleConfig) {
                console.warn(`Unknown validation rule: ${ruleName}`);
                continue;
            }

            let isValid;
            if (ruleName === 'custom') {
                isValid = ruleConfig.validate(value, rule.validator);
            } else {
                isValid = ruleConfig.validate(value, rule.value, rule.compareValue);
            }

            if (!isValid) {
                const message = rule.message || ruleConfig.message(
                    rule.label || fieldName,
                    rule.value,
                    rule.customMessage
                );
                errors.push(message);
            }
        }

        // Update field state
        fieldState.isValid = errors.length === 0;
        fieldState.isDirty = true;
        fieldState.errors = errors;

        // Update UI
        this.updateFieldUI(input, fieldState, formState.config);

        // Update form state
        this.updateFormState(formState);

        return fieldState.isValid;
    },

    /**
     * Validate entire form
     * @param {String} formId - Form element ID
     * @returns {Boolean} Is form valid
     */
    validateForm(formId) {
        const formState = this.activeForms.get(formId);
        if (!formState) return true;

        let isValid = true;

        // Validate all fields
        for (const [fieldName] of formState.fields) {
            const fieldValid = this.validateField(formId, fieldName);
            if (!fieldValid) {
                isValid = false;
            }
        }

        formState.isValid = isValid;
        formState.isDirty = true;

        return isValid;
    },

    /**
     * Update field UI based on validation state
     */
    updateFieldUI(input, fieldState, config) {
        // Remove existing classes
        input.classList.remove('is-valid', 'is-invalid', 'shake');

        // Add appropriate class
        if (fieldState.isDirty) {
            if (fieldState.isValid) {
                if (config.showSuccessState) {
                    input.classList.add('is-valid');
                }
            } else {
                input.classList.add('is-invalid');
                // Trigger shake animation
                input.classList.add('shake');
                setTimeout(() => input.classList.remove('shake'), 500);
            }
        }

        // Update feedback message
        this.updateFeedbackMessage(input, fieldState);
    },

    /**
     * Update feedback message for field
     */
    updateFeedbackMessage(input, fieldState) {
        const fieldContainer = input.closest('.form-field') || input.parentElement;
        let feedbackElement = fieldContainer.querySelector('.form-feedback');

        // Create feedback element if it doesn't exist
        if (!feedbackElement) {
            feedbackElement = document.createElement('div');
            feedbackElement.className = 'form-feedback';
            input.parentElement.appendChild(feedbackElement);
        }

        // Update content
        if (fieldState.errors.length > 0) {
            feedbackElement.textContent = fieldState.errors[0]; // Show first error
            feedbackElement.className = 'form-feedback error show';
        } else if (fieldState.isValid && fieldState.isDirty) {
            feedbackElement.textContent = 'Looks good!';
            feedbackElement.className = 'form-feedback success show';
        } else {
            feedbackElement.className = 'form-feedback';
        }
    },

    /**
     * Get field value based on input type
     */
    getFieldValue(input) {
        if (input.type === 'checkbox') {
            return input.checked;
        } else if (input.type === 'radio') {
            const form = input.closest('form');
            const checked = form.querySelector(`[name="${input.name}"]:checked`);
            return checked ? checked.value : null;
        } else if (input.type === 'file') {
            return input.files;
        } else {
            return input.value;
        }
    },

    /**
     * Get all form values
     */
    getFormValues(formId) {
        const form = document.getElementById(formId);
        if (!form) return {};

        const formData = new FormData(form);
        const values = {};

        for (const [key, value] of formData.entries()) {
            values[key] = value;
        }

        return values;
    },

    /**
     * Update overall form state
     */
    updateFormState(formState) {
        let isValid = true;

        for (const [, fieldState] of formState.fields) {
            if (!fieldState.isValid) {
                isValid = false;
                break;
            }
        }

        formState.isValid = isValid;
    },

    /**
     * Focus first invalid field
     */
    focusFirstInvalidField(formId) {
        const formState = this.activeForms.get(formId);
        if (!formState) return;

        for (const [fieldName, fieldState] of formState.fields) {
            if (!fieldState.isValid) {
                const form = document.getElementById(formId);
                const input = form.querySelector(`[name="${fieldName}"], #${fieldName}`);
                if (input) {
                    input.focus();
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    break;
                }
            }
        }
    },

    /**
     * Reset form validation state
     */
    resetForm(formId) {
        const formState = this.activeForms.get(formId);
        if (!formState) return;

        const form = document.getElementById(formId);

        // Reset field states
        for (const [, fieldState] of formState.fields) {
            fieldState.isValid = true;
            fieldState.isDirty = false;
            fieldState.errors = [];
        }

        // Reset form state
        formState.isValid = true;
        formState.isDirty = false;

        // Clear UI
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.classList.remove('is-valid', 'is-invalid', 'shake');
        });

        const feedbacks = form.querySelectorAll('.form-feedback');
        feedbacks.forEach(feedback => {
            feedback.className = 'form-feedback';
        });

        // Reset form values
        form.reset();
    },

    /**
     * Show validation summary
     */
    showValidationSummary(formId, containerId) {
        const formState = this.activeForms.get(formId);
        if (!formState) return;

        const container = document.getElementById(containerId);
        if (!container) return;

        const errors = [];

        for (const [fieldName, fieldState] of formState.fields) {
            if (!fieldState.isValid) {
                errors.push(...fieldState.errors.map(error => ({
                    field: fieldName,
                    message: error
                })));
            }
        }

        if (errors.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        container.innerHTML = `
            <div class="form-validation-summary error">
                <div class="form-validation-summary-title">
                    Please fix the following errors:
                </div>
                <ul class="form-validation-summary-list">
                    ${errors.map(error => `<li>${error.message}</li>`).join('')}
                </ul>
            </div>
        `;
    },

    /**
     * Helper: Common validation rule builders
     */
    rules: {
        required(label) {
            return { type: 'required', label };
        },

        email(label) {
            return { type: 'email', label };
        },

        url(label) {
            return { type: 'url', label };
        },

        minLength(min, label) {
            return { type: 'minLength', value: min, label };
        },

        maxLength(max, label) {
            return { type: 'maxLength', value: max, label };
        },

        min(min, label) {
            return { type: 'min', value: min, label };
        },

        max(max, label) {
            return { type: 'max', value: max, label };
        },

        pattern(pattern, label, message) {
            return { type: 'pattern', value: pattern, label, message };
        },

        match(compareValue, label) {
            return { type: 'match', compareValue, label };
        },

        custom(validator, label, message) {
            return { type: 'custom', validator, label, customMessage: message };
        }
    },

    /**
     * Password strength checker
     */
    checkPasswordStrength(password) {
        if (!password) return { strength: 'none', score: 0 };

        let score = 0;

        // Length
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;

        // Complexity
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^a-zA-Z0-9]/.test(password)) score += 1;

        // Determine strength
        let strength;
        if (score <= 2) strength = 'weak';
        else if (score <= 4) strength = 'fair';
        else if (score <= 5) strength = 'good';
        else strength = 'strong';

        return { strength, score };
    },

    /**
     * Update password strength UI
     */
    updatePasswordStrength(inputId, containerId) {
        const input = document.getElementById(inputId);
        const container = document.getElementById(containerId);

        if (!input || !container) return;

        const password = input.value;
        const { strength, score } = this.checkPasswordStrength(password);

        container.innerHTML = `
            <div class="password-strength">
                <div class="password-strength-meter">
                    <div class="password-strength-fill ${strength}"></div>
                </div>
                <div class="password-strength-label">
                    ${strength === 'none' ? '' : `Password strength: <strong>${strength}</strong>`}
                </div>
            </div>
        `;
    },

    /**
     * Character counter
     */
    updateCharacterCount(inputId, counterId, maxLength) {
        const input = document.getElementById(inputId);
        const counter = document.getElementById(counterId);

        if (!input || !counter) return;

        const currentLength = input.value.length;
        const remaining = maxLength - currentLength;

        counter.textContent = `${currentLength}/${maxLength}`;

        // Add warning/error classes
        counter.classList.remove('warning', 'error');
        if (remaining < maxLength * 0.1) {
            counter.classList.add('error');
        } else if (remaining < maxLength * 0.2) {
            counter.classList.add('warning');
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = formValidator;
}
