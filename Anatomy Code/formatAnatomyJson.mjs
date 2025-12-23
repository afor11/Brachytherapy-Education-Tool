// generates a string that can be loaded in by curveEditor from the json
import { readFile, writeFile } from 'fs/promises';
const filePath = './Anatomy Code/anatomy.json';
const outputFile = "./Anatomy Code/loadString.txt";
async function formatLoadString() {
    try {
        let jsonData = await readFile(filePath, {encoding: 'utf8'});
        let data = JSON.parse(jsonData);
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

        try {
            await writeFile(outputFile, parsedData, 'utf8');
            console.log('Load String Generated');
        }catch (err) {
            console.error(":( " + err);
        }
    } catch (err) {
        console.error(":( " + err);
    }
}

formatLoadString();