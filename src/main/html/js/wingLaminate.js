let normalizedIMap = new Map([
	["e224",0.0000400], 
	["n63014",0.000101], 
]);

function crossSectionChanged(inputElement)
{
	let tableRow = inputElement.id.split("-")[1];
	let profileName = document.getElementById("profile-" + tableRow).value;
	if (profileName)
	{
		let cutoffEnd = getNumberFromInputElement("cutoffEnd",tableRow)/1000;
		let chord = getNumberFromInputElement("chord", tableRow)/100;
		console.debug("cutoffEnd: " + cutoffEnd + " chord: " + chord);
		let profileCrossSection = null;
		let foamCoreCrossSection = null;
		if (!isNaN(chord) && !isNaN(cutoffEnd)) 
		{
			let normalizedCutoffEnd = cutoffEnd/chord
			console.debug("normalizedCutoffEnd: " + normalizedCutoffEnd);
			let profile = window.profiles.get(profileName);
			let normalizedI = profile.secondMomentOfArea(normalizedCutoffEnd);
			let i = normalizedI * chord * chord * chord * chord;
			setResultToSpanElement("iprofile", tableRow, i.toPrecision(3) + " m<sup>4</sup>");
			let thickness = profile.thickness()*chord*1000;
			console.debug("thickness normalized: " + profile.thickness() + " scaled:" + thickness);
			setResultToSpanElement("thickness", tableRow, thickness.toFixed(1) + " mm");
			profileCrossSection = profile.crossSection(normalizedCutoffEnd)*chord*chord*1000*1000;
		}
		let foamCoreThickness = getNumberFromInputElement("corethickness", tableRow)/1000;
		if (!isNaN(chord) && !isNaN(foamCoreThickness)) 
		{
			let normalizedFoamCoreThickness = foamCoreThickness/chord
			console.debug("normalizedFoamCoreThickness: " + normalizedFoamCoreThickness);
			let profile = window.profiles.get(profileName);
			let normalizedI = profile.secondMomentOfAreaOfFoamCore(normalizedFoamCoreThickness);
			let i = normalizedI * chord * chord * chord * chord;
			setResultToSpanElement("icore", tableRow, i.toPrecision(3) + " m<sup>4</sup>");
			foamCoreCrossSection = profile.crossSectionOfFoamCore(normalizedFoamCoreThickness)*chord*chord*1000*1000;
		}
		let crossSection = profileCrossSection;
		if (foamCoreCrossSection != null)
		{
			crossSection -= foamCoreCrossSection;
		}
		setResultToSpanElement("crossSection", tableRow, crossSection.toFixed(0) + " mm<sup>2</sup>");
	}
}

function addTableRow()
{
	document.getElementById("form").classList.remove("was-validated");
	let tbodyElement = document.getElementById("table").getElementsByTagName("tbody")[0];
	let rowElements = tbodyElement.getElementsByTagName("tr");
	let lastRowElement = rowElements[rowElements.length - 1];
	let rowIndex = getRowIndex(lastRowElement.id);
	let newRow = lastRowElement.cloneNode(true);
	let newRowIndex = parseInt(rowIndex) + 1;
	newRow.id = setNewRowIndex(lastRowElement.id, newRowIndex);
	var tdElement;
	for (tdElement of newRow.getElementsByTagName("td"))
	{
		for (inputElement of tdElement.getElementsByTagName("input"))
		{
			inputElement.id = setNewRowIndex(inputElement.id, newRowIndex);
		}
		for (selectElement of tdElement.getElementsByTagName("select"))
		{
			selectElement.id = setNewRowIndex(selectElement.id, newRowIndex);
		}
		for (spanElement of tdElement.getElementsByTagName("span"))
		{
			if (spanElement.id)
			{
				spanElement.id = setNewRowIndex(spanElement.id, newRowIndex);
			}
		}
	}
	tbodyElement.appendChild(newRow);
}

function removeLastTableRow()
{
	document.getElementById("form").classList.remove("was-validated");
	let tbodyElement = document.getElementById("table").getElementsByTagName("tbody")[0];
	let rowElements = tbodyElement.getElementsByTagName("tr");
	if (rowElements.length == 1)
	{
		alert("Die letzte Zeile kann nicht gelöscht werden");
		return;
	}
	let lastRowElement = rowElements[rowElements.length - 1];
	lastRowElement.remove();
}

function updateSelectedAttributeInOptions(selectElement)
{
	for (optionsElement of selectElement.getElementsByTagName("option"))
	{
		optionsElement.removeAttribute("selected");
	}
	selectElement.options[selectElement.selectedIndex].setAttribute("selected", "selected");
}

function getRowIndex(elementId)
{
	return elementId.split("-")[1];
}

function getIdPrefix(elementId)
{
	return elementId.split("-")[0];
}

function setNewRowIndex(elementId, newRowIndex)
{
	return getIdPrefix(elementId) + "-" + newRowIndex;
}

function getNumberFromInputElement(prefix, rowIndex)
{
	let element = getElement(prefix, rowIndex)
	let value = Number(element.value)
	if (isNaN(value))
	{
		setInputInvalid(prefix, rowIndex,'"' + value + '" is not a number.')
	}
	return value
}

function setInputInvalid(prefix, rowIndex, message)
{
	let element = getElement(prefix, rowIndex)
	element.setCustomValidity(message)
}

function setResultToSpanElement(prefix, rowIndex, value)
{
	getElement(prefix, rowIndex).innerHTML = value;
}

function setResultToInputElement(prefix, rowIndex, value)
{
	getElement(prefix, rowIndex).value = value;
}

function getElement(prefix, rowIndex)
{
	let elementId = prefix;
	if (rowIndex != null && !isNaN(rowIndex))
	{
		elementId += "-" + rowIndex;
	}
	const result = document.getElementById(elementId);
	if (!result)
	{
		console.warn("Could not find element with id " + elementId)
	}
	return result;
}

function clearCustomValidationMessages()
{
    let inputs = document.getElementsByTagName('input');
    for (index = 0; index < inputs.length; ++index)
    {
        inputs[index].setCustomValidity("");
    }
    let selects = document.getElementsByTagName('select');
    for (index = 0; index < selects.length; ++index)
    {
        selects[index].setCustomValidity("");
    }
}

function calculate()
{
    clearCustomValidationMessages();

	let tbodyElement = document.getElementById("table").getElementsByTagName("tbody")[0];
	let rowElements = tbodyElement.getElementsByTagName("tr");
	if (rowElements.length <= 1)
	{
		alert("Es müssen mindestens zwei Zeilen vorhanden sein. Fügen Sie eine weitere Zeile hinzu.");
		return;
	}
	let xMax = getNumberFromInputElement("x", rowElements.length - 1)/100; // in m
	console.debug("xMax=" + xMax + (typeof xMax));
	
	let calculated = new Map();
	let xIndex = xMax;
	let totalArea = 0;
	let totalVolume = 0;
	let foamCoreVolume = 0;
	let step = getNumberFromInputElement("calculationStep")/1000; // m
	console.debug("step=" + step + (typeof step));

	let invalid = false;
	for (i = rowElements.length - 1; i >= 1; i--)
	{
		let rowElement = rowElements[i];
		let rowIndex = getRowIndex(rowElement.id);
		console.debug("rowIndex=" + rowIndex + (typeof rowIndex));
		let nextRowIndex = i - 1;
		let nextRowElement = document.getElementById(setNewRowIndex(rowElement.id, nextRowIndex));
		console.debug("nextRowIndex=" + nextRowIndex + (typeof nextRowIndex));
		let x = getNumberFromInputElement("x", rowIndex)/100;
		let xNext = getNumberFromInputElement("x", nextRowIndex)/100;
		console.debug("x=" + x + (typeof x));
		console.debug("xNext=" + xNext + (typeof xNext));
		if (x <= xNext)
		{
			setInputInvalid("x", rowIndex, "Die Werte müssen aufsteigend sein");
		}
		let chord = getNumberFromInputElement("chord", rowIndex)/100;
		if (chord < 0)
		{
			setInputInvalid("chord", rowIndex, "Der Wert muss größer oder gleich 0 sein");
		}
		let chordNext = getNumberFromInputElement("chord", nextRowIndex)/100;
		if (chordNext < 0)
		{
			setInputInvalid("chord", nextRowIndex, "Der Wert muss größer oder gleich 0 sein");
		}
		
		let cutoffEnd = getNumberFromInputElement("cutoffEnd", rowIndex)/1000;
		if (cutoffEnd < 0)
		{
			setInputInvalid("cutoffEnd", rowIndex, "Der Wert muss größer oder gleich 0 sein");
		}
		let cutoffEndNext = getNumberFromInputElement("cutoffEnd", nextRowIndex)/1000;
		if (cutoffEndNext < 0)
		{
			setInputInvalid("cutoffEnd", nextRowIndex, "Der Wert muss größer oder gleich 0 sein");
		}
		console.debug("cutoffEnd: " + cutoffEnd + " cutoffEndNext: " + cutoffEndNext);
		let profileCrossSection = null;
		let foamCoreCrossSection = null;

		let foamCoreThickness = getNumberFromInputElement("corethickness", rowIndex)/1000;
		if (foamCoreThickness < 0)
		{
			setInputInvalid("corethickness", rowIndex, "Der Wert muss größer oder gleich 0 sein");
		}
		let foamCoreThicknessNext = getNumberFromInputElement("corethickness", nextRowIndex)/1000;
		if (foamCoreThicknessNext < 0)
		{
			setInputInvalid("corethickness", nextRowIndex, "Der Wert muss größer oder gleich 0 sein");
		}
		
		let profileName = document.getElementById("profile-" + rowIndex).value;
		if (!profileName)
		{
			setInputInvalid("profile", rowIndex, "Der Wert muss gesetzt sein");
		}
		let profileNameNext = document.getElementById("profile-" + nextRowIndex).value;
		if (!profileNameNext)
		{
			setInputInvalid("profile", nextRowIndex, "Der Wert muss gesetzt sein");
		}
		if (!window.profiles)
		{
			alert("Es muss mindestens ein Profil hochgeladen werden");
			return;
		}
		let profile = window.profiles.get(profileName);
		let profileNext = window.profiles.get(profileNameNext);
		if (!profile)
		{
			setInputInvalid("profile", rowIndex, "Der Wert muss gesetzt sein");
		}
		if (!profileNext)
		{
			setInputInvalid("profile", nextRowIndex, "Der Wert muss gesetzt sein");
		}

	    document.getElementById("form").classList.add("was-validated")
		invalid = invalid || !document.getElementById("form").checkValidity();

        if (invalid)
        {
            continue;
        }
	
		while (xIndex - step >= xNext - 0.001)
		{
			xHalfStep = xIndex - (step/2);
			
			chordAtHalfStep = (chord * (xHalfStep - xNext) + chordNext*(x - xHalfStep))/(x - xNext);
			calculated.set(xHalfStep, new Object());
			calculated.get(xHalfStep)["chord"] = chordAtHalfStep;
			
			let area = chordAtHalfStep * step;
			calculated.get(xHalfStep)["area"] = area;
			totalArea += area;
			
			let cutoffEndAtHalfStep =  (cutoffEnd * (xHalfStep - xNext) + cutoffEndNext*(x - xHalfStep))/(x - xNext);
			calculated.get(xHalfStep)["cutoffEnd"] = cutoffEndAtHalfStep;

			let iProfileAtHalfStep = profile.secondMomentOfArea(cutoffEndAtHalfStep/chordAtHalfStep) * chordAtHalfStep * chordAtHalfStep * chordAtHalfStep * chordAtHalfStep;
			calculated.get(xHalfStep)["iProfile"] = iProfileAtHalfStep;
			
			let foamCoreThicknessAtHalfStep =  (foamCoreThickness * (xHalfStep - xNext) + foamCoreThicknessNext*(x - xHalfStep))/(x - xNext);
			calculated.get(xHalfStep)["foamCoreThickness"] = foamCoreThicknessAtHalfStep;

			let iCoreAtHalfStep =  profile.secondMomentOfAreaOfFoamCore(foamCoreThicknessAtHalfStep/chordAtHalfStep) * chordAtHalfStep * chordAtHalfStep * chordAtHalfStep * chordAtHalfStep;
			calculated.get(xHalfStep)["iCore"] = iCoreAtHalfStep;
			
			calculated.get(xHalfStep)["iTotal"] = iProfileAtHalfStep - iCoreAtHalfStep;

			let profileCrossSection = profile.crossSection(cutoffEndAtHalfStep/chordAtHalfStep)*chordAtHalfStep*chordAtHalfStep;
			calculated.get(xHalfStep)["crossSectionProfile"] = profileCrossSection;

			let foamCoreCrossSection = profile.crossSectionOfFoamCore(foamCoreThicknessAtHalfStep/chordAtHalfStep)*chordAtHalfStep*chordAtHalfStep;
			calculated.get(xHalfStep)["crossSectionCore"] = foamCoreCrossSection;
			let totalCrossSection = profileCrossSection - foamCoreCrossSection;
			calculated.get(xHalfStep)["crossSectionTotal"] = totalCrossSection;

			foamCoreVolume += foamCoreCrossSection * step;
			totalVolume += totalCrossSection * step;
					
			let balancePoint = profile.balancePoint(cutoffEndAtHalfStep/chordAtHalfStep);
			let balancePointY = balancePoint[1] * chordAtHalfStep
			calculated.get(xHalfStep)["balancePointY"] = balancePointY;

			let maxTopDinstanceFromBalancePoint = profile.maxY()*chordAtHalfStep - balancePointY;
			let maxBottomDinstanceFromBalancePoint = balancePointY - profile.minY()*chordAtHalfStep ;
			calculated.get(xHalfStep)["maxTopDinstanceFromBalancePoint"] = maxTopDinstanceFromBalancePoint;
			calculated.get(xHalfStep)["maxBottomDinstanceFromBalancePoint"] = maxBottomDinstanceFromBalancePoint;

			xIndex -= step
		}
	}
	if (invalid)
	{
	  return;
	}

	document.getElementById("totalArea").innerHTML = (totalArea * 10000).toFixed(2) + " cm<sup>2</sup>";
	document.getElementById("totalVolume").innerHTML = (totalVolume * 1000000).toFixed(2) + " cm<sup>3</sup>";
	document.getElementById("foamCoreVolume").innerHTML = (foamCoreVolume * 1000000).toFixed(2) + " cm<sup>3</sup>";
	
	let totalForce = getNumberFromInputElement("totalForce");
	let areaForce = document.getElementById("areaForceType").checked;
	let e = getNumberFromInputElement("youngsModulus")*1000000;
	let outerArea = 0;
	let outerCenterOfForce = null
	let totalIncreaseOfSlope = 0;
	let totalMaxRelativeFiberStretch = 0;
	let totalMaxRelativeFiberStretchXPos = 0;
	let totalMaxRelativeFiberCompression = 0;
	let totalMaxRelativeFiberCompressionXPos = 0;
	for (xStep of calculated.keys())
	{
		let calculatedStep = calculated.get(xStep);
		let area = calculatedStep.area;
		if (areaForce)
		{
		    let force = totalForce * area / totalArea;
            calculatedStep.force = force;
            if (outerCenterOfForce == null)
            {
                calculatedStep.momentum = 0;
                outerCenterOfForce = xStep;
            }
            else
            {
                calculatedStep.momentum = (outerCenterOfForce - xStep) * totalForce * outerArea / totalArea
                outerCenterOfForce = (outerCenterOfForce * outerArea + xStep * area)/(outerArea + area);
            }
            calculatedStep.outerCenterOfForce = outerCenterOfForce;
        }
		else
		{
		    let force = totalForce;
            calculatedStep.force = force;
            outerCenterOfForce = xMax;
            calculatedStep.momentum = (outerCenterOfForce - xStep) * totalForce;
            calculatedStep.outerCenterOfForce = outerCenterOfForce;
        }
		increaseOfSlope = calculatedStep.momentum / (e * calculatedStep.iTotal) * step;
		calculatedStep.increaseOfSlope = increaseOfSlope;
		totalIncreaseOfSlope += increaseOfSlope;
		outerArea += area;
		

		let maxRelativeFiberStretch = calculatedStep.maxBottomDinstanceFromBalancePoint * increaseOfSlope / step;
		calculatedStep.maxRelativeFiberStretch = maxRelativeFiberStretch;
		if (maxRelativeFiberStretch > totalMaxRelativeFiberStretch)
		{
			totalMaxRelativeFiberStretch = maxRelativeFiberStretch;
			totalMaxRelativeFiberStretchXPos = xStep;
		}
		let maxRelativeFiberCompression = calculatedStep.maxTopDinstanceFromBalancePoint * increaseOfSlope / step;
		calculatedStep.maxRelativeFiberCompression = maxRelativeFiberCompression;
		if (maxRelativeFiberCompression > totalMaxRelativeFiberCompression)
		{
			totalMaxRelativeFiberCompression = maxRelativeFiberCompression;
			totalMaxRelativeFiberCompressionXPos = xStep;
		}
	}
	console.debug("totalIncreaseOfSlope=" + totalIncreaseOfSlope + (typeof totalIncreaseOfSlope));
	console.debug("outerArea=" + outerArea + (typeof outerArea));

	setResultToSpanElement("maxRelativeFiberCompression", null, (totalMaxRelativeFiberCompression*100).toPrecision(2) + " %");
	setResultToSpanElement("maxRelativeFiberCompressionXPos", null, (totalMaxRelativeFiberCompressionXPos*1000).toFixed(0) + " mm");
	setResultToSpanElement("maxRelativeFiberStretch", null, (totalMaxRelativeFiberStretch*100).toPrecision(2) + " %");
	setResultToSpanElement("maxRelativeFiberStretchXPos", null, (totalMaxRelativeFiberStretchXPos*1000).toFixed(0) + " mm");
	setResultToSpanElement("momentumOfWingAtX0", null, (outerCenterOfForce * totalForce).toFixed(0) + " Nm");

	let slope = 0;
	let y = 0;
	for (xStep of [...calculated.keys()].reverse())
	{
		let calculatedStep = calculated.get(xStep);
		slope += calculatedStep.increaseOfSlope;
		y += (slope - (calculatedStep.increaseOfSlope) / 2) * step
		calculatedStep.slope = slope;
		calculatedStep.y = y;
	}

	console.debug(calculated);
	
	for (rowElement of rowElements)
	{
		let rowIndex = getRowIndex(rowElement.id);
		//console.debug("rowIndex=" + rowIndex + (typeof rowIndex));
		let x = Number(document.getElementById("x-" + rowIndex).value)/100;
		let xStepNextLower = -Number.MAX_SAFE_INTEGER;
		let xStepNextUpper = Number.MAX_SAFE_INTEGER;
		for (xStep of calculated.keys())
		{
			if (xStep < xStepNextUpper && xStep > x)
			{
				xStepNextUpper = xStep;
			}
			if (xStep > xStepNextLower && xStep < x)
			{
				xStepNextLower = xStep;
			}
		}
		//console.debug("xStepNextUpper=" + xStepNextUpper + (typeof xStepNextUpper));
		//console.debug("xStepNextLower=" + xStepNextLower + (typeof xStepNextLower));
		let y = "";
		let slope = "";
		if (xStepNextUpper != Number.MAX_SAFE_INTEGER && xStepNextLower != -Number.MAX_SAFE_INTEGER)
		{
			let calculatedUpper = calculated.get(xStepNextUpper);
			let calculatedLower = calculated.get(xStepNextLower);
			y = (calculatedLower.y * (xStepNextUpper - x) + calculatedUpper.y*(x - xStepNextLower))/(xStepNextUpper - xStepNextLower);
			slope = (calculatedLower.slope * (xStepNextUpper - x) + calculatedUpper.slope*(x - xStepNextLower))/(xStepNextUpper - xStepNextLower);
		}
		else if (xStepNextUpper != Number.MAX_SAFE_INTEGER)
		{
			let calculatedUpper = calculated.get(xStepNextUpper);
			slope = calculatedUpper.slope + (xStepNextUpper - x) * calculatedUpper.increaseOfSlope;
			y = calculatedUpper.y + (xStepNextUpper - x) * calculatedUpper.slope;
		}
		else if (xStepNextLower != -Number.MAX_SAFE_INTEGER)
		{
			let calculatedLower = calculated.get(xStepNextLower);
			slope = calculatedLower.slope - (x - xStepNextLower) * calculatedLower.increaseOfSlope;
			y = calculatedLower.y - (xStepNextLower - x) * calculatedLower.slope;
		}
		
		setResultToSpanElement("y", rowIndex, (y*1000).toFixed(2) + " mm");
		setResultToSpanElement("dy:dx", rowIndex, (slope*1000).toFixed(2) + " mm/m");
	}
}

function handleProfileUpload(uploadElement)
{
	const uploadedFile = uploadElement.files[0];
	let name = uploadedFile.name;
	if (!name.endsWith(".dat"))
	{
		alert("Please upload a .dat file");
		return;
	}
	name = name.substring(0, name.length - 4);
	const reader = new FileReader();
	reader.onload = (function(file) { return function(e) { storeProfile(name,e.target.result); }; })(uploadedFile);
	reader.readAsText(uploadedFile);
}

function storeProfile(name, datContent)
{
	const lines = datContent.split("\n");
	let firstline = true;
	let profileCoordinates = [];
	for (line of lines)
	{
		if (firstline)
		{
			firstline = false;
			continue;
		}
		if (!line)
		{
			continue;
		}
		let coordinates = line.trim().split(/\s+/);
		if (coordinates.length != 2)
		{
			alert("Wrong line in .dat file: " + line);
			return;
		}
		let x = Number(coordinates[0]);
		if (isNaN(x))
		{
			alert("Wrong first number in .dat file: " + line + ":" + coordinates[0]);
			return;
		}
		let y = Number(coordinates[1]);
		if (isNaN(y))
		{
			alert("Wrong second number in .dat file: " + line + ":" + coordinates[1]);
			return;
		}
		profileCoordinates.push([x, y]);
	}
	if (!window.profiles)
	{
		window.profiles = new Map();
	}
	window.profiles.set(name, new Profile(name, profileCoordinates));
	
	let tbodyElement = document.getElementById("table").getElementsByTagName("tbody")[0];
	let rowElements = tbodyElement.getElementsByTagName("tr");
	for (rowElement of rowElements)
	{
		let rowIndex = getRowIndex(rowElement.id);
		let profileElement = document.getElementById("profile-" + rowIndex);
		let option = document.createElement("option");
		option.setAttribute("value", name);
		option.innerHTML = name
		profileElement.appendChild(option);
	}
    console.log("normalized second moment of area of "+ name + " is " + window.profiles.get(name).secondMomentOfArea(0));
}
