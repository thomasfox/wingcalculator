package com.github.thomasfox.boatcalculator.valueset.impl;

import com.github.thomasfox.boatcalculator.calculate.MaterialConstants;
import com.github.thomasfox.boatcalculator.calculate.PhysicalQuantity;
import com.github.thomasfox.boatcalculator.valueset.SimpleValueSet;

public class BoatGlobalValues extends SimpleValueSet
{
  public static final String ID = BoatGlobalValues.class.getSimpleName();

  private static final String NAME = "Boot";

  public BoatGlobalValues()
  {
    super(ID, NAME);
    setFixedValueNoOverwrite(MaterialConstants.GRAVITY_ACCELERATION);
    addToInput(PhysicalQuantity.WIND_SPEED);
    addToInput(PhysicalQuantity.POINTING_ANGLE);
    addToInput(PhysicalQuantity.DRIFT_ANGLE);
    addToInput(PhysicalQuantity.MASS);
    addToInput(PhysicalQuantity.VELOCITY);
    addHiddenOutput(PhysicalQuantity.WEIGHT);
  }
}
