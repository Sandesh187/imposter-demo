import { useEffect, useState } from "react";

export function useCountdown(timer) {
  const [seconds, setSeconds] = useState(timer?.duration || 0);

  useEffect(() => {
    if (!timer?.endsAt) {
      setSeconds(0);
      return undefined;
    }

    function tick() {
      setSeconds(Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000)));
    }

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [timer?.endsAt, timer?.duration]);

  return seconds;
}
