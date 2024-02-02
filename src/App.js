import { useEffect, useRef, useState } from "react";
import TimerSVG from "./components/TimerSVG";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@material-ui/core";
import refresh_icon from "./icons/refresh.svg";
import Nanobar from "nanobar";
import Schedule from "./schedule.png";

function urlB64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  console.log("base64", base64);
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function titleCase(str) {
  str = str.toLowerCase().split(" ");
  for (let i = 0; i < str.length; i++) {
    str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
  }
  return str.join(" ");
}

function format_string(string) {
  string = titleCase(string);
  string = string.replace(/_/g, " ");

  // replace Ta with TA
  string = string.replace("Ta", "TA");
  return string;
}

function formatTime(time) {
  let hours = Math.floor(time / 3600);
  time %= 3600;
  let minutes = Math.floor(time / 60);
  let seconds = time % 60;
  if (seconds < 10) seconds = `0${seconds}`;
  if (minutes < 10) minutes = `0${minutes}`;

  if (hours === 0) {
    return `${minutes}:${seconds}`;
  } else return `${hours}:${minutes}:${seconds}`;
}

const API_URL = "https://api.soos.dev/hhs/calendar";

function App() {
  const [strokeDashedArrayValue, setStrokeDashedArrayValue] = useState(283);
  const [stingers, setStingers] = useState(null);
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeValue, setTimeValue] = useState(0);
  const [svgStyle, setSvgStyle] = useState({
    stroke: "drop-shadow(0 0 0.75rem #00ff8c6b)",
    filter: "drop-shadow(0 0 0.75rem #00ff8c6b)",
  });
  const timerInterval = useRef(null);
  const [noSchool, setNoSchool] = useState(false);
  const [noSchoolReason, setNoSchoolReason] = useState(null);
  const [apiError, setApiError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshButtonIconAngle, setRefreshButtonIconAngle] = useState(0);
  const [ratelimited, setRatelimited] = useState(false);
  const [ratelimitedCountDown, setRatelimitedCountDown] = useState("?");
  const [currentTime, setCurrentTime] = useState(0);

  const [swRegistration, setSwRegistration] = useState(null);

  const toggleNotficationButton = useRef();
  const [toogleNotficationButtonText, setToogleNotficationButtonText] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const BLACK_DAY_TWO_HOURS_EARLY = false;

  const loading_bar = useRef();

  function updateSubscriptionOnServer(subscription, state) {
    console.log("REMOVING FROM DATABASE")
    console.log("subscription", JSON.stringify({ 'sub_token': subscription }));

    fetch(API_URL + '/subscription/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({ 'sub_token': subscription, "state": state})
    })
}

  function subscribeUser() {
    const applicationServerPublicKey = localStorage.getItem(
      "applicationServerPublicKey"
    );
    const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
    swRegistration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      })
      .then(function (subscription) {
        console.log("User is subscribed.");

        updateSubscriptionOnServer(subscription, true);
        console.log("subscription", subscription);
        localStorage.setItem("sub_token", JSON.stringify(subscription));
        setIsSubscribed(true);

        updateBtn(true);  
      })
      .catch(function (err) {
        console.log("Failed to subscribe the user: ", err);
        updateBtn(false);
      });
  }

  function updateBtn(state) {
    if (Notification.permission === "denied") {
      setToogleNotficationButtonText("Push Messaging Blocked");
      toggleNotficationButton.current.disabled = true;
      // updateSubscriptionOnServer(null);
      return;
    }

    if (state) {
      setToogleNotficationButtonText("Disable Notifications");
    } else {
      console.log("Setting to enable");
      setToogleNotficationButtonText("Enable Notifications");
    }

    toggleNotficationButton.current.disabled = false;
  }

  function unsubscribeUser() {
    swRegistration.pushManager
      .getSubscription()
      .then(function (subscription) {
        if (subscription) {
          updateSubscriptionOnServer(subscription, false);
          return subscription.unsubscribe();
        }
      })
      .catch(function (error) {
        console.log("Error unsubscribing", error);
      })
      .then(function () {
        console.log("User is unsubscribed.");
        setIsSubscribed(false);

        updateBtn(false); 
      });
  }

  useEffect(() => {
    fetch(
      API_URL + "/subscription/"
    )
      .then((response) => response.json())
      .then((data) => {
        localStorage.setItem("applicationServerPublicKey", data["public_key"]);
      })
      .catch((error) => console.error("Error:", error));

    if ("serviceWorker" in navigator && "PushManager" in window) {
      console.log("Service Worker and Push is supported");
      navigator.serviceWorker
        .register("sw.js")
        .then(function (swReg) {
          console.log("Service Worker is registered", swReg);
          setSwRegistration(swReg);
          swReg.pushManager.getSubscription()
          .then(function(subscription) {
            console.log("Bruh", subscription);
            updateBtn(!(subscription === null));
            setIsSubscribed(!(subscription === null));
      });
        })
        .catch(function (error) {
          console.error("Service Worker Error", error);
        });
    } else {
      console.warn("Push meapplicationServerPublicKeyssaging is not supported");
      // make button display none
      toggleNotficationButton.current.style.display = "none";
      setToogleNotficationButtonText("Notifications Not Supported");
    }

    console.log("CALLING FETCH AND sTART")
    fetchAndStart();
    loading_bar.current = new Nanobar();
  }, []);

  function ordinal(n) {
    var s = ["th", "st", "nd", "rd"];
    var v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? "0" + minutes : minutes;
    var strTime = hours + ":" + minutes + " " + ampm;
    return strTime;
  }

  function timeConverter(date) {
    // if invalid date, return empty string
    if (isNaN(date.getTime())) {
      return "";
    }
    var months = [
      "January",
      "Febuary",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    var month = months[date.getMonth()];
    var day = date.getDate();
    return `${month} ${ordinal(day)} ${formatAMPM(date)}`;
  }

  function setCircleDasharray(timeLeft, timeLimit) {
    setStrokeDashedArrayValue(`${(timeLeft / timeLimit) * 283} 283`);
  }

  function fetchAndStart() {
    // add elapsed time to the fetch request and console.log it
    let elapsedTime = Date.now();
    fetch(API_URL + "/get-period-info")
      .then((response) => response.json())
      .then((data) => {
        if (data.success === false) {
          setRatelimited(true);
          setLoading(false);
          let counter = Math.round(data.retryAfter);
          setInterval(() => {
            setRatelimitedCountDown(counter);
            counter--;
            if (counter < 0) {
              window.location.reload();
            }
          }, 1000);
          return;
        }

        if (data.no_school) {
          setNoSchool(true);
          setNoSchoolReason(data.message);
          setApiError(false);
          setLoading(false);
          setRefreshing(false);
          return;
        }
        if (data.day_type === "BLACK_DAY") {
          setStingers(data.stingers);
        }

        setApiData(data);
        setTimeValue(data.time_left);
        timer(data);

        setCurrentTime(new Date(data.now));

        setApiError(false);
        setLoading(false);
        setRefreshing(false);

        let timeTaken = Date.now() - elapsedTime;
        console.log("Time taken to fetch data: " + timeTaken + "ms");
      })
      .catch((error) => {
        setApiError(true);
        setLoading(false);
      });
  }

  function timer(data) {
    // Parse the next period start time as a Date object.
    let nextPeriodStartTime = new Date(data.next_period_start_time);

    // Set up the interval for the timer.
    timerInterval.current = setInterval(() => {
      // Get the current time.
      let currentDate = new Date();

      // Add 48 hours to the current date
      // currentDate.setTime(currentDate.getTime() + 49 * 60 * 60 * 1000); // 48 hours in milliseconds

      // Calculate the time left in milliseconds.
      let timeLeft = nextPeriodStartTime - currentDate;

      // Convert timeLeft to seconds (from milliseconds).
      timeLeft = Math.round(timeLeft / 1000);

      // Update the current time and time left.
      setCurrentTime(currentDate);
      setTimeValue(Math.max(timeLeft, 0)); // Ensure timeLeft is not negative.
      document.title =
        format_string(data.period_type) + " ends in " + formatTime(timeLeft);

      // Check if the timer should stop.
      if (timeLeft <= 0) {
        setTimeValue(0);
        onTimesUp();
        clearInterval(timerInterval.current); // Clear the interval to stop the timer.
      }

      // Update timer colors and circle dash array.
      updateTimerColors(timeLeft, data.total_time);
      setCircleDasharray(timeLeft, data.total_time);
    }, 1000);
  }

  function onTimesUp() {
    setTimeValue(0);
    clearInterval(timerInterval.current);
    // Wait 2 seconds before fetching new data. This because im lazy to fix the bug with the api..
    console.log("Times up");
    setTimeout(fetchAndStart, 2000);
  }

  function updateTimerColors(secondsLeft, totalTime) {
    let fraction = secondsLeft / totalTime;
    if (fraction < 0.1) {
      // Set the color to red
      setSvgStyle({
        stroke: "red",
        filter: "drop-shadow(0 0 0.75rem rgba(255, 0, 0, 0.336))",
      });
    } else if (fraction < 0.3) {
      // Set the color to orange
      setSvgStyle({
        stroke: "orange",
        filter: "drop-shadow(0 0 0.75rem rgba(255, 166, 0, 0.336))",
      });
    } else {
      // Set the color to green
      setSvgStyle({
        stroke: "rgb(0, 255, 140)",
        filter: "drop-shadow(0 0 0.75rem #00ff8c6b)",
      });
    }
  }

  if (BLACK_DAY_TWO_HOURS_EARLY) {
    return <img src={Schedule} alt="Schedule" />;
  }

  return (
    <>
      <AnimatePresence>
        {!loading &&
          !apiError &&
          !refreshing &&
          !ratelimited &&
          currentTime &&
          currentTime !== 0 && (
            <motion.div
              className="timestamp"
              key={"something"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {timeConverter(currentTime)}
            </motion.div>
          )}

        {loading && (
          <motion.div
            className="loading"
            key={"something"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="lds-spinner">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </motion.div>
        )}

        {noSchool && (
          <motion.div
            key="no-school"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h3 className="no-school">{noSchoolReason}</h3>
          </motion.div>
        )}

        {ratelimited && (
          <motion.div
            className="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Please stop spamming requests. You will be unblocked in{" "}
            {ratelimitedCountDown === 1
              ? "a second"
              : ratelimitedCountDown + " seconds"}
            .
          </motion.div>
        )}

        {apiError && (
          <motion.div
            className="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Sorry, the server might be offline or there is no network
            connection. Please refresh in a few moments.
          </motion.div>
        )}

        {!loading && !noSchool && !apiError && !refreshing && !ratelimited && (
          <motion.div
            id="timer"
            key={"somethingelse"}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="base-timer">
              <TimerSVG
                strokeDashedArrayValue={strokeDashedArrayValue}
                svgStyle={svgStyle}
              />
              <span id="timer-countdown" className="timer-countdown">
                {formatTime(timeValue)}
              </span>
              <h1 id="current_day">{format_string(apiData.day_type)}</h1>
              <p id="current_period">{format_string(apiData.period_type)}</p>
            </div>
          </motion.div>
        )}

        {stingers && (
          <motion.div
            id="stingers"
            className="stingers"
            key={"anotherthing"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h3>Today's Stingers</h3>
            <p id="stinger_one">{format_string(stingers.one)}</p>
            <p id="stinger_two">{format_string(stingers.two)}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="outOfSync"
        animate={{ opacity: ratelimited ? 0.2 : 1 }}
      >
        <Button
          size="small"
          onClick={() => {
            clearInterval(timerInterval.current);
            fetchAndStart();
            loading_bar.current.go(100);
            setApiData(null);
            setNoSchool(false);
            setStingers(null);
            setRatelimited(null);
            if (!refreshing) {
              setRefreshButtonIconAngle(refreshButtonIconAngle + 360);
            }
            setRefreshing(true);
          }}
        >
          <motion.img
            src={refresh_icon}
            alt="?"
            animate={{ rotate: `${refreshButtonIconAngle}deg` }}
            transition={{ type: "spring", duration: 0.8 }}
          />
          Refresh
        </Button>
      </motion.div>

      <motion.div className="toggle-notifications">
        <Button
          size="small"
          className="toggle-notifications-button"
          onClick={() => {
            toggleNotficationButton.current.disabled = true;

            if (isSubscribed) {
              
                unsubscribeUser();
            } else {
              console.log("subscribing");
                subscribeUser();
            }
          }}
          ref={toggleNotficationButton}
        >
        {toogleNotficationButtonText}
        </Button>
      </motion.div>
    </>
  );
}

export default App;
