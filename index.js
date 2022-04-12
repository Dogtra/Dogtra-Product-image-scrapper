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
        console.log(item['href'])
    })
    
    // Array.from(document.getElementById('productImages').childNodes).filter(item => item.tagName=="IMG").forEach(item => console.log(item.currentSrc));
    // 

}

const getImages = async () => {
    const { data } = await axios.get("https://www.dogtra.com/products/e-collars/tom-davis-280c");
    const dom = new JSDOM(data, {
      resources: "usable"
    });
    const { document } = dom.window;

    const headerTitle = document.getElementsByClassName('pdp-header-title');

    console.log(JSON.stringify(headerTitle, null, 4));
    
    const productName = document.getElementsByClassName('pdp-header-title')[0].innerHTML.replace(/ /g,"_");


    let count = 0;

    Array.from(document.getElementById('productImages').childNodes).filter(item => item.tagName=="IMG").forEach(item =>  {
        console.log(item.src)
        count++ 
        download('https://dogtra.com' + item.src, productName + '_' + count + '.jpg', () => console.log('done'))
    });
}


// getProducts()
getImages()