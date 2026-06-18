"use client";

import { getLunarPhase } from "@/lib/cycle/lunar";
import { detectPhase } from "@/lib/cycle/phases";

interface LunarCalendarProps {
  startDate: Date;
  cycleDay: number;
}

export default function LunarCalendar({ startDate, cycleDay }: LunarCalendarProps) {
  const days = Array.from({ length: 28 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dayNum = i + 1;
    const isToday = dayNum === cycleDay;
    const lunar = getLunarPhase(date);
    const cyclePhase = detectPhase(dayNum, 28);

    return {
      dayNum,
      date,
      isToday,
      lunar,
      cyclePhase,
    };
  });

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/8 rounded-2xl p-6">
      <h3 className="text-lg font-cormorant font-semibold text-kaia-moon mb-4">
        Calendrier lunaire & cycle
      </h3>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <div
            key={day.dayNum}
            className={`
              aspect-square rounded-xl flex flex-col items-center justify-center gap-1
              transition-all duration-300 relative
              ${
                day.isToday
                  ? "bg-kaia-moon/10 ring-2 ring-kaia-moon shadow-[0_0_20px_rgba(200,185,240,0.3)]"
                  : "bg-white/5 hover:bg-white/10"
              }
            `}
          >
            {/* Lunar emoji */}
            <span className="text-lg">{day.lunar.emoji}</span>

            {/* Day number */}
            <span
              className={`text-xs ${
                day.isToday ? "text-kaia-moon font-semibold" : "text-white/60"
              }`}
            >
              J{day.dayNum}
            </span>

            {/* Phase color dot */}
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: day.cyclePhase.color }}
            />
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#E87A7A]" />
          <span className="text-white/60">Menstruation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#7AE8A0]" />
          <span className="text-white/60">Folliculaire</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#E8C87A]" />
          <span className="text-white/60">Ovulation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#C8B9F0]" />
          <span className="text-white/60">Lutéale</span>
        </div>
      </div>
    </div>
  );
}
