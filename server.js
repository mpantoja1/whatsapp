/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

const { WEBHOOK_VERIFY_TOKEN, GRAPH_API_TOKEN, PORT, TOKEN_SYSTEM, API_LOG, API_ENABLE_NOTIFICATION } =
  process.env;

app.post("/webhook", async (req, res) => {
  // log incoming messages
  console.log("Incoming webhook message:", JSON.stringify(req.body, null, 2));

  const client_phone_number_id =
    req.body.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]?.recipient_id;

  // extract the status to send the reply from it
  const status_message =
    req.body.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]?.status;

  //send log
  await axios({
    method: "POST",
    url: `${API_LOG}`,
    headers: {
      Authorization: `${TOKEN_SYSTEM}`,
    },
    data: {
      Response: JSON.stringify(req.body, null, 2),
    },
  });
  
  // check if the webhook request contains a message
  // details on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
  const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];
  console.log(message)
  try {
     await axios({
        method: "POST",
        url: `${API_ENABLE_NOTIFICATION}`,
        headers: {
          Authorization: `${TOKEN_SYSTEM}`,
        },
        data: {
          Response: JSON.stringify(message),
        },
    });
  } catch (error) {
    console.error("Error webhook:", error.message);
  }
  


  res.sendStatus(200);
});

// accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // check the mode and token sent are correct
  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    // respond with 200 OK and challenge token from the request
    res.status(200).send(challenge);
    console.log("Webhook verified successfully!");
  } else {
    // respond with '403 Forbidden' if verify tokens do not match
    res.sendStatus(403);
  }
});

app.get("/", (req, res) => {
  res.send(`<pre>Nothing to see here.
Checkout README.md to start.</pre>`);
});

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});
