/* -----Signup form slides ----- */
const signupForm = document.querySelector('#signup-form');

if (signupForm) {
  const steps = signupForm.querySelectorAll('.form-step');
  const nextButtons = signupForm.querySelectorAll('.next-button');
  const backButtons = signupForm.querySelectorAll('.back-button');


  let currentStep = 0;

  function showStep(stepNumber) {
    steps.forEach((step, index) => {
      step.classList.toggle('active', index === stepNumber);
    });
}

  nextButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        showStep(currentStep);
      }
  });
});

  backButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
      }
    });
});

showStep(currentStep);
}
