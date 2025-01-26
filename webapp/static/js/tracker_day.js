$(document).ready(function () {
  // Open the food selector offcanvas when the user clicks on a food name input
  $('.food-name-input').on('click', function () {
    var originForm = $(this).closest('form');
    $('#originFormId').val(originForm.data('form-id'));
    $('#foodName').val($(this).val());
    $('#foodSelector').offcanvas('show');
  });

  // When the food selector offcanvas opens, focus the food name input and reset the food list
  $('#foodSelector').on('shown.bs.offcanvas', function () {
    $('#foodName').select();
    resetFoodList();
  });

  // When user submits the food selector form, set the selected food name
  $('#foodSelectorForm').on('submit', function (e) {
    e.preventDefault();
    setSelectedFoodName($('#foodName').val());
  });

  // When the user clicks on a food name in the food list, set the selected food name
  $('.food-category-list .list-group-item').on('click', function () {
    setSelectedFoodName($(this).data('food-name'));
  });

  // Filter the food list when the user types in the food name input
  $('#foodName').on('input', function () {
    filterFoodList();
  });

  // When user changes values manually, highlight the inputs and change the save button
  $('input[name="amount_grams"], input[name="energy_per_100g"], input[name="energy_total"]').on('input', function () {
    $(this).addClass('bg-warning');
    var form = $(this).closest('form');
    form.find('.save-button, .reset-button').show();
    form.find('.delete-button').hide();
    performCalculations($(this));
  });
  var lastChangedInput = null;
  var lastTargetInput = null;

  $('.reset-button').on('click', function () {
    var form = $(this).closest('form');
    form.find('input').removeClass('bg-warning');
    form.find('.save-button, .reset-button').hide();
    form.find('.delete-button').show();

    // We need to reset the form explicitly
    // for the total meal intake to be updated correctly
    form[0].reset();
    updateTotalMealIntake(form.closest('.meal-container'));
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

  function setSelectedFoodName(selectedFoodName) {
    var originFormId = $('#originFormId').val();
    var originForm = $('form[data-form-id="' + originFormId + '"]');
    originForm.find('.food-name-input').val(selectedFoodName).addClass('bg-warning');

    var selectedFoodButton = $('.food-category-list .list-group-item').filter(function () {
      return $(this).data('food-name') === selectedFoodName;
    });

    if (selectedFoodButton.length) {
      originForm.find('input[name="amount_grams"]').val(selectedFoodButton.data('portion-grams')).addClass('bg-warning');
      originForm.find('input[name="energy_per_100g"]').val(selectedFoodButton.data('energy-per-100g')).addClass('bg-warning');
      originForm.find('input[name="energy_total"]').val(selectedFoodButton.data('energy-per-portion')).addClass('bg-warning');
    }

    originForm.find('input.btn-outline-primary').removeClass('btn-outline-primary').addClass('btn-primary');
    originForm.find('.save-button, .reset-button').show();
    originForm.find('.delete-button').hide();
    $('#foodSelector').offcanvas('hide');

    updateTotalMealIntake(originForm.closest('.meal-container'));
  }

  function performCalculations(changedInput) {
    var form = changedInput.closest('form');
    var gramsInput = form.find('input[name="amount_grams"]');
    var energyPer100gInput = form.find('input[name="energy_per_100g"]');
    var totalEnergyInput = form.find('input[name="energy_total"]');

    var grams = parseFloat(gramsInput.val());
    var energyPer100g = parseFloat(energyPer100gInput.val());
    var totalEnergy = parseFloat(totalEnergyInput.val());

    // If the changed input is empty, do nothing
    if (changedInput.val() === '') {
      updateTotalMealIntake(form.closest('.meal-container'));
      return;
    }

    var targetInput = null;

    if (changedInput.is(lastChangedInput)) {
      // If the same input was changed again, keep the same target input
      targetInput = lastTargetInput;
    } else {
      // If a different input was changed, calculate the target input
      lastChangedInput = changedInput;

      // When all three inputs have values, calculate one of energy values
      if (grams && energyPer100g && totalEnergy) {
        if (changedInput.is(gramsInput) || changedInput.is(energyPer100gInput)) {
          targetInput = totalEnergyInput;
        }
        if (changedInput.is(totalEnergyInput)) {
          targetInput = energyPer100gInput;
        }
      }

      // When only one value is missing, calculate it
      if (grams && energyPer100g && !totalEnergy && !changedInput.is(totalEnergyInput)) {
        targetInput = totalEnergyInput;
      }
      if (grams && !energyPer100g && totalEnergy && !changedInput.is(energyPer100gInput)) {
        targetInput = energyPer100gInput;
      }
      if (!grams && energyPer100g && totalEnergy && !changedInput.is(gramsInput)) {
        targetInput = gramsInput;
      }

      lastTargetInput = targetInput;
    }

    // Update the target input and highlight it
    if (targetInput) {
      if (targetInput.is(gramsInput)) {
        gramsInput.val(Math.round(totalEnergy / energyPer100g * 100)).addClass('bg-warning');
      }
      if (targetInput.is(energyPer100gInput)) {
        energyPer100gInput.val(Math.round(totalEnergy / grams * 100)).addClass('bg-warning');
      }
      if (targetInput.is(totalEnergyInput)) {
        totalEnergyInput.val(Math.round(grams * energyPer100g / 100)).addClass('bg-warning');
      }
      targetInput.addClass('bg-warning');
    }

    updateTotalMealIntake(form.closest('.meal-container'));
  }

  function updateTotalMealIntake(mealContainer) {
    var mealTotalEnergy = 0;
    mealContainer.find('input[name="energy_total"]').each(function () {
      mealTotalEnergy += parseInt($(this).val()) || 0;
    });
    mealContainer.find('.meal-total-energy').text(mealTotalEnergy + ' kcal');
  }
});
