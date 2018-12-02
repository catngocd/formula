const axios = require("axios");
const fs = require("fs");

const credentials = JSON.parse(fs.readFileSync("./credentials.json"));
const config = JSON.parse(fs.readFileSync("./config.json"));
// const jquery = require("jquery");
// const config = jquery.getJSON("./config");
// const request = require("request");

let i = 7;
let test_file_name = `i_765_pg${i}.PNG`;

// define parameters for post request
let post_request_body = {
  requests: [
    {
      image: {
        source: {
          gcsImageUri: `gs://${config.STORAGE_BUCKET}/${test_file_name}`
        }
      },
      features: [
        {
          type: "DOCUMENT_TEXT_DETECTION"
        }
      ]
    }
  ]
};

console.log(`Page ${i}`);
console.log("POST sending now");

axios
  .post(
    `https://vision.googleapis.com/v1/images:annotate?key=AIzaSyAYyLfXAKOTikmHJN7jfHHWeNTLNMcQPk0`,
    post_request_body
  )
  .then(function(response) {
    console.log("response received");

    // list
    all_pages = response.data.responses[0].fullTextAnnotation.pages;

    // writes the pages data to a file, not necessary
    // fs.writeFile("./response.json", JSON.stringify(all_pages, null, 4), err => {
    //   if (err) {
    //     console.error(err);
    //     return;
    //   }
    //   console.log("File has been created");
    // });

    all_blocks = [];

    // iterate through all pages
    let len = all_pages.length;
    for (let i = 0; i < len; i++) {
      let page = all_pages[i];
      let numBlocks = page.blocks.length;

      // looping through all blocks in a page
      for (let j = 0; j < numBlocks; j++) {
        console.log(page.blocks[j]);
        // list of all blocks
        all_blocks = all_blocks.concat(page.blocks[j].boundingBox);
      }
    }

    // writing the blocks to a file
    fs.writeFile(
      `./blocks${i}.json`,
      JSON.stringify(all_blocks, null, 2),
      err => {
        if (err) {
          console.error(err);
          return;
        }
        console.log("File has been created");
      }
    );
  })
  .catch(function(error) {
    console.log(error);
  });
