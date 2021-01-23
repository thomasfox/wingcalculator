let normalizedIMap = new Map([
	["e224",0.0000400], 
	["n63014",0.000101], 
]);
	

function crosssectionChanged(inputElement)
{
	let tableRow = inputElement.id.split("-")[1];
	let profileName = document.getElementById('profile-' + tableRow).value;
	if (profileName)
	{
		let cutoffEnd = Number(document.getElementById('cutoffEnd-' + tableRow).value)/1000;
		let chord = Number(document.getElementById('chord-' + tableRow).value)/100;
		console.debug("cutoffEnd: " + cutoffEnd + " chord: " + chord);
		if (!isNaN(chord) && !isNaN(cutoffEnd)) 
		{
			let normalizedCutoffEnd = cutoffEnd/chord
			console.debug("normalizedCutoffEnd: " + normalizedCutoffEnd);
			let profile = window.profiles.get(profileName);
			let normalizedI = profile.secondMomentOfArea(normalizedCutoffEnd);
			let i = normalizedI * chord * chord * chord * chord;
			document.getElementById('iprofile-' + tableRow).value = i.toPrecision(3);
			let thickness = profile.thickness()*chord*1000;
			console.debug("thickness: " + profile.thickness() + ":" + thickness);
			document.getElementById('thickness-' + tableRow).innerHTML = thickness.toFixed(1) + " mm";
		}
		let foamCoreThickness = Number(document.getElementById('corethickness-' + tableRow).value)/1000;
		if (!isNaN(chord) && !isNaN(foamCoreThickness)) 
		{
			let normalizedFoamCoreThickness = foamCoreThickness/chord
			console.debug("normalizedFoamCoreThickness: " + normalizedFoamCoreThickness);
			let profile = window.profiles.get(profileName);
			let normalizedI = profile.secondMomentOfAreaOfFoamCore(normalizedFoamCoreThickness);
			let i = normalizedI * chord * chord * chord * chord;
			document.getElementById('icore-' + tableRow).value = i.toPrecision(3);
		}
	}
}

function addTableRow()
{
	let tbodyElement = document.getElementById('table').getElementsByTagName('tbody')[0];
	let rowElements = tbodyElement.getElementsByTagName('tr');
	let lastRowElement = rowElements[rowElements.length - 1];
	let rowIndex = getRowIndex(lastRowElement.id);
	let newRow = lastRowElement.cloneNode(true);
	let newRowIndex = parseInt(rowIndex) + 1;
	newRow.id = setNewRowIndex(lastRowElement.id, newRowIndex);
	var tdElement;
	for (tdElement of newRow.getElementsByTagName('td'))
	{
		for (inputElement of tdElement.getElementsByTagName('input'))
		{
			inputElement.id = setNewRowIndex(inputElement.id, newRowIndex);
		}
		for (selectElement of tdElement.getElementsByTagName('select'))
		{
			selectElement.id = setNewRowIndex(selectElement.id, newRowIndex);
		}
		for (spanElement of tdElement.getElementsByTagName('span'))
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
	let tbodyElement = document.getElementById('table').getElementsByTagName('tbody')[0];
	let rowElements = tbodyElement.getElementsByTagName('tr');
	if (rowElements.length == 1)
	{
		alert("Letzte Zeile kann nicht gelöscht werden");
		return;
	}
	let lastRowElement = rowElements[rowElements.length - 1];
	lastRowElement.remove();
}


function updateSelect(selectElement)
{
	for (optionsElement of selectElement.getElementsByTagName('option'))
	{
		optionsElement.removeAttribute("selected");
	}
	selectElement.options[selectElement.selectedIndex].setAttribute("selected","selected");
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


function calculate()
{
	let tbodyElement = document.getElementById('table').getElementsByTagName('tbody')[0];
	let rowElements = tbodyElement.getElementsByTagName('tr');
	let xMax = Number(document.getElementById("x-" + (rowElements.length - 1)).value)/100; // in m
	console.debug("xMax=" + xMax + (typeof xMax));
	
	let calculated = new Map();
	let xIndex = xMax;
	let totalArea = 0;
	calculationStep
	let step = Number(document.getElementById("calculationStep").value)/1000; // m
	console.debug("step=" + step + (typeof step));
	for (i = rowElements.length -1; i >=1; i--)
	{
		let rowElement = rowElements[i];
		let rowIndex = getRowIndex(rowElement.id);
		let nextRowIndex = i - 1;
		let nextRowElement = document.getElementById(setNewRowIndex(rowElement.id, nextRowIndex));
		let x =  Number(document.getElementById("x-" + rowIndex).value)/100;
		let xNext = Number(document.getElementById("x-" + nextRowIndex).value)/100;
		console.debug("x=" + x + (typeof x));
		console.debug("xNext=" + xNext + (typeof xNext));
		if ((typeof x)!='number' || (typeof xNext)!='number')
		{
			alert("Die x-Werte müssen gefüllt sein");
			break;
		}
		if (x <= xNext)
		{
			alert("Die x-Werte müssen aufsteigend sein");
			break;
		}
		let chord = Number(document.getElementById("chord-" + rowIndex).value)/100;
		let chordNext = Number(document.getElementById("chord-" + nextRowIndex).value)/100;
		if ((typeof chord)!='number' || (typeof chordNext)!='number')
		{
			alert("Die Profiltiefe-Werte müssen gefüllt sein");
			break;
		}
		if (chord < 0 || chordNext < 0)
		{
			alert("Die Profiltiefe-Werte müssen größer oder gleich 0 sein");
			break;
		}
		
		let iProfile = Number(document.getElementById("iprofile-" + rowIndex).value);
		console.debug("iProfile=" + iProfile + (typeof iProfile));
		let iCore = Number(document.getElementById("icore-" + rowIndex).value);
		let iTotal;
		if (iCore)
		{
			iTotal = iProfile - iCore;
		}
		else
		{
			iTotal = iProfile;
		}
		console.debug("iTotal=" + iTotal+ (typeof iTotal));
		let iTotal4throot=Math.sqrt(Math.sqrt(iTotal));
		
		let iProfileNext = Number(document.getElementById("iprofile-" + nextRowIndex).value);
		console.debug("iProfileNext=" + iProfileNext + (typeof iProfileNext));
		let iCoreNext = Number(document.getElementById("icore-" + nextRowIndex).value);
		let iTotalNext;
		if (iCoreNext)
		{
			iTotalNext = iProfileNext - iCoreNext;
		}
		else
		{
			iTotalNext = iProfileNext;
		}
		console.debug("iTotalNext=" + iTotalNext + (typeof iTotalNext));
		let iTotal4throotNext=Math.sqrt(Math.sqrt(iTotalNext));
	
		while (xIndex - step >= xNext - 0.001)
		{
			xHalfStep = xIndex - (step/2);
			
			chordAtHalfStep = (chord * (xHalfStep - xNext) + chordNext*(x - xHalfStep))/(x - xNext);
			calculated.set(xHalfStep, new Object());
			calculated.get(xHalfStep)['chord'] = chordAtHalfStep;
			
			let area = chordAtHalfStep * step;
			calculated.get(xHalfStep)['area'] = area;
			totalArea += area;
			
			// We assume that the change in dimensions between x and xNext is a linear one.
			// As iTotal rises as the 4th power of dimensions, we assume a linear change 
			// in the 4th root of iTotal
			let iTotal4throotAtHalfStep =(iTotal4throot * (xHalfStep - xNext) + iTotal4throotNext*(x - xHalfStep))/(x - xNext);
			let iTotalAtHalfStep=iTotal4throotAtHalfStep*iTotal4throotAtHalfStep*iTotal4throotAtHalfStep*iTotal4throotAtHalfStep;
			calculated.get(xHalfStep)['iTotal'] = iTotalAtHalfStep;
			
			xIndex -= step
		}
		console.debug("totalArea=" + totalArea + (typeof totalArea));
	}
	document.getElementById("totalArea").innerHTML = (totalArea * 10000).toFixed(2) + " cm^2";
	
	let totalForce = Number(document.getElementById("totalForce").value);
	let e = Number(document.getElementById("youngsModulus").value)*1000000;
	let outerArea = 0;
	let outerCenterOfForce = null
	let totalIncreaseOfSlope = 0;
	for (xStep of calculated.keys())
	{
		let calculatedStep = calculated.get(xStep);
		let area = calculatedStep.area;
		let force = totalForce * area / totalArea;
		calculatedStep.force = force;
		if (outerCenterOfForce == null)
		{
			calculatedStep.momentum = 0;
			outerCenterOfForce = xStep;
		}
		else
		{
			calculatedStep.momentum = (outerCenterOfForce - xStep)* totalForce * outerArea / totalArea
			outerCenterOfForce = (outerCenterOfForce * outerArea + xStep * area)/(outerArea + area);
		}
		calculatedStep.outerCenterOfForce = outerCenterOfForce;
		increaseOfSlope = calculatedStep.momentum / (e * calculatedStep.iTotal) * step;
		calculatedStep.increaseOfSlope = increaseOfSlope;
		totalIncreaseOfSlope += increaseOfSlope;
		outerArea += area;
	}
	console.debug("totalIncreaseOfSlope=" + totalIncreaseOfSlope + (typeof totalIncreaseOfSlope));
	console.debug("outerArea=" + outerArea + (typeof outerArea));
	
	let slope = totalIncreaseOfSlope;
	let totalY = 0;
	for (xStep of calculated.keys())
	{
		let calculatedStep = calculated.get(xStep);
		totalY += (slope - (calculatedStep.increaseOfSlope) / 2) * step
		slope -= calculatedStep.increaseOfSlope;
		calculatedStep.slope = slope;
	}
	console.debug("totalY=" + totalY + (typeof totalY));
	
	let y = totalY;
	for (xStep of calculated.keys())
	{
		let calculatedStep = calculated.get(xStep);
		y -= (calculatedStep.slope - (calculatedStep.increaseOfSlope) / 2) * step
		calculatedStep.y = y;
	}

	console.debug(calculated);
	
	for (rowElement of rowElements)
	{
		let rowIndex = getRowIndex(rowElement.id);
		console.debug("rowIndex=" + rowIndex + (typeof rowIndex));
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
		console.debug("xStepNextUpper=" + xStepNextUpper + (typeof xStepNextUpper));
		console.debug("xStepNextLower=" + xStepNextLower + (typeof xStepNextLower));
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
			console.debug(calculatedUpper);
			slope = calculatedUpper.slope + (xStepNextUpper - x) * calculatedUpper.increaseOfSlope;
			y = calculatedUpper.y + (xStepNextUpper - x) * calculatedUpper.slope;
		}
		else if (xStepNextLower != -Number.MAX_SAFE_INTEGER)
		{
			let calculatedLower = calculated.get(xStepNextLower);
			console.debug(calculatedLower);
			console.debug("calculatedLower.slope=" + calculatedLower.slope + (typeof calculatedLower.slope));
			console.debug("x=" + x + (typeof x));
			console.debug("calculatedLower.increaseOfSlope=" + calculatedLower.increaseOfSlope + (typeof calculatedLower.increaseOfSlope));
			slope = calculatedLower.slope - (x - xStepNextLower) * calculatedLower.increaseOfSlope;
			y = calculatedLower.y - (xStepNextLower - x) * calculatedLower.slope;
		}
		
		document.getElementById("y-" + rowIndex).innerHTML = (y*1000).toFixed(2) + " mm";
		document.getElementById("dy:dx-" + rowIndex).innerHTML = (slope*1000).toFixed(2) + " mm/m";
	}

	for (rowElement of rowElements)
	{
		let rowIndex = getRowIndex(rowElement.id);
		let previousRowIndex = parseInt(rowIndex) - 1;
		let previousRowElement = document.getElementById(setNewRowIndex(rowElement.id, previousRowIndex));
		if (!previousRowElement)
		{
			continue;
		}
		console.info("row=" + rowIndex);
		let x = Number(document.getElementById("x-" + rowIndex).value);
		console.info("x=" + x + (typeof x));
		let iProfile = Number(document.getElementById("iprofile-" + rowIndex).value);
		console.info("iProfile=" + iProfile + (typeof iProfile));
		let iCore = Number(document.getElementById("icore-" + rowIndex).value);
		let iTotal;
		if (iCore)
		{
			iTotal = iProfile - iCore;
		}
		else
		{
			iTotal = iProfile;
		}
		console.info("iTotal=" + iTotal+ (typeof iTotal));
		
		let xPrevious = Number(document.getElementById("x-" + previousRowIndex).value);
		console.info("xPrevious=" + xPrevious+ (typeof xPrevious));
		let iProfilePrevious = Number(document.getElementById("iprofile-" + previousRowIndex).value);
		console.info("iProfilePrevious=" + iProfilePrevious + (typeof iProfilePrevious));
		let iCorePrevious = Number(document.getElementById("icore-" + previousRowIndex).value);
		let iTotalPrevious;
		if (iCorePrevious)
		{
			iTotalPrevious = iProfilePrevious - iCorePrevious;
		}
		else
		{
			iTotalPrevious = iProfilePrevious;
		}
		console.info("iTotalPrevious=" + iTotalPrevious + (typeof iTotalPrevious));

		if (!iTotal || !iTotalPrevious)
		{
			alert("Die Trägheitsmomente 2.Ordnung des Profils müssen gefüllt sein");
			break;
		}
		
	
		// TODO extrapolate
		iTotal = (iTotal + iTotalPrevious) / 2
		console.info("iTotal" + iTotal + (typeof iTotal));
		
		// TODO aus Flächenkraft berechnen
		let q = Number(document.getElementById("totalForce").value);
		console.info("q=" + q + (typeof q));
		
		let e = Number(document.getElementById("youngsModulus").value)*1000000;
		console.info("e=" + e + (typeof e));
		let l = (x - xPrevious)/100;
		console.info("l=" + l + (typeof l));
	
		let y = q*l*l*l/(8*e*iTotal);
		console.info("y=" + y);
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
		console.log(coordinates.length);
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
	
	let tbodyElement = document.getElementById('table').getElementsByTagName('tbody')[0];
	let rowElements = tbodyElement.getElementsByTagName('tr');
	for (rowElement of rowElements)
	{
		let rowIndex = getRowIndex(rowElement.id);
		let profileElement = document.getElementById('profile-' + rowIndex);
		let option = document.createElement("option");
		option.setAttribute("value", name);
		option.innerHTML = name
		profileElement.appendChild(option);
	}
    console.log(window.profiles.get(name).secondMomentOfArea(0));
}
