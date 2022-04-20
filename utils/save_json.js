var fs = require('fs');

module.exports  = (content, filename) => {
    fs.writeFile(filename, JSON.stringify(content), function (err) {
        if (err) {
            console.log(err);
        }
    });
}