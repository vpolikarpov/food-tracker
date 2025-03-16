$(document).ready(function () {
  var workingForm;

  FT.initFoodSelectorOffcanvas(fillFoodDetails, allowCustom = true, defaultFilter = 'in-stock');
  $('form.food-consumption.food-item').each((_, form) => initForm($(form)));

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

    // When the user clicks on the info button,
    // show the food item details in an offcanvas
    form.find('.info-button').on('click', function () {
      var foodItemId = form.find('input[name="food_item_id"]').val();
      if (!foodItemId) {
        return;
      }
      showFoodItemDetails(foodItemId);
    });
  }

  function fillFoodDetails(selectedFoodData) {
    workingForm.find('input[name="name"]').val(selectedFoodData.food_name).addClass('bg-warning');

    if (selectedFoodData.food_id) {
      workingForm.find('input[name="food_item_id"]').val(selectedFoodData.food_id);
      workingForm.find('input[name="amount_grams"]').val(selectedFoodData.portion_grams).addClass('bg-warning');
      workingForm.find('input[name="energy_per_100g"]').val(selectedFoodData.energy_per_100g).addClass('bg-warning');
      workingForm.find('input[name="energy_total"]').val(selectedFoodData.energy_per_portion).addClass('bg-warning');
      workingForm.find('.info-button').removeClass('d-none');
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

  function showFoodItemDetails(foodItemId) {
    var foodDetailsElement = $('#foodDetails');

    var foodDetailsRequest = fetch('/foods/' + foodItemId, {
      method: 'GET',
      headers: {
        'X-Requested-With': 'FetchAPI',
      },
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Failed to load food item details. Please try again.');
        }
      })
      .then(fillFoodDetails);


    var stockRecordsRequest = fetch('/stock/' + foodItemId, {
      method: 'GET',
      headers: {
        'X-Requested-With': 'FetchAPI',
      },
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Failed to load food item stock. Please try again.');
        }
      })
      .then(fillStockRecords);

    Promise.all([foodDetailsRequest, stockRecordsRequest])
      .then(() => {
        foodDetailsElement.offcanvas('show');
      })
      .catch(error => {
        alert(error.message);
        foodDetailsElement.offcanvas('hide');
      });

    function initStockRecordForm(form) {
      // Prevent reinitialization of the form
      if (form.data('initialized')) return;
      form.data('initialized', true);

      // Set the food item ID for the form
      form.find('input[name="food_item_id"]').attr('value', foodItemId);

      // Reset the form to remove all changes that browser may have saved
      form.trigger('reset');

      // When the user changes any numeric input,
      // update the nutrition values and mark the form as changed
      form.find('input').on('input', function () {
        $(this).addClass('bg-warning');
        form.addClass('changed');
        let container = form.closest('.food-stock-items-container');
        updateStockRecordForms(container);
      });

      // When the user clicks on the reset button,
      // reset the form to its initial state
      form.find('.reset-button').on('click', function () {
        form.find('input').removeClass('bg-warning');
        $(this).closest('form').removeClass('changed');

        // We need to reset the form explicitly
        // for the meal energy sum to be updated correctly
        form[0].reset();
        let container = form.closest('.food-stock-items-container');
        updateStockRecordForms(container);

        // TODO: There is a bug where
        // the form is not reset correctly
        // when it was new item form before
      });

      // When the user submits the form,
      // send the form data to the server and update the form state
      form.on('submit', function (event) {
        event.preventDefault();
        let container = form.closest('.food-stock-items-container');
        FT.sendFoodItemForm($(this)).then(() => {
          updateStockRecordForms(container);
        });
      });
    }

    function fillFoodDetails(foodItemData) {
      foodDetailsElement.find('#foodDetailsName').text(foodItemData.name);
      foodDetailsElement.find('.food-category').text(foodItemData.category_name);
      foodDetailsElement.find('.food-energy-per-100g').text(foodItemData.energy_per_100g);
      foodDetailsElement.find('.food-energy-per-portion').text(foodItemData.energy_per_portion);
      foodDetailsElement.find('.food-portion-grams').text(foodItemData.portion_grams);

      if (foodItemData.note.length === 0) {
        foodDetailsElement.find('.food-note').closest('.input-group').addClass('d-none');
      } else {
        foodDetailsElement.find('.food-note').closest('.input-group').removeClass('d-none');
        foodDetailsElement.find('.food-note').text(foodItemData.note);
      }
    }

    function fillStockRecords(stockRecordsData) {
      var stockContainer = foodDetailsElement.find('.food-stock-items-container');
      templateForm = stockContainer.find('.food-item:last');
      stockContainer.find('.food-item').not(':last').remove();

      stockRecordsData.forEach(function (record) {
        var stockForm = templateForm.clone();
        stockForm.removeClass('food-item-new');
        stockForm.find('input[name="amount_note"]').attr('value', record.amount_note);
        stockForm.find('input[name="date_note"]').attr('value', record.date_note);
        stockForm.attr('action', record.edit_url);
        stockForm.find('input.delete-button').attr('formaction', record.delete_url);
        stockForm.insertBefore(templateForm);
      });

      stockContainer.find('.food-item').each((_, form) => initStockRecordForm($(form)));

      updateStockRecordForms(stockContainer);
    }

    function updateStockRecordForms(stockContainer) {
      var formsCreated = FT.ensureSingleNewItemForm(stockContainer);
      formsCreated.each((_, form) => initStockRecordForm($(form)));
    }
  }
});
