import { useEffect, useState } from "react";

function App() {

  const [strokeDashedArrayValue, setStrokeDashedArrayValue] = useState(283);
  const [stingers, setStingers] = useState(null);
  
  useEffect(() => {
    fetchAndStart();
  }, [])

  function fetchAndStart() {
    fetch("https://period-api.soosbot.com/api")
    .then(response => response.json())
    .then(data => {
      if(data.day_type == "EVEN_DAY") {
        setStingers(data.stingers)
      }
     })
  }

  function timer(data) {
    let timeLimit = data.total_time;
    let timePassed = data.total_time - data.time_left;
    let timeLeft = timeLimit - timePassed;
    let timerInterval = setInterval(() => {
        timePassed++;
        timeLeft = timeLimit - timePassed;
        // Update document here
        if (timeLeft <= 0) {
            document.getElementById("timer-countdown").innerHTML = "0:00"
            // onTimesUp(timerInterval)
        }
        // updateTimerColors(timeLeft, timeLimit)
        // setCircleDasharray(timeLeft, timeLimit);
    }, 1000)
  }



  return (
    <>
    <div className="timer">
      <div className="base-timer">
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
      </div>
    </div>
    </>
  );
}


export default App;
