import { describe, it, expect } from 'vitest';
import { DataType, AppType } from './index.js';

describe('DataType Enum', () => {
  it('should have correct WeatherWidget types', () => {
    expect(DataType.CURRENT_WEATHER_V3).toBe('ztev3widgetskall');
    expect(DataType.FORECAST_WEATHER_V3).toBe('ztev3widgetcfall');
  });

  it('should have correct WeatherTV Widget types', () => {
    expect(DataType.WIDGET_SK).toBe('ztewidgetsk');
    expect(DataType.WIDGET_CF).toBe('ztewidgetcf');
  });

  it('should have correct WeatherTV main type', () => {
    expect(DataType.MAIN_DATA).toBe('zte');
  });

  it('should have correct city list type', () => {
    expect(DataType.CITY_LIST).toBe('allcity');
  });

  it('should have all required data types', () => {
    const dataTypes = Object.values(DataType);
    expect(dataTypes).toContain('ztev3widgetskall');
    expect(dataTypes).toContain('ztev3widgetcfall');
    expect(dataTypes).toContain('ztewidgetsk');
    expect(dataTypes).toContain('ztewidgetcf');
    expect(dataTypes).toContain('zte');
    expect(dataTypes).toContain('allcity');
    expect(dataTypes).toHaveLength(6);
  });
});

describe('AppType Enum', () => {
  it('should have correct app types', () => {
    expect(AppType.WEATHER_WIDGET).toBe('weatherwidget');
    expect(AppType.WEATHER_TV).toBe('weathertv');
    expect(AppType.UNKNOWN).toBe('unknown');
  });

  it('should have all required app types', () => {
    const appTypes = Object.values(AppType);
    expect(appTypes).toContain('weatherwidget');
    expect(appTypes).toContain('weathertv');
    expect(appTypes).toContain('unknown');
    expect(appTypes).toHaveLength(3);
  });
});
