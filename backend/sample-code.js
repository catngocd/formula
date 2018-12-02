/**
 * This function is exported by index.js, and is executed when
 * a file is uploaded to the Cloud Storage bucket you created
 * for uploading images.
 *
 * @param {object} event.data (Node 6) A Google Cloud Storage File object.
 * @param {object} event (Node 8+) A Google Cloud Storage File object.
 */
exports.processImage = event => {
  let file = event.data || event;

  return Promise.resolve()
    .then(() => {
      if (file.resourceState === "not_exists") {
        // This was a deletion event, we don't want to process this
        return;
      }

      if (!file.bucket) {
        throw new Error(
          'Bucket not provided. Make sure you have a "bucket" property in your request'
        );
      }
      if (!file.name) {
        throw new Error(
          'Filename not provided. Make sure you have a "name" property in your request'
        );
      }

      return detectText(file.bucket, file.name);
    })
    .then(() => {
      console.log(`File ${file.name} processed.`);
    });
};

/**
 * Detects the text in an image using the Google Vision API.
 *
 * @param {string} bucketName Cloud Storage bucket name.
 * @param {string} filename Cloud Storage file name.
 * @returns {Promise}
 */
function detectText(bucketName, filename) {
  let text;

  console.log(`Looking for text in image ${filename}`);
  return vision
    .textDetection({ source: { imageUri: `gs://${bucketName}/${filename}` } })
    .then(([detections]) => {
      const annotation = detections.textAnnotations[0];
      text = annotation ? annotation.description : "";
      console.log(`Extracted text from image (${text.length} chars)`);
      return translate.detect(text);
    })
    .then(([detection]) => {
      if (Array.isArray(detection)) {
        detection = detection[0];
      }
      console.log(`Detected language "${detection.language}" for ${filename}`);

      // Submit a message to the bus for each language we're going to translate to
      const tasks = config.TO_LANG.map(lang => {
        let topicName = config.TRANSLATE_TOPIC;
        if (detection.language === lang) {
          topicName = config.RESULT_TOPIC;
        }
        const messageData = {
          text: text,
          filename: filename,
          lang: lang,
          from: detection.language
        };

        return publishResult(topicName, messageData);
      });

      return Promise.all(tasks);
    });
}

/**
 * This function is exported by index.js, and is executed when
 * a message is published to the Cloud Pub/Sub topic specified
 * by the TRANSLATE_TOPIC value in the config.json file. The
 * function translates text using the Google Translate API.
 *
 * @param {object} event.data (Node 6) The Cloud Pub/Sub Message object.
 * @param {object} event (Node 8+) The Cloud Pub/Sub Message object.
 * @param {string} {messageObject}.data The "data" property of the Cloud Pub/Sub
 * Message. This property will be a base64-encoded string that you must decode.
 */
exports.translateText = event => {
  const pubsubData = event.data.data || event.data;
  const jsonStr = Buffer.from(pubsubData, "base64").toString();
  const payload = JSON.parse(jsonStr);

  return Promise.resolve()
    .then(() => {
      if (!payload.text) {
        throw new Error(
          'Text not provided. Make sure you have a "text" property in your request'
        );
      }
      if (!payload.filename) {
        throw new Error(
          'Filename not provided. Make sure you have a "filename" property in your request'
        );
      }
      if (!payload.lang) {
        throw new Error(
          'Language not provided. Make sure you have a "lang" property in your request'
        );
      }

      const options = {
        from: payload.from,
        to: payload.lang
      };

      console.log(`Translating text into ${payload.lang}`);
      return translate.translate(payload.text, options);
    })
    .then(([translation]) => {
      const messageData = {
        text: translation,
        filename: payload.filename,
        lang: payload.lang
      };

      return publishResult(config.RESULT_TOPIC, messageData);
    })
    .then(() => {
      console.log(`Text translated to ${payload.lang}`);
    });
};

/**
 * This function is exported by index.js, and is executed when
 * a message is published to the Cloud Pub/Sub topic specified
 * by the RESULT_TOPIC value in the config.json file. The
 * function saves the data packet to a file in GCS.
 *
 * @param {object} event.data (Node 6) The Cloud Pub/Sub Message object.
 * @param {object} event (Node 8+) The Cloud Pub/Sub Message object.
 * @param {string} {messageObject}.data The "data" property of the Cloud Pub/Sub
 * Message. This property will be a base64-encoded string that you must decode.
 */
exports.saveResult = event => {
  const pubsubData = event.data.data || event.data;
  const jsonStr = Buffer.from(pubsubData, "base64").toString();
  const payload = JSON.parse(jsonStr);

  return Promise.resolve()
    .then(() => {
      if (!payload.text) {
        throw new Error(
          'Text not provided. Make sure you have a "text" property in your request'
        );
      }
      if (!payload.filename) {
        throw new Error(
          'Filename not provided. Make sure you have a "filename" property in your request'
        );
      }
      if (!payload.lang) {
        throw new Error(
          'Language not provided. Make sure you have a "lang" property in your request'
        );
      }

      console.log(`Received request to save file ${payload.filename}`);

      const bucketName = config.RESULT_BUCKET;
      const filename = renameImageForSave(payload.filename, payload.lang);
      const file = storage.bucket(bucketName).file(filename);

      console.log(`Saving result to ${filename} in bucket ${bucketName}`);

      return file.save(payload.text);
    })
    .then(() => {
      console.log(`File saved.`);
    });
};
