"use client";

import { Badge } from "@workspace/ui/components/badge";

export interface UltraChatbotAgentWeatherData {
  cityName?: string;
  current: {
    temperature_2m: number;
    time: string;
  };
  current_units: {
    temperature_2m: string;
  };
  daily: {
    sunrise: string[];
    sunset: string[];
  };
  timezone?: string;
}

function formatWeatherTime(value: string | undefined) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function UltraChatbotAgentWeather({
  weather,
}: {
  weather: UltraChatbotAgentWeatherData;
}) {
  return (
    <div className="w-full max-w-sm space-y-3 border border-foreground/10 bg-background px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-sm">
            {weather.cityName ?? "Current weather"}
          </p>
          <p className="mt-1 text-2xl">
            {weather.current.temperature_2m}
            {weather.current_units.temperature_2m}
          </p>
        </div>
        {weather.timezone ? (
          <Badge variant="outline">{weather.timezone}</Badge>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="border border-foreground/10 px-3 py-2">
          <p className="text-muted-foreground">Sunrise</p>
          <p className="mt-1">{formatWeatherTime(weather.daily.sunrise[0])}</p>
        </div>
        <div className="border border-foreground/10 px-3 py-2">
          <p className="text-muted-foreground">Sunset</p>
          <p className="mt-1">{formatWeatherTime(weather.daily.sunset[0])}</p>
        </div>
      </div>
    </div>
  );
}
