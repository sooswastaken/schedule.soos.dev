import { useEffect, useRef, useState } from "react"
import TimerSVG from "./components/TimerSVG"
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@material-ui/core";
import refresh_icon from "./icons/refresh.svg"
import Nanobar from "nanobar";
import Schedule from "./schedule.png"

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
  let hours = Math.floor(time / 3600);
  time %= 3600;
  let minutes = Math.floor(time / 60);
  let seconds = time % 60;
  if (seconds < 10) seconds = `0${seconds}`
  if (minutes < 10) minutes = `0${minutes}`

  if (hours === 0) {
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
  const timerInterval = useRef(null);
  const [noSchool, setNoSchool] = useState(false)
  const [noSchoolReason, setNoSchoolReason] = useState(null)
  const [apiError, setApiError] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshButtonIconAngle, setRefreshButtonIconAngle] = useState(0);
  const [ratelimited, setRatelimited] = useState(false);
  const [ratelimitedCountDown, setRatelimitedCountDown] = useState("?");
  const [currentTime, setCurrentTime] = useState(0);

  const BLACK_DAY_TWO_HOURS_EARLY = false;

  const loading_bar = useRef();

  useEffect(() => {
    fetchAndStart();
    loading_bar.current = new Nanobar();
  }, [])


  function ordinal(n) {
    var s = ["th", "st", "nd", "rd"];
    var v = n%100;
    return n + (s[(v-20)%10] || s[v] || s[0]);
  }
  


  function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
  }

  function timeConverter(date){
    if(date === 0) return ""
    var months = ['January','Febuary','March','April','May','June','July','August','September','October','November','December'];
    var month = months[date.getMonth()];
    var day = date.getDate();
    return `${month} ${ordinal(day)} ${formatAMPM(date)}`;
  }




  function setCircleDasharray(timeLeft, timeLimit) {
    setStrokeDashedArrayValue(`${((timeLeft / timeLimit) * 283)} 283`)
  }

  function fetchAndStart() {
    fetch("http://api.soos.dev/hhs/calendar/get-period-info", {referrerPolicy: 'no-referrer'})
      .then(response => response.json())
      .then(data => {
        if (data.success === false) {
          setRatelimited(true)
          setLoading(false)
          let counter = Math.round(data.retryAfter)
          setInterval(() => {
            setRatelimitedCountDown(counter)
            counter--;
            if(counter < 0) {
              window.location.reload();
            }
          }, 1000)
          return 
        }

        if (data.no_school) {
          setNoSchool(true)
          setNoSchoolReason(data.message)
          setApiError(false)
          setLoading(false);
          setRefreshing(false)
          return
        }
        if (data.day_type === "BLACK_DAY") {
          setStingers(data.stingers)
        }

        setApiData(data)
        setTimeValue(data.time_left)
        timer(data)


        setApiError(false)
        setLoading(false);
        setRefreshing(false);

      })
      .catch((error) => {
        setApiError(true)
        setLoading(false)
      });
  }

  function timer(data) {
    let timeLimit = data.total_time;
    let timePassed = data.total_time - data.time_left;
    let timeLeft = timeLimit - timePassed;
    let currentDate = new Date(data.now);
    timerInterval.current = setInterval(() => {
      timePassed++;
      currentDate = new Date(currentDate.getTime() + 1000);
      timeLeft = timeLimit - timePassed;
      setCurrentTime(currentDate)
      setTimeValue(timeLeft)
      document.title = format_string(data.period_type) + " ends in " + formatTime(timeLeft);

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
    setTimeout(fetchAndStart, 2000);
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

  if(BLACK_DAY_TWO_HOURS_EARLY) {
    return <img src={Schedule}/>
  }




  return (
    <>
      <AnimatePresence>



      {
          (!(loading) && !(apiError) && (!refreshing) && (!ratelimited) && currentTime) && (
            <motion.div className="timestamp" key={"something"}
              initial={{ opacity: 0, }}
              animate={{ opacity: 1 }}>
                {timeConverter(currentTime)}
            </motion.div>
          )
        }

        {
          loading && (
            <motion.div className="loading" key={"something"}
              initial={{ opacity: 0, }}
              animate={{ opacity: 1 }}>
              <div className="lds-spinner"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
            </motion.div>
          )
        }

        {
          noSchool && (
            <motion.div key="weekend"
              initial={{ opacity: 0, }}
              animate={{ opacity: 1 }}>
              <h3 className="weekend">{noSchoolReason}</h3>
            </motion.div>
          )
        }

        {
          ratelimited && (
            <motion.div className="error"
              initial={{ opacity: 0, }}
              animate={{ opacity: 1 }}>
              Please stop spamming requests. You will be unblocked in {ratelimitedCountDown === 1 ? "a second"  : ratelimitedCountDown + " seconds"}.
            </motion.div>
          )
        }


        {
          apiError && (
            <motion.div className="error"
              initial={{ opacity: 0, }}
              animate={{ opacity: 1 }}>
              Sorry, the server might be offline or there is no network connection. Please refresh in a few moments.
            </motion.div>
          )
        }


        {(!(loading) && !(noSchool) && !(apiError) && (!refreshing) && (!ratelimited)) && (
          <motion.div id="timer" key={"somethingelse"}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}>
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
            animate={{ opacity: 1 }}>
            <h3>Today's Stingers</h3>
            <p id="stinger_one">{format_string(stingers.one)}</p>
            <p id="stinger_two">{format_string(stingers.two)}</p>
          </motion.div>
        )}
      </AnimatePresence>

          <motion.div className="outOfSync"
          animate={{opacity: ratelimited ? 0.2 : 1}}
          >
            <Button size="small" onClick={() => {
              clearInterval(timerInterval.current)
              fetchAndStart()
              loading_bar.current.go(100)
              setApiData(null)
              setNoSchool(false)
              setStingers(null)
              setRatelimited(null)
              if (!refreshing) {
                setRefreshButtonIconAngle(refreshButtonIconAngle + 360)
              }
              setRefreshing(true)
            }} >
              <motion.img src={refresh_icon} alt="?" animate={{ rotate: `${refreshButtonIconAngle}deg`,}}
                transition={{ type: "spring", duration: 0.8 }} />
              Refresh
            </Button>
          </motion.div>
    </>

  );


}


export default App;
