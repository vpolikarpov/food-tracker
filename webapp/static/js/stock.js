$(document).ready(function () {
  var workingForm;

  initFoodSelectorOffcanvas();
  $('form.food-item').each((_, form) => initForm($(form)));

  function initForm(form) {
    // Reset the form to remove all changes that browser may have saved
    form.trigger('reset');

    // When the user clicks on the food name input,
    // set the working form and open the food selector offcanvas
    form.find('.food-name-input').on('click', function (event) {
      workingForm = $(this).closest('form');
      if (!workingForm.hasClass('food-item-new')) {
        return;
      }
      $('#foodName').val($(this).val());
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

  function initFoodSelectorOffcanvas() {
    // When the food selector offcanvas opens,
    // focus the food name input and reset the food list
    $('#foodSelector').on('shown.bs.offcanvas', function () {
      $('#foodName').select();
      $('.food-category-list .list-group-item').show();
      $('.food-category-container').show();
    });

    // When user submits the food selector form,
    // set the selected food name and close the offcanvas
    $('#foodSelectorForm').on('submit', function (e) {
      e.preventDefault();
      var selectedFoodName = $('#foodName').val();
      var selectedFoodButton = $('.food-category-list .list-group-item').filter(function () {
        return $(this).data('food-name') === selectedFoodName;
      });
      if (selectedFoodButton.length) {
        fillFoodDetails(selectedFoodButton);
        $('#foodSelector').offcanvas('hide');
      }
    });

    // When the user clicks on a food name in the food list,
    // set the selected food name and close the offcanvas
    $('.food-category-list .list-group-item').on('click', function () {
      fillFoodDetails($(this));
      $('#foodSelector').offcanvas('hide');
    });

    // Filter the food list when the user types in the food name input
    $('#foodName').on('input', function () {
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
    });

    function fillFoodDetails(selectedFoodButton) {
      workingForm.find('input[name="food_name"]').val(selectedFoodButton.data('food-name')).addClass('bg-warning');
      workingForm.find('input[name="food_item_id"]').val(selectedFoodButton.data('food-id')).addClass('bg-warning');
      workingForm.addClass('changed');
      updateCategoryForms(workingForm.closest('.category-container'));
    }
  }

  function updateCategoryForms(categoryContainer) {
    var formsCreated = FT.ensureSingleNewItemForm(categoryContainer);
    formsCreated.each((_, form) => initForm($(form)));
  }
});
