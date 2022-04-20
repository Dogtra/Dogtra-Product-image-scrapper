import fetch from 'node-fetch'
import { JSDOM } from 'jsdom';
import { saveJson } from './index';

const fetchRetailers = async (page = 0) => {

    let response = await fetch("https://www.dogtra.com/admin/retailer/list", {
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
            "Sec-Fetch-User": "?1",
            "Pragma": "no-cache",
            "Cache-Control": "no-cache",
            "Cookie": "stg_returning_visitor=Tue%2C%2028%20Sep%202021%2000:51:47%20GMT; stg_last_interaction=Thu%2C%2014%20Apr%202022%2022:00:13%20GMT; ASP.NET_SessionId=3hzarybqwxancqixwplqrs1c; stg_externalReferrer=https://www.google.com/; stg_traffic_source_priority=4"
        },
        "referrer": "https://www.dogtra.com/admin/retailer/list",
        "body": "SearchCriteria.Page=" + page + "&SearchCriteria.Search=&SearchCriteria.Status=A",
        "method": "POST",
        "mode": "cors"
    });

    const text = await response.text();

    const dom = new JSDOM(text, {
        resources: "usable"
    });

    const { document } = dom.window;

    const retailers = Array.from(document.getElementsByTagName("tr"))
        .filter(row => !!row.getElementsByTagName("td")[0])
        .map(row => {
            let columns = row.getElementsByTagName("td");

            return {
                name: columns[0].innerHTML,
                address: columns[1].innerHTML,
                city: columns[2].innerHTML,
                state: columns[3].innerHTML,
                zipCode: columns[4].innerHTML,
                country: columns[5].innerHTML,
                phoneNumber: columns[6].innerHTML,
                email: columns[7].innerHTML,
                webUrl: columns[8].innerHTML,
            }
        })      

    console.log(retailers)

    return retailers;

}

const fetchAllRetailers = async () => {
    let retailers = [];

    for (let i = 0; i <= 26; i++) {
        const foundRetailers = await fetchRetailers(i);
        retailers = [...retailers, foundRetailers]
    }

    saveJson(retailers, "retailers.json")
}

// fetchRetailers()
fetchAllRetailers()