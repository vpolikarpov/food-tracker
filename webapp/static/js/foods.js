$(document).ready(function () {

  $('form.food-item').each((_, form) => initForm($(form)));

  function initForm(form) {
    // Reset the form to remove all changes that browser may have saved
    form.trigger('reset');

    // When user changes the value of a number input, highlight it
    // and update other nutrition values as needed
    form.find('input[type="number"]').on('input', function () {
      $(this).addClass('bg-warning');
      var form = $(this).closest('form');
      form.addClass('changed');
      FT.updateNutritionValues(
        form.find('input[name="portion_grams"]'),
        form.find('input[name="energy_per_100g"]'),
        form.find('input[name="energy_per_portion"]'),
        $(this)
      ).addClass('bg-warning');
      updateCategoryForms(form.closest('.category-container'));
    });

    // When user changes the value of a text input, highlight it
    form.find('input[type="text"]').on('input', function () {
      $(this).addClass('bg-warning');
      $(this).closest('form').addClass('changed');
      updateCategoryForms(form.closest('.category-container'));
    });

    // When user clicks the reset button, remove the highlight from all inputs
    form.find('.reset-button').on('click', function () {
      var form = $(this).closest('form');
      form.find('input').removeClass('bg-warning');
      form.removeClass('changed');
      updateCategoryForms(form.closest('.category-container'));
    });

    // When the user submits the form,
    // send the form data to the server and update the form state
    form.on('submit', function (event) {
      event.preventDefault();
      FT.sendFoodItemForm($(this));
    });
  }

  function updateCategoryForms(categoryContainer) {
    var formsCreated = FT.ensureSingleNewItemForm(categoryContainer);
    formsCreated.each((_, form) => initForm($(form)));
  }
});
