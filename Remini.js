const a = require('axios');
const tinyurl = require('tinyurl');

module.exports = {
  config: {
    name: "remini",
    version: "1.0",
    author: "JARiF",
    countDown: 15,
    role: 0,
    longDescription: "enhance your image.",
    category: "utility",
    guide: {
      en: "{pn} reply to an image"
    }
  },

  onStart: async function ({ message, args, event, api }) {
    let imageUrl;

    if (event.type === "message_reply") {
      const replyAttachment = event.messageReply.attachments[0];

      if (["photo", "sticker"].includes(replyAttachment?.type)) {
        imageUrl = replyAttachment.url;
      } else {
        return api.sendMessage(
          { body: "┐(￣ヘ￣)┌ | Must reply to an image." },
          event.threadID
        );
      }
    } else if (args[0]?.match(/(https?:\/\/.*\.(?:png|jpg|jpeg))/g)) {
      imageUrl = args[0];
    } else {
      return api.sendMessage({ body: "┐(￣ヘ￣)┌ | Must reply to an image or provide an image URL." }, event.threadID);
    }

    try {
      const url = await tinyurl.shorten(imageUrl);
      const k = await a.get(`https://www.api.vyturex.com/upscale?imageUrl=${url}`);

      message.reply("⊂(・﹏・⊂) | Please wait...");

      const resultUrl = k.data.resultUrl;

      message.reply({ body: "<(￣︶￣)> | Image Enhanced.", attachment: await global.utils.getStreamFromURL(resultUrl) });
    } catch (error) {
      message.reply("(┌・。・)┌ | Api Dead...");
    }
  }
};