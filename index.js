let fs = require('fs');
let request = require('request');
const { JSDOM } = require("jsdom")
const axios = require('axios')

const download = (uri, filename, callback) => {
    request.head(uri, function(err, res, body){
      console.log('content-type:', res.headers['content-type']);
      console.log('content-length:', res.headers['content-length']);
  
      request(uri).pipe(fs.createWriteStream('images/' + filename)).on('close', callback);
    });
  };

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
    
    const productName = document.getElementsByClassName('pdp-header-title')[0].innerHTML.replace(/ /g,"_");

    let count = 0;

    Array.from(document.getElementById('productImages').childNodes).filter(item => item.tagName=="IMG").forEach(item =>  {
        count++ 
        download('https://dogtra.com' + item.src, productName + '_' + count + '.jpg', () => console.log('done'))
    });
}


getProducts()
// getImages()