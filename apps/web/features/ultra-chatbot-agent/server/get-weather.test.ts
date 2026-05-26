import { beforeEach, describe, expect, it, vi } from "vitest";

function importGetWeatherModule() {
  return import("./get-weather");
}

describe("ultra chatbot agent get weather tool", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("geocodes a city and returns the weather payload", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        json: async () => ({
          results: [{ latitude: 37.7749, longitude: -122.4194 }],
        }),
        ok: true,
      } as Response)
      .mockResolvedValueOnce({
        json: async () => ({
          current: {
            interval: 900,
            temperature_2m: 18.5,
            time: "2026-05-25T18:00",
          },
          current_units: {
            interval: "seconds",
            temperature_2m: "°C",
            time: "iso8601",
          },
          daily: {
            sunrise: ["2026-05-25T05:57"],
            sunset: ["2026-05-25T20:13"],
            time: ["2026-05-25"],
          },
          daily_units: {
            sunrise: "iso8601",
            sunset: "iso8601",
            time: "iso8601",
          },
          elevation: 15,
          generationtime_ms: 1,
          hourly: {
            temperature_2m: [18.5, 18.1],
            time: ["2026-05-25T18:00", "2026-05-25T19:00"],
          },
          hourly_units: {
            temperature_2m: "°C",
            time: "iso8601",
          },
          latitude: 37.7749,
          longitude: -122.4194,
          timezone: "America/Los_Angeles",
          timezone_abbreviation: "PDT",
          utc_offset_seconds: -25200,
        }),
        ok: true,
      } as Response);

    const { createUltraChatbotAgentGetWeatherTool } =
      await importGetWeatherModule();

    const tool = createUltraChatbotAgentGetWeatherTool();
    const result = await tool.execute?.(
      {
        city: "San Francisco",
      },
      {} as never
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("geocoding-api.open-meteo.com")
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("api.open-meteo.com")
    );
    expect(result).toEqual(
      expect.objectContaining({
        cityName: "San Francisco",
        current: expect.objectContaining({
          temperature_2m: 18.5,
        }),
      })
    );
  });

  it("returns a concrete error when the city cannot be resolved", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      json: async () => ({
        results: [],
      }),
      ok: true,
    } as Response);

    const { createUltraChatbotAgentGetWeatherTool } =
      await importGetWeatherModule();

    const tool = createUltraChatbotAgentGetWeatherTool();
    const result = await tool.execute?.(
      {
        city: "Missing City",
      },
      {} as never
    );

    expect(result).toEqual({
      error: 'Could not find coordinates for "Missing City".',
    });
  });
});
