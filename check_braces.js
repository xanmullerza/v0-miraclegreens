
const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\FamilyPC\\Documents\\miraclegreens\\v0-miraclegreens\\v0-miraclegreens\\components\\recipe\\ingredient-builder.tsx', 'utf8');

let braceLevel = 0;
let errors = [];

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '{') braceLevel++;
    if (char === '}') braceLevel--;
    if (braceLevel < 0) {
        errors.push(`Unmatched closing brace at pos ${i}`);
        braceLevel = 0;
    }
}

console.log(`Final brace level: ${braceLevel}`);
if (errors.length > 0) {
    console.log('Errors found:');
    errors.forEach(e => console.log(e));
}
