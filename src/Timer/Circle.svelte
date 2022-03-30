<script>
    export let strokeDasharray;
    export let currentColor;
	
    $: color = currentColor; 
    $: shadow = getShadow(currentColor);
    function getShadow(string) {
					switch(expression) {
							case x:
									// code block
									break;
							case y:
									// code block
									break;
							default:
									// code block
					}
									}
</script>


<svg class="timer-circle" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g class="base-timer-circle">
      <circle class="base-timer-path-elapsed" cx="50" cy="50" r="45"></circle>
      <path
      id="base-timer-path-remaining"
      stroke-dasharray="{strokeDasharray}"
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

{strokeDasharray}


<style></style>