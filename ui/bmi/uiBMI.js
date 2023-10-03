export default function uiBMI(form) {
	const groups = [[0,18.49], [18.5,24.99], [25,29.99], [30,34.99], [35,39.99], [40,100]]
	form.addEventListener('input', () => {
  	const bmi = parseFloat(form.elements.weight.valueAsNumber / ((form.elements.height.valueAsNumber / 100) ** 2)).toFixed(2)
  	const index = groups.findIndex(arr => arr[0] <= bmi && bmi < arr[1])
		form.elements.result.value = bmi
		form.elements.bmigroup.value = index;
	})
	form.dispatchEvent(new Event('input'))
	
  // this.g[index].checked = true;
  
}