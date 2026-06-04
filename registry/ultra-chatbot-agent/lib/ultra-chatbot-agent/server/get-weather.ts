import { tool } from "ai";
import { z } from "zod";

const weatherInputSchema = z
  .object({
    city: z.string().trim().min(1).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  })
  .refine(
    (input) =>
      Boolean(input.city) ||
      (typeof input.latitude === "number" &&
        typeof input.longitude === "number"),
    {
      message:
        "Provide either a city name or both latitude and longitude coordinates.",
    }
  );

interface UltraChatbotAgentWeatherResult {
  cityName?: string;
  current: {
    interval: number;
    temperature_2m: number;
    time: string;
  };
  current_units: {
    interval: string;
    temperature_2m: string;
    time: string;
  };
  daily: {
    sunrise: string[];
    sunset: string[];
    time: string[];
  };
  daily_units: {
    sunrise: string;
    sunset: string;
    time: string;
  };
  elevation: number;
  generationtime_ms: number;
  hourly: {
    temperature_2m: number[];
    time: string[];
  };
  hourly_units: {
    temperature_2m: string;
    time: string;
  };
  latitude: number;
  longitude: number;
  timezone: string;
  timezone_abbreviation: string;
  utc_offset_seconds: number;
}

async function geocodeCity(city: string) {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      city
    )}&count=1&language=en&format=json`
  );

  if (!response.ok) {
    throw new Error(`Failed to geocode "${city}".`);
  }

  const data = (await response.json()) as {
    results?: Array<{
      latitude: number;
      longitude: number;
    }>;
  };

  const result = data.results?.[0];

  if (!result) {
    return null;
  }

  return {
    latitude: result.latitude,
    longitude: result.longitude,
  };
}

async function loadWeather(input: { latitude: number; longitude: number }) {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${input.latitude}&longitude=${input.longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`
  );

  if (!response.ok) {
    throw new Error("Failed to load the current weather.");
  }

  return (await response.json()) as UltraChatbotAgentWeatherResult;
}

export function createUltraChatbotAgentGetWeatherTool() {
  return tool({
    description:
      "Get the current weather for a city or set of coordinates. Use this when the user explicitly asks for the weather.",
    inputSchema: weatherInputSchema,
    execute: async ({ city, latitude, longitude }) => {
      let resolvedLatitude = latitude;
      let resolvedLongitude = longitude;

      if (city) {
        const coordinates = await geocodeCity(city);

        if (!coordinates) {
          return {
            error: `Could not find coordinates for "${city}".`,
          };
        }

        resolvedLatitude = coordinates.latitude;
        resolvedLongitude = coordinates.longitude;
      }

      if (
        typeof resolvedLatitude !== "number" ||
        typeof resolvedLongitude !== "number"
      ) {
        return {
          error:
            "Provide either a city name or both latitude and longitude coordinates.",
        };
      }

      const weather = await loadWeather({
        latitude: resolvedLatitude,
        longitude: resolvedLongitude,
      });

      if (city) {
        weather.cityName = city;
      }

      return weather;
    },
  });
}
