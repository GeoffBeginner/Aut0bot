const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const userDataFilePath = path.join(__dirname, 'word.json');

module.exports = {
  config: {
    name: "wordguess",
    aliases: [],
    version: "1.0",
    author: "Kshitiz",
    role: 0,
    shortDescription: "Guess the scrambled word",
    longDescription: "Guess the scrambled word to earn coins",
    category: "fun",
    guide: {
      en: "{p}wordguess"
    }
  },

  onStart: async function ({ event, message, usersData, api, args }) {
    if (args.length === 1 && args[0] === "top") {
      const topUsers = await getTopUsers(usersData, api);
      if (topUsers.length === 0) {
        return message.reply("No users found.");
      } else {
        const topUsersString = topUsers.map((user, index) => `${index + 1}. ${user.username}: ${user.money} coins`).join("\n");
        return message.reply(`Top 5 pro players:\n${topUsersString}`);
      }
    } else {
      const wordData = await fetchWord();
      if (!wordData) {
        return message.reply("Failed to fetch scrambled word. Please try again later.");
      }

      const sentMessage = await message.reply(`Guess this word: ${wordData.scrambled_word}`);

      global.GoatBot.onReply.set(sentMessage.messageID, {
        commandName: this.config.name,
        messageID: sentMessage.messageID,
        correctAnswer: wordData.correct_answer
      });
    }
  },

  onReply: async function ({ message, event, Reply, usersData }) {
    const userAnswer = event.body.trim().toLowerCase();
    const correctAnswer = Reply.correctAnswer.toLowerCase();

    if (userAnswer === correctAnswer) {
      const userID = event.senderID;
      await addCoins(userID, 1000);
      await message.reply("🎉🎊 Congratulations! Your answer is correct. You have received 1000 coins.");
    } else {
      await message.reply(`🥺 Oops! Wrong answer. The correct answer was: ${Reply.correctAnswer}`);
    }

    try {
      await message.unsend(event.messageID);
    } catch (error) {
      console.error("Error while unsending message:", error);
    }

    const { commandName, messageID } = Reply;
    if (commandName === this.config.name) {
      try {
        await message.unsend(messageID);
      } catch (error) {
        console.error("Error while unsending question:", error);
      }
    }
  }
};

async function fetchWord() {
  try {
    const response = await axios.get('https://word-guess-jet.vercel.app/kshitiz');
    return response.data;
  } catch (error) {
    console.error("Error fetching word:", error);
    return null;
  }
}

async function addCoins(userID, amount) {
  let userData = await getUserData(userID);
  if (!userData) {
    userData = { money: 0 };
  }
  userData.money += amount;
  await saveUserData(userID, userData);
}

async function getUserData(userID) {
  try {
    const data = await fs.readFile(userDataFilePath, 'utf8');
    const userData = JSON.parse(data);
    return userData[userID];
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(userDataFilePath, '{}');
      return null;
    } else {
      console.error("Error reading user data:", error);
      return null;
    }
  }
}

async function saveUserData(userID, data) {
  try {
    const userData = await getUserData(userID) || {};
    const newData = { ...userData, ...data };
    const allUserData = await getAllUserData();
    allUserData[userID] = newData;
    await fs.writeFile(userDataFilePath, JSON.stringify(allUserData, null, 2), 'utf8');
  } catch (error) {
    console.error("Error saving user data:", error);
  }
}

async function getAllUserData() {
  try {
    const data = await fs.readFile(userDataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading user data:", error);
    return {};
  }
}

async function getTopUsers(usersData, api) {
  const allUserData = await getAllUserData();
  const userIDs = Object.keys(allUserData);
  const topUsers = [];

  for (const userID of userIDs) {
    api.getUserInfo(userID, async (err, userInfo) => {
      if (err) {
        console.error("Failed to retrieve user information:", err);
        return;
      }

      const username = userInfo[userID].name;
      if (username) {
        const userData = allUserData[userID];
        topUsers.push({ username, money: userData.money });
      }
    });
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(topUsers.sort((a, b) => b.money - a.money).slice(0, 5));
    }, 2000);
  });
}