let fs = require('fs');
let request = require('request');
const { JSDOM } = require("jsdom")
const axios = require('axios')
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const saveJson = require('../utils/save_json')
const COOKIE = 'stg_returning_visitor=Tue%2C%2028%20Sep%202021%2000:51:47%20GMT; stg_last_interaction=Thu%2C%2021%20Apr%202022%2023:28:35%20GMT; ASP.NET_SessionId=qzsnhcybxrlqrl0xevtuv2id'

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

  console.log("Reading html file...")

  htmlSource = fs.readFileSync("src/product_list.html", "utf8");

  const rawdata = fs.readFileSync('product_SKUS.json');
  let productSKUs = JSON.parse(rawdata);

  const { document } = (new JSDOM(htmlSource)).window;

  const links = document.querySelectorAll('a[id=desktop]');

  console.log("Fetching product list")

  document.querySelectorAll('a[id=desktop]').forEach(item => {
    getImages(item['href'], productSKUs)
  })
}

const getImages = async (uri, productSKUs) => {

  const { data } = await axios.get(uri);

  const dom = new JSDOM(data, {
    resources: "usable"
  });

  const { document } = dom.window;



  const productName = document.getElementsByClassName('pdp-header-title')[0].innerHTML;

  const SKU = productSKUs.find(product => product.name === productName)

  if (!SKU) {
    console.log("No SKU found for " + productName);
    return;
  }

  console.log("Fetching images for " + productName + " with SKU " + SKU.SKU)

  let count = 0;

  await Array.from(document.getElementById('productImages').childNodes)
    .filter(item => item.tagName == "IMG")
    .forEach(async item => {
      count++
      await download_image('https://dogtra.com' + item.src,  'products/'+ SKU.SKU + '_' + count, () => { })
    });
}

const getProductBOInfo = async () => {

  console.log('Fetching products info with SKU...')

  let productSKUs = [];

  for (let i = 0; i <= 9; i++) {
    console.log('Fetching product page ' + i)

    const results = await getProductBOInfoByPage(i);

    console.log('Fetched ' + results.length + ' products in page ' + i)

    productSKUs = [ ...productSKUs, ...results]
  }

  console.log('Fetched ' + productSKUs.length + ' in total');


  saveJson(productSKUs, 'product_SKUS.json')

  return productSKUs;
}

const getProductBOInfoByPage = async (page) => {


  let response = await fetch("https://www.dogtra.com/admin/product/list", {
    "credentials": "include",
    "headers": {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:100.0) Gecko/20100101 Firefox/100.0",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3",
      "Content-Type": "application/x-www-form-urlencoded",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "same-origin",
      "Pragma": "no-cache",
      "Cache-Control": "no-cache",
      "Cookie": COOKIE

    },
    "referrer": "https://www.dogtra.com/admin/product/list",
    "body": "SearchCriteria.Page=" + page + "&SearchCriteria.Search=&SearchCriteria.BrandId=&SearchCriteria.WarrantyTypeId=&SearchCriteria.Status=A&SearchCriteria.CallToOrder=false&SearchCriteria.OutOfStock=false&SearchCriteria.OnSale=false&SearchCriteria.ShowOnWarranty=false",
    "method": "POST",
    "mode": "cors"
  });
  const text = await response.text();

  const dom = new JSDOM(text, {
    resources: "usable"
  });

  const { document } = dom.window;

  const products = await Promise.all(Array.from(document.getElementsByTagName("tr"))
    .filter(row => !!row.getElementsByTagName("td")[0])
    .map(async (row) => {
      let columns = row.getElementsByTagName("td");

      const BOInfo = await getBOInfo(columns[7].childNodes[0].href);

      return {
        name: columns[1].innerHTML,
        brand: columns[2].innerHTML,
        description: columns[3].innerHTML,
        MSRPPrice: columns[4].innerHTML,
        sortOder: columns[5].innerHTML,
        edit_url: columns[7].childNodes[0].href,
        ...BOInfo
      }
    }))

  return products
}

const getBOInfo = async (url) => {
  let response = await fetch("https://www.dogtra.com" + url, {
    "credentials": "include",
    "headers": {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:100.0) Gecko/20100101 Firefox/100.0",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Pragma": "no-cache",
      "Cache-Control": "no-cache",
      "Cookie": COOKIE
    },
    "method": "GET",
    "mode": "cors"
  });
  const text = await response.text();

  const dom = new JSDOM(text, {
    resources: "usable"
  });

  const { document } = dom.window;

  const categoriesRows = Array.from(document.getElementById("tabCat").getElementsByTagName("tbody")[0].getElementsByTagName("tr"));

  const categories = categoriesRows
    .filter(categoryRow => categoryRow.getElementsByTagName("td")[1].getElementsByTagName("input")[0].hasAttribute("checked"))
    .map(categoryRow => {
      let categoryName = categoryRow.getElementsByTagName("td")[0].getElementsByTagName("label")[0].innerHTML

      categoryName.substring(categoryName.indexOf("-&gt;") + 6); 
      return categoryName
    })

  return { 
    SKU: document.getElementsByClassName("gridrow")[0].childNodes[1].innerHTML,
    categories
  }
}

// getProducts()
// getImages('https://www.dogtra.com/products/e-collars/tom-davis-280c')

getProductBOInfo()