class Profile
{
	CALCULATION_STEPS = 50;
	name;
	points;

	constructor(name, points)
	{
		this.name = name;
		if (! (points instanceof Array))
		{
			throw "points must be a Array";
		}
		this.points = points;
		
		if (points.length < 2)
		{
		  throw "A profile needs at least two points";
		}
		
		let minX;
		let maxX;
		for (let point of points)
		{
			let x = points[0];
			if (minX == null)
			{
				minX = x;
			}
			else
			{
				minX = Math.min(minX, x);
			}
			if (maxX == null)
			{
				maxX = x;
			}
			else
			{
				maxX = Math.max(maxX, x);
			}
		}
		if (minX > 0.001 || minX < -0.001)
		{
		  throw "Minimal X must be 0";
		}
		if (maxX > 1.005 || maxX < 0.995)
		{
		  throw "Maximal X must be 1";
		}
	}
  
	upperY(x)
	{
		let y1 = Profile.getY(x, this.points);
		let reverseOrderOfPoints = this.points.reverse();
		let y2 = Profile.getY(x, reverseOrderOfPoints);
		return Math.max(y1, y2);
	}

	lowerY(x)
	{
		let y1 = Profile.getY(x, this.points);
		let reverseOrderOfPoints = this.points.reverse();
		let y2 = Profile.getY(x, reverseOrderOfPoints);
		return Math.min(y1, y2);
	}

	static getY(x, points)
	{
		let pointsAround = Profile.getEnclosingX(x, points);
		let x0 = pointsAround[0][0];
		let x1 = pointsAround[1][0];
		let y0 = pointsAround[0][1];
		let y1 = pointsAround[1][1];
		if (x1 - x0 == 0)
		{
			return y1;
		}
		let y = (y0*(x1 - x) + y1*(x - x0))/(x1 - x0);
		return y;
	}
	
	static getEnclosingX(toEnclose, points)
	{
		let lastPoint = null;
		let lastValue = null;
		let minEncounteredValue;
		let maxEncounteredValue;
		
		for (let currentPoint of points)
		{
			let currentValue = currentPoint[0];
			if (toEnclose == currentValue)
			{
				return [currentPoint, currentPoint];
			}
		
			{
				if (minEncounteredValue == null)
					{
						minEncounteredValue = currentValue;
					}
					else
					{
						minEncounteredValue = Math.min(minEncounteredValue, currentValue);
					}
					if (maxEncounteredValue == null)
					{
						maxEncounteredValue = currentValue;
					}
					else
					{
						maxEncounteredValue = Math.max(maxEncounteredValue, currentValue);
					}
				}
		
				if (lastValue == null)
				{
					lastValue = currentValue;
					lastPoint = currentPoint;
					continue;
				}
		
				let currentMinValue = Math.min(currentValue, lastValue);
				let currentMaxValue = Math.max(currentValue, lastValue);
				if (toEnclose < currentMinValue || toEnclose > currentMaxValue)
				{
					lastPoint = currentPoint;
					lastValue = currentValue;
					continue;
				}
				return [currentPoint, lastPoint];
		}
		throw "The provided value, " + toEnclose
			+ ", does not match the interpolation interval ["
			+ minEncounteredValue + "," + maxEncounteredValue + "]";
	}


	thickness()
	{
		let minY;
		let maxY;
		for (let point of this.points)
		{
			let x = point[0];
			let y = point[1];
			if (minY == null)
			{
				minY = y;
			}
			else
			{
				minY = Math.min(minY, y);
			}
			if (maxY == null)
			{
				maxY = y;
			}
			else
			{
				maxY = Math.max(maxY, y);
			}
		}
		return maxY - minY;
	}

	/**
	 * Gibt den geometrischen Schwerpunkt des Profils zurück.
	 *
	 * @return {Array[2]} erster Wert: x-Wert des geometrischen Schwerpunkts 2. Wert: y-wert des geometrischen Schwerpunkts
	 */
	balancePoint(cutoffTailAtThickness)
	{
		let resultX = 0;
		let resultY = 0;
		let area = 0;
		let xStep = 1 / this.CALCULATION_STEPS;
		let thicknessReached = false;
		for (let x = xStep / 2; x < 1; x += xStep)
		{
			let minY = this.lowerY(x);
			let maxY = this.upperY(x);
			let thickness = maxY - minY;
			if (thickness > cutoffTailAtThickness)
			{
				thicknessReached = true; 
			}
			else if (thicknessReached && thickness < cutoffTailAtThickness)
			{
				break;
			}
			let centerY = (minY + maxY) / 2;
			area += thickness * xStep;
			resultX += x * thickness * xStep;
			resultY += centerY * thickness * xStep;
		}
		if (!thicknessReached)
		{
			throw "thickness " + cutoffTailAtThickness + " was never reached in profile";
		}
		return [resultX / area, resultY / area];
	}
	
	secondMomentOfArea(cutoffTailAtThickness)
	{
		console.debug("cutoffTailAtThickness:" + cutoffTailAtThickness)
		let balanceY = this.balancePoint(cutoffTailAtThickness)[1];
		let result = 0;
		let xStep = 1 / this.CALCULATION_STEPS;
		let thicknessReached = false;
		for (let x = xStep / 2; x < 1; x += xStep)
		{
			let minY = this.lowerY(x);
			let maxY = this.upperY(x);
			let thickness = maxY - minY;
			//console.debug("thickness: " + thickness);
			if (! thicknessReached && thickness > cutoffTailAtThickness)
			{
				console.debug("cutoffTailAtThickness first reached at " + x)
				thicknessReached = true; 
			}
			else if (thicknessReached && thickness < cutoffTailAtThickness)
			{
				console.debug("cutoffTailAtThickness second reached at " + x)
				break;
			}
			let distance1FromCenter = (balanceY - minY);
			let distance2FromCenter = (maxY - balanceY);
			// Stammfunktion von x^2 ist 1/3 x^3, xStep und 1/3 werden unten hinzugefügt
			result += (distance1FromCenter * distance1FromCenter * distance1FromCenter)
				+ (distance2FromCenter *distance2FromCenter * distance2FromCenter);
		}
		if (!thicknessReached)
		{
			throw "thickness " + cutoffTailAtThickness + " was never reached in profile";
		}
		return xStep * result / 3;
	}
	
	balancePointOfFoamCore(foamCoreThickness)
	{
		let resultX = 0;
		let resultY = 0;
		let area = 0;
		let xStep = 1 / this.CALCULATION_STEPS;
		let foamCoreMinY;
		let foamCoreMaxY;
		for (let x = xStep / 2; x < 1; x += xStep)
		{
			let minY = this.lowerY(x);
			let maxY = this.upperY(x);
			let thickness = maxY - minY;
			if (thickness >= foamCoreThickness)
			{
				if (foamCoreMinY == null)
				{
					foamCoreMinY = minY + (thickness - foamCoreThickness)/2;
					foamCoreMaxY = maxY - (thickness - foamCoreThickness)/2;
					console.debug("foamCoreMinY:" + foamCoreMinY + " foamCoreMaxY:" + foamCoreMaxY);
				}
				thickness = foamCoreThickness; 
			}
			if (minY < foamCoreMinY)
			{
				minY = foamCoreMinY
			}
			if (maxY > foamCoreMaxY)
			{
				maxY = foamCoreMaxY
			}
			let centerY = (minY + maxY) / 2;
			area += thickness * xStep;
			resultX += x * thickness * xStep;
			resultY += centerY * thickness * xStep;
		}
		return [resultX / area, resultY / area];
	}

	secondMomentOfAreaOfFoamCore(foamCoreThickness)
	{
		console.debug("foamCoreThickness:" + foamCoreThickness)
		let balanceY = this.balancePointOfFoamCore(foamCoreThickness)[1];
		let result = 0;
		let xStep = 1 / this.CALCULATION_STEPS;
		let foamCoreMinY;
		let foamCoreMaxY;
		for (let x = xStep / 2; x < 1; x += xStep)
		{
			let minY = this.lowerY(x);
			let maxY = this.upperY(x);
			let thickness = maxY - minY;
			if (thickness >= foamCoreThickness)
			{
				if (foamCoreMinY == null)
				{
					foamCoreMinY = minY + (maxY - minY - thickness)/2;
					foamCoreMaxY = maxY - (maxY - minY - thickness)/2;
				}
				thickness = foamCoreThickness; 
			}
			if (minY < foamCoreMinY)
			{
				minY = foamCoreMinY
			}
			if (maxY > foamCoreMaxY)
			{
				maxY = foamCoreMaxY
			}
			let distance1FromCenter = (balanceY - minY);
			let distance2FromCenter = (maxY - balanceY);
			// Stammfunktion von x^2 ist 1/3 x^3, xStep und 1/3 werden unten hinzugefügt
			result += (distance1FromCenter * distance1FromCenter * distance1FromCenter)
				+ (distance2FromCenter *distance2FromCenter * distance2FromCenter);
		}
		return xStep * result / 3;
	}

}
