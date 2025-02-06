$(document).ready(function () {
  var workingForm;

  FT.initFoodSelectorOffcanvas(fillFoodDetails, allowCustom = true, defaultFilter = 'in-stock');
  $('form.food-item').each((_, form) => initForm($(form)));

  function initForm(form) {
    // Reset the form to remove all changes that browser may have saved
    form.trigger('reset');

    // When the user clicks on the food name input,
    // set the working form and open the food selector offcanvas
    form.find('.food-name-input').on('click', function () {
      workingForm = $(this).closest('form');
      $('#foodName').val($(this).val());
      $('#foodSelector').offcanvas('show');
    });

    // When the user changes any numeric input,
    // update the nutrition values and mark the form as changed
    form.find('input[type="number"]').on('input', function () {
      $(this).addClass('bg-warning');
      var form = $(this).closest('form');
      form.addClass('changed');
      FT.updateNutritionValues(
        form.find('input[name="amount_grams"]'),
        form.find('input[name="energy_per_100g"]'),
        form.find('input[name="energy_total"]'),
        $(this)
      ).addClass('bg-warning');
      updateMealForms(form.closest('.meal-container'));
    });

    // When the user clicks on the reset button,
    // reset the form to its initial state
    form.find('.reset-button').on('click', function () {
      var form = $(this).closest('form');
      form.find('input').removeClass('bg-warning');
      $(this).closest('form').removeClass('changed');

      // We need to reset the form explicitly
      // for the meal energy sum to be updated correctly
      form[0].reset();
      updateMealForms(form.closest('.meal-container'));

      // TODO: There is a bug where
      // the form is not reset correctly
      // when it was new item form before
    });

    // When the user submits the form,
    // send the form data to the server and update the form state
    form.on('submit', function (event) {
      event.preventDefault();
      var mealContainer = $(this).closest('.meal-container');
      FT.sendFoodItemForm($(this)).then(() => {
        updateMealForms(mealContainer);
      });
    });
  }

  function fillFoodDetails(selectedFoodData) {
    workingForm.find('input[name="name"]').val(selectedFoodData.food_name).addClass('bg-warning');

    if (selectedFoodData.food_id) {
      workingForm.find('input[name="amount_grams"]').val(selectedFoodData.portion_grams).addClass('bg-warning');
      workingForm.find('input[name="energy_per_100g"]').val(selectedFoodData.energy_per_100g).addClass('bg-warning');
      workingForm.find('input[name="energy_total"]').val(selectedFoodData.energy_per_portion).addClass('bg-warning');
    }
    workingForm.addClass('changed');
    updateMealForms(workingForm.closest('.meal-container'));
  }

  function updateMealForms(mealContainer) {
    // Recalculate the total energy for the meal
    var mealTotalEnergy = mealContainer.find('input[name="energy_total"]').toArray().reduce((total, input) => {
      return total + (parseInt($(input).val()) || 0);
    }, 0);
    mealContainer.find('.meal-total-energy').text(mealTotalEnergy + ' kcal');

    // Ensure that there is only one new item form in the meal container
    var formsCreated = FT.ensureSingleNewItemForm(mealContainer);
    formsCreated.each((_, form) => initForm($(form)));
  }
});
