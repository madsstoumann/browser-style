export default function datasetWithTypes(dataset) {
	if (dataset) {
		const obj = {}
		Object.keys(dataset).forEach(key => {
			obj[key] = JSON.parse(dataset[key])
		})
		return obj;
	}
}