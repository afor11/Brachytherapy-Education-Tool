// generates a string that can be loaded in by curveEditor from the json
const fs = require('fs');
const filePath = 'anatomy.json';
const outputFile = "loadString.txt";
fs.readFile(filePath, 'utf8', (err, fileContent) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }
    let data = JSON.parse(fileContent);
    let parsedData = JSON.stringify(data, null, 4);
    let mode = "";
    parsedData = parsedData.split("\n").reduce((acc,currentLine) => {
        if (currentLine.includes("\"blockColor\"") || currentLine.includes("\"outlineColor\"")){
            mode = "blocking";
            currentLine.replaceAll("\n","");
            return acc + currentLine;
        }
        if (currentLine.includes("\"curves\"")){
            mode = "curves";
            return acc + currentLine + "\n";
        }
        if (mode === "blocking"){
            mode = (currentLine.includes("]") ? "" : "blocking");
            currentLine = currentLine.trim();
            return acc + currentLine + ((mode != "blocking") ? "\n" : "");
        }
        if (mode === "curves"){
            mode = (currentLine.includes("]") ? "" : "curves");
            if (!currentLine.includes("{") && (mode === "curves")){
                currentLine = currentLine.trim();
            }
            return acc + currentLine + (((mode != "curves") || currentLine.includes("]") || currentLine.includes("}")) ? "\n" : "");
        }
        return acc + currentLine + "\n";
    },"");

    fs.writeFile(outputFile, parsedData, err => {
        if (err) {
            console.error('Error writing file:', err);
        } else {
            console.log('Load String Generated');
        }
    });
});
// "I'm fully aware that you do not care if my skin is pourple or not"
//"honesty is the best policy for putting aside so people don't worry about you"