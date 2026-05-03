import { generateId } from '@lib/bricks';
import { getElementLabel } from '@lib/bricks';

export const getBricksFieldType = (node) => {
  const type = (node.getAttribute('type') || 'text').toLowerCase();
  const tagName = node.tagName.toLowerCase();

  if (tagName === 'textarea') return 'textarea';
  if (tagName === 'select') return 'select';

  switch (type) {
    case 'email': return 'email';
    case 'password': return 'password';
    case 'file': return 'file';
    case 'checkbox': return 'checkbox';
    case 'submit': return 'submit';
    case 'tel': return 'tel';
    case 'number': return 'number';
    case 'url': return 'url';
    case 'date':
    case 'datetime-local':
    case 'time':
    case 'month':
    case 'week': return 'date';
    default: return 'text';
  }
};

export const processFormField = (form, node, context = {}) => {
  const tagName = node.tagName.toLowerCase();
  if (!['input', 'select', 'textarea', 'button'].includes(tagName)) return null;

  const type = node.getAttribute('type')?.toLowerCase() || 'text';

  // Skip hidden fields (but not submit buttons - we handle them separately)
  if (type === 'hidden') {
    return null;
  }

  const field = {
    type: getBricksFieldType(node),
    id: generateId().substring(0, 6),
    name: node.getAttribute('name') || '',
    label: '',
    placeholder: node.getAttribute('placeholder') || '',
    required: node.hasAttribute('required'),
    value: node.getAttribute('value') || ''
  };

  // Handle labels - multiple approaches
  if (node.id) {
    // 1. Label with for= attribute matching input id
    const label = form.querySelector(`label[for="${node.id}"]`);
    if (label) {
      field.label = label.textContent.replace('*', '').replace(':', '').trim();
    }
  }

  // 2. Previous sibling is a label element
  if (!field.label && node.previousElementSibling?.tagName?.toLowerCase() === 'label') {
    field.label = node.previousElementSibling.textContent.trim();
  }

  // 3. Use type, name, or placeholder as fallback (in that order)
  if (!field.label) {
    const fieldType = getBricksFieldType(node);
    const name = node.getAttribute('name') || '';
    const placeholder = node.getAttribute('placeholder') || '';
    const defaultLabel = name || placeholder || fieldType.charAt(0).toUpperCase() + fieldType.slice(1);
    field.label = getElementLabel(node, defaultLabel, context);
  }

  // Clean up label
  field.label = field.label
    .replace('*', '')
    .replace(':', '')
    .trim();

  // Handle specific field types
  switch (field.type) {
    case 'text':
    case 'email':
    case 'password':
      if (node.hasAttribute('minlength')) field.minLength = node.getAttribute('minlength');
      if (node.hasAttribute('maxlength')) field.maxLength = node.getAttribute('maxlength');
      break;
    case 'tel':
    case 'url':
      if (node.hasAttribute('minlength')) field.minLength = node.getAttribute('minlength');
      if (node.hasAttribute('maxlength')) field.maxLength = node.getAttribute('maxlength');
      break;

    case 'number':
      if (node.hasAttribute('min')) field.min = node.getAttribute('min');
      if (node.hasAttribute('max')) field.max = node.getAttribute('max');
      if (node.hasAttribute('step')) field.step = node.getAttribute('step');
      break;

    case 'date':
      field.dateFormat = type === 'datetime-local' ? 'Y-m-d\\TH:i' :
        type === 'time' ? 'H:i' :
          type === 'month' ? 'Y-m' :
            type === 'week' ? 'Y-\\WW' : 'Y-m-d';
      break;

    case 'file':
      field.fileUploadLimit = '1';
      field.fileUploadSize = '1';
      if (node.hasAttribute('accept')) {
        field.fileUploadAllowedTypes = node.getAttribute('accept');
      }
      break;

    case 'checkbox':
      // For checkboxes, use the label text as the option
      field.label = field.label || (node.nextSibling?.nodeValue?.trim() || '');
      field.options = field.label;
      if (!field.placeholder) {
        field.placeholder = field.label || field.name;
      }
      break;

    case 'select':
    case 'textarea':
      field.options = Array.from(node.querySelectorAll('option'))
        .map(opt => opt.textContent.trim())
        .join('\n');
      field.valueLabelOptions = true;
      break;
  }

  return field;
};

// Helper function to extract submit button text
const getSubmitButtonText = (buttonElement) => {
  const tagName = buttonElement.tagName.toLowerCase();
  const type = buttonElement.getAttribute('type')?.toLowerCase();

  let buttonText = '';

  if (tagName === 'button') {
    // For <button> elements, prefer textContent over value attribute
    buttonText = buttonElement.textContent?.trim() ||
      buttonElement.getAttribute('value')?.trim() || '';
  } else if (tagName === 'input' && (type === 'submit' || type === 'button')) {
    // For <input> elements, use value attribute
    buttonText = buttonElement.getAttribute('value')?.trim() ||
      buttonElement.value?.trim() || '';
  }

  return buttonText;
};

// Helper function to find submit buttons in form
const findSubmitButtons = (formNode) => {
  const submitButtons = [];

  // Find all potential submit buttons
  const buttons = Array.from(formNode.querySelectorAll('button, input[type="submit"], input[type="button"]'));

  buttons.forEach(button => {
    const tagName = button.tagName.toLowerCase();
    const type = button.getAttribute('type')?.toLowerCase();

    // Check if it's a submit button
    if (
      (tagName === 'button' && (!type || type === 'submit')) || // <button> without type or type="submit"
      (tagName === 'input' && type === 'submit') || // <input type="submit">
      (tagName === 'input' && type === 'button' && button.getAttribute('onclick')?.includes('submit')) // <input type="button"> with submit onclick
    ) {
      const buttonText = getSubmitButtonText(button);
      if (buttonText) {
        submitButtons.push(buttonText);
      }
    }
  });

  return submitButtons;
};

export const processFormElement = (formNode, context = {}) => {
  // Find submit button text dynamically
  const submitButtons = findSubmitButtons(formNode);
  const dynamicSubmitText = submitButtons.length > 0 ? submitButtons[0] : 'Submit';

  const formElement = {
    id: generateId(),
    name: 'form',
    parent: 0,
    children: [],
    settings: {
      fields: [],
      submitButtonStyle: 'primary',
      actions: ['email'],
      successMessage: 'Message successfully sent. We will get back to you as soon as possible.',
      emailSubject: 'Contact form request',
      emailTo: 'admin_email',
      fromName: 'bricks',
      emailErrorMessage: 'Submission failed. Please reload the page and try to submit the form again.',
      htmlEmail: true,
      mailchimpPendingMessage: 'Please check your email to confirm your subscription.',
      mailchimpErrorMessage: 'Sorry, but we could not subscribe you.',
      sendgridErrorMessage: 'Sorry, but we could not subscribe you.',
      showLabels: true,
      submitButtonText: dynamicSubmitText // Dynamic submit button text
    }
  };

  // Process all form fields (excluding submit buttons since we handle them separately)
  const fieldElements = Array.from(formNode.querySelectorAll('input, select, textarea'))
    .filter(el => {
      const type = el.getAttribute('type')?.toLowerCase();
      const tagName = el.tagName.toLowerCase();

      // Exclude submit buttons and hidden fields from regular field processing
      return !(
        (tagName === 'input' && type === 'submit') ||
        (tagName === 'input' && type === 'button') ||
        type === 'hidden'
      );
    });

  fieldElements.forEach(fieldEl => {
    const field = processFormField(formNode, fieldEl, context);
    if (field) {
      formElement.settings.fields.push(field);
    }
  });

  // Add form attributes
  const formAttrs = ['action', 'method', 'enctype', 'autoComplete', 'novalidate', 'target'];
  formAttrs.forEach(attr => {
    if (formNode.hasAttribute(attr)) {
      formElement.settings[attr] = formNode.getAttribute(attr);
    }
  });

  return formElement;
};
