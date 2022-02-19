import { useEffect, useRef, useState } from "react"
import TimerSVG from "./components/TimerSVG"
import { AnimatePresence, motion } from "framer-motion";


function titleCase(str) {
  str = str.toLowerCase().split(' ');
  for (let i = 0; i < str.length; i++) {
    str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
  }
  return str.join(' ');
}

function format_string(string) {
  string = titleCase(string)
  string = string.replace(/_/g, " ");
  return string
}

function formatTime(time) {
  console.log("s")
  let hours = Math.floor(time / 3600);
  time %= 3600;
  let minutes = Math.floor(time / 60);
  let seconds = time % 60;
  if(hours === 0) {
    return `${minutes}:${seconds}`;
  } else
  return `${hours}:${minutes}:${seconds}`;
}

function App() {

  const [strokeDashedArrayValue, setStrokeDashedArrayValue] = useState(283);
  const [stingers, setStingers] = useState(null);
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeValue, setTimeValue] = useState(0);
  const [svgStyle, setSvgStyle] = useState({ stroke: "drop-shadow(0 0 0.75rem #00ff8c6b)", filter: "drop-shadow(0 0 0.75rem #00ff8c6b)" })
  const [outOfSync, setOutOfSync] = useState(true);
  const timerInterval = useRef(null);
  const [checkOutOfSyncCountDown, setCheckOutOfSyncCountDown] = useState(10);

  useEffect(() => {
    fetchAndStart();
  }, [])



  function checkIfOutOfSync() {
    fetch("https://period-api.soosbot.com/api")
    .then(response => response.json())
    .then(data => {
      console.log("CLIENT VALUE :" + timeValue)
      console.log("SERVER VALUE: " + data.time_left)
    })
  }

  function setCircleDasharray(timeLeft, timeLimit) {
    setStrokeDashedArrayValue(`${((timeLeft / timeLimit) * 283)} 283`)
  }

  function fetchAndStart() {
    fetch("https://period-api.soosbot.com/api")
      .then(response => response.json())
      .then(data => {
        if (data.day_type === "BLACK_DAY") {
            setStingers(data.stingers)
        }

        setApiData(data)
        setTimeValue(data.time_left)
        timer(data)

        setLoading(false);
      })
  }

  function timer(data) {
    let timeLimit = data.total_time;
    let timePassed = data.total_time - data.time_left;
    let timeLeft = timeLimit - timePassed;
     timerInterval.current = setInterval(() => {
      timePassed++;
      timeLeft = timeLimit - timePassed;

      setTimeValue(timeLeft)
      if (timeLeft <= 0) {
        setTimeValue(0)
        onTimesUp()
      }
      updateTimerColors(timeLeft, timeLimit)
      setCircleDasharray(timeLeft, timeLimit);
    }, 1000)
  }

  function onTimesUp() {
    setTimeValue(0)
    clearInterval(timerInterval.current)
    // Wait 2 seconds before fetching new data. This because im lazy to fix the bug with the api..
    setTimeout(fetchAndStart, 1000);
  }

  function updateTimerColors(secondsLeft, totalTime) {
    let fraction = secondsLeft / totalTime;
    if (fraction < 0.10) {
      // Set the color to red
      setSvgStyle({ stroke: "red", filter: "drop-shadow(0 0 0.75rem rgba(255, 0, 0, 0.336))" })
    } else if (fraction < 0.30) {
      // Set the color to orange
      setSvgStyle({ stroke: "orange", filter: "drop-shadow(0 0 0.75rem rgba(255, 166, 0, 0.336))" })

    } else {
      // Set the color to green
      setSvgStyle({ stroke: "rgb(0, 255, 140)", filter: "drop-shadow(0 0 0.75rem #00ff8c6b)" })

    }
  }



  return (
    <>
      <AnimatePresence>

        {
          loading && (
            <motion.div className="loading" key={"something"}
            initial={{ opacity: 0,}}
            animate={{ opacity: 1}}
            exit={{ opacity: 0 }}>
              <div className="lds-spinner"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
            </motion.div>
          )
        }


        {!(loading) && (
          <motion.div id="timer" key={"somethingelse"}
            initial={{ opacity: 0,}}
            animate={{ opacity: 1}}
            exit={{ opacity: 0 }}>
            <div className="base-timer">
              <TimerSVG strokeDashedArrayValue={strokeDashedArrayValue} svgStyle={svgStyle} />
              <span id="timer-countdown" className="timer-countdown">{formatTime(timeValue)}</span>
              <h1 id="current_day">{format_string(apiData.day_type)}</h1>
              <p id="current_period">{format_string(apiData.period_type)}</p>
            </div>
          </motion.div>
        )}

        {stingers && (
          <motion.div id="stingers" className="stingers" key={"anotherthing"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}>
            <h3>Today's Stingers</h3>
            <p id="stinger_one">{format_string(stingers.one)}</p>
            <p id="stinger_two">{format_string(stingers.two)}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {
        outOfSync && (
          <motion.div className="outOfSync">
            <button onClick={() => {
              clearInterval(timerInterval.current)
              fetchAndStart()
            }} >Refresh</button>
          </motion.div>
        )
      }
    </>

  );


}


export default App;
