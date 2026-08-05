import { ENDING_STRING, LOOPING_STRING } from "@/lib/constants";
import { formatTime } from "@/lib/format";

type Props = {
  remaining: number;
  countingUp: boolean;
  timerMs: number;
};

export function Timer({ remaining, countingUp, timerMs }: Props) {
  return (
    <div className="timer">
      <div className="timer__label">{countingUp || remaining <= 0 ? ENDING_STRING : LOOPING_STRING}</div>
      <div className="timer__value">{formatTime(timerMs)}</div>
    </div>
  );
}
