function TimerSVG( {strokeDashedArrayValue, svgStyle} ) {
    return (
        <svg className="base-timer-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <g className="base-timer-circle">
          <circle className="base-timer-path-elapsed" cx="50" cy="50" r="45"></circle>
          <path
          id="base-timer-path-remaining"
          strokeDasharray={strokeDashedArrayValue}
          className="base-timer-path-remaining"
          style={svgStyle}
          d="
          M 50, 50
          m -45, 0
          a 45,45 0 1,0 90,0
          a 45,45 0 1,0 -90,0
          "
          ></path>
        </g>
      </svg>
    );
}

export default TimerSVG;