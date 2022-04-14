const axios = require('axios')
const { JSDOM } = require("jsdom")
var fs = require('fs');


var order = 0;

const getVideoForPage = (page) => {
    
    return axios.get('https://www.dogtra.com/training-tips-and-videos/change-page?Page=' + page)
    .then(function (response) {
        let videos = [];

        // handle success
        const { document } = (new JSDOM(response.data.Html)).window;
        
        const allAsyncResults = []

        const iframes = Array.from(document.getElementsByTagName("iframe"));

        let count = 0;

        for (const iframe of iframes) {
            videos[count] = { 
                videoUrl: iframe.src
            }
            count++
        }

        const descriptions = document.querySelectorAll('div[id=videoDescription]')
        
        let countd = 0;

        for (const description of descriptions) {

            videos[countd] = {
                ...videos[countd],
                title: description.getElementsByTagName("h3")[0] ? description.getElementsByTagName("h3")[0].innerHTML : null,
                description: description.getElementsByTagName("p")[0] ? description.getElementsByTagName("p")[0].innerHTML : null,
                categories: [],
                order
            }
            order++;
            countd++;
        }

        return videos;

    //   forEach(iframe => {console.log(iframe.src)})

    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
}

const addCategoriesToVideos = (content, category, page) => {
    return axios.get('https://www.dogtra.com/training-tips-and-videos/change-page?Page=' + page + '&CategoryId=' + category.id )
    .then((response) => {
        // handle success
        const { document } = (new JSDOM(response.data.Html)).window;
        
        const allAsyncResults = []

        const iframes = Array.from(document.getElementsByTagName("iframe"));

        let count = 0;

        for (const iframe of iframes) {
            content.forEach(content => {
                if (content.videoUrl === iframe.src) {
                    content.categories.push(category.name)
                }
            });
        }

        return content;

    //   forEach(iframe => {console.log(iframe.src)})

    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
}

const getAllVideos = async () => {
    let content = [];
    
    for (let i = 1; i <= 18; i++) {
    
        const videos = await getVideoForPage(i);
        content = content.concat(videos)
    }

    let categories = [
        {
            name: "Dog Training Tips",
            id: 2,
            pages: 10
        },
        {
            name: "Product Details",
            id: 3,
            pages: 9
        }
    ]

    for (const category of categories) {
        for (let j = 1; j <= category.pages; j++)  {
            content = await addCategoriesToVideos(content, category, j);
        } 
    }

    
    fs.writeFile("videos.json", JSON.stringify(content), function(err) {
        if (err) {
            console.log(err);
        }
    });

    return content;
}

getAllVideos()