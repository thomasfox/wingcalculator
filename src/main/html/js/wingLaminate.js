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
	let rowIndex = lastRowElement.id.split("-")[1];
	let newRow = lastRowElement.cloneNode(true);
	let newRowIndex = parseInt(rowIndex) + 1;
	newRow.id = lastRowElement.id.split("-")[0] + "-" + newRowIndex;
	var tdElement;
	for (tdElement of newRow.getElementsByTagName('td'))
	{
		for (inputElement of tdElement.getElementsByTagName('input'))
		{
			inputElement.id = inputElement.id.split("-")[0] + "-" + newRowIndex;
		}
		for (selectElement of tdElement.getElementsByTagName('select'))
		{
			selectElement.id = selectElement.id.split("-")[0] + "-" + newRowIndex;
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
