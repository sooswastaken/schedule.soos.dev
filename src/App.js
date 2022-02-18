import { useEffect, useState } from "react"
import TimerSVG from "./components/TimerSVG"
import { AnimatePresence, motion } from "framer-motion";
import Nanobar from "nanobar";


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

function App() {

  const [strokeDashedArrayValue, setStrokeDashedArrayValue] = useState(283);
  const [stingers, setStingers] = useState(null);
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeValue, setTimeValue] = useState(0);
  const nanobar = new Nanobar();
  
  useEffect(() => {
    fetchAndStart();
  }, [])

  function fetchAndStart() {
    fetch("https://period-api.soosbot.com/api")
    .then(response => response.json())
    .then(data => {
      if(data.day_type === "EVEN_DAY") {
        setStingers(data.stingers);
      }

      console.log(data)
      setApiData(data)
      setTimeValue(data.time_left)
      timer(data)

      setLoading(false);
      nanobar.go(100)
     })
  }

  function timer(data) {
    let timeLimit = data.total_time;
    let timePassed = data.total_time - data.time_left;
    let timeLeft = timeLimit - timePassed;
    let timerInterval = setInterval(() => {
        timePassed++;
        timeLeft = timeLimit - timePassed;
        setTimeValue(timeLeft)
        if (timeLeft <= 0) {
            document.getElementById("timer-countdown").innerHTML = "0:00"
            // onTimesUp(timerInterval)
        }
        // updateTimerColors(timeLeft, timeLimit)
        // setCircleDasharray(timeLeft, timeLimit);
    }, 1000)
  }



  return (

    
    !(loading) && (
      <AnimatePresence>
        <motion.div
          initial= {{opacity: 0}}
          animate= {{opacity: 1}}
          exit= {{opacity: 0}}
          transition={{duration: 0.4}}>
      <div className="timer">
      <div className="base-timer">
        <TimerSVG strokeDashedArrayValue={strokeDashedArrayValue}/>
        <span id="timer-countdown" className="timer-countdown">{formatTime(timeValue)}</span>
        <h1 id="current_day">{format_string(apiData.day_type)}</h1>
        <p id="current_period">{format_string(apiData.period_type)}</p>
      </div>
    </div>
    </motion.div>
    </AnimatePresence>
    )
  );
}


export default App;
