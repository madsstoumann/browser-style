export default function uiBMI(form) {
	const groups = [[0,18.49], [18.5,24.99], [25,29.99], [30,34.99], [35,39.99], [40,100]];
  

	form.addEventListener('input', () => {
		const height = form.elements.height.valueAsNumber;
  	const weight = form.elements.weight.valueAsNumber;
		
  	const bmi = parseFloat(weight / ((height / 100) ** 2)).toFixed(2);
  	const index = groups.findIndex(arr => arr[0] <= bmi && bmi < arr[1]);
		form.elements.result.value = bmi;
		// form.elements.group.value = index;
	});
	
		// let inches = (height*0.393700787).toFixed(0);
  
	// this.ho.value = `${height} cm / ${Math.floor(inches / 12)}' ${inches %= 12}"`;
  // this.wo.value = `${weight} kg / ${(weight*2.2046).toFixed(2)} lb`;
  // this.g[index].checked = true;
  
}