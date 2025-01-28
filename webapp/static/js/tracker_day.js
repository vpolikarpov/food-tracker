$(document).ready(function () {
  var workingForm;

  // Open the food selector offcanvas when the user clicks on a food name input
  $('.food-name-input').on('click', function () {
    workingForm = $(this).closest('form');
    $('#foodName').val($(this).val());
    $('#foodSelector').offcanvas('show');
  });

  // When the food selector offcanvas opens,
  // focus the food name input and reset the food list
  $('#foodSelector').on('shown.bs.offcanvas', function () {
    $('#foodName').select();
    resetFoodList();
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
    filterFoodList();
  });

  $('input[type="number"]').on('input', function () {
    $(this).addClass('bg-warning');
    var form = $(this).closest('form');
    form.addClass('changed');
    FT.updateNutritionValues(
      form.find('input[name="amount_grams"]'),
      form.find('input[name="energy_per_100g"]'),
      form.find('input[name="energy_total"]'),
      $(this)
    ).addClass('bg-warning');
    updateMealEnergySum(form.closest('.meal-container'));
  });

  $('.reset-button').on('click', function () {
    var form = $(this).closest('form');
    form.find('input').removeClass('bg-warning');
    $(this).closest('form').removeClass('changed');

    // We need to reset the form explicitly
    // for the meal energy sum to be updated correctly
    form[0].reset();
    updateMealEnergySum(form.closest('.meal-container'));
  });

  function filterFoodList() {
    var filter = $('#foodName').val().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    $('.food-category-list .list-group-item').each(function () {
      var foodName = $(this).data('food-name').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      $(this).toggle(foodName.includes(filter));
    });

    $('.food-category-container').each(function () {
      var hasVisibleItems = $(this).find('.list-group-item').filter(function () {
        return $(this).css('display') !== 'none';
      }).length > 0;
      $(this).toggle(hasVisibleItems);
    });
  }

  function resetFoodList() {
    $('.food-category-list .list-group-item').show();
    $('.food-category-container').show();
  }

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
    updateMealEnergySum(workingForm.closest('.meal-container'));
  }

  function updateMealEnergySum(mealContainer) {
    var mealTotalEnergy = 0;
    mealContainer.find('input[name="energy_total"]').each(function () {
      mealTotalEnergy += parseInt($(this).val()) || 0;
    });
    mealContainer.find('.meal-total-energy').text(mealTotalEnergy + ' kcal');
  }
});
