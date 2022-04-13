let fs = require('fs');
let request = require('request');
const { JSDOM } = require("jsdom")
const axios = require('axios')

const download_image = (url, filename) =>
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
        .pipe(fs.createWriteStream('images/' + filename))
        .on('finish', () => resolve())
        .on('error', e => reject(e));
    }),
);

const getProducts = async () => {
    htmlSource = fs.readFileSync("product_list.html", "utf8");

    console.log("Reading html file...")

    const { document } = (new JSDOM(htmlSource)).window;

    const links = document.querySelectorAll('a[id=desktop]');

    console.log("Fetching product list")

    document.querySelectorAll('a[id=desktop]').forEach(item => {
      getImages(item['href'])
    })
}

const getImages = async (uri) => {

    const { data } = await axios.get(uri);

    const dom = new JSDOM(data, {
      resources: "usable"
    });

    const { document } = dom.window;

    const productName = document.getElementsByClassName('pdp-header-title')[0]
    .innerHTML
    .replace(/ /g,"_")
    .replace(/[/\\?%*:|"<>]/g, '-');

    console.log("Fetching images for " + productName)

    let count = 0;

    await Array.from(document.getElementById('productImages').childNodes)
    .filter(item => item.tagName=="IMG")
    .forEach(async item =>  {
        count++ 
        await download_image('https://dogtra.com' + item.src, productName + '_' + count, () => {})
    });
}


getProducts()
// getImages('https://www.dogtra.com/products/e-collars/tom-davis-280c')