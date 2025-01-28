$(document).ready(function () {
  // When user changes the value of a number input, highlight it
  // and update other nutrition values as needed
  $('input[type="number"]').on('input', function () {
    $(this).addClass('bg-warning');
    var form = $(this).closest('form');
    form.addClass('changed');
    FT.updateNutritionValues(
      form.find('input[name="portion_grams"]'),
      form.find('input[name="energy_per_100g"]'),
      form.find('input[name="energy_per_portion"]'),
      $(this)
    ).addClass('bg-warning');
  });

  // When user changes the value of a text input, highlight it
  $('input[type="text"]').on('input', function () {
    $(this).addClass('bg-warning');
    $(this).closest('form').addClass('changed');
  });

  // When user clicks the reset button, remove the highlight from all inputs
  $('.reset-button').on('click', function () {
    var form = $(this).closest('form');
    form.find('input').removeClass('bg-warning');
    form.removeClass('changed');
  });
});
