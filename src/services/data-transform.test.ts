import { describe, it, expect } from 'vitest';
import dataTransform from './data-transform.js';
import { DataType, AppType, WeatherData } from '../types/index.js';

describe('DataTransform', () => {
  const mockWeatherData: WeatherData = {
    now: {
      temp: '25',
      icon: '100',
      updateTime: '2024-01-01T12:00:00+08:00',
      humidity: '50',
      pressure: '1013',
      windSpeed: '10',
      windDir: '2',
      windScale: '3',
    },
    forecast: {
      daily: [
        {
          fxDate: '2024-01-01',
          tempMin: '15',
          tempMax: '25',
          iconDay: '100',
          iconNight: '150',
          windDirDay: '2',
          windScaleDay: '3',
          week: '1',
        },
        {
          fxDate: '2024-01-02',
          tempMin: '12',
          tempMax: '18',
          iconDay: '101',
          iconNight: '151',
          windDirDay: '3',
          windScaleDay: '2',
          week: '2',
        },
      ],
      updateTime: '2024-01-01T12:00:00+08:00',
    },
    hourly: {
      hourly: [
        {
          fxTime: '2024-01-01T12:00+08:00',
          temp: '25',
          icon: '100',
          text: '晴',
          wind360: '90',
          windDir: '2',
          windScale: '3',
          windSpeed: '10',
          humidity: '50',
          precip: '0',
          pressure: '1013',
          vis: '10',
          cloud: '10',
          dew: '5',
        },
      ],
      updateTime: '2024-01-01T12:00:00+08:00',
    },
    indices: {
      daily: [
        {
          date: '2024-01-01',
          type: '穿衣',
          name: '穿衣指数',
          category: '舒适',
          text: '建议穿薄型T恤衫',
        },
        {
          date: '2024-01-01',
          type: '感冒',
          name: '感冒指数',
          category: '较易',
          text: '较易感冒',
        },
      ],
      updateTime: '2024-01-01T12:00:00+08:00',
    },
    city: {
      id: '54511',
      name: '北京',
      stationId: '54511',
      longitude: '116.47',
      latitude: '39.80',
      postcode: '100000',
      sunrise: '06:45',
      sunset: '17:30',
    },
    advertisement: {
      cfFlag: '1',
      skFlag: '1',
      zuFlag: '1',
    },
    updateTime: '2024-01-01T12:00:00+08:00',
  };

  describe('toWidgetXml - WeatherTV Main Data', () => {
    it('should generate WeatherTV main XML with correct structure', () => {
      const xml = dataTransform.toWidgetXml(
        mockWeatherData,
        DataType.MAIN_DATA,
        AppType.WEATHER_TV
      );

      expect(xml).toContain('<?xml version="1.0" encoding="utf-8"?>');
      expect(xml).toContain('<CityMeteor CityName="北京">');
      expect(xml).toContain('</CityMeteor>');
    });

    it('should include StationInfo node with correct attributes', () => {
      const xml = dataTransform.toWidgetXml(
        mockWeatherData,
        DataType.MAIN_DATA,
        AppType.WEATHER_TV
      );

      expect(xml).toContain('<StationInfo');
      expect(xml).toContain('Stationid="54511"');
      expect(xml).toContain('Longitude="116.47"');
      expect(xml).toContain('Latitude="39.80"');
      expect(xml).toContain('Postcode="100000"');
      expect(xml).toContain('Sunrise="06:45"');
      expect(xml).toContain('Sunset="17:30"');
    });

    it('should include SK node with Info as child element', () => {
      const xml = dataTransform.toWidgetXml(
        mockWeatherData,
        DataType.MAIN_DATA,
        AppType.WEATHER_TV
      );

      expect(xml).toContain('<SK ReportTime=');
      expect(xml).toContain('<Info');
      expect(xml).toContain('Weather="0"');
      expect(xml).toContain('Temperature="25"');
      expect(xml).toContain('WindDir="2"');
      expect(xml).toContain('WindPower="3"');
      expect(xml).toContain('WindSpeed="10"');
      expect(xml).toContain('Humidity="50"');
      expect(xml).toContain('Pressure="1013"');
      expect(xml).toContain('/>');
      expect(xml).toContain('</SK>');
    });

    it('should include CF node with Period elements', () => {
      const xml = dataTransform.toWidgetXml(
        mockWeatherData,
        DataType.MAIN_DATA,
        AppType.WEATHER_TV
      );

      expect(xml).toContain('<CF ReportTime=');
      expect(xml).toContain('<Period');
      expect(xml).toContain('Timestart="2024-01-01 00:00:00"');
      expect(xml).toContain('Timeend="2024-01-01 23:59:59"');
      expect(xml).toContain('Weather="0"');
      expect(xml).toContain('Tmin="15"');
      expect(xml).toContain('Tmax="25"');
      expect(xml).toMatch(/Week="[1-7]"/);
      expect(xml).toContain('</CF>');
    });

    it('should include ZU node with Period wrapper and Type elements', () => {
      const xml = dataTransform.toWidgetXml(
        mockWeatherData,
        DataType.MAIN_DATA,
        AppType.WEATHER_TV
      );

      expect(xml).toContain('<ZU ReportTime=');
      expect(xml).toContain('<Period Timestart=');
      expect(xml).toContain('<Type Name="CY" Val="1">建议穿薄型T恤衫</Type>');
      expect(xml).toContain('<Type Name="GM" Val="1">较易感冒</Type>');
      expect(xml).toContain('</Period>');
      expect(xml).toContain('</ZU>');
    });

    it('should include CF3h node with Period elements', () => {
      const xml = dataTransform.toWidgetXml(
        mockWeatherData,
        DataType.MAIN_DATA,
        AppType.WEATHER_TV
      );

      expect(xml).toContain('<CF3h ReportTime=');
      expect(xml).toContain('<Period');
      expect(xml).toContain('</CF3h>');
    });

    it('should include AdvFile node with Adv elements', () => {
      const xml = dataTransform.toWidgetXml(
        mockWeatherData,
        DataType.MAIN_DATA,
        AppType.WEATHER_TV
      );

      expect(xml).toContain('<AdvFile>');
      expect(xml).toContain('<Adv Type="CF" Flag="1"');
      expect(xml).toContain('<Adv Type="SK" Flag="1"');
      expect(xml).toContain('<Adv Type="ZU" Flag="1"');
      expect(xml).toContain('</AdvFile>');
    });

    it('should generate XML with reasonable length for complete data', () => {
      const xml = dataTransform.toWidgetXml(
        mockWeatherData,
        DataType.MAIN_DATA,
        AppType.WEATHER_TV
      );

      // XML should contain all required nodes and have reasonable length
      expect(xml.length).toBeGreaterThan(1000);
      expect(xml).toContain('<CityMeteor');
      expect(xml).toContain('<StationInfo');
      expect(xml).toContain('<SK');
      expect(xml).toContain('<CF');
      expect(xml).toContain('<ZU');
      expect(xml).toContain('<CF3h');
      expect(xml).toContain('<AdvFile');
    });
  });

  describe('toWidgetXml - WeatherTV Widget SK', () => {
    it('should generate simplified SK XML', () => {
      const xml = dataTransform.toWidgetXml(
        mockWeatherData,
        DataType.WIDGET_SK,
        AppType.WEATHER_TV
      );

      expect(xml).toContain('<?xml version="1.0" encoding="utf-8"?>');
      expect(xml).toContain('<CityMeteor CityName="北京">');
      expect(xml).toContain('<SK ReportTime=');
      expect(xml).toContain('<Info Weather="0" Temperature="25"');
      expect(xml).toContain('</SK>');
      expect(xml).toContain('</CityMeteor>');
    });

    it('should not include CF, ZU, CF3h, or AdvFile nodes', () => {
      const xml = dataTransform.toWidgetXml(
        mockWeatherData,
        DataType.WIDGET_SK,
        AppType.WEATHER_TV
      );

      expect(xml).not.toContain('<CF');
      expect(xml).not.toContain('<ZU');
      expect(xml).not.toContain('<CF3h');
      expect(xml).not.toContain('<AdvFile');
    });
  });

  describe('toWidgetXml - WeatherTV Widget CF', () => {
    it('should generate simplified CF XML', () => {
      const xml = dataTransform.toWidgetXml(
        mockWeatherData,
        DataType.WIDGET_CF,
        AppType.WEATHER_TV
      );

      expect(xml).toContain('<?xml version="1.0" encoding="utf-8"?>');
      expect(xml).toContain('<CityMeteor CityName="北京">');
      expect(xml).toContain('<CF ReportTime=');
      expect(xml).toContain('<Period');
      expect(xml).toContain('Tmax="25"');
      expect(xml).toContain('Tmin="15"');
      expect(xml).toContain('</CF>');
      expect(xml).toContain('</CityMeteor>');
    });

    it('should not include SK, ZU, CF3h, or AdvFile nodes', () => {
      const xml = dataTransform.toWidgetXml(
        mockWeatherData,
        DataType.WIDGET_CF,
        AppType.WEATHER_TV
      );

      expect(xml).not.toContain('<SK>');
      expect(xml).not.toContain('<ZU');
      expect(xml).not.toContain('<CF3h');
      expect(xml).not.toContain('<AdvFile');
    });
  });

  describe('toWidgetXml - WeatherWidget Current', () => {
    it('should generate WeatherWidget current weather XML', () => {
      const xml = dataTransform.toWidgetXml(
        mockWeatherData,
        DataType.CURRENT_WEATHER_V3,
        AppType.WEATHER_WIDGET
      );

      expect(xml).toContain('<?xml version="1.0" encoding="utf-8"?>');
      expect(xml).toContain('<weather>');
      expect(xml).toContain('<city>北京</city>');
      expect(xml).toContain('<temp>25</temp>');
      expect(xml).toContain('<weather>0</weather>');
      expect(xml).toContain('<reporttime>');
      expect(xml).toContain('</weather>');
    });
  });

  describe('toWidgetXml - WeatherWidget Forecast', () => {
    it('should generate WeatherWidget forecast XML', () => {
      const xml = dataTransform.toWidgetXml(
        mockWeatherData,
        DataType.FORECAST_WEATHER_V3,
        AppType.WEATHER_WIDGET
      );

      expect(xml).toContain('<?xml version="1.0" encoding="utf-8"?>');
      expect(xml).toContain('<weather>');
      expect(xml).toContain('<city>北京</city>');
      expect(xml).toContain('<reporttime>');
      expect(xml).toContain('<startTime1>2024-01-01 00:00:00</startTime1>');
      expect(xml).toContain('<endTime1>2024-01-01 23:59:59</endTime1>');
      expect(xml).toContain('<condition1>0</condition1>');
      expect(xml).toContain('<tempMin1>15</tempMin1>');
      expect(xml).toContain('<tempMax1>25</tempMax1>');
      expect(xml).toContain('</weather>');
    });
  });

  describe('toWidgetXml - Backward Compatibility', () => {
    it('should handle unknown app type with dataType-based routing', () => {
      const xml = dataTransform.toWidgetXml(
        mockWeatherData,
        DataType.CURRENT_WEATHER_V3,
        AppType.UNKNOWN
      );

      expect(xml).toContain('<weather>');
      expect(xml).toContain('<temp>25</temp>');
    });

    it('should handle MAIN_DATA with backward compatibility', () => {
      const xml = dataTransform.toWidgetXml(
        mockWeatherData,
        DataType.MAIN_DATA,
        AppType.UNKNOWN
      );

      expect(xml).toContain('<CityMeteor');
      expect(xml).toContain('<StationInfo');
    });

    it('should return error for invalid dataType', () => {
      const xml = dataTransform.toWidgetXml(
        mockWeatherData,
        'invalid',
        AppType.UNKNOWN
      );

      expect(xml).toBe('<error>Invalid dataType</error>');
    });
  });

  describe('Weather Code Mapping', () => {
    it('should map weather icons to correct codes', () => {
      const testData: WeatherData = {
        now: {
          temp: '25',
          icon: '100',
          updateTime: '2024-01-01T12:00:00+08:00',
        },
        forecast: { daily: [], updateTime: '2024-01-01T12:00:00+08:00' },
        city: { id: '1', name: 'Test' },
      };

      const xml = dataTransform.toWidgetXml(
        testData,
        DataType.WIDGET_SK,
        AppType.WEATHER_TV
      );
      expect(xml).toContain('Weather="0"');
    });

    it('should map cloudy weather to code 1', () => {
      const testData: WeatherData = {
        now: {
          temp: '20',
          icon: '101',
          updateTime: '2024-01-01T12:00:00+08:00',
        },
        forecast: { daily: [], updateTime: '2024-01-01T12:00:00+08:00' },
        city: { id: '1', name: 'Test' },
      };

      const xml = dataTransform.toWidgetXml(
        testData,
        DataType.WIDGET_SK,
        AppType.WEATHER_TV
      );
      expect(xml).toContain('Weather="1"');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing optional fields gracefully', () => {
      const minimalData: WeatherData = {
        now: {
          temp: '20',
          icon: '100',
          updateTime: '2024-01-01T12:00:00+08:00',
        },
        forecast: { daily: [], updateTime: '2024-01-01T12:00:00+08:00' },
        city: { id: '1', name: 'Test' },
      };

      const xml = dataTransform.toWidgetXml(
        minimalData,
        DataType.MAIN_DATA,
        AppType.WEATHER_TV
      );

      expect(xml).toContain('<CityMeteor');
      expect(xml).toContain('<SK');
      expect(xml).toContain('<Info');
    });

    it('should handle empty forecast data', () => {
      const noForecastData: WeatherData = {
        now: {
          temp: '20',
          icon: '100',
          updateTime: '2024-01-01T12:00:00+08:00',
        },
        forecast: { daily: [], updateTime: '2024-01-01T12:00:00+08:00' },
        city: { id: '1', name: 'Test' },
      };

      const xml = dataTransform.toWidgetXml(
        noForecastData,
        DataType.MAIN_DATA,
        AppType.WEATHER_TV
      );

      expect(xml).toContain('<CF ReportTime=');
      expect(xml).toContain('</CF>');
    });

    it('should handle missing city data', () => {
      const noCityData: WeatherData = {
        now: {
          temp: '20',
          icon: '100',
          updateTime: '2024-01-01T12:00:00+08:00',
        },
        forecast: { daily: [], updateTime: '2024-01-01T12:00:00+08:00' },
      };

      const xml = dataTransform.toWidgetXml(
        noCityData,
        DataType.WIDGET_SK,
        AppType.WEATHER_TV
      );

      expect(xml).toContain('CityName="Unknown"');
    });
  });
});
