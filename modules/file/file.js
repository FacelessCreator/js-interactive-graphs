
export function downloadText(filename, mimetype, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:' + mimetype + ';charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

export function readTextFile(file, onload) {
    var fileReader = new FileReader();
    fileReader.onload = function () {
        onload(fileReader.result);
    }
    fileReader.readAsText(file);
}
