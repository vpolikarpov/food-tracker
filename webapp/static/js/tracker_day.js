$(document).ready(function () {
  var workingForm;

  initFoodSelectorOffcanvas();
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
      FT.sendFoodItemForm($(this));
    });
  }

  function initFoodSelectorOffcanvas() {
    // When the food selector offcanvas opens,
    // focus the food name input and reset the food list
    $('#foodSelector').on('shown.bs.offcanvas', function () {
      $('#foodName').select();
      $('.food-category-list .list-group-item').removeClass('d-none');
      $('.food-category-container').removeClass('d-none');
    });

    // When user submits the food selector form,
    // set the selected food name and close the offcanvas
    $('#foodSelectorForm').on('submit', function (e) {
      e.preventDefault();
      fillFoodDetails($('#foodName').val());
      $('#foodSelector').offcanvas('hide');
    });

    // When the user clicks on a food name in the food list,
    // set the selected food name and close the offcanvas
    $('.food-category-list .list-group-item').on('click', function () {
      fillFoodDetails($(this).data('food-name'));
      $('#foodSelector').offcanvas('hide');
    });

    // Filter the food list when the user types in the food name input
    $('#foodName').on('input', function () {
      var filter = $('#foodName').val().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      $('.food-category-list .list-group-item').each(function () {
        var foodName = $(this).data('food-name').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        $(this).toggleClass('d-none', !foodName.includes(filter));
      });
      $('.food-category-container').each(function () {
        var hasVisibleItems = $(this).find('.list-group-item').filter(function () {
          return $(this).hasClass('d-none') === false;
        }).length > 0;
        $(this).toggleClass('d-none', !hasVisibleItems);
      });
    });

    function fillFoodDetails(selectedFoodName) {
      workingForm.find('.food-name-input').val(selectedFoodName).addClass('bg-warning');

      var selectedFoodButton = $('.food-category-list .list-group-item').filter(function () {
        return $(this).data('food-name') === selectedFoodName;
      });

      if (selectedFoodButton.length) {
        workingForm.find('input[name="amount_grams"]').val(selectedFoodButton.data('portion-grams')).addClass('bg-warning');
        workingForm.find('input[name="energy_per_100g"]').val(selectedFoodButton.data('energy-per-100g')).addClass('bg-warning');
        workingForm.find('input[name="energy_total"]').val(selectedFoodButton.data('energy-per-portion')).addClass('bg-warning');
      }
      workingForm.addClass('changed');
      updateMealForms(workingForm.closest('.meal-container'));
    }
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
