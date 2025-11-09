// generates a string that can be loaded in by curveEditor from the json
const fs = require('fs');
const filePath = '/Users/ford/Desktop/Summer Internship 2025/Code/Anatomy Code/anatomy.json';
const outputFile = "/Users/ford/Desktop/Summer Internship 2025/Code/Anatomy Code/loadString.txt";
fs.readFile(filePath, 'utf8', (err, fileContent) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }
    let data = fileContent;
    data = data.replaceAll(/\s/g,"");
    data = data.replaceAll("\"","\\\"");
    fs.writeFile(outputFile, ("\"" + data + "\""), err => {
        if (err) {
            console.error('Error writing file:', err);
        } else {
            console.log('Load String Generated');
        }
    });
});