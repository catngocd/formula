// // Imports the Google Cloud client library
// const vision = require("@google-cloud/vision");

// // Creates a client
// const client = new vision.ImageAnnotatorClient();

// // Performs label detection on the image file
// client
//   .labelDetection("./resources/dankmeeeeeemes.jpg")
//   .then(results => {
//     const labels = results[0].labelAnnotations;

//     console.log("Labels:");
//     labels.forEach(label => console.log(label.description));
//   })
//   .catch(err => {
//     console.error("ERROR:", err);
//   });

// // Imports the Google Cloud client libraries
// const vision = require("@google-cloud/vision");

// // Creates a client
// const client = new vision.ImageAnnotatorClient();

// /**
//  * TODO(developer): Uncomment the following lines before running the sample.
//  */
// const bucketName = "formula-images-yhack2018";
// const fileName = "i_765_pg1.PNG";

// // Read a remote image as a text document
// client
//   .documentTextDetection(`gs://${bucketName}/${fileName}`)
//   .then(results => {
//     const fullTextAnnotation = results[0].fullTextAnnotation;
//     console.log(fullTextAnnotation.text);
//   })
//   .catch(err => {
//     console.error("ERROR:", err);
//   });
