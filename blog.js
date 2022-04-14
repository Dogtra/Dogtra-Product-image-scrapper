const axios = require('axios')
const { JSDOM } = require("jsdom")
var fs = require('fs');
const downloadImage = require('./utils/download_image')

const fetchBlogInformation = async (uri, blogPost) => {
    console.log('Fetching images for : ' + uri)

    const { data } = await axios.get('https://www.dogtra.com' + uri);
    
    const dom = new JSDOM(data, {
        resources: "usable"
      });
  
    const { document } = dom.window;
    
    let postContainer = document.getElementsByClassName("postContainer")[0];

    let postTitle = postContainer.getElementsByClassName("postTitle")[0];

    blogPost.title = postTitle.innerHTML

    postTitle.parentNode.removeChild(postTitle)

    let postInfo = postContainer.getElementsByTagName('p')[0];

    blogPost.categories = Array.from(postInfo.getElementsByTagName('span')).map(span => span.innerHTML)

    postInfo.parentNode.removeChild(postInfo)

    blogPost.details = postContainer.innerHTML;

    let images = Array.from(document.getElementsByClassName('blogPics')[0].getElementsByTagName('img'));

    let imageCounter = 0;

    images.forEach(img => {
        downloadImage('https://www.dogtra.com' + img.src, blogPost.urlPath + '_' + imageCounter, 'images/blogs/')
        blogPost.images.push({
            fileName: blogPost.title.replace(' ', '_') + '_' + imageCounter,
            src: img.src
        })
        imageCounter++
    })

    return blogPost;

}

const getAllBlogs = async () => {
    const { data } = await axios.get('https://www.dogtra.com/blog-and-events');

    const dom = new JSDOM(data, {
      resources: "usable"
    });

    const { document } = dom.window;

    let blogPosts = [];

    let blogThumbs = document.querySelectorAll('div[id=blogThumb]');
    
    for (const blogThumb of blogThumbs) {
        let pTags = blogThumb.getElementsByTagName('p')

        if (pTags.length != 3) {
            console.error('length is smaller than 3')
        } else {
            let blog = {
                'preview': pTags[0].innerHTML,
                'date': pTags[0].innerHTML,
                'type': 'blog',
                'urlPath': blogThumb.getElementsByTagName("a")[0].href.replace('/blog-and-events/', ''),
                'categories': [],
                'details': '',
                'images': [],
                'title': ''
            }

            const blogPost = await fetchBlogInformation(blogThumb.getElementsByTagName("a")[0].href, blog);
            blogPosts = [...blogPosts, blogPost]
        }
    }

    fs.writeFile("blogs.json", JSON.stringify(blogPosts), function(err) {
        if (err) {
            console.log(err);
        }
    });
}

getAllBlogs()