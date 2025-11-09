let anatomyJson;
try {
    anatomyJson = require('/Users/ford/Desktop/Summer Internship 2025/Code/anatomy.json');
}catch (e){
    console.error(e.message);
}
console.log(anatomyJson);