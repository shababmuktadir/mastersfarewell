import React, { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";

export default function CountdownTimer({ targetDate }) {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      expired: false,
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const boxes = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 text-white shadow-lg animate-pulse-glow">
      <div className="flex items-center justify-center gap-2 mb-4">
        <CalendarClock className="w-6 h-6" />
        <h3 className="text-lg font-bold tracking-wide uppercase">
          {timeLeft.expired ? "Farewell Day Has Arrived!" : "Countdown to Farewell Day"}
        </h3>
      </div>

      {!timeLeft.expired ? (
        <div className="grid grid-cols-4 gap-3 text-center">
          {boxes.map((b) => (
            <div
              key={b.label}
              className="bg-white/15 backdrop-blur-md rounded-xl py-3 px-2 border border-white/20 transition-transform duration-300 hover:scale-105"
            >
              <div className="text-2xl sm:text-4xl font-extrabold tabular-nums">
                {String(b.value).padStart(2, "0")}
              </div>
              <div className="text-xs sm:text-sm uppercase tracking-wider text-indigo-100 mt-1">
                {b.label}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-indigo-100 font-medium">
          Wishing you a memorable Masters Farewell!
        </p>
      )}

      {targetDate && (
        <p className="text-center text-xs text-indigo-100 mt-4">
          Event Date: {new Date(targetDate).toLocaleString("en-US", {
            dateStyle: "full",
            timeStyle: "short",
          })}
        </p>
      )}
    </div>
  );
}
