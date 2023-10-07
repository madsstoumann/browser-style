export default function datasetWithTypes(dataset) {
	if (dataset) {
		const obj = {}
		Object.keys(dataset).forEach(key => {
			try {
				obj[key] = JSON.parse(dataset[key])
			}
			catch (e) {
				obj[key] = dataset[key]
			}
		})
		return obj;
	}
}