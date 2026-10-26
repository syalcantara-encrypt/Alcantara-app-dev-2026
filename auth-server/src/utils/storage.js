const fs = require('fs');
const path = require('path');

// Reads a JSON file and returns its content as an array.
// If the file doesn't exist yet (first run), returns an empty array.
function load(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return [];
  }
}

// Writes the array into a JSON file so it survives a restart.
function save(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true }); // create folder if missing
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = { load, save };