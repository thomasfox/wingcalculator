package com.github.thomasfox.boatcalculator.interpolate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.github.thomasfox.boatcalculator.calculate.PhysicalQuantity;
import com.github.thomasfox.boatcalculator.interpolate.Interpolator.TwoValues;
import com.github.thomasfox.boatcalculator.value.PhysicalQuantityValue;
import com.github.thomasfox.boatcalculator.value.PhysicalQuantityValues;
import com.github.thomasfox.boatcalculator.valueset.ValueSet;

import lombok.Builder;
import lombok.Getter;
import lombok.NonNull;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

/**
 * Describes relations between multiple physical quantity along the line of
 * "if quantity a has value x, the quantity b has value y and quantity c has value z"
 */
@Slf4j
public class QuantityRelations
{
  @NonNull
  @Getter
  @Setter
  private String name;

  @NonNull
  @Getter
  private final PhysicalQuantityValues fixedQuantities;

  @NonNull
  private final List<PhysicalQuantityValues> relatedQuantityValues = new ArrayList<>();

  private final Interpolator interpolator = new Interpolator();

  /**
   * The PhysicalQuantity of which the other Quantities are functions.
   * May be null.
   */
  @Getter
  private final PhysicalQuantity keyQuantity;

  @Builder
  public QuantityRelations(
      String name,
      PhysicalQuantityValues fixedQuantities,
      List<PhysicalQuantityValues> relatedQuantityValues,
      PhysicalQuantity keyQuantity)
  {
    this.name = name;
    this.fixedQuantities = new PhysicalQuantityValues(fixedQuantities);
    for (PhysicalQuantityValues relatedQuantityValuesEntry : relatedQuantityValues)
    {
      addRelatedQuantityValuesEntry(relatedQuantityValuesEntry);
    }
    this.keyQuantity = keyQuantity;
  }

  public void addRelatedQuantityValuesEntry(PhysicalQuantityValues relatedQuantityValuesEntry)
  {
    if (!relatedQuantityValues.isEmpty() && !getRelatedQuantities().equals(relatedQuantityValuesEntry.getContainedQuantities()))
    {
      throw new IllegalArgumentException("The passed object contains non-mathcing Physical Quantities");
    }
    relatedQuantityValues.add(new PhysicalQuantityValues(relatedQuantityValuesEntry));
  }

  public List<PhysicalQuantityValues> getRelatedQuantityValues()
  {
    List<PhysicalQuantityValues> result = new ArrayList<>();
    for (PhysicalQuantityValues entry : relatedQuantityValues)
    {
      result.add(new PhysicalQuantityValues(entry));
    }
    return result;
  }

  public Set<PhysicalQuantity> getRelatedQuantities()
  {
    if (relatedQuantityValues.isEmpty())
    {
      return Collections.unmodifiableSet(new HashSet<>());
    }
    return Collections.unmodifiableSet(relatedQuantityValues.get(0).getContainedQuantities());
  }

  public PhysicalQuantityValues getRelatedQuantityValues(ValueSet valueSet)
  {
    PhysicalQuantityValues result = new PhysicalQuantityValues();
    Set<PhysicalQuantity> providedQuantities = getKnownRelatedQuantities(valueSet);
    if (providedQuantities.isEmpty())
    {
      return result;
    }
    Set<PhysicalQuantity> availableQuantities = getAvailableQuantities(valueSet);
    PhysicalQuantity providedQuantity = providedQuantities.iterator().next();
    // TODO check that all other provided quantities match

    double xValue = valueSet.getKnownValue(providedQuantity).getValue();
    TwoValues<PhysicalQuantityValues> enclosingPoints;
    try
    {
      enclosingPoints = interpolator.getEnclosing(xValue, relatedQuantityValues, x -> x.getValue(providedQuantity));
    }
    catch (InterpolatorException e)
    {
      log.info("Could not calculate " + availableQuantities
      + " for value " + valueSet.getKnownValue(providedQuantity).getValue()
      + " of " + providedQuantity.getDisplayName()
      + " from quantityRelations " + name
      + " with fixed quantities " + printFixedQuantities()
      + " reason is " + e.getMessage());
      return result;
    }

    for (PhysicalQuantity wantedQuantity : availableQuantities)
    {
      double interpolatedValue = interpolator.interpolateY(
          xValue,
          new SimpleXYPoint(enclosingPoints.value1.getValue(providedQuantity), enclosingPoints.value1.getValue(wantedQuantity)),
          new SimpleXYPoint(enclosingPoints.value2.getValue(providedQuantity), enclosingPoints.value2.getValue(wantedQuantity)));
        result.setValueNoOverwrite(wantedQuantity, interpolatedValue);
    }
    return result;
  }

  public String printFixedQuantities()
  {
    StringBuilder result = new StringBuilder();
    for (PhysicalQuantityValue fixedQuantity : fixedQuantities.getAsList())
    {
      result.append(fixedQuantity.getPhysicalQuantity().getDisplayNameIncludingUnit())
      .append(" = ")
      .append(fixedQuantity.getValue())
      .append("   ");
    }
    return result.toString();
  }

  public boolean fixedQuantitiesMatch(PhysicalQuantityValues knownValues)
  {
    for (PhysicalQuantityValue fixedQuantity : fixedQuantities.getAsList())
    {
      Double knownValue = knownValues.getValue(fixedQuantity.getPhysicalQuantity());
      if (knownValue == null || !knownValue.equals(fixedQuantity.getValue()))
      {
        return false;
      }
    }
    return true;
  }

  public Set<PhysicalQuantity> getAvailableQuantities(ValueSet valueSet)
  {
    Set<PhysicalQuantity> result = new HashSet<>();
    Set<PhysicalQuantity> relatedQuantities = getRelatedQuantities();
    for (PhysicalQuantity relatedQuantity : relatedQuantities)
    {
      if (!valueSet.isValueKnown(relatedQuantity))
      {
        result.add(relatedQuantity);
      }
    }
    if (result.equals(relatedQuantities))
    {
      // no related value is known
      return new HashSet<>();
    }
    return result;
  }

  public Set<PhysicalQuantity> getKnownRelatedQuantities(ValueSet valueSet)
  {
    Set<PhysicalQuantity> result = new HashSet<>();
    for (PhysicalQuantity relatedQuantity : getRelatedQuantities())
    {
      if (valueSet.isValueKnown(relatedQuantity))
      {
        result.add(relatedQuantity);
      }
    }
    return result;
  }

  public Set<PhysicalQuantity> getUnknownRelatedQuantities(ValueSet valueSet)
  {
    Set<PhysicalQuantity> result = new HashSet<>();
    for (PhysicalQuantity relatedQuantity : getRelatedQuantities())
    {
      if (!valueSet.isValueKnown(relatedQuantity))
      {
        result.add(relatedQuantity);
      }
    }
    return result;
  }

  public PhysicalQuantityValues getNonmatchingFixedQuantities(ValueSet valueSet)
  {
    PhysicalQuantityValues result = new PhysicalQuantityValues();
    for (PhysicalQuantityValue fixedQuantityValue : fixedQuantities.getAsList())
    {
      if (!fixedQuantityValue.equals(valueSet.getKnownValue(fixedQuantityValue.getPhysicalQuantity())))
      {
        result.setValue(fixedQuantityValue);
      }
    }
    return result;
  }

  @Override
  public String toString()
  {
    return name + ": fixedQuantities=" + fixedQuantities + ", relatedQuantities= " + getRelatedQuantities();
  }
}
