$(document).ready(function () {
  var workingForm;

  FT.initFoodSelectorOffcanvas(fillFoodDetails, allowCustom = false);
  $('form.food-stock.food-item').each((_, form) => initForm($(form)));

  function initForm(form) {
    // Reset the form to remove all changes that browser may have saved
    form.trigger('reset');

    // When the user clicks on the add button,
    // set the working form and open the food selector offcanvas
    form.find('input.add-button').on('click', function (event) {
      workingForm = $(this).closest('form');
      if (!workingForm.hasClass('food-item-new')) {
        return;
      }
      $('#foodName').val("");
      $('#foodSelector').offcanvas('show');
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

  function fillFoodDetails(selectedFoodData) {
    workingForm.addClass('changed');
    workingForm.find('span.food-name').text(selectedFoodData.food_name);
    workingForm.find('input[name="food_item_id"]').val(selectedFoodData.food_id);
    workingForm.find('input[name="amount_note"]').addClass('bg-warning').focus();
    workingForm.find('input[name="date_note"]').addClass('bg-warning');
    updateCategoryForms(workingForm.closest('.category-container'));
  }

  function updateCategoryForms(categoryContainer) {
    var formsCreated = FT.ensureSingleNewItemForm(categoryContainer);
    formsCreated.each((_, form) => initForm($(form)));
  }
});
