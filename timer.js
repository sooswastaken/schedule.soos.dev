var loading_bar = new Nanobar();
createElements();
FIRST_TIME_LOAD = true;
fetchAndStart();
loading_bar.go(100);


// Functions
function updateDocumentWithNewData(current_period, current_day, time_left) {
    document.getElementById("current_period").innerHTML = (
        current_period
    );
    document.getElementById("current_day").innerHTML = (
        current_day
    );
    document.getElementById("timer-countdown").innerHTML = (
        time_left
    );
}

function setCircleDasharray(timeLeft, timeLimit) {
    const circleDasharray = `${(
        calculateTimeFraction(timeLeft, timeLimit) * 283
    ).toFixed(0)} 283`;
    document
        .getElementById("base-timer-path-remaining")
        .setAttribute("stroke-dasharray", circleDasharray);
}


function titleCase(str) {
    str = str.toLowerCase().split(' ');
    for (let i = 0; i < str.length; i++) {
        str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }
    return str.join(' ');
}

function format_string(string) {
    string = titleCase(string)
    string = string.replace(/_/g," ");
    return string
}

function formatTime(time) {
    const minutes = Math.floor(time / 60);
    let seconds = time % 60;
    if (seconds < 10) {
        seconds = `0${seconds}`;
    }
    return `${minutes}:${seconds}`;
}

function calculateTimeFraction(timeLeft, timeLimit) {
    const rawTimeFraction = timeLeft / timeLimit;
    return rawTimeFraction - (1 / timeLimit) * (1 - rawTimeFraction);
}


function fetchAndStart() {
    fetch("https://period-api.soosbot.com/api")
        .then(response => response.json())
        .then(data => {
            if (FIRST_TIME_LOAD) {
                updateDocumentWithNewData(
                    format_string(data.current_period),
                    format_string(data.day_type),
                    formatTime(data.total_period_left_time_in_seconds)
                )
                console.log("Changing data?")
                FIRST_TIME_LOAD = false;
            }
            startTimer(data);
            if (!FIRST_TIME_LOAD) {
                setTimeout((() => {
                    document.getElementById("current_period").innerHTML = (
                        current_period
                    );
                    document.getElementById("current_day").innerHTML = (
                        current_day
                    );
                }, 1500));
            }
        });
}

function onTimesUp (timerInterval) {
    document.getElementById("timer-countdown").innerHTML = "0:00"
    clearInterval(timerInterval)
    // Wait 2 seconds before fetching new data. This because im lazy to fix the bug with the api..
    setTimeout(fetchAndStart, 2000);
}

function updateTimerColors(secondsLeft, totalTime) {
    let fraction = secondsLeft / totalTime;
    if (fraction < 0.10) {
        // Set the color to red
        document.getElementById("base-timer-path-remaining").style.stroke = "red";
        document.getElementById("base-timer-path-remaining").style.filter = "drop-shadow(0 0 0.75rem rgba(255, 0, 0, 0.336))";
    } else if(fraction < 30 ) {
        // Set the color to orange
        document.getElementById("base-timer-path-remaining").style.stroke = "orange";
        document.getElementById("base-timer-path-remaining").style.filter = "drop-shadow(0 0 0.75rem rgba(255, 166, 0, 0.336))";

    } else {
        // Set the color to green
        document.getElementById("base-timer-path-remaining").style.stroke = "rgb(0, 255, 140)";
        document.getElementById("base-timer-path-remaining").style.filter = "drop-shadow(0 0 0.75rem #00ff8c48)";

    }
}

function startTimer(data) {
    let timeLimit = data.total_period_time_in_seconds;
    let timePassed = data.total_period_time_in_seconds - data.total_period_left_time_in_seconds;
    let timeLeft = timeLimit - timePassed;
    let timerInterval = setInterval(() => {
        timePassed++;
        timeLeft = timeLimit - timePassed;
        document.getElementById("timer-countdown").innerHTML = formatTime(
            timeLeft
        );
        if (timeLeft <= 0) {
            document.getElementById("timer-countdown").innerHTML = "0:00"
            onTimesUp(timerInterval)
        }
        updateTimerColors(timeLeft, timeLimit)
        setCircleDasharray(timeLeft, timeLimit);
    }, 1000)

}

function createElements() {
    document.getElementById("timer").innerHTML = `
        <div class="base-timer">
        <svg class="base-timer-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <g class="base-timer-circle">
            <circle class="base-timer-path-elapsed" cx="50" cy="50" r="45"></circle>
            <path
            id="base-timer-path-remaining"
            stroke-dasharray="283"
            class="base-timer-path-remaining"
            d="
            M 50, 50
            m -45, 0
            a 45,45 0 1,0 90,0
            a 45,45 0 1,0 -90,0
            "
            ></path>
          </g>
        </svg>
        <span id="timer-countdown" class="timer-countdown"></span>
        <h1 id="current_day"></h1>
        <p id="current_period"></p>
        </div>`;
}

