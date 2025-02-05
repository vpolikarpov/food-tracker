var FT = FT || {};

/**
 * Updates the nutrition values based on the input that was changed.
 * This function recalculates and updates the values of weight, energy density,
 * and total energy based on the input field that was modified. It ensures that
 * the values remain consistent and correctly reflect the nutritional information.
 *
 * @param {jQuery} weightInput - The jQuery object for the weight input field.
 * @param {jQuery} energyDensityInput - The jQuery object for the energy density input field.
 * @param {jQuery} totalEnergyInput - The jQuery object for the total energy input field.
 * @param {jQuery} changedInput - The jQuery object for the input field that was changed.
 * @returns {jQuery} The jQuery object for the target input field that was updated, or an empty jQuery object if no update was made.
 */
FT.updateNutritionValues = function (weightInput, energyDensityInput, totalEnergyInput, changedInput) {
  var weight = parseFloat(weightInput.val());
  var energyDensity = parseFloat(energyDensityInput.val());
  var totalEnergy = parseFloat(totalEnergyInput.val());

  if (changedInput.val() === '') {
    return $();
  }

  var targetInput = null;

  if (changedInput.is(FT.lastChangedInput)) {
    targetInput = FT.lastTargetInput;
  } else {
    FT.lastChangedInput = changedInput;

    if (!isNaN(weight) && !isNaN(energyDensity) && !isNaN(totalEnergy)) {
      if (changedInput.is(weightInput) || changedInput.is(energyDensityInput)) {
        targetInput = totalEnergyInput;
      }
      if (changedInput.is(totalEnergyInput)) {
        targetInput = energyDensityInput;
      }
    }

    if (!isNaN(weight) && !isNaN(energyDensity) && isNaN(totalEnergy) && !changedInput.is(totalEnergyInput)) {
      targetInput = totalEnergyInput;
    }
    if (!isNaN(weight) && isNaN(energyDensity) && !isNaN(totalEnergy) && !changedInput.is(energyDensityInput)) {
      targetInput = energyDensityInput;
    }
    if (isNaN(weight) && !isNaN(energyDensity) && !isNaN(totalEnergy) && !changedInput.is(weightInput)) {
      targetInput = weightInput;
    }

    FT.lastTargetInput = targetInput;
  }

  if (!targetInput) {
    return $();
  }

  if (targetInput.is(weightInput)) {
    weight = Math.round(totalEnergy / energyDensity * 100);
    weightInput.val(weight);
  }
  if (targetInput.is(energyDensityInput)) {
    energyDensity = Math.round(totalEnergy / weight * 100);
    energyDensityInput.val(energyDensity);
  }
  if (targetInput.is(totalEnergyInput)) {
    totalEnergy = Math.round(weight * energyDensity / 100);
    totalEnergyInput.val(totalEnergy);
  }

  return targetInput;
};

/**
 * Sends the food item form data to the server.
 * This function handles the form submission process, including determining the
 * appropriate action and method, handling new and delete actions, and updating
 * the form state based on the server response.
 *
 * @param {jQuery} form - The jQuery object for the form to be submitted.
 */
FT.sendFoodItemForm = function (form) {
  var button = form.find('input[type="submit"]:focus');
  var action = button.attr('formaction') || form.attr('action');
  var method = button.attr('formmethod') || form.attr('method') || 'POST';

  var isAdd = form.hasClass('food-item-new');
  var isDelete = button.hasClass('delete-button');
  if (isAdd && isDelete) {
    alert('Can\'t delete an item that has not been saved yet.');
    return;
  }

  form.removeClass('changed').addClass('loading');

  return fetch(action, {
    method: method,
    headers: {
      'X-Requested-With': 'FetchAPI',
    },
    body: new FormData(form[0])
  })
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error('Failed to save the food item. Please try again.');
      }
    })
    .then(response => {
      form.find('input').removeClass('bg-warning');
      if (isAdd) {
        form.removeClass('food-item-new');
        form.attr('action', response.edit_url);
        form.find('input.delete-button').attr('formaction', response.delete_url);
      }
      if (isDelete) {
        form.remove();
      }
    })
    .catch(error => {
      form.addClass('changed');
      alert(error.message);
    })
    .finally(() => {
      form.removeClass('loading');
    });
}

/**
 * Ensures that there is only one new item form in the container.
 * This function manages the state of new item forms, ensuring that there is
 * only one new item form at a time. It adds a new form if necessary and removes
 * extra forms if there are too many.
 *
 * @param {jQuery} container - The jQuery object for the container that holds the forms.
 * @returns {jQuery} The jQuery object for the new form that was created, or an empty jQuery object if no form was created.
 */
FT.ensureSingleNewItemForm = function (container) {
  var newItemForms = container.find('.food-item-new');
  var unchangedNewItemForms = newItemForms.filter((_, form) =>
    !$(form).hasClass('changed') && !$(form).hasClass('loading')
  );

  var formsCreated = $();
  if (unchangedNewItemForms.length == 0) {
    // This should never happen
    alert('Can\'t add a form because there are no unchanged forms left.');
  } else if (unchangedNewItemForms.length == 1) {
    // Add a new form if there is only one unchanged form (the template)
    var formTemplate = unchangedNewItemForms.first();
    var newForm = formTemplate.clone();
    formTemplate.after(newForm);
    formsCreated = newForm;
  } else if (unchangedNewItemForms.length == 2) {
    // Do nothing if there is already one unchanged form (the template) and one new form
  } else if (unchangedNewItemForms.length > 2) {
    // Remove extra forms if there are more than one unchanged form (the template)
    unchangedNewItemForms.slice(0, -2).remove();
  }

  return formsCreated;
}

/**
 * Initializes the food selector offcanvas.
 * This function sets up the event handlers for the food selector offcanvas,
 * including focusing the food name input, filtering the food list, and handling
 * food item selection.
 *
 * @param {function} itemSelectedCallback - The callback function to be called when a food item is selected.
 * @param {boolean} [allowCustom=true] - Whether to allow custom food names that are not in the list.
 */
FT.initFoodSelectorOffcanvas = function (itemSelectedCallback, allowCustom = true) {
  // When the food selector offcanvas opens,
  // reset the food list: show all in-stock items
  $('#foodSelector').on('show.bs.offcanvas', function () {
    $('.food-category-list .list-group-item').each(function () {
      var isInStock = $(this).data('is-in-stock');
      $(this).toggleClass('d-none', isInStock === "False");
    });
    toggleCategories();
  });

  // When the food selector offcanvas is opened,
  // focus the food name input
  $('#foodSelector').on('shown.bs.offcanvas', function () {
    $('#foodName').select();
    $('#foodName').trigger('click');
  });

  // When user submits the food selector form,
  // set the selected food name and close the offcanvas
  $('#foodSelectorForm').on('submit', function (e) {
    e.preventDefault();
    foodItemSelectionHandler($('#foodName').val());
  });

  // When the user clicks on a food name in the food list,
  // set the selected food name and close the offcanvas
  $('.food-category-list .list-group-item').on('click', function () {
    foodItemSelectionHandler($(this).data('food-name'));
  });

  // Filter the food list when the user types in the food name input
  $('#foodName').on('input', function () {
    var filter = $('#foodName').val().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    $('.food-category-list .list-group-item').each(function () {
      var foodName = $(this).data('food-name').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      $(this).toggleClass('d-none', !foodName.includes(filter));
    });
    toggleCategories();
  });

  function toggleCategories() {
    $('.food-category-container').each(function () {
      var hasVisibleItems = $(this).find('.list-group-item').filter(function () {
        return $(this).hasClass('d-none') === false;
      }).length > 0;
      $(this).toggleClass('d-none', !hasVisibleItems);
    });
  }

  // Search for the selected food name in the food list
  // and return the data for the selected food item
  function foodItemSelectionHandler(selectedFoodName) {
    var data = {};
    var selectedFoodButton = $('.food-category-list .list-group-item').filter(function () {
      return $(this).data('food-name') === selectedFoodName;
    });

    if (allowCustom && selectedFoodButton.length === 0) {
      data = {
        food_name: selectedFoodName
      };
    } else if (selectedFoodButton.length === 0) {
      return;
    } else {
      data = {
        food_name: selectedFoodName,
        food_id: selectedFoodButton.data('food-id'),
        portion_grams: selectedFoodButton.data('portion-grams'),
        energy_per_100g: selectedFoodButton.data('energy-per-100g'),
        energy_per_portion: selectedFoodButton.data('energy-per-portion'),
      };
    }
    $('#foodSelector').offcanvas('hide');
    itemSelectedCallback(data);
  }
}