$(document).ready(function () {
  $('input[name="portion_grams"], input[name="energy_per_100g"], input[name="energy_per_portion"]').on('input', function () {
    $(this).addClass('bg-warning');
    $(this).closest('form').find('input.btn-outline-primary').removeClass('btn-outline-primary').addClass('btn-primary');
    performCalculations($(this));
  });

  // Add highlighting for name, comment, stock, and date inputs
  $('input[name="name"], input[name="comment"], input[name="stock_amount"], input[name="due_date"]').on('input', function () {
    $(this).addClass('bg-warning');
    $(this).closest('form').find('input.btn-outline-primary').removeClass('btn-outline-primary').addClass('btn-primary');
  });

  var lastChangedInput = null;
  var lastTargetInput = null;

  function performCalculations(changedInput) {
    var form = changedInput.closest('form');
    var gramsInput = form.find('input[name="portion_grams"]');
    var energyPer100gInput = form.find('input[name="energy_per_100g"]');
    var totalEnergyInput = form.find('input[name="energy_per_portion"]');

    var grams = parseFloat(gramsInput.val());
    var energyPer100g = parseFloat(energyPer100gInput.val());
    var totalEnergy = parseFloat(totalEnergyInput.val());

    if (changedInput.val() === '') {
      return;
    }

    var targetInput = null;

    if (changedInput.is(lastChangedInput)) {
      targetInput = lastTargetInput;
    } else {
      lastChangedInput = changedInput;

      if (grams && energyPer100g && totalEnergy) {
        if (changedInput.is(gramsInput) || changedInput.is(energyPer100gInput)) {
          targetInput = totalEnergyInput;
        }
        if (changedInput.is(totalEnergyInput)) {
          targetInput = energyPer100gInput;
        }
      }

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
  }

  $('.reset-button').on('click', function () {
    var form = $(this).closest('form');
    form.find('input').removeClass('bg-warning');
    form.find('input.btn-primary').removeClass('btn-primary').addClass('btn-outline-primary');
  });
});
