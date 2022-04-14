const axios = require('axios')
var fs = require('fs');

module.exports  = (url, filename, path = 'images/') =>
axios({
  url,
  responseType: 'stream',
}).then(
  response => 
    new Promise((resolve, reject) => {

      switch (response.headers['content-type']) {
        case 'image/\png':
          filename += '.png'
          break;

        case 'image/\jpeg':
          filename += '.jpg'
          break;
        default: 
          console.error('Content-type ' + response.headers['content-type'] + ' is not handled')
          return
      }

      response.data
        .pipe(fs.createWriteStream(path + filename))
        .on('finish', () => resolve())
        .on('error', e => reject(e));
    }),
);