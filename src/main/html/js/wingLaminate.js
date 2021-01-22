let normalizedIMap = new Map([
	["e224",0.0000400], 
	["n63014",0.000101], 
]);
	

function crosssectionChanged(inputElement)
{
	let tableRow = inputElement.id.split("-")[1];
	let profile = document.getElementById('profile-' + tableRow).value;
	if (profile)
	{
		let normalizedI=parseFloat(normalizedIMap.get(profile));
		let chord = parseFloat(document.getElementById('chord-' + tableRow).value)/100;
		if (chord) 
		{
			let i=normalizedI * chord * chord * chord * chord;
			document.getElementById('iprofile-' + tableRow).value = i.toPrecision(3);
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
		let x =  parseFloat(document.getElementById("x-" + rowIndex).value);
		console.info("x=" + x + (typeof x));
		let iProfile = parseFloat(document.getElementById("iprofile-" + rowIndex).value);
		console.info("iProfile=" + iProfile + (typeof iProfile));
		let iCore = parseFloat(document.getElementById("icore-" + rowIndex).value);
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
		
		let xPrevious = parseFloat(document.getElementById("x-" + previousRowIndex).value);
		console.info("xPrevious=" + xPrevious+ (typeof xPrevious));
		let iProfilePrevious = parseFloat(document.getElementById("iprofile-" + previousRowIndex).value);
		console.info("iProfilePrevious=" + iProfilePrevious + (typeof iProfilePrevious));
		let iCorePrevious = parseFloat(document.getElementById("icore-" + previousRowIndex).value);
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

		if ((typeof x)!='number' || (typeof xPrevious)!='number')
		{
			alert("die x-Werte müssen gefüllt sein");
			break;
		}
		if (!iTotal || !iTotalPrevious)
		{
			alert("Die Trägheitsmomente 2.Ordnung des Profils müssen gefüllt sein");
			break;
		}
		
		// TODO extrapolate
		iTotal = (iTotal + iTotalPrevious) / 2
		console.info("iTotal" + iTotal + (typeof iTotal));
		
		// TODO aus Flächenkraft berechnen
		let q = parseFloat(document.getElementById("totalForce").value);
		console.info("q=" + q + (typeof q));
		
		let e = parseFloat(document.getElementById("youngsModulus").value)*1000000;
		console.info("e=" + e + (typeof e));
		let l = (x - xPrevious)/100;
		console.info("l=" + l + (typeof l));
		console.info("q*l*l*l=" + q*l*l*l);
		console.info("3*e*iTotal=" + 3*e*iTotal);
		
		let y = q*l*l*l/(3*e*iTotal);
		document.getElementById("y-" + rowIndex).innerHTML = y;
	}
	
}
