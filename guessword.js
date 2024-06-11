const words = [
    "apple", "banana", "orange", "strawberry", "mango", "pineapple", "watermelon",
    // Add more words here...
];

module.exports = {
    config: {
        name: "guessword",
        version: "1.0",
        author: "Asmit",
        shortDescription: "Play the Guess the Word game.",
        longDescription: "A game where you guess a word letter by letter.",
        category: "game",
        guide: {
            en: "Try to guess the word by entering one letter at a time. You have limited attempts. Type 'hint' to get a hint."
        }
    },

    onStart: async function ({ event, message, api, usersData }) {
        try {
            const word = words[Math.floor(Math.random() * words.length)];
            const maxAttempts = 5;
            const attemptsLeft = maxAttempts;
            const guessedWord = "_".repeat(word.length);

            const startMessage = `🎮 Welcome to the Guess the Word Game! 🎮\n\nYou have ${maxAttempts} attempts to guess the word.\n\nGuessed word: ${guessedWord}`;
            const sentMessage = await message.reply(startMessage);

            global.GuessWordGame = {
                currentMessageID: sentMessage.messageID,
                word,
                maxAttempts,
                attemptsLeft,
                guessedWord
            };
        } catch (error) {
            console.error("Error", error);
        }
    },

    onChat: async function ({ event, message, usersData }) {
        try {
            if (!global.GuessWordGame) return;

            const guess = event.body.trim().toLowerCase();
            const { word, maxAttempts, attemptsLeft, guessedWord } = global.GuessWordGame;

            if (guess === "hint") {
                const hintIndex = guessedWord.indexOf("_");
                const hintLetter = word[hintIndex];
                global.GuessWordGame.guessedWord = guessedWord.substr(0, hintIndex) + hintLetter + guessedWord.substr(hintIndex + 1);
                const hintMessage = `🔍 Here's a hint: The word contains the letter '${hintLetter.toUpperCase()}'.\n\nGuessed word: ${global.GuessWordGame.guessedWord}`;
                const sentMessage = await message.reply(hintMessage);
                if (global.GuessWordGame.currentMessageID) {
                    await message.unsend(global.GuessWordGame.currentMessageID);
                }
                global.GuessWordGame.currentMessageID = sentMessage.messageID;
                return;
            }

            if (!guess.match(/^[a-z]$/) || guessedWord.includes(guess)) {
                return;
            }

            const newGuessedWord = guessedWord.split("").map((char, index) => {
                if (word[index] === guess) {
                    return guess;
                } else {
                    return char;
                }
            }).join("");

            let responseMessage = "";

            if (newGuessedWord === guessedWord) {
                responseMessage = "❌ Incorrect guess!";
                global.GuessWordGame.attemptsLeft -= 1;
            } else {
                responseMessage = "✅ Correct guess!";
                global.GuessWordGame.guessedWord = newGuessedWord;
            }

            responseMessage += `\n\nGuessed word: ${newGuessedWord}`;

            if (newGuessedWord === word) {
                const senderID = event.senderID;
                const userData = await usersData.get(senderID);
                const updatedMoney = userData.money + 10000;
                await usersData.set(senderID, { money: updatedMoney });
                responseMessage += `\n\n🎉 Congratulations! You guessed the word "${word}" correctly and earned 10,000 coins! 🎉`;
                delete global.GuessWordGame;
            } else if (global.GuessWordGame.attemptsLeft === 0) {
                const senderID = event.senderID;
                const userData = await usersData.get(senderID);
                if (userData.money >= 5000) {
                    const updatedMoney = userData.money - 5000;
                    await usersData.set(senderID, { money: updatedMoney });
                    responseMessage += `\n\n😔 Sorry, you've run out of attempts! You lost 5,000 coins. 😔`;
                } else {
                    responseMessage += `\n\n😔 Sorry, you've run out of attempts! However, you don't have enough coins to deduct. 😔`;
                }
                delete global.GuessWordGame;
            }

            const sentMessage = await message.reply(responseMessage);
            if (global.GuessWordGame.currentMessageID) {
                await message.unsend(global.GuessWordGame.currentMessageID);
            }
            global.GuessWordGame.currentMessageID = sentMessage.messageID;
        } catch (error) {
            console.error("Error in guessword command:", error);
        }
    }
};