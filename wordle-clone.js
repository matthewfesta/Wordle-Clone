// Query the document for all the letters:
const letters = document.querySelectorAll(".scoreboard-letter");
// Get the loading bar
const loadingBar = document.querySelector('.info-bar');
const MAX_LENGTH = 5;
const headerText = document.querySelector('.brand');
const ROUNDS = 6; 

// Assert that the key pressed is a letter
const isLetter = (letter) => {
  return /^[a-zA-Z]$/.test(letter);
}

// Function to hide loading indicator
const setLoading = (isLoading) => {
    // Hide when not loading 
    loadingBar.classList.toggle('hidden', !isLoading);
}

// Function to keep track of numbers 
const mapify = (array) => {
    const object = {}; // Create an empty object
    for (let i = 0; i < array.length; i++) {
        const letter = array[i]; // Get the letter at the current index
        if (object[letter]) {
            object[letter]++ // Increment the value of the letter
        } else {
            object[letter] = 1; 
        }
    }
    return object;
}

// Make init() async in order to do await wherever. 
const init = async () => {
    // Create a buffer to hold the guess letter
    let currentGuess = '';
    let currentRow = 0;
    let isLoading = true;

    // Fetch the word of the day using "res" for response
    const res = await fetch("https://words.dev-apis.com/word-of-the-day");
    const resObj = await res.json(); // JSON object
    const word = resObj.word.toUpperCase(); // Get the word from the JSON object in uppercase format
    const wordParts = word.split("");
    let done = false;
    isLoading = false;
    setLoading(isLoading);

   
    // Add a letter to the word
    const addLetter = (letter) => {
        if (currentGuess.length < MAX_LENGTH) {
            // Append the letter to the current guess World
            currentGuess += letter;
        } else {
            // Replace last letter to whatever is being typed
            currentGuess = currentGuess.substring(0, currentGuess.length - 1) + letter;
        }
        // Add letters to the current row of the DOM element 
        letters[currentRow * MAX_LENGTH + currentGuess.length - 1].innerText = letter;
    }

    let commit = async () => {
        if (currentGuess.length !== MAX_LENGTH) {
            // Do nothing
            return;
        }
        
        // Check win 
        if (currentGuess === word) {
            headerText.innerText = '*** You win! ***'.toUpperCase();
            headerText.classList.add('winner');
            done = true; 
        }

        // Validate word
        isLoading = true;
        setLoading(isLoading);
        // Check to see if the input string is a valid word according to the API
        const res = await fetch("https://words.dev-apis.com/validate-word", {
            method: "POST", // POST request
            body: JSON.stringify({ word: currentGuess }), // Convert to JSON
        });

        const resObj = await res.json(); // JSON object
        const {validWord} = resObj; // Get the word from the JSON object

        isLoading = false;
        setLoading(isLoading);

        if (!validWord) {
            markInvalidWord(); // Alert the user that the word is invalid
            return;
        }

        const guessParts = currentGuess.split("");
        const wordMap = mapify(wordParts);

        // Loop to find the correct letters first
        for (let i = 0; i < MAX_LENGTH; i++) {
            // Mark as correct
            if (guessParts[i] === wordParts[i]) {
                letters[currentRow * MAX_LENGTH + i].classList.add("correct");
                // Decrement number of correct letters to correctly find the number of close or wrong ones 
                wordMap[guessParts[i]]--; 
            }
        }

        // Then loop to find the close and wrong letters after ALL of the correct ones have been found 
        for (let i = 0; i < MAX_LENGTH; i++) {
            if (guessParts[i] === wordParts[i]) {
                // Do nothing, already passed through 
                continue;
            // If there are any letters in the word map but not in the same index, add them here to close
            } else if (wordMap[guessParts[i]] && wordMap[guessParts[i]] > 0) { 
               letters[currentRow * MAX_LENGTH + i].classList.add("close"); 
               wordMap[guessParts[i]]--;
            // Whatever is left is wrong 
            } else {
                letters[currentRow * MAX_LENGTH + i].classList.add("wrong");
            }

        }

        // increment the current row
        currentRow++;
        // Reset current guess to an empty string
        currentGuess = '';
        
        // Check lose 
        if (currentRow === ROUNDS) {
            headerText.innerText = `You Lose! The word was: \n ${word}`.toUpperCase();
            done = true;
            return; 
        }

  
    }

    let backspace = () => {
        currentGuess = currentGuess.substring(0, currentGuess.length - 1);
        letters[currentRow * MAX_LENGTH + currentGuess.length].innerText = "";
    }    

    const markInvalidWord = () => {
    // Mark the current row as invalid 
    for (let i = 0; i < MAX_LENGTH; i++) {
        letters[currentRow * MAX_LENGTH + i].classList.remove("invalid");
        setTimeout(() => {
            letters[currentRow * MAX_LENGTH + i].classList.add("invalid");
        }, 10);
    }
}

    // Event Listener:
    // Name function to help with debugging in a stack trace 
    document.addEventListener('keydown', function handleKeyPress(event) { 
        if (done || isLoading) {
            return;
        }

        const action = event.key;
        // Delegate actions in the event listeners out to other functions being called below
        if (action === 'Enter') {
            commit(); 
        } else if (action === 'Backspace') {
            backspace(); 
        } else if (isLetter(action)) {
            addLetter(action.toUpperCase());
        } else {
            // Do nothing
        }     
    });
}

// Call init() to start the game
init();
