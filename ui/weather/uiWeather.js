export default function uiWeather(node, ) {
	const url = node.dataset.url;
	return fetch(url)
		.then(response => response.json())
		.then(data => {
			const current = data.current;
			console.log(data);
			node.innerHTML = `
				<h2>${current.temp_c}&deg;</h2>
				<h3>${data.location.name}, ${data.location.region}</h3>
				<p>${current.condition.text}</p>
				<img src="${current.condition.icon}" alt="${current.condition.text}" />

				`	
		})
	.catch(error => console.log(error));
}