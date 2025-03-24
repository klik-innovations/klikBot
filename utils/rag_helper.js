const fs = require('fs');
const Fuse = require('fuse.js');

const rawData = fs.readFileSync("training_data.json");
const faqData = JSON.parse(rawData);
const fuse = new Fuse(faqData, { keys: ["instruction"], threshold: 0.4 });

const findBestAnswer = (userQuery) => {
    const result = fuse.search(userQuery);
    return result.length > 0 ? result[0].item.answer : null;
};

module.exports = { findBestAnswer };
