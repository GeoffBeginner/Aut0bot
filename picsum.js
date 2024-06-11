 module.exports.config = {
		   	name: "picsum",
    	version: "1.0.0",
    	role: 0,
    	hasPrefix: false,
 				  credits: "Geoff(j)",
 				  description: "generate image using prompt or text",
 				  usage: "picsum [prompt]",
 				  cooldowns: 1, 				 
};

module.exports.run = async ({ api, event, args }) => {
  const axios = require('axios');
  const fs = require('fs-extra');
  try { 
  const { threadID, messageID } = event;
  const query = args.join(" ");
  const time = new Date();
  const timestamp = time.toISOString().replace(/[:.]/g, "-");
  const path = __dirname + '/cache/' + `${timestamp}_tid.png`;
  if (!query) return api.sendMessage("Please provide your promt.", threadID, messageID);
    api.sendMessage(`Searching for ${query}`, event.threadID, event.messageID);
  const picsum = (await axios.get(`https://picsum.photos/api/prompt/${query}`, {
    responseType: "arraybuffer",
  })).data;
  fs.writeFileSync(path, Buffer.from(picsum, "utf-8"));
    setTimeout(function() {
  api.sendMessage({
    body: "Download Successfully🚀!",
    attachment: fs.createReadStream(path) }, threadID, () => fs.unlinkSync(path));
    }, 5000);
    } catch (error) {
      api.sendMessage(error.message, event.threadID, event.messageID);
    }
};



