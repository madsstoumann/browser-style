export default function downloadContent(content, filename) {
	const type = getMimeType(filename);
	const blob = new Blob([content], { type });
	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(link.href);
}

function getMimeType(filename) {
	const extension = filename.split('.').pop().toLowerCase();
	switch (extension) {
		case 'txt': return 'text/plain';
		case 'html': return 'text/html';
		case 'css': return 'text/css';
		case 'js': return 'application/javascript';
		case 'json': return 'application/json';
		case 'xml': return 'application/xml';
		case 'svg': return 'image/svg+xml';
		case 'png': return 'image/png';
		case 'jpg': 
		case 'jpeg': return 'image/jpeg';
		case 'gif': return 'image/gif';
		case 'pdf': return 'application/pdf';
		default: return 'application/octet-stream';
	}
}
