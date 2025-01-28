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
