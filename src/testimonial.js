let fs = require('fs');
let request = require('request');
const { JSDOM } = require("jsdom")
const axios = require('axios')
const download_image = require('../utils/download_image')
const save_json = require('../utils/save_json')

const fetchStaffPic = (staffPic, staffInfos) => {
    staffPic.getElementsByTagName('img')[0].src

    download_image('https://www.dogtra.com' + staffPic.getElementsByTagName('img')[0].src, staffInfos.name, 'images/testimonials/')

}

const fetchStaffInfo = (staffBio) => {

    let contactInfo =staffBio.getElementsByClassName('contactInfo')[0];
    let quote = staffBio.getElementsByClassName('quote')[0];

    let infos  = {
        'name': staffBio.getElementsByTagName('h3')[0].innerHTML,
        'company': staffBio.getElementsByTagName('h5')[0] ? staffBio.getElementsByTagName('h5')[0].innerHTML : null,
        'quote': quote.children[0].innerHTML,
        'address': contactInfo ? contactInfo.innerHTML.replace(/<[^>]*>?/gm, '').split("\n")[1].replace(/ /g, "") : null,
        'website': contactInfo ? contactInfo.getElementsByTagName("a")[0].innerHTML : null,
        'favourites': Array.from(quote.nextElementSibling.getElementsByTagName("a")).map(a => a.innerHTML),
    }
    
    return infos
}

const fetchAllTestimonial = async () => {
    const { data } = await axios.get('https://www.dogtra.com/testimonials');

    const dom = new JSDOM(data, {
        resources: "usable"
    });

    const { document } = dom.window;

    const proStaffsDoc = Array.from(document.getElementById("proStaffListContainer").querySelectorAll("div[id=proStaffPic]"));

    let testimonials = [];

    for (let i = 0; i <= proStaffsDoc.length - 1; i++) {
        const infos = fetchStaffInfo(proStaffsDoc[i].nextElementSibling)
        fetchStaffPic(proStaffsDoc[i], infos) 

        testimonials = [...testimonials, infos]
    } 

    console.log(testimonials)

    save_json(testimonials, 'testimonials.json')
}

fetchAllTestimonial();